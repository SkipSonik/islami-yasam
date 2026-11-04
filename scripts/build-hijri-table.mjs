// Hicri ay başlangıçlarını astronomik olarak hesaplayıp src/data/hijri-months.json'a yazar.
//
// Ölçüt: Diyanet'in de uyguladığı 2016 İstanbul Uluslararası Hicri Takvim Birliği
// Kongresi kararı. Yeni ay, dünyanın herhangi bir yerinde 00:00 UTC'den önce güneş
// batarken Ay'ın Güneş'ten açısal uzaklığı (elongasyon) en az 8°, ufuktan yüksekliği
// en az 5° olduğu günün ertesi günü başlar. İstisna: şart 00:00 UTC'den sonra
// sadece Amerika kıtasında sağlanıyorsa ve kavuşum (içtima) Yeni Zelanda'da fecirden
// önce olmuşsa ay yine ertesi gün başlar.
//
// Astronomi: J. Meeus, "Astronomical Algorithms" (2. baskı) bölüm 25, 47, 49 —
// kısaltılmış seriler; Ay için ~0.05°, yeni ay anı için birkaç dakika doğruluk.
//
// Kullanım: node scripts/build-hijri-table.mjs [--check]

import { writeFileSync } from 'node:fs';

const D2R = Math.PI / 180;
const sin = (d) => Math.sin(d * D2R);
const cos = (d) => Math.cos(d * D2R);
const norm = (d) => ((d % 360) + 360) % 360;
const asinD = (x) => Math.asin(Math.max(-1, Math.min(1, x))) / D2R;
const atan2D = (y, x) => Math.atan2(y, x) / D2R;

// ---------- Zaman ----------
const jdFromDate = (y, m, d) => {
  // 00:00 UTC
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
};
const dateFromJd = (jd) => {
  const z = Math.floor(jd + 0.5);
  const a = Math.floor((z - 1867216.25) / 36524.25);
  const b = z + 1 + a - Math.floor(a / 4) + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return { y: year, m: month, d: day };
};
const iso = (jd) => {
  const { y, m, d } = dateFromJd(jd);
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};
// Delta T (saniye), 2005–2100 için Espenak-Meeus polinomu
const deltaT = (jd) => {
  const y = 2000 + (jd - 2451545) / 365.25;
  if (y < 2050) {
    const t = y - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t * t;
  }
  return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y);
};
const gmst = (jdUT) => {
  const T = (jdUT - 2451545) / 36525;
  return norm(280.46061837 + 360.98564736629 * (jdUT - 2451545) + 0.000387933 * T * T);
};

