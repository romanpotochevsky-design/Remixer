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
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useWorld, canUseAI, hasPlan, registrantUnconfirmed } from '@/state/world'
import { useUI, MOBILE_WIDTH, MOBILE_HEIGHT } from '@/state/ui'
import { STAGING_HOST, CUSTOM_DOMAIN } from '@/data/domains'
import { ScenarioPanel } from '@/devtools/ScenarioPanel'
import { PlanVariantSwitch } from '@/modules/chat/PlanVariantSwitch'
/* `domainIsHome` rides along with the panel deliberately: it is the panel's own reading of
   WHICH ADDRESS THIS PRODUCT PRINTS, and the chip must not grow a second one. Since
   15.09.2026 that reading is "the domain is connected" — so the chip names the customer's
   own domain from `propagating` on, while its DOT keeps the truth about the domain not
   answering yet (`domainStatus` below, off `registrantUnconfirmed`). Two facts, two
   channels, one predicate each. */
import { PublishPanel, domainIsHome, canPublish } from '@/modules/publish/PublishPanel'
import { DOMAIN_STATUS, domainStatus } from '@/modules/domains/status'
import { ConfirmHost } from '@/ui/ConfirmDialog'
import { DomainsSurface } from '@/modules/domains/DomainsSurface'
import { PlanSurface } from '@/modules/chat/PlanSurface'
import { DomainModal } from '@/modules/domains/DomainModal'
import { PanelCart } from '@/modules/panel/PanelCart'
import { ChatPanel } from '@/modules/chat/ChatPanel'
import { SitePreview } from '@/modules/preview/SitePreview'
import { SiriGlow } from '@/ui/SiriGlow'
import { SPRING, EXIT, popoverContent, siteBack, surfaceWindow } from '@/ui/motion'
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

/**
 * ─────────────────────── THE EMAIL, SIMULATED ───────────────────────
 *
 * ICANN's registrant-email check is the one state in the whole flow whose exit does
 * not happen in the product. The customer leaves for their inbox, opens a message from
 * DreamHost and clicks the link inside it — and a prototype has no inbox, so the walk
 * could be taken up to here and never finished.
 *
 * It used to be answered with a dashed "Confirm email" strip inside the Publish panel,
 * and the designer threw it out on sight (14.09.2026: "зачем ты это ставил в окно? это
 * же не часть интерфейса?!!!!!" — then: "просто где-то всплыла эта информация и кнопка").
 * The capability stays; its home changes.
 *
 * WHY A LETTER AND NOT A BUTTON. A button labelled "Confirm email" floating over the
 * shell would still be a control, just a homeless one — and the viewer would spend the
 * demo wondering whose control it is. A card that reads as an arriving MESSAGE — who it
 * is from, what it asks, and its link as the action — teaches the real mechanic (you
 * leave, you click a link in your mail) and advances the flow in the same press. And
 * nobody mistakes it for the builder, because a website builder does not show you your
 * inbox.
 *
 * HOW IT SAYS IT IS NOT THE PRODUCT, three ways at once:
 *  · MATERIAL. Light paper on the near-black shell, in the same palette the prototype
 *    console and the flow player already use for "not part of the product". It adopts
 *    nothing from the Publish panel — no gray-850, no glass.
 *    ⚠️ "and no blue button" stood here until 14.09.2026, when the designer asked for
 *    one ("сделай кнопку нормальную синюю"). The letter's own action is the only place
 *    it may borrow the product's blue, and the reason is the reason the card exists at
 *    all: it is the ONE press that moves the flow on, and it was a text link that nobody
 *    found. Everything else about the card stays foreign — the paper, the tag, the
 *    mono strip. Do not let the blue spread to a second element here.
 *  · A TAG. Its own dashed PROTOTYPE strip, in words: this is the prototype standing in
 *    for the email, not Remixer displaying mail.
 *  · WHERE IT SITS — the TOP-LEFT corner of the canvas since 14.09.2026 (designer:
 *    "перемести его в левый верхний угол"), 16px in from the canvas's left edge and 16px
 *    under the toolbar, which is the same 16px inset it used to keep at the bottom.
 *    Measured, not guessed, with the Publish panel open in both its heights:
 *
 *      1280×800   chat 432 │ canvas 432…1224 │ panel x 745…1225, y 8…360 (live) / 8…496
 *      1600×1000  chat 432 │ canvas 432…1544 │ panel x 1065…1545, same two heights
 *
 *    The panel is what the presenter is pointing at while this is up, so the card has to
 *    live in the strip to the LEFT of it: 745 − 448 = 297px at the projector size. Hence
 *    the 280 width — 17px of daylight at 1280, 337px at 1600 — and hence the left edge
 *    still riding `--chat-w`, so a resizer drag can never slide it under the chat.
 *    Top is `--topbar-h` + 16 = 68, clear of both 52px bars and of the canvas toolbar.
 *
 * It is up on exactly the terms the Publish panel's own amber card is up on — a domain
 * attached AND `world.icann` — and the link is the same one write the scenario console's
 * "Email unconfirmed" toggle makes — either way out clears the state and the panel settles
 * to "Padlock on · anyone can visit".
 */
