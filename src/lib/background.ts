import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { setCurrentLang, type Lang } from '@/i18n';

import { resolveCalc } from './calc';
import type { Place } from './location';
import { rescheduleAll } from './notifications';
import type { MethodKey } from './prayer';
import { loadValue } from './storage';

// Uygulama hiç açılmasa bile bildirim planını günceller: Android günde
// birkaç kez bu görevi çalıştırır ve önümüzdeki 7 günün bildirimleri yeniden kurulur.
const TASK = 'vakit-bildirimlerini-yenile';

type Stored = {
  place?: Place;
  notify?: Parameters<typeof rescheduleAll>[2];
  lang?: Lang | null;
  method?: MethodKey | 'auto';
  hijriOffset?: number;
};

// Görev tanımı modül yüklenirken (en üst seviyede) yapılmalı.
TaskManager.defineTask(TASK, async () => {
  try {
    const s = await loadValue<Stored | null>('settings-v1', null);
    if (!s?.place || !s.notify) return BackgroundTask.BackgroundTaskResult.Success;
    if (s.lang) setCurrentLang(s.lang);
    const calc = resolveCalc({ method: s.method ?? 'auto', place: s.place, lang: s.lang ?? null });
    await rescheduleAll(s.place.lat, s.place.lng, s.notify, false, calc, s.hijriOffset ?? 0);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundRefresh() {
  try {
    if (await TaskManager.isTaskRegisteredAsync(TASK)) return;
    await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 6 * 60 });
  } catch {
    // arka plan görevi desteklenmiyorsa uygulama açılışındaki planlama yeterli
  }
}
