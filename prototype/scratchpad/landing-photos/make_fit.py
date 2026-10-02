"""BRIGHT EDITORIAL PLACEHOLDERS for the white demo site (fit-ration, 02.10.2026 «белый минималистичный лакшери»).

The moody bokeh stand-ins (../visual-editor-photos/make.py) read as dark holes on a white editorial page.
These replace them under the SAME ids: daylight top-down flat-lays on ivory linen — a white plate, the dish
as soft shapes, a soft window shadow. Placeholders, not content; then `make.py --encode-only` re-writes
photos/data.ts from these files.

    python3 scratchpad/landing-photos/make_fit.py && python3 scratchpad/visual-editor-photos/make.py --encode-only
"""
from __future__ import annotations
import math, random, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[2] / 'src' / 'modules' / 'preview' / 'photos'
SS = 2

def rgb(h, a=255):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

def linen(w, h, seed, base='#f2ede5'):
    rng = np.random.default_rng(seed)
    c = np.array(rgb(base)[:3], np.float32) / 255
    img = np.zeros((h, w, 3), np.float32) + c
    # weave: faint horizontal and vertical threads
    rows = rng.normal(0, 0.012, (h, 1)).astype(np.float32); cols = rng.normal(0, 0.012, (1, w)).astype(np.float32)
    img = img + (rows + cols)[..., None]
    # daylight from the upper left, falling off gently
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    light = 1.03 - 0.07 * ((x / w) * 0.6 + (y / h) * 0.4)
    return np.clip(img * light[..., None], 0, 1)

class Sheet:
    def __init__(s, w, h):
        s.w, s.h = w, h; s.im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); s.d = ImageDraw.Draw(s.im)

def lay(base, sheet, shadow=0.20, soft=16, off=(12, 16)):
    a = np.asarray(sheet.im).astype(np.float32) / 255
    al = a[..., 3]
    sh = Image.fromarray((al * 255).astype(np.uint8)).transform(al.shape[::-1], Image.AFFINE, (1, 0, -off[0] * SS, 0, 1, -off[1] * SS)).filter(ImageFilter.GaussianBlur(soft * SS))
    sh = np.asarray(sh).astype(np.float32) / 255
    base = base * (1 - (sh * shadow)[..., None])
    return base * (1 - al[..., None]) + a[..., :3] * al[..., None]

def plate(d, cx, cy, r):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=rgb('#fdfcfa'))
    d.ellipse([cx - r * 0.97, cy - r * 0.97, cx + r * 0.97, cy + r * 0.97], fill=rgb('#f4f2ee'))
    d.ellipse([cx - r * 0.74, cy - r * 0.74, cx + r * 0.74, cy + r * 0.74], fill=rgb('#fbfaf8'))

def blob(d, cx, cy, rx, ry, col, ang=0.0, n=28):
    pts = []
    for i in range(n):
        t = i / n * 2 * math.pi
        x, y = math.cos(t) * rx, math.sin(t) * ry
        pts.append((cx + x * math.cos(ang) - y * math.sin(ang), cy + x * math.sin(ang) + y * math.cos(ang)))
    d.polygon(pts, fill=col)

def scatter(d, rng, cx, cy, R, n, size, cols, ang=None, aspect=1.0):
    for _ in range(n):
        a = rng.uniform(0, 2 * math.pi); rr = R * math.sqrt(rng.random())
        s = size * rng.uniform(0.7, 1.25)
        blob(d, cx + math.cos(a) * rr, cy + math.sin(a) * rr, s, s * aspect, rgb(rng.choice(cols)), rng.uniform(0, math.pi) if ang is None else ang)

def leaves(d, rng, cx, cy, R, n, cols):
    scatter(d, rng, cx, cy, R, n, 26 * SS, cols, aspect=0.42)

