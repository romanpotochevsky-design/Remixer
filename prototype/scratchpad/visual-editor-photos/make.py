"""PLACEHOLDER PHOTOGRAPHS for the demo site — generated, deterministic, tiny.

The site in the preview (modules/preview/SitePreview.tsx) has no photographs: every
"photo" is a div with the dish's gradient tint and an emoji. The Visual Editor's photo
replacement needs REAL raster images to replace, and the published artifact's CSP blocks
every external URL, so the images must ship inside the single-file page as data: URLs.
Until the designer supplies real food photos, this script paints ten out-of-focus
"food photography" stand-ins: a moody vignette in the dish's colour family, blurred
bokeh lights, the ghost of a plate with a soft highlight, a whisper of grain.

Why they look the way they do: a flat gradient reads as a placeholder tile, and clip-art
reads as a joke; an out-of-focus photograph reads as a photograph. Bokeh is the cheapest
image that is unmistakably photographic — and, being all soft edges, it compresses to
almost nothing (each file ≤ ~20 KB at WebP q70, ten files ≈ 150 KB of base64 in the page).

Deterministic: every random decision comes from `random.Random(f'{SEED}:{id}')`, so the
files are byte-identical on every run and the committed WebPs can be regenerated at will.
Pillow only — no numpy — so the whole pipeline is layers, blurs and blend modes, drawn
at full size (560×360 is small enough that per-pixel Python is still under a second).

HOW THEY REACH THE PAGE. Vite 5.4 ignores `?inline` on images (it is a CSS-only query
there; asset `?inline` arrived in Vite 6) — measured: the imports came out as emitted
`/assets/*.webp` files, exactly the URLs the artifact's CSP kills — and `assetsInlineLimit`
lives in vite.config.ts, which this task does not touch. So the script ALSO writes
`photos/data.ts`, a generated module with each file as a `data:image/webp;base64,…`
string. `photos.ts` imports that: no loader, no config, the pixels are string literals
in the bundle. When the designer's real photos land in `photos/` under the same names,
`--encode-only` refreshes data.ts without repainting the placeholders over them.

    python3 scratchpad/visual-editor-photos/make.py                # render *.webp, then write data.ts
    python3 scratchpad/visual-editor-photos/make.py --sheet X.png  # …and a PNG contact sheet
    python3 scratchpad/visual-editor-photos/make.py --encode-only  # only re-encode photos/*.webp → data.ts
"""
from __future__ import annotations

import random
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

W, H = 560, 360
QUALITY = 70
SEED = 'fit-ration-2026'
OUT = Path(__file__).resolve().parents[2] / 'src' / 'modules' / 'preview' / 'photos'

