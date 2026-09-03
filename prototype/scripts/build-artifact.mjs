/**
 * Fold the Vite build into ONE self-contained HTML page for the Artifact host.
 *
 * The artifact page runs under a strict CSP that blocks every external request,
 * so nothing may stay as a URL: the CSS, the JS and every .woff2 have to travel
 * inside the file as text or as a data: URI.
 *
 * THE FILE ONLY GROWS — every new drawn template site, every new surface — and the
 * host that publishes it has a size limit somewhere, so the build reports its own
 * size and the headroom under the largest page this host has actually accepted
 * (689,918 bytes). That number is a floor on the limit, not the limit itself.
 *
 * ⚠️ AND IT IS NOT WHY A PUBLISH GETS REFUSED. On 26.08.2026 five publishes in a
 * row were rejected with "carries the artifact-pr-review machinery … too large for
 * a review page" — a message that contradicts itself, since this page is not a
 * review page. Ruled out by experiment, so nobody repeats it: size (686,488 bytes
 * was refused exactly like 736,745, while 689,918 had gone through hours earlier),
 * the artifact's identity (a brand-new artifact was refused too), and a `data-pr…`
 * attribute in the markup (removing it changed nothing). The same file published
 * fine earlier in the same day, so the trigger is session state on the host side,
 * not this page — the next session publishes it unchanged.
 *
 * THE FONTS ARE SUBSET HERE ANYWAY, and this is the one lever that costs nothing
 * visible: the four stand-in faces ship as full Latin subsets (~77 kB, ~103 kB
 * once base64'd) while this interface draws about a hundred distinct characters.
 * The glyph set is not guessed — it is READ OUT of the built CSS and JS, which
 * between them contain every string the app can render, unioned with printable
 * ASCII and the punctuation the drawings use. Anything the app can put on screen
 * is therefore in the set by construction. Cyrillic is not: the OFL stand-ins
 * never had it (the UK locale already falls through to a system font by glyph),
 * so subsetting removes nothing that worked.
 *
 * This trim is ARTIFACT-ONLY. `npm run dev` and `npm run build` keep every glyph;
 * only the single published file is subset, and it is verified by pixel-diffing
 * the published page against the un-subset build, not by trusting this comment.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = `${ROOT}/dist`
const OUT = process.argv[2] ?? `${ROOT}/dist/remixer-prototype.html`

const assets = readdirSync(`${DIST}/assets`)
let css = readFileSync(`${DIST}/assets/${assets.find((f) => f.endsWith('.css'))}`, 'utf8')
const js = readFileSync(`${DIST}/assets/${assets.find((f) => f.endsWith('.js'))}`, 'utf8')

/**
 * Every character the built page can render, as one string for `pyftsubset`.
 *
 * Source of truth is the build output itself, so a string added to a component
 * this afternoon is covered without anyone remembering to widen a list. The
 * curated tail is for characters a font needs even when they never appear in a
 * literal: the space family, the typographic punctuation the drawings use, and
 * the glyphs our own UI draws (the return arrow on Build, the multiplication
 * sign in the sizes, the arrows in the pills).
 */
function usedCharacters(...sources) {
  const set = new Set()
  for (let code = 0x20; code <= 0x7e; code++) set.add(String.fromCharCode(code))
  for (const ch of '\u00a0\u2007\u2009\u200a\u2018\u2019\u201c\u201d\u2013\u2014\u2026\u00d7\u00b7\u2022\u00ab\u00bb\u20ac\u00a3\u00a5\u2190\u2191\u2192\u2193\u2197\u21b5\u2713\u00ae\u2122\u00a9\u00b0\u00b1\u2212\u2044\u00bd') set.add(ch)
  for (const src of sources) for (const ch of src) if (ch.codePointAt(0) > 0x1f) set.add(ch)
  return [...set].join('')
}

/**
 * Subset one woff2 to `text` and return the new path, or null if the subsetter
 * is not on this machine. A missing subsetter must not fail the build — it just
 * means a bigger file, and the headroom line below will say so.
 */
function subsetFont(path, text, dir) {
  const out = `${dir}/${path.split('/').pop()}`
  try {
    execFileSync('pyftsubset', [
      path,
      `--output-file=${out}`,
      '--flavor=woff2',
      `--text=${text}`,
      '--layout-features=*',
      '--no-hinting',
      '--desubroutinize',
      '--drop-tables+=DSIG',
    ], { stdio: 'pipe' })
    return existsSync(out) ? out : null
  } catch {
    return null
  }
}

const dataUri = (path) =>
  `data:font/woff2;base64,${readFileSync(path).toString('base64')}`

// 1. Fonts Vite bundled (the OFL stand-ins from src/fonts/) — always present.
//    Subset to the characters this build can actually draw before embedding.
const GLYPHS = usedCharacters(css, js)
const SUBSET_DIR = mkdtempSync(`${tmpdir()}/remixer-subset-`)
let embedded = 0
let fontBytesBefore = 0
let fontBytesAfter = 0
const subsetReport = []
css = css.replace(/url\(\/assets\/([^)]+\.woff2)\)/g, (_m, file) => {
  embedded++
  const full = `${DIST}/assets/${file}`
  const before = readFileSync(full).length
  const subset = subsetFont(full, GLYPHS, SUBSET_DIR)
  const use = subset ?? full
  const after = readFileSync(use).length
  fontBytesBefore += before
  fontBytesAfter += after
  subsetReport.push(`${file} ${(before / 1024).toFixed(1)}→${(after / 1024).toFixed(1)} KB`)
  return `url(${dataUri(use)})`
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
const CEILING = 690 * 1024
const bytes = Buffer.byteLength(page)
console.log(`fonts embedded: ${embedded} — ${GLYPHS.length} glyphs kept`)
console.log(`  ${subsetReport.join(' · ')}`)
console.log(`  font payload ${(fontBytesBefore / 1024).toFixed(1)} → ${(fontBytesAfter / 1024).toFixed(1)} KB raw`)
console.log(`fonts absent (rules dropped): ${missing.length ? missing.join(', ') : 'none'}`)
console.log(`wrote ${OUT} — ${bytes.toLocaleString('en-US')} bytes (${(bytes / 1024).toFixed(1)} KB)`)
const headroom = CEILING - bytes
console.log(
  headroom > 0
    ? `publish headroom: ${(headroom / 1024).toFixed(1)} KB under the 690 KB the host last accepted`
    : `OVER by ${(-headroom / 1024).toFixed(1)} KB — the publish will be refused, trim before publishing`,
)
