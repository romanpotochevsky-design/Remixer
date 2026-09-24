/* THREE WAYS TO LABEL A ROW OF THE PAGE SWITCHER — shot on the production build so the designer
   compares pixels, not words (25.09.2026, his question: «а почему у нас у страниц нет черточки в начале
   название страницы?»). A = names, as built. B = routes with a dim leading slash, Lovable's format.
   C = name on the left, the route muted on the right. B and C are DOM rewrites over the live menu —
   nothing in the product changes until he picks. */
import { chromium } from 'playwright'
import { execSync } from 'node:child_process'
const BASE = process.env.BASE || 'http://localhost:4173'
const OUT = 'scratchpad/page-switcher'
const b = await chromium.launch({ executablePath: process.env.CHROME })
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`${BASE}/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640`, { waitUntil: 'networkidle' })
await p.waitForTimeout(700); await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(600)
const pill = await (await p.$('[data-page-switch]')).boundingBox()
await p.mouse.click(pill.x + 140, pill.y + 20); await p.waitForTimeout(600)
/* hover row 3 so the active state is in every shot the same way */
const r3 = await (await p.$('[data-page-row="/services"]')).boundingBox()
await p.mouse.move(r3.x + 60, r3.y + 20); await p.waitForTimeout(250)
const menu = await p.$eval('[data-page-menu]', (e) => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height } })
const clip = { x: pill.x - 24, y: pill.y - 16, width: Math.max(pill.width, menu.width) + 48, height: menu.top + menu.height - pill.y + 16 + 16 }
const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png`, clip })
await shot('slash-A')
/* B — Lovable's format: dim slash + slug; the pill says "/" for Home; the field holds "/" selected */
await p.evaluate(() => {
  document.querySelectorAll('[data-page-row]').forEach((r) => {
    const path = r.dataset.pageRow; const label = r.children[1]
    if (r.hasAttribute('data-page-goto')) return
    label.innerHTML = `<span style="color:rgba(255,255,255,.4)">/</span>${path.replace(/^\//, '')}`
  })
  const pl = document.querySelector('[data-page-label]'); pl.textContent = '/'
})
await shot('slash-B')
/* C — name left, route muted right */
await p.evaluate(() => {
  const names = { '/': 'Home', '/about': 'About', '/services': 'Services', '/contact': 'Contact' }
  document.querySelectorAll('[data-page-row]').forEach((r) => {
    const path = r.dataset.pageRow; const label = r.children[1]
    if (r.hasAttribute('data-page-goto')) return
    const name = names[path] || path.slice(1).replace(/^./, (c) => c.toUpperCase())
    label.innerHTML = `<span style="display:flex;justify-content:space-between;gap:12px;min-width:0"><span style="white-space:nowrap">${name}</span><span style="color:rgba(255,255,255,.4);font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap">${path}</span></span>`
  })
  const pl = document.querySelector('[data-page-label]'); pl.textContent = 'Home'
})
await shot('slash-C')
await b.close()
/* the sheet */
execSync(`python3 - <<'PY'
from PIL import Image, ImageDraw, ImageFont
import os
out = '${OUT}'
tiles = [('slash-A.png', 'A · имена (сейчас в прототипе)'), ('slash-B.png', 'B · роуты, как у Lovable'), ('slash-C.png', 'C · имя + роут справа')]
imgs = [Image.open(os.path.join(out, f)) for f, _ in tiles]
w = max(i.width for i in imgs); h = max(i.height for i in imgs)
pad = 40; cap = 64
sheet = Image.new('RGB', (len(imgs) * (w + pad) + pad, h + cap + pad * 2), (9, 9, 11))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 26)
except Exception:
    font = ImageFont.load_default()
for k, (img, (f, label)) in enumerate(zip(imgs, tiles)):
    x = pad + k * (w + pad)
    d.text((x + 8, pad), label, fill=(228, 228, 231), font=font)
    sheet.paste(img, (x, pad + cap))
sheet.save(os.path.join(out, 'sheet-slash-variants.png'))
print(sheet.size)
PY`, { stdio: 'inherit' })