// ---------- Güneş ----------
function sun(jdUT) {
  const T = (jdUT + deltaT(jdUT) / 86400 - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T;
  const M = 357.52911 + 35999.05029 * T;
  const C = (1.914602 - 0.004817 * T) * sin(M) + 0.019993 * sin(2 * M) + 0.000289 * sin(3 * M);
  const om = 125.04 - 1934.136 * T;
  const lambda = norm(L0 + C - 0.00569 - 0.00478 * sin(om));
  const eps = 23.439291 - 0.0130042 * T + 0.00256 * cos(om);
  const ra = norm(atan2D(cos(eps) * sin(lambda), cos(lambda)));
  const dec = asinD(sin(eps) * sin(lambda));
  return { lambda, beta: 0, ra, dec, eps };
}

// ---------- Ay (Meeus bölüm 47, en büyük terimler) ----------
// [D, M, M', F, Σl katsayısı (1e-6 derece), Σr katsayısı (1e-3 km)]
const LR = [
  [0, 0, 1, 0, 6288774, -20905355], [2, 0, -1, 0, 1274027, -3699111], [2, 0, 0, 0, 658314, -2955968],
  [0, 0, 2, 0, 213618, -569925], [0, 1, 0, 0, -185116, 48888], [0, 0, 0, 2, -114332, -3149],
  [2, 0, -2, 0, 58793, 246158], [2, -1, -1, 0, 57066, -152138], [2, 0, 1, 0, 53322, -170733],
  [2, -1, 0, 0, 45758, -204586], [0, 1, -1, 0, -40923, -129620], [1, 0, 0, 0, -34720, 108743],
  [0, 1, 1, 0, -30383, 104755], [2, 0, 0, -2, 15327, 10321], [0, 0, 1, 2, -12528, 0],
  [0, 0, 1, -2, 10980, 79661], [4, 0, -1, 0, 10675, -34782], [0, 0, 3, 0, 10034, -23210],
  [4, 0, -2, 0, 8548, -21636], [2, 1, -1, 0, -7888, 24208], [2, 1, 0, 0, -6766, 30824],
  [1, 0, -1, 0, -5163, -8379], [1, 1, 0, 0, 4987, -16675], [2, -1, 1, 0, 4036, -12831],
  [2, 0, 2, 0, 3994, -10445], [4, 0, 0, 0, 3861, -11650], [2, 0, -3, 0, 3665, 14403],
  [0, 1, -2, 0, -2689, -7003], [2, 0, -1, 2, -2602, 0], [2, -1, -2, 0, 2390, 10056],
  [1, 0, 1, 0, -2348, 6322], [2, -2, 0, 0, 2236, -9884], [0, 1, 2, 0, -2120, 5751],
  [0, 2, 0, 0, -2069, 0], [2, -2, -1, 0, 2048, -4950], [2, 0, 1, -2, -1773, 4130],
  [2, 0, 0, 2, -1595, 0], [4, -1, -1, 0, 1215, -3958], [0, 0, 2, 2, -1110, 0],
  [3, 0, -1, 0, -892, 3258], [2, 1, 1, 0, -810, 2616], [4, -1, -2, 0, 759, -1897],
  [0, 2, -1, 0, -713, -2117], [2, 2, -1, 0, -700, 2354], [2, 1, -2, 0, 691, 0],
  [2, -1, 0, -2, 596, 0], [4, 0, 1, 0, 549, -1423], [0, 0, 4, 0, 537, -1117],
  [4, -1, 0, 0, 520, -1571], [1, 0, -2, 0, -487, -1739],
];
// [D, M, M', F, Σb katsayısı]
const B = [
  [0, 0, 0, 1, 5128122], [0, 0, 1, 1, 280602], [0, 0, 1, -1, 277693], [2, 0, 0, -1, 173237],
  [2, 0, -1, 1, 55413], [2, 0, -1, -1, 46271], [2, 0, 0, 1, 32573], [0, 0, 2, 1, 17198],
  [2, 0, 1, -1, 9266], [0, 0, 2, -1, 8822], [2, -1, 0, -1, 8216], [2, 0, -2, -1, 4324],
  [2, 0, 1, 1, 4200], [2, 1, 0, -1, -3359], [2, -1, -1, 1, 2463], [2, -1, 0, 1, 2211],
  [2, -1, -1, -1, 2065], [0, 1, -1, -1, -1870], [4, 0, -1, -1, 1828], [0, 1, 0, 1, -1794],
];

function moon(jdUT) {
  const T = (jdUT + deltaT(jdUT) / 86400 - 2451545) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  const M = 357.5291092 + 35999.0502909 * T;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
  const A1 = 119.75 + 131.849 * T;
  const A2 = 53.09 + 479264.29 * T;
  const A3 = 313.45 + 481266.484 * T;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  let sl = 0;
  let sr = 0;
  let sb = 0;
  for (const [d, m, mp, f, l, r] of LR) {
    const arg = d * D + m * M + mp * Mp + f * F;
    const e = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
    sl += l * e * sin(arg);
    sr += r * e * cos(arg);
  }
  for (const [d, m, mp, f, b] of B) {
    const e = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
    sb += b * e * sin(d * D + m * M + mp * Mp + f * F);
  }
  sl += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2);
  sb += -2235 * sin(Lp) + 382 * sin(A3) + 175 * sin(A1 - F) + 175 * sin(A1 + F) + 127 * sin(Lp - Mp) - 115 * sin(Lp + Mp);
  const om = 125.04452 - 1934.136261 * T;
  const lambda = norm(Lp + sl / 1e6 - 0.00478 * sin(om)); // + nütasyon (boylam)
  const beta = sb / 1e6;
  const dist = 385000.56 + sr / 1000;
  const eps = 23.439291 - 0.0130042 * T + 0.00256 * cos(om);
  const ra = norm(atan2D(sin(lambda) * cos(eps) - (Math.tan(beta * D2R) * sin(eps)), cos(lambda)));
  const dec = asinD(sin(beta) * cos(eps) + cos(beta) * sin(eps) * sin(lambda));
  return { lambda, beta, ra, dec, dist };
}

