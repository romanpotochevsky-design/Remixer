/**
 * The publish panel — pixel source: Figma node 29697:36970 (480×466), which supersedes
 * the 2026 redesign frame 25819:144061 (548 wide) it grew out of.
 *
 * Card: gray-850, radius 20, hairline border, deep drop shadow, anchored under the
 * Publish button. Header 64px. Body: an inset card (white-4%, radius 16) holding — for a
 * site that has never gone live — the nudge banner, then the website-URL field and the
 * "Buy or connect a domain" dashed card. Button bar bottom-right.
 *
 * THREE THINGS DEPEND ON WHETHER THE SITE IS PUBLISHED (`world.published`, designer
 * 08.09.2026):
 *  · THE TITLE. An unpublished site's panel is titled by its STATUS — "Not published" —
 *    rather than by the action. Once it is live the title is the action again, "Publish".
 *  · THE NUDGE. A 120px banner, "Ready to put your site live?", purely informational:
 *    it argues for publishing and can be waved off with its own ✕ (`ui.publishHintOpen`).
 *    It is gone for good once the site is live — there is nothing left to nudge.
 *  · THE MARKER beside the free address (14.09.2026). Neither of the two above is a
 *    RESULT — a title changing one word and a banner leaving are both things the panel
 *    stops doing — so on a site with no custom domain the headline verb had no visible
 *    outcome at all and read as a broken button. The marker is the outcome, and it is
 *    the small honest one: the green Live pill and the padlock stay the property of a
 *    working custom domain. See UrlField.
 * None of the three hangs off `unpublished`: see the field's own note in state/world.ts.
 *
 * ⚠️ The board writes the title as "Not Publisher", which is not English — the site is
 * not published. Shipped as "Not published", the same call this project made for the
 * template panel's "Add Promt" (CLAUDE.md). Flagged to the designer, not silently kept.
 *
 * The Figma frame draws the base case; the connecting/live cases keep the Launchpad
 * logic from the handoff (⑥-A) re-dressed in the same visual language, so every world
 * state still renders. The subtitle under "Buy or connect a domain" is the one line
 * that changes with entitlement: on trial it names the plan and its price, on a paid
 * account it says what the plan covers — publishing on a custom domain, never the name
 * itself, which is a purchase on every plan (see the card).
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useWorld, hasPlan, isCustomDomainActive, isCustomDomainConnected, registrantUnconfirmed, type World } from '@/state/world'
import { useUI, fromRect } from '@/state/ui'
import { useT } from '@/i18n'
import { STAGING_HOST } from '@/data/domains'
import { IconPlus, IconClose, IconCopy, IconUnlink, IconCheck, IconVisitors, IconChevronDown } from '@/ui/icons'
import { connectProgress, retryConnect } from '@/modules/domains/connect'
import { domainRowStatus } from '@/modules/domains/status'
import { Tooltip } from '@/ui/Tooltip'
import { Chip } from '@/ui/Chip'
import { useShimmerPhase } from '@/ui/shimmer'
import { peekPendingConnect } from '@/modules/panel/PanelCart'
import { useConfirm } from '@/ui/ConfirmDialog'
import { HOST_GLIDE, panelIn, panelInBody, panelInBodyFade, panelInFade, swapText, verbRoll, verbRollFade } from '@/ui/motion'
import { Reveal } from '@/ui/Reveal'

/*
 * The free address, split at its FIRST dot: the name is white, the host behind it grey.
 * Derived, never written out — this line used to be `STAGING_HOST.replace('.remixer.site',
 * '')` against a literal `.remixer.site` suffix below it, so the day the host became
 * `remixer.ai` (five first-party sources) the field would have printed the whole host and
 * then the old suffix after it: "fit-ration.remixer.ai.remixer.site".
 */
const STAGING_DOT = STAGING_HOST.indexOf('.')
const STAGING_NAME = STAGING_DOT > 0 ? STAGING_HOST.slice(0, STAGING_DOT) : STAGING_HOST
const STAGING_SUFFIX = STAGING_DOT > 0 ? STAGING_HOST.slice(STAGING_DOT) : ''

/**
 * How long "Resend" stays spent before it can be pressed again.
 *
 * ⚠️ INVENTED — no board draws a second state for this button, and it had none: it was
 * wired to `() => undefined`. A confirmation mail that can be fired ten times in ten
 * seconds is a support ticket, so the button spends itself, says so, and comes back. The
 * real cooldown would be a minute; compressed here like every other wait in the prototype,
 * so the designer can watch it return instead of timing it.
 */
const RESEND_COOLDOWN_MS = 9000

/**
 * THE FIVE SECONDS (designer, 16.09.2026, boards 30425:28847): while the address is spreading,
 * the in-flight card's explanation stands open for this long, and the letter card below is
 * held back — «пока описание для Propagating раскрыто эти 5 секунд, мы не показываем One last
 * step, чтобы не создавать каши на экране из текста». Then the explanation folds, and after
 * the fold the letter unfolds: two motions in sequence, not one pile.
 */
const PROPAGATING_READ_MS = 5000
/** The fold (Reveal's REVEAL_CLOSE, a .62 s spring whose travel is done by ~250 ms and whose
 *  overshoot peaks at ~330) is given this long before the letter arrives: the letter rises out of
 *  the bounce's return, not on top of the fold's travel (was 260 for the flat .3 s edge). */
const LETTER_AFTER_FOLD_MS = 360

/**
 * "1 unpublished change", not "1 changes" — the button bar's own line (Figma 28071:53189,
 * which writes the singular correctly at n=1).
 *
 * ⚠️ UKRAINIAN HAS THREE FORMS and the middle one is the trap: 1 неопублікована зміна ·
 * 2–4 неопубліковані зміни · 5+ неопублікованих змін, with the teens taking the last
 * however they end (11 is `змін`, not `зміна`) — and the ADJECTIVE moves with the noun,
 * so the three forms are three pairs, not one word with three endings.
 *
 * ⚠️ THIS IS NOW THE SAME SENTENCE AS `edits` IN state/scenarios.ts, not merely the same
 * rule. It was the same rule before, and the comment here argued that two copies of a
 * rule were tolerable because the two sentences differed — a description in the console
 * against a button label. The board has made them identical, so that argument is spent:
 * the pair wants one home, in a shared module, and the console's copy is the one that
 * should move (a product string cannot import from devtools). Raised, not done — this
 * file is the only one this commit may touch.
 *
 * The label it replaced read `Update · N changes` / `Оновити · змін: N`, which dodged
 * agreement by making the Ukrainian noun a genitive heading rather than a counted thing.
 * That is not wrong Ukrainian — it is a different sentence from the English beside it,
 * and the English one said "1 changes", at the count this panel shows most often.
 */
const changeCount = (n: number) => {
  const ones = n % 10
  const tens = n % 100
  const uk =
    ones === 1 && tens !== 11
      ? 'неопублікована зміна'
      : ones >= 2 && ones <= 4 && (tens < 12 || tens > 14)
        ? 'неопубліковані зміни'
        : 'неопублікованих змін'
  return { en: `${n} unpublished ${n === 1 ? 'change' : 'changes'}`, uk: `${n} ${uk}` }
}

/**
 * PUBLISHING HAS TO LAND — the two clocks that make it land.
 *
 * `PUBLISH_SETTLE_MS` is how long the footer button refuses to be a dismiss button after
 * a publish. The gate found that a double-press published AND closed the panel, so the
 * one moment the whole panel exists for was thrown away by the second half of a gesture
 * people make constantly on a button that has just changed under their finger. For this
 * beat the button states the result instead — "Published" — and only then offers the way
 * out. It is not a dead button: it is a button that answers before it moves on.
 *
 * `PUBLISH_FRESH_MS` is how long "just now" stays true. After it, the marker beside the
 * address keeps the fact and drops the timing rather than ageing into a lie — the world
 * persists `published` to localStorage and cannot say WHEN, so "just now" is knowable
 * only inside the session that pressed the button.
 */
const PUBLISH_SETTLE_MS = 1800
const PUBLISH_FRESH_MS = 60000
/**
 * PUBLISHING TAKES A MOMENT, AND THE BUTTON SHOWS IT (designer, 16.09.2026, with a frame of the
 * button: «когда ты нажимаешь на паблиш, то он не мгновенно происходит, нужно в кнопку вставить
 * спинер и пусть у текста будет градиент… пусть оно несколько секунд красиво крутит эту анимацию
 * в кнопке при публикации»). The press starts this clock; the site goes out when it ends. Two
 * and a bit seconds: long enough to read as work being done, short enough not to read as a hang.
 * While it runs the button is blue and cannot be pressed again, a white arc turns at its left
 * and the word wears the white sweep (index.css `.busy-ink` — his frame's 56 → 100 → 56 % is one
 * frame of it). Then `PUBLISH_SETTLE_MS` takes over: the button says what happened.
 */
const PUBLISHING_MS = 2400


/**
 * IS THE CUSTOM DOMAIN THE ADDRESS WE PRINT? — the one reading, for the whole shell.
 *
 * The designer's rule, 14.09.2026: «мы убираем первый домен и вместо него вставляем
 * кастомный, только тогда, когда кастомный домен уже привязан» — swap when the name is
 * ATTACHED.
 *
 * ⚠️ AND ATTACHED MEANS CONNECTED, NOT ANSWERING (designer, 15.09.2026, at a panel whose
 * amber card said "It's bought and set up" over a field still reading fit-ration.remixer.ai:
 * «когда происходит пропагейтинг, кастомный домен уже по факту подключен, а это значит что
 * отображается в этом окне уже кастомный домен!»). Same rule of his, applied where he
 * actually draws the line — so this is now simply `isCustomDomainConnected`, and the field
 * carries the customer's own name from `propagating` on.
 *
 * WHAT CARRIES THE TRUTH INSTEAD, because the name genuinely does not open yet: the amber
 * card directly beneath it, whose sentence is exactly that («the address starts working
 * once you confirm your email»), and the absence of any green. The field answers "what is
 * my address"; the card answers "why can nobody open it yet". Printing the free address
 * there answered the second question in the first question's slot, and contradicted the
 * card sitting under it — which is the thing he spotted.
 *
 * ⚠️ The copy button therefore hands over a link that will not open until the letter is
 * confirmed. That is a real cost and it is accepted with the card on screen in every state
 * that can produce it (`registrantUnconfirmed` is what puts it there), never silently.
 *
 * The paragraphs below are the history of the OLD reading. They are kept because each one
 * refutes a plausible way of putting the free address back — and none of them is an
 * argument about which address to PRINT once the domain is connected, which is what this
 * predicate now decides.
 *
 * Exported because the topbar chip prints an address too (App.tsx), off this same
 * function. The two used to derive it separately and disagreed for the length of a state,
 * which is the same failure as the second link the designer struck out of this panel
 * (13.09.2026: "у нас будет только одна ссылка отображаться в этом окне"). One reading,
 * both readers — do not re-derive it at either end.
 *
 * ⚠️ THIS OVERRIDES D5, and D5's argument is written out here so that nobody restores it
 * by finding it convincing. D5 handed the field over at `verifying && published`, on the
 * grounds that a certificate cannot be issued until the name already resolves — so by
 * that beat the domain DOES answer, and printing the free address would be a lie. That
 * optimised the wrong thing. The field answers the question the customer actually asks:
 * WHERE IS MY SITE, WHAT LINK CAN I GIVE SOMEONE. Until the domain is done, the honest
 * answer to that is the free address — the one that certainly works — not the one that
 * happens to resolve for us, this minute, from here.
 *
 * ⚠️ AND AN UNCONFIRMED REGISTRANT EMAIL IS NOT A CLOCK BESIDE THE DOMAIN — IT IS THE
 * DOMAIN NOT WORKING. A DreamHost developer, asked directly (14.09.2026): connecting is
 * possible, publishing is probably possible, but «вебсайт поідеї не буде працювати якщо
 * запаблішити» — and, on "so you can publish, but without confirming the email the link
 * will not work", «так». So the name does not resolve at all until the mail is confirmed.
 *
 * That refutes the intuition this file held for one draft — that a fresh registration
 * resolves immediately and is only suspended once a deadline passes. It came from a
 * search summariser (the session proxy blocks help.dreamhost.com); a developer on the
 * product beats it. `world.icann` therefore belongs in THIS predicate: a domain whose
 * address cannot be opened is not an address we hand anybody, so the field keeps the free
 * one, which is the only one that works.
 *
 * ⚠️ AND IT DOES NOT BLOCK PUBLISHING — the same answer says publishing goes through. The
 * consequence is only that the site is out on the free address and the custom name does
 * not answer yet, which is exactly what the field and its marker then say.
 */
export const domainIsHome = (w: World) => isCustomDomainConnected(w)

/**
 * IS THE CONNECTION FINISHED AND QUIET? — the other half of what `domainIsHome` used to
 * be, and the reason it had to be split (designer, 15.09.2026).
 *
 * One predicate was answering two questions: WHICH ADDRESS DO WE PRINT, and IS ANYTHING
 * OUTSTANDING. They parted company the moment the custom name went into the field while
 * the letter was still owed, so they are two functions now. This one is the old reading,
 * unchanged: the domain answers and nothing is outstanding. It puts the quiet card under
 * the field and decides the "connected, never published" situation — neither of which may
 * appear over a domain that does not open yet.
 */
export const domainSettled = (w: World) =>
  (w.domain === 'live' || w.domain === 'multiple') && !w.icann

/**
 * IS THERE ANYTHING TO PUBLISH RIGHT NOW? — read by this panel's footer button AND by the
 * topbar's (App.tsx), because they are the same press and must not disagree.
 *
 * ⚠️ The topbar's used to be blue whenever a site existed, so a live site with nothing
 * pending still invited the press (designer, 14.09.2026: "когда нет изменений для
 * паблишинга, то кнопка серая… когда есть изменения то синяя и есть индикатор"). Blue is
 * this product's colour for an action that will do something; there it did nothing.
 *
 * Three ways there IS something:
 *  · the site has never been published — the whole site is the pending thing, which is why
 *    a freshly generated page still offers a live blue Publish;
 *  · edits are queued on a site that is already out there;
 *  · `ready` — the domain is set up and the site has never stood on it.
 * And one way there is not, even with all of the above: `old-site`, where publishing is
 * precisely what failed and the recovery lives inside the card.
 */
