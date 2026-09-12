"""A cross-section through the stack's left edge, printed as numbers.
Device pixels, dpr 2. The card's fill is #1a1a1c = 26; its stroke #353537 = 53."""
import sys
from PIL import Image
img = Image.open(sys.argv[1]).convert('RGB'); W,H = img.size; px = img.load()
for label, y in [(l, int(v)) for l, v in (a.split('=') for a in sys.argv[2:])]:
    row = ' '.join(f'{max(px[x,y]):3d}' for x in range(8, 30))
    print(f'{label:>22}  y={y:4d}  x8..29: {row}')