// ---------- Yeni ay (Meeus bölüm 49) ----------
function newMoon(k) {
  const T = k / 1236.85;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T ** 3;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const M = 2.5534 + 29.1053567 * k - 0.0000014 * T * T;
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T * T;
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T * T;
  const Om = 124.7746 - 1.56375588 * k + 0.0020672 * T * T;
  jde +=
    -0.4072 * sin(Mp) + 0.17241 * E * sin(M) + 0.01608 * sin(2 * Mp) + 0.01039 * sin(2 * F) +
    0.00739 * E * sin(Mp - M) - 0.00514 * E * sin(Mp + M) + 0.00208 * E * E * sin(2 * M) -
    0.00111 * sin(Mp - 2 * F) - 0.00057 * sin(Mp + 2 * F) + 0.00056 * E * sin(2 * Mp + M) -
    0.00042 * sin(3 * Mp) + 0.00042 * E * sin(M + 2 * F) + 0.00038 * E * sin(M - 2 * F) -
    0.00024 * E * sin(2 * Mp - M) - 0.00017 * sin(Om) - 0.00007 * sin(Mp + 2 * M);
  return jde - deltaT(jde) / 86400; // UT
}

// ---------- Ufuk koordinatları ----------
function altitude(ra, dec, jdUT, lat, lon) {
  const H = gmst(jdUT) + lon - ra;
  return asinD(sin(lat) * sin(dec) + cos(lat) * cos(dec) * cos(H));
}

/** Güneşin verilen yüksekliğe indiği (akşam) ya da çıktığı (sabah) an. */
function sunEvent(jd0, lat, lon, alt, evening) {
  // jd0: o günün 00:00 UTC'si; yerel öğle civarından başla
  let t = jd0 + 0.5 - lon / 360;
  for (let i = 0; i < 4; i++) {
    const s = sun(t);
    const cosH0 = (sin(alt) - sin(lat) * sin(s.dec)) / (cos(lat) * cos(s.dec));
    if (cosH0 < -1 || cosH0 > 1) return null; // kutup günü/gecesi
    const H0 = Math.acos(cosH0) / D2R;
    const target = evening ? H0 : -H0;
    let H = gmst(t) + lon - s.ra;
    H = ((H + 540) % 360) - 180;
    let diff = target - H;
    diff = ((diff + 540) % 360) - 180;
    t += diff / 360.9856;
  }
  return t;
}

function elongation(m, s) {
  return Math.acos(cos(m.beta) * cos(m.lambda - s.lambda)) / D2R;
}

/** Ay'ın topo-merkezli (havasız) yüksekliği */
function moonAltTopo(m, jd, lat, lon) {
  const g = altitude(m.ra, m.dec, jd, lat, lon);
  const par = asinD(6378.14 / m.dist);
  return g - par * cos(g);
}

function visibleAt(jd0, lat, lon) {
  const ss = sunEvent(jd0, lat, lon, -0.8333, true);
  if (ss == null) return null;
  const s = sun(ss);
  const m = moon(ss);
  // Ay Güneş'in doğusunda olmalı (kavuşum geçmiş)
  if (norm(m.lambda - s.lambda) > 180) return null;
  if (elongation(m, s) < 8) return null;
  if (moonAltTopo(m, ss, lat, lon) < 5) return null;
  return ss;
}

