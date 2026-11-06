import { createStore } from '@/lib/store';
import { dayKey } from '@/lib/tracker';

// Oruç takibi: 1 = tutuldu, 2 = tutulamadı (kazaya kaldı)
export type FastMark = 1 | 2;
export const fastStore = createStore<Record<string, FastMark>>('oruc-v1', {});

export function cycleFast(day: Date) {
  const k = dayKey(day);
  fastStore.set((prev) => {
    const cur = prev[k];
    const next = { ...prev };
    if (!cur) next[k] = 1;
    else if (cur === 1) next[k] = 2;
    else delete next[k];
    return next;
  });
}

export const fastCount = (d: Record<string, FastMark>) => Object.values(d).filter((v) => v === 1).length;
export const missedCount = (d: Record<string, FastMark>) => Object.values(d).filter((v) => v === 2).length;
