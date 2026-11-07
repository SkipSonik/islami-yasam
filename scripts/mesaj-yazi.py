"""Resimli mesaj üretici: arka plan resmine Türkçe başlık + alt yazı + küçük uygulama imzası ekler.

Kullanım: python3 scripts/mesaj-yazi.py <tanim.json> <kaynak_klasor> <cikti_klasor> <font_klasor>
tanim.json: [{"id": "cuma-01", "src": "cuma1.png", "title": "Hayırlı Cumalar", "sub": "..."}]
Çıktı: img/<id>.jpg (1080x1440) ve thumb/<id>.jpg (360x480)
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1440


def fit_cover(im: Image.Image) -> Image.Image:
    im = im.convert('RGB')
    r = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((x, y, x + W, y + H))


def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=font) <= max_w or not cur:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def shadow_text(base, xy, text, font, fill, anchor='ma', blur=10, strength=200):
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text(xy, text, font=font, fill=(0, 0, 0, strength), anchor=anchor)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)
    ImageDraw.Draw(base).text(xy, text, font=font, fill=fill, anchor=anchor)


def render(spec, src_dir: Path, out_dir: Path, fonts: Path):
    bg = fit_cover(Image.open(src_dir / spec['src'])).convert('RGBA')
    # Üst bölge açık renkliyse koyu yazı + açık geçiş, koyuysa altın yazı + koyu geçiş
    top = bg.crop((0, 0, W, int(H * 0.38))).convert('L').resize((1, 1), Image.BOX).getpixel((0, 0))
    light = spec.get('light', top > 150)

    # Yazının okunması için üstte yumuşak koyu geçiş
    grad = Image.new('L', (1, H))
    for y in range(H):
        a = max(0.0, 1 - y / (H * 0.5))
        grad.putpixel((0, y), int((150 if light else 165) * a ** 1.6))
    shade = Image.new('RGBA', (W, H), (255, 250, 238, 255) if light else (8, 12, 10, 255))
    shade.putalpha(grad.resize((W, H)))
    bg.alpha_composite(shade)
    # altta imza için ince geçiş
    grad2 = Image.new('L', (1, H))
    for y in range(H):
        a = max(0.0, (y - H * 0.86) / (H * 0.14))
        grad2.putpixel((0, y), int(140 * a))
    shade2 = Image.new('RGBA', (W, H), (8, 12, 10, 255))
    shade2.putalpha(grad2.resize((W, H)))
    bg.alpha_composite(shade2)

    d = ImageDraw.Draw(bg)
    title_f = ImageFont.truetype(str(fonts / 'PlayfairDisplay_700Bold.ttf'), spec.get('size', 104))
    sub_f = ImageFont.truetype(str(fonts / 'Lora_500Medium.ttf'), spec.get('subsize', 44))
    maxw = spec.get('maxw', W - 140)
    sign_f = ImageFont.truetype(str(fonts / 'Lora_600SemiBold.ttf'), 30)

    gold = (14, 60, 48, 255) if light else (246, 214, 140, 255)
    body = (40, 40, 36, 255) if light else (255, 255, 255, 255)
    sh = 70 if light else 200
    y = spec.get('top', 120)
    for line in wrap(d, spec['title'], title_f, maxw):
        shadow_text(bg, (W // 2, y), line, title_f, gold, strength=sh)
        y += int(title_f.size * 1.18)

    # süs çizgisi
    y += 14
    d.line([(W // 2 - 120, y), (W // 2 - 22, y)], fill=gold, width=3)
    d.line([(W // 2 + 22, y), (W // 2 + 120, y)], fill=gold, width=3)
    d.regular_polygon((W // 2, y, 10), 4, rotation=45, fill=gold)
    y += 40

    if spec.get('sub'):
        for line in wrap(d, spec['sub'], sub_f, maxw - 60):
            shadow_text(bg, (W // 2, y), line, sub_f, body, blur=8, strength=sh)
            y += int(sub_f.size * 1.4)

    shadow_text(bg, (W // 2, H - 52), 'İslami Yaşam', sign_f, (255, 255, 255, 230), anchor='ms', blur=6)

    out = bg.convert('RGB')
    (out_dir / 'img').mkdir(parents=True, exist_ok=True)
    (out_dir / 'thumb').mkdir(parents=True, exist_ok=True)
    out.save(out_dir / 'img' / f"{spec['id']}.jpg", quality=86, optimize=True, progressive=True)
    out.resize((360, 480), Image.LANCZOS).save(out_dir / 'thumb' / f"{spec['id']}.jpg", quality=80, optimize=True)


if __name__ == '__main__':
    specs = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    src, out, fonts = Path(sys.argv[2]), Path(sys.argv[3]), Path(sys.argv[4])
    for s in specs:
        render(s, src, out, fonts)
        print('ok', s['id'])
