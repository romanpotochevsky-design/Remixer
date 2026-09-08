/**
 * The builder shell — 2026 redesign, pixel source: Figma node 25819:143144
 * "Website Builder" (2560×1166, captured 16.08.2026).
 *
 * Layout: AI chat column 432px on the LEFT, canvas in the middle, icon rail 56px on
 * the RIGHT, both toolbars 52px. Chrome controls are "glass": rgba(24,24,27,.8) with
 * a 16px backdrop blur and one even 12%-white hairline — macOS-restrained, no specular
 * rim. Ground is gray-950; the site preview floats on it with an 8px gutter.
 *
 * Everything still renders from the world store — the scenario console and flows
 * drive this shell exactly as they drove the old one.
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWorld, canUseAI, hasPlan } from '@/state/world'
import { useUI, MOBILE_WIDTH, MOBILE_HEIGHT } from '@/state/ui'
import { ScenarioPanel } from '@/devtools/ScenarioPanel'
import { FlowRunner } from '@/devtools/FlowPlayer'
import { PublishPanel } from '@/modules/publish/PublishPanel'
import { DomainsSurface } from '@/modules/domains/DomainsSurface'
import { PlanSurface } from '@/modules/chat/PlanSurface'
import { DomainModal } from '@/modules/domains/DomainModal'
import { ChatPanel } from '@/modules/chat/ChatPanel'
import { SitePreview } from '@/modules/preview/SitePreview'
import { SiriGlow } from '@/ui/SiriGlow'
import { SPRING } from '@/ui/motion'
import { ChatResizer } from '@/ui/ChatResizer'
import { useT } from '@/i18n'
import {
  LogoRemixer, IconHistory, IconSidebar, IconVisualEditor, IconReload, IconMonitor, IconPhone, IconGrid,
  IconChevronDown, IconCoin, IconStyle, IconExtension, IconAnalytics, IconCloud,
  IconChatBubble, IconExpand,
} from '@/ui/icons'

/** Glass pill: the shared chrome surface — tinted fill, backdrop blur, one hairline. */
function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`liquid-glass flex items-center rounded-[12px] ${className}`}>
      {children}
    </div>
  )
}

const RAIL = [
  { id: 'style', label: 'Website Styles', Icon: IconStyle },
  { id: 'integrations', label: 'Integrations', Icon: IconExtension },
  { id: 'analytics', label: 'Analytics', Icon: IconAnalytics },
  { id: 'cloud', label: 'Cloud', Icon: IconCloud },
  // Domains and Email still have no home in the rail. That gap is the audit's headline.
]

