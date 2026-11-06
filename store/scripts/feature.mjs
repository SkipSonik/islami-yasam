import { chromium } from 'playwright';
import fs from 'node:fs';
const dir = new URL('.', import.meta.url).pathname;
const b64 = (f, t = 'png') => `data:image/${t};base64,` + fs.readFileSync(dir + f).toString('base64');
const fontDir = dir + 'package/files/';
const faces = [700, 800, 500].flatMap((w) => ['latin', 'latin-ext'].map((s) => `@font-face{font-family:PJS;font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(`${fontDir}plus-jakarta-sans-${s}-${w}-normal.woff2`).toString('base64')})}`)).join('');
const [lang, title, tag, out] = process.argv.slice(2);
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${faces}
*{margin:0}body{width:1024px;height:500px;overflow:hidden;font-family:PJS,sans-serif;background:#08201B url(${b64('banner.png')}) right center/auto 100% no-repeat}
.wrap{position:absolute;left:64px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:18px;width:520px}
.row{display:flex;align-items:center;gap:22px}
.icon{width:112px;height:112px;border-radius:26px;box-shadow:0 12px 30px rgba(0,0,0,.45)}
h1{color:#F5F2E9;font-size:58px;font-weight:800;letter-spacing:-1px;line-height:1}
p{color:#E4BD6A;font-size:27px;font-weight:700;line-height:1.35}
small{color:#B4C8BF;font-size:21px;font-weight:500}
</style></head><body><div class="wrap"><div class="row"><img class="icon" src="${b64('play-icon-512.png')}"><h1>${title}</h1></div><p>${tag}</p></div></body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: dir + out });
await browser.close();
