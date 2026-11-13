import { createAudioPlayer, setAudioModeAsync, useAudioPlayerStatus, type AudioPlayer } from 'expo-audio';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { surahName, SURAHS } from '@/data/surahs';
import { currentLang, t } from '@/i18n';
import { loadValue, saveJSON } from './storage';

// Ayet ayet ses kayıtları: cdn.islamic.network (alquran.cloud).
// Dosya adı Kur'an genelindeki ayet sırasıdır (1..6236).
export const RECITERS = [
  { id: 'ar.alafasy', bitrate: 128, tr: 'Mişari Raşid el-Afasi', latin: 'Mishary Rashid Alafasy', ar: 'مشاري راشد العفاسي' },
  { id: 'ar.abdulbasitmurattal', bitrate: 192, tr: 'Abdülbasit Abdüssamed', latin: 'Abdul Basit Abdus Samad', ar: 'عبد الباسط عبد الصمد' },
  { id: 'ar.husary', bitrate: 128, tr: 'Mahmud Halil el-Husari', latin: 'Mahmoud Khalil Al-Husary', ar: 'محمود خليل الحصري' },
  { id: 'ar.minshawi', bitrate: 128, tr: 'Muhammed Sıddık el-Minşavi', latin: 'Mohamed Siddiq Al-Minshawi', ar: 'محمد صديق المنشاوي' },
  { id: 'ar.abdurrahmaansudais', bitrate: 192, tr: 'Abdurrahman es-Sudeys', latin: 'Abdul Rahman Al-Sudais', ar: 'عبد الرحمن السديس' },
  { id: 'ar.mahermuaiqly', bitrate: 128, tr: 'Mahir el-Muaykılî', latin: 'Maher Al-Muaiqly', ar: 'ماهر المعيقلي' },
] as const;

export function reciterName(id: string, lang: string) {
  const r = RECITERS.find((x) => x.id === id) ?? RECITERS[0];
  return lang === 'tr' ? r.tr : lang === 'ar' || lang === 'ur' ? r.ar : r.latin;
}

export type ReciterId = (typeof RECITERS)[number]['id'];

// Her surenin ilk ayetinin Kur'an genelindeki sırası (0 tabanlı).
const FIRST_GLOBAL: number[] = [];
SURAHS.reduce((acc, s) => {
  FIRST_GLOBAL.push(acc);
  return acc + s.ayahs;
}, 0);

function ayahUrl(reciter: ReciterId, global: number) {
  const r = RECITERS.find((x) => x.id === reciter) ?? RECITERS[0];
  return `https://cdn.islamic.network/quran/audio/${r.bitrate}/${r.id}/${global}.mp3`;
}

// Çalma sırası: [besmele?, 1. ayet, 2. ayet, ...]. index -> ayet numarası.
type Queue = { surah: number; reciter: ReciterId; withBasmala: boolean; index: number; continuous: boolean };

function queueAyah(q: Queue) {
  return q.withBasmala ? q.index : q.index + 1; // 0 = besmele
}
function queueLength(q: Queue) {
  return SURAHS[q.surah - 1].ayahs + (q.withBasmala ? 1 : 0);
}
function queueUrl(q: Queue) {
  const ayah = queueAyah(q);
  return ayahUrl(q.reciter, ayah === 0 ? 1 : FIRST_GLOBAL[q.surah - 1] + ayah);
}

type Ctx = {
  surah: number | null;
  /** Çalan ayet numarası; 0 = başlangıçtaki besmele, null = çalmıyor */
  ayah: number | null;
  playing: boolean;
  buffering: boolean;
  reciter: ReciterId;
  setReciter: (r: ReciterId) => void;
  /** continuous: sure bitince sonraki sureye geç (mushaf okuması) */
  playSurah: (surah: number, fromAyah?: number, continuous?: boolean) => void;
  continuous: boolean;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  stop: () => void;
};

const PlayerCtx = createContext<Ctx | null>(null);

