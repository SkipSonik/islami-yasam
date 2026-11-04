import type { Lang } from '@/i18n';

import { DEFAULT_PLACE, type Place } from './location';
import { methodForCountry, type CalcConfig, type MethodKey } from './prayer';

/** Kullanılacak hesaplama yöntemi ve ülke (ayarlardan; arka plan görevi de kullanır). */
export function resolveCalc(s: { method: MethodKey | 'auto'; place: Place; lang: Lang | null }): CalcConfig {
  const country = s.place.country ?? (s.place.auto ? null : DEFAULT_PLACE.country);
  if (s.method !== 'auto') return { method: s.method, country };
  if (country) return { method: methodForCountry(country), country };
  // Eski sürümden kalan, ülkesi bilinmeyen konum: Türkçe kullanan için Diyanet
  return { method: s.lang === 'tr' || s.lang == null ? 'turkey' : 'mwl', country: null };
}
