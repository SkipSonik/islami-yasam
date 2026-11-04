// Eğim düzeltmeli pusula hesabı (Android cihaz eksenleri):
//   X: ekranın sağı, Y: ekranın üstü, Z: ekrandan dışarı (yüzüne doğru)
//
// gravity: ivmeölçer okuması (durgunken "yukarı"yı gösterir, birim önemli değil)
// magnetic: manyetometre okuması (µT)
//
// Yöntem: Doğu = M × G, Kuzey = G × Doğu (cihaz eksenlerinde). Kullanıcının baktığı
// yatay yön; telefonun üst ucunun (Y) ve arka kamerasının (-Z) yataydaki izdüşümlerinin
// toplamıdır. Böylece telefon masada düz de dursa, dik de tutulsa yön doğru çıkar.

export type Vec = { x: number; y: number; z: number };

const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec, b: Vec): Vec => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const len = (a: Vec) => Math.sqrt(dot(a, a));
const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });

export type HeadingResult = {
  /** Manyetik kuzeye göre derece (0-360), hesaplanamazsa null */
  heading: number | null;
  /** Ekran aşağı bakıyor (telefon ters) */
  faceDown: boolean;
};

export function tiltCompensatedHeading(gravity: Vec, magnetic: Vec): HeadingResult {
  const gLen = len(gravity);
  if (gLen < 1e-6) return { heading: null, faceDown: false };
  const up = scale(gravity, 1 / gLen);

  const east = cross(magnetic, up);
  const eLen = len(east);
  // Manyetik alan dikeye çok yakınsa (kutuplar) veya sensör verisi yoksa yön belirsiz
  if (eLen < 1e-6) return { heading: null, faceDown: up.z < -0.5 };
  const E = scale(east, 1 / eLen);
  const N = cross(up, E);

  const top: Vec = { x: 0, y: 1, z: 0 };
  const back: Vec = { x: 0, y: 0, z: -1 };
  const hTop = sub(top, scale(up, dot(top, up)));
  const hBack = sub(back, scale(up, dot(back, up)));
  // Arka kamera yönü yalnızca telefon dikleştikçe hesaba katılır; düz telefonu yana
  // eğmek yönü değiştirmesin.
  const upright = Math.abs(dot(top, up)) ** 4;
  const forward = add(hTop, scale(hBack, upright));
  if (len(forward) < 1e-6) return { heading: null, faceDown: up.z < -0.5 };

  const deg = (Math.atan2(dot(forward, E), dot(forward, N)) * 180) / Math.PI;
  return { heading: (deg + 360) % 360, faceDown: up.z < -0.5 };
}

/** Manyetik alan şiddeti (µT). Dünya'da 25-65 µT arasıdır; dışındaysa yakında metal/mıknatıs var. */
export function fieldStrength(m: Vec) {
  return len(m);
}