export function QuranPlayerProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<AudioPlayer | null>(null);
  if (!playerRef.current) playerRef.current = createAudioPlayer(null, { updateInterval: 250 });
  const player = playerRef.current;
  const status = useAudioPlayerStatus(player);

  const queueRef = useRef<Queue | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [reciter, setReciterState] = useState<ReciterId>('ar.alafasy');

  useEffect(() => {
    loadValue<ReciterId>('kari-v1', 'ar.alafasy').then((r) =>
      setReciterState(RECITERS.some((x) => x.id === r) ? r : 'ar.alafasy'),
    );
    return () => player.remove();
  }, [player]);

  // Sıradaki öğeyi yükleyip çalar.
  const load = useCallback(
    (q: Queue) => {
      queueRef.current = q;
      setQueue(q);
      player.replace({ uri: queueUrl(q) });
      player.volume = 1;
      player.muted = false;
      player.play();
    },
    [player],
  );

  const stop = useCallback(() => {
    queueRef.current = null;
    setQueue(null);
    player.pause();
    try {
      player.clearLockScreenControls();
    } catch {
      // yok say
    }
  }, [player]);

  const lockScreen = useCallback(
    (n: number, rec: ReciterId) => {
      try {
        player.setActiveForLockScreen(true, {
          title: t('quran.surahTitle', { name: surahName(n, currentLang()) }),
          artist: reciterName(rec, currentLang()),
          albumTitle: 'Namaz Yolu',
        });
      } catch {
        // kilit ekranı kontrolleri desteklenmiyorsa sorun değil
      }
    },
    [player],
  );

  const step = useCallback(
    (delta: number) => {
      const q = queueRef.current;
      if (!q) return;
      const index = q.index + delta;
      if (index < 0) return load({ ...q, index: 0 });
      if (index >= queueLength(q)) {
        if (q.continuous && q.surah < 114) {
          const next = q.surah + 1;
          lockScreen(next, q.reciter);
          return load({ ...q, surah: next, withBasmala: next !== 9, index: 0 });
        }
        return stop();
      }
      load({ ...q, index });
    },
    [load, stop, lockScreen],
  );

  // Bir ayet bitince sıradakine geç. Dinleyici doğrudan oyuncuya bağlı,
  // böylece uygulama arka plandayken de çalışır.
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish && queueRef.current) step(1);
    });
    return () => sub.remove();
  }, [player, step]);

  const playSurah = useCallback(
    async (n: number, fromAyah = 1, rec: ReciterId = reciter, continuous = false) => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });
      } catch {
        // ses modu ayarlanamasa da çalmayı dene
      }
      const withBasmala = n !== 1 && n !== 9;
      // Ortadan başlatılırsa besmeleyi atla
      const index = fromAyah > 1 ? fromAyah - 1 + (withBasmala ? 1 : 0) : 0;
      load({ surah: n, reciter: rec, withBasmala, index, continuous });
      lockScreen(n, rec);
    },
    [reciter, load, lockScreen],
  );

  const surah = queue?.surah ?? null;
  const ayah = queue ? queueAyah(queue) : null;

  const setReciter = useCallback(
    (r: ReciterId) => {
      setReciterState(r);
      saveJSON('kari-v1', r);
      // Çalarken kâri değişirse aynı ayetten yeni sesle devam et
      if (surah != null && ayah != null) playSurah(surah, Math.max(1, ayah), r, queueRef.current?.continuous);
    },
    [surah, ayah, playSurah],
  );

  const value = useMemo<Ctx>(
    () => ({
      surah,
      ayah,
      playing: status.playing,
      buffering: status.isBuffering,
      reciter,
      setReciter,
      playSurah: (n, from, cont) => playSurah(n, from, undefined, cont),
      continuous: queue?.continuous ?? false,
      toggle: () => (status.playing ? player.pause() : player.play()),
      next: () => step(1),
      previous: () => step(-1),
      stop,
    }),
    [surah, ayah, queue?.continuous, status.playing, status.isBuffering, reciter, setReciter, playSurah, player, step, stop],
  );

  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}

export function useQuranPlayer() {
  const c = useContext(PlayerCtx);
  if (!c) throw new Error('QuranPlayerProvider eksik');
  return c;
}