def dish(d, rng, kind, cx, cy, r):
    S = SS
    if kind == 'power-bowl':
        scatter(d, rng, cx - r * 0.25, cy - r * 0.2, r * 0.32, 140, 4 * S, ['#e2d2ae', '#d8c49a', '#ead9b8'])
        scatter(d, rng, cx + r * 0.3, cy - r * 0.15, r * 0.22, 18, 11 * S, ['#d79a55', '#c98a46'])
        for i in range(5): blob(d, cx - r * 0.1 + i * 16 * S, cy + r * 0.28, 34 * S, 13 * S, rgb('#9cc46a'), 0.5)
        for i in range(4): blob(d, cx + r * 0.25, cy + r * 0.05 + i * 18 * S, 40 * S, 11 * S, rgb('#e8cfa7'), -0.3)
        leaves(d, rng, cx - r * 0.3, cy + r * 0.25, r * 0.15, 6, ['#4f8a3c', '#6aa34d'])
    elif kind == 'lean-beef-rice':
        scatter(d, rng, cx - r * 0.18, cy, r * 0.38, 260, 5 * S, ['#fbfaf6', '#f1eee6', '#e9e5da'], aspect=0.5)
        scatter(d, rng, cx + r * 0.32, cy - r * 0.08, r * 0.24, 16, 15 * S, ['#6b3a22', '#7d462a', '#5a3020'])
        scatter(d, rng, cx + r * 0.05, cy + r * 0.38, r * 0.16, 9, 16 * S, ['#3f7a3a', '#4f8c44'])
    elif kind == 'salmon-teriyaki':
        for i in range(30): d.arc([cx - r * 0.55 + rng.uniform(-20, 20) * S, cy - r * 0.2 + rng.uniform(-30, 30) * S, cx + r * 0.1, cy + r * 0.5], rng.uniform(0, 180), rng.uniform(200, 360), fill=rgb('#a8794b'), width=3 * S)
        d.rounded_rectangle([cx - r * 0.05, cy - r * 0.42, cx + r * 0.52, cy + r * 0.05], radius=20 * S, fill=rgb('#e9825a'))
        d.rounded_rectangle([cx + r * 0.02, cy - r * 0.38, cx + r * 0.46, cy - r * 0.02], radius=16 * S, fill=rgb('#c7542f'))
        scatter(d, rng, cx + r * 0.24, cy - r * 0.2, r * 0.18, 30, 2.5 * S, ['#fff7e6'])
        leaves(d, rng, cx + r * 0.3, cy + r * 0.3, r * 0.12, 5, ['#5f9a3e'])
    elif kind == 'chicken-pesto-pasta':
        scatter(d, rng, cx, cy, r * 0.5, 55, 17 * S, ['#8fae3f', '#9cbb4c', '#7d9c35'], aspect=0.45)
        scatter(d, rng, cx, cy, r * 0.42, 14, 13 * S, ['#efe2c6', '#e6d4b0'])
        scatter(d, rng, cx, cy, r * 0.4, 20, 4 * S, ['#f3e7c4'])
    elif kind == 'greek-wrap':
        for i, (dx, a) in enumerate([(-0.22, 0.5), (0.18, 0.4)]):
            blob(d, cx + r * dx, cy, r * 0.48, r * 0.2, rgb('#e2c08a'), a)
            blob(d, cx + r * dx + 30 * S * math.cos(a), cy + 30 * S * math.sin(a), r * 0.17, r * 0.17, rgb('#f2ead8'))
        scatter(d, rng, cx, cy + r * 0.45, r * 0.18, 8, 10 * S, ['#fbfbf7'])
        scatter(d, rng, cx - r * 0.2, cy - r * 0.45, r * 0.12, 6, 8 * S, ['#2b2a26'])
    elif kind == 'protein-pancakes':
        for i in range(4): d.ellipse([cx - r * 0.5, cy - r * 0.5 - i * 6 * S, cx + r * 0.5, cy + r * 0.5 - i * 6 * S], fill=rgb('#d2a467' if i % 2 else '#c38f52'))
        d.ellipse([cx - r * 0.44, cy - r * 0.62, cx + r * 0.44, cy + r * 0.26], fill=rgb('#dcb17a'))
        scatter(d, rng, cx, cy - r * 0.2, r * 0.25, 10, 10 * S, ['#b3263f', '#7a1e3a', '#3a3f8c'])
    else:
        scatter(d, rng, cx, cy, r * 0.4, 40, 12 * S, ['#c9a46e', '#8fae3f', '#e9825a'])

