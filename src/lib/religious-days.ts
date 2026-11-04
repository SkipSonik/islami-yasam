import type { StringKey } from '@/i18n';
import { addDays, startOfDay } from '@/lib/dates';
import { fromHijri, toHijri } from '@/lib/hijri';

// Dini günler hicri takvimden hesaplanır. Kandiller, Diyanet takviminde olduğu gibi
// gecesi kandil olan günün tarihiyle gösterilir (ör. 27 Recep gecesi → 26 Recep akşamı).

export type RelDayKey =
  | 'hijriNewYear'
  | 'ashura'
  | 'mawlid'
  | 'threeMonths'
  | 'raghaib'
  | 'miraj'
  | 'barat'
  | 'ramadan'
  | 'qadr'
  | 'eidFitrEve'
  | 'eidFitr'
  | 'eidAdhaEve'
  | 'eidAdha';

export type RelDay = {
  key: RelDayKey;
  date: Date;
  /** Bayram gibi birden fazla gün sürenler */
  days: number;
  /** Kandil: o günün akşamı başlar */
  night: boolean;
  kind: 'kandil' | 'bayram' | 'gun';
};

function yearDays(hy: number, offset: number): RelDay[] {
  const h = (m: number, d: number) => fromHijri(hy, m, d, offset);
  const recep1 = h(7, 1);
  // Regaib: Recep ayının ilk cuma gecesi (ilk perşembe akşamı)
  const raghaib = addDays(recep1, (4 - recep1.getDay() + 7) % 7);
  return [
    { key: 'hijriNewYear', date: h(1, 1), days: 1, night: false, kind: 'gun' },
    { key: 'ashura', date: h(1, 10), days: 1, night: false, kind: 'gun' },
    { key: 'mawlid', date: addDays(h(3, 12), -1), days: 1, night: true, kind: 'kandil' },
    { key: 'threeMonths', date: recep1, days: 1, night: false, kind: 'gun' },
    { key: 'raghaib', date: raghaib, days: 1, night: true, kind: 'kandil' },
    { key: 'miraj', date: addDays(h(7, 27), -1), days: 1, night: true, kind: 'kandil' },
    { key: 'barat', date: addDays(h(8, 15), -1), days: 1, night: true, kind: 'kandil' },
    { key: 'ramadan', date: h(9, 1), days: 1, night: false, kind: 'gun' },
    { key: 'qadr', date: addDays(h(9, 27), -1), days: 1, night: true, kind: 'kandil' },
    { key: 'eidFitrEve', date: addDays(h(10, 1), -1), days: 1, night: false, kind: 'gun' },
    { key: 'eidFitr', date: h(10, 1), days: 3, night: false, kind: 'bayram' },
    { key: 'eidAdhaEve', date: h(12, 9), days: 1, night: false, kind: 'gun' },
    { key: 'eidAdha', date: h(12, 10), days: 4, night: false, kind: 'bayram' },
  ];
}

/** Bugünden itibaren (devam eden bayram dahil) yaklaşık bir yıllık dini günler. */
export function upcomingReligiousDays(from: Date, offset = 0, months = 13): RelDay[] {
  const today = startOfDay(from);
  const end = addDays(today, Math.round(months * 30.5));
  const hy = toHijri(today, offset).year;
  return [hy - 1, hy, hy + 1, hy + 2]
    .flatMap((y) => yearDays(y, offset))
    .filter((d) => addDays(d.date, d.days - 1) >= today && d.date <= end)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function daysUntil(date: Date, from: Date) {
  return Math.round((startOfDay(date).getTime() - startOfDay(from).getTime()) / 86400000);
}

/** İçinde bulunulan ya da sıradaki Ramazan ayının günleri. */
export function ramadanDays(from: Date, offset = 0): Date[] {
  const today = startOfDay(from);
  const h = toHijri(today, offset);
  const hy = h.month > 9 ? h.year + 1 : h.year;
  let start = fromHijri(hy, 9, 1, offset);
  let endD = fromHijri(hy, 10, 1, offset);
  if (endD <= today) {
    start = fromHijri(hy + 1, 9, 1, offset);
    endD = fromHijri(hy + 1, 10, 1, offset);
  }
  const out: Date[] = [];
  for (let d = start; d < endD; d = addDays(d, 1)) out.push(d);
  return out;
}

type T = (key: StringKey, params?: Record<string, string | number>) => string;

export function whenLabel(d: RelDay, now: Date, t: T) {
  const n = daysUntil(d.date, now);
  if (n < 0) return t('rd.ongoing');
  if (n === 0) return t('rd.today');
  if (n === 1) return t('rd.tomorrow');
  return t('rd.inDays', { n });
}
