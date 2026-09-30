/**
 * THE CRASH GUARD — what the page shows when the app cannot mount.
 *
 * Added 30.09.2026 after the designer opened the published prototype (v121) and saw a black
 * screen: `body` is `--gray-950`, `#root` was empty, and nothing on the page said why. The same
 * file loaded clean here with a fresh store, a stale v120 store and his `?sk=` query — so the
 * cause lives in HIS browser (a snapshot the harness cannot reproduce), and the only way to learn
 * it is for the page itself to say what broke.
 *
 * This module is imported FIRST in main.tsx, so it is evaluated before the app's modules: a
 * throw during module evaluation (a TDZ, a bad import) still reaches the `error` listener below.
 * A throw during render reaches it through the ErrorBoundary in main.tsx (`reportCrash`). Either
 * way, if `#root` has nothing in it, the guard draws a plain panel — no React, no Tailwind, no
 * fonts — with the error, and two buttons: copy the details, and RESET (clear every
 * `remixer-prototype/*` key and reload). The reset is what a non-programmer needs; the details are
 * what the next session needs.
 *
 * A watchdog covers the third case — nothing threw, nothing rendered: after 6 s of an empty root
 * the panel comes up saying so.
 */
const PREFIX = 'remixer-prototype/'
const ROOT_WAIT_MS = 6000

let shown = false

function detail(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}\n${err.stack ?? ''}`
  return typeof err === 'string' ? err : JSON.stringify(err)
}

function storageSummary(): string {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .map((k) => `${k} — ${(localStorage.getItem(k) ?? '').length} chars`)
      .join('\n') || '(no prototype keys)'
  } catch {
    return '(storage unreadable)'
  }
}

function reset() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) localStorage.removeItem(k)
  } catch { /* nothing to clear */ }
  const url = new URL(window.location.href)
  url.search = ''
  window.location.replace(url.toString())
}

export function reportCrash(err: unknown, where: string) {
  const root = document.getElementById('root')
  if (shown || (root && root.childElementCount > 0 && where !== 'render')) return
  shown = true
  const text = `${where}\n${detail(err)}\n\nURL: ${location.href}\nUA: ${navigator.userAgent}\nStorage:\n${storageSummary()}`
  const el = document.createElement('div')
  el.setAttribute('data-crash-guard', where)
  el.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#09090b;color:#e4e4e7;font:14px/1.5 system-ui,sans-serif;padding:24px'
  const box = document.createElement('div')
  box.style.cssText = 'width:min(640px,100%);background:#1f1f22;border:1px solid #27272a;border-radius:16px;padding:24px;display:grid;gap:16px'
  const h = document.createElement('div')
  h.textContent = 'The prototype could not start'
  h.style.cssText = 'font-size:20px;font-weight:600;color:#fff'
  const p = document.createElement('div')
  p.textContent = 'Something in this browser’s saved state stopped the page from drawing. Reset clears the prototype’s saved state and reloads — nothing outside the prototype is touched. Copy the details first if you can, so the cause can be fixed.'
  p.style.cssText = 'color:#a1a1aa'
  const pre = document.createElement('pre')
  pre.textContent = text
  pre.style.cssText = 'margin:0;max-height:220px;overflow:auto;white-space:pre-wrap;word-break:break-word;background:#09090b;border-radius:10px;padding:12px;font:12px/1.45 ui-monospace,Menlo,monospace;color:#c7c7cd'
  const row = document.createElement('div')
  row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end'
  const copy = document.createElement('button')
  copy.textContent = 'Copy details'
  copy.style.cssText = 'height:40px;padding:0 16px;border-radius:10px;border:1px solid #3f3f46;background:transparent;color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer'
  copy.onclick = () => { navigator.clipboard?.writeText(text).then(() => { copy.textContent = 'Copied' }, () => { copy.textContent = 'Select and copy above' }) }
  const rst = document.createElement('button')
  rst.textContent = 'Reset and reload'
  rst.setAttribute('data-crash-reset', '')
  rst.style.cssText = 'height:40px;padding:0 16px;border-radius:10px;border:0;background:#1587ff;color:#fff;font:600 14px system-ui,sans-serif;cursor:pointer'
  rst.onclick = reset
  row.append(copy, rst)
  box.append(h, p, pre, row)
  el.append(box)
  document.body.append(el)
  console.error('[remixer crash guard]', where, err)
}

window.addEventListener('error', (e) => reportCrash(e.error ?? e.message, 'error'))
window.addEventListener('unhandledrejection', (e) => reportCrash(e.reason, 'unhandledrejection'))
window.setTimeout(() => {
  const root = document.getElementById('root')
  if (root && root.childElementCount === 0) reportCrash('Nothing rendered within 6 s and nothing threw.', 'watchdog')
}, ROOT_WAIT_MS)

/* for the harness: `window.__remixerCrash('x')` draws the panel on demand */
;(window as unknown as { __remixerCrash: (m: string) => void }).__remixerCrash = (m) => { shown = false; reportCrash(new Error(m), 'render') }
