import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
const OUT = new URL('./cells/', import.meta.url).pathname
import { mkdirSync } from 'node:fs'; mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] })
const p = await b.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 2 })
await p.goto('file://' + new URL('./stand.html', import.meta.url).pathname)
await p.waitForTimeout(300)
const cells = await p.$$('.ground.zoom')
// cells are laid out row-major: 3 rows × 6 recipes
for (let i = 0; i < cells.length; i++) {
  const row = Math.floor(i / 6), col = i % 6
  await cells[i].screenshot({ path: `${OUT}z-r${col}-row${row}.png` })
}
await b.close()
// per recipe: stack its three rows, padded to a common canvas
for (let col = 0; col < 6; col++) {
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y',
    '-i', `${OUT}z-r${col}-row0.png`, '-i', `${OUT}z-r${col}-row1.png`, '-i', `${OUT}z-r${col}-row2.png`,
    '-filter_complex', '[0]pad=1300:ih:0:0:0x09090b[a];[1]pad=1300:ih:0:0:0x09090b[b];[2]pad=1300:ih:0:0:0x09090b[c];[a][b][c]vstack=3',
    `${OUT}recipe-${col}.png`])
}
// pairs side by side for viewing: (0,1) (2,3) (4,5)
for (const [a, c] of [[0, 1], [2, 3], [4, 5]]) {
  execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', `${OUT}recipe-${a}.png`, '-i', `${OUT}recipe-${c}.png`, '-filter_complex', '[0][1]hstack=2', `${OUT}pair-${a}${c}.png`])
}
console.log('ok')
