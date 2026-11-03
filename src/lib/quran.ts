import { Directory, File, Paths } from 'expo-file-system';

// Kaynak: api.alquran.cloud — Osmanlı hattıyla Arapça metin + Diyanet meali.
const API = 'https://api.alquran.cloud/v1';
const EDITIONS = 'quran-uthmani,tr.diyanet';

export type Ayah = { n: number; ar: string; tr: string };
export type Surah = { number: number; ayahs: Ayah[] };

const dir = () => {
  const d = new Directory(Paths.document, 'kuran');
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
};

const fileFor = (n: number) => new File(dir(), `sure-${n}.json`);

export function isSurahCached(n: number) {
  try {
    return fileFor(n).exists;
  } catch {
    return false;
  }
}

// Önce telefondaki kopyaya bakar, yoksa indirir ve kaydeder.
export async function getSurah(n: number): Promise<Surah> {
  const f = fileFor(n);
  if (f.exists) {
    try {
      return JSON.parse(await f.text()) as Surah;
    } catch {
      f.delete();
    }
  }
  const res = await fetch(`${API}/surah/${n}/editions/${EDITIONS}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const [arEd, trEd] = json.data as { ayahs: { numberInSurah: number; text: string }[] }[];

  const ayahs: Ayah[] = arEd.ayahs.map((a, i) => ({
    n: a.numberInSurah,
    ar: i === 0 ? stripBasmala(n, a.text) : a.text,
    tr: trEd.ayahs[i]?.text ?? '',
  }));
  const surah: Surah = { number: n, ayahs };
  try {
    if (f.exists) f.delete();
    f.create();
    await f.write(JSON.stringify(surah));
  } catch {
    // kaydedemezsek yine de göster
  }
  return surah;
}

// Kaynak metinde Fatiha ve Tevbe dışındaki surelerin ilk ayetinin başında
// besmele yer alır; besmeleyi ayrı başlık olarak gösterdiğimiz için ayetten çıkarırız.
function stripBasmala(n: number, text: string) {
  if (n === 1 || n === 9) return text;
  const words = text.trim().split(/\s+/);
  if (words.length > 4 && words[0].startsWith('بِسْمِ')) return words.slice(4).join(' ');
  return text;
}

export const BASMALA = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

// Tek bir ayet (günün ayeti için), önbellekli.
export async function getAyah(surah: number, ayah: number): Promise<Ayah & { surah: number }> {
  const s = await getSurah(surah);
  const a = s.ayahs.find((x) => x.n === ayah) ?? s.ayahs[0];
  return { ...a, surah };
}
