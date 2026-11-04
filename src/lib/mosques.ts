import { loadValue, saveJSON } from './storage';

// Yakındaki camiler: OpenStreetMap verisi, Overpass API üzerinden (ücretsiz, anahtar gerekmez).
// Ana sunucu yoğunsa sıradaki yedeğe geçilir.
const SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

export type Mosque = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number; // metre
  bearing: number; // derece
  address?: string;
};

type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function query(lat: number, lng: number, radius: number) {
  return `[out:json][timeout:20];
(
  nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lng});
  nwr["building"="mosque"](around:${radius},${lat},${lng});
);
out center tags 150;`;
}

async function fetchWithTimeout(url: string, body: string, ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: `data=${encodeURIComponent(body)}`,
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

async function overpass(q: string): Promise<OsmElement[]> {
  let lastErr: unknown = null;
  for (const url of SERVERS) {
    try {
      const res = await fetchWithTimeout(url, q, 20000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return (json.elements ?? []) as OsmElement[];
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('Sunucuya ulaşılamadı');
}

const toRad = (d: number) => (d * Math.PI) / 180;

export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const DIRS = ['kuzey', 'kuzeydoğu', 'doğu', 'güneydoğu', 'güney', 'güneybatı', 'batı', 'kuzeybatı'];
export function directionName(bearing: number) {
  return DIRS[Math.round(bearing / 45) % 8];
}

function toMosque(e: OsmElement, lat: number, lng: number): Mosque | null {
  const p = e.center ?? (e.lat != null && e.lon != null ? { lat: e.lat, lon: e.lon } : null);
  if (!p) return null;
  const t = e.tags ?? {};
  // Cami olmayan ibadet yerlerini (ör. kilise binası etiketi yanlışsa) ele
  if (t.religion && t.religion !== 'muslim') return null;
  const name = t['name:tr'] || t.name || (t.building === 'mosque' || t.religion === 'muslim' ? 'Cami' : '');
  if (!name) return null;
  const street = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
  const area = t['addr:neighbourhood'] || t['addr:suburb'] || t['addr:district'];
  return {
    id: `${e.type}/${e.id}`,
    name,
    lat: p.lat,
    lng: p.lon,
    distance: distanceM(lat, lng, p.lat, p.lon),
    bearing: bearingDeg(lat, lng, p.lat, p.lon),
    address: [area, street].filter(Boolean).join(', ') || undefined,
  };
}

// Aynı caminin bina ve nokta olarak iki kez işaretlendiği durumları birleştir.
function dedupe(list: Mosque[]) {
  const out: Mosque[] = [];
  for (const m of list.sort((a, b) => a.distance - b.distance)) {
    const dup = out.find((o) => distanceM(o.lat, o.lng, m.lat, m.lng) < 60);
    if (dup) {
      if (dup.name === 'Cami' && m.name !== 'Cami') dup.name = m.name;
      if (!dup.address && m.address) dup.address = m.address;
      continue;
    }
    out.push(m);
  }
  return out;
}

export async function findNearbyMosques(lat: number, lng: number): Promise<Mosque[]> {
  let list: Mosque[] = [];
  // Önce 2 km; az sonuç çıkarsa 6 km'ye genişlet.
  for (const radius of [2000, 6000]) {
    const els = await overpass(query(lat, lng, radius));
    list = dedupe(els.map((e) => toMosque(e, lat, lng)).filter((m): m is Mosque => m != null));
    if (list.length >= 5) break;
  }
  const result = list.slice(0, 40);
  saveJSON('camiler-son', { lat, lng, at: Date.now(), list: result });
  return result;
}

export async function loadCachedMosques() {
  return loadValue<{ lat: number; lng: number; at: number; list: Mosque[] } | null>('camiler-son', null);
}

export function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

export function walkMinutes(m: number) {
  // Yol, kuş uçuşundan ~%30 uzun; yürüme 4,8 km/sa
  return Math.max(1, Math.round((m * 1.3) / 80));
}
