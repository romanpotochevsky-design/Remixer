"""Compose the raw stills film.mjs wrote into one strip per (motion, phase)."""
import glob, os, re
from PIL import Image, ImageDraw
OUT = 'scratchpad/pane-motions'
groups = {}
for f in glob.glob(f'{OUT}/raw-*.jpg'):
    m = re.match(r'.*/raw-(\w+)-(open|switch|close)-(\d+)-(\d+)\.jpg$', f)
    if not m: continue
    groups.setdefault((m.group(1), m.group(2)), []).append((int(m.group(3)), int(m.group(4)), f))
for (motion, phase), shots in sorted(groups.items()):
    shots.sort()
    w = 400
    ims = [Image.open(f).convert('RGB') for _, _, f in shots]
    h = round(ims[0].height * w / ims[0].width)
    sheet = Image.new('RGB', (w * len(ims) + 8 * (len(ims) - 1), h + 26), (0, 0, 0))
    d = ImageDraw.Draw(sheet)
    for i, ((_, t, _f), im) in enumerate(zip(shots, ims)):
        sheet.paste(im.resize((w, h)), (i * (w + 8), 0))
        d.text((i * (w + 8) + 6, h + 7), f'{t} ms', fill=(187, 187, 187))
    sheet.save(f'{OUT}/{motion}-{phase}.jpg', quality=84)
    print('wrote', f'{OUT}/{motion}-{phase}.jpg')
for f in glob.glob(f'{OUT}/raw-*.jpg'): os.remove(f)
