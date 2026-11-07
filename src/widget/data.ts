import { THEMES, type Palette } from '@/constants/theme';
import { setCurrentLang, t, type Lang } from '@/i18n';
import { resolveCalc } from '@/lib/calc';
import { startOfDay } from '@/lib/dates';
import { formatHijri } from '@/lib/hijri';
import { DEFAULT_PLACE, type Place } from '@/lib/location';
import {
  fmtTime,
  getCurrentPrayer,
  getDayTimes,
  getNextPrayer,
  PRAYER_KEYS,
  type MethodKey,
  type PrayerKey,
} from '@/lib/prayer';
import { loadValue } from '@/lib/storage';

type Stored = {
  place?: Place;
  lang?: Lang | null;
  method?: MethodKey | 'auto';
  hijriOffset?: number;
  theme?: keyof typeof THEMES;
};

export type WidgetData = {
  C: Palette;
  place: string;
  hijri: string;
  next: { key: PrayerKey; label: string; time: string };
  current: PrayerKey | null;
  times: { key: PrayerKey; label: string; time: string }[];
  nextLabel: string;
};

/** Widget için gereken her şey uygulama açık olmasa da telefonda hesaplanır. */
export async function loadWidgetData(now = new Date()): Promise<WidgetData> {
  const s = (await loadValue<Stored | null>('settings-v1', null)) ?? {};
  const lang = s.lang ?? 'tr';
  setCurrentLang(lang);
  const place = s.place ?? DEFAULT_PLACE;
  const calc = resolveCalc({ method: s.method ?? 'auto', place, lang });
  const times = getDayTimes(place.lat, place.lng, startOfDay(now), calc);
  const next = getNextPrayer(place.lat, place.lng, now, calc);
  const current = getCurrentPrayer(times, now);
  const C = THEMES[s.theme ?? 'zumrut'] ?? THEMES.zumrut;
  return {
    C,
    place: place.name,
    hijri: formatHijri(now, s.hijriOffset ?? 0, lang),
    next: { key: next.key, label: t(`prayer.${next.key}`), time: fmtTime(next.time) },
    current,
    times: PRAYER_KEYS.map((k) => ({ key: k, label: t(`prayer.${k}`), time: fmtTime(times[k]) })),
    nextLabel: t('tv.nextPrayer'),
  };
}
