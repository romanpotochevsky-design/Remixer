// A stand for the status slot in the Publish panel's domain row: the REAL panel, staged
// live, with the row's left slot replaced by each candidate form. Screenshots the whole
// panel so the relationship with the button bar's own green dot is what gets compared.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = new URL('./', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const BASE = 'http://localhost:4173'

const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()

async function openPublish(q) {
  await p.goto(`${BASE}?${q}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await p.click('.home-card-face')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 15000 })
  await p.waitForTimeout(400)
  await p.click('header button:has-text("Publish")')
  await p.waitForTimeout(900)
}

const PANEL = '[role="dialog"][aria-label="Publish"]'

// The left slot's candidate markup. Tones: --live #48ba79 · --attention #e5c359.
const CHECK = (fill) => `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="${fill}"/><path d="M4.6 8.3l2.2 2.2 4.6-4.8" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const V = {
  A_dot: {
    title: 'A · сейчас: точка + слово (как в баре)',
    html: `<span style="display:flex;align-items:center;gap:12px"><span style="width:8px;height:8px;border-radius:999px;background:#50b97b"></span><span style="font-size:14px;line-height:1.2;color:#fff">Live</span></span>`,
  },
  B_pill_green: {
    title: 'B · плашка в тон: Live',
    html: `<span style="display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:999px;background:rgba(72,186,121,.14);color:#48ba79;font-size:12px;font-weight:600;line-height:1;letter-spacing:.01em">Live</span>`,
  },
  C_pill_neutral: {
    title: 'C · нейтральная плашка (как «Recommended»), цвет — только тревоге',
    html: `<span class="liquid-glass liquid-glass--chip" style="display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:999px;font-size:13px;font-weight:500;line-height:1;color:var(--white-720)">Live</span>`,
  },
  D_icon: {
    title: 'D · иконка-галочка + слово (язык карточек)',
    html: `<span style="display:flex;align-items:center;gap:10px">${CHECK('#48ba79')}<span style="font-size:14px;line-height:1.2;color:#fff">Live</span></span>`,
  },
  E_quiet: {
    title: 'E · тихий текст без глифа (так борд рисовал padlock)',
    html: `<span style="font-size:13px;line-height:1.4;color:var(--white-480)">Live</span>`,
  },
  F_pill_amber: {
    title: 'B в тревоге · плашка: Setting up',
    html: `<span style="display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:999px;background:rgba(229,195,89,.14);color:#e5c359;font-size:12px;font-weight:600;line-height:1;letter-spacing:.01em">Setting up</span>`,
  },
}

async function setSlot(html) {
  await p.evaluate(({ html, PANEL }) => {
    const btn = [...document.querySelectorAll(`${PANEL} button`)].find((b) => b.textContent.trim().startsWith('Unlink'))
    const row = btn.parentElement
    row.style.justifyContent = 'space-between'
    let slot = row.querySelector('[data-stand-slot]')
    if (!slot) {
      slot = document.createElement('div')
      slot.setAttribute('data-stand-slot', '')
      slot.style.display = 'flex'
      slot.style.alignItems = 'center'
      row.insertBefore(slot, btn)
    }
    slot.innerHTML = html
  }, { html, PANEL })
  await p.waitForTimeout(120)
}

const shots = []
await openPublish('p=built&u=0&v=true&d=live&i=dh-free&a=paid&c=900&n=adovasio.com')
for (const [key, v] of Object.entries(V)) {
  await setSlot(v.html)
  const el = await p.$(PANEL)
  const file = `${OUT}${key}.png`
  await el.screenshot({ path: file })
  shots.push({ key, title: v.title, file })
}

// Contact sheet: an HTML page embedding the panels, screenshotted at 1x.
const sheet = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#0b0b0d;font:13px/1.35 -apple-system,Segoe UI,sans-serif;color:#ddd;padding:20px">
<h1 style="font-size:16px;font-weight:600;margin:0 0 14px;color:#fff">Слот статуса рядом с Unlink — шесть форм в живой панели (live, всё опубликовано)</h1>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
${shots.map((s) => `<figure style="margin:0"><figcaption style="margin:0 0 6px;color:#bbb">${s.title}</figcaption><img src="file://${s.file}" style="width:100%;display:block;border-radius:8px;outline:1px solid #222"></figure>`).join('')}
</div></body>`
const sheetPath = `${OUT}sheet.html`
writeFileSync(sheetPath, sheet)
const sp = await ctx.newPage()
await sp.setViewportSize({ width: 1500, height: 900 })
await sp.goto(`file://${sheetPath}`, { waitUntil: 'load' })
await sp.waitForTimeout(500)
await sp.screenshot({ path: `${OUT}sheet.png`, fullPage: true })
console.log('sheet:', `${OUT}sheet.png`)
await b.close()