export default function App() {
  const { world } = useWorld()
  const { surface, openDomains, togglePublish, reloading, triggerReload, device, setDevice, chatWidth, goHome, previewOpen, setPreviewOpen, boot } = useUI()

  /*
   * The glow waits for the send choreography to finish.
   *
   * Measured on the published build: with the glow running the page renders
   * 4fps, without it 60 — so anything animating alongside it (the bubble
   * springing out of the composer, the reply typing itself in) loses its frames
   * and reads as "no animation at all". Blurred surfaces this large are simply
   * expensive, and moving the blur around inside the effect does not help.
   * Holding it back ~700ms costs nothing in meaning — the work has barely
   * started — and gives the chat its frames back.
   */
  const busy = world.project === 'generating' || world.chat === 'working' || reloading
  const working = world.chat === 'working'
  const [glow, setGlow] = useState(false)
  /*
   * THE FIRST GENERATION DOES NOT HOLD THE GLOW ON — it pulses once per section.
   *
   * The rule this bends is a real one ("the glow is the only loading indicator"), and it
   * was written when the first build was 5.6 seconds. It is now a MINUTE, and there is a
   * progress card in the chat that names the section in hand (modules/chat/build.ts).
   *
   * MEASURED on this build, same page, same second (07.09.2026, software renderer):
   *   mid-section, glow off .... 60.6 fps
   *   during a glow pulse ...... 9.5 – 10.3 fps
   * The card's animations ARE the deliverable here — a shimmering work line, a spinning
   * ring, rows changing height — and sixty seconds at 10fps would have killed every one
   * of them. That is the same failure as the original 9fps lesson, just spread over a
   * minute instead of a second.
   *
   * So the glow says what it is good at saying: something landed. One ~0.9s pulse as each
   * section completes, and a longer one on the assembling beat that runs into the page
   * appearing — six events over the minute, ~8% of it, instead of one continuous burn.
   */
  const building = world.project === 'generating'
  /*
   * `working` is a dependency ON PURPOSE, not just `busy`. busy is a union of
   * three sources, and unions hide transitions: send during a reload pulse and
   * busy never flips, so the old [busy]-only effect kept the glow burning at
   * full strength straight through the bubble spring — no grace at all. Same
   * on the way out: the answer landing mid-reload never flipped busy false, so
   * the glow never dropped and the whole typing reveal ran under it at ~4fps.
   * Re-running on `working` restarts the quiet window in both directions: a
   * send always gets its 700ms, and an answer always gets the reveal clear
   * (~1.2s covers the capped ~1.1s word stagger) before the glow returns.
   */
  const wasWorking = useRef(false)
  useEffect(() => {
    // 1200 only when an answer JUST landed (working → not) while something else
    // keeps busy true; a plain reload/generating start keeps the tuned 700.
    const revealNeedsRoom = wasWorking.current && !working
    wasWorking.current = working
    // `building` drives its own pulses below; holding the glow here as well would put
    // both on the same element and the pulses would never be seen going out.
    if (!busy || building) { setGlow(false); return }
    setGlow(false)
    const t = window.setTimeout(() => setGlow(true), revealNeedsRoom ? 1200 : 700)
    return () => window.clearTimeout(t)
  }, [busy, working, building])

  /* One pulse per section. Depends on `at` and not on the whole `build` object, so the
     work lines inside a section (which change every few seconds) do not re-fire it. */
  /*
   * ONE PULSE, ON ARRIVAL. With the canvas away for the whole generation there is nothing
   * for a running glow to run along — the outline card carries the minute, row by row. So
   * the glow does the job it was invented for and does cheaply: it marks the preview
   * appearing, once, as the canvas opens on the finished page.
   */
  const wasBuilding = useRef(false)
  useEffect(() => {
    const landed = wasBuilding.current && !building && world.project === 'built'
    wasBuilding.current = building
    if (!landed) return
    setGlow(true)
    const t = window.setTimeout(() => setGlow(false), 1600)
    return () => window.clearTimeout(t)
  }, [building, world.project])

  // The resizer writes --chat-w straight to <html> during a drag; this keeps the
  // stored value authoritative everywhere else (reset, reload, another session).
  useEffect(() => {
    document.documentElement.style.setProperty('--chat-w', `${chatWidth}px`)
  }, [chatWidth])

  /*
   * The collapsible preview (Lovable, recorded 06.09.2026). A brand-new project has
   * nothing to show, so its canvas starts COLLAPSED and the chat takes the whole
   * shell, centring itself; the moment a build starts the canvas opens by itself.
   * Both are defaults, not locks — the arrows in the top bars and the divider let
   * the user open or close it whenever they like.
   */
  const fresh = world.project === 'empty' && world.sent.length === 0 && world.chat === 'empty'
  /* An open brief is the same situation with a transcript in front of it: still
     nothing generated, so still nothing to preview. Kept as a derived default and
     not a one-shot write, so that a reload landing mid-questions comes back the way
     it left — this store is not persisted, and its default is "open". Both are
     defaults, not locks: they only re-run when the SITUATION changes, so a user who
     opens the canvas mid-brief keeps it open. */
  /* 'planning' joins it: the plan is docked, nothing is generated, and the canvas has
     nothing to show — the same situation. Review opens it deliberately, and because this
     only re-runs when the SITUATION changes, that choice survives. */
  /* 'generating' joins them, and this REPLACES the earlier "canvas opens when the build
     starts" (designer, 07.09.2026, on seeing the minute for himself: "нет смысла показывать
     превью сайта, пока не сгенерируется страница первая"). That decision was made when the
     first build was 5.6 seconds and there was nothing else to look at; it is now a minute,
     and the outline card is the thing to look at — which it does far better at the chat's
     800 than squeezed into 432 beside an empty rectangle. Same situation as the brief and
     the plan: nothing generated, so nothing to preview. */
  const waiting =
    world.brief.status === 'asking' || world.brief.status === 'planning' || world.project === 'generating'
  useEffect(() => { if (fresh || waiting) setPreviewOpen(false) }, [fresh, waiting, setPreviewOpen])
  /* …and it opens on the page it is a preview OF, at the moment that page exists. */
  useEffect(() => { if (world.project === 'built') setPreviewOpen(true) }, [world.project, setPreviewOpen])
  const { t } = useT()

  const address =
    world.domain === 'live' || world.domain === 'multiple'
      ? 'fit-ration.com'
      : 'fit-ration.remixer.site'

  const publishLabel =
    world.unpublished > 0
      ? { en: 'Update', uk: 'Оновити' }
      : { en: 'Publish', uk: 'Опублікувати' }

  return (
    <div
      className="flex h-full overflow-hidden bg-[var(--gray-950)] text-[var(--white-900)]"
      data-preview={previewOpen ? 'open' : 'closed'}
      /* the Home → builder arrival: while set, the `arrive-*` parts below play their
         entrance (index.css "THE ARRIVAL"; the phases are ui/BootCover.tsx's) */
      data-boot={boot ?? undefined}
    >
      {/* ================================================== chat column, 432px —
          or the whole shell when the preview is collapsed. The width transition
          IS the open/close animation: the canvas column just gets what is left,
          so the chat content slides over while the preview grows out of the
          right edge — Lovable's move, measured at ~0.42s ease-out. */}
      <aside
        className="shell-aside flex flex-none flex-col"
        style={{ width: previewOpen ? 'calc(var(--chat-w) - 1px)' : 'calc(100% - var(--rail-w))' }}
      >
        {/* chat top toolbar (Figma 25819:143769) */}
        <header className="flex flex-none items-center justify-between pr-2" style={{ height: 'var(--topbar-h)' }}>
          {/* the mark is the way back to the Home page, as it is in every builder
              in the category */}
          <button
            onClick={() => goHome()}
            aria-label={t({ en: 'Back to Home', uk: 'На головну' })}
            className="flex items-center"
          >
            <div className="grid w-14 place-items-center">
              {/* `arrive-mark`: on the Home → builder arrival the mark lights up here, just
                  before the wordmark unfolds from it (index.css "THE ARRIVAL") */}
              <span className="arrive-mark grid h-8 w-8 place-items-center">
                <LogoRemixer size={32} />
              </span>
            </div>
            <span className="arrive-word font-display text-[20px] font-semibold leading-[1.2] text-white">Remixer</span>
          </button>
          {/*
            * THE PILL HOLDS ONE THING OR THE OTHER, never both (designer, 07.09.2026:
            * "кнопок история и скрыть чат тут быть не может").
            *
            *  · canvas open  — the chat is a 432 column beside it, and these two controls
            *    are ABOUT that column: its history, and putting it away.
            *  · canvas away  — the chat IS the shell. "Collapse chat" has nothing left to
            *    collapse to, and version history ends up a thousand pixels from the thread
            *    it belongs to, pinned to the far right of the window. All that is left to
            *    say here is "bring the canvas back", and that is the ONE arrow in the whole
            *    shell (there is none on the canvas side either — collapsing is a drag of
            *    the divider). Do not put a second one anywhere.
            */}
          <Glass className="arrive-pill gap-0.5 p-0.5">
            {previewOpen ? (
              <>
                <button
                  aria-label={t({ en: 'Version history', uk: 'Історія версій' })}
                  className="grid h-8 w-8 place-items-center rounded-[10px] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
                >
                  <IconHistory size={18} />
                </button>
                <span className="h-8 w-px bg-[var(--glass-divider)]" aria-hidden />
                <button
                  aria-label={t({ en: 'Collapse chat', uk: 'Згорнути чат' })}
                  className="grid h-8 w-8 place-items-center rounded-[10px] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
                >
                  <IconSidebar size={18} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setPreviewOpen(true)}
                aria-label={t({ en: 'Show preview', uk: 'Показати прев’ю' })}
                title={t({ en: 'Show preview', uk: 'Показати прев’ю' })}
                className="grid h-8 w-8 place-items-center rounded-[10px] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
              >
                <IconExpand size={17} />
              </button>
            )}
          </Glass>
        </header>

        <ChatPanel />
      </aside>

      {/* The hairline between chat and canvas — and the handle you resize by. In
          Figma the column is 432 while everything inside stops at 430–431; that
          last pixel is the divider, so it lives here and the aside gives it back. */}
      <ChatResizer />

      {/* ================================================== center column —
          clipped, so that while the aside grows this column shrinks to nothing
          instead of re-flowing its toolbar into a heap. */}
      <div className="arrive-canvas flex min-w-0 flex-1 flex-col overflow-hidden" aria-hidden={!previewOpen}>
        {/* canvas top toolbar (Figma 25819:143717) */}
        <header className="flex flex-none items-center justify-between pr-2" style={{ height: 'var(--topbar-h)' }}>
          {/* left: Visual Editor + device preview */}
          <div className="flex items-center gap-2 pl-2">
            <Glass className="h-9 justify-center pr-5">
              <span className="grid h-9 w-10 place-items-center text-[var(--white-700)]">
                <IconVisualEditor size={18} />
              </span>
              <span className="text-[14px] leading-none text-[var(--white-900)]">Visual Editor</span>
            </Glass>
            <Glass className="h-9 gap-0.5 p-0.5">
              <button
                onClick={() => triggerReload()}
                aria-label={t({ en: 'Reload preview', uk: 'Перезавантажити прев’ю' })}
                className="grid h-8 w-8 place-items-center rounded-[10px] text-[var(--white-900)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
              >
                <span className={reloading ? 'animate-spin' : undefined} style={reloading ? { animationDuration: '1.1s' } : undefined}>
                  <IconReload size={17} />
                </span>
              </button>
              <span className="h-8 w-px bg-[var(--glass-divider)]" aria-hidden />
              {/* ONE control, as in Lovable (verified on a screen recording of their
                  builder): the icon IS the view you are in — a monitor while the canvas
                  is desktop, a phone once you switch — and clicking flips it. */}
              <button
                onClick={() => setDevice(device === 'desktop' ? 'mobile' : 'desktop')}
                aria-label={
                  device === 'desktop'
                    ? t({ en: 'Switch to mobile view', uk: 'Перемкнути на мобільний вигляд' })
                    : t({ en: 'Switch to desktop view', uk: 'Перемкнути на вигляд десктопа' })
                }
                className="grid h-8 w-8 place-items-center rounded-[10px] text-[var(--white-900)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
              >
                {device === 'desktop' ? <IconMonitor size={17} /> : <IconPhone size={17} />}
              </button>
              {/*
                * NO COLLAPSE ARROW HERE EITHER (designer, 07.09.2026, twice: "эта стрелка
                * не нужна тут, она видна только когда скрыто превью", then "какова черта я
                * вижу тут эту кнопку?"). The rule is exactly one arrow in the whole shell,
                * in the chat header, and only while the preview is away — it expands.
                *
                * Collapsing is a DRAG: pulling the divider past the canvas minimum puts
                * the preview away (ChatResizer, PREVIEW_MIN). Do not add a button back on
                * either side.
                */}
            </Glass>
          </div>

          {/* center: project button, 280×40 — the live address in permanent chrome */}
          <button
            onClick={() => openDomains(world.domain === 'connecting' || world.domain === 'verifying' ? 'status' : 'home')}
            className="mx-2 flex h-10 w-[280px] min-w-0 shrink items-center justify-between rounded-[10px] border border-[var(--white-200)] px-2 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]/[0.04]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid h-6 w-6 flex-none place-items-center text-[var(--white-400)]">
                <IconGrid size={22} />
              </span>
              {world.domain === 'live' && <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--live)]" aria-hidden />}
              {(world.domain === 'connecting' || world.domain === 'verifying') && (
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--attention)]" aria-hidden />
              )}
              <span className="truncate text-[15px] font-semibold leading-[1.4]">{address}</span>
            </span>
            <span className="flex-none text-[var(--white-400)]"><IconChevronDown size={18} /></span>
          </button>

          {/* right: credits (amber, permanent — never move it off the toolbar) + Publish */}
          <div className="flex items-center gap-2">
            <div
              className={`flex h-9 items-center gap-3 rounded-[12px] border py-0 pl-[7px] pr-[6px] ${
                world.credits === 0 ? 'border-[#ef444440]' : 'border-[var(--credit-border)]'
              }`}
              style={{ background: 'linear-gradient(to bottom, var(--credit-from), var(--credit-to))' }}
              title={t({ en: 'Credits', uk: 'Кредити' })}
            >
              <span className="flex items-center gap-2">
                <IconCoin size={20} />
                <span className="text-[15px] font-medium tabular-nums text-white">
                  {world.credits.toLocaleString('en-US').replace(/,/g, ' ')}
                </span>
              </span>
              <span className="grid h-6 w-6 place-items-center text-[var(--white-400)]">
                <IconChevronDown size={16} />
              </span>
            </div>
            {/*
              * Publish is DEAD until there is a site to publish (designer, 07.09.2026).
              * `built` is the only state that qualifies: on an empty project there is
              * nothing, and during `generating` there is not yet anything — a live blue
              * Publish through the whole brief and the whole build invites the one press
              * that cannot work, right where the flow is trying to teach a sequence.
              *
              * Greyed with the same pair the Home page's Build uses when it is not armed
              * (`--white-100` plate, 24%-white label), so "not yet" looks the same
              * everywhere in the product.
              */}
            <button
              onClick={() => togglePublish()}
              disabled={world.project !== 'built'}
              title={
                world.project !== 'built'
                  ? t({ en: 'Nothing to publish yet', uk: 'Публікувати поки нічого' })
                  : undefined
              }
              className={`h-9 rounded-[10px] px-4 text-[13px] font-semibold leading-[1.4] transition-colors duration-[var(--dur-fast)] ease-std ${
                world.project === 'built'
                  ? 'bg-[var(--action)] text-white hover:bg-[var(--action-hover)]'
                  : 'cursor-not-allowed bg-[var(--white-100)] text-[#ffffff3d]'
              }`}
            >
              {t(publishLabel)}
              {world.unpublished > 0 && <span className="ml-1.5 tabular-nums opacity-70">{world.unpublished}</span>}
            </button>
          </div>
        </header>

        {/* canvas — 8px gutter, the preview floats on the ground.
            While the agent works, the frame lights up with the Siri-style edge glow.

            The device switch resizes the STAGE, and the site inside re-lays-out
            because it answers container queries, not the browser width — the same
            thing Lovable gets for free from its preview iframe. Mobile is a real
            390px frame centred on the ground, not a scaled-down desktop. */}
        <main className="relative min-h-0 min-w-0 flex-1 pb-2 pl-2">
          {(() => {
            /* The plan document takes the canvas the same way the domains dashboard
               does — a surface in place of the site, not a modal over it. There is no
               site to preview at this point in the flow, so nothing is being covered. */
            return surface === 'plan' ? (
              <PlanSurface />
            ) : surface === 'domains' ? (
              <DomainsSurface />
            ) : (
              <div className="flex h-full items-center justify-center">
                <motion.div
                  /* the phone frame gets a hairline: floating on the ground, the site's
                     own dark sections would otherwise bleed into the shell. Lovable
                     outlines its preview the same way (measured border #41413D). */
                  className={`site-stage relative overflow-hidden rounded-shell ${
                    device === 'mobile' ? 'ring-1 ring-[#ffffff14]' : ''
                  }`}
                  initial={false}
                  animate={{
                    width: device === 'mobile' ? MOBILE_WIDTH : '100%',
                    height: device === 'mobile' ? MOBILE_HEIGHT : '100%',
                  }}
                  style={{ maxHeight: '100%' }}
                  transition={{ duration: 0.34, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  {world.project === 'built' ? (
                    /* During a reload the page itself stays put — the edge glow alone
                       carries the "working" signal (no skeleton, no remount flicker). */
                    <SitePreview />
                  ) : (
                    <div className="grid h-full place-items-center bg-[var(--gray-900)] px-6 text-center">
                      {world.project === 'generating' ? (
                        /* "pages", plural, was a lie: this pass builds ONE page and the
                           site appears when that page is done (designer, 07.09.2026).
                           The board draws this canvas bare, and bare in a static frame
                           is fine; live, an unexplained dark rectangle for a minute
                           reads as broken. One quiet line, and the detail — which
                           section, what is happening to it — stays in the chat where
                           the card already carries it. */
                        <p className="text-[14px] text-[var(--white-400)]">
                          {t({
                            en: 'Your home page appears here as soon as it’s built',
                            uk: 'Головна з’явиться тут, щойно буде готова',
                          })}
                        </p>
                      ) : (
                        <p className="text-[14px] text-[var(--white-300)]">
                          {t({ en: 'Your site will appear here as Remixer builds it', uk: 'Ваш сайт з’явиться тут, щойно Remixer його збудує' })}
                        </p>
                      )}
                    </div>
                  )}
                  <SiriGlow active={glow} surface={world.project === 'built' ? 'split' : 'dark'} />
                </motion.div>
              </div>
            )
          })()}
          <PublishPanel />
        </main>
      </div>

      {/* ================================================== right rail, 56px */}
      <nav className="arrive-rail flex flex-none flex-col items-center pb-6" style={{ width: 'var(--rail-w)' }}>
        <div className="grid place-items-center" style={{ height: 'var(--topbar-h)' }}>
          <button
            aria-label={t({ en: 'Account', uk: 'Акаунт' })}
            className="arrive-rail-item h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-[#e0a94a] to-[#a3651f] text-[12px] font-semibold text-white"
          >
            R
          </button>
        </div>
        {/*
          * THE TOOLS ARRIVE WITH THE SITE (designer, 07.09.2026: "когда идет генерация
          * первая и сайта еще нет… этих кнобок нет, они потом красиво с анимацией
          * появляются"). Style, Integrations, Analytics and Cloud all act on a site, and
          * through the whole brief and the whole minute of the first build there is no
          * site for them to act on — the same reasoning that greys out Publish, taken one
          * step further: a control with nothing to do is better absent than dead.
          *
          * The avatar above and the support chat below stay: an account and a way to ask
          * for help exist before any site does.
          *
          * ⚠️ `initial={false}` so opening a project that is ALREADY built does not
          * replay the arrival. The animation belongs to the moment the site appears, not
          * to every mount — the same rule the chat's own reveal follows (`settled`).
          */}
        <AnimatePresence initial={false}>
          {world.project === 'built' && (
            <motion.div
              key="rail-tools"
              className="mt-2.5 flex flex-col gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.14 } }}
            >
              {RAIL.map(({ id, label, Icon }, i) => (
                <motion.button
                  key={id}
                  title={label}
                  aria-label={label}
                  /* One after the other from the top, 70ms apart: the rail fills in the
                     direction it is read. Only transform and opacity, so the stagger
                     costs the compositor and nothing else. */
                  initial={{ opacity: 0, scale: 0.82, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ ...SPRING, delay: 0.12 + i * 0.07 }}
                  className="grid h-12 w-12 place-items-center rounded-[16px] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
                >
                  <Icon size={22} />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex-1" />
        <button
          aria-label={t({ en: 'Support chat', uk: 'Чат підтримки' })}
          className="arrive-rail-item grid h-9 w-9 place-items-center rounded-full bg-[#48ba79] text-white transition-transform duration-[var(--dur-fast)] ease-std hover:scale-105"
        >
          <IconChatBubble size={20} />
        </button>
      </nav>

      {/* AI availability notice for expired accounts, kept from the old shell */}
      {!canUseAI(world) && !hasPlan(world) && world.account === 'trial-expired' && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[var(--gray-850)] px-4 py-2 text-[13px] text-[var(--white-500)] shadow-lg">
          {t({ en: 'Trial ended — your site is safe. Upgrade to keep editing with AI.', uk: 'Тріал завершився — сайт у безпеці. Оновіться, щоб редагувати з AI.' })}
        </div>
      )}

      {/* The checkout sheet is an APP-modal: its scrim covers the chat column and
          the right rail too, so it mounts at the very top of the tree, not inside
          <main> where the domains surface lives. */}
      <DomainModal />

      <FlowRunner />
      <ScenarioPanel />
    </div>
  )
}