export const canPublish = (w: World) =>
  w.domain !== 'old-site' && (w.domain === 'ready' || w.unpublished > 0 || !w.published)

/**
 * A hostname never breaks mid-word.
 *
 * `fit-ration.remixer.ai` was wrapping as `fit-` / `ration.remixer.ai`: a hyphen is a
 * break opportunity to every browser, and half an address reads as a different address.
 * (The brand faces are absent — Figtree stands in for Proxima Nova and runs wider — so
 * these cards wrap a word earlier here than they will in the product. That is a reason
 * the break SHOWS, not the reason it is wrong: it would be wrong at any width.)
 *
 * Done here rather than inside the strings so every card gets it — six of the seven print
 * a domain — and so the copy stays the plain sentence the deliverable quotes.
 */
const HOSTISH = /([A-Za-z0-9][A-Za-z0-9-]*(?:\.[A-Za-z0-9][A-Za-z0-9-]*)*\.[A-Za-z]{2,})/
const keepHostsWhole = (text: string, ink?: string) =>
  /* split() with one capture group hands back [text, host, text, host, …] — the odd
     slots are the matches, and only those get the nowrap — and, when a card asks for it,
     the ink that marks the name as what the card is ABOUT (see StatusCard's `subject`). */
  text.split(HOSTISH).map((part, i) =>
    i % 2
      ? <span key={i} className="whitespace-nowrap" style={ink ? { color: ink } : undefined}>{part}</span>
      : part,
  )

/**
 * …and a card title never ends on a one-word line. `{domain} still has an older website
 * on it` was leaving "it" alone under two full lines; binding the last word to the one
 * before it moves the pair down together. Titles only: they are the sentence-sized,
 * semibold line where a widow is loud, and the 13px subs below are prose.
 */
const bindWidow = (s: string) => s.replace(/\s+(\S+)$/, ' $1')

/**
 * The inset URL field.
 *
 * Three faces, and which one is on says what link the customer can give somebody:
 *  · `bare` — the free address, before anybody has pressed Publish. An address and
 *    nothing beside it, because nothing has happened to it yet.
 *  · `published` — the free address, with the quiet marker that the site is out on it.
 *    This is the face the WHOLE connection walk wears — registering, on its way,
 *    connecting, padlock switching on, and a registered name whose email is still
 *    unconfirmed — because through all of it the free address is the one that opens the
 *    site. See the marker itself below for why it is not green, and `domainIsHome` for
 *    why the custom name waits.
 *  · `live` — the custom domain under the green pill. One state reaches it: the domain
 *    opens the site and nothing is outstanding against it. The pill replaces the trailing
 *    button rather than joining it, and the board draws it in that slot.
 *
 * ⚠️ THERE IS NO PENCIL (demo-readiness gate, 14.09.2026). The free address used to
 * carry an "Edit address" button — hover fill, aria-label, and no handler — and it was
 * the ONLY trailing control in the panel's opening frame, which is to say the one thing
 * a person reaches for while the presenter is saying "this is your address". It is
 * REMOVED rather than wired: there is no design for what editing the free address would
 * mean (rename the subdomain? against what taken-name check? with what effect on a link
 * already shared?), and answering those questions in code at night is how a prototype
 * starts teaching a product that does not exist. Do not put a pencil back without the
 * screens behind it.
 *
 * ⚠️ THE GREEN PILL AND THE ADDRESS ARE ONE DECISION, NOT TWO (14.09.2026). The field
 * shows the custom domain only where that domain actually opens the site, and that is
 * the only thing green claims — so the pill cannot end up beside something that
 * contradicts it. It did, twice, by being a second decision: over `verifying` it said
 * Live above a card saying the padlock was still switching on, and over a registered
 * domain whose email was unconfirmed it said Live a hundred pixels above "Confirm your
 * email to keep this domain" — the designer, on that one: "почему пишется что Live если
 * Confirm your email to keep this domain". The second case is not even a shade of
 * meaning: a developer on the product confirmed the name does not resolve at all until
 * the mail is confirmed (see `domainIsHome`), so Live was simply false there.
 * One link, one status — this window's standing rule — and the amber card is the status.
 */
/**
 * The address, and the one thing anybody wants to do with an address: copy it.
 *
 * ⚠️ THE TRAILING SLOT IS A COPY BUTTON, NOT A STATUS PILL (designer, 14.09.2026: "в поле
 * где домен отображается, справа не будет Live. там будет кнопка/иконка скопировать
 * домен"). It carried a green `Live` pill on the custom domain and a grey `Published` one
 * on the free address — two paints saying what the line under the field now says in words,
 * in the slot where the field's only ACTION belongs. The status moved down; the action
 * moved in.
 *
 * The clipboard can be refused (a sandboxed frame, a denied permission), so the press has
 * a second answer rather than a silent failure — the same two-outcome shape the scenario
 * console's "Copy link to this state" already uses.
 */
function UrlField({ value, suffix }: { value: string; suffix?: string }) {
  const { t } = useT()
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)
  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(null), 1600)
    return () => window.clearTimeout(id)
  }, [copied])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value + (suffix ?? ''))
      setCopied('ok')
    } catch { setCopied('fail') }
  }
  return (
    /* Board 30282:53241: a 48-tall field with a `White/200` rim at radius 12 and NO fill —
       the card's own 4% white is the surface. pl 16 / pr 8, the address at 15px. */
    <div className="flex h-12 items-center justify-between rounded-[12px] py-1 pl-4 pr-2 shadow-[inset_0_0_0_1px_var(--white-200)]">
      <p className="min-w-0 truncate text-[15px]">
        {/* The address changing under a label that stays (the free name → the custom one at
            `propagating`): the old one leaves, then the new one comes up — the panel's
            hand-off (motion.ts `swapText`), never two addresses printed over each other. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={value + (suffix ?? '')} variants={swapText} initial="initial" animate="animate" exit="exit">
            <span className="text-[var(--white-900)]">{value}</span>
            {suffix && <span className="text-[var(--white-500)]">{suffix}</span>}
          </motion.span>
        </AnimatePresence>
      </p>
      {/* The board's Icon button: a 32 box around a 24 glyph, radius 8, no label. The
          answer to a press is the glyph itself — a tick when the clipboard took it, the
          copy mark again a beat later. A word beside it would widen the box the board
          draws, and this control has one job. */}
      <button
        onClick={copy}
        title={copied === 'fail'
          ? t({ en: 'Copy it by hand', uk: 'Скопіюйте вручну' })
          : copied
            ? t({ en: 'Copied', uk: 'Скопійовано' })
            : t({ en: 'Copy the address', uk: 'Скопіювати адресу' })}
        aria-label={t({ en: 'Copy the address', uk: 'Скопіювати адресу' })}
        className={`press-bloom grid h-8 w-8 flex-none place-items-center rounded-[8px] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] ${
          copied === 'ok' ? 'text-[var(--live)]' : copied === 'fail' ? 'text-[var(--attention)]' : 'text-[var(--white-500)] hover:text-white'
        }`}
      >
        {copied === 'ok' ? <IconCheck size={24} /> : <IconCopy size={24} />}
      </button>
    </div>
  )
}

/**
 * THE IN-FLIGHT CARD — board 30282:54233, the connecting state, pixel for pixel.
 *
 * A different animal from `StatusCard`: no tone, no dot, no button. A 12px card in
 * `Neutral Alpha/100` (8% white in the dark theme, fill AND rim), a title row of
 * `pl 16 / pr 12 / py 16` with a 24px icon and a 15px semibold line, and under it a second
 * rounded box with its own `#49494c` rim carrying the explanation at 13px / 64% white.
 *
 * ⚠️ AND IT SITS ABOVE THE ADDRESS FIELD, not under it — the board's own order. While a
 * domain is in flight the news is the domain; once it is carrying the site the address is
 * the news and its card (with `Unlink`) goes below. Both are the same board's arrangement,
 * a fortnight apart in the customer's life.
 *
 * ⚠️ The icon is OURS: the board's vector is unreachable (the proxy refuses every
 * figma.com asset URL), so this is the spinning arc the generation card already uses for
 * a step that is working — one idiom for "this is moving on its own".
 */
/** The stages the one in-flight card can be in — see ProgressCard. */
type ProgressVariant = 'provisioning' | 'connecting' | 'propagating' | 'ready'

/** The explanation's words handing over inside the box — old ones gone in 120 ms, new ones up
 *  after them (sequential, the dock's lesson). `popLayout` keeps the incoming paragraph IN the
 *  flow from its first frame, so the box's height goes straight to its new value once and the
 *  Reveal around it glides there — no dip through an empty box between the two. */
const subSwap = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, delay: 0.12, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
}

/**
 * THE HEADLINE THAT ROLLS ITS VERB. «Connecting fit-ration.net» → «Propagating fit-ration.net»:
 * the designer, 16.09.2026, on a recording of the walk — «когда меняются текст типа этого
 * "Connecting fit-ration.net" оно происходит без какого-то аккуратного плавного перехода,
 * выглядит просто как блимание в 1 кадр» — and, from a stand of four ways to hand the words
 * over (scratchpad/swap/stand.html), his pick: «вариант B · меняется только глагол, имя стоит».
 *
 * The title is split at the host (`HOSTISH`, the same regex `keepHostsWhole` uses) into
 * segments; the host keeps ONE key across stages, so under `AnimatePresence` it is never
 * re-created — it GLIDES to wherever the new verb leaves it (`layout="position"`, `HOST_GLIDE`).
 * Each verb is keyed by its words: the old one rolls up and out while the new one rolls up into
 * place (`verbRoll`). `popLayout` takes the leaving verb out of the flow the moment it leaves,
 * so the host's glide and the new verb's arrival start together and the line never holds two
 * verbs' widths. Works for both word orders — «Propagating {host}» and «{host} is connected».
 *
 * ⚠️ The spans paint their OWN shimmer, placed against the line by arithmetic (`.shimmer-seg`,
 * index.css THE HEADLINE THAT ROLLS ITS VERB): `background-clip: text` on the line cannot reach
 * the glyphs of a span that is being transformed. The line writes `--line-w` from its layout
 * width and each span's `--seg-x` from its offsetLeft — LAYOUT values (offsetLeft, clientWidth),
 * not bounding rects: the panel is born at scale(.94), and a rect read through that transform
 * would place the band 6 % short (the Reveal's own lesson). Re-measured when the title changes
 * and whenever the line's box does.
 */
/** See RollingTitle: the presence of an `onUpdate` prop is what keeps an element's animations
 *  on the main thread in motion 11 — the callback itself has nothing to do. */
const keepOnMainThread = () => {}

