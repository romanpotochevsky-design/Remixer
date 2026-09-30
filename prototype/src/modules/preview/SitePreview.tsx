/**
 * The generated site inside the preview canvas — hardcoded, like all prototype data.
 *
 * In the Figma frame the canvas shows a real generated website; an empty dark panel
 * reads as a broken build in any demo. This is the fit-ration demo project rendered
 * as a light one-page site. It is deliberately NOT in the builder's design language:
 * a generated site must look like a customer's site, not like Remixer chrome.
 *
 * MORE THAN ONE PAGE (25.09.2026, with the page switcher — PageSwitcher.tsx): the site now stands on
 * whatever route `ui.previewPath` names. Its pages are the Build Plan's outline (pages.ts): the first
 * is this home page, the rest render as inner pages in the same voice, keyed by the NAME the plan
 * gave them (About, Services, Contact, Catalogue…), with a generic inner page for a name the site
 * has no template for. A route the outline does not know gets the site's own not-found page — the
 * way Lovable's app answers an unknown path with its 404 route. The site's logo and its footer's
 * page links navigate too, and the toolbar's pill follows: that is Lovable's pill reading the
 * iframe's route, without an iframe.
 *
 * The handover between pages is the dock's sequential rule (motion.ts `pageSwap`): the leaving page
 * is gone in 120 ms, the arriving one rises into place a beat later — never two pages at half alpha.
 *
 * EDITABLE SINCE 30.09.2026 (the Visual Editor, modules/editor). Every text run is a `T` and every
 * picture a `Photo` (site-parts.tsx), addressed by the keys in content.ts; the customer's own words
 * and pictures (`World.siteEdits`, plus the editor's staged draft on the canvas) lay over the
 * compiled copy through `SiteContext`. With no tool on, `T` and `Photo` render exactly the plain
 * elements this file rendered before — no wrappers, no refs — so the page's geometry, the minis on
 * the shelf and the glow's two-tone test stand are untouched.
 *
 * WHOSE SITE. The canvas instance renders the site the builder stands in and wears the editor;
 * a picture of another site (`site` prop — a shelf card, a dock card, the pick flight's clone)
 * renders THAT site's saved layer from the stash (world.ts `siteSliceOf`) and never edits. Before
 * this every picture read the current world, which nobody could see while all sites shared one
 * compiled copy.
 */
const keepOnMainThread = () => {}

/** The nav: the logo is the way home, the anchors are the one-pager's sections, not pages. */
function SiteNav({ go }: { go: (path: string) => void }) {
  /* «update the navigation» swaps the one-pager's anchors (modules/versions/changes.ts) */
  const { ai } = useContext(SiteContext)
  const links = ai.mods.includes('nav') ? NAV_AFTER : NAV_BEFORE
  return (
      <div className="site-pad sticky top-0 z-10 flex items-center justify-between border-b border-[#1d1f1a14] bg-[color-mix(in_srgb,var(--sp)_95%,transparent)] py-4 backdrop-blur-sm">
        <button type="button" data-site-link="/" onClick={() => go('/')} className="text-[20px] font-bold tracking-[-0.02em]">fit<span className="text-[var(--sa)]">.</span></button>
        <nav className="site-nav-links gap-7 text-[13.5px] text-[#1d1f1aa6]" aria-hidden>
          {links.map((l) => <span key={l}>{l}</span>)}
        </nav>
        <T as="span" k="nav.cta" className="rounded-full bg-[var(--sa)] px-4 py-2 text-[13px] font-semibold text-white" />
      </div>

  )
}

/** A number with its caption — two text runs, so a `<b>` and a `<br/>` cannot be typed away. */
function Stat({ k, big = 16, block = false }: { k: string; big?: number; block?: boolean }) {
  return (
    <span>
      <T as="b" k={`${k}.value`} className={`${block ? 'block' : ''} font-bold text-[#1d1f1a]`} style={{ fontSize: big }} />
      {!block && <br />}
      <T as="span" k={`${k}.label`} />
    </span>
  )
}