# ── the subjects ───────────────────────────────────────────────────────────────────────
# Meal ids and tints are verbatim from src/data/cloud.ts (MEALS); the service tiles and the
# About-page kitchen scene carry the tints SitePreview.tsx paints them with.
# `lights` — the colour family of the bokeh discs (kitchen lamps, candles, a window);
# `dish` — the saturated colour of the food on the plate; `warm` nudges the whole frame.
SUBJECTS = [
    dict(id='power-bowl', tint=('#dff1e4', '#b7dfc4'), dish='#5b8f4a', lights=('#f4e4b0', '#c9e6b9'), warm=0.35),
    dict(id='lean-beef-rice', tint=('#f6e8d9', '#eacdaa'), dish='#8a4a2a', lights=('#ffd9a0', '#f2b070'), warm=0.7),
    dict(id='salmon-teriyaki', tint=('#fbe3dc', '#f3bfae'), dish='#d2683f', lights=('#ffd3c2', '#f4a582'), warm=0.6),
    dict(id='chicken-pesto-pasta', tint=('#eef2da', '#d7e3ae'), dish='#7f9a3a', lights=('#f6f0c0', '#cfe08a'), warm=0.4),
    dict(id='greek-wrap', tint=('#e7ecf6', '#c3d2ec'), dish='#7a8ea8', lights=('#f0f4ff', '#c8d8f6'), warm=0.15),
    dict(id='protein-pancakes', tint=('#f9ecdf', '#f0d3b0'), dish='#b27a3c', lights=('#ffe2b8', '#f7c78a'), warm=0.65),
    # About page: a warm kitchen at dawn — the green tint pulled towards amber, candle-like lights.
    dict(id='kitchen', tint=('#dff1e4', '#b7dfc4'), dish='#c98a3a', lights=('#ffd28a', '#ffb45c'), warm=0.85, discs=(16, 22), plate=0.4, garland=True),
    dict(id='svc-weekly-plan', tint=('#dff1e4', '#b7dfc4'), dish='#4f8a5c', lights=('#eef7d8', '#b9dfb2'), warm=0.3),
    dict(id='svc-custom-macros', tint=('#f6e8d9', '#eacdaa'), dish='#a0652f', lights=('#ffe0b0', '#f0bd7a'), warm=0.6),
    dict(id='svc-office-delivery', tint=('#e7ecf6', '#c3d2ec'), dish='#5f7396', lights=('#eef3ff', '#b8cdf2'), warm=0.1),
]


# ── colour helpers ─────────────────────────────────────────────────────────────────────
def hex2rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip('#')
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def clamp(v: float) -> int:
    return max(0, min(255, int(round(v))))


def mix(a, b, t: float):
    return tuple(clamp(x + (y - x) * t) for x, y in zip(a, b))


def scale(c, k: float):
    return tuple(clamp(x * k) for x in c)


def saturate(c, k: float):
    g = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
    return tuple(clamp(g + (x - g) * k) for x in c)


def warmed(c, t: float):
    """Push a colour towards amber by `t` — the frame's colour temperature."""
    return mix(c, (255, 176, 96), t)


# ── layers ─────────────────────────────────────────────────────────────────────────────
def radial_mask(cx: float, cy: float, rx: float, ry: float, inner: int = 255, outer: int = 0) -> Image.Image:
    """An elliptical falloff: `inner` at (cx, cy), `outer` at the ellipse's edge and beyond,
    eased with a smoothstep so the slope is zero where it meets `outer` — no visible ring.
    ⚠️ NOT Pillow's `Image.radial_gradient`: that square reaches 255 only at its CORNERS and
    sits near 180 at the edge midpoints, so pasting it onto an `outer` canvas leaves a hard
    seam along every box edge that lands inside the frame (measured: a 7-level step at the
    key light's box edges, x=38 and x=520). Computed by hand at quarter resolution — the
    field is smooth, so bicubic upscaling reproduces it — 12,600 evaluations, not 201,600."""
    q = 4
    w, h = W // q, H // q
    span = outer - inner
    px = bytearray(w * h)
    for j in range(h):
        dy = ((j + 0.5) * q - cy) / ry
        for i in range(w):
            dx = ((i + 0.5) * q - cx) / rx
            t = min(1.0, (dx * dx + dy * dy) ** 0.5)
            px[j * w + i] = clamp(inner + span * t * t * (3 - 2 * t))
    return Image.frombytes('L', (w, h), bytes(px)).resize((W, H), Image.BICUBIC)


def soft_ellipse(box, color, alpha: int, blur: float) -> Image.Image:
    """One blurred RGBA ellipse on a transparent frame — the atom every prop is built from."""
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(box, fill=tuple(color) + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(blur)) if blur else layer


