"""One rail or two? Scan device pixels across the stack's left and right edges.

The clip starts 6 CSS px (12 device px at dpr 2) outside the stack, so the card's own
rail sits at device x=12 on the left and at width-13 on the right. A run of lit pixels
is a line; two runs separated by dark ground on the same scanline is the doubling the
designer photographed.
"""
import sys
from PIL import Image

img = Image.open(sys.argv[1]).convert('RGB')
W, H = img.size
px = img.load()
GROUND = 26  # the card's fill #1a1a1c is 26; anything brighter is a stroke


def runs(y, x0, x1):
    out, run = [], None
    for x in range(x0, x1):
        r, g, b = px[x, y]
        lum = max(r, g, b)
        if lum > GROUND + 6:
            if run is None:
                run = [x, x, lum]
            else:
                run[1] = x
                run[2] = max(run[2], lum)
        elif run is not None:
            out.append(tuple(run)); run = None
    if run is not None:
        out.append(tuple(run))
    return out


worst_l = worst_r = 0
bad = []
for y in range(6, H - 6):
    l = runs(y, 0, 40)
    r = runs(y, W - 40, W)
    worst_l = max(worst_l, len(l))
    worst_r = max(worst_r, len(r))
    if len(l) > 1 or len(r) > 1:
        bad.append((y, l, r))

print(f'image {W}x{H} (device px, dpr 2)')
print(f'left edge: at most {worst_l} run(s) per scanline')
print(f'right edge: at most {worst_r} run(s) per scanline')
print(f'scanlines with a doubled rail: {len(bad)} of {H - 12}')
for y, l, r in bad[:12]:
    print('  y=%d  left=%s  right=%s' % (y, l, r))
