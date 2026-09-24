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
 */
const keepOnMainThread = () => {}

/** The nav: the logo is the way home, the anchors are the one-pager's sections, not pages. */
function SiteNav({ go }: { go: (path: string) => void }) {
  return (
      <div className="site-pad sticky top-0 z-10 flex items-center justify-between border-b border-[#1d1f1a14] bg-[#fbfaf7f2] py-4 backdrop-blur-sm">
        <button type="button" data-site-link="/" onClick={() => go('/')} className="text-[20px] font-bold tracking-[-0.02em]">fit<span className="text-[#2e7d4f]">.</span></button>
        <nav className="site-nav-links gap-7 text-[13.5px] text-[#1d1f1aa6]" aria-hidden>
          <span>Menu</span><span>How it works</span><span>Pricing</span><span>FAQ</span>
        </nav>
        <span className="rounded-full bg-[#2e7d4f] px-4 py-2 text-[13px] font-semibold text-white">Order now</span>
      </div>

  )
}

function HomeBody({ t }: { t: (x: Text) => string }) {
  return (
    <>
      <div className="site-pad site-hero mx-auto max-w-[880px] text-center">
        <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#2e7d4f]">
          Meal prep · Odesa delivery
        </p>
        <h1 className="site-hero-title mx-auto max-w-[16ch] font-bold leading-[1.08] tracking-[-0.03em]" style={{ textWrap: 'balance' }}>
          Chef-made meals with exact macros
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-[16px] leading-[1.6] text-[#1d1f1a99]">
          Weekly menus cooked fresh every morning. Calories, protein, fat and carbs counted
          to the gram — so you don’t have to.
        </p>
        <div className="site-cta mt-7 justify-center gap-3">
          <span className="rounded-full bg-[#2e7d4f] px-6 py-3 text-[14.5px] font-semibold text-white">Build my plan</span>
          <span className="rounded-full border border-[#1d1f1a26] px-6 py-3 text-[14.5px] font-medium text-[#1d1f1a]">See the menu</span>
        </div>
        <div className="site-stats mt-10 justify-center text-[13px] text-[#1d1f1a80]">
          <span><b className="text-[16px] font-bold text-[#1d1f1a]">4 000+</b><br />meals delivered</span>
          <span><b className="text-[16px] font-bold text-[#1d1f1a]">±2 g</b><br />macro accuracy</span>
          <span><b className="text-[16px] font-bold text-[#1d1f1a]">07:30</b><br />at your door</span>
        </div>
      </div>

      {/* menu grid — the DARK half of the page, so the glow can be judged on both
          grounds at once (narrow rim over the white hero, full bloom over this) */}
      <div className="bg-[#101210] pb-16 pt-12 text-[#f4f4f0]">
        <div className="site-pad mx-auto max-w-[980px]">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-[24px] font-bold tracking-[-0.02em]">This week’s menu</h2>
            <span className="text-[13px] font-medium text-[#7ac996]">Full menu →</span>
          </div>
          <div className="site-grid grid gap-4">
            {MEALS.map((m) => (
              <div key={m.name} className="overflow-hidden rounded-[14px] border border-[#ffffff14] bg-[#191b17]">
                <div className="grid h-28 place-items-center text-[40px]" style={{ background: m.tint }} aria-hidden>
                  {m.emoji}
                </div>
                <div className="p-4">
                  <p className="text-[15px] font-semibold">{m.name}</p>
                  <p className="mt-1 text-[12.5px] tabular-nums text-[#f4f4f080]">
                    {m.kcal} kcal · {m.protein} g protein
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
      <p className="text-[18px] font-bold text-white">
        {t({ en: 'Ready when you are.', uk: 'Готові, коли готові ви.' })}
      </p>
      <p className="mt-1 text-[13px] text-[#ffffff8c]">fit. — chef-made meals, Odesa · hello@fit-ration.com</p>
    </div>
  )
}

/* ------------------------------------------------------------- inner pages */

const TILE = 'rounded-[16px] border border-[#1d1f1a14] bg-white p-5'

function PageHead({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="site-pad mx-auto max-w-[880px] pb-10 pt-14 text-center">
      <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#2e7d4f]">fit. · Odesa</p>
      <h1 className="mx-auto max-w-[18ch] text-[40px] font-bold leading-[1.1] tracking-[-0.03em]" style={{ textWrap: 'balance' }}>{title}</h1>
      <p className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-[1.6] text-[#1d1f1a99]">{lead}</p>
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
        <PageHead title={name} lead="A small kitchen in Odesa that cooks every morning for people who count their macros." />
        <div className="site-pad mx-auto grid max-w-[980px] gap-6 pb-16 md:grid-cols-2">
          <div className="grid min-h-[260px] place-items-center rounded-[20px] text-[64px]" style={{ background: 'linear-gradient(135deg,#dff1e4,#b7dfc4)' }} aria-hidden>🥘</div>
          <div className="flex flex-col justify-center gap-4 text-[15.5px] leading-[1.65] text-[#1d1f1a]">
            <p>We started in 2023 with one oven, two chefs and a spreadsheet of macros. Today the kitchen cooks around 400 meals a day and still weighs every portion to the gram.</p>
            <p>Menus change weekly. Nothing is frozen, nothing sits overnight — what leaves the kitchen at 06:30 is on your doorstep by 07:30.</p>
            <div className="mt-2 flex gap-8 text-[13px] text-[#1d1f1a80]">
              <span><b className="block text-[18px] font-bold text-[#1d1f1a]">2</b>chefs</span>
              <span><b className="block text-[18px] font-bold text-[#1d1f1a]">400</b>meals a day</span>
              <span><b className="block text-[18px] font-bold text-[#1d1f1a]">1</b>oven, still</span>
            </div>
          </div>
        </div>
      </>
    )
  }
  if (key === 'contact') {
    return (
      <>
        <PageHead title={name} lead="Questions about a plan, an allergy or a delivery window — write, call or come by." />
        <div className="site-pad mx-auto grid max-w-[980px] gap-6 pb-16 md:grid-cols-2">
          <div className={`${TILE} flex flex-col gap-4 text-[15px] leading-[1.6]`}>
            <p><span className="block text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#1d1f1a80]">Kitchen</span>Kanatna 42, Odesa · Mon–Sat 06:00–14:00</p>
            <p><span className="block text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#1d1f1a80]">Write</span>hello@fit-ration.com</p>
            <p><span className="block text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#1d1f1a80]">Call</span>+380 48 700 12 34</p>
          </div>
          <div className={`${TILE} flex flex-col gap-3`} aria-hidden>
            <div className="h-11 rounded-[10px] border border-[#1d1f1a1f] px-4 text-[14px] leading-[44px] text-[#1d1f1a66]">Your name</div>
            <div className="h-11 rounded-[10px] border border-[#1d1f1a1f] px-4 text-[14px] leading-[44px] text-[#1d1f1a66]">Email</div>
            <div className="h-24 rounded-[10px] border border-[#1d1f1a1f] px-4 py-3 text-[14px] text-[#1d1f1a66]">How can we help?</div>
            <span className="mt-1 self-start rounded-full bg-[#2e7d4f] px-5 py-2.5 text-[14px] font-semibold text-white">Send</span>
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
          <div className="grid min-h-[320px] place-items-center rounded-[20px] text-[96px]" style={{ background: m.tint }} aria-hidden>{m.emoji}</div>
          <div className="flex flex-col justify-center">
            <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#2e7d4f]">{name}</p>
            <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.03em]">{m.name}</h1>
            <p className="mt-3 text-[15.5px] leading-[1.6] text-[#1d1f1a99]">Quinoa, roast chicken, avocado, pickled cabbage and a tahini dressing. Cooked this morning, delivered cold, ready in two minutes.</p>
            <p className="mt-5 text-[14px] tabular-nums text-[#1d1f1a80]">{m.kcal} kcal · {m.protein} g protein · 18 g fat · 44 g carbs</p>
            <span className="mt-6 self-start rounded-full bg-[#2e7d4f] px-6 py-3 text-[14.5px] font-semibold text-white">Add to my plan</span>
          </div>
        </div>
      </>
    )
  }
  /* Services, Catalogue, Menu, or any name the plan gave: three tiles in the site's voice */
  const tiles = key === 'catalogue' || key === 'menu'
    ? MEALS.slice(0, 3).map((m) => ({ title: m.name, text: `${m.kcal} kcal · ${m.protein} g protein`, tint: m.tint, emoji: m.emoji }))
    : [
        { title: 'Weekly plan', text: 'Five days of lunches and dinners, macros set to your goal.', tint: 'linear-gradient(135deg,#dff1e4,#b7dfc4)', emoji: '📅' },
        { title: 'Custom macros', text: 'Tell us the numbers; the chefs build the menu around them.', tint: 'linear-gradient(135deg,#f6e8d9,#eacdaa)', emoji: '⚖️' },
        { title: 'Office delivery', text: 'One drop for the whole team, 07:30 at the door.', tint: 'linear-gradient(135deg,#e7ecf6,#c3d2ec)', emoji: '🏢' },
      ]
  return (
    <>
      <PageHead title={name} lead="Everything fit. cooks and delivers, in one place." />
      <div className="site-pad mx-auto grid max-w-[980px] gap-4 pb-16 md:grid-cols-3">
        {tiles.map((x) => (
          <div key={x.title} className="overflow-hidden rounded-[16px] border border-[#1d1f1a14] bg-white">
            <div className="grid h-28 place-items-center text-[40px]" style={{ background: x.tint }} aria-hidden>{x.emoji}</div>
            <div className="p-5">
              <p className="text-[16px] font-semibold">{x.title}</p>
              <p className="mt-1 text-[13.5px] leading-[1.5] text-[#1d1f1a99]">{x.text}</p>
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
      <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#2e7d4f]">404</p>
      <h1 className="text-[36px] font-bold leading-[1.1] tracking-[-0.03em]">{t({ en: 'Page not found', uk: 'Сторінку не знайдено' })}</h1>
      <p className="mt-4 max-w-[46ch] text-[16px] leading-[1.6] text-[#1d1f1a99]">
        {t({ en: `There’s nothing at ${path} on this site.`, uk: `На цьому сайті за адресою ${path} нічого немає.` })}
      </p>
      <button
        type="button"
        data-site-link="/"
        onClick={() => go('/')}
        className="mt-7 rounded-full bg-[#2e7d4f] px-6 py-3 text-[14.5px] font-semibold text-white"
      >
        {t({ en: 'Back to home', uk: 'На головну' })}
      </button>
    </div>
  )
}


import { useMemo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useT, type Text } from '@/i18n'
import { useWorld } from '@/state/world'
import { useUI } from '@/state/ui'
import { ScrollArea } from '@/ui/ScrollArea'
import { pageSwap, pageSwapFade } from '@/ui/motion'
import { findPage, normalizePath, sitePages, type SitePage } from './pages'

const MEALS = [
  { name: 'Power Bowl', kcal: 520, protein: 42, tint: 'linear-gradient(135deg,#dff1e4,#b7dfc4)', emoji: '🥗' },
  { name: 'Lean Beef & Rice', kcal: 610, protein: 48, tint: 'linear-gradient(135deg,#f6e8d9,#eacdaa)', emoji: '🍛' },
  { name: 'Salmon Teriyaki', kcal: 570, protein: 39, tint: 'linear-gradient(135deg,#fbe3dc,#f3bfae)', emoji: '🍣' },
  { name: 'Chicken Pesto Pasta', kcal: 640, protein: 45, tint: 'linear-gradient(135deg,#eef2da,#d7e3ae)', emoji: '🍝' },
  { name: 'Greek Wrap', kcal: 480, protein: 33, tint: 'linear-gradient(135deg,#e7ecf6,#c3d2ec)', emoji: '🌯' },
  { name: 'Protein Pancakes', kcal: 430, protein: 31, tint: 'linear-gradient(135deg,#f9ecdf,#f0d3b0)', emoji: '🥞' },
]

/**
 * `path` pins the site to one page — the miniature on a shelf card (modules/sites/SiteMini.tsx)
 * shows the home page whatever the canvas stands on, and a picture does not navigate, so its
 * links are inert. Without it the site stands on `ui.previewPath` and its links move it.
 */
export function SitePreview({ path: pinned }: { path?: string } = {}) {
  const { t } = useT()
  const reduce = useReducedMotion()
  const answers = useWorld((s) => s.world.brief.answers)
  const outline = useWorld((s) => s.world.planEdits.outline)
  const previewPath = useUI((s) => s.previewPath)
  const setPath = useUI((s) => s.setPreviewPath)
  const go = pinned !== undefined ? () => {} : setPath
  const pages = useMemo(() => sitePages(answers, outline), [answers, outline])
  const path = normalizePath(pinned ?? previewPath)
  const page = findPage(pages, path)
  return (
    <div className="relative h-full" data-prototype-note="generated site, not builder chrome">
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
          <ScrollArea className="h-full" innerClassName="bg-[#fbfaf7] font-sans text-[#1d1f1a]" thumb="auto">
            {/* a page shorter than the canvas still ends in its footer, not in bare ground */}
            <div className="flex min-h-full flex-col">
              <SiteNav go={go} />
              <div className="flex-1">
                {page ? (page.index === 0 ? <HomeBody t={t} /> : <InnerBody page={page} t={t} />) : <NotFound path={path} go={go} t={t} />}
              </div>
              <SiteFooter pages={pages} current={path} go={go} t={t} />
            </div>
          </ScrollArea>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