def backdrop(rng: random.Random, tint, warm: float) -> Image.Image:
    """Two planes — a dark wall above, a lit tabletop below — softly divided, then vignetted.
    Both are the dish's tint pushed down into shadow: the tints are pastels, and moody food
    photography lives three stops darker than a pastel. Saturation goes UP as brightness
    goes down, or the shadows turn to grey mud instead of deep colour."""
    lo = saturate(scale(hex2rgb(tint[1]), 0.22), 2.1)  # the wall
    hi = saturate(scale(hex2rgb(tint[0]), 0.40), 1.7)  # the tabletop, where the light lands
    lo, hi = warmed(lo, warm * 0.30), warmed(hi, warm * 0.40)
    wall = Image.new('RGB', (W, H), lo)
    table = Image.new('RGB', (W, H), hi)
    # the horizon: a slightly tilted split around 45% height, blurred into a soft band
    horizon = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(horizon)
    y0 = H * rng.uniform(0.38, 0.50)
    tilt = rng.uniform(-22, 22)
    d.polygon([(0, y0 - tilt), (W, y0 + tilt), (W, H), (0, H)], fill=255)
    horizon = horizon.filter(ImageFilter.GaussianBlur(40))
    base = Image.composite(table, wall, horizon)
    # key light from one upper corner: brightens where it falls, leaves the far corner in shadow
    side = rng.choice((-1, 1))
    key = radial_mask(W * (0.5 + 0.32 * side), H * 0.28, W * 0.75, H * 0.95, inner=255, outer=0)
    lit = ImageEnhance.Brightness(base).enhance(1.38)
    base = Image.composite(lit, base, key)
    # the vignette proper: the corners fall away into near-black
    vig = radial_mask(W * 0.5, H * 0.55, W * 0.74, H * 0.80, inner=255, outer=40)
    dark = ImageEnhance.Brightness(base).enhance(0.35)
    base = Image.composite(base, dark, vig)
    # a bloom of light where the key comes from — a window, a lamp just out of frame
    bloom = Image.new('RGB', (W, H), (0, 0, 0))
    bx, by = W * (0.5 + 0.55 * side), H * rng.uniform(-0.1, 0.15)
    ImageDraw.Draw(bloom).ellipse([bx - 200, by - 130, bx + 200, by + 130], fill=scale(warmed(hi, warm * 0.5), 0.42))
    bloom = bloom.filter(ImageFilter.GaussianBlur(70))
    return ImageChops.screen(base, bloom), side


