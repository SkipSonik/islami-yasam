import { createContext, useContext } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

// Uygulama temaları. Her tema aynı renk anahtarlarını taşır; ekranlar renkleri
// useColors() ile, stilleri makeStyles() ile alır, böylece tema anında değişir.

export type Palette = {
  id: ThemeId;
  dark: boolean;
  bg: string;
  bgDeep: string;
  card: string;
  cardSoft: string;
  cardActive: string;
  border: string;
  text: string;
  textDim: string;
  textMute: string;
  /** Ana vurgu rengi (seçili öğe, düğme) */
  accent: string;
  /** Vurgu renginin üstündeki yazı/simge rengi */
  onAccent: string;
  /** İkincil vurgu (hicri tarih, notlar) */
  gold: string;
  danger: string;
  dangerBg: string;
  warnBg: string;
  /** Tema seçicide gösterilen süs rengi */
  ornament: string;
};

export type ThemeId = 'zumrut' | 'gece' | 'iznik' | 'medine' | 'kabe';

export const THEMES: Record<ThemeId, Palette> = {
  // Zümrüt: derin zümrüt yeşili, sıcak beyaz yazı, nane yeşili ve altın vurgu
  zumrut: {
    id: 'zumrut',
    dark: true,
    bg: '#0E2C26',
    bgDeep: '#08201B',
    card: '#153A32',
    cardSoft: '#1B463D',
    cardActive: '#23584C',
    border: '#285A4E',
    text: '#F5F2E9',
    textDim: '#B4C8BF',
    textMute: '#83A096',
    accent: '#4CD3A2',
    onAccent: '#06231B',
    gold: '#E4BD6A',
    danger: '#E8736B',
    dangerBg: '#4A2A28',
    warnBg: '#4A3B17',
    ornament: '#E4BD6A',
  },
  // Gece: lacivert gece göğü, altın vurgu, buz mavisi ikincil
  gece: {
    id: 'gece',
    dark: true,
    bg: '#0D1530',
    bgDeep: '#080E22',
    card: '#151F42',
    cardSoft: '#1B2850',
    cardActive: '#273766',
    border: '#2A3A6E',
    text: '#EEF1FA',
    textDim: '#AAB5D6',
    textMute: '#7A86AC',
    accent: '#EBC46B',
    onAccent: '#141A36',
    gold: '#9CC4FF',
    danger: '#F07C7C',
    dangerBg: '#4A2433',
    warnBg: '#463A1C',
    ornament: '#EBC46B',
  },
  // İznik: İznik çinisinden ilham, kırık beyaz zemin, kobalt mavi ve mercan kırmızısı
  iznik: {
    id: 'iznik',
    dark: false,
    bg: '#F6F3EC',
    bgDeep: '#E9E3D5',
    card: '#FFFFFF',
    cardSoft: '#EEF2F8',
    cardActive: '#D6E4F5',
    border: '#DCD5C4',
    text: '#17264A',
    textDim: '#4C5B7D',
    textMute: '#8590A8',
    accent: '#1E5BAA',
    onAccent: '#FFFFFF',
    gold: '#B6452F',
    danger: '#C0392B',
    dangerBg: '#F8E1DE',
    warnBg: '#FBEFD5',
    ornament: '#2C9C9A',
  },
  // Medine: kum ve hurma tonları, Yeşil Kubbe'den ilham alan yeşil vurgu
  medine: {
    id: 'medine',
    dark: false,
    bg: '#F3EADB',
    bgDeep: '#E6D9C1',
    card: '#FBF6EC',
    cardSoft: '#EFE4CF',
    cardActive: '#DFEBDF',
    border: '#D9C7A6',
    text: '#2D2317',
    textDim: '#6A5942',
    textMute: '#998870',
    accent: '#2C6B4E',
    onAccent: '#FFFFFF',
    gold: '#A3701F',
    danger: '#B23A3A',
    dangerBg: '#F4DCD6',
    warnBg: '#F6E7C4',
    ornament: '#2C6B4E',
  },
  // Kâbe: kömür siyahı (OLED ekranlarda pil dostu) ve kisve altını
  kabe: {
    id: 'kabe',
    dark: true,
    bg: '#000000',
    bgDeep: '#0B0B0B',
    card: '#151515',
    cardSoft: '#1D1D1D',
    cardActive: '#2B2516',
    border: '#2E2A22',
    text: '#F6F1E6',
    textDim: '#B8AE99',
    textMute: '#7E776A',
    accent: '#D6B04C',
    onAccent: '#0B0B0B',
    gold: '#EAD9A8',
    danger: '#E06A6A',
    dangerBg: '#3A1E1E',
    warnBg: '#3A3016',
    ornament: '#D6B04C',
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
export const DEFAULT_THEME: ThemeId = 'zumrut';

export const ThemeContext = createContext<Palette>(THEMES[DEFAULT_THEME]);

export function useColors(): Palette {
  return useContext(ThemeContext);
}

type StyleObj = { [key: string]: ViewStyle | TextStyle | ImageStyle };

/** Temaya bağlı stil kancası üretir; her tema için stiller bir kez oluşturulur. */
export function makeStyles<S extends StyleObj>(fn: (C: Palette) => S & StyleObj) {
  const cache = new Map<ThemeId, Readonly<S>>();
  return function useStyles(): Readonly<S> {
    const C = useColors();
    const hit = cache.get(C.id);
    if (hit) return hit;
    const s = StyleSheet.create(fn(C));
    cache.set(C.id, s);
    return s;
  };
}

export const R = { sm: 10, md: 16, lg: 22 } as const;
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
