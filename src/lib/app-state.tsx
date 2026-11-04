import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState as RNAppState } from 'react-native';

import { DEFAULT_PLACE, locateDevice, type Place } from './location';
import { registerBackgroundRefresh } from './background';
import { checkReliability, rescheduleAll, type NotifySettings, type Reliability } from './notifications';
import { loadJSON, saveJSON } from './storage';

export type Settings = {
  place: Place;
  hasLocated: boolean; // en az bir kez konum denendi mi
  notify: NotifySettings;
  hijriOffset: number; // -2..+2 gün
};

const DEFAULTS: Settings = {
  place: DEFAULT_PLACE,
  hasLocated: false,
  notify: {
    enabled: { imsak: true, gunes: false, ogle: true, ikindi: true, aksam: true, yatsi: true },
    remindBefore: 0,
  },
  hijriOffset: 0,
};

const KEY = 'settings-v1';

type Ctx = {
  ready: boolean;
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  refreshLocation: () => Promise<'ok' | 'denied' | 'failed'>;
  notifyStatus: string | null;
  reliability: Reliability | null;
  recheckReliability: () => void;
};

const AppState = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);
  const [reliability, setReliability] = useState<Reliability | null>(null);
  const [tick, setTick] = useState(0); // izin ekranından dönünce yeniden planlamak için

  useEffect(() => {
    loadJSON<Settings>(KEY, DEFAULTS).then((s) => {
      setSettings({ ...DEFAULTS, ...s, notify: { ...DEFAULTS.notify, ...s.notify } });
      setReady(true);
    });
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveJSON(KEY, next);
      return next;
    });
  }, []);

  const refreshLocation = useCallback(async () => {
    const r = await locateDevice();
    if ('place' in r) {
      update({ place: r.place, hasLocated: true });
      return 'ok' as const;
    }
    update({ hasLocated: true });
    return r.error;
  }, [update]);

  // İlk açılışta otomatik konum dene.
  useEffect(() => {
    if (ready && !settings.hasLocated) refreshLocation();
  }, [ready, settings.hasLocated, refreshLocation]);

  const recheckReliability = useCallback(() => {
    checkReliability()
      .then(setReliability)
      .catch(() => {});
  }, []);

  // Uygulama ön plana her döndüğünde (ör. ayarlardan izin verip geri gelince)
  // izinleri yeniden kontrol et ve bildirimleri tazele.
  useEffect(() => {
    registerBackgroundRefresh();
    recheckReliability();
    const sub = RNAppState.addEventListener('change', (st) => {
      if (st === 'active') {
        recheckReliability();
        setTick((t) => t + 1);
      }
    });
    return () => sub.remove();
  }, [recheckReliability]);

  // Konum veya bildirim ayarı değişince bildirimleri yeniden planla.
  const { place, notify } = settings;
  useEffect(() => {
    if (!ready) return;
    // İzin penceresi yalnızca ilk planlamada açılır, her ön plana dönüşte değil.
    rescheduleAll(place.lat, place.lng, notify, tick === 0)
      .then((n) => {
        setNotifyStatus(n < 0 ? 'Bildirim izni verilmedi' : null);
        recheckReliability();
      })
      .catch(() => setNotifyStatus('Bildirimler kurulamadı'));
  }, [ready, place.lat, place.lng, notify, tick, recheckReliability]);

  return (
    <AppState.Provider
      value={{ ready, settings, update, refreshLocation, notifyStatus, reliability, recheckReliability }}>
      {children}
    </AppState.Provider>
  );
}

export function useAppState() {
  const c = useContext(AppState);
  if (!c) throw new Error('AppStateProvider eksik');
  return c;
}
