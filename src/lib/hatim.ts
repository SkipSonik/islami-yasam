import Constants from 'expo-constants';

import { loadJSON, loadValue, saveJSON } from '@/lib/storage';

// ---------- Kişisel hatim ----------

export type PersonalHatim = { read: boolean[]; completed: number };
const PERSONAL_KEY = 'hatim-kisisel-v1';
export const EMPTY_PERSONAL: PersonalHatim = { read: Array(30).fill(false), completed: 0 };

export async function loadPersonal(): Promise<PersonalHatim> {
  const p = await loadJSON<PersonalHatim>(PERSONAL_KEY, EMPTY_PERSONAL);
  const read = Array.from({ length: 30 }, (_, i) => !!p.read?.[i]);
  return { read, completed: Number(p.completed) || 0 };
}

export function savePersonal(p: PersonalHatim) {
  return saveJSON(PERSONAL_KEY, p);
}

// ---------- Ortak hatim (sunucu) ----------

export type Part = { juz: number; status: 0 | 1 | 2; name: string; mine: boolean };
export type SharedHatim = {
  code: string;
  title: string;
  niyet: string;
  creatorName: string;
  round: number;
  completedRounds: number;
};
export type HatimView = { hatim: SharedHatim; parts: Part[]; finished?: boolean };

export class HatimError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

const API: string =
  (Constants.expoConfig?.extra as { hatimApi?: string } | undefined)?.hatimApi ??
  'https://mix.gen.tr/islamiyasam/hatim/api.php';

let deviceCache: string | null = null;

/** Bu cihaza özel rastgele kimlik; cüz sahipliği için kullanılır. */
export async function deviceId(): Promise<string> {
  if (deviceCache) return deviceCache;
  let id = await loadValue<string | null>('cihaz-kimligi', null);
  if (!id || !/^[A-Za-z0-9-]{8,40}$/.test(id)) {
    const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
    id = `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
    await saveJSON('cihaz-kimligi', id);
  }
  deviceCache = id;
  return id;
}

async function call(action: string, body?: Record<string, unknown>, query = ''): Promise<HatimView> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(`${API}?a=${action}${query}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch {
    throw new HatimError('net');
  } finally {
    clearTimeout(timer);
  }
  let data: { ok?: boolean; error?: string } & Partial<HatimView>;
  try {
    data = await res.json();
  } catch {
    throw new HatimError('net');
  }
  if (!data.ok || !data.hatim || !data.parts) throw new HatimError(data.error ?? 'generic');
  return { hatim: data.hatim, parts: data.parts, finished: data.finished };
}

export async function getHatim(code: string) {
  const device = await deviceId();
  return call('get', undefined, `&code=${encodeURIComponent(code)}&device=${encodeURIComponent(device)}`);
}

export async function createHatim(title: string, niyet: string, name: string) {
  return call('create', { title, niyet, name, device: await deviceId() });
}

export async function takeJuz(code: string, juz: number, name: string) {
  return call('take', { code, juz, name, device: await deviceId() });
}

export async function finishJuz(code: string, juz: number) {
  return call('done', { code, juz, device: await deviceId() });
}

export async function releaseJuz(code: string, juz: number) {
  return call('release', { code, juz, device: await deviceId() });
}

/** Hata kodunu kullanıcıya gösterilecek metin anahtarına çevirir */
export function errorKey(e: unknown) {
  const c = e instanceof HatimError ? e.code : 'generic';
  if (c === 'net' || c === 'db') return 'hatim.err.net' as const;
  if (c === 'taken') return 'hatim.err.taken' as const;
  if (c === 'not_found') return 'hatim.err.notFound' as const;
  if (c === 'rate_limit') return 'hatim.err.rate' as const;
  return 'hatim.err.generic' as const;
}

// ---------- Katılınan ortak hatimler (cihazda) ----------

export type JoinedHatim = { code: string; title: string };
const JOINED_KEY = 'ortak-hatimler-v1';
const NAME_KEY = 'hatim-adim';

export const loadJoined = () => loadValue<JoinedHatim[]>(JOINED_KEY, []);

export async function rememberHatim(h: JoinedHatim) {
  const list = await loadJoined();
  const next = [h, ...list.filter((x) => x.code !== h.code)];
  await saveJSON(JOINED_KEY, next);
  return next;
}

export async function forgetHatim(code: string) {
  const next = (await loadJoined()).filter((x) => x.code !== code);
  await saveJSON(JOINED_KEY, next);
  return next;
}

export const loadName = () => loadValue<string>(NAME_KEY, '');
export const saveName = (n: string) => saveJSON(NAME_KEY, n.trim());

export function normalizeCode(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}
