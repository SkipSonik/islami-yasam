import { useWindowDimensions } from 'react-native';

/**
 * Ekran düzeni: telefon dikey, telefon yatay ve tablet için ortak ölçüler.
 * - wide: iki sütunlu düzen için yeterince geniş (yatay telefon ya da tablet)
 * - landscape: genişlik yükseklikten büyük
 * - tablet: kısa kenar 600 dp ve üzeri
 */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const tablet = Math.min(width, height) >= 600;
  const wide = width >= 700;
  return { width, height, landscape, tablet, wide, short: Math.min(width, height) };
}

/** Tek sütunlu içerik için okunabilir en büyük genişlik */
export const READ_MAX = 760;
/** İki sütunlu içerik için en büyük genişlik */
export const WIDE_MAX = 1200;
