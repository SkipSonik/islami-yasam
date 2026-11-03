import { CalculationMethod, Coordinates, PrayerTimes, Qibla } from 'adhan';

export type PrayerKey = 'imsak' | 'gunes' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi';

export const PRAYERS: { key: PrayerKey; label: string }[] = [
  { key: 'imsak', label: 'İmsak' },
  { key: 'gunes', label: 'Güneş' },
  { key: 'ogle', label: 'Öğle' },
  { key: 'ikindi', label: 'İkindi' },
  { key: 'aksam', label: 'Akşam' },
  { key: 'yatsi', label: 'Yatsı' },
];

export type DayTimes = Record<PrayerKey, Date>;

// Diyanet İşleri Başkanlığı yöntemi (Türkiye): imsak 18°, yatsı 17°,
// temkin süreleriyle. Diyanet takvimi ikindi için asr-ı evvel kullanır
// (kütüphanenin varsayılanı), bu yüzden mezhep ayarı değiştirilmez.
function params() {
  return CalculationMethod.Turkey();
}

export function getDayTimes(lat: number, lng: number, date: Date): DayTimes {
  const t = new PrayerTimes(new Coordinates(lat, lng), date, params());
  return {
    imsak: t.fajr,
    gunes: t.sunrise,
    ogle: t.dhuhr,
    ikindi: t.asr,
    aksam: t.maghrib,
    yatsi: t.isha,
  };
}

export function qiblaDirection(lat: number, lng: number) {
  return Qibla(new Coordinates(lat, lng));
}

export type NextPrayer = { key: PrayerKey; label: string; time: Date; prevTime: Date };

// Şu andan sonraki ilk vakit (gece yarısından sonra ise yarının imsakı).
export function getNextPrayer(lat: number, lng: number, now = new Date()): NextPrayer {
  const today = getDayTimes(lat, lng, now);
  let prev: Date | null = null;
  for (const p of PRAYERS) {
    if (today[p.key] > now) {
      if (!prev) {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        prev = getDayTimes(lat, lng, y).yatsi;
      }
      return { key: p.key, label: p.label, time: today[p.key], prevTime: prev };
    }
    prev = today[p.key];
  }
  const tm = new Date(now);
  tm.setDate(tm.getDate() + 1);
  return { key: 'imsak', label: 'İmsak', time: getDayTimes(lat, lng, tm).imsak, prevTime: today.yatsi };
}

// Şu an içinde bulunulan vakit (vurgulamak için).
export function getCurrentPrayer(times: DayTimes, now = new Date()): PrayerKey | null {
  let cur: PrayerKey | null = null;
  for (const p of PRAYERS) if (times[p.key] <= now) cur = p.key;
  return cur ?? 'yatsi';
}

export function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
