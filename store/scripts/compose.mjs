// Mağaza ekran görüntülerini (1080x1920) başlık + telefon çerçevesiyle oluşturur.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [rawDir, outDir, specFile] = process.argv.slice(2);
const specs = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const THEME = {
  zumrut: ['#0B2620', '#1A4A3F', '#E4BD6A', '#F5F2E9', '#B4C8BF'],
  gece: ['#0A1029', '#1E2C5C', '#EBC46B', '#EEF1FA', '#AAB5D6'],
  iznik: ['#F3EFE6', '#DCE7F4', '#B6452F', '#17264A', '#4C5B7D'],
  medine: ['#F1E7D6', '#E5D3B3', '#2C6B4E', '#2D2317', '#6A5942'],
  kabe: ['#000000', '#2A2416', '#D6B04C', '#F6F1E6', '#B8AE99'],
};
// 8 köşeli yıldız deseni (Rub el Hizb), düşük opaklık
const pattern = (c) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='${c}' stroke-width='1.2' opacity='0.16'><rect x='35' y='35' width='50' height='50'/><rect x='35' y='35' width='50' height='50' transform='rotate(45 60 60)'/><circle cx='60' cy='60' r='12'/><path d='M0 60h22M98 60h22M60 0v22M60 98v22'/></g></svg>`)}")`;

const fontDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'package', 'files');
const faces = [500, 700, 800]
  .flatMap((w) =>
    ['latin', 'latin-ext'].map((sub) => {
      const b = fs.readFileSync(path.join(fontDir, `plus-jakarta-sans-${sub}-${w}-normal.woff2`)).toString('base64');
      return `@font-face{font-family:'PJS';font-weight:${w};src:url(data:font/woff2;base64,${b}) format('woff2');${sub === 'latin' ? 'unicode-range:U+0000-00FF,U+2000-206F;' : ''}}`;
    }),
  )
  .join('');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
for (const s of specs) {
  const [bg1, bg2, acc, text, dim] = THEME[s.theme];
  const b64 = (n) => 'data:image/png;base64,' + fs.readFileSync(path.join(rawDir, n + '.png')).toString('base64');
  const img = s.raw ? b64(s.raw) : '';
  // Tema tanıtımı: beş telefon yelpaze şeklinde
  const fan = s.fan
    ? s.fan
        .map((n, i) => {
          const off = i - (s.fan.length - 1) / 2;
          return `<div class="mini" style="left:${540 + off * 165 - 150}px;top:${720 + Math.abs(off) * 70}px;transform:rotate(${off * 7}deg);z-index:${10 - Math.abs(off)}"><img src="${b64(n)}"></div>`;
        })
        .join('')
    : '';
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  ${faces}
  *{margin:0;box-sizing:border-box}
  body{width:1080px;height:1920px;overflow:hidden;font-family:'PJS',system-ui,sans-serif;
    background:${pattern(acc)}, radial-gradient(ellipse at 50% 30%, ${bg2} 0%, ${bg1} 70%);}
  .top{position:absolute;top:110px;left:80px;right:80px;text-align:center}
  .pill{display:inline-block;color:${acc};border:2px solid ${acc};border-radius:40px;padding:8px 26px;font-size:30px;font-weight:700;letter-spacing:1px;margin-bottom:30px}
  h1{color:${text};font-size:78px;line-height:1.08;font-weight:800;letter-spacing:-1px}
  p{color:${dim};font-size:38px;line-height:1.35;margin-top:24px;font-weight:500}
  .phone{position:absolute;left:50%;top:${s.phoneTop ?? 640}px;transform:translateX(-50%);width:800px;height:1734px;border-radius:96px;
    background:#0b0b0b;padding:22px;box-shadow:0 40px 90px rgba(0,0,0,.45), 0 0 0 3px ${acc}55}
  .screen{width:100%;height:100%;border-radius:76px;overflow:hidden;background:#000}
  .screen img{width:100%;display:block}
  .mini{position:absolute;width:300px;border-radius:40px;background:#0b0b0b;padding:10px;box-shadow:0 30px 60px rgba(0,0,0,.45)}
  .mini img{width:100%;display:block;border-radius:32px}
  .notch{position:absolute;top:44px;left:50%;transform:translateX(-50%);width:34px;height:34px;border-radius:50%;background:#111}
  </style></head><body>
  <div class="top">${s.pill ? `<div class="pill">${s.pill}</div>` : ''}<h1>${s.title}</h1><p>${s.sub}</p></div>
  ${s.fan ? fan : `<div class="phone"><div class="screen"><img src="${img}"></div></div>`}
  </body></html>`;
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, s.out + '.png') });
  console.log('ok', s.out);
}
await browser.close();
