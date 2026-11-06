// Mağaza ekran görüntüleri için uygulama ekranlarını gerçekçi verilerle yakalar.
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const [webDir, outDir, qjDir, code] = process.argv.slice(2);
const silent = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'sessiz.mp3'));
const server = http.createServer((req, res) => {
  let f = path.join(webDir, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(webDir, 'index.html');
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.ttf': 'font/ttf', '.png': 'image/png', '.webp': 'image/webp' };
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] ?? 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(8772, r));

function surahJson(n, lang) {
  const ar = JSON.parse(fs.readFileSync(path.join(qjDir, 'chapters', 'tr', `${n}.json`)));
  const tl = JSON.parse(fs.readFileSync(path.join(qjDir, 'chapters', lang, `${n}.json`)));
  return {
    code: 200,
    data: [
      { ayahs: ar.verses.map((v) => ({ numberInSurah: v.id, text: v.text })) },
      { ayahs: tl.verses.map((v) => ({ numberInSurah: v.id, text: v.translation })) },
    ],
  };
}

const today = new Date();
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const tracker = {};
for (let i = 1; i < 30; i++) tracker[key(new Date(today.getTime() - i * 864e5))] = i === 9 || i === 17 ? 27 : 31;
tracker[key(today)] = 7;

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
async function shot(name, route, { lang = 'tr', theme = 'zumrut', before, wait = 2500, scroll = 0 } = {}) {
  if (process.env.ONLY && !process.env.ONLY.split(',').some((o) => name.endsWith(o))) return;
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, locale: lang });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('HATA', name, e.message));
  await page.route(/^(?!http:\/\/localhost:8772).*/, async (r) => {
    const u = r.request().url();
    const m = u.match(/alquran\.cloud\/v1\/surah\/(\d+)\/editions/);
    if (m) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(surahJson(Number(m[1]), lang === 'tr' ? 'tr' : 'en')) });
    const a = u.match(/alquran\.cloud\/v1\/ayah\/(\d+):(\d+)/);
    if (a) {
      const s = surahJson(Number(a[1]), lang === 'tr' ? 'tr' : 'en');
      const i = Number(a[2]) - 1;
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, data: [{ text: s.data[0].ayahs[i].text, numberInSurah: i + 1 }, { text: s.data[1].ayahs[i].text, numberInSurah: i + 1 }] }) });
    }
    if (u.includes('cdn.islamic.network')) return r.fulfill({ status: 200, contentType: 'audio/mpeg', body: silent });
    if (u.startsWith('https://mix.gen.tr/islamiyasam/hatim/api.php')) {
      const local = u.replace('https://mix.gen.tr/islamiyasam/hatim/api.php', 'http://127.0.0.1:8099/api.php');
      const resp = await fetch(local, { method: r.request().method(), body: r.request().postData() ?? undefined });
      return r.fulfill({ status: resp.status, contentType: 'application/json', body: await resp.text() });
    }
    return r.abort();
  });
  await page.goto('http://localhost:8772/');
  await page.evaluate(
    ([l, th, tr, c]) => {
      localStorage.setItem('settings-v1', JSON.stringify({ lang: l, hasLocated: true, theme: th, place: { name: l === 'tr' ? 'İstanbul, Fatih' : 'Istanbul', lat: 41.0082, lng: 28.9784, country: 'TR', auto: true } }));
      localStorage.setItem('namaz-takip-v1', JSON.stringify(tr));
      localStorage.setItem('cihaz-kimligi', JSON.stringify('aaaaaaaa-1111-2222-3333-444444444444'));
      localStorage.setItem('ortak-hatimler-v1', JSON.stringify([{ code: c, title: 'Annem için hatim' }]));
      localStorage.setItem('hatim-kisisel-v1', JSON.stringify({ read: Array.from({ length: 30 }, (_, i) => i < 18), completed: 3 }));
      localStorage.setItem('tesbihat-v1', JSON.stringify({ completed: 12 }));
      localStorage.setItem('zikirmatik-v1', JSON.stringify({ count: 21, target: 33, rounds: 40, total: 1340 }));
      localStorage.setItem('okuma-plani-v1', JSON.stringify({ days: 30, startedAt: null, page: 220, log: { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1, h: 1, i: 1 }, finished: 1 }));
      localStorage.setItem('oruc-v1', JSON.stringify({}));
      localStorage.setItem('rehber-kisi', JSON.stringify('kadin'));
      if (l !== 'tr') localStorage.setItem('ortak-hatimler-v1', JSON.stringify([{ code: c, title: 'Khatm for my mother' }]));
    },
    [lang, theme, tracker, code],
  );
  await page.goto('http://localhost:8772' + route);
  await page.waitForTimeout(wait);
  if (before) await before(page);
  if (scroll) {
    await page.mouse.move(196, 500);
    await page.mouse.wheel(0, scroll);
    await page.waitForTimeout(700);
  }
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  await ctx.close();
  console.log('ok', name);
}

const L = process.env.LANG_CODE || 'tr';
await shot(`${L}-home`, '/', { lang: L });
await shot(`${L}-mushaf`, '/mushaf?sayfa=2', {
  lang: L,
  wait: 3500,
  before: async (p) => {
    // oynat düğmesine bas (sağ üstteki daire)
    const btn = p.locator('[role="button"]').filter({ has: p.locator('svg, div') });
    await p.mouse.click(360, 27);
    await p.waitForTimeout(10500);
  },
});
await shot(`${L}-rehber`, '/rehber', { lang: L, before: async (p) => { await p.getByText(L === 'tr' ? 'Namaz' : 'Prayer', { exact: true }).first().click(); await p.waitForTimeout(800); }, scroll: 520 });
await shot(`${L}-takip`, '/namaz-takip', { lang: L });
await shot(`${L}-hatim`, `/ortak-hatim/${code}`, { lang: L, wait: 3500 });
await shot(`${L}-ramazan`, '/ramazan', { lang: L, theme: 'gece' });
await shot(`${L}-dualar`, '/dualar', { lang: L, theme: 'medine' });
await shot(`${L}-esma`, '/esma', { lang: L, theme: 'kabe' });
await shot(`${L}-kuran`, '/kuran', { lang: L, theme: 'iznik' });
for (const th of ['zumrut', 'gece', 'iznik', 'medine', 'kabe']) await shot(`${L}-tema-${th}`, '/', { lang: L, theme: th });
await browser.close();
server.close();
