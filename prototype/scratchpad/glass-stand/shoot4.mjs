import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const p = await b.newPage({ viewport: { width: 2000, height: 800 }, deviceScaleFactor: 1.5 })
await p.goto('file://' + new URL('./stand4.html', import.meta.url).pathname); await p.waitForTimeout(300)
await p.screenshot({ path: new URL('./ink-variants.png', import.meta.url).pathname, fullPage: true })
await b.close(); console.log('ok')
