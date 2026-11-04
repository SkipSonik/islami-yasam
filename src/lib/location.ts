import * as Location from 'expo-location';

import { t } from '@/i18n';

export type Place = { lat: number; lng: number; name: string; auto: boolean; country?: string | null };

// Konum izni verilmezse kullanılacak varsayılan.
export const DEFAULT_PLACE: Place = { lat: 41.0082, lng: 28.9784, name: 'İstanbul', auto: false, country: 'TR' };

export type LocateResult = { place: Place } | { error: 'denied' | 'failed' };

export async function locateDevice(): Promise<LocateResult> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { error: 'denied' };

    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const { latitude, longitude } = pos.coords;

    let name = t('loc.here');
    let country: string | null = null;
    try {
      const [g] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (g) {
        country = g.isoCountryCode ?? null;
        const district = g.subregion || g.district || g.city;
        const city = g.region || g.city;
        name = [district, city].filter((v, i, a) => v && a.indexOf(v) === i).join(' / ') || name;
      }
    } catch {
      // adres bulunamazsa koordinatla devam
    }
    return { place: { lat: latitude, lng: longitude, name, auto: true, country } };
  } catch {
    return { error: 'failed' };
  }
}
