import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getDayTimes, PRAYERS, type PrayerKey } from './prayer';

const CHANNEL = 'namaz-vakitleri';
const DAYS_AHEAD = 5;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Namaz vakitleri',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 300, 200, 300],
    });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export type NotifySettings = {
  enabled: Record<PrayerKey, boolean>;
  remindBefore: number; // dakika, 0 = kapalı
};

// Tüm planlı bildirimleri silip önümüzdeki günler için yeniden kurar.
// Uygulama her açıldığında ve ayar değiştiğinde çağrılır.
export async function rescheduleAll(lat: number, lng: number, s: NotifySettings) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const anyOn = Object.values(s.enabled).some(Boolean);
  if (!anyOn) return 0;
  if (!(await ensureNotificationPermission())) return -1;

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
        await schedule(t, `${p.label} vakti`, vaktiMetni(p.key));
        count++;
      }
      if (s.remindBefore > 0) {
        const r = t - s.remindBefore * 60 * 1000;
        if (r > now) {
          await schedule(r, `${p.label} vaktine ${s.remindBefore} dakika`, `${p.label} vakti yaklaşıyor.`);
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

function schedule(time: number, title: string, body: string) {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: time,
      channelId: CHANNEL,
    },
  });
}
