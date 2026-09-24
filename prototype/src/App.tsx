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
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode, type RefObject } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, usePresence, useReducedMotion, useTransform, type MotionStyle, type MotionValue } from 'motion/react'
import { useWorld, canUseAI, hasPlan, registrantUnconfirmed , type PaneMotion } from '@/state/world'
import { useUI, fromRect, MOBILE_WIDTH, MOBILE_HEIGHT, type Surface, type SurfaceFrom } from '@/state/ui'
import { CUSTOM_DOMAIN } from '@/data/domains'
import { ScenarioPanel } from '@/devtools/ScenarioPanel'
import { PlanVariantSwitch } from '@/modules/chat/PlanVariantSwitch'
/* `domainIsHome` rides along with the panel deliberately: it is the panel's own reading of
   WHICH ADDRESS THIS PRODUCT PRINTS, and the chip must not grow a second one. Since
   15.09.2026 that reading is "the domain is connected" — so the chip names the customer's
   own domain from `propagating` on, while its DOT keeps the truth about the domain not
   answering yet (`domainStatus` below, off `registrantUnconfirmed`). Two facts, two
   channels, one predicate each. */
import { PublishPanel, canPublish } from '@/modules/publish/PublishPanel'
import { ConfirmHost } from '@/ui/ConfirmDialog'
import { DomainsSurface } from '@/modules/domains/DomainsSurface'
import { CloudSurface } from '@/modules/cloud/CloudSurface'
import { AnalyticsSurface } from '@/modules/analytics/AnalyticsSurface'
import { PlanSurface } from '@/modules/chat/PlanSurface'
import { DomainModal } from '@/modules/domains/DomainModal'
import { PanelCart } from '@/modules/panel/PanelCart'
import { ChatPanel } from '@/modules/chat/ChatPanel'
import { SitePreview } from '@/modules/preview/SitePreview'
import { PageSwitcher } from '@/modules/preview/PageSwitcher'
import { SiriGlow } from '@/ui/SiriGlow'
import {
  SPRING, EXIT, popoverContent, canvasSite, canvasSiteFade, canvasSiteSheet,
  PANE_OPEN, PANE_CLOSE, PANE_CLOSE_MS, PANE_FRESH_MS, PANE_SETTLE, PANE_SETTLE_FROM, PANE_SETTLE_KEYS, PANE_SOLID,
  PANE_DISSOLVE, PANE_RIM_COOL, PANE_TINT_K, PANE_FADE_IN, PANE_FADE_OUT,
  SHEET_RISE_PCT, SHEET_SCALE_FROM, SHEET_OPEN, SHEET_CONDENSE, SHEET_DROP_PCT, SHEET_CLOSE, SHEET_CLOSE_DISSOLVE,
  SHEET_BACK_SCALE, SHEET_BACK_Y_PCT, SHEET_BACK_DIM, SHEET_BACK, SHEET_BACK_OUT,
  FOCUS_FROM, FOCUS_OPEN, FOCUS_SOLID, FOCUS_CLOSE, FOCUS_PASS_TO, FOCUS_PASS, FOCUS_BEHIND_FROM, FOCUS_ARRIVE, FOCUS_ARRIVE_SOLID,
} from '@/ui/motion'
import { ChatResizer } from '@/ui/ChatResizer'
import { useT } from '@/i18n'
import {
  LogoRemixer, IconHistory, IconSidebar, IconVisualEditor, IconReload, IconMonitor, IconPhone,
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


/**
 * THE RAIL'S FOUR BUTTONS — the designer's own state sheet, Figma 17471:40596, laid into
 * the shell by 30816:50043 ("Right Toolbar"): avatar row 56, gap 10, four 48s with gap 8,
 * bottom padding 24. Each button is 48 at radius 16 with a 24 glyph.
 *
 * Every button carries an accent, and the accent shows only when the button is SELECTED:
 * the tile fills with it at a tenth and the glyph takes it whole. Enabled is a bare white
 * glyph on nothing; hover is 8% white behind it. Off the sheet:
 *
 *   Style      tile rgba(80,185,123,.10)   ink #50b97b
 *   Extension  tile Blue/200 #2554f71f     ink Blue/1000 #1587ff  (our --action)
 *   Analytics  tile rgba(102,187,106,.10)  ink #66bb6a
 *   Cloud      tile rgba(149,117,205,.12)  ink #9575cd
 *
 * ⚠️ ANALYTICS IS GREEN, NOT THE AMBER THIS NOTE CARRIED UNTIL 24.09.2026. The designer sent
 * the button itself with the Analytics board — a green plate under a green glyph — and the
 * board paints the whole window in that same #66bb6a (the selected tab's ring and label, the
 * deltas, the chart). A module whose window is green cannot unfold from an amber button: the
 * pane's rim is lit in the rail's tone. The amber is kept in the session note as the reading
 * that was replaced, in case the state sheet was right and the screenshot was a one-off.
 *
 * ⚠️ Extension's two blues are NOT one colour: the tile is the kit's `Blue/200` (#2554f7
 * at 12%), the glyph is `Blue/1000 Dark Mode Blue` = #1587ff. Read with `get_variable_defs`
 * in the DARK theme, which prints both; the reference export collapses them into the light
 * theme's single rgba — the same trap this project has paid for on every board it has read.
 *
 * ⚠️ Only Analytics and Cloud have a window to open today, so only those two can take the
 * selected state. A button that lights up and shows nothing would be a lie; Style and
 * Integrations keep their accents here, ready for the day their surfaces exist.
 */
const RAIL = [
  { id: 'style', label: 'Website Styles', Icon: IconStyle, tile: 'rgba(80,185,123,0.1)', ink: '#50b97b', goes: null },
  { id: 'integrations', label: 'Integrations', Icon: IconExtension, tile: '#2554f71f', ink: 'var(--action)', goes: null },
  { id: 'analytics', label: 'Analytics', Icon: IconAnalytics, tile: 'rgba(102,187,106,0.1)', ink: '#66bb6a', goes: 'analytics' },
  { id: 'cloud', label: 'Cloud', Icon: IconCloud, tile: 'rgba(149,117,205,0.12)', ink: '#9575cd', goes: 'cloud' },
  // Domains and Email still have no home in the rail. That gap is the audit's headline.
] as const

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

const PANE_R = 16
/** What a pane measures once, at mount: its start clip (the trigger's footprint) in its own pixels. */
type PaneGeom =
  | { kind: 'px'; t: number; r: number; b: number; l: number; w: number; h: number; origin: { x: number; y: number } }
  | { kind: 'pct' }
const canvasBox = (main: HTMLElement | null) => {
  if (!main) return null
  const r = main.getBoundingClientRect()
  const cs = getComputedStyle(main)
  const [pt, pr, pb, pl] = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(parseFloat)
  return { x: r.x + pl, y: r.y + pt, w: r.width - pl - pr, h: r.height - pt - pb }
}
const px = (n: number) => `${Math.round(n * 10) / 10}px`
function paneGeometry(from: SurfaceFrom | null, main: HTMLElement | null): PaneGeom {
  const box = canvasBox(main)
  /* no press behind this surface (a scenario, a link), or a canvas that is still opening (the plan's
     `Review` opens the preview and the surface in one commit): grow from the middle, in percentages
     at BOTH ends, since the pane's final pixels are not known yet */
  if (!from || !box || box.w < 200 || box.h < 200) return { kind: 'pct' }
  return {
    kind: 'px',
    t: from.y - box.y,
    l: from.x - box.x,
    r: box.x + box.w - (from.x + from.w),
    b: box.y + box.h - (from.y + from.h),
    w: box.w,
    h: box.h,
    origin: { x: from.x + from.w / 2 - box.x, y: from.y + from.h / 2 - box.y },
  }
}
/** The clip at progress v — 0 is the trigger's footprint, 1 the whole canvas. Same units at both ends. */
const clipAt = (g: PaneGeom, v: number) =>
  g.kind === 'px'
    ? `inset(${px(g.t * (1 - v))} ${px(g.r * (1 - v))} ${px(g.b * (1 - v))} ${px(g.l * (1 - v))} round ${PANE_R}px)`
    : `inset(${(12 * (1 - v)).toFixed(3)}% ${(12 * (1 - v)).toFixed(3)}% ${(12 * (1 - v)).toFixed(3)}% ${(12 * (1 - v)).toFixed(3)}% round ${PANE_R}px)`

/**
 * The pane's motion, offered to the surface inside it: `settle` is the contents' one breath as the frame
 * lands (motion.ts `PANE_SETTLE`). A surface wraps what is INSIDE its frame in a `motion.div` with
 * `style={{ scale: settle }}` (`data-pane-settle`) — the frame itself must not breathe, or a gap would
 * open between the moving rim and the window's own border.
 */
const PaneMotionContext = createContext<{ settle: MotionValue<number> } | null>(null)
export function usePaneSettle(): MotionValue<number> | null {
  return useContext(PaneMotionContext)?.settle ?? null
}

type RGB = [number, number, number]
const mixRgb = (a: RGB, b: RGB, t: number) => `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * t)).join(' ')})`
/** The element's layout position inside `host`, transforms ignored — the offset chain, not the rect: at
 *  mount the menu card is already parked 10px left by its cascade and the contents stand at 1.03. */
const restWithin = (host: HTMLElement, el: HTMLElement) => {
  let x = 0, y = 0
  let n: HTMLElement | null = el
  while (n && n !== host) {
    const parent = n.offsetParent as HTMLElement | null
    x += n.offsetLeft + (parent && parent !== host ? parent.clientLeft : 0)
    y += n.offsetTop + (parent && parent !== host ? parent.clientTop : 0)
    n = parent
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

/**
 * THE RIM THAT RIDES THE CLIP — the moving edge is a real edge (the dock bubble's lesson, «бордер
 * глючит»: a clip opens a picture through a window, and the frame on the window does not move). Four 1×1
 * lines scaled along their length (so they stay 1px thick) and four r16 corner arcs, placed each frame at
 * the clip's edge from the same progress `p`; lit in the module's tone while the glass moves (`glow` 1),
 * cooling to nothing once it has landed, where the window's own hairline shows through. Transform only.
 * Everything beyond the pane's box is cut by its `overflow: hidden` — the rim comes out from under the
 * rail with the pane.
 */
function PaneRim({ p, glow, geom, tone }: { p: MotionValue<number>; glow: MotionValue<number>; geom: Extract<PaneGeom, { kind: 'px' }>; tone?: string }) {
  const parts = useRef<(HTMLElement | SVGSVGElement | null)[]>([])
  const paint = (v: number) => {
    const x0 = geom.l * (1 - v), y0 = geom.t * (1 - v)
    const x1 = geom.w - geom.r * (1 - v), y1 = geom.h - geom.b * (1 - v)
    const R = PANE_R
    const w = Math.max(0, x1 - x0 - 2 * R), h = Math.max(0, y1 - y0 - 2 * R)
    const [top, bottom, left, right, tl, tr, br, bl] = parts.current
    if (!top || !bottom || !left || !right || !tl || !tr || !br || !bl) return
    top.style.transform = `translate(${x0 + R}px, ${y0}px) scaleX(${w})`
    bottom.style.transform = `translate(${x0 + R}px, ${y1 - 1}px) scaleX(${w})`
    left.style.transform = `translate(${x0}px, ${y0 + R}px) scaleY(${h})`
    right.style.transform = `translate(${x1 - 1}px, ${y0 + R}px) scaleY(${h})`
    tl.style.transform = `translate(${x0}px, ${y0}px)`
    tr.style.transform = `translate(${x1 - R}px, ${y0}px) rotate(90deg)`
    br.style.transform = `translate(${x1 - R}px, ${y1 - R}px) rotate(180deg)`
    bl.style.transform = `translate(${x0}px, ${y1 - R}px) rotate(270deg)`
  }
  useMotionValueEvent(p, 'change', paint)
  useLayoutEffect(() => { paint(p.get()) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (i: number) => (el: HTMLElement | SVGSVGElement | null) => { parts.current[i] = el }
  const arc = (i: number) => (
    <svg key={i} ref={set(i)} className="pane-rim-corner" viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      <path d="M16 .5A15.5 15.5 0 0 0 .5 16" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
  return (
    <motion.span className="pane-rim" data-pane-rim style={{ opacity: glow, ...tint(tone) } as MotionStyle} aria-hidden>
      <i ref={set(0)} className="pane-rim-line" />
      <i ref={set(1)} className="pane-rim-line" />
      <i ref={set(2)} className="pane-rim-line" />
      <i ref={set(3)} className="pane-rim-line" />
      {[4, 5, 6, 7].map(arc)}
    </motion.span>
  )
}

/**
 * THE MARK THAT FLIES WITH THE EDGE — the window's own mark (the Cloud window's cloud) travels from the
 * rail button's glyph to its seat in the menu header, riding just inside the leading corner of the clip:
 * its position and its colour are both functions of the pane's progress `p`, so on the fold it flies
 * back for free. The real mark is hidden while the pane carries `data-pane-flying`. The seat is measured
 * by layout (`restWithin`), not by rect: at mount the menu card is parked 10px left by its cascade and
 * the contents stand at 1.03, and a rect would have measured both.
 */
function PaneFlyer({ p, geom, to, from, into, children }: {
  p: MotionValue<number>; geom: Extract<PaneGeom, { kind: 'px' }>
  to: string; from: RGB; into: RGB; children: ReactNode
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [seat, setSeat] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  /* The pane is found from the flyer's OWN node, never through the pane's ref: on a mount, a child's
     layout effect runs before its ancestors' refs are attached, so a ref to the pane would still be null
     here in production. Dev hid that — StrictMode runs layout effects twice and the second pass saw
     the ref — so the flyer flew on 5174 and never on the built file (caught by check:brief, 23.09). */
  const hostOf = (el: HTMLElement | null) => el?.closest<HTMLElement>('[data-canvas-pane]') ?? null
  useLayoutEffect(() => {
    const host = hostOf(ref.current)
    const target = host?.querySelector<HTMLElement>(to)
    if (host && target) setSeat(restWithin(host, target))
  }, [to])
  const paint = (v: number) => {
    const el = ref.current, host = hostOf(el)
    if (!el || !host || !seat) return
    const k = Math.max(0, Math.min(1, v))
    const dx = (geom.origin.x - (seat.x + seat.w / 2)) * (1 - k)
    const dy = (geom.origin.y - (seat.y + seat.h / 2)) * (1 - k)
    el.style.transform = `translate(${dx}px, ${dy}px)`
    el.style.color = mixRgb(from, into, k)
    host.toggleAttribute('data-pane-flying', v < 0.999)
  }
  useMotionValueEvent(p, 'change', paint)
  useLayoutEffect(() => { paint(p.get()) }, [seat]) // eslint-disable-line react-hooks/exhaustive-deps
  /* Rendered from the first frame (the seat is measured from it), hidden by CSS until the pane says
     `data-pane-flying` — which `paint` sets in the same commit the seat lands in, before paint. */
  return (
    <span ref={ref} className="pane-flyer" data-pane-flyer aria-hidden style={seat ? { left: seat.x, top: seat.y, width: seat.w, height: seat.h } : undefined}>
      {children}
    </span>
  )
}

/**
 * A SURFACE'S PANE ON THE CANVAS — the box a surface (Domains, Plan, Cloud) stands in, unfolding from
 * the control that opened it and folding back into it (motion.ts `PANE_OPEN` and the polish note above
 * it have the law). It measures ONCE, at mount: the trigger's viewport box (`ui.surfaceFrom`) against
 * the canvas's content box, into a clip in the pane's own pixels plus a transform origin at the
 * trigger's centre. That copy is what the exit reads too — so a pane folds back to the button it came
 * from, whatever has been pressed since.
 *
 * One progress value `p` drives the clip, the rim and the flyer; opacity, the exit's hair of scale and
 * the contents' settle are their own values. All of it is animated imperatively on motion values —
 * main-thread, so nothing hands an element back at a pre-animation value for a frame — and the pane
 * calls `safeToRemove` itself once the fold is done.
 *
 * `data-pane-fresh` marks the first 1.1 s: the window's contents cascade in under it (index.css «THE
 * PANE THAT UNFOLDS»); when it goes, every animation it gated has already finished, so nothing snaps.
 * `tone` lights the rim and the glint in the module's colour (the Cloud window's violet) — at half the
 * white lights' ink (`PANE_TINT_K`, designer 24.09.2026: «раза в 2 прозрачнее»); the default is white at
 * full. `flyer` is the mark that travels from the button to its seat (`to` — a selector inside the pane).
 */
const PANE_FLYER_FROM: RGB = [149, 117, 205]
/** The pane's lights in the module's tone — and at HALF the ink of the white ones (`PANE_TINT_K`): the
 *  designer found the violet edge too loud mid-unfold (24.09.2026). No tone → no overrides, white at 1. */
const tint = (tone?: string) => (tone ? { '--glint-rgb': tone, '--glint-k': PANE_TINT_K } : {})
/**
 * THREE MOTIONS, ONE PANE (designer, 24.09.2026, with a recording of the unfold — «сделай еще 2 других
 * варианта… с другой задумкой абсолютно и концепцией», the switch in the console). The pane keeps its
 * one job — to be the box a surface stands in — and wears whichever motion the world says
 * (`world.paneMotion`, motion.ts § TWO MORE WAYS A WINDOW CAN ARRIVE):
 *   · `unfold` — the clip-morph from the button, the lit rim, the flying mark (everything above);
 *   · `sheet`  — rises from below as one sheet of glass (`y` in % of its own height, so the travel is
 *                the same share of any canvas), growing .97 → 1 from its bottom edge, condensing in the
 *                first 160 ms; the site behind steps back like the card behind an iOS sheet;
 *   · `focus`  — focuses into place from .94 with no travel and no bounce.
 * The rim and the flyer belong to the unfold alone — they ride a clip edge, and the other two move the
 * window as one object, whose own hairline is the edge. The glint lands with all three.
 * ✅ Since 25.09.2026 the SHEET is the default and the house motion for these windows (the designer's
 * pick: «сделать анимацию Sheet по умолчанию, а переключатель можно оставить… анимация наша фирменная в
 * дизайн системе для переключения вот таких больших окон»); every window that stands in this pane —
 * Cloud, Analytics, Domains from either door, the plan review — wears it without being asked.
 *
 * `handoff` is the parent's word on whether this pane is one end of a SWITCH between two windows (read
 * in render, so it is right in the first frame — the same trick as `leavingTile`). A sheet leaving into
 * another sheet steps back instead of dropping; a focused window leaving into another passes forward
 * instead of defocusing, and the arriving one comes from behind with a beat's delay. The motion is read
 * LIVE at each end, not captured at mount: the designer flips the console with a window open and wants
 * the very next close to answer in the new language.
 */
function CanvasPane({ id, tone, canvas, flyer, motion: motionRef, handoff, children }: {
  id: string; tone?: string; canvas: RefObject<HTMLElement>
  flyer?: { node: ReactNode; to: string; from?: RGB; into: RGB }
  /** which motion the world wears right now — a ref, so a pane already on screen leaves in the CURRENT one */
  motion: RefObject<PaneMotion>
  /** true while the shell is swapping one window for another (set in App's render) */
  handoff: RefObject<boolean>
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  const [present, safeToRemove] = usePresence()
  const presentRef = useRef(true)
  presentRef.current = present
  const [geom] = useState<PaneGeom>(() => paneGeometry(useUI.getState().surfaceFrom, canvas.current))
  /* the motion this pane ARRIVED in — the rim, the flyer and the clip exist only for the unfold; with
     nothing said, the house motion (the sheet) */
  const [arrivedAs] = useState<PaneMotion>(() => motionRef.current ?? 'sheet')
  const unfold = arrivedAs === 'unfold'
  const p = useMotionValue(reduce || !unfold ? 1 : 0)
  const opacity = useMotionValue(0)
  const scale = useMotionValue(1)
  const y = useMotionValue('0%')
  const settle = useMotionValue(reduce || !unfold ? 1 : PANE_SETTLE_FROM)
  const glow = useMotionValue(reduce || !unfold ? 0 : 1)
  const clipPath = useTransform(p, (v) => clipAt(geom, v))
  const [fresh, setFresh] = useState(true)
  /* a focused window passing the viewer on a switch is IN FRONT of the one arriving behind it */
  const [inFront, setInFront] = useState(false)
  const [ctx] = useState(() => ({ settle }))

  /* the arrival */
  useEffect(() => {
    if (reduce) {
      animate(opacity, 1, PANE_FADE_IN)
    } else if (arrivedAs === 'unfold') {
      const clip = animate(p, 1, PANE_OPEN)
      animate(opacity, 1, PANE_SOLID)
      animate(settle, PANE_SETTLE_KEYS, PANE_SETTLE)
      /* the rim cools once the pane has landed — not on a fold that interrupted the unfold (a stopped
         animation resolves its promise too) */
      clip.then(() => { if (presentRef.current && p.get() > 0.99) animate(glow, 0, PANE_RIM_COOL) })
    } else if (arrivedAs === 'sheet') {
      y.set(`${SHEET_RISE_PCT}%`)
      scale.set(SHEET_SCALE_FROM)
      animate(y, '0%', SHEET_OPEN)
      animate(scale, 1, SHEET_OPEN)
      animate(opacity, 1, SHEET_CONDENSE)
    } else {
      /* arriving in a switch: from behind, a beat after the old window has started forward */
      const behind = !!handoff.current
      scale.set(behind ? FOCUS_BEHIND_FROM : FOCUS_FROM)
      animate(scale, 1, behind ? FOCUS_ARRIVE : FOCUS_OPEN)
      animate(opacity, 1, behind ? FOCUS_ARRIVE_SOLID : FOCUS_SOLID)
    }
    const id = window.setTimeout(() => setFresh(false), PANE_FRESH_MS)
    return () => window.clearTimeout(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* the leaving — in whatever motion the world wears NOW; then the pane removes itself */
  useEffect(() => {
    if (present) return
    const mode = motionRef.current ?? 'sheet'
    const switching = !!handoff.current
    /* motion's controls are thenable, not Promises — adopt them so the chain below types */
    const done = (a: { then: (r: VoidFunction) => unknown }) => new Promise<void>((r) => a.then(() => r()))
    let runs: Promise<void>[]
    if (reduce) {
      runs = [done(animate(opacity, 0, PANE_FADE_OUT))]
    } else if (mode === 'unfold' && unfold) {
      /* back into the button, dissolving only once small */
      glow.set(1)
      runs = [done(animate(p, 0, PANE_CLOSE)), done(animate(scale, 0.98, PANE_CLOSE)), done(animate(opacity, 0, PANE_DISSOLVE))]
    } else if (mode === 'sheet') {
      runs = switching
        ? [
            /* step back behind the sheet rising over it; go only once it is covered */
            done(animate(scale, SHEET_BACK_SCALE, SHEET_BACK)),
            done(animate(y, `${SHEET_BACK_Y_PCT}%`, SHEET_BACK)),
            done(animate(opacity, SHEET_BACK_DIM, SHEET_BACK)).then(() => done(animate(opacity, 0, SHEET_BACK_OUT))),
          ]
        : [done(animate(y, `${SHEET_DROP_PCT}%`, SHEET_CLOSE)), done(animate(scale, SHEET_SCALE_FROM, SHEET_CLOSE)), done(animate(opacity, 0, SHEET_CLOSE_DISSOLVE))]
    } else if (mode === 'focus') {
      if (switching) setInFront(true)
      runs = switching
        ? [done(animate(scale, FOCUS_PASS_TO, FOCUS_PASS)), done(animate(opacity, 0, FOCUS_PASS))]
        : [done(animate(scale, FOCUS_FROM, FOCUS_CLOSE)), done(animate(opacity, 0, FOCUS_CLOSE))]
    } else {
      /* a window that arrived as a sheet or in focus, asked to leave as an unfold: it has no clip to fold,
         so it defocuses — the nearest of the three to a fold without a button to fold into */
      runs = [done(animate(scale, FOCUS_FROM, FOCUS_CLOSE)), done(animate(opacity, 0, FOCUS_CLOSE))]
    }
    Promise.all(runs).then(() => safeToRemove())
  }, [present]) // eslint-disable-line react-hooks/exhaustive-deps

  const origin = unfold
    ? geom.kind === 'px' ? `${px(geom.origin.x)} ${px(geom.origin.y)}` : '50% 50%'
    : arrivedAs === 'sheet' ? '50% 100%' : '50% 50%'
  return (
    <PaneMotionContext.Provider value={ctx}>
      <motion.div
        data-canvas-pane={id}
        data-pane-motion={arrivedAs}
        data-pane-fresh={fresh ? '' : undefined}
        className="absolute bottom-2 left-2 right-0 top-0 z-10 overflow-hidden rounded-[16px]"
        /* promoted for its lifetime: the clip is written every frame of the unfold, and a layer of its
           own is what keeps that a compositor update, not a repaint of the window */
        style={{ clipPath, opacity, scale, y, transformOrigin: origin, willChange: 'clip-path, transform, opacity', zIndex: inFront ? 11 : undefined }}
      >
        {children}
        {unfold && geom.kind === 'px' && <PaneRim p={p} glow={glow} geom={geom} tone={tone} />}
        {unfold && geom.kind === 'px' && flyer && (
          <PaneFlyer p={p} geom={geom} to={flyer.to} from={flyer.from ?? PANE_FLYER_FROM} into={flyer.into}>
            {flyer.node}
          </PaneFlyer>
        )}
        <span className="glass-glint" style={tone ? (tint(tone) as CSSProperties) : undefined} aria-hidden />
      </motion.div>
    </PaneMotionContext.Provider>
  )
}

/**
 * THE ACCENT FLOODS THE TILE FROM THE POINT OF THE CLICK (designer, 23.09.2026: «после клика меняется
 * цвет в этих кнопках, чтобы другой цвет как-то прикольно заливался от места клика»). A rail button's
 * selected state — the tinted tile and the tinted glyph — used to arrive as a 120 ms colour transition.
 * Now an overlay in the selected colours, holding its own copy of the glyph, is clipped to a circle that
 * grows from where the pointer landed (`--fx/--fy`) until it covers the tile (radius 72 > the far corner
 * of a 48 box); the tile and the glyph under it stay in their resting colours until the circle has
 * covered them, then the button takes the selected paint itself and the overlay goes — same colours, so
 * the hand-over is invisible. A second layer of the same tint fades out on top (`::after`): the tile
 * flares to twice its tint at the click and settles — the button emitting the window it opens. Closing
 * by the button drains the colour back into the point of the click; closing by ✕ or Esc has no point,
 * and the tile stays lit for the fold and fades (`closingTile`). Keyboard activation floods from the
 * centre. CSS: index.css «THE ACCENT FLOODS THE TILE».
 */
const RAIL_FILL_MS = 460
const RAIL_HOLD_MS = 160
type RailFill = { id: string; x: number; y: number; dir: 'in' | 'out'; phase: 'run' | 'hold'; key: number }
export default function App() {
  const { world } = useWorld()
  const { surface, openSurface, closeSurface, togglePublish, reloading, triggerReload, device, setDevice, chatWidth, goHome, previewOpen, setPreviewOpen, boot } = useUI()

  /*
   * A SURFACE IS LEAVING THE CANVAS. From the moment `surface` goes back to the preview until
   * the site has come forward again (`canvasSite` complete), the Publish panel is held: on the Connect
   * press it is asked for in the same commit that closes the Domains window, and arriving then
   * it stacked on a window that was still leaving (designer, 16.09.2026). The fallback timer is
   * for the case where no `animate` completion ever comes (reduced motion drops nothing here —
   * opacity still animates — but a future variant might).
   */
  const [canvasSettling, setCanvasSettling] = useState(false)
  const prevSurface = useRef(surface)
  const canvasRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  /* Read DURING render, not from the effect below: the press that closes the window also asks
     for the panel in the same commit, and an effect-set flag would arrive one render late — the
     panel mounted at 2 % opacity for a beat, then left again (traced). The ref still holds the
     previous surface while this render runs; the effect moves it after the commit. */
  const surfaceJustLeft = prevSurface.current !== 'preview' && surface === 'preview'
  /*
   * THE TILE STAYS LIT UNTIL THE PANE IS BACK IN IT. A leaving pane folds into its rail button
   * over 360 ms (motion.ts `PANE_CLOSE`); the button's selected tile, keyed to `surface` alone,
   * went dark in the first 150 ms of that — the window was folding into a button that had already
   * let go of it. `closingTile` keeps the tile lit for the fold, whichever way the window was
   * closed (the button, ✕, Esc), and lets go once the pane has landed. `aria-pressed` still tells
   * the truth about the state; only the paint lingers.
   */
  const [closingTile, setClosingTile] = useState<Surface | null>(null)
  const [railFill, setRailFill] = useState<RailFill | null>(null)
  const railFillTimers = useRef<number[]>([])
  const floodTile = (id: string, e: ReactMouseEvent<HTMLElement>, dir: 'in' | 'out') => {
    const r = e.currentTarget.getBoundingClientRect()
    const byPointer = e.detail !== 0
    const fill: RailFill = { id, dir, phase: 'run', key: Date.now(), x: byPointer ? e.clientX - r.left : r.width / 2, y: byPointer ? e.clientY - r.top : r.height / 2 }
    railFillTimers.current.forEach((t) => window.clearTimeout(t))
    setRailFill(fill)
    if (dir === 'in') {
      /* the button takes the selected paint while the overlay still covers it, then the overlay goes */
      railFillTimers.current = [
        window.setTimeout(() => setRailFill((f) => (f && f.key === fill.key ? { ...f, phase: 'hold' } : f)), RAIL_FILL_MS),
        window.setTimeout(() => setRailFill((f) => (f && f.key === fill.key ? null : f)), RAIL_FILL_MS + RAIL_HOLD_MS),
      ]
    } else {
      railFillTimers.current = [window.setTimeout(() => setRailFill((f) => (f && f.key === fill.key ? null : f)), PANE_CLOSE_MS + 60)]
    }
  }
  useEffect(() => {
    const was = prevSurface.current
    prevSurface.current = surface
    if (was !== 'preview' && surface === 'preview') {
      setCanvasSettling(true)
      setClosingTile(was)
      const id = window.setTimeout(() => setCanvasSettling(false), 700)
      const tile = window.setTimeout(() => setClosingTile(null), PANE_CLOSE_MS + 20)
      return () => { window.clearTimeout(id); window.clearTimeout(tile) }
    }
    setClosingTile(null)
  }, [surface])
  const holdPanel = canvasSettling || surfaceJustLeft
  /*
   * THE WINDOWS' MOTION, AND WHETHER THIS IS A SWITCH. Both go to the panes as refs written in RENDER,
   * for the same reason `leavingTile` is computed here: the pane that is leaving reads them in the
   * effect that runs after THIS commit, and the pane that is arriving reads them at its mount — both
   * see the frame's truth, not last frame's. `handoff` is true only while one window is replacing
   * another (Cloud → Analytics): a sheet then steps back instead of dropping, a focused window passes
   * forward instead of defocusing, and the arriving one comes from behind.
   */
  const paneMotionRef = useRef<PaneMotion>(world.paneMotion)
  paneMotionRef.current = world.paneMotion
  const handoffRef = useRef(false)
  handoffRef.current = prevSurface.current !== 'preview' && surface !== 'preview' && prevSurface.current !== surface
  /* ⚠️ THE FIRST FRAME OF THE FOLD IS PAINTED BEFORE THAT EFFECT RUNS. `closingTile` is set after the
     commit that turned `surface` to 'preview', so the render that starts the fold saw `on` false and
     `closingTile` null — one frame with the tile unlit, a 120 ms colour transition started towards dark
     and pulled back by the next render: the tile dipped .12 → .08 → .12 at the top of every close
     (caught by the suite's sampler 23.09.2026, `firstUnlit` at 18 ms). The ref still holds the surface
     that is leaving while this render runs (`surfaceJustLeft` reads it the same way), so the leaving
     tile is known in render, and the effect's `closingTile` only carries it on for the rest of the fold. */
  const leavingTile: Surface | null = prevSurface.current !== 'preview' && surface === 'preview' ? prevSurface.current : null

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

          {/* centre: the PAGE SWITCHER, in the board's 280 × 40 project-button box (Figma
              25819:143144). It replaced the address chip on 25.09.2026 (designer, with a recording
              of Lovable's route picker: «вместо этой кнопки мы по классике хотим туда вставить
              переключатель страниц сайта»): the pill reads the page the preview stands on, the
              menu under it lists the plan's pages with a search field, and the preview follows.
              The address, its status and the door to the Domains window live in the Publish panel,
              which was already the one place the connection is read (13.09.2026). */}
          <PageSwitcher />

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
        <main ref={canvasRef} className="relative min-h-0 min-w-0 flex-1 pb-2 pl-2">
          {/*
            * THE PANE UNFOLDS FROM ITS BUTTON, THE SITE RECEDES UNDER IT (designer, 22.09.2026 —
            * motion.ts `canvasPane` / `canvasSite` has the law and the live product's numbers). Both
            * stand in the canvas box as `absolute` layers, the pane above: an arriving pane comes
            * forward over the site while the site steps back into the dark; a leaving pane folds back
            * into its button while the site, one layer down, comes forward. `mode="sync"` (the default)
            * so the two overlap in time — the clip keeps them from ever overlapping in paint. While a
            * surface is on its way out and the site is coming forward, `hold` keeps the Publish panel
            * from arriving on top of it. `initial={false}`: the first canvas of a session just stands.
            */}
          <AnimatePresence initial={false}>
          {(() => {
            /* The plan document takes the canvas the same way the domains dashboard
               does — a surface in place of the site, not a modal over it. There is no
               site to preview at this point in the flow, so nothing is being covered. */
            return surface === 'plan' ? (
              <CanvasPane key="plan" id="plan" canvas={canvasRef} motion={paneMotionRef} handoff={handoffRef}>
                <PlanSurface />
              </CanvasPane>
            ) : surface === 'cloud' ? (
              /* lit by the button that opened it: the rail's Cloud accent (#9575cd) on the rim */
              <CanvasPane
                key="cloud"
                id="cloud"
                tone="149 117 205"
                canvas={canvasRef}
                motion={paneMotionRef}
                handoff={handoffRef}
                /* the window's cloud flies from the rail glyph (#9575cd) to its seat in the menu header (#7e57c2) */
                flyer={{ node: <IconCloud size={25} />, to: '[data-cloud-mark]', into: [126, 87, 194] }}
              >
                <CloudSurface />
              </CanvasPane>
            ) : surface === 'analytics' ? (
              /* lit by the button that opened it: the rail's Analytics accent (#66bb6a) on the rim */
              <CanvasPane
                key="analytics"
                id="analytics"
                tone="102 187 106"
                canvas={canvasRef}
                motion={paneMotionRef}
                handoff={handoffRef}
                /* the chart plate flies from the rail glyph (#66bb6a) to its seat in the top bar (white) */
                flyer={{ node: <IconAnalytics size={24} />, to: '[data-analytics-mark]', from: [102, 187, 106], into: [255, 255, 255] }}
              >
                <AnalyticsSurface />
              </CanvasPane>
            ) : surface === 'domains' ? (
              /* the window leaves as ONE object — frame, bar and sheet — not sheet first, frame after */
              <CanvasPane key="domains" id="domains" canvas={canvasRef} motion={paneMotionRef} handoff={handoffRef}>
                <DomainsSurface />
              </CanvasPane>
            ) : (
              <motion.div
                key="site"
                data-canvas-site
                className="absolute bottom-2 left-2 right-0 top-0 z-0 flex items-center justify-center"
                /* under an arriving SHEET the site steps back like the card behind an iOS sheet —
                   smaller and a few px UP, the other way from the sheet (motion.ts `canvasSiteSheet`) */
                variants={reduce ? canvasSiteFade : world.paneMotion === 'sheet' ? canvasSiteSheet : canvasSite}
                initial="initial"
                animate="animate"
                exit="exit"
                onUpdate={keepOnMainThread}
                /* a layer of its own, so the recession is a compositor transform and not a repaint
                   of the whole site on every frame */
                style={{ willChange: 'transform, opacity' }}
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
        {/* Avatar row 56 (30816:50043) — four taller than the 52 top bar, on purpose: the
            board sets the rail's own rhythm, 56 then a gap of 10 down to the buttons. The
            ring is the one thing the board carries inside the avatar's own image, which
            the proxy will not hand over; drawn here as the gradient it reads as. */}
        <div className="grid h-14 place-items-center">
          <span className="arrive-rail-item grid h-9 w-9 place-items-center rounded-full" style={{ background: 'linear-gradient(200deg,#9575cd,#1587ff)' }}>
            <button
              aria-label={t({ en: 'Account', uk: 'Акаунт' })}
              className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#e0a94a] to-[#a3651f] text-[12px] font-semibold text-white"
            >
              R
            </button>
          </span>
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
              {RAIL.map(({ id, label, Icon, tile, ink, goes }, i) => {
                const on = goes != null && surface === goes
                const fill = railFill && railFill.id === id ? railFill : null
                /* painted as selected while its pane is still folding back into it — unless the accent is
                   still flooding in (the overlay paints) or draining out (the base is already resting).
                   While a flood is on, the button's own paint SNAPS (no colour transition) and wears no
                   hover wash: any second coat under or over the overlay's 12 % would brighten the tile
                   for the frames they overlap — traced as a step at the hand-over. */
                const lit = (on || (goes != null && (closingTile === goes || leavingTile === goes))) && !(fill && !(fill.dir === 'in' && fill.phase === 'hold'))
                const paint = fill ? '' : ' transition-colors duration-[var(--dur-fast)] ease-std'
                const hover = lit || fill ? '' : ' text-white hover:bg-[var(--white-100)]'
                return (
                  <motion.button
                    key={id}
                    title={label}
                    aria-label={label}
                    aria-pressed={on}
                    /* the pane unfolds from THIS box (`surfaceFrom`), and folds back into it; the accent
                       floods the tile from the point of the click, and drains back into it */
                    onClick={(e) => {
                      if (!goes) return
                      floodTile(id, e, on ? 'out' : 'in')
                      if (on) closeSurface()
                      else openSurface(goes, fromRect(e.currentTarget))
                    }}
                    /* One after the other from the top, 70ms apart: the rail fills in the
                       direction it is read. Only transform and opacity, so the stagger
                       costs the compositor and nothing else. */
                    initial={{ opacity: 0, scale: 0.82, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ ...SPRING, delay: 0.12 + i * 0.07 }}
                    className={`press-bloom grid h-12 w-12 place-items-center rounded-[16px]${paint}${hover}${lit || fill ? '' : ''}`}
                    style={lit ? { background: tile, color: ink } : fill ? { color: '#fff' } : undefined}
                  >
                    <Icon size={24} />
                    {fill && (
                      <span
                        key={fill.key}
                        className="rail-fill"
                        data-rail-fill={fill.dir === 'in' && fill.phase === 'hold' ? 'hold' : fill.dir}
                        aria-hidden
                        style={{ '--fx': `${fill.x}px`, '--fy': `${fill.y}px`, '--fill': tile, color: ink } as CSSProperties}
                      >
                        <Icon size={24} />
                      </span>
                    )}
                  </motion.button>
                )
              })}
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
