import { chromium } from 'playwright'

const OUT = '/tmp/claude-0/-home-user-Remixer/2fa5039f-9836-5c55-8934-bfdb57f0ca65/scratchpad/shots'
const url = process.argv[2]
const query = process.argv[3]
const tag = process.argv[4]

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await b.newPage({ viewport: { width: 1600, height: 1000 } })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
// Home → builder: click the first project card's thumbnail
const card = page.locator('.home-card').first()
await card.click({ position: { x: 100, y: 80 } })
await page.waitForTimeout(4200)
// topbar centre button opens the domains window
await page.locator('button:has(span.truncate)').first().click().catch(() => {})
await page.waitForTimeout(900)
const input = page.locator('input[placeholder]').first()
await input.click()
await input.fill(query)
await page.keyboard.press('Enter')
await page.waitForTimeout(1400)
await page.screenshot({ path: `${OUT}/${tag}.png` })
await b.close()
console.log('done', tag)
