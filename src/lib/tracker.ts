import { addDays, startOfDay } from '@/lib/dates';
import { createStore } from '@/lib/store';

// Namaz takibi: her gün için beş farz namazın kılınıp kılınmadığı (bit maskesi).
export const FARZ = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi'] as const;
export type Farz = (typeof FARZ)[number];
/** Takvimdeki vakit anahtarları (imsak sabah namazına karşılık gelir) */
export const FARZ_TIME_KEY: Record<Farz, 'imsak' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi'> = {
  sabah: 'imsak',
  ogle: 'ogle',
  ikindi: 'ikindi',
  aksam: 'aksam',
  yatsi: 'yatsi',
};
const ALL = (1 << FARZ.length) - 1;

export const dayKey = (d: Date) => {
  const x = startOfDay(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export const trackerStore = createStore<Record<string, number>>('namaz-takip-v1', {});

export function isPrayed(data: Record<string, number>, day: Date, f: Farz) {
  return ((data[dayKey(day)] ?? 0) & (1 << FARZ.indexOf(f))) !== 0;
}

export function togglePrayer(day: Date, f: Farz) {
  const k = dayKey(day);
  trackerStore.set((prev) => ({ ...prev, [k]: (prev[k] ?? 0) ^ (1 << FARZ.indexOf(f)) }));
}

export const countDay = (mask: number) => {
  let n = 0;
  for (let m = mask; m; m >>= 1) n += m & 1;
  return n;
};

/** Beş vaktin tamamının kılındığı ardışık gün sayısı (bugün tamamlanmadıysa dünden geriye) */
export function currentStreak(data: Record<string, number>, today: Date) {
  let d = startOfDay(today);
  if ((data[dayKey(d)] ?? 0) !== ALL) d = addDays(d, -1);
  let n = 0;
  while ((data[dayKey(d)] ?? 0) === ALL) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function longestStreak(data: Record<string, number>) {
  const days = Object.keys(data)
    .filter((k) => data[k] === ALL)
    .sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of days) {
    const [y, m, dd] = k.split('-').map(Number);
    const d = new Date(y, m - 1, dd);
    run = prev && Math.round((d.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function totalPrayers(data: Record<string, number>) {
  return Object.values(data).reduce((a, m) => a + countDay(m), 0);
}

export function fullDays(data: Record<string, number>) {
  return Object.values(data).filter((m) => m === ALL).length;
}

/** Son 7 gün: [{date, mask}] (en eski önce) */
export function lastDays(data: Record<string, number>, today: Date, n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(startOfDay(today), i - (n - 1));
    return { date, mask: data[dayKey(date)] ?? 0 };
  });
}
