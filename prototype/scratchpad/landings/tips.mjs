import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'); await p.waitForTimeout(1500)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(2500)
const shot = async (sel, name) => {
  const r = await p.$eval(sel, (e) => { const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2] })
  await p.mouse.move(r[0], r[1]); await p.waitForTimeout(900)
  const tip = await p.$eval('[role="tooltip"]', (e) => e.innerText).catch(() => null)
  await p.screenshot({ path: `scratchpad/landings/tip-${name}.png`, clip: { x: r[0] - 260, y: r[1] - 160, width: 520, height: 200 } })
  return tip
}
const out = {}
out.edit = await shot('[data-ve-tool="edit"]', 'edit')
out.select = await shot('[data-ve-tool="select"]', 'select')
out.dock = await shot('[data-ve-dock-to-rail]', 'dock')
await p.click('[data-ve-tool="edit"]'); await p.waitForTimeout(500)
out.editOn = await shot('[data-ve-tool="edit"]', 'editon')
await p.click('[data-edit="home.hero.title"]'); await p.keyboard.type('!'); await p.mouse.click(1000, 500); await p.waitForTimeout(800)
out.clear = await shot('[data-ve-clear]', 'clear')
out.save = await shot('[data-ve-save]', 'save')
out.editDirty = await shot('[data-ve-tool="edit"]', 'editdirty')
console.log(JSON.stringify(out, null, 1), errs)
await b.close()
