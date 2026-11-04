import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla, type CalculationParameters } from 'adhan';

export type PrayerKey = 'imsak' | 'gunes' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi';

export const PRAYER_KEYS: PrayerKey[] = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];

/** Geriye dönük uyumluluk: sıralı liste (etiketler i18n'den gelir) */
export const PRAYERS = PRAYER_KEYS.map((key) => ({ key }));

export type DayTimes = Record<PrayerKey, Date>;

// ---- Hesaplama yöntemleri ----

export type MethodKey =
  | 'turkey'
  | 'mwl'
  | 'isna'
  | 'egypt'
  | 'ummalqura'
  | 'karachi'
  | 'dubai'
  | 'kuwait'
  | 'qatar'
  | 'singapore'
  | 'tehran'
  | 'moonsighting';

export const METHOD_KEYS: MethodKey[] = [
  'turkey',
  'mwl',
  'isna',
  'egypt',
  'ummalqura',
  'karachi',
  'dubai',
  'kuwait',
  'qatar',
  'singapore',
  'tehran',
  'moonsighting',
];

const FACTORY: Record<MethodKey, () => CalculationParameters> = {
  turkey: CalculationMethod.Turkey,
  mwl: CalculationMethod.MuslimWorldLeague,
  isna: CalculationMethod.NorthAmerica,
  egypt: CalculationMethod.Egyptian,
  ummalqura: CalculationMethod.UmmAlQura,
  karachi: CalculationMethod.Karachi,
  dubai: CalculationMethod.Dubai,
  kuwait: CalculationMethod.Kuwait,
  qatar: CalculationMethod.Qatar,
  singapore: CalculationMethod.Singapore,
  tehran: CalculationMethod.Tehran,
  moonsighting: CalculationMethod.MoonsightingCommittee,
};

// Ülkeye göre yaygın kullanılan resmî/yerel yöntem.
const BY_COUNTRY: Record<string, MethodKey> = {
  TR: 'turkey',
  SA: 'ummalqura', YE: 'ummalqura',
  AE: 'dubai', OM: 'dubai',
  KW: 'kuwait', QA: 'qatar', BH: 'qatar',
  EG: 'egypt', SD: 'egypt', LY: 'egypt', SY: 'egypt', LB: 'egypt', IQ: 'egypt', JO: 'egypt', PS: 'egypt',
  DZ: 'mwl', MA: 'mwl', TN: 'mwl',
  PK: 'karachi', IN: 'karachi', BD: 'karachi', AF: 'karachi',
  MY: 'singapore', SG: 'singapore', ID: 'singapore', BN: 'singapore',
  IR: 'tehran',
  US: 'isna', CA: 'isna',
  GB: 'moonsighting', IE: 'moonsighting',
};

// İkindi için Hanefi (asr-ı sani) kullanılan ülkeler. Türkiye'de Diyanet asr-ı evveli
// esas aldığı için burada değil.
const HANAFI = new Set(['PK', 'IN', 'BD', 'AF']);

export function methodForCountry(country?: string | null): MethodKey {
  return (country && BY_COUNTRY[country.toUpperCase()]) || 'mwl';
}

export type CalcConfig = { method: MethodKey; country?: string | null };

function params(cfg: CalcConfig) {
  const p = FACTORY[cfg.method]();
  if (cfg.country && HANAFI.has(cfg.country.toUpperCase())) p.madhab = Madhab.Hanafi;
  return p;
}

export function getDayTimes(lat: number, lng: number, date: Date, cfg: CalcConfig = { method: 'turkey' }): DayTimes {
  const t = new PrayerTimes(new Coordinates(lat, lng), date, params(cfg));
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

export type NextPrayer = { key: PrayerKey; time: Date; prevTime: Date };

// Şu andan sonraki ilk vakit (gece yarısından sonra ise yarının imsakı).
export function getNextPrayer(lat: number, lng: number, now = new Date(), cfg?: CalcConfig): NextPrayer {
  const today = getDayTimes(lat, lng, now, cfg);
  let prev: Date | null = null;
  for (const key of PRAYER_KEYS) {
    if (today[key] > now) {
      if (!prev) {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        prev = getDayTimes(lat, lng, y, cfg).yatsi;
      }
      return { key, time: today[key], prevTime: prev };
    }
    prev = today[key];
  }
  const tm = new Date(now);
  tm.setDate(tm.getDate() + 1);
  return { key: 'imsak', time: getDayTimes(lat, lng, tm, cfg).imsak, prevTime: today.yatsi };
}

// Şu an içinde bulunulan vakit (vurgulamak için).
export function getCurrentPrayer(times: DayTimes, now = new Date()): PrayerKey | null {
  let cur: PrayerKey | null = null;
  for (const key of PRAYER_KEYS) if (times[key] <= now) cur = key;
  return cur ?? 'yatsi';
}

export function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
