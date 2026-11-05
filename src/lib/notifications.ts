import * as Battery from 'expo-battery';
import Constants from 'expo-constants';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { t } from '@/i18n';

import { getDayTimes, PRAYER_KEYS, type CalcConfig, type PrayerKey } from './prayer';
import { channelFor, soundDef, SOUNDS, type SoundId } from './sounds';

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
};

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
) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const anyOn = Object.values(s.enabled).some(Boolean);
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
  }
  return count;
}

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
