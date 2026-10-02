"""PLACEHOLDER PHOTOGRAPHS for the two landing sites on the shelf (synco.com, meridianroast.com).

Same contract as ../visual-editor-photos/make.py: deterministic, numpy + Pillow only, WebP,
and a generated module (src/modules/preview/photos/landing-data.ts) holding every file as a
data: URL, because the artifact's CSP blocks every external request.

  synco-*     dark studio product shots — a graphite orb speaker, a pair of pods, a halo ring,
              each under a coloured rim light on a black sweep (the black-theme store)
  meridian-*  sunlit top-down flat-lays on saturated paper — a latte with beans, and three
              coffee pouches in bold colour blocks (the bright roastery)

They are stand-ins, not content: the designer supplies real photography.

    python3 scratchpad/landing-photos/make.py [--sheet X.png]
"""
from __future__ import annotations

import base64
import math
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[2] / 'src' / 'modules' / 'preview' / 'photos'
Q = 74
SS = 2  # supersampling


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255


def grid(w, h):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    return x, y


def grain(img, amt, seed):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, amt, img.shape[:2]).astype(np.float32)[..., None]
    return np.clip(img + n, 0, 1)


def to_img(a):
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))


def down(a, w, h):
    return np.asarray(to_img(a).resize((w, h), Image.LANCZOS)).astype(np.float32) / 255


def blur(mask, r):
    im = Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


# ───────────────────────────────────────────────────────────── synco: the studio
def studio(w, h, glow, glow_at=(0.5, 0.42), glow_r=0.55):
    x, y = grid(w, h)
    nx, ny = x / w, y / h
    base = np.zeros((h, w, 3), np.float32) + hexrgb('#08080a')
    # the sweep: a little lighter toward the floor's horizon
    horizon = np.exp(-((ny - 0.72) ** 2) / 0.02)[..., None] * 0.035
    d = np.sqrt(((nx - glow_at[0]) * w / h) ** 2 + (ny - glow_at[1]) ** 2)
    g = np.exp(-(d / glow_r) ** 2 * 2.2)[..., None]
    return base + horizon + g * hexrgb(glow) * 0.42


def shade(nx_, ny_, nz_, albedo, light, rim, spec=0.55, shin=40, rim_k=0.9):
    L = np.array(light, np.float32); L /= np.linalg.norm(L)
    lam = np.clip(nx_ * L[0] + ny_ * L[1] + nz_ * L[2], 0, 1)
    H = L + np.array([0, 0, 1], np.float32); H /= np.linalg.norm(H)
    sp = np.clip(nx_ * H[0] + ny_ * H[1] + nz_ * H[2], 0, 1) ** shin
    fres = (1 - np.clip(nz_, 0, 1)) ** 3
    col = albedo * (0.12 + 0.88 * lam[..., None]) + sp[..., None] * spec + fres[..., None] * rim * rim_k
    return col


def put(base, col, cov):
    return base * (1 - cov[..., None]) + col * cov[..., None]


def floor_shadow(base, cx, cy, rx, ry, strength, w, h):
    x, y = grid(w, h)
    e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
    m = np.exp(-e * 1.6) * strength
    return base * (1 - m[..., None])


def glow_ring(base, cx, cy, rx, ry, color, w, h, k=1.0):
    x, y = grid(w, h)
    e = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    m = np.exp(-((e - 1) / 0.07) ** 2) * k
    return base + m[..., None] * hexrgb(color)


def sphere(base, cx, cy, r, albedo, light, rim, w, h, mesh=False):
    x, y = grid(w, h)
    dx, dy = (x - cx) / r, (y - cy) / r
    rr = dx * dx + dy * dy
    cov = np.clip((1 - np.sqrt(rr)) * r / 1.2, 0, 1)
    nz = np.sqrt(np.clip(1 - rr, 0, 1))
    alb = np.zeros_like(base) + albedo
    if mesh:  # speaker-grille dots on the lower two thirds
        u = (x * 0.5) % 9; v = (y * 0.5) % 9
        dots = (((u - 4.5) ** 2 + (v - 4.5) ** 2) < 3.2) & (dy > -0.15)
        alb = alb * (1 - 0.35 * dots[..., None])
    col = shade(dx, dy, nz, alb, light, rim)
    return put(base, col, cov)


