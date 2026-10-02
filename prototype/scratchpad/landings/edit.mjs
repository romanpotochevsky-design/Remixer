import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://localhost:4173/?p=built&v=false&u=0&a=paid&i=dh-free&d=staging&t=22&c=640'); await p.waitForTimeout(1500)
await p.click('.home-card-face'); await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 20000 }); await p.waitForTimeout(800)
const out = {}
for (const id of ['synco', 'meridian']) {
  await p.click('[data-site-switch]'); await p.waitForTimeout(1500)
  await p.click(`[data-site-card="${id}"] [data-site-thumb]`, { force: true }); await p.waitForTimeout(3000)
  out[id] = { bar: !!(await p.$('[data-ve-tool]')) }
  await p.click('[data-ve-tool="edit"]').catch((e) => (out[id].clickErr = e.message.slice(0, 80)))
  await p.waitForTimeout(500)
  const k = `[data-edit="${id}.hero.title"]`
  out[id].host = !!(await p.$(k))
  await p.click(k); await p.keyboard.press('End'); await p.keyboard.type(' Yes.'); await p.mouse.click(1000, 880)
  await p.waitForTimeout(500)
  out[id].count = await p.$eval('[data-ve-bar], [data-edit-bar]', (e) => e.innerText).catch(() => null)
  await p.screenshot({ path: `scratchpad/landings/${id}-edit.png` })
  const save = await p.$('button:has-text("Save")'); if (save) await save.click()
  await p.waitForTimeout(1200)
  out[id].title = await p.$eval('h1', (e) => e.textContent)
  out[id].photoHost = !!(await p.$(`[data-edit="${id}.hero.photo"]`))
}
await p.click('[data-site-switch]'); await p.waitForTimeout(1500)
out.shelfSynco = await p.$eval('[data-site-card="synco"]', (e) => e.innerText)
await p.screenshot({ path: 'scratchpad/landings/shelf.png' })
console.log(JSON.stringify(out, null, 1), errs)
await b.close()
