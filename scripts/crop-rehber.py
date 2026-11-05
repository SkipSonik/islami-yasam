"""Rehber görsel sayfalarını (ızgara) tek tek karelere böler.

Kullanım: python3 scripts/crop-rehber.py <kaynak_klasör>
Kaynak: namaz-*.png (3x2), abdest-*.png (3x3). Çıktı: assets/rehber/<ad>-<n>.webp
"""
import sys, os
import numpy as np
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'rehber')
os.makedirs(OUT, exist_ok=True)


def gaps(profile, n, length):
    """Parlaklık profilinde n-1 ayırıcı bul; bulunamazsa eşit böl."""
    cuts = []
    for k in range(1, n):
        center = length * k // n
        lo, hi = center - length // 12, center + length // 12
        seg = profile[lo:hi]
        idx = np.where(seg >= seg.max() - 2)[0]
        if len(idx) and seg.max() > 248:
            # en uzun parlak bölgenin ortası
            runs, start = [], idx[0]
            for a, b in zip(idx, idx[1:]):
                if b != a + 1:
                    runs.append((start, a)); start = b
            runs.append((start, idx[-1]))
            s, e = max(runs, key=lambda r: r[1] - r[0])
            cuts.append((lo + s, lo + e))
        else:
            cuts.append((center, center))
    edges = [0] + [c for pair in cuts for c in pair] + [length]
    return [(edges[i], edges[i + 1]) for i in range(0, len(edges), 2)]


for name in sorted(os.listdir(SRC)):
    if not name.endswith('.png'):
        continue
    base = name[:-4]
    cols, rows = (3, 2) if base.startswith('namaz') else (3, 3)
    im = Image.open(os.path.join(SRC, name)).convert('RGB')
    a = np.asarray(im).astype(float).mean(axis=2)
    xs = gaps(a.mean(axis=0), cols, im.width)
    ys = gaps(a.mean(axis=1), rows, im.height)
    n = 0
    for (y0, y1) in ys:
        for (x0, x1) in xs:
            n += 1
            pad = 6
            tile = im.crop((x0 + pad, y0 + pad, x1 - pad, y1 - pad))
            tile.thumbnail((560, 560))
            tile.save(os.path.join(OUT, f'{base}-{n}.webp'), quality=80, method=6)
    print(base, xs, ys)