def plate(rng: random.Random, base: Image.Image, dish, tint, warm: float, presence: float, side: int) -> Image.Image:
    """The ghost of a plate: a pale ellipse low in the frame, its near rim catching the key
    light as a crescent, a mound of the dish's colour in the middle, a soft shadow beneath.
    Blurred just past focus — a hint, not a drawing. Every frame places it differently
    (a bowl or a plate, centred or cut by the bottom edge), or ten frames read as one
    template. `presence` scales how much the plate shows at all."""
    bowl = rng.random() < 0.4
    cx = W * rng.uniform(0.36, 0.64)
    cy = H * (rng.uniform(0.66, 0.82) if not bowl else rng.uniform(0.60, 0.74))
    rx = W * (rng.uniform(0.30, 0.42) if not bowl else rng.uniform(0.20, 0.27))
    ry = rx * (rng.uniform(0.32, 0.42) if not bowl else rng.uniform(0.52, 0.62))
    out = base.convert('RGBA')
    # shadow, pooled beneath and slightly away from the light
    out = Image.alpha_composite(out, soft_ellipse([cx - rx * 1.06 - side * 10, cy - ry * 0.5 + 14, cx + rx * 1.06 - side * 10, cy + ry * 1.3 + 16], (0, 0, 0), int(150 * presence), 24))
    # plate body: pale, warmed, translucent so the table shows through
    pale = warmed(mix(hex2rgb(tint[0]), (255, 255, 255), 0.5), warm * 0.3)
    body = mix(pale, hex2rgb(dish), 0.35) if bowl else pale
    out = Image.alpha_composite(out, soft_ellipse([cx - rx, cy - ry, cx + rx, cy + ry], body, int((140 if bowl else 80) * presence), 9))
    if bowl:  # a bowl has a dark well: the inside falls into shadow (wide and very soft, or the
        # pale ring left between well and rim reads as a tyre, not a bowl)
        out = Image.alpha_composite(out, soft_ellipse([cx - rx * 0.92, cy - ry * 0.78, cx + rx * 0.92, cy + ry * 0.66], scale(body, 0.45), int(135 * presence), 13))
    # the food: overlapping blobs of the dish's colour — a dark base, mounds lighter AND
    # darker than the dish (one shade reads as a puddle; two read as texture), a lit crown
    dish_c = saturate(warmed(hex2rgb(dish), warm * 0.25), 0.88)
    fx, fy = cx + rx * rng.uniform(-0.10, 0.10), cy - ry * (0.02 if not bowl else 0.10)
    frx, fry = rx * (0.60 if not bowl else 0.72), ry * (0.68 if not bowl else 0.55)
    food = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(food)
    fd.ellipse([fx - frx, fy - fry, fx + frx, fy + fry], fill=scale(dish_c, 0.5) + (int(235 * presence),))
    for _ in range(rng.randint(6, 9)):
        ox, oy = frx * rng.uniform(-0.55, 0.55), fry * rng.uniform(-0.5, 0.4)
        r = frx * rng.uniform(0.26, 0.5)
        c = scale(dish_c, rng.uniform(0.55, 0.8)) if rng.random() < 0.45 else mix(dish_c, (255, 236, 200), rng.uniform(0.0, 0.3))
        fd.ellipse([fx + ox - r, fy + oy - r * 0.72, fx + ox + r, fy + oy + r * 0.72], fill=c + (int(210 * presence),))
    # the crown catches the key light
    fd.ellipse([fx - frx * 0.5 + side * frx * 0.15, fy - fry * 0.85, fx + frx * 0.4 + side * frx * 0.15, fy + fry * 0.0], fill=mix(dish_c, (255, 245, 220), 0.32) + (int(160 * presence),))
    out = Image.alpha_composite(out, food.filter(ImageFilter.GaussianBlur(8)))
    # glints: the out-of-focus specular of a glaze, an oil drop — soft and cream, not white dots
    for _ in range(rng.randint(2, 4)):
        gx, gy = fx + frx * rng.uniform(-0.6, 0.6), fy + fry * rng.uniform(-0.7, 0.4)
        r = rng.uniform(6, 13)
        out = Image.alpha_composite(out, soft_ellipse([gx - r, gy - r * 0.65, gx + r, gy + r * 0.65], mix(dish_c, (255, 246, 220), rng.uniform(0.45, 0.7)), int(120 * presence), 4))
    # rim highlight: a crescent on the side facing the light, fading at both ends
    rim = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    a0 = 200 if side < 0 else 280  # PIL angles run clockwise from 3 o'clock; the upper arc is 180–360
    ImageDraw.Draw(rim).arc([cx - rx, cy - ry, cx + rx, cy + ry], a0 - 20, a0 + 100, fill=mix(pale, (255, 255, 255), 0.7) + (int(190 * presence),), width=4)
    fade = radial_mask(cx + side * rx * 0.55, cy - ry * 0.9, rx * 0.9, ry * 1.6, inner=255, outer=0)
    rim.putalpha(ImageChops.multiply(rim.getchannel('A'), fade))
    out = Image.alpha_composite(out, rim.filter(ImageFilter.GaussianBlur(4)))
    # a broad soft specular on the plate's lit side
    out = Image.alpha_composite(out, soft_ellipse([cx + side * rx * 0.35 - rx * 0.35, cy - ry * 0.95, cx + side * rx * 0.35 + rx * 0.35, cy - ry * 0.35], mix(pale, (255, 255, 255), 0.5), int(70 * presence), 16))
    return out.convert('RGB')


