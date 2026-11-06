import type { IconName } from '@/components/ui';
import { loadPersonal } from '@/lib/hatim';
import { fastStore, fastCount } from '@/lib/ramadan';
import { readingStore, readingDays } from '@/lib/reading';
import { loadJSON } from '@/lib/storage';
import { fullDays, longestStreak, totalPrayers, trackerStore } from '@/lib/tracker';
import { tesbihatStore } from '@/lib/tesbihat';

// Rozetler: uygulamadaki ibadet takiplerinden hesaplanır, ayrıca saklanmaz.

export type BadgeId =
  | 'ilkAdim'
  | 'tamGun'
  | 'seri7'
  | 'seri40'
  | 'namaz100'
  | 'namaz1000'
  | 'tesbihat'
  | 'tesbihat40'
  | 'zikir1000'
  | 'hatim'
  | 'okuma7'
  | 'okuma30'
  | 'oruc'
  | 'oruc30';

export type Badge = { id: BadgeId; icon: IconName; goal: number; value: number };

type Ctx = {
  prayers: number;
  fullDays: number;
  streak: number;
  tesbihat: number;
  zikir: number;
  hatim: number;
  reading: number;
  fasts: number;
};

const DEFS: { id: BadgeId; icon: IconName; goal: number; of: (c: Ctx) => number }[] = [
  { id: 'ilkAdim', icon: 'footsteps-outline', goal: 1, of: (c) => c.prayers },
  { id: 'tamGun', icon: 'sunny-outline', goal: 1, of: (c) => c.fullDays },
  { id: 'seri7', icon: 'flame-outline', goal: 7, of: (c) => c.streak },
  { id: 'seri40', icon: 'flame', goal: 40, of: (c) => c.streak },
  { id: 'namaz100', icon: 'ribbon-outline', goal: 100, of: (c) => c.prayers },
  { id: 'namaz1000', icon: 'trophy-outline', goal: 1000, of: (c) => c.prayers },
  { id: 'tesbihat', icon: 'ellipse-outline', goal: 1, of: (c) => c.tesbihat },
  { id: 'tesbihat40', icon: 'infinite-outline', goal: 40, of: (c) => c.tesbihat },
  { id: 'zikir1000', icon: 'finger-print-outline', goal: 1000, of: (c) => c.zikir },
  { id: 'okuma7', icon: 'book-outline', goal: 7, of: (c) => c.reading },
  { id: 'okuma30', icon: 'library-outline', goal: 30, of: (c) => c.reading },
  { id: 'hatim', icon: 'medal-outline', goal: 1, of: (c) => c.hatim },
  { id: 'oruc', icon: 'restaurant-outline', goal: 1, of: (c) => c.fasts },
  { id: 'oruc30', icon: 'moon', goal: 30, of: (c) => c.fasts },
];

export async function computeBadges(): Promise<Badge[]> {
  await Promise.all([trackerStore.ready, tesbihatStore.ready, readingStore.ready, fastStore.ready]);
  const data = trackerStore.get();
  const [personal, zikir] = await Promise.all([
    loadPersonal(),
    loadJSON<{ total: number }>('zikirmatik-v1', { total: 0 }),
  ]);
  const ctx: Ctx = {
    prayers: totalPrayers(data),
    fullDays: fullDays(data),
    streak: longestStreak(data),
    tesbihat: tesbihatStore.get().completed,
    zikir: zikir.total ?? 0,
    hatim: personal.completed,
    reading: readingDays(readingStore.get()),
    fasts: fastCount(fastStore.get()),
  };
  return DEFS.map((d) => ({ id: d.id, icon: d.icon, goal: d.goal, value: Math.min(d.goal, d.of(ctx)) }));
}