/** Amerika anakarası (adalar hariç), kaba sınırlar */
function inAmericas(lat, lon) {
  if (lat >= 56 && lat <= 72) return lon >= -166 && lon <= -60; // Alaska, Kanada
  if (lat >= 49 && lat < 56) return lon >= -132 && lon <= -55;
  if (lat >= 32 && lat < 49) return lon >= -125 && lon <= -66;
  if (lat >= 15 && lat < 32) return lon >= -117 && lon <= -80;
  if (lat >= 7 && lat < 15) return lon >= -93 && lon <= -77;
  if (lat >= -56 && lat < 7) return lon >= -81 && lon <= -34;
  return false;
}

/** D gününün (jd0 = 00:00 UTC) akşamı şart sağlanıyor mu? */
function criterionMet(jd0, conjUT) {
  const midnight = jd0 + 1;
  let america = false;
  for (let lat = -60; lat <= 60; lat += 2) {
    for (let lon = -180; lon <= 180; lon += 2) {
      const ss = visibleAt(jd0, lat, lon);
      if (ss == null) continue;
      if (ss < midnight) return true;
      if (inAmericas(lat, lon)) america = true;
    }
  }
  if (!america) return false;
  // Yeni Zelanda (Wellington) ertesi günün fecri: güneş −18°
  const fajrNZ = sunEvent(jd0 + 1, -41.29, 174.78, -18, false);
  return fajrNZ != null && conjUT < fajrNZ;
}

/** Kavuşumdan sonra ayın başladığı günün 00:00 UTC Julian günü */
function monthStart(conjUT) {
  let jd0 = Math.floor(conjUT - 0.5) + 0.5; // kavuşum gününün 00:00 UTC
  for (let i = 0; i < 4; i++, jd0 += 1) {
    if (criterionMet(jd0, conjUT)) return jd0 + 1;
  }
  return jd0;
}

// ---------- Tablo ----------
// Çapa: 1 Muharrem 1448 kavuşumu 2026-06-15 civarı
const ANCHOR_YEAR = 1448;
const kAnchor = Math.round((2026.455 - 2000) * 12.3685);
const FIRST_YEAR = 1440;
const LAST_YEAR = 1500;

const starts = [];
for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
  for (let mo = 1; mo <= 12; mo++) {
    const k = kAnchor + (y - ANCHOR_YEAR) * 12 + (mo - 1);
    const conj = newMoon(k);
    starts.push(Math.round(monthStart(conj) + 0.5)); // tam sayı JDN (öğlen)
  }
}

const check = process.argv.includes('--check');
const at = (y, m) => starts[(y - FIRST_YEAR) * 12 + (m - 1)];
const name = (y, m) => `${m}/${y}`;

// Diyanet'in yayımladığı tarihler (ay başı, 1. gün)
const KNOWN = [
  [1446, 9, '2025-03-01'], [1446, 10, '2025-03-30'], [1446, 12, '2025-05-28'],
  [1447, 1, '2025-06-26'], [1447, 3, '2025-08-24'], [1447, 7, '2025-12-21'],
  [1447, 8, '2026-01-20'], [1447, 9, '2026-02-19'], [1447, 10, '2026-03-20'],
  [1447, 12, '2026-05-18'], [1448, 1, '2026-06-16'], [1448, 3, '2026-08-14'],
];
let bad = 0;
for (const [y, m, want] of KNOWN) {
  const got = iso(at(y, m) - 0.5 + 0.5);
  const ok = got === want;
  if (!ok) bad++;
  if (check || !ok) console.log(`${ok ? 'OK ' : 'FARK'} ${name(y, m)} hesap=${got} diyanet=${want}`);
}
if (check) {
  for (let y = 1448; y <= 1450; y++) console.log(y, Array.from({ length: 12 }, (_, i) => iso(at(y, i + 1))).join(' '));
}

const out = { firstYear: FIRST_YEAR, starts };
if (!check) {
  writeFileSync(new URL('../src/data/hijri-months.json', import.meta.url), JSON.stringify(out));
  console.log(`${starts.length} ay yazıldı, ${bad} uyuşmazlık`);
}
