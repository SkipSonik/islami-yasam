import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { rescheduleAll } from './notifications';
import { loadValue } from './storage';

// Uygulama hiç açılmasa bile bildirim planını günceller: Android günde
// birkaç kez bu görevi çalıştırır ve önümüzdeki 7 günün bildirimleri yeniden kurulur.
const TASK = 'vakit-bildirimlerini-yenile';

type Stored = {
  place?: { lat: number; lng: number };
  notify?: Parameters<typeof rescheduleAll>[2];
};

// Görev tanımı modül yüklenirken (en üst seviyede) yapılmalı.
TaskManager.defineTask(TASK, async () => {
  try {
    const s = await loadValue<Stored | null>('settings-v1', null);
    if (!s?.place || !s.notify) return BackgroundTask.BackgroundTaskResult.Success;
    await rescheduleAll(s.place.lat, s.place.lng, s.notify, false);
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
