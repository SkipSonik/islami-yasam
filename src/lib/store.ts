import { useSyncExternalStore } from 'react';

import { loadValue, saveJSON } from '@/lib/storage';

/**
 * Cihazda saklanan, birden fazla ekranın aynı anda kullandığı küçük veri kabı.
 * Değişiklik her yerde anında görünür ve kalıcı olarak kaydedilir.
 */
export function createStore<T>(key: string, initial: T) {
  let value = initial;
  let loaded = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const ready = loadValue<T>(key, initial).then((v) => {
    value = v && typeof v === 'object' && !Array.isArray(v) && typeof initial === 'object' && !Array.isArray(initial)
      ? { ...initial, ...v }
      : v;
    loaded = true;
    emit();
  });

  return {
    ready,
    get: () => value,
    isLoaded: () => loaded,
    set(next: T | ((prev: T) => T)) {
      value = typeof next === 'function' ? (next as (p: T) => T)(value) : next;
      saveJSON(key, value);
      emit();
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    useValue(): T {
      return useSyncExternalStore(this.subscribe, this.get, this.get);
    },
  };
}
