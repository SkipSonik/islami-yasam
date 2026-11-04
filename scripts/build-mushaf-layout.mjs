// Medine mushafı sayfa/satır düzenini uygulamaya gömülecek küçük bir JSON'a çevirir.
//
// Kaynak: npm "quran-qcf4" paketinin pages/*.json dosyaları (yalnızca MIT lisanslı
// JSON verisi kullanılır; paket içindeki fontlar KULLANILMAZ).
//
// Kullanım:
//   npm pack quran-qcf4@1.1.0 && tar xzf quran-qcf4-1.1.0.tgz
//   node scripts/build-mushaf-layout.mjs <paket klasörü>/pages
//
// Çıktı biçimi (src/data/mushaf-layout.json):
//   pages[sayfa-1] = { c?: 1 (ortalı sayfa), l: satırlar[] }
//   satır = { h: sure }            → sure başlığı
//         | { b: 1 }               → besmele satırı
//         | { w: [[sure, ayet, ilkKelime, sonKelime, sonMu], ...] }
//   Kelime sırası 0'dan başlar ve yalnızca gerçek kelimeleri sayar
//   (ayet sonu işareti ve secde işareti hariç). sonMu=1 ise ayet bu satırda biter.
//   wc["sure:ayet"] = o ayetin düzendeki kelime sayısı

import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Kullanım: node scripts/build-mushaf-layout.mjs <pages klasörü>');
  process.exit(1);
}

const pages = [];
const wordCount = {};
const sajda = [];

for (let n = 1; n <= 604; n++) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, `${String(n).padStart(3, '0')}.json`), 'utf8'));
  const lines = [];
  const sorted = [...p.lines].sort((a, b) => a.line - b.line);
  for (const ln of sorted) {
    const first = ln.words[0];
    if (!first) continue;
    if (first.type === 'surah_header') {
      lines.push({ h: first.sura });
      continue;
    }
    if (first.type === 'bismillah') {
      lines.push({ b: 1 });
      continue;
    }
    const segs = [];
    for (const w of ln.words) {
      if (w.type === 'quarter') continue;
      const [s, a] = w.verse_key.split(':').map(Number);
      const key = `${s}:${a}`;
      if (w.type === 'word' && w.text.startsWith('#')) {
        sajda.push(key);
        continue;
      }
      let seg = segs[segs.length - 1];
      if (!seg || seg[0] !== s || seg[1] !== a) {
        const idx = wordCount[key] ?? 0;
        seg = [s, a, idx, idx - 1, 0];
        segs.push(seg);
      }
      if (w.type === 'end') {
        seg[4] = 1;
      } else {
        wordCount[key] = (wordCount[key] ?? 0) + 1;
        seg[3] = wordCount[key] - 1;
      }
    }
    lines.push({ w: segs });
  }
  const page = { l: lines };
  if (n <= 2) page.c = 1;
  pages.push(page);
}

// Her ayetin hangi sayfada başladığı (sure başına dizi): takip ve sayfaya gitme için.
const ayahPage = {};
pages.forEach((pg, i) => {
  for (const ln of pg.l) {
    if (!ln.w) continue;
    for (const [s, a] of ln.w) {
      ayahPage[s] ??= [];
      if (ayahPage[s][a - 1] == null) ayahPage[s][a - 1] = i + 1;
    }
  }
});

// Sure başlıkları için Arapça sure adları (aynı paketin MIT lisanslı index.json'ı)
const index = JSON.parse(fs.readFileSync(path.join(dir, '..', 'index.json'), 'utf8'));
const names = index.chapters.sort((a, b) => a.id - b.id).map((c) => c.name_arabic);

const out = { pages, wc: wordCount, ap: ayahPage, sajda: [...new Set(sajda)], names };
const target = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'src', 'data', 'mushaf-layout.json');
fs.writeFileSync(target, JSON.stringify(out));
console.log('sayfa', pages.length, 'ayet', Object.keys(wordCount).length, 'boyut', fs.statSync(target).size, 'bayt');
