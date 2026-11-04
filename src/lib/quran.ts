import { Directory, File, Paths } from 'expo-file-system';

import { currentLang, MEAL_EDITIONS } from '@/i18n';

// Kaynak: api.alquran.cloud — Osmanlı hattıyla Arapça metin (Tanzil) + seçili dilin meali.
const API = 'https://api.alquran.cloud/v1';
const mealEdition = () => MEAL_EDITIONS[currentLang()]?.id ?? 'tr.diyanet';

export type Ayah = { n: number; ar: string; tr: string };
export type Surah = { number: number; ayahs: Ayah[] };

// Bellekte de tut: mushaf sayfaları aynı sureyi tekrar tekrar ister.
const memory = new Map<string, Surah>();
const inflight = new Map<string, Promise<Surah>>();

function fileFor(n: number, edition: string): File | null {
  try {
    const d = new Directory(Paths.document, 'kuran');
    if (!d.exists) d.create({ intermediates: true, idempotent: true });
    // Diyanet meali önceki sürümlerdeki dosya adını korur (eski önbellek boşa gitmesin)
    return new File(d, edition === 'tr.diyanet' ? `sure-${n}.json` : `sure-${n}-${edition}.json`);
  } catch {
    return null; // dosya sistemi yoksa (ör. web) önbelleksiz çalış
  }
}

export function isSurahCached(n: number) {
  const ed = mealEdition();
  if (memory.has(`${n}:${ed}`)) return true;
  try {
    return fileFor(n, ed)?.exists ?? false;
  } catch {
    return false;
  }
}

// Önce bellekteki/telefondaki kopyaya bakar, yoksa indirir ve kaydeder.
export function getSurah(n: number): Promise<Surah> {
  const ed = mealEdition();
  const key = `${n}:${ed}`;
  const m = memory.get(key);
  if (m) return Promise.resolve(m);
  let p = inflight.get(key);
  if (!p) {
    p = loadSurah(n, ed, key).finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  return p;
}

async function loadSurah(n: number, edition: string, key: string): Promise<Surah> {
  const f = fileFor(n, edition);
  if (f?.exists) {
    try {
      const s = clean(JSON.parse(await f.text()) as Surah);
      memory.set(key, s);
      return s;
    } catch {
      try {
        f.delete();
      } catch {
        // yok say
      }
    }
  }
  const res = await fetch(`${API}/surah/${n}/editions/quran-uthmani,${edition}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const [arEd, trEd] = json.data as { ayahs: { numberInSurah: number; text: string }[] }[];

  const surah = clean({
    number: n,
    ayahs: arEd.ayahs.map((a, i) => ({ n: a.numberInSurah, ar: a.text, tr: trEd.ayahs[i]?.text ?? '' })),
  });
  memory.set(key, surah);
  if (f) {
    try {
      if (f.exists) f.delete();
      f.create();
      await f.write(JSON.stringify(surah));
    } catch {
      // kaydedemezsek yine de göster
    }
  }
  return surah;
}

// Metni düzeltir: görünmez BOM karakteri ve (Fatiha/Tevbe dışında) ilk ayetin
// başındaki besmele çıkarılır; besmele ayrı başlık olarak gösteriliyor.
// Eski sürümün önbelleğe aldığı dosyalar da okunurken düzelir.
function clean(s: Surah): Surah {
  const ayahs = s.ayahs.map((a, i) => {
    let ar = a.ar.replace(/﻿/g, '').trim();
    if (i === 0 && s.number !== 1 && s.number !== 9) ar = stripBasmala(ar);
    return { ...a, ar };
  });
  return { ...s, ayahs };
}

function stripBasmala(text: string) {
  const words = text.split(/\s+/);
  // "بِسْمِ" bazı surelerde şeddeli yazılır ("بِّسْمِ"), bu yüzden kökten bak.
  if (words.length > 4 && /^بِ?ّ?ِ?سْمِ$/.test(words[0]) && words[1] === 'ٱللَّهِ') {
    return words.slice(4).join(' ');
  }
  return text;
}

export const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

// Tek bir ayet (günün ayeti için), önbellekli.
export async function getAyah(surah: number, ayah: number): Promise<Ayah & { surah: number }> {
  const s = await getSurah(surah);
  const a = s.ayahs.find((x) => x.n === ayah) ?? s.ayahs[0];
  return { ...a, surah };
}