def capsule(base, ax, ay, bx, by, r, albedo, light, rim, w, h, spec=0.7):
    x, y = grid(w, h)
    px, py = x - ax, y - ay
    vx, vy = bx - ax, by - ay
    t = np.clip((px * vx + py * vy) / (vx * vx + vy * vy), 0, 1)
    qx, qy = px - t * vx, py - t * vy
    d = np.sqrt(qx * qx + qy * qy)
    cov = np.clip((r - d) / 1.2, 0, 1)
    nx_, ny_ = qx / r, qy / r
    nz = np.sqrt(np.clip(1 - nx_ ** 2 - ny_ ** 2, 0, 1))
    col = shade(nx_, ny_, nz, albedo, light, rim, spec=spec, shin=60)
    return put(base, col, cov)


def ring(base, cx, cy, R, r, squash, albedo, light, rim, w, h, front=None):
    """A torus seen from a little above: drawn as a squashed annulus with a tube normal."""
    x, y = grid(w, h)
    X, Y = x - cx, (y - cy) / squash
    rad = np.sqrt(X * X + Y * Y) + 1e-6
    t = (rad - R) / r
    cov = np.clip((1 - np.abs(t)) * r * squash / 1.2, 0, 1)
    if front is not None:
        cov = cov * (Y > 0 if front else Y <= 0)
    nx_, ny_ = (X / rad) * t, (Y / rad) * t * squash
    nz = np.sqrt(np.clip(1 - t * t, 0, 1))
    col = shade(nx_, ny_ - 0.25 * nz, nz, albedo, light, rim, spec=0.8, shin=50)
    return put(base, col, cov)


