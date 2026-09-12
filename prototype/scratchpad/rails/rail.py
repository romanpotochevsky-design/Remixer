"""How WIDE is the rail? Two strokes a CSS pixel apart merge into one 2px-wide run —
which is exactly what "двойные бордеры" looks like on screen. Report the width of the
outermost run on every scanline of the stack's straight sides."""
import sys, collections
from PIL import Image
img = Image.open(sys.argv[1]).convert('RGB'); W,H = img.size; px = img.load()
G = 26
def first_run(y, xs):
    run = None
    for x in xs:
        if max(px[x,y]) > G+6:
            run = [x,x] if run is None else [run[0], x]
        elif run is not None:
            return run
    return run
hist = collections.Counter()
worst = []
for y in range(6, H-6):
    for side, xs in (('L', range(0,40)), ('R', range(W-1, W-41, -1))):
        r = first_run(y, xs)
        if r is None: continue
        w = abs(r[1]-r[0])+1
        hist[(side,w)] += 1
        if w > 2: worst.append((side,y,w))
print(sys.argv[1])
for (side,w),n in sorted(hist.items()):
    print(f'  {side}: rail {w} device px ({w/2:g} CSS) on {n} scanlines')
print(f'  scanlines where the rail is thicker than 1 CSS px: {len(worst)}')
