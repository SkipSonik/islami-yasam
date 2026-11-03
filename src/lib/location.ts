import * as Location from 'expo-location';

export type Place = { lat: number; lng: number; name: string; auto: boolean };

// Konum izni verilmezse kullanılacak varsayılan.
export const DEFAULT_PLACE: Place = { lat: 41.0082, lng: 28.9784, name: 'İstanbul', auto: false };

export type LocateResult = { place: Place } | { error: 'denied' | 'failed' };

export async function locateDevice(): Promise<LocateResult> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { error: 'denied' };

    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const { latitude, longitude } = pos.coords;

    let name = 'Bulunduğun konum';
    try {
      const [g] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (g) {
        const district = g.subregion || g.district || g.city;
        const city = g.region || g.city;
        name = [district, city].filter((v, i, a) => v && a.indexOf(v) === i).join(' / ') || name;
      }
    } catch {
      // adres bulunamazsa koordinatla devam
    }
    return { place: { lat: latitude, lng: longitude, name, auto: true } };
  } catch {
    return { error: 'failed' };
  }
}
