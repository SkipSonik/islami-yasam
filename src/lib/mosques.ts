import { currentLang, t as tr } from '@/i18n';

import { loadValue, saveJSON } from './storage';

// Yakındaki camiler: OpenStreetMap verisi, Overpass API üzerinden (ücretsiz, anahtar gerekmez).
// Ücretsiz sunucular yoğunken 20-40 sn'de cevap verebiliyor; bu yüzden hepsine aynı anda
// sorulur ve ilk gelen başarılı cevap kullanılır.
const SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const TIMEOUT_MS = 60000;

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
  return `[out:json][timeout:50];nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat.toFixed(5)},${lng.toFixed(5)});out center tags 120;`;
}

// Tüm sunuculara aynı anda sorar; ilk başarılı cevabı döndürür, diğerlerini iptal eder.
function overpass(q: string): Promise<OsmElement[]> {
  return new Promise((resolve, reject) => {
    const ctrls = SERVERS.map(() => new AbortController());
    let failed = 0;
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      ctrls.forEach((c) => c.abort());
      reject(new Error('Zaman aşımı'));
    }, TIMEOUT_MS);

    SERVERS.forEach((url, i) => {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: `data=${encodeURIComponent(q)}`,
        signal: ctrls[i].signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (!Array.isArray(json?.elements)) throw new Error('Geçersiz cevap');
          return json.elements as OsmElement[];
        })
        .then((els) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          ctrls.forEach((c, j) => j !== i && c.abort());
          resolve(els);
        })
        .catch((e) => {
          failed++;
          if (!done && failed === SERVERS.length) {
            done = true;
            clearTimeout(timer);
            reject(e);
          }
        });
    });
  });
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


function toMosque(e: OsmElement, lat: number, lng: number): Mosque | null {
  const p = e.center ?? (e.lat != null && e.lon != null ? { lat: e.lat, lon: e.lon } : null);
  if (!p) return null;
  const t = e.tags ?? {};
  // Cami olmayan ibadet yerlerini (ör. kilise binası etiketi yanlışsa) ele
  if (t.religion && t.religion !== 'muslim') return null;
  const lang = currentLang();
  const name = t[`name:${lang}`] || t.name || t['name:en'] || (t.religion === 'muslim' ? tr('mosques.defaultName') : '');
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
      const generic = tr('mosques.defaultName');
      if (dup.name === generic && m.name !== generic) dup.name = m.name;
      if (!dup.address && m.address) dup.address = m.address;
      continue;
    }
    out.push(m);
  }
  return out;
}

export async function findNearbyMosques(lat: number, lng: number): Promise<Mosque[]> {
  // Tek sorgu 3 km; çok az sonuç çıkarsa (kırsal bölge) 10 km'ye genişlet.
  const toList = (els: OsmElement[]) =>
    dedupe(els.map((e) => toMosque(e, lat, lng)).filter((m): m is Mosque => m != null));
  let list = toList(await overpass(query(lat, lng, 3000)));
  if (list.length < 3) list = toList(await overpass(query(lat, lng, 10000)));
  const result = list.slice(0, 40);
  saveJSON('camiler-son', { lat, lng, at: Date.now(), list: result });
  return result;
}

export async function loadCachedMosques() {
  return loadValue<{ lat: number; lng: number; at: number; list: Mosque[] } | null>('camiler-son', null);
}

export function formatDistance(m: number) {
  const comma = ['tr', 'de', 'fr', 'ru', 'id'].includes(currentLang());
  const km = (m / 1000).toFixed(1);
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${comma ? km.replace('.', ',') : km} km`;
}

export function walkMinutes(m: number) {
  // Yol, kuş uçuşundan ~%30 uzun; yürüme 4,8 km/sa
  return Math.max(1, Math.round((m * 1.3) / 80));
}
