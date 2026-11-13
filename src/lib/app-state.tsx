import { DEFAULT_THEME, type ThemeId } from '@/constants/theme';
import { readingStore } from '@/lib/reading';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState as RNAppState } from 'react-native';

import { deviceLang, setCurrentLang, translate, type Lang, type Params, type StringKey } from '@/i18n';

import { registerBackgroundRefresh } from './background';
import { resolveCalc } from './calc';
import { DEFAULT_PLACE, locateDevice, type Place } from './location';
import { checkReliability, rescheduleAll, type NotifySettings, type Reliability } from './notifications';
import type { CalcConfig, MethodKey } from './prayer';
import { loadJSON, saveJSON } from './storage';
import { refreshWidgets } from '@/widget/task-handler';

export type Settings = {
  place: Place;
  hasLocated: boolean; // en az bir kez konum denendi mi
  notify: NotifySettings;
  hijriOffset: number; // -2..+2 gün
  lang: Lang | null; // null: henüz seçilmedi → cihaz dili
  method: MethodKey | 'auto';
  theme: ThemeId;
  /** Namaz Yolu marka temasına bir kez geçildi mi */
  brand?: number;
};

const DEFAULTS: Settings = {
  place: DEFAULT_PLACE,
  hasLocated: false,
  notify: {
    enabled: { imsak: true, gunes: false, ogle: true, ikindi: true, aksam: true, yatsi: true },
    remindBefore: 0,
  },
  hijriOffset: 0,
  lang: null,
  method: 'auto',
  theme: DEFAULT_THEME,
};

export const SETTINGS_KEY = 'settings-v1';

type Ctx = {
  ready: boolean;
  settings: Settings;
  lang: Lang;
  calc: CalcConfig;
  update: (patch: Partial<Settings>) => void;
  refreshLocation: () => Promise<'ok' | 'denied' | 'failed'>;
  notifyStatus: StringKey | null;
  reliability: Reliability | null;
  recheckReliability: () => void;
};

const AppState = createContext<Ctx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [notifyStatus, setNotifyStatus] = useState<StringKey | null>(null);
  const [reliability, setReliability] = useState<Reliability | null>(null);
  const [tick, setTick] = useState(0); // izin ekranından dönünce yeniden planlamak için

  const lang: Lang = settings.lang ?? deviceLang();
  setCurrentLang(lang); // bildirim gibi bileşen dışı metinler için

  useEffect(() => {
    loadJSON<Settings>(SETTINGS_KEY, DEFAULTS).then((s) => {
      const merged = { ...DEFAULTS, ...s, notify: { ...DEFAULTS.notify, ...s.notify } };
      // Dil hiç seçilmediyse cihaz dilini kalıcı yap (arka plan görevi de aynı dili kullansın)
      if (!merged.lang) {
        merged.lang = deviceLang();
        saveJSON(SETTINGS_KEY, merged);
      }
      // Namaz Yolu'na geçişte eski varsayılan temadakiler bir kez yeni marka temasına alınır
      if (!merged.brand) {
        if (merged.theme === 'zumrut') merged.theme = DEFAULT_THEME;
        merged.brand = 1;
        saveJSON(SETTINGS_KEY, merged);
      }
      setCurrentLang(merged.lang);
      setSettings(merged);
      setReady(true);
    });
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveJSON(SETTINGS_KEY, next);
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

  // İlk açılışta otomatik konum dene; eski sürümden kalan konumun ülkesi yoksa sessizce tamamla.
  useEffect(() => {
    if (!ready) return;
    if (!settings.hasLocated) refreshLocation();
    else if (settings.place.auto && settings.place.country === undefined) refreshLocation();
  }, [ready, settings.hasLocated, settings.place.auto, settings.place.country, refreshLocation]);

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
        setTick((x) => x + 1);
      }
    });
    return () => sub.remove();
  }, [recheckReliability]);

  // Tema veya dil değişince ana ekran widget'larını da güncelle
  useEffect(() => {
    if (ready) refreshWidgets();
  }, [ready, settings.theme, settings.lang]);

  const calc = useMemo(
    () => resolveCalc(settings),
    [settings.method, settings.place, settings.lang], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Konum, yöntem, dil, bildirim ayarı veya okuma planı değişince bildirimleri yeniden planla.
  const { place, notify } = settings;
  const plan = readingStore.useValue();
  const readingKey = `${plan.days}:${Object.keys(plan.log).length}`;
  useEffect(() => {
    if (!ready) return;
    // İzin penceresi yalnızca ilk planlamada açılır, her ön plana dönüşte değil.
    rescheduleAll(place.lat, place.lng, notify, tick === 0, calc, settings.hijriOffset)
      .then((n) => {
        setNotifyStatus(n < 0 ? 'notif.denied' : null);
        refreshWidgets();
        recheckReliability();
      })
      .catch(() => setNotifyStatus('notif.failed'));
  }, [ready, place.lat, place.lng, notify, tick, calc, lang, recheckReliability, settings.hijriOffset, readingKey]);

  return (
    <AppState.Provider
      value={{ ready, settings, lang, calc, update, refreshLocation, notifyStatus, reliability, recheckReliability }}>
      {children}
    </AppState.Provider>
  );
}

export function useAppState() {
  const c = useContext(AppState);
  if (!c) throw new Error('AppStateProvider eksik');
  return c;
}

/** Seçili dilde çeviri */
export function useT() {
  const { lang } = useAppState();
  return useCallback((key: StringKey, params?: Params) => translate(lang, key, params), [lang]);
}