/*
 * The registrant address. Hardcoded ON PURPOSE and NOT world truth: the world carries no
 * account email, and the Publish panel's own card prints this very literal in all four of
 * its strings ("We sent a link to roman@example.com…", PublishPanel.tsx). Two surfaces
 * naming the same inbox is the whole point, so if one of them ever starts reading a real
 * address from the world, the other has to move in the same commit.
 */
const SIM_EMAIL_TO = 'roman@example.com' // the address the Publish panel's card names

/**
 * THE ARRIVAL — a message that LANDS, not a surface that appears.
 *
 * `foreignPage` carried this until 14.09.2026 and the designer could not see it
 * ("сделай чтобы оно появлялось с анимацией"): that preset is a 26px rise on
 * SPRING_SOFT, which is ζ≈0.92 — critically damped, no overshoot, and pointed the wrong
 * way now that the card sits at the top. It is the right preset for the hosting panel's
 * cart, a page loading; it is the wrong one for a notification.
 *
 * This one is the notification every OS already taught the audience: it comes DOWN out of
 * the top bar, and it bounces when it gets there. The travel is deliberately SHORT — 16px,
 * which is exactly the gap between the card's resting top (68) and the bars' lower edge
 * (52), so the highest frame the card ever occupies is flush with the bar and it can never
 * cover it, not even for one transparent frame. Legibility is bought with the SPRING
 * instead: stiffness 420 / damping 21 is ζ=0.51, and the filmed landing is scale 1.0107 and
 * 2.8px past its seat at ~190ms, home by ~375. The scale carries the rest, anchored
 * `origin-top` so the card unfolds downward out of the bar rather than zooming at its middle.
 *
 * ⚠️ OPACITY IS NOT ON THE SPRING. Give a bouncy spring the opacity as well and it
 * overshoots 1, clamps, and comes back UNDER — filmed at 1 → 0.977 → 1 across the settle,
 * a flicker on a card that has already arrived. It gets its own 180ms ease-out, which also
 * means the card is solid BEFORE the bounce instead of fading through it: the landing is
 * the part worth seeing.
 *
 * Transform and opacity only, like everything else in motion.ts. It lives here and not
 * there ON PURPOSE: one card in the whole product is a letter, and a preset with one
 * caller is a local variant, not a house rule. The moment a second foreign message
 * arrives anywhere, this moves to motion.ts and both take it from there.
 *
 * ⚠️ NO RIM FLASH on the landing, tempting as it is. A sheen is the signature of GLASS —
 * light sliding across something transparent — and this card is opaque paper. That is
 * the same rule that rolled `.glass-sheen` off the Publish panel (17.08.2026).
 */
const letterArrives = {
  initial: { opacity: 0, y: -16, scale: 0.93 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: {
      type: 'spring', stiffness: 420, damping: 21, mass: 1,
      opacity: { duration: 0.18, ease: [0.2, 0, 0, 1] },
    },
  },
  exit: { opacity: 0, y: -10, scale: 0.97, transition: EXIT },
} as const