function HomeBody() {
  const { ai } = useContext(SiteContext)
  const has = (m: string) => ai.mods.includes(m)
  const big = has('menuBig')
  return (
    <>
      <div className="site-pad site-hero mx-auto max-w-[880px] text-center">
        <T k="home.eyebrow" className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--sa)]" />
        <T as="h1" k="home.hero.title" className="site-hero-title mx-auto max-w-[16ch] font-bold leading-[1.08] tracking-[-0.03em]" style={{ textWrap: 'balance' }} />
        <T k="home.hero.lead" className="mx-auto mt-4 max-w-[46ch] text-[16px] leading-[1.6] text-[#1d1f1a99]" />
        <div className="site-cta mt-7 justify-center gap-3">
          <T as="span" k="home.cta.primary" className="rounded-full bg-[var(--sa)] px-6 py-3 text-[14.5px] font-semibold text-white" />
          <T as="span" k="home.cta.secondary" className="rounded-full border border-[#1d1f1a26] px-6 py-3 text-[14.5px] font-medium text-[#1d1f1a]" />
        </div>
        <div className="site-stats mt-10 justify-center text-[13px] text-[#1d1f1a80]">
          <Stat k="home.stat.0" />
          <Stat k="home.stat.1" />
          <Stat k="home.stat.2" />
        </div>
      </div>

      {has('photos') && <PhotoStrip />}

      {/* menu grid — the DARK half of the page, so the glow can be judged on both
          grounds at once (narrow rim over the white hero, full bloom over this) */}
      <div className="bg-[var(--sd)] pb-16 pt-12 text-[#f4f4f0]">
        <div className="site-pad mx-auto max-w-[980px]">
          <div className="mb-5 flex items-end justify-between">
            <T as="h2" k="home.menu.title" className="text-[24px] font-bold tracking-[-0.02em]" />
            <T as="span" k="home.menu.more" className="text-[13px] font-medium text-[var(--sa-soft)]" />
          </div>
          <div className={`site-grid grid gap-4${big ? ' site-grid--big' : ''}`}>
            {MEALS.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-[14px] border border-[#ffffff14] bg-[var(--sd-card)]">
                <Photo k={m.photoKey} className={big ? 'h-44' : 'h-28'} tint={m.tint} emoji={m.emoji} />
                <div className="p-4">
                  <T k={m.nameKey} compiled={m.name} className="text-[15px] font-semibold" />
                  <T k={m.macrosKey} compiled={mealMacros(m)} className="mt-1 text-[12.5px] tabular-nums text-[#f4f4f080]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {has('pricing') && <Pricing />}
      {has('testimonials') && <Testimonials />}
      {has('faq') && <Faq />}
      {has('order') && <OrderForm />}
    </>
  )
}

/**
 * The footer strip, plus the site's own page links — the second door to every page, and the one
 * that proves the toolbar's pill follows the site rather than owning it.
 */
function SiteFooter({ pages, current, go, t }: { pages: SitePage[]; current: string; go: (path: string) => void; t: (x: Text) => string }) {
  return (
    <div className="site-pad bg-[#0b0d0a] py-10 text-center">
      {pages.length > 1 && (
        <nav className="mb-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px]" aria-label="Pages">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              data-site-link={p.path}
              onClick={() => go(p.path)}
              className={`transition-colors duration-150 ${p.path === current ? 'font-semibold text-white' : 'text-[#ffffff8c] hover:text-white'}`}
            >
              {t(p.name)}
            </button>
          ))}
        </nav>
      )}
      <T k="footer.tagline" className="text-[18px] font-bold text-white" />
      <T k="footer.line" className="mt-1 text-[13px] text-[#ffffff8c]" />
    </div>
  )
}

/* ------------------------------------------------------------- inner pages */

const TILE = 'rounded-[16px] border border-[#1d1f1a14] bg-white p-5'

/**
 * The page's big heading is `page.<id>.title` — its OWN key, compiled from the page's name. Editing
 * it changes the heading and nothing else: the page's name, route and template stay the plan's
 * (pages.ts derives all three from the name).
 */
function PageHead({ page, title, leadKey, leadCompiled }: { page: SitePage; title: string; leadKey: string; leadCompiled?: string }) {
  return (
    <div className="site-pad mx-auto max-w-[880px] pb-10 pt-14 text-center">
      <T k="page.eyebrow" className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--sa)]" />
      <T as="h1" k={`page.${page.id}.title`} compiled={title} className="mx-auto max-w-[18ch] text-[40px] font-bold leading-[1.1] tracking-[-0.03em]" style={{ textWrap: 'balance' }} />
      <T k={leadKey} compiled={leadCompiled} className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-[1.6] text-[#1d1f1a99]" />
    </div>
  )
}

/**
 * One inner page of the site, in its voice, keyed by the name the plan gave it. These are the
 * prototype's hardcoded data, exactly as the home page is — a route in the switcher has to land
 * somewhere real, or the switcher is theatre.
 */
