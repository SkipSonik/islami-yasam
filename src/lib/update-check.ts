import Constants from 'expo-constants';

import { createStore } from '@/lib/store';

// Sürüm kontrolü: uygulama günde en fazla bir kez namazyolu.com/icerik/surum.json dosyasını okur.
// Dosya yönetim panelindeki "Sürüm" sekmesinden yazılır:
//   { min: "0.9.1", latest: "0.9.2", messageTr: "...", messageEn: "..." }
// - Kullanıcının sürümü min'den eskiyse güncelleme zorunludur (pencere kapatılamaz).
// - latest'ten eskiyse nazik bir "Güncelle" penceresi gösterilir; kullanıcı "Sonra" diyebilir.

export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.skipsonik.islamiyasam';
export const MARKET_URL = 'market://details?id=com.skipsonik.islamiyasam';

const BASE = (
  ((Constants.expoConfig?.extra as { messagesBase?: string } | undefined)?.messagesBase ??
    'https://namazyolu.com/mesajlar/') as string
).replace(/mesajlar\/$/, 'icerik/');

export type VersionInfo = { min?: string; latest?: string; messageTr?: string; messageEn?: string };
export type UpdateState = { info: VersionInfo | null; checkedAt: number; dismissedFor: string };

export const updateStore = createStore<UpdateState>('surum-v1', { info: null, checkedAt: 0, dismissedFor: '' });

const DAY = 24 * 60 * 60 * 1000;

export const currentVersion = (): string => Constants.expoConfig?.version ?? '0.0.0';

/** "0.9.10" > "0.9.2" gibi sayısal karşılaştırma. a<b ise negatif. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0);
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export async function checkForUpdate(force = false) {
  await updateStore.ready;
  const s = updateStore.get();
  if (!force && Date.now() - s.checkedAt < DAY) return;
  try {
    const res = await fetch(`${BASE}surum.json?t=${Math.floor(Date.now() / (60 * 60 * 1000))}`);
    if (!res.ok) return;
    const info = (await res.json()) as VersionInfo;
    updateStore.set((p) => ({ ...p, info, checkedAt: Date.now() }));
  } catch {
    // internet yoksa sonraki açılışta tekrar denenir
  }
}

export type UpdateNeed = 'none' | 'optional' | 'required';

export function updateNeed(s: UpdateState, version = currentVersion()): UpdateNeed {
  const info = s.info;
  if (!info) return 'none';
  if (info.min && compareVersions(version, info.min) < 0) return 'required';
  if (info.latest && compareVersions(version, info.latest) < 0 && s.dismissedFor !== info.latest) return 'optional';
  return 'none';
}