/**
 * …and the same gesture under `prefers-reduced-motion`, which must THROW THE OFFSETS
 * AWAY rather than let them be jumped to. `<MotionConfig reducedMotion="user">` does not
 * cancel a variant's target, it snaps to it — so an exit that ends on `y: -10` stops
 * travelling and instead TELEPORTS 10px at opacity ~.9, which is worse than the slide it
 * was replacing (measured on the dock's shelf, 26.08.2026; `listSwapFade` in motion.ts
 * exists for exactly this). A variant whose destination is a displacement needs a
 * displacement-free twin, chosen by `useReducedMotion()`.
 */
const letterArrivesFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, transition: EXIT },
} as const

function SimulatedEmail() {
  const { world, set } = useWorld()
  const reloading = useUI((s) => s.reloading)
  const reduce = useReducedMotion()
  const { t } = useT()

  /*
   * WHICH NAME THE LETTER SAYS IS WORLD TRUTH — the same read as the topbar chip below and
   * as the Publish panel's field: `customDomain`, "WHICH domain is attached to this
   * project" (state/world.ts). This printed the CUSTOM_DOMAIN constant until tonight, so a
   * customer who had just bought `emberandoak.com` was congratulated on `fit-ration.com`
   * forty pixels under a panel reading `emberandoak.com` — two different domain names in
   * one frame, on the only white surface on the screen, at the climax of the purchase, and
   * still disagreeing at Live. The constant survives only as the fallback for a world
   * carrying no name, exactly as the chip has it.
   */
  const domain = world.customDomain || CUSTOM_DOMAIN

  /*
   * …AND THE LETTER IS DUE ON EXACTLY THE PANEL'S TERMS. The panel asks
   * `attached && world.icann` (PublishPanel, `confirmEmail`); this asked `world.icann`
   * alone. Nothing clears that flag when the domain axis moves back to `staging` —
   * neither the store nor the scenario console, which HIDES the "Email unconfirmed"
   * toggle the moment no domain is attached — so a world staged from `icann-verify` and
   * then returned to the free address kept a letter floating over a project with no
   * domain, announcing a registration that had not happened and holding the one control
   * that could take it back. Asking the panel's question is also what stops the two from
   * ever disagreeing about whether this state exists at all.
   */
  /* …and it is the shell's one selector for that question now (`registrantUnconfirmed`,
     state/world.ts), shared with the topbar dot below and with the domains window, so the
     three cannot drift the way this one already did once. */
  const due = registrantUnconfirmed(world)

  /*
   * WHILE THE PREVIEW'S EDGE GLOW IS RUNNING, THE LETTER STOPS WAVING.
   *
   * Two reasons, and either one alone would be enough. Meaning: the Siri glow is the
   * product saying "I am working on your site" — a second thing pulsing beside it turns
   * one signal into two competing ones, and the glow is the one that belongs to the
   * moment. Cost: the glow is the most expensive thing this prototype draws (measured on
   * the published build — 4fps with it, 60 without), so the frames it leaves are exactly
   * the frames not to spend on decoration. The union is the same three sources `App`
   * reads for the glow itself; `busy` there is local, so this asks the world directly.
   */
  const quiet = world.chat === 'working' || world.project === 'generating' || reloading

  return (
    <AnimatePresence>
      {due && (
        <motion.aside
          key="sim-email"
          data-quiet={quiet ? 'true' : undefined}
          /*
           * TOP-LEFT OF THE SCREEN, NOT OF THE PREVIEW (designer, 15.09.2026: «эта штука
           * должна всплыть в левом верхнем углу экрана, а не превью»).
           *
           * The left edge used to be `calc(var(--chat-w) + 16px)` — the canvas's own
           * corner — so the letter floated over the SITE, which is the one surface in the
           * shell that belongs to the customer's own work. It also moved when the resizer
           * moved, which made a prototype instrument behave like part of the layout. Now
           * it is the window's gutter, over the chat column, and it stays put through a
           * drag.
           *
           * ⚠️ THE TOP STAYS `topbar + 16`, AND THAT IS NOT A HALF-MEASURE. 68 is
           * load-bearing for THE ARRIVAL (see the header): the travel is exactly the 16px
           * between this seat and the bars' lower edge at 52, which is what lets the card
           * come down OUT of the bar and never cover it, not even for one transparent
           * frame. Seated at the literal 16 it would start above the window's edge and
           * land on top of the mark and the history pill — losing the choreography the
           * designer asked for on the 14th to satisfy the corner he asked for on the 15th.
           * The axis he was correcting is the one that was keyed to the preview.
           */
          style={{
            left: '16px',
            top: 'calc(var(--topbar-h) + 16px)',
          }}
          className="sim-letter fixed z-[60] w-[280px] origin-top overflow-hidden rounded-[14px] bg-[#F7F7F5] text-neutral-900 shadow-[0_2px_6px_rgba(0,0,0,0.22),0_22px_48px_-12px_rgba(0,0,0,0.6)] ring-1 ring-black/15"
          variants={reduce ? letterArrivesFade : letterArrives}
          initial="initial"
          animate="animate"
          exit="exit"
          /* The Publish panel closes on any mousedown outside itself. Confirming from
             here would therefore shut the panel in the same press — and the panel is the
             thing the presenter wants to watch change. */
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* the tag — dashed, mono, the console's own language for "tooling" */}
          <div className="flex items-start gap-2 border-b border-dashed border-black/20 bg-[#ECECE7] px-3.5 py-2">
            <span className="mt-px flex-none font-mono text-[10px] uppercase leading-[1.6] tracking-[0.14em] text-neutral-500">
              Prototype
            </span>
            <span className="text-[11.5px] leading-[1.35] text-neutral-500">
              {t({
                en: 'the email, simulated — Remixer never shows your inbox',
                uk: 'імітація листа — Remixer не показує вашу пошту',
              })}
            </span>
          </div>

          {/* the message itself. Rule 3 of the motion language: the contents arrive a
              beat behind the surface they are in. */}
          <motion.div className="px-3.5 pb-3 pt-3" variants={popoverContent}>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[var(--action)] text-white">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="1.25" y="3.25" width="13.5" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-[1.3]">DreamHost</p>
                <p className="truncate text-[11.5px] leading-[1.35] text-neutral-500">
                  {t({ en: 'to', uk: 'кому:' })} {SIM_EMAIL_TO}
                </p>
              </div>
            </div>

            <p className="mt-2.5 text-[13.5px] font-semibold leading-[1.35]">
              {t({ en: 'Confirm your email address', uk: 'Підтвердьте свою email-адресу' })}
            </p>
            <p className="mt-1 text-[12.5px] leading-[1.45] text-neutral-600">
              {t({
                en: `You registered ${domain}. Confirm this address to keep the domain and its email working.`,
                uk: `Ви зареєстрували ${domain}. Підтвердьте цю адресу, щоб домен і пошта й далі працювали.`,
              })}
            </p>

            {/*
              * THE ACTION — a filled button since 14.09.2026 ("сделай кнопку нормальную
              * синюю… чтобы было понятно, что нужно нажать на неё, чтобы двигаться
              * дальше"). It was a blue text link before, which is what a real email would
              * carry — and that was the trouble: the one press that finishes the walk read
              * as body copy, on a card the audience had already filed as "a note".
              *
              * House blue, house size: `--action` at 40px, the Medium of the three legal
              * heights (32 / 40 / 48 — 36 is not one of them), radius 10 as everywhere
              * else at that height, and `press-bloom` so the press feels like every other
              * press in the product. Checked against PAPER, not against the shell: the
              * fill stands 3.35:1 off the card's #F7F7F5, so the button is unmistakably an
              * object on the sheet rather than a tinted word in it.
              */}
            <div className="sim-cta relative mt-3">
              {/* the breath — see index.css, "THE LETTER'S BUTTON, ASKING TO BE PRESSED" */}
              <span className="sim-cta-halo" aria-hidden />
              <button
                onClick={() => set({ icann: false })}
                className="press-bloom flex h-10 w-full items-center justify-center rounded-[10px] bg-[var(--action)] text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)]"
              >
                {t({ en: 'Confirm my email address', uk: 'Підтвердити мою email-адресу' })}
              </button>
            </div>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

/*
 * ⚠️ `onUpdate` no-ops keep these one-off canvas fades ON THE MAIN THREAD (motion 11 goes to
 * WAAPI for opacity/transform unless an element has onUpdate — AcceleratedAnimation.supports).
 * Traced on this very hand-over: a composited fade hands the element back at its pre-animation
 * inline opacity for the frame between `finish` and motion's next render — the leaving window
 * read 1 again after fading to .11, the returning site read 0 after reaching 1, the panel 0
 * after its spring — three one-frame blinks in one hand-over. Main-thread animations write the
 * final value on their last frame and there is nothing to hand back.
 */
const keepOnMainThread = () => {}

export default function App() {
  const { world } = useWorld()
  const { surface, openDomains, togglePublish, reloading, triggerReload, device, setDevice, chatWidth, goHome, previewOpen, setPreviewOpen, boot } = useUI()

  /*
   * A SURFACE IS LEAVING THE CANVAS. From the moment `surface` goes back to the preview until
   * the site has faded back in (`siteBack` complete), the Publish panel is held: on the Connect
   * press it is asked for in the same commit that closes the Domains window, and arriving then
   * it stacked on a window that was still leaving (designer, 16.09.2026). The fallback timer is
   * for the case where no `animate` completion ever comes (reduced motion drops nothing here —
   * opacity still animates — but a future variant might).
   */
  const [canvasSettling, setCanvasSettling] = useState(false)
  const prevSurface = useRef(surface)
  /* Read DURING render, not from the effect below: the press that closes the window also asks
     for the panel in the same commit, and an effect-set flag would arrive one render late — the
     panel mounted at 2 % opacity for a beat, then left again (traced). The ref still holds the
     previous surface while this render runs; the effect moves it after the commit. */
  const surfaceJustLeft = prevSurface.current !== 'preview' && surface === 'preview'
  useEffect(() => {
    const was = prevSurface.current
    prevSurface.current = surface
    if (was !== 'preview' && surface === 'preview') {
      setCanvasSettling(true)
      const id = window.setTimeout(() => setCanvasSettling(false), 700)
      return () => window.clearTimeout(id)
    }
  }, [surface])
  const holdPanel = canvasSettling || surfaceJustLeft

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

  /*
   * WHICH address the chip prints is world truth, exactly like the Publish panel's field.
   * `customDomain` is what startConnect writes (state/world.ts, "WHICH domain is attached to
   * this project"), so a customer who connected `trulieve.com` now reads `trulieve.com` here
   * instead of the constant this used to print while the panel two clicks away said the real
   * name. CUSTOM_DOMAIN survives only as the fallback default, for a world carrying no name.
   *
   * The staging half reads the same STAGING_HOST the Publish panel reads, rather than keeping
   * a second copy of the free preview address: one literal for the whole app, so the chip can
   * never drift from the panel. The host itself is `remixer.ai` and lives in data/domains.ts.
   *
   * ⚠️ WHEN IT SWITCHES IS NOT A SECOND OPINION EITHER, AS OF TONIGHT (D5, 14.09.2026).
   * The test used to be spelled out here as live-or-multiple, and the panel's was written
   * separately one file away — so through the whole padlock beat the panel printed the
   * custom domain and this chip printed the staging one: two addresses on screen at once,
   * for the seconds the walk lasts. Both now ask `domainIsHome`, which is the
   * panel's own function. Swapping the branches here would be the same bug mirrored: the
   * domain DOES answer by this beat (a certificate cannot be issued before it does), it
   * simply is not secured yet — and the amber dot beside it is what says so.
   */
  const address = domainIsHome(world) ? world.customDomain || CUSTOM_DOMAIN : STAGING_HOST

  /** …and HOW that address is doing, in the Publish panel's tones. See DOMAIN_STATUS. */
  const status = domainStatus(world)

  /*
   * ONE ACTION, ONE VERB — "Publish changes", the same words the panel's own button
   * carries (Figma 28071:53189). This button said "Update" until the designer settled
   * it on 14.09.2026: pushing edits to visitors who already have the old version is one
   * action, and it was named differently in the topbar and in the panel that the topbar
   * opens. The audit's verb table allows either word; a product cannot afford both.
   *
   * The phrase only applies once the site is live — a site that has never been published
   * just says "Publish", and carries no pending-change count either, because the count
   * answers "how far behind is what people see", which has no answer yet.
   */
  const publishLabel =
    world.published && world.unpublished > 0
      ? { en: 'Publish changes', uk: 'Опублікувати зміни' }
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
        {/*
          * ⚠️ THE CANVAS TOOLBAR IS ABSENT UNTIL THERE IS A SITE (designer, 11.09.2026,
          * on the Build Plan board: "эти кнопки пока сайт не сгенерирован нам не нужны,
          * потому их нет в макете"). Figma 29816:21115 draws this screen with NO canvas
          * toolbar at all — the surface's own bar is the top of the canvas — and hides
          * the balance group in the chat's toolbar with it.
          *
          * The reasoning is the one the right rail already follows, one control further:
          * Visual Editor, the reload, the device toggle, the address and Publish all act
          * ON a site, and through the brief, the plan and the whole build there is none.
          * A control with nothing to do is better absent than dead — the same sentence
          * that greys out Publish, taken to its end. It arrives when the site does.
          */}
        {world.project === 'built' && (
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
            onClick={() => (status && status !== 'live'
              /* Every state the dot marks except a working address is reported BY the
                 Publish panel, in its own card with its own way out — in flight, waiting
                 on the first press (`ready`), or stuck. So the chip opens that panel, not
                 the domains window; there is no status page any more. A live address has
                 nothing left to report, so it goes back to the domains dashboard.

                 ⚠️ WHICH IS WHY THE DOOR FOLLOWS THE DOT AND IS NOT A SECOND TEST. A live
                 domain still owing a registrant confirmation used to read `live` here and
                 land the customer on the domains dashboard — a list of names, while the
                 one thing they can actually do about it (the card, its Resend, the letter
                 beside it) was in the panel they had just been sent away from. It reads
                 `working` now, so this same ternary routes it to the panel with every
                 other unfinished state. The fix lives in `domainStatus`, once. */
              ? togglePublish(true)
              : openDomains('home'))}
            title={status ? t(DOMAIN_STATUS[status].note) : undefined}
            className="mx-2 flex h-10 w-[280px] min-w-0 shrink items-center justify-between rounded-[10px] border border-[var(--white-200)] px-2 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]/[0.04]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid h-6 w-6 flex-none place-items-center text-[var(--white-400)]">
                <IconGrid size={22} />
              </span>
              {status && (
                <span className={`h-1.5 w-1.5 flex-none rounded-full ${DOMAIN_STATUS[status].dot}`} aria-hidden />
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
              * ⚠️ …AND IT IS BLUE ONLY WHILE THERE IS SOMETHING TO PUBLISH (designer,
              * 14.09.2026: "когда нет изменений для паблишинга, то кнопка серая… когда
              * есть изменения то синяя и есть индикатор"). A live site with nothing queued
              * used to carry the same blue as one with three edits waiting — the product's
              * colour for "this will do something", on a press that would do nothing. The
              * test is `canPublish`, the panel's own, so the two buttons cannot disagree.
              *
              * It still OPENS when it is grey, and only the empty project disables it: this
              * button is the door to the window that carries the address and the domain, and
              * the grey says "nothing pending", not "nothing here".
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
              /*
               * ⚠️ AND THE IDLE FACE IS GLASS, NOT A DIM PLATE — board 30289:56116, which
               * the designer measured for me (14.09.2026): fill `White/200`, a WHITE label,
               * and a rim that is a diagonal gradient, 12% → 4% → 8%. Not the greyed-out
               * pair the empty project wears: there is nothing wrong with a site that has
               * nothing queued, so the button rests rather than switching off. The greyed
               * pair still belongs to `project !== 'built'`, where the press genuinely
               * cannot work.
               */
              className={`h-9 rounded-[10px] px-4 text-[13px] font-semibold leading-[1.4] transition-colors duration-[var(--dur-fast)] ease-std ${
                world.project !== 'built'
                  ? 'cursor-not-allowed bg-[var(--white-100)] text-[#ffffff3d]'
                  : canPublish(world)
                    ? 'bg-[var(--action)] text-white hover:bg-[var(--action-hover)]'
                    : 'liquid-glass liquid-glass--publish glass-interactive text-white'
              }`}
            >
              {t(publishLabel)}
              {world.published && world.unpublished > 0 && (
                <span className="ml-1.5 tabular-nums opacity-70">{world.unpublished}</span>
              )}
            </button>
          </div>
        </header>
        )}

        {/* canvas — 8px gutter, the preview floats on the ground.
            While the agent works, the frame lights up with the Siri-style edge glow.

            The device switch resizes the STAGE, and the site inside re-lays-out
            because it answers container queries, not the browser width — the same
            thing Lovable gets for free from its preview iframe. Mobile is a real
            390px frame centred on the ground, not a scaled-down desktop. */}
        <main className="relative min-h-0 min-w-0 flex-1 pb-2 pl-2">
          {/*
            * ONE THING AT A TIME (designer, 16.09.2026, on the Connect press: the Domains window
            * vanished in one frame while the Publish panel was already springing in). `mode="wait"`:
            * whatever is on the canvas leaves first — a surface with its own `exit`, the site with a
            * plain fade — and only then does the next one come. While a surface is on its way out
            * and the site is fading back, `hold` keeps the Publish panel from arriving on top of it
            * (motion.ts `siteBack`). `initial={false}`: the first canvas of a session just stands.
            */}
          <AnimatePresence mode="wait" initial={false}>
          {(() => {
            /* The plan document takes the canvas the same way the domains dashboard
               does — a surface in place of the site, not a modal over it. There is no
               site to preview at this point in the flow, so nothing is being covered. */
            return surface === 'plan' ? (
              <motion.div key="plan" className="h-full" variants={surfaceWindow} initial="initial" animate="animate" exit="exit" onUpdate={keepOnMainThread}>
                <PlanSurface />
              </motion.div>
            ) : surface === 'domains' ? (
              /* the window leaves as ONE object — frame, bar and sheet — not sheet first, frame after */
              <motion.div key="domains" className="h-full" variants={surfaceWindow} initial="initial" animate="animate" exit="exit" onUpdate={keepOnMainThread}>
                <DomainsSurface />
              </motion.div>
            ) : (
              <motion.div
                key="site"
                className="flex h-full items-center justify-center"
                variants={siteBack}
                initial="initial"
                animate="animate"
                exit="exit"
                onUpdate={keepOnMainThread}
                /* the site is back on the ground: now the panel may come (see `hold`) */
                onAnimationComplete={(def) => { if (def === 'animate') setCanvasSettling(false) }}
              >
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
              </motion.div>
            )
          })()}
          </AnimatePresence>
          <PublishPanel hold={holdPanel} />
      {/* The design system's "are you sure?" — mounted ONCE, here, because its scrim covers
          the whole shell (board 30282:51628). Anything that needs it calls
          `useConfirm.getState().ask({…})`; see ui/ConfirmDialog.tsx. */}
      <ConfirmHost />
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

      {/* The simulated confirmation email — above the whole shell, over the chat and the
          rail, for the same structural reason the sheet above is here and not inside
          <main>. See SimulatedEmail for why the stand-in is a letter and not a button. */}
      <SimulatedEmail />

      {/* The hosting panel's cart — outside Remixer, so it covers the whole window
          rather than a surface inside the shell. Mounted last and above everything:
          when it is open, none of our chrome should show through the seam. */}
      <PanelCart />

      {/* The plan step's variant switch — an INSTRUMENT, so it parks in the screen's
          bottom-left corner as the console's handle parks in the bottom-right, and not inside
          the card it switches (designer, 21.09.2026). It shows itself only while that step is
          on screen. */}
      <PlanVariantSwitch />

      <ScenarioPanel />
    </div>
  )
}
