import { SURAH_NAMES_LATIN } from './surah-names-latin';
import layout from './mushaf-layout.json';

// 114 surenin Türkçe adları ve ayet sayıları (Hafs rivayeti, toplam 6236).
const NAMES = [
  'Fatiha', 'Bakara', 'Âl-i İmrân', 'Nisâ', 'Mâide', 'En\'âm', 'A\'râf', 'Enfâl', 'Tevbe', 'Yûnus',
  'Hûd', 'Yûsuf', 'Ra\'d', 'İbrâhîm', 'Hicr', 'Nahl', 'İsrâ', 'Kehf', 'Meryem', 'Tâhâ',
  'Enbiyâ', 'Hac', 'Mü\'minûn', 'Nûr', 'Furkân', 'Şuarâ', 'Neml', 'Kasas', 'Ankebût', 'Rûm',
  'Lokmân', 'Secde', 'Ahzâb', 'Sebe\'', 'Fâtır', 'Yâsîn', 'Sâffât', 'Sâd', 'Zümer', 'Mü\'min',
  'Fussılet', 'Şûrâ', 'Zuhruf', 'Duhân', 'Câsiye', 'Ahkâf', 'Muhammed', 'Fetih', 'Hucurât', 'Kâf',
  'Zâriyât', 'Tûr', 'Necm', 'Kamer', 'Rahmân', 'Vâkıa', 'Hadîd', 'Mücâdele', 'Haşr', 'Mümtehine',
  'Saf', 'Cuma', 'Münâfikûn', 'Teğâbün', 'Talâk', 'Tahrîm', 'Mülk', 'Kalem', 'Hâkka', 'Meâric',
  'Nûh', 'Cin', 'Müzzemmil', 'Müddessir', 'Kıyâme', 'İnsân', 'Mürselât', 'Nebe\'', 'Nâziât', 'Abese',
  'Tekvîr', 'İnfitâr', 'Mutaffifîn', 'İnşikâk', 'Bürûc', 'Târık', 'A\'lâ', 'Gâşiye', 'Fecr', 'Beled',
  'Şems', 'Leyl', 'Duhâ', 'İnşirâh', 'Tîn', 'Alak', 'Kadir', 'Beyyine', 'Zilzâl', 'Âdiyât',
  'Kâria', 'Tekâsür', 'Asr', 'Hümeze', 'Fîl', 'Kureyş', 'Mâûn', 'Kevser', 'Kâfirûn', 'Nasr',
  'Tebbet', 'İhlâs', 'Felak', 'Nâs',
];

const AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

/** Sure adı seçili dile göre: Türkçe adlar, Arapçada Arapça, diğerlerinde Latin harfli. */
export function surahName(n: number, lang: string) {
  if (lang === 'tr') return SURAHS[n - 1]?.name ?? String(n);
  if (lang === 'ar' || lang === 'ur') return (layout as { names: string[] }).names[n - 1] ?? String(n);
  return SURAH_NAMES_LATIN[n - 1] ?? String(n);
}

export type SurahMeta = { number: number; name: string; ayahs: number };

export const SURAHS: SurahMeta[] = NAMES.map((name, i) => ({
  number: i + 1,
  name,
  ayahs: AYAH_COUNTS[i],
}));

// Arama için aksan ve büyük/küçük harf farkını kaldırır.
export function normalizeTr(s: string) {
  return s
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[̀-ͯ']/g, '')
    .replace(/ı/g, 'i');
}