def foreground(rng: random.Random, base: Image.Image) -> Image.Image:
    """Something dark and far out of focus crossing a bottom corner — the edge of a napkin,
    the back of a chair. It is what a shallow lens does to whatever is nearest, and it
    gives the frame a near plane, so the plate sits IN a space instead of ON a gradient."""
    side = rng.choice((-1, 1))
    x = W * (0.5 + 0.62 * side)
    y = H * rng.uniform(1.0, 1.15)
    r = rng.uniform(150, 230)
    dark = soft_ellipse([x - r * 1.4, y - r * 0.7, x + r * 1.4, y + r * 0.7], (6, 5, 7), rng.randint(110, 170), 34)
    return Image.alpha_composite(base.convert('RGBA'), dark).convert('RGB')


def bokeh(rng: random.Random, base: Image.Image, lights, warm: float, count: tuple[int, int], garland: bool) -> Image.Image:
    """Blurred discs of light, screen-blended over the frame. Two depths: far lights are big,
    dim and very soft; near ones are small, brighter and keep a faint rim — the signature of
    a real lens. Most of them live in the upper half, where a kitchen keeps its lamps.
    `garland` strings the near ones along a sagging line — fairy lights across a window."""
    la, lb = hex2rgb(lights[0]), hex2rgb(lights[1])
    far = Image.new('RGB', (W, H), (0, 0, 0))
    near = Image.new('RGB', (W, H), (0, 0, 0))
    fd, nd = ImageDraw.Draw(far), ImageDraw.Draw(near)
    for _ in range(rng.randint(*count)):
        x = rng.uniform(-0.05, 1.05) * W
        y = (rng.uniform(-0.1, 0.55) if rng.random() < 0.8 else rng.uniform(0.5, 1.05)) * H
        r = rng.uniform(26, 70)
        c = warmed(mix(la, lb, rng.random()), warm * 0.3)
        c = scale(c, rng.uniform(0.16, 0.38))  # dim: it is the screen blend that lifts it
        fd.ellipse([x - r, y - r, x + r, y + r], fill=c)
    if garland:
        n = rng.randint(7, 9)
        x0, x1 = W * rng.uniform(-0.02, 0.08), W * rng.uniform(0.92, 1.02)
        ya, yb, sag = H * rng.uniform(0.08, 0.18), H * rng.uniform(0.06, 0.16), H * rng.uniform(0.12, 0.2)
        pts = []
        for i in range(n):
            t = i / (n - 1)
            pts.append((x0 + (x1 - x0) * t + rng.uniform(-8, 8), ya + (yb - ya) * t + sag * 4 * t * (1 - t) + rng.uniform(-5, 5)))
    else:
        pts = [(rng.uniform(0.05, 0.95) * W, rng.uniform(0.02, 0.48) * H) for _ in range(rng.randint(3, 5))]
    for x, y in pts:
        r = rng.uniform(9, 17)
        c = warmed(mix(la, lb, rng.random()), warm * 0.3)
        nd.ellipse([x - r, y - r, x + r, y + r], fill=scale(c, rng.uniform(0.30, 0.52)))
        nd.ellipse([x - r, y - r, x + r, y + r], outline=scale(c, 0.8), width=2)
    far = far.filter(ImageFilter.GaussianBlur(rng.uniform(12, 18)))
    near = near.filter(ImageFilter.GaussianBlur(rng.uniform(2.4, 3.6)))
    out = ImageChops.screen(base, far)
    return ImageChops.screen(out, near)


def grain(rng: random.Random, img: Image.Image, amount: float = 0.09) -> Image.Image:
    """Film grain, faint: two uniform noise fields averaged (≈ triangular, close enough to
    Gaussian for ±6 levels) and added around zero. Faint on purpose — grain is the one
    ingredient that fights WebP, and 0.09 keeps every file under the 20 KB budget."""
    a = Image.frombytes('L', (W, H), rng.randbytes(W * H))
    b = Image.frombytes('L', (W, H), rng.randbytes(W * H))
    n = ImageChops.add(a, b, scale=2.0).convert('RGB')
    noisy = ImageChops.add(img, n, scale=1.0, offset=-128)
    return Image.blend(img, noisy, amount)


