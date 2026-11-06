import * as Battery from 'expo-battery';
import Constants from 'expo-constants';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { t } from '@/i18n';

import { getDayTimes, PRAYER_KEYS, type CalcConfig, type PrayerKey } from './prayer';
import { channelFor, soundDef, SOUNDS, type SoundId } from './sounds';
import { HADISLER } from '@/data/hadisler';
import { currentLang } from '@/i18n';
import { toHijri } from '@/lib/hijri';
import { dailyPages, readingStore } from '@/lib/reading';
import { dayKey } from '@/lib/tracker';

const DAYS_AHEAD = 7;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureChannel(sound?: SoundId) {
  if (Platform.OS !== 'android') return;
  const def = soundDef(sound);
  const name =
    def.id === 'varsayilan' ? t('notif.channel') : `${t('notif.channel')} · ${t(`sound.${def.id}`)}`;
  await Notifications.setNotificationChannelAsync(channelFor(def.id), {
    name,
    importance: Notifications.AndroidImportance.HIGH,
    sound: def.id === 'sessiz' ? null : (def.file ?? 'default'),
    enableVibrate: true,
    vibrationPattern: [0, 300, 200, 300],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });
}

/** Seçilen sesle hemen deneme bildirimi gönderir (5 sn sonra). */
export async function sendTestNotification(sound: SoundId | undefined, title: string, body: string) {
  await ensureChannel(sound);
  const def = soundDef(sound);
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: def.id === 'sessiz' ? false : (def.file ?? 'default') },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: channelFor(def.id),
    },
  });
}

export { SOUNDS };

