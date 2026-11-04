import layoutData from '@/data/mushaf-layout.json';

import { getSurah } from './quran';

// Medine mushafı (15 satır, 604 sayfa) sayfa düzeni.
// Veri: scripts/build-mushaf-layout.mjs ile üretilir (kaynak: quran-qcf4 paketinin MIT lisanslı JSON'u).

export type Segment = [surah: number, ayah: number, from: number, to: number, ends: 0 | 1];
export type Line = { h: number } | { b: 1 } | { w: Segment[] };
export type PageLayout = { l: Line[]; c?: 1 };

type LayoutFile = {
  pages: PageLayout[];
  wc: Record<string, number>;
  ap: Record<string, number[]>;
  sajda: string[];
  names: string[];
};

const layout = layoutData as unknown as LayoutFile;

export const TOTAL_PAGES = 604;

export function pageLayout(page: number): PageLayout {
  return layout.pages[Math.min(TOTAL_PAGES, Math.max(1, page)) - 1];
}

export function surahArabicName(n: number) {
  return layout.names[n - 1] ?? '';
}

/** Ayetin başladığı sayfa */
export function pageOf(surah: number, ayah = 1) {
  return layout.ap[String(surah)]?.[ayah - 1] ?? 1;
}

/** Sayfadaki sureler (metinlerini yüklemek için) */
export function surahsOnPage(page: number) {
  const set = new Set<number>();
  for (const ln of pageLayout(page).l) {
    if ('w' in ln) for (const seg of ln.w) set.add(seg[0]);
    if ('h' in ln) set.add(ln.h);
  }
  return [...set];
}

/** Sayfadaki ilk ayet */
export function firstAyahOnPage(page: number): { surah: number; ayah: number } | null {
  for (const ln of pageLayout(page).l) {
    if ('w' in ln && ln.w.length) return { surah: ln.w[0][0], ayah: ln.w[0][1] };
  }
  return null;
}

// Cüzlerin başladığı sayfalar (Medine mushafı)
const JUZ_START = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482,
  502, 522, 542, 562, 582,
];

export function juzOf(page: number) {
  let j = 1;
  for (let i = 0; i < JUZ_START.length; i++) if (page >= JUZ_START[i]) j = i + 1;
  return j;
}

export function juzStartPage(juz: number) {
  return JUZ_START[Math.min(30, Math.max(1, juz)) - 1];
}

// ---- Ayet metnini sayfa düzenindeki kelimelere bölme ----

// Durak işaretleri (ۖ ۗ ۚ ۛ ۘ ۙ ۜ) ve secde işareti (۩) önceki kelimeye eklenir;
// hizb işareti (۞) mushafta kenarda durduğu için metinden çıkarılır.
const MARK = /^[ۖ-ۜ۞۩]+$/;

const wordCache = new Map<string, string[]>();

export function splitAyah(surah: number, ayah: number, text: string): string[] {
  const key = `${surah}:${ayah}`;
  const cached = wordCache.get(key);
  if (cached) return cached;

  const out: string[] = [];
  for (const t of text.replace(/﻿/g, '').trim().split(/\s+/)) {
    if (!t) continue;
    if (MARK.test(t)) {
      if (t === '۞') continue;
      if (out.length) out[out.length - 1] += ` ${t}`;
      else out.push(t);
    } else out.push(t);
  }

  const expected = layout.wc[key] ?? out.length;
  // Düzen verisi "بعد ما"yı iki kelime sayar, metin tek kelime yazar: ikinci yuvayı boş bırak.
  if (out.length < expected) {
    for (let i = 0; i < out.length && out.length < expected; i++) {
      if (out[i].replace(/[ً-ْٰۡ]/g, '').startsWith('بعدما')) out.splice(i + 1, 0, '');
    }
  }
  while (out.length < expected) out.push('');
  while (out.length > expected && out.length > 1) {
    const last = out.pop()!;
    out[out.length - 1] += ` ${last}`;
  }
  wordCache.set(key, out);
  return out;
}

export type PageText = {
  words: (surah: number, ayah: number) => string[];
  meal: (surah: number, ayah: number) => string;
};

/** Sayfadaki surelerin metnini yükler (önbellekten veya internetten). */
export async function loadPageText(page: number): Promise<PageText> {
  const list = surahsOnPage(page);
  const surahs = await Promise.all(list.map((n) => getSurah(n)));
  const byNo = new Map(surahs.map((s) => [s.number, s]));
  return {
    words: (s, a) => {
      const ay = byNo.get(s)?.ayahs[a - 1];
      return ay ? splitAyah(s, a, ay.ar) : [];
    },
    meal: (s, a) => byNo.get(s)?.ayahs[a - 1]?.tr ?? '',
  };
}

// Arapça-Hint rakamları (ayet numarası işareti için)
export function arabicDigits(n: number) {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

// ---- Temalar ----

export type MushafTheme = {
  id: 'krem' | 'sepya' | 'gece';
  nameKey: 'mushaf.themeClassic' | 'mushaf.themeSepia' | 'mushaf.themeNight';
  bg: string;
  page: string;
  text: string;
  frame: string;
  frameInner: string;
  header: string;
  headerText: string;
  marker: string;
  hlBg: string;
  hlText: string;
  dim: string;
};

export const MUSHAF_THEMES: MushafTheme[] = [
  {
    id: 'krem',
    nameKey: 'mushaf.themeClassic',
    bg: '#E9DFC8',
    page: '#FBF5E6',
    text: '#1E1A12',
    frame: '#B88A3E',
    frameInner: '#2F7A5B',
    header: '#EFE3C4',
    headerText: '#5A3E12',
    marker: '#B07A22',
    hlBg: 'rgba(46, 160, 100, 0.20)',
    hlText: '#0B7A45',
    dim: '#7A6A4C',
  },
  {
    id: 'sepya',
    nameKey: 'mushaf.themeSepia',
    bg: '#D9C49C',
    page: '#F0DFBC',
    text: '#33240F',
    frame: '#8E5F25',
    frameInner: '#6E4A1C',
    header: '#E6CF9F',
    headerText: '#4E3511',
    marker: '#8E5F25',
    hlBg: 'rgba(46, 140, 90, 0.24)',
    hlText: '#0E6A3C',
    dim: '#6E5A3A',
  },
  {
    id: 'gece',
    nameKey: 'mushaf.themeNight',
    bg: '#072A21',
    page: '#0D3A2D',
    text: '#EFE8D6',
    frame: '#C9A24E',
    frameInner: '#3DDC97',
    header: '#124A3A',
    headerText: '#E2B85C',
    marker: '#E2B85C',
    hlBg: 'rgba(61, 220, 151, 0.18)',
    hlText: '#62F2B1',
    dim: '#A9C4B8',
  },
];