function InnerBody({ page, t }: { page: SitePage; t: (x: Text) => string }) {
  const name = t(page.name)
  const key = page.name.en.toLowerCase()
  if (key === 'about') {
    return (
      <>
        <PageHead page={page} title={name} leadKey="about.lead" />
        <div className="site-pad mx-auto grid max-w-[980px] gap-6 pb-16 md:grid-cols-2">
          <Photo k="about.photo" className="min-h-[260px] rounded-[20px]" tint="linear-gradient(135deg,#dff1e4,#b7dfc4)" emoji="🥘" emojiSize={64} />
          <div className="flex flex-col justify-center gap-4 text-[15.5px] leading-[1.65] text-[#1d1f1a]">
            <T k="about.p1" />
            <T k="about.p2" />
            <div className="mt-2 flex gap-8 text-[13px] text-[#1d1f1a80]">
              <Stat k="about.stat.0" big={18} block />
              <Stat k="about.stat.1" big={18} block />
              <Stat k="about.stat.2" big={18} block />
            </div>
          </div>
        </div>
      </>
    )
  }
  if (key === 'contact') {
    const LABEL = 'block text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#1d1f1a80]'
    return (
      <>
        <PageHead page={page} title={name} leadKey="contact.lead" />
        <div className="site-pad mx-auto grid max-w-[980px] gap-6 pb-16 md:grid-cols-2">
          <div className={`${TILE} flex flex-col gap-4 text-[15px] leading-[1.6]`}>
            <p><T as="span" k="contact.kitchen.label" className={LABEL} /><T as="span" k="contact.kitchen.value" /></p>
            <p><T as="span" k="contact.write.label" className={LABEL} /><T as="span" k="contact.write.value" /></p>
            <p><T as="span" k="contact.call.label" className={LABEL} /><T as="span" k="contact.call.value" /></p>
          </div>
          <div className={`${TILE} flex flex-col gap-3`}>
            {/* the form is decoration: its fields never take input, so they are not targets */}
            <div className="h-11 rounded-[10px] border border-[#1d1f1a1f] px-4 text-[14px] leading-[44px] text-[#1d1f1a66]" aria-hidden>Your name</div>
            <div className="h-11 rounded-[10px] border border-[#1d1f1a1f] px-4 text-[14px] leading-[44px] text-[#1d1f1a66]" aria-hidden>Email</div>
            <div className="h-24 rounded-[10px] border border-[#1d1f1a1f] px-4 py-3 text-[14px] text-[#1d1f1a66]" aria-hidden>How can we help?</div>
            <T as="span" k="contact.form.cta" className="mt-1 self-start rounded-full bg-[var(--sa)] px-5 py-2.5 text-[14px] font-semibold text-white" />
          </div>
        </div>
      </>
    )
  }
  if (key === 'item page') {
    const m = MEALS[0]
    return (
      <>
        <div className="site-pad mx-auto grid max-w-[980px] gap-8 pb-16 pt-14 md:grid-cols-2">
          <Photo k={m.photoKey} className="min-h-[320px] rounded-[20px]" tint={m.tint} emoji={m.emoji} emojiSize={96} />
          <div className="flex flex-col justify-center">
            <T k={`page.${page.id}.title`} compiled={name} className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--sa)]" />
            <T as="h1" k={m.nameKey} compiled={m.name} className="text-[36px] font-bold leading-[1.1] tracking-[-0.03em]" />
            <T k="item.desc" className="mt-3 text-[15.5px] leading-[1.6] text-[#1d1f1a99]" />
            <T k="item.macros" className="mt-5 text-[14px] tabular-nums text-[#1d1f1a80]" />
            <T as="span" k="item.cta" className="mt-6 self-start rounded-full bg-[var(--sa)] px-6 py-3 text-[14.5px] font-semibold text-white" />
          </div>
        </div>
      </>
    )
  }
  /* Services, Catalogue, Menu, or any name the plan gave: three tiles in the site's voice. A menu
     page's tiles ARE dishes (the same keys as the home grid — one dish, one name); a services page's
     are its own. */
  const dishes = key === 'catalogue' || key === 'menu'
  return (
    <>
      <PageHead page={page} title={name} leadKey={`page.${page.id}.lead`} leadCompiled={SITE_TEXT['services.lead']} />
      <div className="site-pad mx-auto grid max-w-[980px] gap-4 pb-16 md:grid-cols-3">
        {dishes
          ? MEALS.slice(0, 3).map((m) => (
              <div key={m.id} className="overflow-hidden rounded-[16px] border border-[#1d1f1a14] bg-white">
                <Photo k={m.photoKey} className="h-28" tint={m.tint} emoji={m.emoji} />
                <div className="p-5">
                  <T k={m.nameKey} compiled={m.name} className="text-[16px] font-semibold" />
                  <T k={m.macrosKey} compiled={mealMacros(m)} className="mt-1 text-[13.5px] leading-[1.5] text-[#1d1f1a99]" />
                </div>
              </div>
            ))
          : SERVICES.map((s) => (
              <div key={s.id} className="overflow-hidden rounded-[16px] border border-[#1d1f1a14] bg-white">
                <Photo k={`svc.${s.id}.photo`} className="h-28" tint={s.tint} emoji={s.emoji} />
                <div className="p-5">
                  <T k={`svc.${s.id}.title`} className="text-[16px] font-semibold" />
                  <T k={`svc.${s.id}.text`} className="mt-1 text-[13.5px] leading-[1.5] text-[#1d1f1a99]" />
                </div>
              </div>
            ))}
      </div>
    </>
  )
}

