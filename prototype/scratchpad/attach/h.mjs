import { chromium } from 'playwright'
import fs from 'node:fs'
const BASE = process.env.BASE || 'http://localhost:4173/'
const OUT = '/tmp/check-h'; fs.mkdirSync(OUT, { recursive: true })
const at = (q) => `${BASE}${BASE.includes('?') ? '&' : '?'}${q}`
const results = []
const check = (name, ok, extra = '') => { results.push([name, ok]); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' - ' + extra : ''}`) }
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` })
/* ============================ H. a DOMAIN attached to the prompt on the Home page
 *  Figma 28726:64760 «Domain-Only Customer» + the menu instance 30771:31103 (designer,
 *  21.09.2026). A DreamHost panel customer arrives with a name already chosen, so the
 *  intake has to be able to say which domain this build is for.
 *
 *  ⚠️ `i=dh-free` and NOT the suite's usual NEW_PROJECT: that query carries `i=none`, an
 *  account with no domains, where the menu is correctly empty and there is nothing to pick.
 */
{
  const HOME_WITH_DOMAINS = 'p=empty&h=empty&a=trial&t=1&c=2000&i=dh-free'
  const box = (sel) => p.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => +n.toFixed(2)) })
  const gone = (sel) => p.$(sel).then((n) => !n)

  await p.goto(at(HOME_WITH_DOMAINS), { waitUntil: 'networkidle' })
  /* ⚠️ 2.6s, not the usual 700ms: the hero's entrance (`home-rise-in`, 0.8s at 1.25s)
     is still lifting the composer at 900ms, and every travel here is measured against
     where the field sits. Measured mid-flight: the field reads 445.25 at 900ms and
     442.83 once it has landed — a 2.4px error that looks exactly like a layout bug. */
  await p.waitForTimeout(2600)
  const bare = await box('.he-composer')
  const bareInput = await box('.he-composer input')
  const bareChips = await box('.he-chips')
  check('the bare field is the drawn 138', bare[3] === 138, String(bare[3]))
  check('nothing is attached to a fresh intake', await gone('[data-attach-domain]'))

  await p.click('[data-attach-open]')
  await p.waitForTimeout(450)
  await shot('33-attach-menu')
  const plus = await box('[data-attach-open]')
  const menu = await box('[role="menu"]')
  /* The board's own box: 208 × 89 = 4 + 40 + 1 + 40 + 4. It is what forbids the dimmed
     row a subtitle (AttachMenu.tsx). */
  check('the attach menu is the board’s 208 × 89', menu[2] === 208 && menu[3] === 89, menu.join(','))
  /*
   * AND IT OPENS DOWNWARD OUT OF THE "+", at the board's own offset: the `Menu` instance
   * sits at (364, 610) where the button's box is (340, 602, 36, 36) — 24 right, 8 down,
   * covering the button row it grew from. The designer had to say this twice: the first
   * build read that overlap as a loose placement and hung the menu above the field.
   */
  check('…opening downward out of the "+", 24 right and 8 down, where the board puts it',
    Math.abs(menu[0] - (plus[0] + 24)) < 0.6 && Math.abs(menu[1] - (plus[1] + 8)) < 0.6,
    `menu ${menu.join(',')} | + ${plus.join(',')}`)
  /*
   * ⚠️ WHICH ONLY WORKS BECAUSE THE MENU IS OUT OF THE HERO. The hero is a clipped panel,
   * and a menu opening down from a "+" that sits 52px above the field's bottom edge runs
   * out of panel before the domain list ends — filmed: the third name sliced in half.
   */
  const escaped = await p.$eval('[role="menu"]', (el) => {
    for (let n = el.parentElement; n; n = n.parentElement) if (n.classList?.contains('home-hero')) return false
    return true
  })
  check('…from outside the hero’s clip, so nothing can cut it', escaped)
  /* The field's own backdrop-blur is a stacking context, so this is the check that the
     prompt chips are not painted across the menu (they were, measured 21.09.2026). */
  const onTop = await p.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x, y)
    return !!el?.closest('[role="menu"]')
  }, [menu[0] + menu[2] / 2, menu[1] + menu[3] - 20])
  check('…and it paints above the prompt-chip row', onTop)

  const rows = await p.$$eval('[role="menu"] [role="menuitem"]', (els) => els.map((e) => ({ label: e.innerText.trim(), off: e.disabled })))
  check('the menu draws the board’s two rows', rows.length === 2 && /Attach File/.test(rows[0].label) && /Attach Domain/.test(rows[1].label),
    rows.map((r) => r.label).join(' | '))
  check('Attach File is dimmed, because this prototype has no files', rows[0].off === true)

  await p.click('[role="menu"] [role="menuitem"]:last-child')
  await p.waitForTimeout(350)
  await shot('34-attach-domain-list')
  const names = await p.$$eval('[role="menu"] [role="menuitem"]', (els) => els.map((e) => e.innerText.trim()))
  check('…and Attach Domain lists the names this account actually owns',
    names.join(' · ') === 'fit-ration.com · odesa-coffee-roasters.com · design-portfolio.net · vegan-burger-delivery.co',
    names.join(' · '))
  /* A real name does not fit the drawn 208; that level is ours and undrawn. */
  const list = await box('[role="menu"]')
  check('…in a box wide enough for a real domain name', list[2] === 280, String(list[2]))
  check('…whose corner by the "+" has not moved, and which the window still holds',
    Math.abs(list[0] - menu[0]) < 0.6 && Math.abs(list[1] - menu[1]) < 0.6
      && list[1] + list[3] < 900 - 8,
    `${list.join(',')} vs ${menu.join(',')}`)

  await p.keyboard.press('Escape')
  await p.waitForTimeout(300)
  check('Escape closes it, like every menu in this shell', await gone('[role="menu"]'))

  await p.click('[data-attach-open]')
  await p.waitForTimeout(400)
  await p.click('[role="menu"] [role="menuitem"]:last-child')
  await p.waitForTimeout(350)
  await p.click('[role="menu"] [role="menuitem"]:nth-child(2)')
  await p.waitForTimeout(900)
  await shot('35-domain-attached')
  const withChip = await box('.he-composer')
  const chip = await box('[data-attach-domain]')
  const chipInput = await box('.he-composer input')
  const chipChips = await box('.he-chips')
  const chipName = await p.$eval('[data-attach-domain]', (el) => el.innerText.trim())
  check('the picked name sits in the composer', chipName === 'odesa-coffee-roasters.com', chipName)
  /* 28726:64923 on this board: the field is 164 with a domain chip, and 138 without. */
  check('the field grows to the drawn 164', withChip[3] === 164, String(withChip[3]))
  check('…the chip is the drawn 36, 16 in from the field’s corner',
    chip[3] === 36 && Math.abs(chip[0] - (withChip[0] + 16)) < 0.6 && Math.abs(chip[1] - (withChip[1] + 16)) < 0.6,
    chip.join(','))
  /*
   * ⚠️ AND IT IS GLASS ON THE HOUSE CANON, not a hand-rolled hairline (designer 21.09.2026:
   * «домен находится внутри стеклянной кнопки-пилюли, ты стекло не добавил»). The board's
   * flat rgba(255,255,255,.2) is the pill gradient's bright end; drawn flat it reads dead.
   * The ✕ inside wears the same material — the board gives it its own fill and stroke.
   */
  const glass = await p.evaluate(() => {
    const el = document.querySelector('[data-attach-domain]')
    const x = el?.querySelector('button')
    const rim = (n) => getComputedStyle(n, '::before').backgroundImage
    return {
      canon: !!el?.classList.contains('liquid-glass') && !!el?.classList.contains('liquid-glass--attach'),
      fill: getComputedStyle(el).backgroundColor,
      blur: getComputedStyle(el).backdropFilter,
      rim: rim(el),
      border: getComputedStyle(el).borderTopWidth,
      xCanon: !!x?.classList.contains('liquid-glass--attach'),
      xRim: rim(x),
      xBox: [x?.offsetWidth, x?.offsetHeight],
    }
  })
  check('…wearing the canon’s glass: a gradient rim over the board’s 4% fill, blur 16',
    glass.canon && /gradient/.test(glass.rim) && glass.fill === 'rgba(255, 255, 255, 0.04)'
      && glass.blur.includes('blur(16px)') && glass.border === '0px',
    JSON.stringify(glass).slice(0, 200))
  check('…and its ✕ is the same glass at 18',
    glass.xCanon && /gradient/.test(glass.xRim) && glass.xBox[0] === 18 && glass.xBox[1] === 18,
    JSON.stringify(glass.xBox))
  /*
   * THE DERIVED TRAVELS (attachment.ts § barTextShift/barRowShift): h + 16 for the
   * placeholder line, h − 10 for everything under it — 52 and 26 for a 36-tall chip,
   * and the board closes on both (Text at y=52 with its caret at 17; Buttons at 112).
   */
  check('…the placeholder line travels the derived 52', Math.abs(chipInput[1] - bareInput[1] - 52) < 0.6, String(chipInput[1] - bareInput[1]))
  check('…and the chip row under the field the derived 26', Math.abs(chipChips[1] - bareChips[1] - 26) < 0.6, String(chipChips[1] - bareChips[1]))
  /* The box grows DOWNWARD: the hero above it must not move a pixel. */
  check('…while nothing above the field moves', Math.abs(withChip[1] - bare[1]) < 0.6, `${bare[1]} → ${withChip[1]}`)

  /* A name is not a description of a site — the designer's own sentence about this
     customer. A template arms Build; a domain does not. */
  const armed = await p.$eval('button:has-text("Build")', (el) => !el.disabled)
  check('a domain alone does not arm Build', armed === false)

  /* The one axis a new project KEEPS (send.ts § startBuild). */
  await p.fill('input[aria-label="Describe the site you want"]', 'Bella’s Bakery')
  await p.click('button:has-text("Build")')
  await p.waitForSelector('.boot-cover', { state: 'detached', timeout: 10000 })
  await p.waitForTimeout(600)
  const kept = await p.evaluate(() => JSON.parse(localStorage.getItem('remixer-prototype/world/v4') || '{}').intakeDomain)
  check('the attached domain survives into the build', kept === 'odesa-coffee-roasters.com', String(kept))
  /* …and it is NOT smuggled into the prompt: the transcript is what the customer typed. */
  const firstSaid = await p.evaluate(() => (JSON.parse(localStorage.getItem('remixer-prototype/world/v4') || '{}').sent || [])[0]?.text ?? '')
  check('…without the name being typed into the prompt for them',
    firstSaid === 'Bella’s Bakery', firstSaid)

  /* And the ✕ takes it off again, all the way back to the bare 138. */
  await p.goto(at(HOME_WITH_DOMAINS + '&g=fit-ration.com'), { waitUntil: 'networkidle' })
  await p.waitForTimeout(2600)
  check('a link can carry the domain a panel customer arrived with',
    (await p.$eval('[data-attach-domain]', (el) => el.innerText.trim())) === 'fit-ration.com')
  await p.click('[data-attach-domain] button')
  await p.waitForTimeout(900)
  await shot('36-domain-detached')
  const off = await box('.he-composer')
  check('…and its ✕ puts the field back on the bare 138', off[3] === 138 && await gone('[data-attach-domain]'), String(off[3]))
}

check('no page errors', errors.length === 0, errors.join(' | ').slice(0,300))
await b.close()
const failed = results.filter(([, ok]) => !ok).length
console.log(`\n${results.length - failed}/${results.length}`)
process.exit(failed ? 1 : 0)