export async function ensureNotificationPermission() {
  await ensureChannel();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export type NotifySettings = {
  enabled: Record<PrayerKey, boolean>;
  remindBefore: number; // dakika, 0 = kapalı
  sound?: SoundId; // vakit girişi sesi
  /** Ramazan'da sahur hatırlatması ve iftar bildirimi */
  ramazan?: boolean;
  sahurBefore?: number; // dakika
  /** Günün hadisi bildirimi */
  daily?: boolean;
  dailyHour?: number;
  /** Kur'an okuma planı hatırlatması */
  readingHour?: number;
};

export const NOTIFY_EXTRA_DEFAULTS = { ramazan: true, sahurBefore: 45, daily: true, dailyHour: 9, readingHour: 21 };

async function canUseExactAlarms() {
  if (Platform.OS !== 'android') return true;
  try {
    return (await Notifications.getExactAlarmPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

// Tüm planlı bildirimleri silip önümüzdeki günler için yeniden kurar.
// Uygulama açılınca, ayar değişince ve arka plan görevinde çağrılır.
// Çalışırken izin istemez (arka planda izin penceresi açılamaz).
export async function rescheduleAll(
  lat: number,
  lng: number,
  s: NotifySettings,
  askPermission = true,
  cfg?: CalcConfig,
  hijriOffset = 0,
) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const x = { ...NOTIFY_EXTRA_DEFAULTS, ...s };
  await readingStore.ready;
  const plan = readingStore.get();
  const readingOn = plan.days > 0;
  const anyOn = Object.values(s.enabled).some(Boolean) || x.ramazan || x.daily || readingOn;
  if (!anyOn) return 0;

  if (askPermission) {
    if (!(await ensureNotificationPermission())) return -1;
    await ensureChannel(s.sound);
  } else {
    await ensureChannel();
    await ensureChannel(s.sound);
    if (!(await Notifications.getPermissionsAsync()).granted) return -1;
  }

  // Kesin alarm izni varsa "alarm saati" türünde kurulur: Android bunları
  // pil tasarrufunda bile geciktirmez.
  const delivery = (await canUseExactAlarms()) ? 'alarmClock' : 'bestEffort';

  const now = Date.now();
  let count = 0;
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const times = getDayTimes(lat, lng, d, cfg);
    for (const key of PRAYER_KEYS) {
      if (!s.enabled[key]) continue;
      const at = times[key].getTime();
      const prayer = t(`prayer.${key}`);

      if (at > now) {
        await schedule(at, t('notif.entered', { prayer }), bodyText(key), delivery, s.sound);
        count++;
      }
      if (s.remindBefore > 0) {
        const r = at - s.remindBefore * 60 * 1000;
        if (r > now) {
          await schedule(
            r,
            t('notif.remindTitle', { prayer, n: s.remindBefore }),
            t('notif.remindBody', { prayer }),
            delivery,
          );
          count++;
        }
      }
    }

    // Ramazan: sahur hatırlatması (imsaktan önce) ve iftar bildirimi
    if (x.ramazan && toHijri(d, hijriOffset).month === 9) {
      const sahur = times.imsak.getTime() - x.sahurBefore * 60 * 1000;
      if (sahur > now) {
        await schedule(sahur, t('notif.sahurTitle'), t('notif.sahurBody', { n: x.sahurBefore }), delivery);
        count++;
      }
      const iftar = times.aksam.getTime();
      if (iftar > now) {
        await schedule(iftar, t('notif.iftarTitle'), t('notif.iftarBody'), delivery, s.sound);
        count++;
      }
    }

    // Günün hadisi
    if (x.daily) {
      const at = atHour(d, x.dailyHour);
      if (at > now) {
        const h = HADISLER[dayIndex(d) % HADISLER.length];
        await schedule(at, t('notif.dailyTitle'), `${currentLang() === 'tr' ? h.tr : h.en} (${h.src})`, 'bestEffort', 'sessiz');
        count++;
      }
    }

    // Okuma planı hatırlatması (bugün okunduysa bugünkü atlanır)
    if (readingOn) {
      const at = atHour(d, x.readingHour);
      const readToday = i === 0 && (plan.log[dayKey(d)] ?? 0) > 0;
      if (at > now && !readToday) {
        await schedule(at, t('notif.readingTitle'), t('notif.readingBody', { n: dailyPages(plan.days) }), 'bestEffort');
        count++;
      }
    }
  }
  return count;
}

function atHour(d: Date, hour: number) {
  const x = new Date(d);
  x.setHours(hour, 0, 0, 0);
  return x.getTime();
}

const dayIndex = (d: Date) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);

function bodyText(k: PrayerKey) {
  if (k === 'imsak') return t('notif.bodyImsak');
  if (k === 'gunes') return t('notif.bodySun');
  return t('notif.bodyPrayer');
}

function schedule(
  time: number,
  title: string,
  body: string,
  delivery: 'alarmClock' | 'bestEffort',
  sound?: SoundId,
) {
  // Hatırlatmalar varsayılan sesle, vakit girişi seçilen sesle çalar.
  const def = soundDef(sound);
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: def.id === 'sessiz' ? false : (def.file ?? 'default'),
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: time,
      channelId: channelFor(def.id),
      delivery,
    },
  });
}

// ---- Bildirimlerin uygulama kapalıyken de gelmesi için gereken ayarlar ----

export type Reliability = {
  notifications: boolean;
  exactAlarms: boolean;
  batteryUnrestricted: boolean;
};

export async function checkReliability(): Promise<Reliability> {
  const notifications = (await Notifications.getPermissionsAsync()).granted;
  const exactAlarms = await canUseExactAlarms();
  let batteryUnrestricted = true;
  if (Platform.OS === 'android') {
    try {
      batteryUnrestricted = !(await Battery.isBatteryOptimizationEnabledAsync());
    } catch {
      batteryUnrestricted = true;
    }
  }
  return { notifications, exactAlarms, batteryUnrestricted };
}

export function isReliable(r: Reliability) {
  return r.notifications && r.exactAlarms && r.batteryUnrestricted;
}

const pkg = () => Constants.expoConfig?.android?.package ?? 'com.skipsonik.islamiyasam';

export async function requestExactAlarms() {
  try {
    await Notifications.requestExactAlarmPermissionsAsync();
  } catch {
    await openAppSettings();
  }
}

export async function requestBatteryExemption() {
  try {
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, {
      data: `package:${pkg()}`,
    });
  } catch {
    try {
      await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
    } catch {
      await openAppSettings();
    }
  }
}

export async function openAppSettings() {
  try {
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, {
      data: `package:${pkg()}`,
    });
  } catch {
    // yok say
  }
}
