import { createStore } from '@/lib/store';

export const tesbihatStore = createStore<{ completed: number }>('tesbihat-v1', { completed: 0 });

export function completeTesbihat() {
  tesbihatStore.set((p) => ({ completed: p.completed + 1 }));
}
