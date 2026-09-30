/**
 * Which page is on screen.
 *
 * The Home page is not a surface inside the builder — it has its own chrome (a
 * transparent topbar over the hero, no chat column, no right rail), so it cannot
 * render inside the shell. It gets picked here instead, off `ui.page`.
 *
 * Deliberately the thinnest possible switch. `App.tsx` is the builder shell and its
 * send choreography, glow timing and scroll parking are tuned to the millisecond;
 * wrapping it, re-parenting it or hoisting anything out of it would put every one of
 * those measurements back in play. Both pages mount the prototype console themselves,
 * so only one copy is ever alive.
 *
 * Every future top-level page (account, billing, the hosting panel) is one more branch
 * here, not another special case inside the shell.
 *
 * ONE branch is not a page of the product at all: `?view=site` — STAGING, the bare generated
 * site filling a tab of its own, opened by the page pill's «open in new tab» button (board
 * 31379:2968; designer, 30.09.2026: «открывает превью сайта на новой вкладке на весь экран, по
 * сути стейджинг»). It is decided BEFORE `ui.page`, because a staging tab has no Home and no
 * shell — only the site, as a visitor would see it.
 */
import { useState } from 'react'
import { useUI } from '@/state/ui'
import App from './App'
import { HomePage } from '@/modules/home/HomePage'
import { BootCover } from '@/ui/BootCover'
import { SitePreview } from '@/modules/preview/SitePreview'

/*
 * Read once, at module load: the address bar is the builder's to rewrite (world.ts `syncUrl` puts
 * the world's short keys there on every world write), but a staging tab never writes the world —
 * the site only reads the plan — so its `view` and `path` stay in the bar and a reload lands on
 * the same page. `paramsToWorld` knows only its own short keys (`p`, `c`, `d`…), so these two are
 * ignored by the world and the stored snapshot loads whole: the staging tab shows the same site,
 * with the same pages, the builder tab is standing in. They are deliberately NOT in the world's
 * KEYS — which tab you are looking at is not a fact about the customer.
 */
const params = new URLSearchParams(location.search)
const STAGING = params.get('view') === 'site'

/**
 * The bare site, filling the window. `.site-stage` is what makes the site's container queries
 * answer to THIS box (index.css) — a full-width window renders the desktop layout, a narrowed one
 * the phone's, exactly as the canvas's frames do; no toolbar, no chrome, no console.
 */
function SiteView() {
  /* the page from the link, written to the store BEFORE the site's first render (a lazy initializer
     runs once, at mount) — an effect would show the home page for a frame and then play the page
     hand-over toward the linked page */
  useState(() => { useUI.getState().setPreviewPath(params.get('path') || '/'); return null })
  return (
    <div className="site-stage fixed inset-0 bg-[#fbfaf7]" data-site-view>
      <SitePreview />
    </div>
  )
}

export default function Root() {
  const page = useUI((s) => s.page)
  if (STAGING) return <SiteView />
  return (
    <>
      {page === 'home' ? <HomePage /> : <App />}
      {/* the Home → builder corridor. Above the switch, because it has to cover the
          page that is leaving and the one that is arriving — see BootCover. */}
      <BootCover />
    </>
  )
}
