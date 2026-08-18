/**
 * Fold the Vite build into ONE self-contained HTML page for the Artifact host.
 *
 * The artifact page runs under a strict CSP that blocks every external request,
 * so nothing may stay as a URL: the CSS, the JS and every .woff2 have to travel
 * inside the file as text or as a data: URI.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = `${ROOT}/dist`
const OUT = process.argv[2] ?? `${ROOT}/dist/remixer-prototype.html`

const assets = readdirSync(`${DIST}/assets`)
// EVERY stylesheet, not just the first one Vite happened to emit: the panel cart
// ships its own file, and a silently dropped chunk would be a page with no styles.
let css = assets
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(`${DIST}/assets/${f}`, 'utf8'))
  .join('\n')
const js = readFileSync(`${DIST}/assets/${assets.find((f) => f.endsWith('.js'))}`, 'utf8')

const dataUri = (path) =>
  `data:font/woff2;base64,${readFileSync(path).toString('base64')}`

// 1. Fonts Vite bundled (the OFL stand-ins from src/fonts/) — always present.
let embedded = 0
css = css.replace(/url\(\/assets\/([^)]+\.woff2)\)/g, (_m, file) => {
  embedded++
  return `url(${dataUri(`${DIST}/assets/${file}`)})`
})

// 2. Fonts served from public/ (the licensed Gilroy / Proxima Nova, if someone
//    has dropped them in). Absolute URLs Vite deliberately left alone.
css = css.replace(/url\(\/fonts\/([^)]+\.woff2)\)/g, (m, file) => {
  const path = `${DIST}/fonts/${file}`
  if (!existsSync(path)) return m
  embedded++
  return `url(${dataUri(path)})`
})

// 3. Any @font-face still pointing at a file that is not here would fire a
//    request the CSP kills and log an error on a page nobody can debug. Drop
//    those rules: the family simply falls through to the next in the stack.
const missing = []
css = css.replace(/@font-face\{[^}]*\}/g, (block) => {
  const url = block.match(/url\(\/fonts\/([^)]+)\)/)
  if (!url) return block
  missing.push(url[1])
  return ''
})

// The artifact host supplies <!doctype>/<html>/<head>/<body>, so emit page
// content only. index.html carries class="dark" on <html>; re-apply it here.
const page = `<title>Remixer — prototype</title>
<style>
${css}
</style>
<div id="root"></div>
<script>document.documentElement.classList.add('dark')</script>
<script type="module">
${js}
</script>
`

writeFileSync(OUT, page)
console.log(`fonts embedded: ${embedded}`)
console.log(`fonts absent (rules dropped): ${missing.length ? missing.join(', ') : 'none'}`)
console.log(`wrote ${OUT} — ${(page.length / 1024 / 1024).toFixed(2)} MB`)
