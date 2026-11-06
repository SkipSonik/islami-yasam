import { createStore } from '@/lib/store';
import { dayKey } from '@/lib/tracker';

// Kur'an okuma planı: hedef gün sayısında hatim. Mushaf 604 sayfa.
export const TOTAL_PAGES = 604;

export type ReadingPlan = {
  /** Plan yoksa 0 */
  days: number;
  startedAt: string | null;
  /** Okunan son sayfa */
  page: number;
  /** Okuma yapılan günler (YYYY-MM-DD → o gün okunan sayfa sayısı) */
  log: Record<string, number>;
  /** Tamamlanan plan (hatim) sayısı */
  finished: number;
};

export const readingStore = createStore<ReadingPlan>('okuma-plani-v1', {
  days: 0,
  startedAt: null,
  page: 0,
  log: {},
  finished: 0,
});

export const dailyPages = (days: number) => Math.ceil(TOTAL_PAGES / Math.max(1, days));

export function startPlan(days: number) {
  readingStore.set((p) => ({ ...p, days, startedAt: dayKey(new Date()), page: 0 }));
}

export function stopPlan() {
  readingStore.set((p) => ({ ...p, days: 0, startedAt: null, page: 0 }));
}

/** Bugünkü bölümü okundu say; hatim biterse sayacı artırır. */
export function markTodayRead(pages: number) {
  readingStore.set((p) => {
    const k = dayKey(new Date());
    const page = Math.min(TOTAL_PAGES, p.page + pages);
    const done = page >= TOTAL_PAGES;
    return {
      ...p,
      page: done ? 0 : page,
      log: { ...p.log, [k]: (p.log[k] ?? 0) + pages },
      finished: p.finished + (done ? 1 : 0),
      days: done ? 0 : p.days,
      startedAt: done ? null : p.startedAt,
    };
  });
}

export const readingDays = (p: ReadingPlan) => Object.keys(p.log).length;

/** Plana göre bugüne kadar okunmuş olması gereken sayfa */
export function expectedPage(p: ReadingPlan, today: Date) {
  if (!p.days || !p.startedAt) return 0;
  const [y, m, d] = p.startedAt.split('-').map(Number);
  const start = new Date(y, m - 1, d).getTime();
  const elapsed = Math.floor((today.getTime() - start) / 86400000) + 1;
  return Math.min(TOTAL_PAGES, elapsed * dailyPages(p.days));
}