def render(spec: dict) -> Image.Image:
    rng = random.Random(f"{SEED}:{spec['id']}")
    img, side = backdrop(rng, spec['tint'], spec['warm'])
    img = plate(rng, img, spec['dish'], spec['tint'], spec['warm'], spec.get('plate', 1.0), side)
    img = bokeh(rng, img, spec['lights'], spec['warm'], spec.get('discs', (9, 14)), spec.get('garland', False))
    img = foreground(rng, img)
    # a gentle S-curve: the shadows sink, the highlights hold — the "grade" of a moody frame
    curve = [clamp(255 * (t * t * (3 - 2 * t) * 0.55 + t * 0.45)) for t in (v / 255 for v in range(256))]
    img = img.point(curve * 3)
    img = ImageEnhance.Color(img).enhance(1.12)
    return grain(rng, img, 0.11)


def encode_module() -> None:
    """Write photos/data.ts: every `photos/<id>.webp` for an id in SUBJECTS, as a data: URL.
    Generated, so it carries the warning in its own header; ids keep SUBJECTS' order."""
    import base64

    lines = [
        '/**',
        ' * GENERATED by scratchpad/visual-editor-photos/make.py — do not edit; re-run the script.',
        ' *',
        ' * The demo site\'s photographs as data: URLs, one per file in this folder. They are string',
        ' * literals rather than asset imports because Vite 5.4 ignores `?inline` on images (a CSS-only',
        ' * query there) and would emit them as `/assets/*.webp` — URLs the published artifact\'s CSP',
        ' * blocks — while `assetsInlineLimit` lives in vite.config.ts. A literal needs no loader and',
        ' * no config. `photos.ts` adds the dimensions and the alt texts.',
        ' */',
        'export const PHOTO_DATA = {',
    ]
    total = 0
    for spec in SUBJECTS:
        path = OUT / f"{spec['id']}.webp"
        raw = path.read_bytes()
        total += len(raw)
        lines.append(f"  '{spec['id']}': 'data:image/webp;base64,{base64.b64encode(raw).decode('ascii')}',")
    lines += ['} as const', '', 'export type PhotoId = keyof typeof PHOTO_DATA', '']
    out = OUT / 'data.ts'
    out.write_text('\n'.join(lines))
    print(f"{out.name:28s} {out.stat().st_size:6d} B  ({total} B of WebP as base64)")


def main(argv: list[str]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sheet_path = None
    only: set[str] = set()
    encode_only = False
    args = iter(argv)
    for a in args:  # `--sheet PATH`, `--encode-only`, and any number of ids to render (default: all)
        if a == '--sheet':
            sheet_path = Path(next(args))
        elif a == '--encode-only':
            encode_only = True
        else:
            only.add(a)
    frames = []
    total = 0
    for spec in SUBJECTS:
        if encode_only or (only and spec['id'] not in only):
            continue
        img = render(spec)
        path = OUT / f"{spec['id']}.webp"
        img.save(path, 'WEBP', quality=QUALITY, method=6)
        size = path.stat().st_size
        total += size
        frames.append(img)
        print(f"{path.name:28s} {size:6d} B")
    if frames:
        print(f"{'total':28s} {total:6d} B")
    encode_module()
    if sheet_path and frames:
        cols = 2
        rows = (len(frames) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * W + (cols + 1) * 16, rows * H + (rows + 1) * 16), (9, 9, 11))
        for i, f in enumerate(frames):
            sheet.paste(f, (16 + (i % cols) * (W + 16), 16 + (i // cols) * (H + 16)))
        sheet.save(sheet_path)
        print(f"contact sheet → {sheet_path}")


if __name__ == '__main__':
    main(sys.argv[1:])