function RollingTitle({ title, done, phase }: { title: string; done: boolean; phase: CSSProperties }) {
  const reduce = useReducedMotion()
  const line = useRef<HTMLParagraphElement>(null)
  /* split() with one capture group hands back [text, host, text, host, …]: the odd slots are
     hosts. Empty ends (a title that starts or ends on the host) are dropped, and the word
     spaces stay inside the verb segments — `white-space: pre` keeps them. */
  const segments = title.split(HOSTISH).map((text, i) => ({ text, host: i % 2 === 1 })).filter((seg) => seg.text.length > 0)
  useLayoutEffect(() => {
    const el = line.current
    if (!el) return
    const measure = () => {
      el.style.setProperty('--line-w', `${el.clientWidth}px`)
      for (const seg of el.querySelectorAll<HTMLElement>('.shimmer-seg')) seg.style.setProperty('--seg-x', `${seg.offsetLeft}px`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [title])
  return (
    /* `relative` in both states: popLayout parks the leaving verb absolutely, against this box.
       The sweep (`shimmer-line`) runs only while the walk moves; the finished headline is the
       same spans at rest, plain white (index.css). */
    <p ref={line} className={`relative min-w-0 break-words text-[15px] font-semibold leading-[1.2]${done ? '' : ' shimmer-line'}`} style={done ? undefined : phase}>
      <AnimatePresence mode="popLayout" initial={false}>
        {segments.map((seg) => seg.host ? (
          <motion.span key="host" layout="position" transition={HOST_GLIDE} className="shimmer-seg">{seg.text}</motion.span>
        ) : (
          /* ⚠️ `onUpdate` is a no-op ON PURPOSE: it is the one prop that keeps motion 11 off WAAPI
             for this element (AcceleratedAnimation.supports). A composited fade hands the span
             back at its pre-animation inline opacity for the beat between the animation's
             `finish` and motion's next render — the leaving verb at 1, the arriving one at 0
             (both read on the live build, scratchpad/swap/live/) — and that beat is exactly
             the one-frame blink this component exists to remove. On the main thread the
             inline value is written every frame and the last frame IS the final value. */
          <motion.span key={`verb:${seg.text}`} variants={reduce ? verbRollFade : verbRoll} initial="initial" animate="animate" exit="exit" onUpdate={keepOnMainThread} className="shimmer-seg">{seg.text}</motion.span>
        ))}
      </AnimatePresence>
    </p>
  )
}

function ProgressCard({ variant, title, sub, done, percent, collapsible, open = true, onToggle }: {
  variant: ProgressVariant
  title: string
  sub: string
  done?: boolean
  /** How far the beat has come, 0–100 — drawn beside the title (board 30425:28847, `27%`). */
  percent?: number | null
  /** Can the explanation fold? Only the spreading beat is drawn with the chevron. */
  collapsible?: boolean
  /** Is the explanation open (only read when `collapsible`)? */
  open?: boolean
  onToggle?: () => void
}) {
  const { t } = useT()
  /*
   * WHILE IT MOVES, THE HEADLINE SHIMMERS AND THE ARC FOLLOWS ITS HUE (designer,
   * 16.09.2026, on this very card: «вставляем градиентную плашку в текст, там где идут
   * какие то процессы/спинеры/загрузки» and «спинер синхронно с текстом тоже менял плавно
   * и красиво цвет»). The row is the shimmer's scope — it carries the hue clock — the
   * headline carries the sweep over white ink, and the arc's stroke is the SATURATED twin of
   * that inherited hue (`--sh-arc`, the same clock — designer, later the same day: «конкретно
   * в спинере цвета более яркие и насыщенные», the text's pastels untouched), so the two
   * cannot show different colours, only two strengths of one. ⚠️ This supersedes the arc's
   * fixed `--action` blue of 14.09.2026 («я хочу чтобы цвет в спинере был синий вот такой
   * 1587FF»): the arc still STARTS on blue (#5077fe), then drifts with the text.
   * The finished card (green tick) shimmers nothing: nothing is moving.
   */
  const phase = useShimmerPhase()
  const subOpen = !collapsible || open
  return (
    /* While it moves, the card's own wash carries the flash too — board 30425:27467, a
       brighter band crossing the whole card in the headline's sweep window (`.shimmer-card`
       in index.css). The band is a child, not a pseudo: the card must stay overflow-visible
       for the explanation box's one-pixel pull onto its stroke. `relative` for the band's
       stacking context whichever way `done` is. The 6px of air around the card belong to the
       Reveal that unfolds it (`pad`), not to this box. */
    <div className={`relative rounded-[12px] border border-[var(--white-100)] bg-[var(--white-100)]${done ? '' : ' shimmer-card'}`} style={done ? undefined : phase}>
      {!done && <span className="shimmer-card-band" aria-hidden />}
      {/*
       * THE ROW — board 30425:28847: icon 24, then the title with the beat's percent on its
       * baseline (`pr 4` before the button), then the fold button 32 — `pl 16 / pr 12`, and
       * `py 12` around the 32 button, which is the same 56 the plain row keeps with `py 16`
       * around its 24 icon, so the row's height does not move when the chevron comes and goes.
       *
       * ⚠️ ONE CARD, ITS WORDS CHANGING — NOT FOUR CARDS TAKING TURNS (designer, 16.09.2026,
       * from a recording of the walk: «внутри формы появляются и исчезают объекты, и высота
       * формы резко меняется»). The card is ONE element for the whole walk — wash, rim, band —
       * and only the words inside change: in the headline only the VERB hands over, rolling,
       * while the host glides and the arc stays (`RollingTitle`; the designer's variant B of
       * 16.09.2026, replacing the row-wide sequential fade that read as a one-frame blink);
       * the explanation's paragraph hands over sequentially (`subSwap`). The row's height is
       * constant, so the only height that moves is the explanation box's, and the Reveal
       * around it glides there (see below).
       */}
      <div className={`flex items-center gap-3 pl-4 pr-3 ${collapsible ? 'py-3' : 'py-4'}${done ? '' : ' shimmer-hue'}`} style={done ? undefined : phase}>
        {/*
         * THE ICON — the same spinning arc through EVERY stage of the walk (its node is never
         * replaced, so it never blinks — the recording's blink was this arc fading out and in
         * with the words), and a crossfade to the tick only when the walk is done.
         * ⚠️ THE SAME CARD ENDS THE WALK (board 30289:59972): when the domain is set up and only
         * a press is left, the arc becomes a filled green tick. One shape for "this is moving"
         * and "this is done" — the icon is the whole difference, which is what makes the finish
         * read as the end of the thing that was moving.
         */}
        <span className="relative h-6 w-6 flex-none" aria-hidden>
          <AnimatePresence initial={false}>
            {done ? (
              <motion.span key="tick" className="absolute inset-0 flex" variants={swapText} initial="initial" animate="animate" exit="exit" onUpdate={keepOnMainThread}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  {/* A filled green disc with a WHITE tick, as the board draws it — the ink
                      the eye reads as "done" everywhere else in the product. */}
                  <circle cx="12" cy="12" r="11" fill="var(--live)" />
                  <path d="m7.4 12.3 3.1 3.1 6.1-6.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.span>
            ) : (
              <motion.span key="arc" className="absolute inset-0 flex" variants={swapText} initial="initial" animate="animate" exit="exit" onUpdate={keepOnMainThread}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8" stroke="var(--white-200)" strokeWidth="1.8" />
                  <path
                    d="M12 4a8 8 0 0 1 8 8"
                    /* ⚠️ THE MOVING ARC WAS `--action` #1587FF (designer, 14.09.2026: "я хочу
                       чтобы цвет в спинере был синий вот такой 1587FF"), then the shimmer's own
                       pastel hue (16.09) — and since the same evening the SATURATED twin of that
                       hue, `--sh-arc` (index.css): «конкретно в спинере цвета более яркие и
                       насыщенные — A66FFF 5077FE FF8363». Same clock as the headline's hue, so
                       arc and text are one colour in two strengths. The ring behind it stays
                       neutral so the arc is the only thing the eye follows. */
                    stroke="var(--sh-arc)" strokeWidth="1.8" strokeLinecap="round"
                    className="step-spin"
                  />
                </svg>
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 pr-1">
          <RollingTitle title={title} done={!!done} phase={phase} />
          {/* the beat's share — a NUMBER, so Gilroy (the house rule), 13 at 48 % white, on the
              title's baseline. Live it ticks with the walk's own clock; a staged world shows the
              board's figure. It fades up when the spreading beat begins — no pop. */}
          <AnimatePresence initial={false}>
            {percent !== undefined && percent !== null && (
              <motion.span key="pct" variants={swapText} initial="initial" animate="animate" exit="exit" className="font-display flex-none text-[13px] leading-none tabular-nums text-[var(--white-480)]">{percent}%</motion.span>
            )}
          </AnimatePresence>
        </div>
        {/*
         * THE FOLD BUTTON (board 30425:28847: 32 × 32, r10, 24 %-white rim, chevron 20 in a
         * 24 box, turned 180° while the explanation is open). ⚠️ The board draws it with
         * `backdrop-blur 16`; behind it is the card's own flat wash, so the blur would blur
         * nothing — omitted on the standing rule (look at what is behind you before you
         * blur). It takes the house press bloom; the chevron turns on `transform` only.
         */}
        {collapsible && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={subOpen}
            aria-label={subOpen
              ? t({ en: 'Hide the details', uk: 'Сховати подробиці' })
              : t({ en: 'Show the details', uk: 'Показати подробиці' })}
            className="press-bloom grid h-8 w-8 flex-none place-items-center rounded-[10px] border border-[#ffffff3d] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
          >
            <IconChevronDown
              size={20}
              className={`transition-transform duration-[var(--dur-base)] ease-std${subOpen ? ' rotate-180' : ''}`}
            />
          </button>
        )}
      </div>
      {/*
       * THE EXPLANATION — and, on the spreading beat, the thing that FOLDS (designer,
       * 16.09.2026: «через 5 секунд мы красиво и плавно с анимацией скрываем описание (его
       * можно сворачивать, разворачивать, по макету видно)»). A Reveal of its own inside the
       * card: the box's edge is a spring, the box rides in a beat behind it with the glint
       * every forming surface wears, and the Reveal around the WHOLE card is told to follow
       * this one frame by frame (`follow="instant"` where the card is mounted) — two springs
       * on one edge would chase each other. The 1px pull onto the card's stroke (`-mx-px
       * -mb-px`, board 30289:60956: a Figma stroke sits inside the geometry, so the box's rim
       * and the card's are ONE line) sits on the clip, so the clip does not cut it off.
       */}
      <Reveal show={subOpen} className="-mx-px -mb-px" radius={12}>
        <div className="relative rounded-[12px] border border-[#49494c] px-4 pb-[18px] pt-[19px]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p key={variant} variants={subSwap} initial="initial" animate="animate" exit="exit" className="text-[13px] leading-[1.4] text-[#ffffffa3]">
              {keepHostsWhole(sub)}
            </motion.p>
          </AnimatePresence>
        </div>
      </Reveal>
    </div>
  )
}

function StatusCard({
  tone, title, sub, action, subject,
}: {
  tone: 'amber' | 'red' | 'blue'
  title: string
  sub: string
  action?: { label: string; onClick?: () => void; primary?: boolean; disabled?: boolean }
  /**
   * THE NAME IN THE TITLE IS THE SUBJECT OF THE NOTICE — ink it in the card's own colour
   * (designer, 14.09.2026: «нам нужно просто в этом уведомлении добавить кастомный домен
   * куда-то стильно и красиво, чтобы было понятно для какого домена это уведомление»).
   *
   * Opt-in, and only one card asks for it: the one whose domain is NOT in the field above
   * it, so a reader has nothing else on screen to tie the notice to. The others name a
   * domain the field is already showing, or one their own sentence is plainly about, and
   * a colour there would be decoration.
   *
   * ⚠️ AND IT IS NOT A SECOND ADDRESS. The obvious move — a pill or a boxed row under the
   * title — would put a second address-shaped thing 60px under the address field, in a
   * window whose standing rule is one link (13.09.2026). This is the same run of title
   * text, in the same weight, wearing the same colour as the dot and rim that already say
   * which card you are reading: the subject of a sentence, not a field.
   */
  subject?: boolean
}) {
  const skin = {
    amber: { fill: '#e5c3591a', rim: '#e5c35959', dot: 'var(--attention)' },
    red: { fill: '#ef44441a', rim: '#ef444459', dot: 'var(--danger)' },
    blue: { fill: '#1587ff1a', rim: '#1587ff59', dot: 'var(--action)' },
  }[tone]
  return (
    <div
      /* No top margin of its own: the 19px under the field (8 under another card) belongs to
         the Reveal that unfolds this card, so the air arrives and leaves with it. */
      className="flex items-center gap-3 rounded-[12px] px-4 py-3.5"
      style={{ background: skin.fill, boxShadow: `inset 0 0 0 1px ${skin.rim}` }}
    >
      <span
        className="mt-[7px] h-2 w-2 flex-none self-start rounded-full"
        style={{ background: skin.dot }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        {/* Hostnames stay whole and the title keeps its last two words together —
            see keepHostsWhole / bindWidow above. */}
        <p className="break-words text-[15px] font-semibold leading-[1.3] text-white">
          {keepHostsWhole(bindWidow(title), subject ? skin.dot : undefined)}
        </p>
        <p className="mt-1 text-[13px] leading-[1.4] text-[#ffffffa3]">{keepHostsWhole(sub)}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className={
            action.primary
              ? 'h-8 flex-none rounded-[8px] bg-[var(--action)] px-3 text-[13px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]'
              : 'h-8 flex-none rounded-[8px] border border-[var(--white-200)] bg-[#ffffff0a] px-3 text-[13px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] disabled:cursor-default disabled:border-[var(--white-100)] disabled:bg-transparent disabled:text-[var(--white-400)] disabled:hover:bg-transparent'
          }
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/**
 * THE LETTER — «One last step for {domain}», board 30425:28847 (designer, 16.09.2026: «нужно
 * сделать дизайн по этому макету перфект пиксель… эксклюзивно для этого кейса Unlink у нас
 * находится внутри One last step, то есть пока есть уведомление, кнопка Unlink внутри этого
 * блока как в макете»).
 *
 * It wears the in-flight card's own material — 8 % fill, 8 % rim, r12 — because it is the
 * same kind of news as the stage above it, not an alarm; the amber `StatusCard` it wore until
 * now made the one card that asks for a click look like a fault. Off the board: a 56 row
 * (icon 24 · title 15 semibold white, `pl 16 / pr 12 / py 16`), the explanation in a box 4 px
 * inside the card (`Black/300` fill, 4 %-white rim, r12, `pt 20 / pb 18 / px 16`, 14/1.4 at
 * 72 % with the address in medium white), and a footer row 48 tall (`pl 8 / pr 12 / py 8`)
 * holding the two things you can do about it: `Resend email` on the left (13 semibold, the
 * board's own #3c9bff — a literal, flagged) and `Unlink` on the right (14 medium at 56 %,
 * icon 20, the label trimmed to its cap band as drawn). While this card is up the domain row
 * below is not: Unlink lives here. The card's own 6 px of air belong to the Reveal that
 * unfolds it (`pad`).
 *
 * ⚠️ The icon is OURS — the board's vector is unreachable through the proxy: a filled white
 * envelope with a blue dot on its corner, the way the board reads at 1×.
 */
function LastStepCard({ domain, sub, resent, onResend, onUnlink }: {
  domain: string
  sub: ReactNode
  resent: boolean
  onResend: () => void
  onUnlink: () => void
}) {
  const { t } = useT()
  return (
    <div className="rounded-[12px] border border-[var(--white-100)] bg-[var(--white-100)]">
      <div className="flex items-center gap-3 py-4 pl-4 pr-3">
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" className="flex-none" aria-hidden>
          <rect x="2" y="5" width="20" height="15" rx="2.5" fill="#fff" />
          <path d="m3.6 7.4 8.4 6.4 8.4-6.4" stroke="#27272a" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="20" cy="5.5" r="4.2" fill="#2a2a2d" />
          <circle cx="20" cy="5.5" r="2.9" fill="var(--action)" />
        </svg>
        <p className="min-w-0 flex-1 break-words text-[15px] font-semibold leading-normal text-white">
          {keepHostsWhole(t({ en: `One last step for ${domain}`, uk: `Останній крок для ${domain}` }))}
        </p>
      </div>
      <div className="px-1">
        <div className="rounded-[12px] border border-[#ffffff0a] bg-[#09090b3d] px-4 pb-[18px] pt-5">
          <p className="text-[14px] leading-[1.4] text-[var(--white-720)]">{sub}</p>
        </div>
      </div>
      <div className="flex items-center justify-between py-2 pl-2 pr-3">
        <button
          type="button"
          onClick={onResend}
          disabled={resent}
          className="press-bloom h-8 flex-none rounded-[8px] px-3.5 text-[13px] font-semibold text-[#3c9bff] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] disabled:cursor-default disabled:text-[var(--white-480)] disabled:hover:bg-transparent"
        >
          {resent ? t({ en: 'Sent', uk: 'Надіслано' }) : t({ en: 'Resend email', uk: 'Надіслати лист ще раз' })}
        </button>
        <button
          type="button"
          onClick={onUnlink}
          className="press-bloom flex h-8 flex-none items-center gap-1 rounded-[8px] pl-4 pr-1.5 text-[14px] font-medium text-[var(--white-560)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
        >
          {/* 1px DOWN from the cap centre — the optical correction the mode pill wears (designer,
              16.09.2026, on the row's twin: «текст в кнопке по вертикали кривой, он на несколько
              пикселей выше чем нужно»). Measured in ink at 2×: cap-centred, the word's ink sat on
              the plate's centre (32/64) while the icon's ink centre is 33.5 and the lowercase mass
              reads lower still — a lowercase word on a pill is read by its x-height, not its caps. */}
          <span className="translate-y-px [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">{t({ en: 'Unlink', uk: 'Відв’язати' })}</span>
          <IconUnlink size={20} />
        </button>
      </div>
    </div>
  )
}

/**
 * `hold` — the canvas is still handing over (a surface leaving, the site fading back; App.tsx
 * `canvasSettling`): the panel waits for it before it springs in, so a press that closes the
 * Domains window and asks for the panel in one commit is seen as two moves, not a collision
 * (designer, 16.09.2026). The store's `publishOpen` is untouched — nothing is lost, only timed.
 */
const keepPanelOnMainThread = () => {}

export function PublishPanel({ hold = false }: { hold?: boolean } = {}) {
  const { world, set } = useWorld()
  const { publishOpen, togglePublish, openDomains, openPanel, publishHintOpen, dismissPublishHint } = useUI()
  const { t } = useT()
  const panelRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  /* Has the confirmation mail just been sent again? The button's second state, and it
     stands down on its own — see RESEND_COOLDOWN_MS. Session state, not world state: it
     describes this press, not the customer's situation. */
  const [resent, setResent] = useState(false)
  useEffect(() => {
    if (!resent) return
    const t = window.setTimeout(() => setResent(false), RESEND_COOLDOWN_MS)
    return () => window.clearTimeout(t)
  }, [resent])
  /* Did the publish happen in FRONT of this person, and how long ago? Session state for
     the same reason `resent` is: it describes this press, not the customer's situation —
     `world.published` is the situation, and it survives a reload, which is exactly why it
     cannot be asked what time it is. Two clocks, see the constants above. */
  const [settling, setSettling] = useState(false)
  const [justPublished, setJustPublished] = useState(false)
  /* Is the press in flight? Session state — see PUBLISHING_MS. The commit it ends in is read
     through a ref so the world it writes is the one at the END of the beat, not the render
     that started it. */
  const [publishing, setPublishing] = useState(false)
  const commitRef = useRef<() => void>(() => {})
  useEffect(() => {
    if (!publishing) return
    const id = window.setTimeout(() => { setPublishing(false); commitRef.current() }, PUBLISHING_MS)
    return () => window.clearTimeout(id)
  }, [publishing])
  useEffect(() => {
    if (!settling) return
    const t = window.setTimeout(() => setSettling(false), PUBLISH_SETTLE_MS)
    return () => window.clearTimeout(t)
  }, [settling])
  useEffect(() => {
    if (!justPublished) return
    const t = window.setTimeout(() => setJustPublished(false), PUBLISH_FRESH_MS)
    return () => window.clearTimeout(t)
  }, [justPublished])

  /* ⚠️ A DIALOG OVER THE PANEL IS NOT "OUTSIDE" IT. The confirm sheet is mounted at the top
     of the tree (its scrim covers the shell), so every press on it lands outside this
     panel's box — and both of its buttons were closing the panel underneath while they
     answered. Asking a question is not a reason to dismiss the thing that asked it. */
  const confirming = useConfirm((c) => c.req !== null)
  useEffect(() => {
    if (!publishOpen || confirming) return
    const onDown = (e: MouseEvent) => {
      const el = e.target as Element
      /* The prototype console is a staging tool, not "outside": a designer moving the world
         from it while watching this panel must see the panel ANSWER — the walk unfolding,
         the cards handing over — not close under the first click (16.09.2026). */
      if (el.closest?.('[data-console]')) return
      if (panelRef.current && !panelRef.current.contains(el)) togglePublish(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') togglePublish(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [publishOpen, confirming, togglePublish])

  const paid = hasPlan(world)
  /** The domain row's word and tone — the topbar chip's own table, see modules/domains/status.ts. */
  const rowStatus = domainRowStatus(world)
  /*
   * EVERY STATE THE PANEL CARRIES (the designer's six of 13.09.2026 — "после корзины все
   * статусы и продолжение флоу происходят тут в окне Publish" — plus the ones the two
   * walks, our own KB and board 28206:66756 say have to exist). Read straight off the
   * world, and only one connection card is ever up at a time:
   *
   *   waitingOn…   the name is in the cart and checkout was abandoned (board state ⑦)
   *   unreachable  red — it worked and stopped. The only red besides a failed publish
   *   registering  bought: the registry has the order. Minutes
   *   propagating  bought: registered, travelling the world. Hours, up to 72
   *   connecting   attached: the records are ours and we are writing them
   *   padlock      either path: the address answers here, so the certificate can be issued
   *   ready        blue — set up, correct, never published. The novice's №1 "it's broken"
   *   old-site     red — the publish FAILED: an older website still sits on the address
   *   confirmEmail the registrant-email clock on a freshly registered name (world.icann)
   *   settled      live and nothing pending: no card at all, one line of prose
   *
   * ⚠️ confirmEmail COMES LAST, AND ONLY ONCE THE DOMAIN HAS CONNECTED (designer,
   * 14.09.2026: «мы его показываем только после того как домен уже законекился, пока
   * кастомный домен не законекчен, мы не показываем уведомление о почте»). It used to
   * appear from the walk's first beat, as a second card under whichever stage card was up —
   * so the panel said "the registry has the order, there is nothing for you to do" and,
   * directly beneath it, "the address starts working once you confirm your email". Two
   * answers to one question, and the actionable one was the quieter. The confirmation is
   * the LAST step rather than a parallel one, and `connect.ts` now walks a bought name
   * through all three stages before parking it at `ready` — so this card is the only thing
   * on screen when it is the only thing left to do.
   */
  const attached = isCustomDomainActive(world)
  const unreachable = world.domain === 'unreachable'
  const connecting = world.domain === 'connecting'
  const provisioning = world.domain === 'provisioning'
  const propagating = world.domain === 'propagating'
  const ready = world.domain === 'ready'
  /*
   * …AND `ready` DOES NOT SHOW ITS CARD WHILE THE MAIL IS OWED. That card's sentence is
   * "your address is set up · visitors will see your site the moment you publish", and on
   * the developer's answer (see `domainIsHome`) the second half is false: nothing resolves
   * until the confirmation lands. So in that window the confirmation card is the state —
   * which is also what the axis should say, and cannot yet (see the note on `confirmEmail`).
   * The footer keeps its blue Publish either way: publishing is allowed, and its result is
   * a site out on the free address, which is exactly what the field then shows.
   */
  /*
   * ⚠️ "CONNECTED, AND THE SITE HAS NEVER BEEN ON IT" IS A SITUATION, NOT AN AXIS VALUE
   * (designer, 14.09.2026, looking at a panel that showed none of this: "что это? ты меня
   * слушаешь?"). The world can say it two ways — `ready`, which is the walk's own word for
   * it, and `live` on a site that was never published, which a preset or a shared link can
   * stage — and the panel used to answer only to the first. Same customer, same moment,
   * two different faces: one with the green card and a button naming the address, one with
   * no card at all and a nameless `Publish`. The panel reads the situation now.
   */
  /*
   * ⚠️ AND `!published` GUARDS ONLY THE STAGED HALF OF IT (designer, 15.09.2026: «что
   * блять происходит? исчезла панель с кнопкой анлинк»). It used to guard both, which was
   * right only while the walk auto-published: back then `ready` could not coexist with
   * `published`, so the guard cost nothing. Since the walk stops at `ready` for everybody
   * (connect.ts, `settle`) that pairing is the COMMONEST shape in the product — a customer
   * who had published and then attached a domain — and the blanket guard put them in a
   * panel with no cards at all: no green all-clear, no domain row, a nameless `Publish`.
   * `ready` is the walk's own word for "connected, site not on it yet", so it earns the
   * card on its own; `live`/`multiple` need the guard, because there the same situation is
   * only ever STAGED (a preset, a shared link) and without it the terminal quiet state
   * would carry an all-clear that has already been acted on.
   */
  const readyCard = (ready || (domainSettled(world) && !world.published)) && !world.icann
  const oldSite = world.domain === 'old-site'
  /*
   * ⚠️ AND IT IS THE WORLD'S OWN SELECTOR, NOT A FOURTH COPY OF IT. This read
   * `attached && world.icann` — the same sentence the topbar chip, the domains window's
   * row chip and its line under the name each wrote out for themselves, which is precisely
   * the drift `registrantUnconfirmed` exists to stop (state/world.ts). It also now carries
   * the designer's rule of 14.09.2026: the letter is not mentioned until the domain has
   * CONNECTED, so the card no longer competes with the three stage cards above it.
   */
  const confirmEmail = registrantUnconfirmed(world)
  /*
   * ⚠️ `domainSettled` HAS ONE READER LEFT, AND THAT IS THE STATE OF THINGS, NOT AN
   * OVERSIGHT. It used to be this panel's workhorse — the address in the field, the green
   * pill, the prose line under it — and 15.09.2026 took all three away: the field follows
   * the CONNECTION now (`domainIsHome`), the pill went to the header's copy button on the
   * 14.09 boards, and the prose line is gone with the padlock claim. What is left of
   * "finished and quiet" is one question — does the ready/green card belong here — so it
   * is read where that is decided (`readyCard` above) and nowhere else. A local alias for
   * a single use would only make it look like the panel still had a fourth opinion.
   */
  /*
   * A NAME LEFT STANDING AT THE TILL — see the card for how this maps to board state ⑦.
   *
   * TWO TRIPS REACH CHECKOUT AND ONLY ONE OF THEM PUTS THE NAME IN THE CART. Buying one
   * leaves a registration line; connecting one the customer ALREADY OWNS is free, so that
   * order is the plan and nothing else, and the name rides across checkout as the intent
   * parked in `PanelCart` (its PENDING_KEY note). This read was the cart alone, so the
   * connect-owned customer who walked out came back to the dashed "Buy or connect a
   * domain" card as if the trip had never happened, over a cart they could not see and
   * had no way back into (14.09.2026 — the visible half of that night's blocker).
   *
   * ⚠️ PEEK, NEVER TAKE. The intent is spent exactly once, by the till at Submit Order.
   * A panel that merely renders must not consume it, or this card would destroy the
   * connection it is announcing. Reading it during render is safe for the reason given
   * where it is defined: it only ever moves alongside a world write, which re-renders
   * this panel anyway.
   *
   * ⚠️ AND THE FALLBACK STAYS NARROW. The parked name counts only while the PLAN is still
   * in the cart, which is exactly the abandoned trip and exactly the shape `PanelCart`'s
   * own re-entry check keeps alive (a checkout with no plan line drops the intent as
   * money waiting to be spent). A cart holding a plan for some other reason has nothing
   * parked, so there is no name, and this card does not appear.
   */
  const cartRegistration = world.cart.find((l) => l.kind === 'domreg')?.domain
  const parkedConnect =
    !cartRegistration && world.cart.some((l) => l.kind === 'remixer')
      ? peekPendingConnect() ?? undefined
      : undefined
  const cartDomain = cartRegistration ?? parkedConnect
  const waitingOnCheckout = world.domain === 'checkout' && !!cartDomain
  /* (`stageCard` — "is a connection card up, so the letter stacks under it at 8" — is gone
     with 16.09.2026: the letter no longer lives in the field block, see `LastStepCard`.) */
  /*
   * THE FIVE SECONDS — see PROPAGATING_READ_MS. Two pieces of SESSION state (they describe
   * this viewing, not the customer's situation): is the in-flight card's explanation open,
   * and has the letter earned its place. The clock is the beat's own: read off the walk's
   * ticket when there is one (`connectProgress`), so a panel opened six seconds into the
   * spread finds the explanation already folded and the letter up, instead of replaying the
   * five seconds for it; a staged world (no ticket) counts from the moment it was staged.
   * Folding it by hand before the time is up is the same signal as the clock — the text is
   * out of the way, the letter may come; opening it again later does not take the letter
   * back, that would be the panel arguing with a person who wants to read.
   */
  const [subOpen, setSubOpen] = useState(true)
  const [letterDue, setLetterDue] = useState(false)
  const autoFold = useRef<number[]>([])
  const cancelAutoFold = () => { autoFold.current.forEach((id) => window.clearTimeout(id)); autoFold.current = [] }
  useEffect(() => {
    cancelAutoFold()
    /* ⚠️ The five seconds are a VIEWING: they count from the panel being open on the beat, not
       from the beat being staged. Armed while the panel was shut (a shared link, a preset set
       with the panel closed) they ran out unseen, and the panel opened on a folded explanation
       nobody had been given time to read. A live walk still reads the beat's own clock. */
    if (!propagating || !publishOpen) { setSubOpen(true); setLetterDue(false); return }
    const left = PROPAGATING_READ_MS - (connectProgress(world)?.elapsed ?? 0)
    if (left <= 0) { setSubOpen(false); setLetterDue(true); return }
    setSubOpen(true)
    setLetterDue(false)
    autoFold.current = [
      window.setTimeout(() => setSubOpen(false), left),
      window.setTimeout(() => setLetterDue(true), left + LETTER_AFTER_FOLD_MS),
    ]
    return cancelAutoFold
  }, [propagating, publishOpen, world.customDomain])
  const toggleSub = () => {
    cancelAutoFold()
    if (subOpen && !letterDue) autoFold.current = [window.setTimeout(() => setLetterDue(true), LETTER_AFTER_FOLD_MS)]
    setSubOpen((o) => !o)
  }
  /* the beat's share, ticking with the walk's clock while it runs; the board's 27 when staged */
  const [, tick] = useState(0)
  useEffect(() => {
    if (!propagating || !connectProgress(world)) return
    const id = window.setInterval(() => tick((n) => n + 1), 500)
    return () => window.clearInterval(id)
  }, [propagating, world.customDomain])
  const percent = propagating ? Math.round((connectProgress(world)?.fraction ?? 0.27) * 100) : null
  /** The letter is up: owed, and — while the address spreads — only once the explanation has folded. */
  const letterUp = confirmEmail && (!propagating || letterDue)
  /** The domain row (word + Unlink) — not while the letter is up: Unlink lives in the letter then. */
  const showDomainRow = domainIsHome(world) && !confirmEmail
  /*
   * ⚠️ AND WHILE ONE IS UP, THIS PANEL HAS NO DOOR OF ITS OWN — on purpose (designer,
   * 14.09.2026). A quiet text row under the card used to offer "See all your domains" /
   * "Use a different domain"; he threw it out on sight. The topbar chip routes these
   * states here rather than to the domains window (App.tsx), so the way to the dashboard
   * is the topbar, not a second door inside the one window that is doing the work.
   */

  /*
   * Our own KB, on publishing to a domain that already serves something: the target "must
   * be associated with a clean hosting environment, as the tool is not compatible with
   * existing sites (e.g. WordPress or other types of installations)" — leave the old files
   * there and "publishing to production will fail". DreamHost's base is WordPress, so on
   * the attach path this is likely, not exotic.
   *
   * ⚠️ MODELLED ON THE INVENTORY AXIS: the first publish onto a domain that is `dh-in-use`
   * fails. That is deliberate and it is reachable in a demo by accident — say so before
   * showing the happy path. Flip `inventory` to any other value in the scenario console and
   * the same press goes live.
   */
  /* A press that WORKED starts both clocks; the `dh-in-use` branch is a publish that
     failed, and a failure that congratulates itself is the worst thing in this file. */
  const markPublished = () => { setSettling(true); setJustPublished(true) }
  /* The press: start the busy beat; `publishNow` below is what lands when it ends. */
  const beginPublish = () => { if (!publishing) setPublishing(true) }
  const publishNow = () => {
    if (ready && world.inventory === 'dh-in-use') return set({ domain: 'old-site' })
    /*
     * ⚠️ `!world.icann` — PUBLISHING DOES NOT WALK THE DOMAIN PAST THE MAIL. The press is
     * allowed while a registrant confirmation is owed, and its result is a site out on the
     * FREE address (the note on `readyCard` says so in full), so what must not happen is
     * the domain axis advancing with it: `live` + `icann` is the one pairing
     * `world.violations()` calls impossible, and this write produced it unconditionally.
     * The domain stays `ready` — connected, correct, not yet answering — until the letter
     * lands, which is exactly what the card above the button is asking for.
     */
    set({ unpublished: 0, published: true, ...(ready && !world.icann ? { domain: 'live' as const } : null) })
    markPublished()
  }
  commitRef.current = publishNow
  /*
   * TAKE THE DOMAIN OFF THIS SITE (board 30282:18491, "Unlink") — BEHIND A CONFIRM
   * (board 30282:51628, designer 14.09.2026). The press no longer does it; it asks.
   *
   * The site does not go anywhere — it falls back to the free address, which is the one
   * thing that is always there. The name stays in `customDomain`, because it is still the
   * customer's: the domains window still lists it and `Connect` puts it back. The
   * registrant-email clock goes with the connection it belonged to.
   *
   * The question names the domain and the answer names the act — never "Yes". And the
   * body says the two things a person needs at that moment: what stops working, and that
   * it is not final.
   */
  const unlinkDomain = () => useConfirm.getState().ask({
    title: t({ en: `Disconnect ${world.customDomain}?`, uk: `Відключити ${world.customDomain}?` }),
    body: t({
      en: 'Your website will no longer be accessible at this address. You can connect a new domain at any time.',
      uk: 'Ваш сайт більше не буде доступний за цією адресою. Ви можете підключити інший домен будь-коли.',
    }),
    confirmLabel: t({ en: 'Disconnect', uk: 'Відключити' }),
    cancelLabel: t({ en: 'Cancel', uk: 'Скасувати' }),
    tone: 'danger',
    onConfirm: () => set({ domain: 'staging', icann: false }),
  })

  /* The second attempt, after support has cleared the address. The prototype cannot model
     the clearing, so this one lands — a demo that dead-ends teaches nothing.
     ⚠️ AND IT CARRIES THE SAME `!icann` GUARD AS `publishNow`, because it is the THIRD door
     to `live` + a confirmation still owed and the only one reachable without leaving the
     product: park at `ready` + `icann` (the organic end of every purchase) → Publish, which
     is allowed → on a `dh-in-use` domain that lands `old-site` → this card's "Try again" →
     `live`. `world.violations()` calls that pairing impossible. Here the address is cleared
     but the name still does not answer, so the site goes out and the domain waits at
     `ready` for the letter. */
  const retryPublish = () => {
    set({ domain: world.icann ? 'ready' : 'live', published: true, unpublished: 0 })
    markPublished()
  }

  /*
   * THE PRIMARY BUTTON SAYS WHAT IT DOES, IN EVERY STATE.
   *
   * It used to read "Continue" while actually publishing (a never-published site with no
   * pending edits), and "Update"/"Continue" while merely closing the panel (connecting,
   * verifying, unreachable) — a publish-shaped button that does not publish is the first
   * thing a product owner presses. So: there is either something to publish, in which case
   * the button is blue and names it, or there is not, in which case it stops pretending —
   * it becomes the quiet "Keep editing", the house's own permission to walk away
   * (states.md, every waiting state).
   *
   * ⚠️ AND `ready` IS NOT AN EXCEPTION — it is the clearest case of the rule (designer,
   * 14.09.2026, on finding the blue button inside the card: «что за Publish не в том
   * месте?»). It was excluded here on the grounds that every non-terminal state carries
   * its own verb, so two blue verbs in one 480px panel would be one too many. Both halves
   * were misread. That rule is about actions with nowhere else to live — `Resend` for an
   * unconfirmed email, `Fix this` for a domain that stopped answering, `Try again` for a
   * blocked publish, `Finish checkout` for an abandoned cart; each belongs to one state
   * and would be meaningless in a shared footer, which is why the shared "Refresh status"
   * went. PUBLISH IS THE OPPOSITE OF THAT: it is the panel's own action, the panel is
   * named after it, and it already has a home — this button. Putting it in the card did
   * not avoid two blue verbs, it INVERTED them: the primary action moved into a card and
   * the footer, where the eye goes for it, was left holding the secondary "Keep editing".
   * So `ready` publishes from here, its card keeps the sentence and drops the button, and
   * the panel still has exactly one blue verb — in the one place it has always been.
   *
   * `old-site` stays excluded, and for a reason that survives the correction: publishing
   * is precisely what FAILED there. A blue Publish in the footer would be a primary button
   * that cannot work — the original defect this whole paragraph exists to prevent — and
   * the recovery is genuinely state-specific (the address has to be cleared first, then
   * `Try again` inside the card). The footer says "Keep editing", as it does at every
   * other state that is waiting on something: the same answer `unreachable` already gives.
   *
   * ⚠️ NO "· Free" ON THE LABEL (designer, 08.09.2026: "убери из кнопки — Free"), which is
   * also what the board draws — an 86px button reading just "Publish". The suffix was ours,
   * arguing audit conclusion №1 (we are the only builder in the category charging credits to
   * publish, so publishing must read as free). That argument now has nowhere on this button
   * to live: if it is worth making, it belongs in the nudge banner's copy, not stapled to
   * the verb. Raised with the designer; do not put it back on the button.
   */
  /* `ready` publishes unconditionally: the state means the domain is set up and the site
     has never been on it, so there is always something to do here — reading it through
     the edit count could leave the one state that exists to be published with no way to
     publish. */
  const publishes = canPublish(world)
  /*
   * …AND FOR ONE BEAT AFTER A PRESS IT SAYS WHAT HAPPENED (see PUBLISH_SETTLE_MS).
   * The slot is the same one the press was made in, so the answer arrives under the
   * finger that asked; then it stands down into "Keep editing" on its own. This is the
   * half of the fix the customer feels; the marker beside the address is the half they
   * can still read a minute later.
   */
  const settleLabel = settling && !publishes
  const edits = changeCount(world.unpublished)
  /*
   * The one state the board draws: a site that is live and holding edits. It is also the
   * only state whose button publishes EDITS rather than the site, so the count line and
   * the verb are one decision — a count beside a button reading "Publish" would be
   * counting something the press does not do.
   */
  const publishesChanges = publishes && !ready && world.published
  /* ⚠️ THE DISABLED BUTTON KEEPS THE SAME WORDS (board 30282:52600, the "everything is
     published" state): a live site with nothing queued shows `Publish changes`, greyed —
     not a different verb. Only a site that has never been out, or a `ready` domain waiting
     for its first press, says plain `Publish`. */
  const primary = settleLabel
    ? { en: 'Published', uk: 'Опубліковано' }
    /* ⚠️ NOTHING TO PUBLISH = A DIMMED, INACTIVE `Publish` (designer, 14.09.2026: "что за
       Keep editing? тут должна быть серая неактивная кнопка Publish"). The slot keeps the
       panel's own verb in every state and says "not yet" the way the whole product says it
       — the same dimmed pair the topbar's Publish and Home's Build wear when they are not
       armed. "Keep editing" was ours: a second verb in the one slot the panel is named
       after, which made the footer read as an exit instead of the action. Do not bring it
       back; the ways out are Escape, a click outside, and the topbar button. */
    : !publishes
      ? (world.published ? { en: 'Publish changes', uk: 'Опублікувати зміни' } : { en: 'Publish', uk: 'Опублікувати' })
      /* ⚠️ THE COUNT IS NOT IN THE LABEL (Figma 28071:53189). The board puts it on its
         own line at the far left of this bar and leaves the button a plain verb phrase —
         see the bar below. A button that carries its own subtotal has to be re-read every
         time the number moves; a line beside it can be glanced at and ignored.
         ⚠️ AND THE BOARD'S VERB IS `Publish changes`, NOT `Update` — SETTLED 14.09.2026.
         The topbar said "Update" in this exact situation, so one action was named two
         ways across two surfaces (the audit's verb table allows either). The designer
         chose the board's phrase for both: App.tsx now says "Publish changes" too, and
         "Update" is gone from the product. */
      : publishesChanges
        ? { en: 'Publish changes', uk: 'Опублікувати зміни' }
        /* ⚠️ AND AT `ready` IT NAMES THE ADDRESS (board 30289:59972): "Publish to
           {domain}". This is the one press in the product that moves a site onto a new
           address, and the button is where that is worth saying out loud. */
        : readyCard
          ? { en: `Publish to ${world.customDomain}`, uk: `Опублікувати на ${world.customDomain}` }
          : { en: 'Publish', uk: 'Опублікувати' }

  /*
   * THE ONE IN-FLIGHT CARD'S WORDS, BY STAGE — see ProgressCard for why it is one card. The
   * copy is the boards' (30282:54233 for the three moving stages, 30289:59972 for the end);
   * `null` when nothing is in flight, and the Reveal around the card folds it away.
   *
   * ⚠️ THE END CARD'S SECOND SENTENCE DEPENDS ON WHETHER THERE IS A SITE OUT THERE ALREADY.
   * The board's copy — "to make your site live" — is written for the customer who has never
   * published; for the one who has, it would be the same small lie the auto-publish used to
   * tell: their site IS live, at the free address, and what this press does is MOVE it. The
   * card names the act it is asking for; the address it moves onto is in the field right
   * under it and in the button.
   */
  const progress: { variant: ProgressVariant; title: string; sub: string; done?: boolean; collapsible?: boolean; percent?: number | null; open?: boolean; onToggle?: () => void } | null = connecting
    ? {
        variant: 'connecting',
        title: t({ en: `Connecting ${world.customDomain}`, uk: `Підключаємо ${world.customDomain}` }),
        sub: t({
          en: 'Pointing the domain at your site. Usually quick, sometimes a few hours — keep editing, we’ll keep checking.',
          uk: 'Спрямовуємо домен на ваш сайт. Зазвичай швидко, іноді кілька годин — працюйте далі, ми перевіряємо.',
        }),
      }
    : provisioning
      ? {
          variant: 'provisioning',
          title: t({ en: `Provisioning ${world.customDomain}`, uk: `Реєструємо ${world.customDomain}` }),
          sub: t({
            en: 'Registering the name in your account. Usually under 15 minutes — nothing for you to do.',
            uk: 'Реєструємо ім’я у вашому акаунті. Зазвичай менш ніж 15 хвилин — від вас нічого не потрібно.',
          }),
        }
      : propagating
        ? {
            variant: 'propagating',
            title: t({ en: `Propagating ${world.customDomain}`, uk: `Пропагуємо ${world.customDomain}` }),
            /* the designer's own sentence, board 30425:28847 — shorter than ours was */
            sub: t({
              en: 'Your address is updating across the web. Most visitors will see your site within hours, up to 72 max.',
              uk: 'Ваша адреса оновлюється в мережі. Більшість відвідувачів побачать сайт за кілька годин, щонайбільше за 72.',
            }),
            collapsible: true,
            percent,
            open: subOpen,
            onToggle: toggleSub,
          }
        : readyCard
          ? {
              variant: 'ready',
              done: true,
              title: t({ en: `${world.customDomain} is connected`, uk: `${world.customDomain} підключено` }),
              sub: world.published
                ? t({
                    en: 'Your new custom address is fully set up. Publish to move your site onto it.',
                    uk: 'Вашу нову адресу повністю налаштовано. Опублікуйте, щоб перенести сайт на неї.',
                  })
                : t({
                    en: 'Your new custom address is fully set up. Just hit the publish button to make your site live.',
                    uk: 'Вашу нову адресу повністю налаштовано. Натисніть «Опублікувати», щоб сайт запрацював.',
                  }),
            }
          : null

  return (
    <AnimatePresence>
      {publishOpen && !hold && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label={t({ en: 'Publish', uk: 'Публікація' })}
          /* Liquid Glass (motion.ts `panelIn`, 17.09.2026): the glass inflates out of the Publish
             button's own corner with one soft overshoot, the contents focus onto it a beat later,
             the rim catches the light (`.glass-glint` below). Leaving is the house dismissal. */
          variants={reduce ? panelInFade : panelIn}
          initial="initial"
          animate="animate"
          exit="exit"
          /* main thread, not WAAPI: the composited spring handed the panel back at opacity 0 for
             one frame after landing (traced 16.09.2026, t≈430 ms) — see App.tsx keepOnMainThread */
          onUpdate={keepPanelOnMainThread}
          /*
           * WHERE IT SITS — the SHELL board 29697:54553, which is the one that shows the
           * panel in its window (designer, 09.09.2026: "сделай расположение этого открытого
           * окна Publish как в макете"). `Frame 22` is at x=2025 y=8 in the 2560×1166 frame:
           *   top    8 — it rides at the TOP of the window and COVERS the right end of the
           *          topbar, the credits pill and the Publish button that opened it. Not
           *          tucked under the 52px bar, which is where the panel's own board
           *          (29697:36970) left it because that board has no window around it.
           *   right  55 — the rail is 2504…2560, so the panel's right edge (2505) lands one
           *          pixel over its inner edge. Shipped as drawn; a pixel under an opaque
           *          rail is invisible either way, and 55 is what the board measures.
           * FIXED, not absolute: mounted inside <main>, so an absolute "right" would resolve
           * against the centre column and the panel would drift with the chat's width.
           *
           * ⚠️ 432 WIDE — board 30282:18491, the designer's own correction (14.09.2026:
           * "вот макет правильный"). `Frame 22` sits at x=2072 in a 2560 frame, so top 8 /
           * right 56, and every frame inside is laid out on 432 (card 420, field 388). It
           * supersedes 480 from 29697:36970, which itself superseded 548.
           */
          className="fixed right-[56px] top-2 z-40 w-[432px] origin-top-right rounded-[20px] bg-[var(--gray-850)]"
          /* The rim is an INSET SHADOW, not a border, here and on the card, the banner and
             the URL field inside: Figma's 1px stroke sits inside the geometry and does not
             shrink a frame's children, while a CSS border does — four nested borders had
             the banner 4px narrower than drawn, its copy 6px short of the board's column
             and the field 2px too tall (design-system.md §5). */
          style={{ boxShadow: 'inset 0 0 0 1px #ffffff0a, 0px 24px 28px rgba(0,0,0,0.5)' }}
        >
          {/* the rim catching the light as the glass forms — the thread cards' `card-glint`, worn as
              a child because `.card-arrive` would make a `fixed` panel `relative` */}
          <span aria-hidden className="glass-glint" />
          {/* The panel inflates first, its contents arrive a beat later (motion.ts rule 3),
              focusing onto the glass from slightly large. */}
          <motion.div variants={reduce ? panelInBodyFade : panelInBody} className="origin-top-right">
          {/* -------------------------------------------------------- header, 64px */}
          <div className="flex h-16 items-center justify-between pl-6">
            <h3 className="font-display text-[20px] font-semibold leading-[1.2] text-white">
              {/* ⚠️ THE TITLE ASKS A DIFFERENT QUESTION FROM THE FIELD, and must not be
                  folded into it. The field asks "which address do we hand over", which
                  waits for the domain to be finished; this asks "has this site ever gone
                  live", which a running registrant-email clock does not un-answer. So it
                  reads `published` — plus a live domain, because "Not published" over one
                  would be a lie whatever the clock is doing. Merely having a domain
                  ATTACHED does not count: one that is connecting, or `ready` and waiting
                  for the first press, stands in front of nothing, and titling that panel
                  "Publish" would hide the very thing it is there to say. */}
              {/* ⚠️ AND THE THIRD TITLE IS `Published` (board 30282:53241, and the designer
                  said it in words: "если изменения новых нет, то заголовок окна пишет
                  Published"). Three states, three answers: nothing has ever gone out
                  ("Not published"), something is waiting ("Publish"), everything that was
                  made is out there ("Published"). The middle one is the action, the other
                  two are the status — which is why this heading changes word class. */}
              {/* ⚠️ …AND A DOMAIN DOES NOT MAKE IT PUBLISHED. The title used to read `Publish`
                  over a live domain whatever `published` said, on the reasoning that "Not
                  published" over a working address would be a lie. It is not: board
                  30289:59972 titles exactly that state as not published, because the
                  address working and the site being on it are two different facts. */}
              {!world.published
                ? t({ en: 'Not published', uk: 'Не опубліковано' })
                : canPublish(world)
                  ? t({ en: 'Publish', uk: 'Публікація' })
                  : t({ en: 'Published', uk: 'Опубліковано' })}
            </h3>
            {/*
              * VISITORS, in the corner the board gives them (30282:53260): a 32-tall button
              * at radius 8, `pl 4 / pr 16`, gap 2 — a 24 icon and the number at 13px Gilroy
              * Medium on 72% white. It is on all three of the new boards and it was the one
              * thing on them I did not build, on the grounds that a counter is an analytics
              * promise rather than a layout detail. The designer put the boards up again
              * side by side, so it is built as drawn.
              *
              * ⚠️ IT READS ZERO AND IT IS NOT WIRED. The world carries no analytics axis,
              * and inventing traffic is how a demo starts lying — the board says 0 too.
              * Raised: what it should count (all time? today?) and whether it opens the
              * Analytics rail, which is where that number lives today.
              */}
              {/* ⚠️ AND IT IS NOT CENTRED IN THE HEADER: board 30289:59982 seats it at
                  `pt 19` with `pr 16`, so it hangs 3px below the bar's axis and keeps a
                  16px margin off the panel's edge — on top of the `pr 16` the button
                  carries inside itself, so the number lands 32 off the edge. Centred and
                  flush, where it stood, it sat 3px high and 16px too far right.
                  Reproduced literally, like the plan card's pt20/pb18 title: the optical
                  nudge is the designer's, not a rounding error. */}
            <span className="flex h-8 items-center gap-0.5 self-start mt-[19px] mr-4 rounded-[8px] pl-1 pr-4 text-[13px] font-medium leading-[1.4] text-[var(--white-720)]">
              <IconVisitors size={20} className="mx-0.5" />
              <span className="tabular-nums">0</span>
            </span>
          </div>

          {/* ---------------------------------------------------------- body card */}
          <div className="px-1.5">
            {/* Figma 29697:36983: Neutral Alpha/50 (#ffffff0a) for both the fill and the
                hairline. The nudge and the fields are two children 8px apart; the padding
                that used to be on this card now belongs to the fields' own container, so
                the banner can sit inset 8px on its own. */}
            {/* ⚠️ NO GAP between the children (board 30282:53241): the field block's own
                pb 16 is the whole distance down to the domain card. The nudge keeps the 8px
                inset it had by carrying it itself (`px-2 pt-2 pb-2` on the banner). */}
            <div className="flex flex-col rounded-[16px] bg-[#ffffff0a] shadow-[inset_0_0_0_1px_#ffffff0a]">
            {/* ------------------------------------------------ the nudge, 29697:37264 */}
            {/* ⚠️ IT USED TO FADE OUT AND LET THE CARD TIGHTEN IN ONE SNAP, on the dock's rule
                that layout is never animated. The designer's recording of 16.09.2026 is what
                that snap looks like from the outside, and the rule's reason (the thread's
                scroller relaying out under a moving dock) does not hold in a fixed overlay —
                see ui/Reveal.tsx. The nudge now folds away like every other block here. */}
            <Reveal show={!world.published && !attached && publishHintOpen} pad="px-2 pb-2 pt-2" radius={12}>
              {!world.published && !attached && publishHintOpen && (
                  <div className="relative flex h-[120px] items-center overflow-hidden rounded-[12px] bg-[var(--gray-900)] px-6 shadow-[inset_0_0_0_1px_#ffffff0a]">
                    {/* the brand's dot field, dying out to the left — index.css */}
                    <span className="pub-hint-dots" aria-hidden />
                    {/* pr-20: the board holds the copy to a 324px column and leaves the
                        right 80px to the pattern, so the two never overlap */}
                    <div className="relative min-w-0 flex-1 pr-20">
                      <p className="font-display text-[18px] font-semibold leading-normal text-white">
                        {t({ en: 'Ready to put your site live?', uk: 'Готові опублікувати сайт?' })}
                      </p>
                      <p className="mt-3 text-[14px] leading-[1.4] text-[#ffffffa3]">
                        {t({
                          en: 'This lets visitors view what you’ve built. They never see the changes you make until you publish them.',
                          uk: 'Так відвідувачі побачать те, що ви зібрали. Ваші правки залишаються невидимими для них, поки ви їх не опублікуєте.',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={dismissPublishHint}
                      aria-label={t({ en: 'Dismiss', uk: 'Прибрати' })}
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-[10px] border border-[#ffffff14] bg-[#09090b7a] text-white backdrop-blur-[16px] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[#09090bcc]"
                    >
                      <IconClose size={11} />
                    </button>
                  </div>
              )}
            </Reveal>
            {/* ------------------------------- the in-flight card, board 30282:54233:
                ABOVE the address field, in the shape that board draws. One card for the
                whole walk — see ProgressCard and `progress` above; the Reveal unfolds it when
                a stage begins and folds it when the last one ends. */}
            <Reveal show={progress !== null} pad="px-1.5 pt-1.5" radius={12} follow="instant">
              {progress && <ProgressCard {...progress} />}
            </Reveal>
            {/* --------------------------------------------- the fields, 29697:37003 */}
            <div className="px-4 pb-4 pt-[19px]">
              {/* website URL */}
              <div className="flex flex-col gap-[7px]">
                <p className="px-0.5 text-[14px] font-medium leading-[1.4] text-[var(--white-560)]">
                  {t({ en: 'Website URL', uk: 'Адреса сайту' })}
                </p>
                {/*
                  * WHICH ADDRESS THE FIELD CARRIES.
                  *
                  * The custom name in exactly two states: `live`/`multiple` with the mail
                  * confirmed (`settled`), and `ready` — the domain is set up and only a
                  * press stands between it and the site (designer, 14.09.2026: "кастомный
                  * домен уже полностью настроен и работает? какого черта я вижу
                  * fit-ration.remixer.ai?"). It used to show the free address at `ready`
                  * on the rule "the field carries the address that actually serves the
                  * site" — true, and unreadable: a heading that says "Your website URL"
                  * over somebody else's address while your own is finished.
                  *
                  * The free address everywhere else, INCLUDING while a custom domain is
                  * provisioning, connecting, propagating or
                  * waiting on a registrant-email confirmation — that is precisely when
                  * "where IS my site right now" is the question, and through all of it
                  * the answer is: here, and only here.
                  */}
                {/* ⚠️ THE FIELD FOLLOWS THE CONNECTION, NOT THE ALL-CLEAR — see
                    `domainIsHome`. It used to follow `settled || readyCard`, i.e. "the
                    domain answers and nothing is outstanding", which left the free address
                    standing under a card that had just said the domain was bought and set
                    up. */}
                {domainIsHome(world) ? (
                  <UrlField value={world.customDomain} />
                ) : (
                  <UrlField value={STAGING_NAME} suffix={STAGING_SUFFIX} />
                )}
              </div>

              {/*
                * THE DOMAIN CARD — board 30282:18491, the state where a custom domain is
                * carrying the site: a card of its own under the field (rim `NA/100` = 8%
                * white — the board's `#313133` is that token flattened against the panel's
                * ground, see the seam note below;
                * radius 16, pl 8 / pr 16 / py 16), the domain's own status on the left and
                * the one action that belongs to a domain on the right.
                *
                * ⚠️ `Unlink` IS THE DESIGNER'S (14.09.2026: "справа будет кнопка отвязать
                * домен") — and since 16.09.2026 it is GREY here as in the letter (14 medium at
                * 56 % white, white on hover), not the board's amber #f57c00: shown the two
                * colours side by side he chose one («я думаю сделать его лучше везде серым, так
                * как получается какая-то ёлка рождественская, а не интерфейс»). One verb, one
                * colour, in both of its homes.
                *
                * ⚠️ The left line no longer says "anyone can visit" (his question: "это
                * как? в дримхосте есть такие настройки?"). There is no visibility setting
                * anywhere in DreamHost, so that half named a control that does not exist.
                * What survives is the half that is true and that the success checklist
                * promises — the padlock.
                */}


              {/* ------------------------------------------------- the state card
                  Copy comes from docs/features/domains/states.md wherever that document
                  has a string for the state — it is the deliverable, quoted in Figma and
                  here, and a second copy of a sentence drifts from the first inside a
                  month. Where it has none, the line is marked INVENTED below. */}

              {/* `needs-attention` in states.md: it worked and it stopped. The first thing
                  a person thinks is "I've lost my site", so the first thing the card says
                  is that they have not. The old line ("We can't reach this domain yet ·
                  your plan is active") reassured them about their BILLING in the middle of
                  an outage, and wrapped one word short at 480px besides.
                  ⚠️ states.md opens the sub with "Something changed at {registrar} on
                  {date}." — dropped, not reworded: the world carries neither a registrar
                  name nor a date, and inventing either is how a demo starts lying. */}
              <Reveal show={unreachable} pad="pt-[19px]" radius={12}>
              {unreachable && (
                <StatusCard
                  tone="red"
                  title={t({
                    en: `${world.customDomain} stopped showing your site`,
                    uk: `${world.customDomain} більше не показує ваш сайт`,
                  })}
                  sub={t({
                    en: `Your site is safe — it’s still at ${STAGING_HOST}.`,
                    uk: `Ваш сайт цілий — він і далі за адресою ${STAGING_HOST}.`,
                  })}
                  action={{
                    label: t({ en: 'Fix this', uk: 'Виправити' }),
                    onClick: () => retryConnect(world.customDomain),
                  }}
                />
              )}
              </Reveal>

              {/* `connecting · in-account`, states.md variant A — the records are ours to
                  write, so this is the fast path and the only variant of three allowed to
                  say anything about speed at all.
                  ⚠️ A WINDOW AND A CHECK, NEVER A MOMENT — and NOT the document's "usually
                  a few minutes", which predates the mechanism. The zone's SOA MINIMUM is
                  14400s and it governs NEGATIVE caching: a name parked at "DNS Only" has
                  never resolved, so the world is holding "there is nothing here" for up to
                  four hours. The five-minute TTL applies to updating a record that already
                  answers — not to this. The domains our customers connect are precisely
                  the never-used ones, so the honest shape is "usually quick, sometimes a
                  few hours, and we are checking". "We'll keep checking" is states.md's own
                  phrase (variant B); it replaces "it goes live on its own" because that
                  reads as a countdown, and there is nothing to count down — we cannot know
                  when a given visitor's cached "nothing here" expires. */}

              {/* `registering`, states.md §5. The registry, and only the registry: fifteen
                  minutes is verified ("within 15 minutes of completing the purchase form")
                  and it is NOT the same event as a working website — that is the next
                  card. No action: there is none. */}

              {/* `propagating`, states.md §5 — verbatim, including the last clause, which
                  is the only honest way to own a 72-hour wait. This is the state the
                  checkout sheet's "connects automatically after checkout" was silently
                  promising away. No action: there is none, and the free address works the
                  whole time. */}

              {/* `securing`, states.md. The padlock is the LAST wait and it cannot start
                  early — a certificate needs the address to answer here first — which is
                  why this is its own card and not a line inside the one above.
                  ⚠️ The old sub said "the site already works". On the way to `ready` it
                  does not: nobody has published it yet. */}

              {/* `ready`, states.md — verbatim, and the state nobody had drawn. Everything
                  is correct and nothing is happening; the customer concludes the product
                  is broken. (They may even be looking at DreamHost's own empty-site page —
                  "Well, this is awkward. The site you're looking for is not here." — while
                  this panel says all is well. Worth a line one day; it is not in the
                  approved copy, so it is not invented in here tonight.)
                  ⚠️ THE VERB IS NOT IN HERE (designer, 14.09.2026: «что за Publish не в
                  том месте?»). It was, and that put the panel's primary action in a card
                  while the footer held the secondary one. The card's job is the sentence
                  — everything is correct, and one press puts the site on it; the press
                  itself belongs to the blue button at the bottom, which is where it is
                  for every other state and where this panel's name points. The tone
                  stays BLUE and now earns it twice: blue is this project's colour for an
                  action, the state IS an action waiting to be taken, and the card is
                  pointing straight at the only blue thing on screen. */}


              {/* The dirty-domain publish failure — failures.md №15, "дырки нет даже на
                  бумаге": no board, no state, and on a WordPress customer base the likely
                  one. Our KB says the publish fails while the old site's files are there.
                  ⚠️ OUR WORDING, PENDING THE REAL STRING. DreamHost's exact message for
                  this case is the single most valuable string missing from the research —
                  the four we do have verbatim are all about ADDING a domain, not
                  publishing to it ("Sorry, this domain is already in our system on another
                  account." · "The domain looks like a subdomain." · "…registered with
                  another provider and may require its DNS to be pointed to DreamHost." ·
                  "…not yet registered and would need to be purchased…"). None covers this.
                  The remedies in the KB are: clear the files, move the old site, or
                  contact support. The first two are an SFTP session — no builder customer
                  is doing that from this card — so the card names the one they can act on
                  and keeps the verb for afterwards. */}
              <Reveal show={oldSite} pad="pt-[19px]" radius={12}>
              {oldSite && (
                <StatusCard
                  tone="red"
                  title={t({
                    en: `${world.customDomain} still has an older website on it`,
                    uk: `На ${world.customDomain} досі стоїть старіший сайт`,
                  })}
                  /* ⚠️ THE REASSURANCE HAS TO BE TRUE ON THE PATH THAT REACHES THIS CARD
                     (D9, 14.09.2026). It read "your site is safe at {staging} meanwhile"
                     inside a panel titled "Not published" — and the organic route here is
                     `dh-in-use` → Replace and connect → `ready` → Publish, where the site
                     has never been published and therefore is not at the free address
                     either: the panel's own nudge says so in as many words ("they never
                     see the changes you make until you publish them").
                     So the clause splits on the one fact it depends on. Published: the
                     free address really is still serving, and this says it in the words
                     states.md already approved for `needs-attention`. Never published:
                     the true reassurance is about the WORK, not an address — rule 4 asks
                     the state to say the site is intact, not to name a URL. */
                  sub={world.published
                    ? t({
                        en: `It has to come off before your site can go on — support can clear it for you. Your site is safe meanwhile — it’s still at ${STAGING_HOST}.`,
                        uk: `Його треба прибрати, перш ніж стане ваш — підтримка може це зробити. Ваш сайт тим часом цілий — він і далі за адресою ${STAGING_HOST}.`,
                      })
                    : t({
                        en: 'It has to come off before your site can go on — support can clear it for you. Nothing you’ve built is lost — it’s all still here.',
                        uk: 'Його треба прибрати, перш ніж стане ваш — підтримка може це зробити. Нічого зі зробленого не втрачено — усе лишається тут.',
                      })}
                  action={{
                    label: t({ en: 'Try again', uk: 'Спробувати ще' }),
                    onClick: retryPublish,
                  }}
                />
              )}
              </Reveal>

              {/* Board 28206:66756 draws a seventh state, `7 not paid`, and this is our
                  reading of it: the domain was chosen, the cart was filled and the
                  customer walked out of checkout. The world already carries that state
                  (`domain: 'checkout'` with lines in the cart — DomainModal writes both)
                  and the panel used to render it as if nothing had happened, offering
                  "Connect your own domain" over a domain already sitting in their cart.
                  ⚠️ The mapping is OURS — the board's own frame has not been re-read — so
                  the card claims nothing beyond what the world says and hands straight
                  back to the till, which is where the price lives. */}
              <Reveal show={waitingOnCheckout} pad="pt-[19px]" radius={12}>
              {waitingOnCheckout && (
                <StatusCard
                  tone="amber"
                  /* Two sentences for the two trips, because the cart holds a different
                     thing in each and the card is read WITH the cart open a press later.
                     A bought name really is sitting there as a line. An owned one is not
                     — it is free, the cart shows the plan alone — so telling that
                     customer their domain is in the cart would be contradicted by the
                     very screen the button opens. Same card, same verb, same route back;
                     only the claim is made true. */
                  title={parkedConnect
                    ? t({
                        en: `${cartDomain} connects as soon as you check out`,
                        uk: `${cartDomain} підключиться, щойно ви завершите оплату`,
                      })
                    : t({
                        en: `${cartDomain} is waiting in your cart`,
                        uk: `${cartDomain} чекає у вашому кошику`,
                      })}
                  sub={parkedConnect
                    ? t({
                        en: 'Your Remixer plan is waiting in your cart.',
                        uk: 'Ваш план Remixer чекає у вашому кошику.',
                      })
                    : t({
                        en: 'It connects on its own once checkout is done.',
                        uk: 'Він підключиться сам, щойно ви завершите оплату.',
                      })}
                  action={{
                    label: t({ en: 'Finish checkout', uk: 'Завершити оплату' }),
                    onClick: () => openPanel('cart'),
                  }}
                />
              )}
              </Reveal>

              {/* The registrant-email step (state ⑤ on board 28206:66756). THE ONLY CARD
                  ON SCREEN when it is up, and no longer a second one under a stage card:
                  the rule of 14.09.2026 gives it the slot only once the domain has
                  connected, which is the one window where nothing else has anything to
                  report — see the precedence note upstairs.
                  ⚠️ NO COUNTDOWN. The board draws "14 days left" and the world comment used
                  to say fifteen; the digit traces to Squarespace's unlink rule, not to
                  DreamHost or ICANN (states.md §5), so no figure is printed. The inbox
                  address is the board's own placeholder and stays until the world carries
                  an account email.
                  ⚠️ IT IS THE LAST STEP OF CONNECTING, NOT A WARNING ABOUT LOSING SOMETHING
                  (14.09.2026). It read "Confirm your email to keep this domain", which says
                  you have a working domain and might forfeit it. A DreamHost developer,
                  asked directly, says the opposite: the name does not resolve at all until
                  the mail is confirmed — «вебсайт поідеї не буде працювати якщо запаблішити»,
                  and on "without confirming the email the link will not work", «так». So the
                  card is the end of the purchase, and it says the one thing the customer
                  needs: it is bought, it is set up, and the address starts working when they
                  click the link. The deadline is real and unsourced, so it is not mentioned
                  at all rather than guessed at — losing the name is a later consequence of a
                  step they are being asked to take now anyway.
                  ⚠️ AND THE TITLE IS NOT A VERB, on purpose. Every other card's title names
                  what to press; the move this one needs happens in an inbox, and the panel
                  has no control for it — the same reason the dashed "Confirm email" strip was
                  thrown out of this window. "One last step" is honest about where the step is.
                  ⚠️ AND IT NAMES THE DOMAIN, inked as the subject (see StatusCard's
                  `subject`): the field above shows the FREE address in every state this card
                  is up in, so "this domain" pointed at nothing on screen. */}
              {/* ⚠️ NO PROTOTYPE STAND-IN UNDER THIS CARD. A dashed "Confirm email" strip
                  used to sit here, and the designer threw it out on sight (14.09.2026:
                  "зачем ты это ставил в окно? это же не часть интерфейса?!!!!!"). He is
                  right twice over: the panel is the PRODUCT, and the one move this state
                  is waiting for does not happen in the product at all — it happens in the
                  customer's inbox. The stand-in still exists, because the walk has to be
                  finishable; it now floats ABOVE the shell as the simulated email itself
                  (`SimulatedEmail`, App.tsx), which is where an email belongs. Do not put
                  a confirm control back inside this panel. */}

              {/* ⚠️ NO LINK BACK TO THE DOMAINS WINDOW. A quiet "See all your domains" /
                  "Use a different domain" sat here and the designer threw it out on sight
                  (14.09.2026: "что это за говно?"). It was ours, on no board, and it broke
                  his own standing rule for this window — one link, the address at the top.
                  The domains window is a click away in the topbar; a second door inside the
                  panel offered to leave in the middle of the one thing the panel is for.
                  Do not put it back. */}

              {/* ⚠️ NO "Padlock on · anyone can visit" HERE ANY MORE — see the status line
                  under the address field, which replaced it. */}

              {/* ⚠️ NO STAGING-ADDRESS BLOCK. It used to sit here, under the card, the way
                  the designer's states were drawn — and he took it out on sight
                  (13.09.2026): "у нас будет только одна ссылка отображаться в этом окне".
                  The field at the top already carries the one address the site answers to,
                  and a second link under it made the panel answer a question nobody asked
                  twice. Do not put it back.
                  ⚠️ The two RED cards do name the free address inside their sentence, and
                  that is a different thing: not a second link in the happy path, but the
                  one line that answers "have I lost my site" in the only two states where
                  the customer is asking it (states.md rule 4, and its accepted copy for
                  `needs-attention` says it word for word). */}

              {/* connect your own domain — dashed card, the state before any of this.
                  Not while a name is standing at the till: the card above is about that
                  name, and offering to start again under it reads as "your purchase went
                  nowhere". */}
              <Reveal show={!attached && !waitingOnCheckout} pad="pt-[19px]" radius={16}>
              {!attached && !waitingOnCheckout && (
                <button
                  /* the Domains window unfolds from this card (`surfaceFrom`) */
                  onClick={(e) => openDomains('home', null, fromRect(e.currentTarget))}
                  /* Hover per Figma 26125:3832: the dashed rim brightens (NA/200 →
                     NA/300) and the "+" disc fills WHITE with a dark plus — the
                     row itself keeps its fill. Colours ease over the base duration
                     so the state melts in rather than snapping. */
                  className="group flex w-full items-center gap-4 rounded-[16px] border border-dashed border-[var(--white-200)] py-4 pl-5 pr-8 text-left backdrop-blur-[16px] transition-colors duration-[var(--dur-base)] ease-std hover:border-[var(--white-300)]"
                >
                  {/* Figma 26125:3802: NA/100 fill + 15%-white rim, not the shell glass */}
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-[12px] border border-[#ffffff26] bg-[#ffffff14] text-[var(--white-700)] backdrop-blur-[16px] transition-colors duration-[var(--dur-base)] ease-std group-hover:border-[#ffffff40] group-hover:bg-white group-hover:text-[#09090b]">
                    <IconPlus size={13} />
                  </span>
                  {/*
                    * ⚠️ THE DOOR NAMES BOTH THINGS BEHIND IT (demo-readiness gate,
                    * 14.09.2026). It read "Connect your own domain", and `openDomains`
                    * opens a dashboard whose larger half is names FOR SALE — so on the
                    * commonest account of all, a paid one with no domains, the whole
                    * screen behind a door marked Connect was a shop. `Connect` in this
                    * product means attaching a name the person already owns and no money
                    * moving (copy.md §1, and the same table's `Buy` for registering a new
                    * one); a door onto both has to say both, and the two sanctioned verbs
                    * are exactly the two halves of that screen.
                    * `Buy`, not `Add`: the conflict copy.md §2 leaves open is settled the
                    * way the boards and DomainsSurface already ship it.
                    */}
                  <span className="min-w-0">
                    <span className="block text-[16px] font-semibold leading-normal text-white">
                      {t({ en: 'Buy or connect a domain', uk: 'Купити або підключити домен' })}
                    </span>
                    {/*
                      * ⚠️ AND CLAIMS ONLY WHAT THE PLAN ACTUALLY COVERS. This line used to
                      * tell a paid customer the domain was "Included in your Remixer Build
                      * plan" while every name on the other side of the door cost between
                      * $0.99 and $89.99. The plan buys the CAPABILITY — publishing on a
                      * custom domain at all — and nothing else; the name is a purchase,
                      * every time, on every plan. Said once and plainly, per copy.md's
                      * "каждое обещание — один раз": no price and no teaser here, because
                      * a first-year figure without its renewal beside it is the dark
                      * pattern the audit's rule 5 exists to stop, and prices belong on the
                      * screen that can show both.
                      * The trial line is untouched and is now framed correctly by the
                      * title: the plan is what publishing on a custom domain requires.
                      */}
                    <span className="mt-1 block text-[13px] leading-normal text-[var(--white-500)]">
                      {paid
                        ? t({
                            en: 'Your Remixer Build plan covers publishing on one',
                            uk: 'Ваш план Remixer Build покриває публікацію на ньому',
                          })
                        : t({ en: 'Requires the Remixer Build plan — $9.99/mo', uk: 'Потрібен план Remixer Build — $9.99/міс' })}
                    </span>
                  </span>
                </button>
              )}
              </Reveal>
            </div>
            {/*
              * THE LETTER — board 30425:28847, `LastStepCard`: OUTSIDE the field block (its 16 px
              * side padding would make the card 388) and inside 6 px of the body card, like the
              * in-flight card above (`pad`). Up once the domain has connected and the letter is
              * owed — and, while the address spreads, only after the explanation has had its
              * five seconds and folded (`letterUp`). Unlink lives inside it; the domain row
              * below stays down while it is up.
              *
              * ⚠️ NO PROTOTYPE STAND-IN UNDER THIS CARD. A dashed "Confirm email" strip used to
              * sit here, and the designer threw it out on sight (14.09.2026: "зачем ты это ставил
              * в окно? это же не часть интерфейса?!!!!!"). The one move this state waits for
              * happens in the customer's inbox; the stand-in floats ABOVE the shell as the
              * simulated email itself (`SimulatedEmail`, App.tsx). Do not put a confirm control
              * back inside this panel.
              */}
            <Reveal show={letterUp} pad="px-1.5 pb-1.5" radius={12}>
              {letterUp && (
                <LastStepCard
                  domain={world.customDomain}
                  resent={resent}
                  onResend={() => setResent(true)}
                  onUnlink={unlinkDomain}
                  /* The explanation is the STABLE half and the acknowledgement the moving one:
                     `Resend` used to replace the whole text, so for nine seconds the card stopped
                     saying why any of this was happening. */
                  sub={
                    <>
                      {t({
                        en: 'It’s bought and set up — the address starts working once you confirm your email. ',
                        uk: 'Він куплений і налаштований — адреса запрацює, щойно ви підтвердите email. ',
                      })}
                      {resent
                        ? t({ en: 'Sent again to ', uk: 'Надіслали ще раз на ' })
                        : t({ en: 'We sent the link to ', uk: 'Посилання надіслали на ' })}
                      <span className="whitespace-nowrap font-medium text-white">roman@example.com</span>
                      {resent ? t({ en: ' — check your inbox.', uk: ' — перевірте пошту.' }) : '.'}
                    </>
                  }
                />
              )}
            </Reveal>
            {/* ⚠️ THE BODY CARD'S LAST CHILD, and that is the difference the designer kept
                pointing at (14.09.2026, five times): on board 30282:19132 this card is a
                child of the same card the field lives in, so its rim sits ON that card's
                bottom edge and the two read as one surface split by a line. As a SIBLING it
                became a second card below the first, and the two radius-16 corners left a
                dark wedge between them — a gap where the board has a seam. It spans the
                body card's full 420 because it carries no px of its own; the field block
                above it does (px 16), which is why the field is 388. */}
            {/*
              * ⚠️ IT HANGS ON THE CONNECTION, NOT ON THE ALL-CLEAR (designer, 15.09.2026,
              * answering the open question left by the address rule: «нам нужно на этой
              * стадии под уведомлением о почте показать этот элемент с кнопкой для
              * отвязки»). It used to read `settled || readyCard`, so a domain that was
              * connected, set up and merely waiting on a letter could not be taken off the
              * site from the one window that owns the connection. Same line as the field
              * above it now: `domainIsHome`, i.e. connected — which also gives `unreachable`
              * and `old-site` their Unlink, and those are the states where wanting out is
              * likeliest.
              */}
            <Reveal show={showDomainRow} radius={16}>
            {showDomainRow && (
              /*
               * ⚠️ THE SEAM IS `#313133`, A RAW HEX, AND THE DESIGNER SETTLED IT TWICE IN
               * ONE DAY (15.09.2026: first «у тебя не видно разделительного бордера, в
               * макете он немножко светлее», then, against my fix, «теперь у тебя бордер
               * слишком светлый — в макете этот бордер объекта внутри которого Unlink
               * кнопка имеет цвет бордера 313133»).
               *
               * The arithmetic that argued for a token is true and beside the point: 8%
               * white over the panel's ground (`--gray-850` #1f1f22) does flatten to 48.9
               * = #313133, so the hex LOOKS like `NA/100` frozen against a darker
               * backdrop. But board 30289:60056 binds this stroke to no variable at all
               * while binding everything else in the card (the text to
               * Text/Default/Secondary), and an unbound stroke in a file whose tokens are
               * otherwise complete is a decision, not a leftover. Composited, it came out
               * (56,56,58) — brighter than the board, which is what he saw.
               *
               * So the low contrast is the design: (49,49,51) on the body card's 4% fill
               * (39,39,42) is Δ10 — a seam, not a line, and the board renders it exactly
               * that faint at 1:1. What was actually broken in the card he screenshotted
               * was the divider above it; see ProgressCard.
               */
              /*
                * THE STATUS SLOT HOLDS THE DOMAIN'S WORD, AS A CHIP DYED IN ITS TONE (designer,
                * 16.09.2026, choosing form C of the stand in `scratchpad/slot-stand/` and then
                * asking for the glass — and the ink — in the status colour). What stood here
                * before, and why it went:
                *
                *   `Secure padlock on`  — always true, therefore never news, and a claim about
                *                          a certificate that does not exist on `propagating`;
                *                          the designer struck it himself (15.09.2026).
                *   `Renews 15 Sep 2027 · $19.99/yr` — rejected the same day: not worth seeing
                *                          on every publish.
                *   nothing              — the row held `Unlink` alone for a day. He did not
                *                          want it empty: «что самое полезное и логичное что
                *                          там можно видеть?»
                *   `● Live` (a dot + a word, the bar's own form) — built, and killed by his
                *                          screenshot: two identical green dots in one column,
                *                          same inset to the text, read as a two-item list of
                *                          one status, the first item boxed for no reason.
                *
                * So the rule this slot obeys is not "news only" (my over-reading of the renewal
                * ruling) but HIS words: important enough to see every time. A status is — the
                * bar in this same panel is the precedent — and the panel now says three
                * different things on three surfaces: the TITLE is about the site (has it ever
                * gone out), this ROW is about the domain (does the address answer), the BAR is
                * about the edits (is what is out current). A live site with edits queued used
                * to be titled `Publish` with a counted bar and not one word saying the domain
                * works.
                *
                * FORM: the `Recommended` chip (`ui/Chip.tsx`), the canon's `--chip` member, so
                * the row's tag and the bar's sentence are two species and stop reading as a
                * list — and dyed, not recoloured: fill, rim and ink all take the tone
                * (`.liquid-glass--chip[data-tone]` in index.css), the rim keeping the canon's
                * diagonal so it is still the same glass. Tone and word come from
                * `domainRowStatus`, the table the topbar chip reads, so the two cannot disagree.
                */
              /* ⚠️ THE STROKE IS AN INSET SHADOW, NOT A `border` (16.09.2026, the designer on
                 this very edge: «я вообще не вижу разделительной линии»). Board 30282:19216 is
                 420 × 64 with the 1px stroke INSIDE and its content at 8 / 16 / 16 / 16; a CSS
                 border sits outside the padding box, so the row came out 66 tall with its
                 content at 19 / 17 / 17 — the standing lesson of every card in this panel,
                 missed on this one. The colour itself is HIS: «бордер сделан цветом 313133 а не
                 прозрачным белым, потому что… прозрачный бордер наложится на прозрачный бордер
                 и получится 8 % вместо 4-х» — #313133 is 4 % white flattened over the body
                 card's 4 % fill, opaque so the edge it shares with the body card's rim does
                 not double. Measured on the live build: stroke (49,49,51) = #313133 exactly,
                 crisp 2 device px, on the fill (39,39,42); the body card's own rim reads
                 (47,47,50) — the two lines are one weight, as he intended.
                 ✅ AND THE TOP EDGE ALONE IS #353538 (designer, 16.09.2026, night, with the top
                 edge circled: «сделать разделительную линию цветом 353538, а то её практически не
                 видно… только у верхней части этого блока»). A second inset shadow, offset 1px
                 DOWN with no spread, paints exactly the top hairline — tapering off round the
                 upper corners, nothing on the sides or the bottom — and lies OVER the ring, so
                 the top row reads #353538 and everything else stays #313133. Both opaque: his
                 own rule against stacking translucent strokes. */
              <div className="flex items-center justify-between rounded-[16px] py-4 pl-[18px] pr-4 shadow-[inset_0_1px_0_0_#353538,inset_0_0_0_1px_#313133]">
                {/* The word changing inside the row (Setting up → Waiting on your email → Live):
                    the old chip leaves, the new one comes up (motion.ts `swapText`). The slot
                    around them is always there, so `Unlink` keeps its end of the row while the
                    left is empty for a beat. */}
                <span className="flex min-w-0 items-center">
                  <AnimatePresence mode="wait" initial={false}>
                    {rowStatus && (
                      <motion.span key={rowStatus.word.en} className="flex" variants={swapText} initial="initial" animate="animate" exit="exit">
                        {/* WHAT THE WORD MEANS — a glass tooltip above the chip (designer,
                            16.09.2026: «непонятно что значат эти статусы… что такое "Ready"?»).
                            The words live with the status table so they cannot drift apart. */}
                        <Tooltip text={rowStatus.hint}>
                          <Chip label={rowStatus.word} tone={rowStatus.tone} ink={world.chipInkWhite ? 'white' : 'tone'} />
                        </Tooltip>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <button
                  onClick={unlinkDomain}
                  className="press-bloom flex h-8 flex-none items-center gap-1 rounded-[8px] pl-4 pr-1.5 text-[14px] font-medium text-[var(--white-560)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
                >
                  {/* ⚠️ THE WORD IS CAP-TRIMMED, like the letter's Unlink (designer, 16.09.2026, on
                      this button: «текст в кнопке анлинк кривой»). Board 30282:19216 centres the
                      label's 9px CAP band in the 32 button (y 11.5) beside a 20 icon (y 6) — both
                      on 16. A raw 14px line box carries descender room under the caps, so `items-
                      center` sat the glyphs ~1.5px HIGH of the icon and the word read crooked. */}
                  {/* …and 1px DOWN from that centre, the mode pill's optical correction: with the cap
                      band centred the word still read high («на несколько пикселей выше чем нужно»).
                      Ink at 2×: word 23–41 (centre 32.0), icon 19–48 (centre 33.5), lowercase body
                      28–41 (34.5). One whole pixel — a half would blur the glyphs. */}
                  <span className="translate-y-px [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">{t({ en: 'Unlink', uk: 'Відв’язати' })}</span>
                  <IconUnlink size={20} />
                </button>
              </div>
            )}
            </Reveal>
            </div>
          </div>

          {/* ---------------------------------------------------------- button bar */}
          {/* One button. The old "Refresh status" lived here because the panel had no
              way to say what a connection was doing; now each state says it, and every
              state that needs the customer carries its own action inside its card.
              Blue while it publishes, quiet when it does not — a panel whose primary slot
              is blue whatever it does teaches people not to read it.
              ⚠️ AND IT DOES NOT CLOSE THE PANEL ON THE BEAT AFTER A PUBLISH. The press
              that publishes turns this button from a verb into an exit under the finger
              that pressed it, so the second half of a double-click dismissed the panel
              and the payoff was never seen at all (gate, 14.09.2026). While `settling`
              the button holds the result instead — see PUBLISH_SETTLE_MS. */}
          {/*
            * ⚠️ THE COUNT IS A LINE IN THIS BAR, far left, on the button's own baseline
            * (Figma 28071:53189): 12px regular `#c7ccd6` behind an 8px `--action` dot at
            * a 6px gap, then a spacer, then the button. The board's metrics are the bar's:
            * pl 24 / pr 16, content height 40 — which is the button's own height, so the
            * bar's py 16 is untouched and nothing below the card moves.
            *
            * `#c7ccd6` is a literal because it is not one of ours: the panel's greys are
            * white-alpha (`--white-400/500`) over `gray-850`, and this is an opaque cool
            * grey with a blue cast. Close to `--white-700` and not equal to it. Shipped as
            * drawn and flagged rather than snapped to the nearest token, which is how a
            * board's colour quietly becomes a different colour.
            *
            * ⚠️ AND THE BOARD DRAWS ONLY THIS STATE. There is no drawn treatment for zero
            * changes, so there is none here — the line is simply absent, and no
            * "everything is published" sentence was invented to fill the space.
            */}
          <div className="flex items-center justify-end py-4 pl-6 pr-4">
            {/* ⚠️ AND THE ZERO STATE IS DRAWN NOW (board 30282:52600): the same row, a GREEN
                dot `#50b97b`, and "Your website is up to date". The note that used to stand
                here — "the board draws only the pending state, so at zero the line is simply
                absent" — is spent: the designer drew the other half. */}
            {publishesChanges ? (
              <span className="flex items-center gap-1.5 text-[12px] leading-[1.4] text-[#c7ccd6]">
                <span className="h-2 w-2 flex-none rounded-full bg-[var(--action)]" aria-hidden />
                {t(edits)}
              </span>
            ) : world.published && !publishes ? (
              <span className="flex items-center gap-1.5 text-[12px] leading-[1.4] text-[#c7ccd6]">
                <span className="h-2 w-2 flex-none rounded-full bg-[#50b97b]" aria-hidden />
                {t({ en: 'Your website is up to date', uk: 'Ваш сайт актуальний' })}
              </span>
            ) : null}
            <span className="flex-1" />
            <button
              onClick={() => { if (publishes) beginPublish() }}
              disabled={(!publishes && !settleLabel) || publishing}
              aria-disabled={settleLabel || undefined}
              aria-busy={publishing || undefined}
              className={
                publishing
                  /* THE BUSY BEAT (PUBLISHING_MS): blue, unpressable, an 18px white arc turning at
                     pl 12 with 8 to the word (the designer's frame), the word in the white sweep */
                  ? 'flex h-10 cursor-default items-center gap-2 rounded-[10px] bg-[var(--action)] pl-3 pr-5 text-[14px] font-semibold text-white'
                  : publishes
                  ? 'h-10 rounded-[10px] bg-[var(--action)] px-5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]'
                  : settleLabel
                    ? 'h-10 cursor-default rounded-[10px] border border-[var(--white-100)] px-5 text-[14px] font-semibold text-[var(--white-500)] transition-colors duration-[var(--dur-fast)] ease-std'
                    /* ⚠️ The board's own disabled variant (30282:52600 → component
                       36:727): an OUTLINE, `Neutral Alpha/200` rim with a 32%-white label,
                       no fill. Not the filled dim plate the topbar and Home's Build wear —
                       those sit on the shell's ground, this sits on a panel. */
                    : 'h-10 cursor-not-allowed rounded-[10px] border border-[var(--white-200)] px-5 text-[14px] font-semibold text-[#ffffff52]'
              }
            >
              {publishing && (
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" className="flex-none" aria-hidden>
                  {/* a 270° arc, r 9, stroke 2.2 — the frame's proportions on a 40 button */}
                  <path d="M12 3a9 9 0 1 1-9 9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" className="step-spin" />
                </svg>
              )}
              {publishing ? <span className="shimmer-ink busy-ink">{t(primary)}</span> : t(primary)}
            </button>
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