def synco_hero(seed):
    w, h = 960 * SS, 760 * SS
    img = studio(w, h, '#6d4dff', glow_at=(0.56, 0.4), glow_r=0.62)
    img = img + studio(w, h, '#1fb6ff', glow_at=(0.78, 0.62), glow_r=0.35) * 0.35 - hexrgb('#08080a') * 0.35
    cx, cy, r = w * 0.55, h * 0.48, h * 0.27
    img = floor_shadow(img, cx, cy + r * 1.02, r * 1.05, r * 0.16, 0.9, w, h)
    img = glow_ring(img, cx, cy + r * 0.98, r * 0.95, r * 0.12, '#8f7bff', w, h, k=0.85)
    img = sphere(img, cx, cy, r, hexrgb('#2a2a30'), (-0.55, -0.7, 0.55), hexrgb('#9b86ff'), w, h, mesh=True)
    # a small pod resting in front
    img = floor_shadow(img, w * 0.3, h * 0.78, r * 0.32, r * 0.06, 0.7, w, h)
    img = capsule(img, w * 0.25, h * 0.735, w * 0.34, h * 0.755, r * 0.11, hexrgb('#e9e9ee'), (-0.4, -0.8, 0.6), hexrgb('#6fd0ff'), w, h)
    return grain(down(img, w // SS, h // SS), 0.012, seed)


def synco_card(kind, glow, seed):
    w, h = 640 * SS, 520 * SS
    img = studio(w, h, glow, glow_at=(0.5, 0.42), glow_r=0.5)
    if kind == 'orb':
        cx, cy, r = w / 2, h * 0.47, h * 0.26
        img = floor_shadow(img, cx, cy + r, r, r * 0.15, 0.85, w, h)
        img = glow_ring(img, cx, cy + r * 0.97, r * 0.9, r * 0.11, glow, w, h, 0.7)
        img = sphere(img, cx, cy, r, hexrgb('#2c2c33'), (-0.5, -0.75, 0.5), hexrgb(glow), w, h, mesh=True)
    elif kind == 'pods':
        for (ax, ay, bx, by, a) in [(0.36, 0.40, 0.42, 0.62, '#efeff3'), (0.58, 0.42, 0.64, 0.64, '#e4e4ea')]:
            img = floor_shadow(img, (ax + bx) / 2 * w + 10, by * h + 40, 90, 18, 0.75, w, h)
            img = capsule(img, ax * w, ay * h, bx * w, by * h, h * 0.085, hexrgb(a), (-0.45, -0.75, 0.55), hexrgb(glow), w, h)
    else:  # halo
        cx, cy = w / 2, h * 0.5
        img = floor_shadow(img, cx, cy + 150, 300, 30, 0.8, w, h)
        img = ring(img, cx, cy, h * 0.28, h * 0.05, 0.42, hexrgb('#d8d8de'), (-0.4, -0.8, 0.5), hexrgb(glow), w, h, front=False)
        img = ring(img, cx, cy, h * 0.28, h * 0.05, 0.42, hexrgb('#d8d8de'), (-0.4, -0.8, 0.5), hexrgb(glow), w, h, front=True)
    return grain(down(img, w // SS, h // SS), 0.012, seed)


# ───────────────────────────────────────────────────────── meridian: the flat-lay
SUN = (26, 34)  # hard-shadow offset (px at 1x), the sun from the upper left


def paper(w, h, c, seed, vignette=0.12):
    x, y = grid(w, h)
    nx, ny = x / w - 0.35, y / h - 0.3
    base = np.zeros((h, w, 3), np.float32) + hexrgb(c)
    light = (1 - vignette * np.clip(np.sqrt(nx * nx + ny * ny) * 1.2, 0, 1))[..., None]
    rng = np.random.default_rng(seed)
    fiber = blur(rng.random((h, w)).astype(np.float32), 1.2)[..., None] - 0.5
    return base * light + fiber * 0.03


class Layer:
    """Draw shapes with PIL on a supersampled RGBA canvas, then cast a hard sun shadow."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def arr(self):
        return np.asarray(self.im).astype(np.float32) / 255


def composite(base, layer, shadow=0.32, soft=6):
    a = layer.arr()
    alpha = a[..., 3]
    sx, sy = SUN[0] * SS, SUN[1] * SS
    sh = np.zeros_like(alpha)
    sh[sy:, sx:] = alpha[:-sy, :-sx]
    sh = blur(sh, soft * SS)
    base = base * (1 - (sh * shadow)[..., None])
    return base * (1 - alpha[..., None]) + a[..., :3] * alpha[..., None]


def bean(d, cx, cy, s, ang):
    pts = []
    for i in range(48):
        t = i / 48 * 2 * math.pi
        x, y = math.cos(t) * s, math.sin(t) * s * 0.68
        ca, sa = math.cos(ang), math.sin(ang)
        pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    d.polygon(pts, fill=(92, 52, 30, 255))
    # the crease
    line = []
    for i in range(13):
        u = -0.8 + 1.6 * i / 12
        x, y = u * s, math.sin(u * 2.4) * s * 0.12
        ca, sa = math.cos(ang), math.sin(ang)
        line.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    d.line(line, fill=(48, 25, 14, 255), width=max(2, int(s * 0.12)))
    hx, hy = cx - s * 0.3 * math.cos(ang) + s * 0.2 * math.sin(ang), cy - s * 0.3 * math.sin(ang) - s * 0.2 * math.cos(ang)
    d.ellipse([hx - s * 0.18, hy - s * 0.08, hx + s * 0.18, hy + s * 0.08], fill=(150, 98, 64, 160))


def meridian_hero(seed):
    w, h = 900 * SS, 900 * SS
    rng = random.Random(seed)
    img = paper(w, h, '#ff6b35', seed, vignette=0)  # the hero block is this paper's colour: no seam
    L = Layer(w, h)
    d = L.d
    cx, cy = w * 0.5, h * 0.52
    # saucer, cup, coffee, latte heart
    d.ellipse([cx - 300 * SS, cy - 300 * SS, cx + 300 * SS, cy + 300 * SS], fill=(250, 246, 240, 255))
    d.ellipse([cx - 236 * SS, cy - 236 * SS, cx + 236 * SS, cy + 236 * SS], fill=(236, 230, 222, 255))
    d.ellipse([cx - 200 * SS, cy - 200 * SS, cx + 200 * SS, cy + 200 * SS], fill=(255, 79, 154, 255))  # pink cup
    d.ellipse([cx - 176 * SS, cy - 176 * SS, cx + 176 * SS, cy + 176 * SS], fill=(124, 72, 40, 255))
    d.ellipse([cx - 150 * SS, cy - 150 * SS, cx + 150 * SS, cy + 150 * SS], fill=(168, 112, 70, 255))
    # handle
    d.rounded_rectangle([cx + 190 * SS, cy - 40 * SS, cx + 290 * SS, cy + 40 * SS], radius=40 * SS, fill=(255, 79, 154, 255))
    # latte art: a heart
    hs = 96 * SS
    d.ellipse([cx - hs, cy - hs * 0.75, cx, cy + hs * 0.25], fill=(246, 232, 214, 255))
    d.ellipse([cx, cy - hs * 0.75, cx + hs, cy + hs * 0.25], fill=(246, 232, 214, 255))
    d.polygon([(cx - hs * 0.97, cy - hs * 0.15), (cx + hs * 0.97, cy - hs * 0.15), (cx, cy + hs * 1.0)], fill=(246, 232, 214, 255))
    # spoon
    d.rounded_rectangle([cx - 420 * SS, cy + 250 * SS, cx - 120 * SS, cy + 276 * SS], radius=13 * SS, fill=(255, 210, 63, 255))
    d.ellipse([cx - 470 * SS, cy + 220 * SS, cx - 370 * SS, cy + 306 * SS], fill=(255, 210, 63, 255))
    for _ in range(26):
        a = rng.uniform(0, 2 * math.pi); rr = rng.uniform(330, 470) * SS
        bx, by = cx + math.cos(a) * rr, cy + math.sin(a) * rr
        if 0 < bx < w and 0 < by < h:
            bean(d, bx, by, rng.uniform(24, 30) * SS, rng.uniform(0, math.pi))
    img = composite(img, L, shadow=0.34, soft=5)
    # a gloss on the coffee
    x, y = grid(w, h)
    gl = np.exp(-(((x - (cx - 60 * SS)) / (70 * SS)) ** 2 + ((y - (cy - 90 * SS)) / (40 * SS)) ** 2)) * 0.18
    img = img + gl[..., None]
    return grain(down(img, w // SS, h // SS), 0.014, seed)


def pouch(seed, bg, bag, label, ink, stripe):
    w, h = 640 * SS, 560 * SS
    img = paper(w, h, bg, seed)
    L = Layer(w, h)
    d = L.d
    bw, bh = 300 * SS, 400 * SS
    x0, y0 = (w - bw) / 2, (h - bh) / 2 + 6 * SS
    # pouch body with crimped top
    d.rounded_rectangle([x0, y0, x0 + bw, y0 + bh], radius=22 * SS, fill=hexcolor(bag))
    d.rectangle([x0 + 6 * SS, y0 + 10 * SS, x0 + bw - 6 * SS, y0 + 34 * SS], fill=shade_hex(bag, 0.86))
    for i in range(18):
        xx = x0 + 14 * SS + i * (bw - 28 * SS) / 17
        d.line([(xx, y0 + 12 * SS), (xx, y0 + 32 * SS)], fill=shade_hex(bag, 0.74), width=2 * SS)
    # label block
    lx0, ly0 = x0 + 34 * SS, y0 + 92 * SS
    d.rounded_rectangle([lx0, ly0, x0 + bw - 34 * SS, ly0 + 210 * SS], radius=16 * SS, fill=hexcolor(label))
    d.ellipse([w / 2 - 44 * SS, ly0 + 28 * SS, w / 2 + 44 * SS, ly0 + 116 * SS], fill=hexcolor(stripe))
    d.ellipse([w / 2 - 16 * SS, ly0 + 56 * SS, w / 2 + 16 * SS, ly0 + 88 * SS], fill=hexcolor(label))
    for k, ww in enumerate((150, 110, 130)):
        yy = ly0 + 140 * SS + k * 20 * SS
        d.rounded_rectangle([w / 2 - ww / 2 * SS, yy, w / 2 + ww / 2 * SS, yy + 9 * SS], radius=4 * SS, fill=hexcolor(ink))
    # sun stripe on the pouch's left fold
    d.rectangle([x0 + 18 * SS, y0 + 44 * SS, x0 + 30 * SS, y0 + bh - 18 * SS], fill=(255, 255, 255, 46))
    rng = random.Random(seed)
    for _ in range(9):
        bean(d, rng.uniform(40, 150) * SS if rng.random() < 0.5 else rng.uniform(490, 600) * SS,
             rng.uniform(380, 520) * SS, rng.uniform(20, 25) * SS, rng.uniform(0, math.pi))
    img = composite(img, L, shadow=0.3, soft=5)
    return grain(down(img, w // SS, h // SS), 0.014, seed)


def hexcolor(c, a=255):
    v = (hexrgb(c) * 255).astype(int)
    return (int(v[0]), int(v[1]), int(v[2]), a)


def shade_hex(c, k):
    v = (hexrgb(c) * 255 * k).astype(int)
    return (int(v[0]), int(v[1]), int(v[2]), 255)


SHOTS = {
    'synco-hero': lambda: synco_hero(11),
    'synco-orb': lambda: synco_card('orb', '#7b5cff', 12),
    'synco-pods': lambda: synco_card('pods', '#18b4ff', 13),
    'synco-halo': lambda: synco_card('halo', '#ff4d8d', 14),
    'meridian-hero': lambda: meridian_hero(21),
    'meridian-sunrise': lambda: pouch(22, '#ffd23f', '#ff4f9a', '#fff4e0', '#1f3cff', '#ff6b35'),
    'meridian-cobalt': lambda: pouch(23, '#ff9ecb', '#1f3cff', '#ffd23f', '#1f1a33', '#ff4f9a'),
    'meridian-jungle': lambda: pouch(24, '#5ad1ff', '#16a34a', '#ffe8f2', '#0f3b22', '#ffd23f'),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    sheet = []
    for name, fn in SHOTS.items():
        im = to_img(fn())
        p = OUT / f'{name}.webp'
        im.save(p, 'WEBP', quality=Q, method=6)
        sheet.append(im)
        b64 = base64.b64encode(p.read_bytes()).decode()
        rows.append(f"  '{name}': 'data:image/webp;base64,{b64}',")
        print(f'{name:18} {im.size[0]}×{im.size[1]}  {p.stat().st_size / 1024:.1f} KB')
    (OUT / 'landing-data.ts').write_text(
        '/**\n * GENERATED by scratchpad/landing-photos/make.py — do not edit; re-run the script.\n'
        ' * The two landing sites\' photographs (synco.com, meridianroast.com) as data: URLs — the same\n'
        ' * contract as ./data.ts. Placeholders until the designer supplies real photography.\n */\n'
        'export const LANDING_PHOTO_DATA = {\n' + '\n'.join(rows) + '\n} as const\n\n'
        'export type LandingPhotoId = keyof typeof LANDING_PHOTO_DATA\n')
    if '--sheet' in sys.argv:
        out = sys.argv[sys.argv.index('--sheet') + 1]
        tw = 360
        thumbs = [s.resize((tw, int(tw * s.size[1] / s.size[0]))) for s in sheet]
        H = max(t.size[1] for t in thumbs)
        canvas = Image.new('RGB', (tw * 4 + 50, H * 2 + 30), (30, 30, 30))
        for i, t in enumerate(thumbs):
            canvas.paste(t, (10 + (i % 4) * (tw + 10), 10 + (i // 4) * (H + 10)))
        canvas.save(out)


if __name__ == '__main__':
    main()
