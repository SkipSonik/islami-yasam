import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { Lang } from '@/i18n';
import { upcomingReligiousDays, type RelDayKey } from '@/lib/religious-days';
import { startOfDay } from '@/lib/dates';
import { createStore } from '@/lib/store';

// Resimli mesajlar sunucuda (Hostinger) durur; uygulama listeyi indirip önbelleğe alır.
// Yeni resim eklemek için yalnızca sunucudaki liste.json güncellenir, uygulama güncellemesi gerekmez.

export const MESSAGES_BASE =
  (Constants.expoConfig?.extra as { messagesBase?: string } | undefined)?.messagesBase ??
  'https://mix.gen.tr/islamiyasam/mesajlar/';

export type MsgCat = {
  id: string;
  icon?: string;
  name: Partial<Record<Lang, string>> & { tr: string; en: string };
};

export type MsgItem = {
  id: string;
  cat: string;
  /** Ücretsiz kullanıcılar da görüp paylaşabilir */
  free: boolean;
  /** Varsayılan: img/{id}.jpg ve thumb/{id}.jpg */
  file?: string;
  thumb?: string;
};

export type MsgList = { v: number; updated?: string; cats: MsgCat[]; items: MsgItem[] };

type Cache = { list: MsgList | null; fetchedAt: number };
export const messagesStore = createStore<Cache>('mesajlar-v1', { list: null, fetchedAt: 0 });

const STALE_MS = 6 * 60 * 60 * 1000;

export async function loadMessages(force = false): Promise<MsgList> {
  await messagesStore.ready;
  const c = messagesStore.get();
  if (!force && c.list && Date.now() - c.fetchedAt < STALE_MS) return c.list;
  try {
    const res = await fetch(`${MESSAGES_BASE}liste.json?t=${Math.floor(Date.now() / STALE_MS)}`);
    if (!res.ok) throw new Error(String(res.status));
    const list = (await res.json()) as MsgList;
    if (!Array.isArray(list.items) || !Array.isArray(list.cats)) throw new Error('bad list');
    messagesStore.set({ list, fetchedAt: Date.now() });
    return list;
  } catch (e) {
    if (c.list) return c.list;
    throw e;
  }
}

export const imageUrl = (it: MsgItem) => `${MESSAGES_BASE}${it.file ?? `img/${it.id}.jpg`}`;
export const thumbUrl = (it: MsgItem) => `${MESSAGES_BASE}${it.thumb ?? `thumb/${it.id}.jpg`}`;

export const catName = (c: MsgCat, lang: Lang) => c.name[lang] ?? (lang === 'tr' ? c.name.tr : c.name.en);

/** Resmi indirip telefonun paylaşım ekranını açar (WhatsApp, Instagram, galeriye kaydet…). */
export async function shareImage(it: MsgItem, title?: string) {
  const dest = new File(Paths.cache, `islami-yasam-${it.id}.jpg`);
  if (!dest.exists) await File.downloadFileAsync(imageUrl(it), dest);
  await Sharing.shareAsync(dest.uri, { mimeType: 'image/jpeg', dialogTitle: title, UTI: 'public.jpeg' });
}

const DAY_CAT: Partial<Record<RelDayKey, string>> = {
  mawlid: 'kandil',
  raghaib: 'kandil',
  miraj: 'kandil',
  barat: 'kandil',
  qadr: 'kandil',
  ramadan: 'ramazan',
  eidFitrEve: 'bayram',
  eidFitr: 'bayram',
  eidAdhaEve: 'bayram',
  eidAdha: 'bayram',
  hijriNewYear: 'ozel',
  ashura: 'ozel',
  threeMonths: 'ozel',
};

/** Bugüne uygun kategori: dini gün (önceki gün dahil) > Ramazan > Cuma (perşembe akşamı dahil). */
export function suggestedCat(now: Date, hijriOffset = 0): string | null {
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + 86400000);
  for (const d of upcomingReligiousDays(today, hijriOffset, 1)) {
    const start = startOfDay(d.date).getTime();
    const end = start + d.days * 86400000;
    const hit = (t: number) => t >= start && t < end;
    if (hit(today.getTime()) || hit(tomorrow.getTime())) {
      const c = DAY_CAT[d.key];
      if (c) return c;
    }
  }
  const dow = now.getDay();
  if (dow === 5 || (dow === 4 && now.getHours() >= 15)) return 'cuma';
  return null;
}
