import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { DEFAULT_PLACE, locateDevice, type Place } from './location';
import { rescheduleAll, type NotifySettings } from './notifications';
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
};

const AppState = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);

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

  // Konum veya bildirim ayarı değişince bildirimleri yeniden planla.
  const { place, notify } = settings;
  useEffect(() => {
    if (!ready) return;
    rescheduleAll(place.lat, place.lng, notify)
      .then((n) => setNotifyStatus(n < 0 ? 'Bildirim izni verilmedi' : null))
      .catch(() => setNotifyStatus('Bildirimler kurulamadı'));
  }, [ready, place.lat, place.lng, notify]);

  return (
    <AppState.Provider value={{ ready, settings, update, refreshLocation, notifyStatus }}>
      {children}
    </AppState.Provider>
  );
}

export function useAppState() {
  const c = useContext(AppState);
  if (!c) throw new Error('AppStateProvider eksik');
  return c;
}
