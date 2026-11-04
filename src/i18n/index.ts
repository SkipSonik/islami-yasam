import { getLocales } from 'expo-localization';

import { ar } from './locales/ar';
import { de } from './locales/de';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { id } from './locales/id';
import { ja } from './locales/ja';
import { ru } from './locales/ru';
import { tr, type Locale, type StringKey } from './locales/tr';
import { ur } from './locales/ur';

export type Lang = 'tr' | 'en' | 'ar' | 'de' | 'fr' | 'ru' | 'id' | 'ur' | 'ja';

/** Dil seçme listesi: her dil kendi adıyla gösterilir. */
export const LANGUAGES: { code: Lang; name: string; rtl?: boolean }[] = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية', rtl: true },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'ru', name: 'Русский' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ur', name: 'اردو', rtl: true },
  { code: 'ja', name: '日本語' },
];

const LOCALES: Record<Lang, Locale> = { tr, en, ar, de, fr, ru, id, ur, ja };

/** Her dil için Kur'an meali (alquran.cloud baskı kimliği) ve gösterilecek kaynak adı */
export const MEAL_EDITIONS: Record<Lang, { id: string; source: string }> = {
  tr: { id: 'tr.diyanet', source: 'Diyanet İşleri Başkanlığı' },
  en: { id: 'en.sahih', source: 'Saheeh International' },
  ar: { id: 'ar.muyassar', source: 'التفسير الميسر' },
  de: { id: 'de.bubenheim', source: 'A. S. F. Bubenheim & N. Elyas' },
  fr: { id: 'fr.hamidullah', source: 'Muhammad Hamidullah' },
  ru: { id: 'ru.kuliev', source: 'Эльмир Кулиев' },
  id: { id: 'id.indonesian', source: 'Kementerian Agama RI' },
  ur: { id: 'ur.jalandhry', source: 'فتح محمد جالندھری' },
  ja: { id: 'ja.japanese', source: '日本語訳' },
};

export function isRtl(lang: Lang) {
  return lang === 'ar' || lang === 'ur';
}

/** Cihaz dili destekleniyorsa onu, değilse İngilizceyi döndürür. */
export function deviceLang(): Lang {
  try {
    for (const l of getLocales()) {
      const code = l.languageCode?.toLowerCase();
      if (code && code in LOCALES) return code as Lang;
    }
  } catch {
    // yok say
  }
  return 'en';
}

// Bileşen dışı kodlar (bildirimler, arka plan görevi) için o anki dil.
let current: Lang = 'tr';
export function setCurrentLang(l: Lang) {
  current = l;
}
export function currentLang() {
  return current;
}

export function locale(lang: Lang = current): Locale {
  return LOCALES[lang] ?? en;
}

export type Params = Record<string, string | number>;

export function translate(lang: Lang, key: StringKey, params?: Params): string {
  let s = LOCALES[lang]?.strings[key] ?? en.strings[key] ?? tr.strings[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Bileşen dışı kullanım: o anki dilde çeviri */
export function t(key: StringKey, params?: Params) {
  return translate(current, key, params);
}

export type { StringKey };

// ---- Tarih biçimleri ----

export function formatDateLong(d: Date, lang: Lang = current) {
  const c = locale(lang).cal;
  return fill(c.dateLong, d, c);
}

export function formatDateShort(d: Date, lang: Lang = current) {
  const c = locale(lang).cal;
  return fill(c.dateShort, d, c);
}

function fill(pattern: string, d: Date, c: Locale['cal']) {
  const m = c.months[d.getMonth()];
  return pattern
    .replace('{d}', String(d.getDate()))
    .replace('{m3}', m.slice(0, 3))
    .replace('{mm}', String(d.getMonth() + 1))
    .replace('{m}', m)
    .replace('{y}', String(d.getFullYear()))
    .replace('{w}', c.days[d.getDay()]);
}

export function weekdayShort(d: Date, lang: Lang = current) {
  return locale(lang).cal.daysShort[d.getDay()];
}

export function hijriMonthName(month: number, lang: Lang = current) {
  return locale(lang).cal.hijri[month - 1] ?? '';
}

export function directionName(bearing: number, lang: Lang = current) {
  return locale(lang).cal.directions[Math.round(bearing / 45) % 8];
}