/** The site's own 404 — what an address the outline does not know lands on. */
function NotFound({ path, go, t }: { path: string; go: (path: string) => void; t: (x: Text) => string }) {
  return (
    <div className="site-pad mx-auto flex min-h-[420px] max-w-[880px] flex-col items-center justify-center py-16 text-center" data-site-notfound>
      <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--sa)]">404</p>
      <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.03em]">{t({ en: 'Page not found', uk: 'Сторінку не знайдено' })}</h1>
      <p className="mt-4 max-w-[46ch] text-[16px] leading-[1.6] text-[#1d1f1a99]">
        {t({ en: `There’s nothing at ${path} on this site.`, uk: `На цьому сайті за адресою ${path} нічого немає.` })}
      </p>
      <button
        type="button"
        data-site-link="/"
        onClick={() => go('/')}
        className="mt-7 rounded-full bg-[var(--sa)] px-6 py-3 text-[14.5px] font-semibold text-white"
      >
        {t({ en: 'Back to home', uk: 'На головну' })}
      </button>
    </div>
  )
}


import { useContext, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useT, type Text } from '@/i18n'
import { useWorld, siteSliceOf, type SiteAi, type SiteEdits } from '@/state/world'
import { NAV_AFTER, NAV_BEFORE, PALETTES } from '@/modules/versions/changes'
import { Faq, OrderForm, PhotoStrip, Pricing, Testimonials } from './site-ai'
import { useUI } from '@/state/ui'
import { ScrollArea } from '@/ui/ScrollArea'
import { pageSwap, pageSwapFade } from '@/ui/motion'
import { useEditor } from '@/modules/editor/session'
import { EditOverlay } from '@/modules/editor/EditOverlay'
import { ImagePanel } from '@/modules/editor/ImagePanel'
import { findPage, normalizePath, sitePages, type SitePage } from './pages'
import { MEALS, SERVICES, SITE_TEXT, mealMacros } from './content'
import { Photo, SiteContext, T, type SiteCtx } from './site-parts'

/** Remixer's rewrites under the customer's own words — the text layer the page reads (SiteAi). */
const withAi = (edits: SiteEdits, ai: SiteAi): SiteEdits =>
  Object.keys(ai.text).length ? { ...edits, text: { ...ai.text, ...edits.text } } : edits

/** The palette as the page's colour variables — every accent and band reads these. */
function paletteVars(ai: SiteAi): CSSProperties {
  const p = PALETTES[ai.palette] ?? PALETTES[0]
  return { '--sa': p.accent, '--sa-soft': p.soft, '--sd': p.dark, '--sd-card': p.card, '--sp': p.paper } as CSSProperties
}

/** The staged draft laid over the saved layer — what the canvas shows while a tool is on. */
const overlay = (saved: SiteEdits, draft: SiteEdits): SiteEdits => ({
  text: { ...saved.text, ...draft.text },
  photo: { ...saved.photo, ...draft.photo },
  fit: { ...saved.fit, ...draft.fit },
  opacity: { ...saved.opacity, ...draft.opacity },
  height: { ...saved.height, ...draft.height },
})

/**
 * `path` pins the site to one page — the miniature on a shelf card (modules/sites/SiteMini.tsx)
 * shows the home page whatever the canvas stands on, and a picture does not navigate, so its
 * links are inert. `site` names WHOSE site a picture shows; without it this is the canvas, the
 * site the builder stands in, and the one instance the Visual Editor works on.
 */
