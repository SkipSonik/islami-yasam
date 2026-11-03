// "Günün ayeti" için seçilmiş ayetler (sure, ayet). Metin ve meal kaynaktan çekilir.
export const DAILY_AYAHS: [number, number][] = [
  [2, 152], [2, 153], [2, 186], [3, 139], [3, 159], [13, 28], [39, 53], [40, 60],
  [65, 3], [94, 5], [94, 6], [29, 69], [49, 13], [16, 97], [2, 45], [20, 114],
  [25, 63], [33, 41], [57, 4], [2, 286], [14, 7], [17, 82], [21, 87], [50, 16],
  [93, 5], [3, 200], [8, 46], [11, 115], [16, 128], [42, 43], [64, 11],
];

export function ayahForDate(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 86400000);
  return DAILY_AYAHS[dayOfYear % DAILY_AYAHS.length];
}
