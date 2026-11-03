// Hicri tarih: tablo usulü (astronomik başlangıç) hesap.
// Diyanet takvimi zaman zaman 1 gün farklı olabilir; ayarlardan düzeltme yapılabilir.

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

export function toHijri(date: Date, offsetDays = 0): HijriDate {
  const jd = gregorianToJd(date.getFullYear(), date.getMonth() + 1, date.getDate()) + offsetDays;
  const year = Math.floor((30 * (jd - EPOCH) + 10646) / 10631);
  const month = Math.min(12, Math.ceil((jd - (29 + hijriToJd(year, 1, 1))) / 29.5) + 1);
  const day = Math.round(jd - hijriToJd(year, month, 1)) + 1;
  return { day, month, year, monthName: HIJRI_MONTHS[month - 1] };
}

export function formatHijri(date: Date, offsetDays = 0) {
  const h = toHijri(date, offsetDays);
  return `${h.day} ${h.monthName} ${h.year}`;
}