def napkin(d, x, y, w, h, col='#e6dfd2'):
    d.rounded_rectangle([x, y, x + w, y + h], radius=6 * SS, fill=rgb(col))
    for k in range(6): d.line([(x + 14 * SS, y + (k + 1) * h / 7), (x + w - 14 * SS, y + (k + 1) * h / 7)], fill=rgb('#ddd4c4'), width=SS)

def fork(d, x, y, L, col='#c7a868'):
    d.rounded_rectangle([x, y, x + 9 * SS, y + L], radius=5 * SS, fill=rgb(col))
    d.rounded_rectangle([x - 8 * SS, y - 46 * SS, x + 17 * SS, y + 6 * SS], radius=8 * SS, fill=rgb(col))

def meal(id_, seed, w=640, h=512):
    W, H = w * SS, h * SS
    rng = random.Random(seed)
    base = linen(W, H, seed)
    s = Sheet(W, H)
    cx, cy, r = W * rng.uniform(0.45, 0.55), H * 0.52, H * 0.40
    napkin(s.d, W * 0.02, H * 0.62, W * 0.2, H * 0.5)
    plate(s.d, cx, cy, r)
    fork(s.d, cx + r + 34 * SS, cy - r * 0.35, r * 1.1)
    dish(s.d, rng, id_, cx, cy, r * 0.82)
    img = lay(base, s)
    return Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS)

def table(id_, seed, w, h, kinds, containers=False):
    W, H = w * SS, h * SS
    rng = random.Random(seed)
    base = linen(W, H, seed, '#efe9e0')
    s = Sheet(W, H)
    n = len(kinds)
    for i, k in enumerate(kinds):
        cx = W * (i + 0.5) / n + rng.uniform(-12, 12) * SS; cy = H * (0.5 + (0.05 if i % 2 else -0.05)); r = min(W / n * 0.42, H * 0.42)
        if containers:
            s.d.rounded_rectangle([cx - r, cy - r * 0.8, cx + r, cy + r * 0.8], radius=26 * SS, fill=rgb('#fdfcfa'))
            dish(s.d, rng, k, cx, cy, r * 0.6)
        else:
            plate(s.d, cx, cy, r); dish(s.d, rng, k, cx, cy, r * 0.82)
    if not containers:
        fork(s.d, W * 0.94, H * 0.25, H * 0.5)
    img = lay(base, s)
    return Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS)

SHOTS = {
    **{k: (lambda k=k, i=i: meal(k, 100 + i)) for i, k in enumerate(['power-bowl', 'lean-beef-rice', 'salmon-teriyaki', 'chicken-pesto-pasta', 'greek-wrap', 'protein-pancakes'])},
    'kitchen': lambda: table('kitchen', 200, 1200, 520, ['salmon-teriyaki', 'power-bowl', 'protein-pancakes']),
    'svc-weekly-plan': lambda: table('w', 201, 640, 512, ['power-bowl', 'lean-beef-rice'], containers=True),
    'svc-custom-macros': lambda: meal('chicken-pesto-pasta', 202),
    'svc-office-delivery': lambda: table('o', 203, 640, 512, ['greek-wrap', 'salmon-teriyaki', 'power-bowl'], containers=True),
}

if __name__ == '__main__':
    imgs = []
    for k, fn in SHOTS.items():
        im = fn(); im.save(OUT / f'{k}.webp', 'WEBP', quality=72, method=6); imgs.append(im)
        print(k, im.size, (OUT / f'{k}.webp').stat().st_size // 1024, 'KB')
    if '--sheet' in sys.argv:
        tw = 300; th = [im.resize((tw, int(tw * im.size[1] / im.size[0]))) for im in imgs]
        sheet = Image.new('RGB', (tw * 4 + 50, max(t.size[1] for t in th) * 3 + 40), (40, 40, 40))
        for i, t in enumerate(th): sheet.paste(t, (10 + (i % 4) * (tw + 10), 10 + (i // 4) * (th[0].size[1] + 10)))
        sheet.save(sys.argv[sys.argv.index('--sheet') + 1])