export function SitePreview({ path: pinned, site }: { path?: string; site?: string } = {}) {
  const { t } = useT()
  const reduce = useReducedMotion()
  const answers = useWorld((s) => siteSliceOf(s.world, site).brief.answers)
  const outline = useWorld((s) => siteSliceOf(s.world, site).planEdits.outline)
  const liveSaved = useWorld((s) => siteSliceOf(s.world, site).siteEdits)
  const liveAi = useWorld((s) => siteSliceOf(s.world, site).siteAi)
  const previewPath = useUI((s) => s.previewPath)
  const setPath = useUI((s) => s.setPreviewPath)
  const canvas = pinned === undefined && site === undefined
  /*
   * AN OLD VERSION ON THE CANVAS (the version card's eye, modules/versions). The canvas shows that
   * version's two layers instead of the live ones, and nothing else changes — same page, same
   * scroll, same route — so the difference is the only thing that moves. The swap happens at the
   * bottom of a short dip (`dim`: .25 in 120 ms, back in 280), so it reads as the site turning to
   * another state, not as a flicker. `shown` lags the request by that dip.
   */
  const wanted = useUI((s) => (canvas ? s.versionPreview : null))
  const [shown, setShown] = useState<number | null>(wanted)
  const dim = useMotionValue(1)
  useEffect(() => {
    if (shown === wanted) return
    if (reduce) { setShown(wanted); return }
    let alive = true
    const out = animate(dim, 0.25, { duration: 0.12, ease: [0.4, 0, 1, 1] })
    out.then(() => {
      if (!alive) return
      setShown(wanted)
      animate(dim, 1, { duration: 0.28, ease: [0, 0, 0.2, 1] })
    })
    return () => { alive = false; out.stop() }
  }, [wanted]) // eslint-disable-line react-hooks/exhaustive-deps
  /* the stored list, not `versionsOf`: only a version that is NOT the current one can be looked at,
     and the moment there are two the list is stored — a derived list is a fresh array per read */
  const stored = useWorld((s) => (canvas ? s.world.versions : null))
  const old = shown !== null ? stored?.find((v) => v.n === shown) : undefined
  const saved = old ? old.edits : liveSaved
  const ai = old ? old.ai : liveAi
  /* an old version is looked at, never edited (the tool steps aside when the eye is pressed) */
  const tool = useEditor((s) => (canvas && !old ? s.tool : null))
  const draft = useEditor((s) => (canvas && !old && s.tool ? s.draft : null))
  const go = pinned !== undefined ? () => {} : setPath
  const pages = useMemo(() => sitePages(answers, outline), [answers, outline])
  const path = normalizePath(pinned ?? previewPath)
  const page = findPage(pages, path)
  const ctx = useMemo<SiteCtx>(
    () => ({ edits: withAi(draft ? overlay(saved, draft) : saved, ai), ai, editing: tool === 'edit', selecting: tool === 'select' }),
    [saved, draft, tool, ai],
  )
  const wrap = useRef<HTMLDivElement | null>(null)
  return (
    <SiteContext.Provider value={ctx}>
    <motion.div
      className="relative h-full"
      style={{ ...paletteVars(ai), opacity: dim }}
      data-prototype-note="generated site, not builder chrome"
      data-site-editing={tool ?? undefined}
      data-site-version={old ? old.n : undefined}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={path}
          data-site-page={path}
          variants={reduce ? pageSwapFade : pageSwap}
          initial="initial"
          animate="animate"
          exit="exit"
          onUpdate={keepOnMainThread}
          className="absolute inset-0"
        >
          {/* each page owns its scroller, so a new page opens at its top */}
          <ScrollArea className="h-full" innerClassName="bg-[var(--sp)] font-sans text-[#1d1f1a]" thumb="auto">
            {/* a page shorter than the canvas still ends in its footer, not in bare ground; `relative`
                so the editor's overlay (rings) rides inside the scroll content with the page */}
            <div ref={wrap} className="relative flex min-h-full flex-col">
              <SiteNav go={go} />
              <div className="flex-1">
                {page ? (page.index === 0 ? <HomeBody /> : <InnerBody page={page} t={t} />) : <NotFound path={path} go={go} t={t} />}
              </div>
              <SiteFooter pages={pages} current={path} go={go} t={t} />
              {tool && <EditOverlay host={wrap} />}
            </div>
          </ScrollArea>
        </motion.div>
      </AnimatePresence>
      {/* the Image panel beside the photo whose «Replace photo» was pressed — canvas only */}
      {tool === 'edit' && <ImagePanel />}
    </motion.div>
    </SiteContext.Provider>
  )
}
