import table from '@/data/hijri-months.json';
import { hijriMonthName, type Lang } from '@/i18n';

// Hicri tarih. 1440–1500 yılları için ay başları, Diyanet'in uyguladığı 2016 İstanbul
// kongresi ölçütüyle astronomik olarak hesaplanmış tablodan gelir
// (scripts/build-hijri-table.mjs). Tablo dışı yıllarda tablo usulü hesaba düşülür.
// Ayarlardaki gün düzeltmesi her ikisine de uygulanır.

export const HIJRI_MONTHS = [
  'Muharrem',
  'Safer',
  'Rebiülevvel',
  'Rebiülahir',
  'Cemaziyelevvel',
  'Cemaziyelahir',
  'Recep',
  'Şaban',
  'Ramazan',
  'Şevval',
  'Zilkade',
  'Zilhicce',
];

const EPOCH = 1948438.5; // 16 Temmuz 622 (astronomik)

function gregorianToJd(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045 -
    0.5
  );
}

function hijriToJd(y: number, m: number, d: number) {
  return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + EPOCH - 1;
}

export type HijriDate = { day: number; month: number; year: number; monthName: string };

const T = table as { firstYear: number; starts: number[] };

function tableLookup(jdn: number): HijriDate | null {
  const s = T.starts;
  if (jdn < s[0] || jdn >= s[s.length - 1]) return null;
  let lo = 0;
  let hi = s.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid] <= jdn) lo = mid;
    else hi = mid;
  }
  const year = T.firstYear + Math.floor(lo / 12);
  const month = (lo % 12) + 1;
  return { year, month, day: jdn - s[lo] + 1, monthName: HIJRI_MONTHS[month - 1] };
}

export function toHijri(date: Date, offsetDays = 0): HijriDate {
  const jd = gregorianToJd(date.getFullYear(), date.getMonth() + 1, date.getDate()) + offsetDays;
  const fromTable = tableLookup(Math.round(jd + 0.5));
  if (fromTable) return fromTable;
  const year = Math.floor((30 * (jd - EPOCH) + 10646) / 10631);
  const month = Math.min(12, Math.ceil((jd - (29 + hijriToJd(year, 1, 1))) / 29.5) + 1);
  const day = Math.round(jd - hijriToJd(year, month, 1)) + 1;
  return { day, month, year, monthName: HIJRI_MONTHS[month - 1] };
}

export function formatHijri(date: Date, offsetDays = 0, lang?: Lang) {
  const h = toHijri(date, offsetDays);
  const month = hijriMonthName(h.month, lang);
  return lang === 'ja' ? `ヒジュラ暦${h.year}年 ${month} ${h.day}日` : `${h.day} ${month} ${h.year}`;
}

function jdToDate(jd: number) {
  // Julian günden yerel takvim tarihine (öğlen).
  const z = Math.floor(jd + 0.5);
  const a = Math.floor((z - 1867216.25) / 36524.25);
  const b = z + 1 + a - Math.floor(a / 4) + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return new Date(year, month - 1, day);
}

/** Hicri tarihi Miladi güne çevirir (toHijri ile aynı düzeltme). */
export function fromHijri(year: number, month: number, day: number, offsetDays = 0): Date {
  const i = (year - T.firstYear) * 12 + (month - 1);
  if (i >= 0 && i < T.starts.length) return jdToDate(T.starts[i] + day - 1 - offsetDays);
  return jdToDate(hijriToJd(year, month, day) - offsetDays);
}
