import * as Battery from 'expo-battery';
import Constants from 'expo-constants';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getDayTimes, PRAYERS, type PrayerKey } from './prayer';

const CHANNEL = 'namaz-vakitleri';
const DAYS_AHEAD = 7;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Namaz vakitleri',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 300, 200, 300],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });
}

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
export async function rescheduleAll(lat: number, lng: number, s: NotifySettings, askPermission = true) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const anyOn = Object.values(s.enabled).some(Boolean);
  if (!anyOn) return 0;

  if (askPermission) {
    if (!(await ensureNotificationPermission())) return -1;
  } else {
    await ensureChannel();
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
    const times = getDayTimes(lat, lng, d);
    for (const p of PRAYERS) {
      if (!s.enabled[p.key]) continue;
      const t = times[p.key].getTime();

      if (t > now) {
        await schedule(t, `${p.label} vakti`, vaktiMetni(p.key), delivery);
        count++;
      }
      if (s.remindBefore > 0) {
        const r = t - s.remindBefore * 60 * 1000;
        if (r > now) {
          await schedule(r, `${p.label} vaktine ${s.remindBefore} dakika`, `${p.label} vakti yaklaşıyor.`, delivery);
          count++;
        }
      }
    }
  }
  return count;
}

function vaktiMetni(k: PrayerKey) {
  if (k === 'imsak') return 'İmsak vakti girdi.';
  if (k === 'gunes') return 'Güneş doğdu, sabah namazının vakti çıktı.';
  return 'Namaz vakti girdi.';
}

function schedule(time: number, title: string, body: string, delivery: 'alarmClock' | 'bestEffort') {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: time,
      channelId: CHANNEL,
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
