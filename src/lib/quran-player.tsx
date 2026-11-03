import {
  createAudioPlaylist,
  setAudioModeAsync,
  useAudioPlaylistStatus,
  type AudioPlaylist,
} from 'expo-audio';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { SURAHS } from '@/data/surahs';
import { loadValue, saveJSON } from './storage';

// Ayet ayet ses kayıtları: cdn.islamic.network (alquran.cloud).
// Dosya adı Kur'an genelindeki ayet sırasıdır (1..6236).
export const RECITERS = [
  { id: 'ar.alafasy', name: 'Mişari Raşid el-Afasi', bitrate: 128 },
  { id: 'ar.abdulbasitmurattal', name: 'Abdülbasit Abdüssamed', bitrate: 192 },
  { id: 'ar.husary', name: 'Mahmud Halil el-Husari', bitrate: 128 },
  { id: 'ar.minshawi', name: 'Muhammed Sıddık el-Minşavi', bitrate: 128 },
  { id: 'ar.abdurrahmaansudais', name: 'Abdurrahman es-Sudeys', bitrate: 192 },
  { id: 'ar.mahermuaiqly', name: 'Mahir el-Muaykılî', bitrate: 128 },
] as const;

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

type Ctx = {
  surah: number | null;
  /** Çalan ayet numarası; 0 = başlangıçtaki besmele, null = çalmıyor */
  ayah: number | null;
  playing: boolean;
  buffering: boolean;
  reciter: ReciterId;
  setReciter: (r: ReciterId) => void;
  playSurah: (surah: number, fromAyah?: number) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  stop: () => void;
};

const PlayerCtx = createContext<Ctx | null>(null);

export function QuranPlayerProvider({ children }: { children: ReactNode }) {
  const playlistRef = useRef<AudioPlaylist | null>(null);
  if (!playlistRef.current) playlistRef.current = createAudioPlaylist({ updateInterval: 300 });
  const playlist = playlistRef.current;
  const status = useAudioPlaylistStatus(playlist);

  const [surah, setSurah] = useState<number | null>(null);
  const [offset, setOffset] = useState(0); // başa besmele eklendiyse 1
  const [reciter, setReciterState] = useState<ReciterId>('ar.alafasy');

  useEffect(() => {
    loadValue<ReciterId>('kari-v1', 'ar.alafasy').then((r) =>
      setReciterState(RECITERS.some((x) => x.id === r) ? r : 'ar.alafasy'),
    );
    return () => playlist.destroy();
  }, [playlist]);

  const playSurah = useCallback(
    async (n: number, fromAyah = 1, rec: ReciterId = reciter) => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });
      } catch {
        // ses modu ayarlanamasa da çalmayı dene
      }
      const meta = SURAHS[n - 1];
      const withBasmala = n !== 1 && n !== 9;
      playlist.pause();
      playlist.clear();
      if (withBasmala) playlist.add({ uri: ayahUrl(rec, 1), name: 'Besmele' });
      for (let i = 1; i <= meta.ayahs; i++) {
        playlist.add({ uri: ayahUrl(rec, FIRST_GLOBAL[n - 1] + i), name: `${meta.name} ${i}` });
      }
      const off = withBasmala ? 1 : 0;
      setOffset(off);
      setSurah(n);
      // Ortadan başlatılırsa besmeleyi atla
      playlist.skipTo(fromAyah > 1 ? fromAyah - 1 + off : 0);
      playlist.play();
      try {
        playlist.setActiveForLockScreen(true, {
          title: `${meta.name} Suresi`,
          artist: RECITERS.find((r) => r.id === rec)?.name,
          albumTitle: 'İslami Yaşam',
        });
      } catch {
        // kilit ekranı kontrolleri desteklenmiyorsa sorun değil
      }
    },
    [playlist, reciter],
  );

  const stop = useCallback(() => {
    playlist.pause();
    playlist.clear();
    try {
      playlist.clearLockScreenControls();
    } catch {
      // yok say
    }
    setSurah(null);
  }, [playlist]);

  const ayah = surah == null || status.trackCount === 0 ? null : status.currentIndex - offset + 1;

  const setReciter = useCallback(
    (r: ReciterId) => {
      setReciterState(r);
      saveJSON('kari-v1', r);
      // Çalarken kâri değişirse aynı ayetten yeni sesle devam et
      if (surah != null && ayah != null) playSurah(surah, Math.max(1, ayah), r);
    },
    [surah, ayah, playSurah],
  );

  // Son ayet bittiğinde çalar kendiliğinden kapansın.
  const finished =
    surah != null && status.didJustFinish && status.currentIndex >= status.trackCount - 1 && !status.playing;
  useEffect(() => {
    if (finished) stop();
  }, [finished, stop]);

  const value = useMemo<Ctx>(
    () => ({
      surah,
      ayah,
      playing: status.playing,
      buffering: status.isBuffering,
      reciter,
      setReciter,
      playSurah: (n, from) => playSurah(n, from),
      toggle: () => (status.playing ? playlist.pause() : playlist.play()),
      next: () => playlist.next(),
      previous: () => playlist.previous(),
      stop,
    }),
    [surah, ayah, status.playing, status.isBuffering, reciter, setReciter, playSurah, playlist, stop],
  );

  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}

export function useQuranPlayer() {
  const c = useContext(PlayerCtx);
  if (!c) throw new Error('QuranPlayerProvider eksik');
  return c;
}
