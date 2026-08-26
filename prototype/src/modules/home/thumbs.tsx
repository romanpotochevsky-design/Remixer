/**
 * Website thumbnails for the Home page cards and the template picker — drawn, not
 * photographed.
 *
 * Figma (28375:43006 "Templates", 28364:40053 "My projects", 28616:59168 — the
 * fullscreen template picker) fills every card with a screenshot of a real-looking
 * website. We cannot ship those screenshots: the published artifact runs under a CSP
 * that blocks every external request, and the single-file artifact build would have to
 * carry ten full-page JPEGs as base64. So each thumbnail is recreated here as markup —
 * the same dominant background, the same accent, the same layout skeleton — a miniature
 * that reads as the same site at a glance.
 *
 * THE SIZE CONTRACT. A card is 238×218 in the mockup, but the Home page will render these
 * at whatever size its grid resolves to, and one drawing has to survive all of them. So
 * the root declares `container-type: size` and **every** dimension inside — padding, gap,
 * font size, radius, hairline — is a container-query unit or a percentage. `cqw` for
 * anything horizontal and for type (a screenshot scales with its width), `cqh` for
 * vertical rhythm. No px, no rem, no Tailwind spacing utilities: any of those would freeze
 * the drawing at one size. Verified at 210×160 and 480×360.
 *
 * TWO HOMES, ONE DRAWING. Every one of these has to hold at ~233×218 in a card AND at
 * the detail preview's box, which is far wider than it is tall. Those two are not the same
 * picture scaled: type is sized in `cqw`, so a headline that eats 13% of the card's height
 * eats ~25% of a 1616×804 box. An element at an absolute `top: 28.5%` therefore agrees
 * with the headline above it at exactly ONE aspect — which is what the hand-patched
 * `28.5%, not 25` offsets in this file's history were papering over.
 * So: LAY SITES OUT IN FLOW (nav / hero / band), and let each block push the next.
 *   · Structural insets keep their old numbers by switching `top: 14%` for a `cqh` margin —
 *     `cqh` is 1% of the CONTAINER's height at any nesting depth, so the card lands on the
 *     same pixel while the block below is free to move.
 *   · Where a gap is SLACK rather than a measurement, make it a weighted spacer
 *     (`flexGrow: <the board's own gap>`, `flexBasis: 0`): the proportion holds the card
 *     exactly and the gaps give way together at any other aspect.
 *   · A band whose content is real text sizes to that text (auto height + the padding the
 *     fixed band had spare on the card). A fixed percentage clips the type.
 *   · Absolute stays only for things that OVERLAP — a card over a photo, plates over a
 *     glow, a wordmark under a wave. Each says why in a comment.
 *   · An object whose SHAPE matters (a jar, an arch, a plate, a phone) gets `aspect-ratio`
 *     with ONE percentage dimension. Sized in both axes it squashes; sized off `cqw` alone
 *     it outgrows a short box — e.g. crypto's orb, 15cqw, was 242px inside a 217px band.
 *   · Six of these pages are taller than a 1616×804 box even in flow. That is the fold:
 *     the sections the boards already describe as "cut by the card edge" simply show less
 *     of themselves. It is not a layout error, and it is a design question — see the
 *     handoff note in the session log.
 * ⚠️ Two Chromium facts, both learnt the expensive way, both about keeping the CARD
 * byte-identical while the markup changes underneath it:
 *   · A `transform` on an element re-rasterises its gradient/blur on its own pixel grid.
 *     `translate(-50%)` centring is NOT free: swapping it for flow centring (or the other
 *     way) moves a soft edge by a fraction of a pixel and lights up thousands of pixels in
 *     a diff. Where a shape was centred by transform, keep the transform (media's arch);
 *     where a box was centred by `left: 50%`, `margin-inline: auto` is an eighth of a pixel
 *     off, so pills keep the transform too (saas, crypto).
 *   · Positioned elements paint ABOVE non-positioned in-flow ones regardless of order. A
 *     band that used to be `absolute` and covered the hero stops covering it the moment it
 *     becomes a plain flow child — synco's storefront strip needed `relative` back, or the
 *     wave's bottom curve printed over it.
 *
 * Headline lines are `whitespace-nowrap` with explicit `<br/>`s. Letting them wrap on
 * their own is what breaks these layouts: a headline that reflows into one extra line
 * walks straight into the photo below it, and it does so only at some sizes.
 * Every line of REAL text carries an explicit `line-height`; left at `normal` the display
 * face resolves near 1.5, which is a whole extra half-line under a fixed-height row.
 *
 * NO PEOPLE. Four of the six home-board thumbnails are built around a photograph of a
 * person; the picker's restaurant card is built around plates of food. We never draw a
 * person, and we never draw a photo-real dish. Each becomes an abstract gradient block in
 * the same position at the same aspect — it carries the composition and reads as "image"
 * without faking a face.
 * Body copy is bars for the same reason: at 210px wide a real sentence is unreadable mush,
 * and a wireframe bar is the honest way to say "paragraph goes here".
 *
 * Class names are always full literals — Tailwind purges anything assembled at runtime.
 */
import type { CSSProperties, ReactNode } from 'react'

/**
 * One id per thumbnail. Ids name the *site* that is drawn, not the card's caption:
 * Figma's template captions describe different products than their screenshots show
 * (the card called "Budget Dashboard" is a media agency, "Fashion Storefront" is an
 * architecture studio), which is placeholder pairing on the designer's part. See
 * `src/data/templates.ts`, where each row records which of these it draws.
 */
export type ThumbId =
  | 'payments'      // PayNexus — dark-green fintech landing page
  | 'homeware'      // AURA — cream supplement brand
  | 'campaign'      // Synco — black hero with an oversized wordmark
  | 'media'         // WE MAKE MEDIA — dark editorial agency
  | 'architecture'  // ArchiForm — light architecture studio
  | 'wellness'      // Serena — pale sage mental-health site
  | 'agency'        // Synco® Creative Agency — the same brand's full agency page
  | 'saas'          // WorkPro — bright blue social-media SaaS landing
  | 'restaurant'    // burgundy restaurant, its food photography drawn as discs
  | 'crypto'        // MineMax — near-black crypto-mining landing with a violet orb
  // Eight more brands, added so the picker's grid stops repeating itself — one per
  // vertical the filter chips promise, each with its own dominant colour.
  | 'coffee'        // MERIDIAN — cream-over-espresso coffee roaster store
  | 'fashion'       // ODEON — black-on-white editorial lookbook store
  | 'devtools'      // forge — blue-black developer-tools landing, monospace accents
  | 'analytics'     // Lumen — light, chart-led AI analytics product page
  | 'photography'   // KORE STUDIO — near-black portfolio, image mosaic, no copy
  | 'lawfirm'       // HALE & MARCH — deep-navy law firm, type only, no images at all
  | 'yoga'          // Still — warm-sand yoga studio, one tone, big calm type
  | 'barbershop'    // IRONSIDE — charcoal barbershop with a single vermilion accent
  | 'synco'         // synco.com — the customer's own store, on the project card

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')

/* ────────────────────────────── shared primitives ─────────────────────────────
   Every one of these sites is built from the same handful of parts: a nav row, a
   headline, paragraph bars, a pill button, an image block. Drawing them once keeps
   each site component down to its actual composition instead of a wall of styles.   */

/** One wireframe bar — a line of body copy, or a nav link. */
function Bar({ w, h, color, radius = '99em' }: { w: string; h: string; color: string; radius?: string }) {
  return <span className="block shrink-0" style={{ width: w, height: h, background: color, borderRadius: radius }} />
}

/** A stack of copy bars. The last one is short, the way a last line of text is. */
function Copy({
  rows, color, w, h = '1.4cqh', gap = '1.5cqh', center,
}: { rows: number; color: string; w: string; h?: string; gap?: string; center?: boolean }) {
  return (
    <div className={cx('flex flex-col', center && 'items-center')} style={{ gap, width: w }}>
      {Array.from({ length: rows }, (_, i) => (
        <Bar key={i} w={i === rows - 1 ? '62%' : '100%'} h={h} color={color} />
      ))}
    </div>
  )
}

/** The nav-link cluster. Individual links are illegible at this scale — bars it is. */
function NavLinks({ n, color, w = '4.4cqw', gap = '2.6cqw' }: { n: number; color: string; w?: string; gap?: string }) {
  return (
    <div className="flex items-center" style={{ gap }}>
      {Array.from({ length: n }, (_, i) => <Bar key={i} w={w} h="1.1cqh" color={color} />)}
    </div>
  )
}

/** A button. Label text under ~6px is noise, so buttons carry a bar instead of a word. */
function Pill({
  w, bg, border, label, h = '5cqh',
}: { w: string; bg?: string; border?: string; label?: string; h?: string }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: w, height: h, background: bg, boxShadow: border ? `inset 0 0 0 0.4cqw ${border}` : undefined }}
    >
      <Bar w="52%" h="1.1cqh" color={label ?? '#00000000'} />
    </span>
  )
}

/** A cluster of overlapping avatars — the social-proof device three of these sites use. */
function Avatars({ size, ring, tones }: { size: string; ring: string; tones?: string[] }) {
  return (
    <div className="flex shrink-0">
      {(tones ?? ['#c9a184', '#8fa8c4', '#d9a89a']).map((c, i) => (
        <span
          key={c}
          className="block rounded-full"
          style={{ width: size, height: size, background: c, marginLeft: i ? '-1.1cqw' : 0, boxShadow: `0 0 0 0.4cqw ${ring}` }}
        />
      ))}
    </div>
  )
}

/** The brand wordmark — the one piece of small type that must stay real text. */
function Wordmark({ children, color, size = '3.8cqw' }: { children: ReactNode; color: string; size?: string }) {
  return (
    <span
      className="whitespace-nowrap font-display font-semibold"
      style={{ color, fontSize: size, letterSpacing: '-0.01em' }}
    >
      {children}
    </span>
  )
}

/**
 * Stand-in for a photograph. Figma shows a real photo here; we show a gradient at the
 * same position and aspect. `children` is for the small overlays the mockups float on
 * top of their photos.
 */
function Photo({
  style, className, children,
}: { style?: CSSProperties; className?: string; children?: ReactNode }) {
  return <div className={cx('overflow-hidden', className)} style={style}>{children}</div>
}

/* ──────────────────────────────── the drawn sites ──────────────────────────────── */

/**
 * PayNexus — dark-green fintech landing page (Figma "image 383").
 * Split hero: headline and lime CTA left, a photo of a man holding a phone right with a
 * white payment card floating over its left edge. The photo is a gradient; the payment
 * card is drawn for real, because it is the thing that makes the site read as fintech.
 */
function Payments() {
  return (
    <div className="relative flex h-full w-full flex-col font-sans" style={{ background: '#1d2a19' }}>
      <div className="flex shrink-0 items-center justify-between" style={{ height: '10cqh', paddingInline: '4cqw' }}>
        <Wordmark color="#ffffff">PayNexus</Wordmark>
        <NavLinks n={4} color="#ffffff66" />
        <div className="flex items-center" style={{ gap: '2.2cqw' }}>
          <Bar w="3.4cqw" h="1.1cqh" color="#ffffff8c" />
          <Pill w="9cqw" h="4.6cqh" bg="#b4ef4d" label="#1d2a1966" />
        </div>
      </div>

      {/* THE HERO BAND, in flow: the copy column, the photograph and the two things that
          float over it. The column and the photo used to be absolute at `top: 14%` and
          `top: 13%` of the card — fine there, but the headline is three lines of `cqw`
          type, so at another aspect the column would walk into the pale section below.
          The band is what the nav and that section leave, and everything inside is
          measured from IT. */}
      <div className="relative flex-1">
        {/* the photo of the man with the phone */}
        <Photo
          className="absolute"
          style={{
            right: '3.5cqw', top: '3cqh', width: '38cqw', height: '78.95%', borderRadius: '2cqw',
            background:
              'radial-gradient(38% 26% at 72% 22%,#f6d7ae 0%,#f6d7ae00 66%),' +
              'linear-gradient(212deg,#d7ddcb 0%,#a7b195 28%,#74805e 60%,#3f4a2b 100%)',
          }}
        >
          {/* The phone in his hand, hinted rather than drawn. Its own SHAPE is held by
              `aspect-ratio` — as 23% × 46% of a panel that turns landscape at the wide end
              it came out a fat slab, and a slab does not read as a phone. */}
          <span className="absolute" style={{ right: '15%', top: '30%', height: '46%', aspectRatio: '0.33842', background: '#12180db3', borderRadius: '1.2cqw' }} />
        </Photo>

        {/* the payment card, overlapping the photo's left edge */}
        <div
          className="absolute flex flex-col bg-white"
          style={{ left: '45cqw', top: '15.0072cqh', width: '25cqw', padding: '2.2cqw', gap: '1.5cqh', borderRadius: '1.6cqw' }}
        >
          <div className="flex items-center" style={{ gap: '1.4cqw' }}>
            <span className="block shrink-0" style={{ width: '3.2cqw', height: '3.2cqw', background: '#1d2a19', borderRadius: '0.7cqw' }} />
            <Copy rows={2} color="#1d2a1926" w="100%" h="0.85cqh" gap="0.8cqh" />
          </div>
          <p className="font-display font-semibold tabular-nums" style={{ color: '#1d2a19', fontSize: '4.2cqw', letterSpacing: '-0.02em' }}>
            $1,799,980
          </p>
          <Bar w="46%" h="0.95cqh" color="#1d2a1926" />
          <span className="block" style={{ height: '4cqh', background: '#1d2a190f', borderRadius: '0.7cqw' }} />
          <span className="block" style={{ height: '4cqh', background: '#1d2a190f', borderRadius: '0.7cqw' }} />
          <Pill w="100%" h="5cqh" bg="#1d2a19" label="#ffffff59" />
        </div>

        {/* the reassurance line the mockup sets over the bottom-right of the photo */}
        <div className="absolute" style={{ right: '5cqw', bottom: '8cqh', width: '19cqw' }}>
          <Copy rows={3} color="#ffffff80" w="100%" h="1.1cqh" gap="1cqh" />
        </div>

        {/* hero copy */}
        <div className="relative" style={{ paddingLeft: '4.5cqw', paddingTop: '4cqh', width: '45cqw' }}>
          <p
            className="whitespace-nowrap font-display font-semibold text-white"
            style={{ fontSize: '5cqw', lineHeight: 1.16, letterSpacing: '-0.03em' }}
          >
            Fast, Smart &amp;<br />Secure Digital<br />Payment{' '}
            <span style={{ color: '#b4ef4d', borderBottom: '0.45cqw solid #b4ef4d', paddingBottom: '0.3cqh' }}>
              Solutions
            </span>
          </p>
          <div style={{ marginTop: '5cqh' }}><Copy rows={2} color="#ffffff40" w="30cqw" h="1.2cqh" gap="1.3cqh" /></div>
          <div style={{ marginTop: '4.5cqh' }}><Pill w="20cqw" h="5.6cqh" bg="#b4ef4d" label="#1d2a1966" /></div>
          <div className="flex items-center" style={{ marginTop: '6cqh', gap: '2.2cqw' }}>
            <Avatars size="4.2cqw" ring="#1d2a19" tones={['#e8c9a8', '#b4ef4d', '#8fa8c4', '#d9a89a']} />
            <Copy rows={2} color="#ffffff4d" w="15cqw" h="1cqh" gap="1cqh" />
          </div>
        </div>
      </div>

      {/* the next section, cut off by the card's bottom edge */}
      <div className="relative shrink-0" style={{ height: '14cqh', background: '#f4f4ef' }}>
        <span
          className="absolute"
          style={{ left: '4cqw', top: '40%', width: '19cqw', height: '100%', background: 'linear-gradient(160deg,#c9a184,#6d5240)', borderRadius: '1.6cqw' }}
        />
      </div>
    </div>
  )
}

/**
 * AURA — cream supplement brand (Figma "image 381").
 * Centred headline over a hero jar, a dark-green band of partner logos, then a white
 * section the card edge cuts into. The mockup sets the headline in a serif; the prototype
 * ships no serif face, so it is the display family with tight tracking — the silhouette
 * matches even though the face cannot.
 */
function Homeware() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#f0ebdf' }}>
      <div className="flex shrink-0 items-center justify-between" style={{ height: '9cqh', paddingInline: '4.5cqw' }}>
        <Wordmark color="#22331f" size="4.2cqw">AURA</Wordmark>
        <Pill w="12cqw" h="4.2cqh" bg="#3f6b3a" label="#ffffff8c" />
      </div>

      <p
        className="shrink-0 whitespace-nowrap text-center font-display font-semibold"
        style={{ marginTop: '3.0046cqh', color: '#22331f', fontSize: '5cqw', lineHeight: 1.2, letterSpacing: '-0.02em' }}
      >
        Fuel Sustainable Growth. Power<br />Exceptional Performance.
      </p>

      {/* THE PRODUCT BAND. Everything in it used to hang off the card at absolute tops
          (32 / 28 / 33 / 24 %), under a centred headline whose two `cqw` lines take 12.8%
          of the card's height but 27% of a 1616×804 box — so at the wide end the headline
          printed straight through the jar and through VITAMINS. The band is a flow item
          now: it starts wherever the headline ends. Its own height stays 45.17cqh (the
          98.5px it had on the card) rather than taking the slack, because its contents are
          type and a product shot that grow with `cqw` too; the sections below it drop below
          the fold instead, the way a real page in a short window does.
          The four blocks stay absolute INSIDE the band — the dots overlap the headline's
          line, and the jar has to sit at a measured 38cqw, not at a flex position. */}
      <div className="relative shrink-0" style={{ height: '45.1723cqh' }}>
        {/* left column: "VITAMINS" + copy + CTA */}
        <div className="absolute" style={{ left: '4.5cqw', top: '7.1723cqh', width: '23cqw' }}>
          <p className="font-display font-semibold" style={{ color: '#22331f', fontSize: '4cqw', letterSpacing: '0.02em' }}>
            VITAMINS
          </p>
          <div style={{ marginTop: '2.4cqh' }}><Copy rows={3} color="#22331f33" w="100%" h="1.1cqh" gap="1.3cqh" /></div>
          <div style={{ marginTop: '3cqh' }}><Pill w="14cqw" h="4.4cqh" bg="#3f6b3a" label="#ffffff8c" /></div>
        </div>

        {/* The hero jar — a product, so it can be drawn: neck, body, label. Its height is
            90.78% of the band and its width follows by `aspect-ratio`: at 22cqw × 41cqh it
            came out almost square at the wide end, which reads as a tin, not a jar. */}
        <div className="absolute" style={{ left: '38cqw', top: '3.1723cqh', height: '90.78%', aspectRatio: '0.57345' }}>
          {/* lid */}
          <span className="absolute left-1/2 -translate-x-1/2" style={{ top: 0, width: '46%', height: '9%', background: '#b9cbab', borderRadius: '0.6cqw 0.6cqw 0.2cqw 0.2cqw' }} />
          {/* glass body — the sheen lives in the gradient so the silhouette stays clean */}
          <span
            className="absolute inset-x-0"
            style={{
              top: '7%', bottom: 0, borderRadius: '3.6cqw 3.6cqw 2.6cqw 2.6cqw',
              background:
                'linear-gradient(96deg,#ffffff59 0%,#ffffff00 22%),' +
                'linear-gradient(168deg,#e6eee0 0%,#c2d6b4 34%,#9cbb89 74%,#7b9d6b 100%)',
            }}
          />
          {/* label */}
          <span className="absolute left-1/2 -translate-x-1/2" style={{ top: '42%', width: '74%', height: '27%', background: '#ffffff66', borderRadius: '0.7cqw' }} />
        </div>

        {/* the small product card the mockup pins near the right edge */}
        <div className="absolute bg-white" style={{ right: '7cqw', top: '8.1769cqh', width: '13cqw', padding: '1.3cqw', borderRadius: '1.2cqw' }}>
          <span className="block" style={{ height: '8cqh', background: 'linear-gradient(150deg,#dfe8d6,#9fbc8e)', borderRadius: '0.8cqw' }} />
          <div style={{ marginTop: '1.3cqh' }}><Copy rows={2} color="#22331f26" w="100%" h="0.85cqh" gap="0.8cqh" /></div>
        </div>
        <div className="absolute flex flex-col" style={{ right: '2.5cqw', top: '-0.8349cqh', gap: '1.2cqh' }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block rounded-full" style={{ width: '2.2cqw', height: '2.2cqw', background: '#22331f' }} />
          ))}
        </div>
      </div>

      {/* "Protected and Featured On" — the dark-green band of partner logos */}
      <div className="relative flex shrink-0 flex-col items-center justify-center" style={{ height: '16cqh', background: '#2f5233', gap: '2cqh' }}>
        <Bar w="19cqw" h="1.1cqh" color="#ffffff59" />
        <div className="flex items-center" style={{ gap: '3.6cqw' }}>
          {['12cqw', '8cqw', '11cqw', '8cqw', '13cqw'].map((w, i) => <Bar key={i} w={w} h="1.7cqh" color="#ffffffa6" />)}
        </div>
      </div>

      {/* The white section below, cut off by the card edge. Height is its own type plus
          the 1.4cqh the 14%-tall band had spare on the card — fixed, its second line fell
          out of the bottom at the wide end. */}
      <div className="relative flex shrink-0 items-center bg-white" style={{ paddingBlock: '1.3991cqh', paddingInline: '4.5cqw', gap: '4cqw' }}>
        <Photo style={{ width: '24cqw', aspectRatio: '2.40943', borderRadius: '1.2cqw', background: 'linear-gradient(150deg,#d9e2ea,#8f9aa4)' }} />
        <p className="whitespace-nowrap font-display font-semibold" style={{ color: '#22331f', fontSize: '4.6cqw', lineHeight: 1.14, letterSpacing: '-0.02em' }}>
          Pure Power. Zero<br />Compromise.
        </p>
      </div>
    </div>
  )
}

/**
 * The Synco hero: black page, a blue wave sweeping in from the left and the wordmark blown
 * up until it runs off the right edge (Figma "image 382"). Shared by the Marketing
 * Campaign Hub template card and the synco.com project card — see `Synco` below.
 */
function SyncoHero({
  children, below = 37.2,
}: { children?: ReactNode; /** air under the wordmark, in cqh — see the hero comment */ below?: number }) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#050505' }}>
      <div className="relative z-10 flex shrink-0 items-center justify-between" style={{ height: '13cqh', paddingInline: '5cqw' }}>
        <Wordmark color="#ffffff" size="4.8cqw">Synco</Wordmark>
        <div className="flex items-center" style={{ gap: '4cqw' }}>
          <span className="relative">
            <span style={{ color: '#ffffff', fontSize: '3.2cqw' }}>Home</span>
            <span className="absolute inset-x-0" style={{ bottom: '-0.9cqh', height: '0.45cqh', background: '#ffffff' }} />
          </span>
          <Bar w="5.4cqw" h="1.2cqh" color="#ffffff8c" />
          <Bar w="4.2cqw" h="1.2cqh" color="#ffffff8c" />
        </div>
      </div>

      {/* THE HERO. The oversized wordmark used to be pinned at `top: 38%` of the card —
          which is where it belongs at the card's aspect and nowhere else: at 1616×804 the
          same 27cqw word is 436px tall, so on the project card the storefront strip below
          cut it through the middle. It is a flow item now, and the space above and below
          it is two WEIGHTED spacers carrying the board's own gaps (25cqh above; `below`
          differs per crop — 37.2cqh for the hero on its own, 14.19cqh when the strip is
          under it). Whatever the box does to the hero's height, the two gaps give way
          together and the word stays whole. */}
      <div className="relative flex flex-1 flex-col">
        {/* the faint column rules the mockup shows under the nav */}
        {['16%', '48%', '80%'].map((left) => (
          <span key={left} className="absolute inset-y-0" style={{ left, width: '0.25cqw', background: '#ffffff14' }} />
        ))}

        <span className="block" style={{ flexGrow: 25, flexBasis: 0 }} />
        <div className="relative shrink-0" style={{ paddingLeft: '36cqw' }}>
          {/* the blue wave: one blob, made organic by lopsided percentage radii. It rides
              WITH the wordmark (4.1cqh below its centre, as on the board) instead of
              being pinned to the card, and `aspect-ratio` keeps it a wave — sized in both
              axes it flattened into a lens at the wide end. */}
          <span
            className="absolute"
            style={{
              // half the blob's own height is 72cqw / 1.63732 / 2 — spelling it out beats
              // translateY(-50%), which re-rasterises the gradient's edge on its own grid
              left: '-20cqw', top: 'calc(50% - 21.9866cqw + 4.0908cqh)', width: '72cqw', aspectRatio: '1.63732',
              background: 'linear-gradient(112deg,#1636b4 0%,#2b66ec 48%,#5f97ff 100%)',
              borderRadius: '38% 62% 34% 66% / 78% 52% 48% 22%',
            }}
          />
          <p
            className="relative whitespace-nowrap font-display font-semibold text-white"
            style={{ fontSize: '27cqw', lineHeight: 0.86, letterSpacing: '-0.045em' }}
          >
            Synco
          </p>
        </div>
        <span className="block" style={{ flexGrow: below, flexBasis: 0 }} />
      </div>
      {children}
    </div>
  )
}

/** Card 3 — the Synco hero on its own, which is exactly the crop the mockup shows. */
function Campaign() {
  return <SyncoHero />
}

/**
 * WE MAKE MEDIA — dark editorial agency page (Figma "image 387").
 * Oversized cream display type across the top, a portrait in an arch with a blurred band
 * across the eyes, then a cream section reading "THIS IS UI/UX". The portrait is a
 * gradient in the arch: see NO PEOPLE.
 */
function Media() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#37422f' }}>
      <div className="relative z-10 flex shrink-0 items-center justify-between" style={{ height: '9cqh', paddingInline: '4cqw' }}>
        <div className="flex items-center" style={{ gap: '1.4cqw' }}>
          <span className="block rounded-full" style={{ width: '2.8cqw', height: '2.8cqw', background: '#efe8da' }} />
          <Copy rows={2} color="#efe8da8c" w="11cqw" h="0.85cqh" gap="0.8cqh" />
        </div>
        <div className="flex items-center" style={{ gap: '3cqw' }}>
          <NavLinks n={3} color="#efe8da8c" w="4cqw" gap="3cqw" />
          <Pill w="10cqw" h="4cqh" bg="#efe8da" label="#37422f80" />
        </div>
      </div>

      {/* THE HERO in flow: display line, then the arch row, then the centred copy. The
          five blocks were absolute at 13 / 27.5 / 30 / 31 / 67 % of the card, and at the
          wide end the `cqw` display line grew down into the bar under it while `Human`
          landed on the portrait. Stacked, each pushes the next. */}
      <div className="relative flex flex-1 flex-col">
        <p
          className="shrink-0 whitespace-nowrap font-display font-semibold"
          style={{ marginTop: '4cqh', marginLeft: '3.5cqw', color: '#efe8da', fontSize: '10.8cqw', lineHeight: 1, letterSpacing: '-0.035em' }}
        >
          WE MAKE MEDIA
        </p>

        {/* The arch row. The bar and `Human` stay absolute — they OVERLAP the portrait on
            the board (Human sits over its top-right corner), which is the one thing flow
            cannot express; both are anchored to this row, so they travel with it. */}
        <div className="relative shrink-0" style={{ marginTop: '2.9659cqh', height: '35.5118cqh' }}>
          <div className="absolute z-10" style={{ left: '4cqw', top: '2.5cqh' }}>
            <Bar w="16cqw" h="1.1cqh" color="#efe8da73" />
          </div>
          <p
            className="absolute z-10 whitespace-nowrap font-display italic"
            style={{ right: '9cqw', top: 0, color: '#efe8da', fontSize: '9.6cqw', lineHeight: 1, letterSpacing: '-0.02em' }}
          >
            Human
          </p>

          {/* the portrait, in its arch — abstract, with the mockup's blurred band at eye
              level. `aspect-ratio` holds the arch's shape: 30cqw × 32cqh agreed only at
              the card's aspect and flattened into a dome at the wide end. Still centred by
              transform rather than by `justify-center`, which lands an eighth of a pixel
              off and re-rasterises the whole gradient; the row's own height carries it in
              the flow instead. */}
          <Photo
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: '3.5118cqh', height: '32cqh', aspectRatio: '1.00205',
              borderRadius: '50% 50% 2.4cqw 2.4cqw / 44% 44% 2.4cqw 2.4cqw',
              background: 'linear-gradient(174deg,#c9a074 0%,#c9a074 34%,#a87a58 44%,#a87a58 58%,#33636e 66%,#254d59 100%)',
            }}
          >
            <span className="absolute inset-x-0" style={{ top: '22%', height: '15%', background: '#ded8c9b3', filter: 'blur(0.5cqw)' }} />
          </Photo>
        </div>

        <div
          className="relative z-10 flex shrink-0 flex-col items-center"
          style={{ marginTop: '4.0097cqh', marginInline: '25cqw', gap: '2.6cqh', paddingBottom: '7.6881cqh' }}
        >
          <Copy rows={3} color="#efe8da73" w="100%" h="1.05cqh" gap="1.1cqh" center />
          <Pill w="23cqw" h="4.4cqh" border="#efe8da59" label="#efe8daa6" />
        </div>
      </div>

      {/* The cream section the card edge cuts into. Its height is the type plus the
          2.89cqh the 13%-tall band had spare on the card, so THIS IS / UI/UX cannot fall
          out of the bottom of it. */}
      <div className="relative flex shrink-0 items-end" style={{ paddingTop: '2.9017cqh', background: '#efe8da', paddingInline: '4cqw', gap: '6cqw' }}>
        <p className="font-display font-semibold" style={{ color: '#2a3226', fontSize: '9cqw', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
          THIS IS
        </p>
        <p className="font-display font-semibold" style={{ color: '#2a3226', fontSize: '9cqw', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
          UI/UX
        </p>
      </div>
    </div>
  )
}

/**
 * ArchiForm — light architecture studio. Figma has no image node for this card: the frame
 * (28376:43879) carries the fill directly. Navy headline with a red brush accent, two
 * CTAs, and a photo of a blue glass facade on the right — recreated as vertical column
 * stripes, which is what that facade reduces to at thumbnail size.
 */
function Architecture() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#fbfbfd' }}>
      <div className="flex shrink-0 items-center justify-between" style={{ height: '9cqh', paddingInline: '4cqw' }}>
        <div className="flex items-center" style={{ gap: '1.2cqw' }}>
          <span className="block" style={{ width: '2.6cqw', height: '2.6cqw', background: '#1a2340', borderRadius: '0.5cqw' }} />
          <Wordmark color="#1a2340" size="3.2cqw">ArchiForm</Wordmark>
        </div>
        <div className="flex items-center" style={{ gap: '3cqw' }}>
          <NavLinks n={4} color="#1a234073" w="4cqw" gap="3cqw" />
          <Pill w="11cqw" h="4.2cqh" bg="#1a2340" label="#ffffff8c" />
        </div>
      </div>

      {/* HERO ROW, in flow: copy left, the facade bleeding off the right edge. The two
          used to be absolute siblings — the copy pinned at top 17%, the panel at top 11%
          height 71% — which only agreed at the card's aspect. As a row they cannot slide
          over each other, and the panel's height is simply what the closing strip leaves.
          The 2cqh/6cqh insets are the old 11%/17% tops, re-expressed: `cqh` is 1% of the
          CONTAINER's height at any nesting depth, so they land on the same pixel. */}
      <div className="flex flex-1" style={{ paddingTop: '2cqh' }}>
      {/* hero copy */}
      <div className="relative z-10 flex flex-1 flex-col" style={{ paddingLeft: '4cqw', paddingTop: '6cqh' }}>
        <p className="whitespace-nowrap font-display font-semibold" style={{ color: '#1a2340', fontSize: '4.9cqw', lineHeight: 1.16, letterSpacing: '-0.03em' }}>
          Shaping Architecture<br />That Moves You
          <span
            className="inline-block align-middle"
            style={{ marginLeft: '1cqw', width: '4.4cqw', height: '1.6cqh', background: 'linear-gradient(90deg,#e8483a,#f07a4e)', borderRadius: '99em', transform: 'rotate(-8deg)' }}
          />
        </p>
        <div style={{ marginTop: '4cqh' }}><Copy rows={2} color="#1a234033" w="34cqw" h="1.15cqh" gap="1.3cqh" /></div>
        <div className="flex items-center" style={{ marginTop: '4cqh', gap: '1.8cqw' }}>
          <Pill w="16cqw" h="5cqh" bg="#2b6cff" label="#ffffffa6" />
          <Pill w="16cqw" h="5cqh" border="#1a234026" label="#1a234073" />
        </div>
        <div className="flex items-center" style={{ marginTop: '6cqh', gap: '1.8cqw' }}>
          <Avatars size="3.8cqw" ring="#fbfbfd" />
          <Copy rows={2} color="#1a23401f" w="13cqw" h="0.95cqh" gap="1cqh" />
        </div>
      </div>

        {/* the facade */}
        <Photo
          className="relative shrink-0"
          style={{ width: '50cqw', borderRadius: '2cqw 0 0 2cqw', background: '#20406b' }}
        >
          <div className="flex h-full w-full">
            {['#7fa8d8', '#4a7ec0', '#dc8f4e', '#2c5a96', '#8fb6e0', '#e8a86b', '#3a6aa8', '#5f8fc9', '#24486f'].map((c, i) => (
              <span key={i} className="block h-full flex-1" style={{ background: `linear-gradient(180deg,${c} 0%,#1a2f4d 100%)`, opacity: i % 2 ? 0.92 : 1 }} />
            ))}
          </div>
          {/* floor lines — the difference between a stripe pattern and a building */}
          {['14%', '31%', '48%', '65%', '82%'].map((top) => (
            <span key={top} className="absolute inset-x-0" style={{ top, height: '0.3cqw', background: '#0c1a2e40' }} />
          ))}
          {/* The small project card floats over the panel, so it lives INSIDE it now.
              Absolute is right here — the card overlaps the image, the one thing flow
              cannot express. Its offset is `cqh` (= 1% of the CONTAINER's height at any
              depth), so 11cqh of chrome above the panel + 41.01cqh is the board's old
              `top: 52%` to the pixel, and it stays put as the panel resizes. */}
          <div
            className="absolute flex items-center bg-white"
            style={{ right: '4cqw', top: '41.0072cqh', width: '27cqw', padding: '1.3cqw', gap: '1.5cqw', borderRadius: '1.4cqw' }}
          >
            <Photo style={{ width: '7.5cqw', height: '8cqh', borderRadius: '1cqw', background: 'linear-gradient(150deg,#e8a86b,#3a6aa8)' }} />
            <Copy rows={3} color="#1a234026" w="100%" h="0.85cqh" gap="0.85cqh" />
          </div>
        </Photo>
      </div>

      {/* The "Who We Are" strip. Height is its TEXT plus the padding the 18%-tall band
          had spare at card size (3.8532cqh a side) — a fixed 18% clipped the closing
          paragraph the moment the box got wider than ~2.1:1, because the type is cqw. */}
      <div className="flex shrink-0 flex-col items-center justify-center bg-white" style={{ paddingBlock: '3.8532cqh', gap: '1.6cqh' }}>
        <Bar w="6.5cqw" h="0.95cqh" color="#1a234026" />
        <p className="whitespace-nowrap text-center" style={{ color: '#1a2340', fontSize: '2.4cqw', lineHeight: 1.5 }}>
          We are a team of passionate architects and designers committed to<br />crafting beautiful spaces that blend innovation, functionality, and beauty.
        </p>
      </div>
    </div>
  )
}

/**
 * Serena — pale sage mental-health site (Figma "image 379").
 * A full-bleed sky photograph with a floating white nav pill, glass chips over it and a
 * white headline bottom-left. The mockup's photo is a portrait against the sky; here it
 * is a sky-to-warm gradient with one soft organic shape where the figure sits. NO PEOPLE.
 */
function Wellness() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#eef1e3' }}>
      {/* THE PHOTOGRAPH, and everything the board floats on top of it. The overlays used
          to be absolute siblings of the panel at percentage tops (36 / 32 / 55 / 65) — at
          the wide end those tops kept their fraction of the card while the type grew with
          `cqw`, so the chip walked into the headline. They are children of the panel now,
          in three flow bands, and the slack between the bands is two WEIGHTED spacers:
          41.41 : 28.84 is the board's own gap proportion, so the card lands on the same
          pixel, and at any other aspect the two gaps give way together instead of the
          content colliding. */}
      <Photo
        className="relative flex flex-1 flex-col"
        style={{
          marginInline: '2cqw', marginTop: '2cqh', borderRadius: '2cqw',
          paddingInline: '3cqw', paddingTop: '2cqh', paddingBottom: '11.1193cqh',
          background: 'linear-gradient(166deg,#a9c8de 0%,#c6d8e4 36%,#e3d8c6 76%,#cdbca3 100%)',
        }}
      >
        {/* Where the figure stands in the mockup — soft, abstract, deliberately not a
            person. `aspect-ratio` off the panel's HEIGHT, not width × height: sized in
            both axes it flattened into a wide mushroom at the wide end. */}
        <span
          className="absolute"
          style={{
            left: '26%', top: '20%', height: '92%', aspectRatio: '0.70594',
            background: 'linear-gradient(172deg,#caa78c6b 0%,#b48f7266 40%,#8f725c40 72%,#7d6a5900 100%)',
            borderRadius: '42% 58% 28% 72% / 62% 66% 34% 38%',
            filter: 'blur(3.2cqw)',
          }}
        />
        <span
          className="absolute"
          style={{ left: '24%', top: '4%', height: '52%', aspectRatio: '1.3989', background: 'radial-gradient(50% 50% at 50% 50%,#6b4f3959 0%,#6b4f3900 74%)' }}
        />

        {/* the floating glass nav pill */}
        <div
          className="relative flex shrink-0 items-center justify-between"
          style={{ height: '9cqh', paddingInline: '2.2cqw', borderRadius: '99em', background: '#ffffffd9' }}
        >
          <div className="flex items-center" style={{ gap: '1.2cqw' }}>
            <span className="block rounded-full" style={{ width: '2.6cqw', height: '2.6cqw', background: '#3f6b3a' }} />
            <Wordmark color="#2b3a28" size="3cqw">Serena</Wordmark>
          </div>
          <div className="flex items-center" style={{ gap: '2.4cqw' }}>
            <NavLinks n={4} color="#2b3a2873" w="3.8cqw" gap="2.4cqw" />
            <Pill w="10cqw" h="4cqh" bg="#3f6b3a" label="#ffffff8c" />
          </div>
        </div>

        <span className="block" style={{ flexGrow: 41.41, flexBasis: 0 }} />

        {/* mid band: the "10k+ happy customers" chip, and the paragraph the board sets
            over the right of the photo (1cqw further in — the board's own inset) */}
        <div className="relative flex shrink-0 items-start justify-between">
          <div
            className="flex items-center"
            style={{ marginTop: '4cqh', padding: '1.1cqw', gap: '1.3cqw', borderRadius: '99em', background: '#ffffffe6' }}
          >
            <Avatars size="3.2cqw" ring="#ffffff" />
            <Copy rows={2} color="#2b3a2826" w="9cqw" h="0.85cqh" gap="0.8cqh" />
          </div>
          <div style={{ width: '21cqw', marginRight: '1cqw' }}>
            <Copy rows={3} color="#ffffffbf" w="100%" h="1cqh" gap="1cqh" />
          </div>
        </div>

        <span className="block" style={{ flexGrow: 28.84, flexBasis: 0 }} />

        {/* bottom band: headline left, CTA right */}
        <div className="relative flex shrink-0 items-end justify-between">
          <p
            className="whitespace-nowrap font-display font-semibold text-white"
            style={{ marginBottom: '1.56cqh', fontSize: '5.2cqw', lineHeight: 1.2, letterSpacing: '-0.02em' }}
          >
            Your mental health is<br />super important.
          </p>
          <div className="flex items-center" style={{ marginRight: '1cqw', gap: '1.5cqw' }}>
            <Pill w="14cqw" h="4.8cqh" bg="#ffffff" label="#2b3a2873" />
            <span className="block rounded-full" style={{ width: '4.6cqw', height: '4.6cqw', background: '#2b3a28' }} />
          </div>
        </div>
      </Photo>

      {/* The sage caption under the photo. Its height is the text plus the insets the
          16%-tall band had spare at card size; fixed at 16% it cut its own second line
          the moment the box got wider than the card. */}
      <div className="flex shrink-0 justify-center" style={{ paddingTop: '5.4cqh', paddingBottom: '4.6347cqh' }}>
        <p className="whitespace-nowrap text-center" style={{ color: '#2b3a28', fontSize: '2.9cqw', lineHeight: 1.45 }}>
          We combine science-backed tools and AI insights to help you<br />control your mental health.
        </p>
      </div>
    </div>
  )
}

/**
 * synco.com — the customer's own site on the "My projects" card.
 *
 * DEVIATION, on purpose. Figma's My-projects board (28364:40628) reuses template card 1's
 * screenshot here, so the drawn project card shows the PayNexus fintech page under the
 * caption "synco.com" — placeholder reuse, the same habit that gives two template cards
 * the identical caption "AI Moodboard Canvas". Drawing that faithfully would make the
 * project card pixel-identical to a template card. So this draws the Synco site instead —
 * the site the designer's own asset library has for that brand (Figma "image 382", and the
 * hidden variant of this very card captions it "Online store") — with a storefront strip
 * under the hero, so it reads as a shop rather than as the template it shares a hero with.
 */
function Synco() {
  return (
    <SyncoHero below={14.194}>
      {/* `relative` is load-bearing: the hero above is positioned, so without it the
          hero's own painting layer covers this strip and the wave's bottom curve prints
          over the storefront. */}
      <div
        className="relative flex shrink-0 items-center"
        style={{ height: '23cqh', background: '#f4f4f5', paddingInline: '4cqw', gap: '3cqw' }}
      >
        {[
          'linear-gradient(150deg,#dfe4ea,#a9b4c2)',
          'linear-gradient(150deg,#e6e0d6,#bfae98)',
          'linear-gradient(150deg,#d8e2ea,#8fa3b8)',
          'linear-gradient(150deg,#e4e4e7,#b0b0b8)',
        ].map((g, i) => (
          <div key={i} className="flex-1">
            <Photo style={{ height: '10cqh', borderRadius: '1cqw', background: g }} />
            <div style={{ marginTop: '1.5cqh' }}><Copy rows={2} color="#09090b1f" w="100%" h="0.95cqh" gap="0.85cqh" /></div>
          </div>
        ))}
      </div>
    </SyncoHero>
  )
}

/* ──────────────── the template picker's four extra sites ────────────────
   The fullscreen picker (Figma 28616:59168, "Pick a template. We'll remix it") fills
   its 6×3 grid with the six sites above plus the four below, still under the dock's
   recycled captions — `TEMPLATE_LIBRARY` in `src/data/templates.ts` records the
   pairing card by card. Same contract as everything above: container units only,
   no people, photography becomes gradient blocks.                                  */

/**
 * Synco® Creative Agency — the page behind the Synco brand (Figma "image 382" again,
 * but the picker's row-1 crop: the whole landing page, where `campaign` crops the same
 * screenshot down to its oversized-wordmark hero). Black ground, a glossy blue ribbon
 * bleeding off the top-left corner, a light-weight three-line headline, a service rail
 * down the right edge, and a white stats band whose 50+/100+ the card edge cuts
 * mid-digit — the crop is the composition, so the numbers overflow on purpose.
 */
function Agency() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#0a0a0a' }}>
      {/* The rail and the ribbon stay absolute children of the CARD, not of the hero
          below: they are the page's background, their percentages are percentages of the
          card, and leaving them alone is also what keeps the card pixel-identical. */}
      {/* the service rail — a strip barely lighter than the page; its labels are bars */}
      <div className="absolute" style={{ left: '81%', right: 0, top: 0, height: '72%', background: '#151517' }}>
        <span className="absolute" style={{ left: '16%', right: '14%', top: '4.5%', height: '8%', background: '#3d3d42', borderRadius: '0.7cqw' }} />
        {['24%', '39%', '54%', '69%'].map((top) => (
          <span key={top} className="absolute" style={{ right: '14%', top, width: '8cqw', height: '1cqh', background: '#ffffff4d', borderRadius: '99em' }} />
        ))}
      </div>

      {/* the blue ribbon: an elongated, tilted base blob, a bright sheen on its upper
          crest, and a darker fold across its waist — three layers, or it reads as a
          flat circle instead of folded silk */}
      <span
        className="absolute"
        style={{
          left: '-18cqw', top: '-12cqh', width: '58cqw', height: '58%',
          background: 'linear-gradient(146deg,#7fa6ff 0%,#3a63ea 34%,#1b32c2 62%,#0c1670 100%)',
          borderRadius: '74% 26% 62% 38% / 52% 68% 32% 48%',
          transform: 'rotate(-14deg)',
        }}
      />
      <span
        className="absolute"
        style={{
          left: '-10cqw', top: '-8cqh', width: '30cqw', height: '26%',
          background: 'linear-gradient(158deg,#dbe7ff 0%,#8cb0ff 52%,#8cb0ff00 100%)',
          borderRadius: '55% 45% 70% 30% / 48% 62% 38% 52%',
          transform: 'rotate(-18deg)',
          filter: 'blur(1.2cqw)',
        }}
      />
      <span
        className="absolute"
        style={{
          left: '-12cqw', top: '20%', width: '38cqw', height: '26%',
          background: 'linear-gradient(150deg,#101f96 0%,#081048 55%,#08104800 100%)',
          borderRadius: '30% 70% 55% 45% / 62% 38% 62% 38%',
          transform: 'rotate(-10deg)',
          filter: 'blur(0.9cqw)',
        }}
      />

      {/* THE HERO in flow. The headline was pinned at `top: 11%` and the copy under it at
          `top: 58%`: three lines of 9.6cqw type are 36% of the card's height but 68% of a
          1616×804 box, so at the wide end `Agency` was half-covered by the stats band and
          the copy bars printed across the headline. Stacked, they cannot touch. The two
          gaps are WEIGHTED spacers (23.3 : 24.23, the board's own proportion): they hold
          the card exactly, and when the box is too short for the headline they give way to a
          1cqh floor rather than letting the type slide under the band. */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* nav, riding over the ribbon's crest */}
        <div className="flex shrink-0 items-center justify-between" style={{ marginLeft: '4cqw', marginRight: '23cqw', height: '8cqh' }}>
          <Wordmark color="#ffffff" size="2.8cqw">Synco</Wordmark>
          <NavLinks n={3} color="#ffffff59" w="3.6cqw" gap="2.6cqw" />
        </div>

        {/* the headline is a REGULAR-weight grotesk on the board — no font-semibold here */}
        <p
          className="shrink-0 whitespace-nowrap font-display text-white"
          style={{ marginTop: '2.9954cqh', marginLeft: '19%', fontSize: '9.6cqw', lineHeight: 1.18, letterSpacing: '-0.015em' }}
        >
          Synco<span style={{ fontSize: '0.38em', verticalAlign: 'super' }}>®</span><br />Creative<br />Agency
        </p>
        <span className="block" style={{ flexGrow: 23.3, flexShrink: 0, flexBasis: '1cqh' }} />
        <div className="shrink-0" style={{ marginLeft: '19%' }}>
          <Copy rows={2} color="#ffffff40" w="30cqw" h="0.95cqh" gap="1cqh" />
        </div>
        <span className="block" style={{ flexGrow: 24.23, flexShrink: 0, flexBasis: '1cqh' }} />
      </div>

      {/* The white stats band; the 50+/100+ run past the card edge and get clipped. Its
          height stays a fixed 28cqh and its three blocks stay percentages OF THE BAND, so
          the crop through the digits survives at every aspect. */}
      <div className="relative shrink-0" style={{ height: '28cqh', background: '#f4f4f2' }}>
        <div className="absolute flex flex-col" style={{ left: '4cqw', top: '22%', gap: '1cqh' }}>
          <Bar w="8cqw" h="0.85cqh" color="#0a0a0a40" />
          <Bar w="5.5cqw" h="0.85cqh" color="#0a0a0a26" />
        </div>
        <p className="absolute whitespace-nowrap" style={{ left: '42%', top: '12%', color: '#17181c', fontSize: '2.25cqw', lineHeight: 1.55 }}>
          Synco isn&apos;t just about change — we&apos;re<br />
          setting new standards with bold creativity and<br />
          thinking innovation.
        </p>
        {/* top 84% pushes the digits past the card edge — the crop cuts them mid-glyph */}
        <p className="absolute whitespace-nowrap font-display font-semibold" style={{ left: '42%', top: '84%', color: '#101014', fontSize: '7cqw', letterSpacing: '-0.02em' }}>
          50<span style={{ color: '#3d56f0' }}>+</span>
          <span style={{ marginLeft: '9cqw' }}>100<span style={{ color: '#3d56f0' }}>+</span></span>
        </p>
      </div>
    </div>
  )
}

/**
 * WorkPro — bright blue social-media SaaS landing (Figma "image 386").
 * Centred headline with the mockup's white underline under "social media", then a big
 * white app window: chrome dots, a sidebar of menu bars, stat cards and two number
 * cards with blue mini-charts — wireframed, because a legible dashboard at this scale
 * is a lie. Below, the white claim band and the first sliver of the next, dark section,
 * exactly where the screenshot's crop catches them.
 */
function Saas() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#306ef2' }}>
      <div className="flex shrink-0 items-center justify-between" style={{ height: '8cqh', paddingInline: '3.5cqw' }}>
        <Wordmark color="#ffffff" size="3.2cqw">WorkPro</Wordmark>
        <NavLinks n={4} color="#ffffff66" w="4cqw" gap="2.4cqw" />
        <div className="flex items-center" style={{ gap: '2cqw' }}>
          <Bar w="3.4cqw" h="1cqh" color="#ffffff8c" />
          <Pill w="9.5cqw" h="4cqh" bg="#ffffff" label="#306ef259" />
        </div>
      </div>

      {/* THE HERO, in flow. The four blocks used to be absolute at 10 / 28.5 / 34 / 42 %
          of the card — and the `28.5%, not 25` above the sub-copy was the tell: with type
          in `cqw` the headline claims ~1.7× more of the height at 1616×804 than it does on
          the card, so a fixed top is right at exactly one aspect. Stacked, the headline
          pushes its own sub-copy down, and the APP WINDOW takes the slack: it is the one
          element the board already crops (`its bottom edge hides under the claim band`),
          so it is the honest place for the height to come out of. Once the window is down
          to its own content the closing band drops below the fold instead, which is what
          a real page does in a short window. */}
      <div className="flex flex-1 flex-col" style={{ paddingTop: '2cqh' }}>
        <p
          className="w-full shrink-0 whitespace-nowrap text-center font-display font-semibold text-white"
          style={{ fontSize: '4.9cqw', lineHeight: 1.3, letterSpacing: '-0.02em' }}
        >
          A powerful tool to automate<br />
          your <span style={{ borderBottom: '0.45cqw solid #ffffff', paddingBottom: '0.2cqh' }}>social media</span>
        </p>

        {/* centred by transform, not by an auto margin: flex centring snaps the box to
            the layout grid an eighth of a pixel off the board's `left: 50%` and rounds the
            pill ends differently */}
        <div className="relative left-1/2 flex shrink-0 -translate-x-1/2 flex-col items-center" style={{ marginTop: '4.8868cqh', width: '46cqw', gap: '1.1cqh' }}>
          <Bar w="100%" h="1cqh" color="#ffffff59" />
          <Bar w="72%" h="1cqh" color="#ffffff59" />
        </div>

        <div className="relative left-1/2 flex w-fit shrink-0 -translate-x-1/2 items-center" style={{ marginTop: '2.4097cqh', gap: '2cqw' }}>
          <Pill w="17cqw" h="5cqh" bg="#ffffff" label="#306ef259" />
          <Pill w="15cqw" h="5cqh" border="#ffffff73" label="#ffffffa6" />
        </div>

        {/* the app window; its bottom edge hides under the claim band, as in the crop */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-white" style={{ marginTop: '3.0068cqh', marginInline: '11%', borderRadius: '1.8cqw 1.8cqw 0 0' }}>
        <div className="flex shrink-0 items-center" style={{ height: '9%', paddingInline: '1.8cqw', gap: '0.9cqw' }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="block shrink-0 rounded-full" style={{ width: '1.1cqw', height: '1.1cqw', background: '#10182b2e' }} />
          ))}
        </div>
        <div className="flex flex-1">
          {/* the menu column; the first item is the selected one, so it goes blue */}
          <div className="flex shrink-0 flex-col" style={{ width: '15%', paddingTop: '1.2cqh', paddingLeft: '1.8cqw', paddingRight: '1.8cqw', gap: '1.5cqh' }}>
            {['100%', '82%', '90%', '74%', '86%', '66%'].map((w, i) => (
              <Bar key={i} w={w} h="0.8cqh" color={i ? '#10182b1f' : '#306ef2'} />
            ))}
          </div>
          <div className="flex-1" style={{ background: '#edf1f8', padding: '1.6cqw' }}>
            <div className="flex items-center justify-between">
              <Bar w="9cqw" h="0.9cqh" color="#10182b40" />
              <div className="flex items-center" style={{ gap: '1cqw' }}>
                <Bar w="5cqw" h="1.8cqh" color="#ffffff" radius="0.5cqw" />
                <Bar w="5cqw" h="1.8cqh" color="#306ef2" radius="0.5cqw" />
              </div>
            </div>
            <div className="flex" style={{ marginTop: '1.4cqh', gap: '1.4cqw' }}>
              <div className="flex-1 bg-white" style={{ padding: '1.2cqw', borderRadius: '0.8cqw' }}>
                <Copy rows={2} color="#10182b1f" w="100%" h="0.75cqh" gap="0.8cqh" />
              </div>
              <div className="flex flex-1 items-center bg-white" style={{ padding: '1.2cqw', borderRadius: '0.8cqw' }}>
                <Avatars size="2.6cqw" ring="#ffffff" />
              </div>
              <div className="flex-1 bg-white" style={{ padding: '1.2cqw', borderRadius: '0.8cqw' }}>
                <Copy rows={2} color="#10182b1f" w="100%" h="0.75cqh" gap="0.8cqh" />
              </div>
            </div>
            <div className="flex" style={{ marginTop: '1.4cqh', gap: '1.4cqw' }}>
              <div className="bg-white" style={{ width: '58%', padding: '1.2cqw', borderRadius: '0.8cqw' }}>
                <p className="font-display font-semibold tabular-nums" style={{ color: '#10182b', fontSize: '3.2cqw', letterSpacing: '-0.02em' }}>
                  94,127
                </p>
                <div className="flex items-end" style={{ marginTop: '0.8cqh', gap: '0.9cqw' }}>
                  {['2cqh', '3.2cqh', '2.6cqh', '4cqh', '3cqh', '4.6cqh'].map((h, i) => (
                    <span key={i} className="block" style={{ width: '2cqw', height: h, background: i % 2 ? '#9db9f8' : '#306ef2', borderRadius: '0.4cqw 0.4cqw 0 0' }} />
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-white" style={{ padding: '1.2cqw', borderRadius: '0.8cqw' }}>
                <p className="font-display font-semibold tabular-nums" style={{ color: '#10182b', fontSize: '2.6cqw', letterSpacing: '-0.02em' }}>
                  9,872
                </p>
                <div className="flex flex-col" style={{ marginTop: '0.9cqh', gap: '0.9cqh' }}>
                  <Bar w="86%" h="0.6cqh" color="#306ef2" />
                  <Bar w="100%" h="0.6cqh" color="#10182b1f" />
                  <Bar w="64%" h="0.6cqh" color="#10182b1f" />
                </div>
              </div>
            </div>
            {/* a list card runs under the crop, so the window never ends in blank white */}
            <div className="bg-white" style={{ marginTop: '1.4cqh', padding: '1.2cqw', borderRadius: '0.8cqw' }}>
              <div className="flex items-center" style={{ gap: '1.4cqw' }}>
                <Avatars size="2.2cqw" ring="#ffffff" />
                <Copy rows={2} color="#10182b1f" w="40%" h="0.7cqh" gap="0.8cqh" />
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* the claim band: its text plus the 2.18cqh the 14.5%-tall band had spare on the
          card, so the second line cannot fall out of it at another aspect */}
      <div className="relative flex shrink-0 items-center justify-center" style={{ paddingBlock: '2.1791cqh', background: '#ffffff' }}>
        <p className="whitespace-nowrap text-center font-display font-semibold" style={{ color: '#0f172c', fontSize: '3.6cqw', lineHeight: 1.32, letterSpacing: '-0.02em' }}>
          Engage your audience<br />without wasting your time
        </p>
      </div>
      <div className="relative shrink-0" style={{ height: '2.5cqh', background: '#0c0d12' }} />
    </div>
  )
}

/**
 * Burgundy restaurant page (Figma "image 385"). Serif headline left, a big platter of
 * food photographed from above on the right, a 2k/1k/99/10 stats band, a "Discover Our
 * Complete Range" band, and a cream gallery strip the card edge cuts into. Every plate
 * is a gradient disc — the same substitution the portrait cards make, because a
 * photo-real dish is as off-limits as a face. The board sets the headline in a serif;
 * the prototype ships none, so the display face stands in (the AURA card's precedent).
 * The script logo in the top bar is illegible at any thumbnail size — an abstract gold
 * pill carries its place.
 */
function Restaurant() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#6b1613' }}>
      <div className="flex shrink-0 items-center justify-between" style={{ height: '7cqh', background: '#521010', paddingInline: '3.5cqw' }}>
        <NavLinks n={4} color="#f2e0b866" w="4cqw" gap="2.2cqw" />
        <Pill w="9cqw" h="3.2cqh" bg="#d9a94f" label="#52101080" />
        <NavLinks n={3} color="#f2e0b866" w="4cqw" gap="2.2cqw" />
      </div>

      {/* THE HERO BAND. Copy and food used to be nine absolute blocks on the card (11.5 /
          28.5 / 36.5 / 46 % on the left, 2 / 7 / 40 / 45 % for the plates) and only agreed
          at the card's aspect: at the wide end the `cqw` headline ran into its own body
          copy, and the platter — 34cqw, so 549px — grew straight through the stats band
          below. The copy is a flow column now, the band is as tall as that column, and
          every plate is sized as a PERCENTAGE OF THE BAND, so the still life keeps its
          composition instead of outgrowing the page. */}
      <div className="relative shrink-0" style={{ paddingBottom: '3.5264cqh' }}>
        {/* the food photography, as discs: a warm glow, the big platter (gold rim, brown
            food), a second platter cut by the top-right corner, two side dishes. Absolute
            because they overlap each other and bleed off the corner — the one thing flow
            cannot express. */}
        <span className="absolute" style={{ left: '42%', top: '-4.9957cqh', height: '110.629%', aspectRatio: '1.15093', background: 'radial-gradient(50% 50% at 50% 50%,#8a2a1a4d 0%,#8a2a1a00 72%)' }} />
        <Photo
          className="absolute rounded-full"
          style={{
            left: '54%', top: 0, height: '77.3103%', aspectRatio: '1',
            // Concentric rings, food inside a gold rim. The rim must share the food's
            // centre — an offset radial turns it into a crescent, not a plate.
            background:
              'radial-gradient(38% 38% at 42% 36%,#8a5524 0%,#8a552400 100%),' +
              'radial-gradient(circle,#5f3110 0%,#5f3110 55%,#3f2008 58%,#e9b24c 61%,#d9963c 82%,#b57728 100%)',
          }}
        />
        <Photo
          className="absolute rounded-full"
          style={{
            right: '-6cqw', top: '-4.9957cqh', height: '38.6551%', aspectRatio: '1',
            background: 'radial-gradient(circle,#7a4515 0%,#7a4515 52%,#eab54e 57%,#cf8f35 100%)',
          }}
        />
        <Photo className="absolute rounded-full" style={{ left: '46%', top: '70.2043%', height: '18.1763%', aspectRatio: '1', background: 'radial-gradient(circle at 40% 35%,#6f3a12 0%,#40200a 100%)' }} />
        <Photo className="absolute rounded-full" style={{ left: '57%', top: '80.8477%', height: '12.5039%', aspectRatio: '1', background: 'radial-gradient(circle at 40% 35%,#d9a355 0%,#8a5a20 100%)' }} />

        {/* the copy column */}
        <div className="relative" style={{ paddingLeft: '4.5cqw' }}>
          <p
            className="whitespace-nowrap font-display font-semibold"
            style={{ marginTop: '4.5072cqh', color: '#f2e0b8', fontSize: '4.4cqw', lineHeight: 1.32, letterSpacing: '-0.01em' }}
          >
            A Taste of Tradition,<br />A Promise of Quality
          </p>
          <div style={{ marginTop: '4.6015cqh' }}>
            <Copy rows={3} color="#f2e0b859" w="30cqw" h="1cqh" gap="1.2cqh" />
          </div>
          {/* the round quality stamp and a small CTA beside it */}
          <div className="flex items-center" style={{ marginTop: '2.6161cqh', gap: '2cqw' }}>
            <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: '6.5cqw', height: '6.5cqw', boxShadow: 'inset 0 0 0 0.45cqw #d9a94f' }}>
              <span className="block rounded-full" style={{ width: '2.2cqw', height: '2.2cqw', background: '#d9a94f' }} />
            </span>
            <Pill w="11cqw" h="4cqh" bg="#d9a94f" label="#52101073" />
          </div>
          {/* the little dish carousel under the copy — thumbnails, so gradient tiles */}
          <div className="flex" style={{ marginTop: '2.5516cqh', gap: '1.6cqw' }}>
            {['linear-gradient(150deg,#c98a3b,#7a4515)', 'linear-gradient(150deg,#8a2a1a,#4f1108)', 'linear-gradient(150deg,#e3b054,#a4652b)', 'linear-gradient(150deg,#a4652b,#5f3110)'].map((g, i) => (
              <Photo key={i} style={{ width: '8.5cqw', aspectRatio: '2.0207', borderRadius: '0.8cqw', background: g }} />
            ))}
          </div>
        </div>
      </div>

      {/* the stats band — the numbers are the site's four proof points */}
      <div className="relative flex shrink-0" style={{ height: '20cqh', background: '#5a100d' }}>
        {['2k', '1k', '99', '10'].map((n) => (
          <div key={n} className="flex flex-1 flex-col items-center justify-center" style={{ gap: '1.2cqh' }}>
            <p className="font-display font-semibold" style={{ color: '#f2e0b8', fontSize: '4.6cqw', letterSpacing: '-0.01em' }}>{n}</p>
            <Bar w="10cqw" h="0.85cqh" color="#f2e0b84d" />
          </div>
        ))}
      </div>

      <div className="relative flex shrink-0 flex-col items-center" style={{ marginTop: '3.0046cqh', gap: '1.4cqh' }}>
        <p className="whitespace-nowrap font-display font-semibold" style={{ color: '#f2e0b8', fontSize: '3.6cqw', letterSpacing: '-0.01em' }}>
          Discover Our Complete Range
        </p>
        <Bar w="24cqw" h="0.9cqh" color="#f2e0b840" />
      </div>

      {/* the cream gallery strip, its tiles taller than the card leaves room for */}
      <div className="relative flex shrink-0" style={{ marginTop: '3.9421cqh', height: '11cqh', background: '#f2e8d4', paddingInline: '3cqw', paddingTop: '1.2cqh', gap: '2cqw' }}>
        {[
          'linear-gradient(150deg,#e8c07a,#a4652b)',
          'linear-gradient(150deg,#d9a355,#8a4f1f)',
          'linear-gradient(150deg,#c98a3b,#6f3a12)',
          'linear-gradient(150deg,#e3b054,#96581f)',
          'linear-gradient(150deg,#d0913f,#7a4515)',
        ].map((g, i) => (
          <Photo key={i} className="flex-1" style={{ height: '14cqh', borderRadius: '1cqw', background: g }} />
        ))}
      </div>
    </div>
  )
}

/**
 * MineMax — near-black crypto-mining landing (Figma "image 380").
 * Centred headline over a mining-rig illustration: circuit traces running to a glowing
 * violet orb with a crystal glyph, the ground under it lit purple. Two purple feature
 * cards enter at the bottom and get cut by the card edge. The glow is two static radial
 * gradients — paint-once, nothing animates, so the perf contract is untouched.
 */
function Crypto() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#07060b' }}>
      <div className="flex shrink-0 items-center justify-between" style={{ height: '7cqh', paddingInline: '3.5cqw' }}>
        <div className="flex items-center" style={{ gap: '1.2cqw' }}>
          <span className="block shrink-0 rounded-full" style={{ width: '2.4cqw', height: '2.4cqw', background: '#7c57f2' }} />
          <Wordmark color="#ffffff" size="3cqw">MineMax</Wordmark>
        </div>
        <NavLinks n={4} color="#ffffff4d" w="3.8cqw" gap="2.4cqw" />
        <div className="flex items-center" style={{ gap: '1.6cqw' }}>
          <Pill w="8cqw" h="3.6cqh" border="#ffffff33" label="#ffffff8c" />
          <Pill w="9cqw" h="3.6cqh" bg="#7c57f2" label="#ffffffa6" />
        </div>
      </div>

      {/* THE HERO, in flow. Chip, headline, sub-copy, buttons, rig and label were six
          absolute blocks at 9.5 / 15 / 33 / 40.5 / 46 / 73.5 % of the card: right at the
          card's aspect, and at the wide end the `cqw` headline grew straight through the
          sub-copy and the buttons. Stacked, each one pushes the next. The stack is taller
          than the box on purpose — the two feature cards are cut by the bottom edge on the
          board too, so the overflow is the crop, and a shorter box simply shows less of
          them. */}
      <div className="flex flex-1 flex-col" style={{ paddingTop: '2.5072cqh' }}>
        {/* the little tag chip above the headline */}
        {/* centred by transform for the same reason as the buttons below */}
        <span className="relative left-1/2 flex shrink-0 -translate-x-1/2 items-center justify-center rounded-full" style={{ width: '12cqw', height: '3.4cqh', boxShadow: 'inset 0 0 0 0.35cqw #7c57f259' }}>
          <Bar w="55%" h="0.85cqh" color="#a98ef7" />
        </span>

        <p
          className="shrink-0 whitespace-nowrap text-center font-display font-semibold"
          style={{ marginTop: '2.1072cqh', color: '#eae6f8', fontSize: '5.4cqw', lineHeight: 1.24, letterSpacing: '-0.02em' }}
        >
          AI Revolutionizing<br />Crypto Mining
        </p>

        <div className="relative left-1/2 flex shrink-0 -translate-x-1/2 flex-col items-center" style={{ marginTop: '3.7cqh', width: '40cqw', gap: '1.1cqh' }}>
          <Bar w="100%" h="1cqh" color="#ffffff38" />
          <Bar w="66%" h="1cqh" color="#ffffff38" />
        </div>

        <div className="relative left-1/2 flex w-fit shrink-0 -translate-x-1/2 items-center" style={{ marginTop: '4.41cqh', gap: '1.8cqw' }}>
          <Pill w="13cqw" h="4.6cqh" bg="#7c57f2" label="#ffffffa6" />
          <Pill w="12cqw" h="4.6cqh" border="#ffffff2e" label="#ffffff8c" />
        </div>

      {/* the rig: ground glow, circuit traces brightening toward the centre,
          two satellite nodes, then the orb with its halo and crystal glyph */}
      <div className="relative shrink-0" style={{ marginTop: '0.9072cqh', height: '27cqh' }}>
        <span className="absolute" style={{ left: '18%', right: '18%', top: '40%', bottom: '-34%', background: 'radial-gradient(50% 46% at 50% 58%,#6d3df059 0%,#6d3df000 72%)' }} />
        <span className="absolute" style={{ left: 0, width: '34%', top: '48%', height: '0.35cqh', background: 'linear-gradient(90deg,#171226 0%,#5646a0 100%)' }} />
        <span className="absolute" style={{ right: 0, width: '34%', top: '48%', height: '0.35cqh', background: 'linear-gradient(270deg,#171226 0%,#5646a0 100%)' }} />
        <span className="absolute" style={{ left: '6%', width: '18%', top: '20%', height: '0.35cqh', background: '#221a3d' }} />
        <span className="absolute" style={{ right: '6%', width: '18%', top: '76%', height: '0.35cqh', background: '#221a3d' }} />
        <span className="absolute rounded-full" style={{ left: '21%', top: '34%', width: '4.6cqw', height: '4.6cqw', background: '#120c22', boxShadow: 'inset 0 0 0 0.35cqw #4a3f78' }} />
        <span className="absolute rounded-full" style={{ right: '21%', top: '34%', width: '4.6cqw', height: '4.6cqw', background: '#120c22', boxShadow: 'inset 0 0 0 0.35cqw #4a3f78' }} />
        <span className="absolute left-1/2 -translate-x-1/2" style={{ top: '-18%', width: '44cqw', height: '136%', background: 'radial-gradient(50% 50% at 50% 50%,#7b4df066 0%,#7b4df000 70%)' }} />
        {/* The orb is sized off the RIG's height (59.36% of it, a circle by aspect-ratio),
            not in `cqw`: at 15cqw it was 242px in a 217px band at the wide end, so it
            spilled out of the illustration and printed through the label below it. */}
        <span className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full" style={{ top: '8%', height: '59.36%', aspectRatio: '1', background: 'radial-gradient(circle at 50% 38%,#241946 0%,#0d0918 76%)', boxShadow: 'inset 0 0 0 0.45cqw #8b5cf6' }}>
          <span className="block" style={{ width: '24%', aspectRatio: '1', boxShadow: 'inset 0 0 0 0.4cqw #cabdf8', transform: 'rotate(45deg)' }} />
        </span>
      </div>

      {/* ⚠️ no explicit line-height, deliberately: `normal` resolves to ~1.5 here and that
          1.5 line box is baked into the signed-off card — the feature cards below are
          positioned off the bottom of it. Pinning a number would move them. */}
      <p className="relative shrink-0 text-center font-display font-semibold" style={{ marginTop: '0.5072cqh', color: '#ffffffd9', fontSize: '3cqw' }}>
        {/* Verbatim from the board per figma-spec-add-template.md §6.1. ⚠️ Both
            that transcription and this QA's re-read are by eye off a 233px MCP
            render (the proxy blocks the full-resolution asset), so "Ask" vs an
            earlier "Join" is a read, not a certainty — confirm with the designer. */}
        Ask MineMax
      </p>

      </div>

      {/* the two purple feature cards, cut by the card's bottom edge */}
      <div className="relative flex shrink-0" style={{ marginTop: '0.7072cqh', marginInline: '3.5cqw', gap: '2.4cqw' }}>
        <div className="relative flex-1 overflow-hidden" style={{ height: '30cqh', borderRadius: '2cqw', background: 'linear-gradient(150deg,#1a1130 0%,#241a3f 100%)' }}>
          <span className="absolute rounded-full" style={{ left: '14%', top: '30%', width: '7cqw', height: '7cqw', background: 'radial-gradient(circle at 38% 32%,#a688f7 0%,#6d47e0 58%,#4c2fae 100%)' }} />
          <span className="absolute rounded-full" style={{ left: '42%', top: '55%', width: '5.5cqw', height: '5.5cqw', background: 'radial-gradient(circle at 38% 32%,#a688f7 0%,#6d47e0 58%,#4c2fae 100%)' }} />
          <span className="absolute rounded-full" style={{ left: '66%', top: '22%', width: '6cqw', height: '6cqw', background: 'radial-gradient(circle at 38% 32%,#a688f7 0%,#6d47e0 58%,#4c2fae 100%)' }} />
        </div>
        <div className="relative flex-1 overflow-hidden" style={{ height: '30cqh', borderRadius: '2cqw', background: 'linear-gradient(150deg,#191128 0%,#221739 100%)' }}>
          <span className="absolute rounded-full" style={{ left: '8%', top: '18%', width: '4.6cqw', height: '4.6cqw', background: 'radial-gradient(circle at 38% 32%,#a688f7 0%,#6d47e0 58%,#4c2fae 100%)' }} />
          <div className="absolute flex flex-col" style={{ left: '8%', top: '48%', right: '10%', gap: '1cqh' }}>
            <Bar w="60%" h="1cqh" color="#ffffffbf" />
            <Bar w="100%" h="0.8cqh" color="#ffffff33" />
            <Bar w="78%" h="0.8cqh" color="#ffffff33" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── eight more sites: variety for the picker grid ───────────────
   The picker's eighteen rows were drawn from ten sites, so scrolling the grid kept
   meeting the same page. These eight are new brands — one per vertical the filter
   chips promise (two Ecommerce, two Tech & SaaS, one Portfolio, one Business &
   services, two Health And Beauty) — and each owns a different dominant colour, so
   the grid reads as a library: cream over espresso, white, blue-black, lavender
   white, near-black, navy, sand, charcoal.

   These eight were the first drawn as a FLOW column (nav / hero / band) instead of
   absolute percentage tops — see TWO HOMES at the top of the file for why, and for the
   rest of the toolkit. The ten sites above were converted to the same shape afterwards,
   so the whole library now behaves the same way at both ends. Objects whose SHAPE matters
   (a coffee bag, an arch, a photo panel) get `aspect-ratio` with a percentage height for
   the same reason — cqw × cqh would squash them at one end.
   ⚠️ Every line of REAL text here carries an explicit `lineHeight`. Left at
   `normal`, the display face resolves to ~1.5, so a single-line price in a
   fixed-height row is half a line taller than the row it sits in: measured at
   1600×880, barbershop's four price rows were 68px each while each `$35` claimed a
   72px line box, and by the fourth row the drift had put the digits 31px under the
   footer band. Nothing overflowed the card, so it looked like a mystery — it is the
   line box, not the layout.
   Same contract otherwise: container units only, no people, no photo-real food,
   photography is a gradient block.                                              */

/**
 * A proof number over its label. `label` is a COLOUR, like `Pill`'s: the label text
 * itself is a wireframe bar, because a real caption under a stat is unreadable here.
 */
function Stat({
  value, color, label, size = '5cqw', labelW = '9cqw', center,
}: { value: string; color: string; label: string; size?: string; labelW?: string; center?: boolean }) {
  return (
    <div className={cx('flex flex-col', center && 'items-center')} style={{ gap: '1.2cqh' }}>
      <p
        className="whitespace-nowrap font-display font-semibold tabular-nums"
        style={{ color, fontSize: size, lineHeight: 1, letterSpacing: '-0.02em' }}
      >
        {value}
      </p>
      <Bar w={labelW} h="0.9cqh" color={label} />
    </div>
  )
}

/**
 * MERIDIAN — coffee roaster store (Ecommerce). Dominant colour is the cream page
 * `#f7ece0`; espresso `#2e1b10` is a band, not the hero, and terracotta `#c2551f`
 * is the only accent.
 * Composition decision: this is the one site in the library whose hero does NOT own
 * the card. A roaster sells the shelf, so the four-bag grid is the mass and the hero
 * is a strip above it — which is also what makes the card readable as a STORE at
 * 233px, where a hero-led page reads as "a landing page, colour unknown".
 * The bags are products, not photographs, so they are drawn (fold, body, label) and
 * held to shape by `aspect-ratio`.
 */
function Coffee() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#f7ece0' }}>
      {/* the espresso band: nav + hero, 44% of the card */}
      <div className="relative flex shrink-0 flex-col overflow-hidden" style={{ height: '44%', background: '#2e1b10' }}>
        <span
          className="absolute"
          style={{ right: '-10cqw', top: '-40%', width: '54cqw', height: '180%', background: 'radial-gradient(50% 50% at 50% 50%,#c2551f4d 0%,#c2551f00 70%)' }}
        />
        <div className="flex shrink-0 items-center justify-between" style={{ height: '24%', paddingInline: '4cqw' }}>
          <Wordmark color="#f7ece0" size="3.6cqw">MERIDIAN</Wordmark>
          <NavLinks n={4} color="#f7ece066" w="4cqw" gap="2.6cqw" />
          <div className="flex items-center" style={{ gap: '1.8cqw' }}>
            <Bar w="3cqw" h="1cqh" color="#f7ece08c" />
            <Pill w="8.5cqw" h="3.6cqh" bg="#c2551f" label="#ffffffa6" />
          </div>
        </div>
        <div className="relative flex flex-1 items-start justify-between" style={{ paddingInline: '4cqw' }}>
          <div className="flex flex-col" style={{ gap: '2.6cqh' }}>
            <p
              className="whitespace-nowrap font-display font-semibold"
              style={{ color: '#f7ece0', fontSize: '4.2cqw', lineHeight: 1.14, letterSpacing: '-0.025em' }}
            >
              Roasted Monday.<br />On your shelf Wednesday.
            </p>
            <Copy rows={2} color="#f7ece033" w="28cqw" h="1.1cqh" gap="1.2cqh" />
            <Pill w="17cqw" h="5cqh" bg="#c2551f" label="#2e1b1080" />
          </div>
          {/* the hero bag, shape held by aspect-ratio */}
          <div className="relative shrink-0" style={{ height: '86%', aspectRatio: '0.66', alignSelf: 'flex-end' }}>
            <span
              className="absolute inset-x-0 top-0"
              style={{ height: '12%', background: '#f0d7ba', borderRadius: '0.6cqw 0.6cqw 0.2cqw 0.2cqw' }}
            />
            <span
              className="absolute inset-x-0"
              style={{
                top: '9%', bottom: 0, borderRadius: '0.8cqw',
                background: 'linear-gradient(102deg,#ffffff26 0%,#ffffff00 26%),linear-gradient(168deg,#4a3121 0%,#33200f 52%,#1b1008 100%)',
              }}
            />
            <span className="absolute left-1/2 -translate-x-1/2" style={{ top: '40%', width: '72%', height: '26%', background: '#c2551f', borderRadius: '0.5cqw' }} />
          </div>
        </div>
      </div>

      {/* the shelf: section head, four bags, then the footer strip */}
      <div className="flex shrink-0 items-end justify-between" style={{ height: '9%', paddingInline: '4cqw' }}>
        <p className="whitespace-nowrap font-display font-semibold" style={{ color: '#2e1b10', fontSize: '3.2cqw', lineHeight: 1, letterSpacing: '-0.02em' }}>
          Single origin
        </p>
        <Bar w="8cqw" h="1cqh" color="#2e1b1040" />
      </div>
      <div className="flex flex-1 items-stretch" style={{ paddingInline: '4cqw', paddingTop: '2cqh', paddingBottom: '2cqh', gap: '2.4cqw' }}>
        {[
          { bag: 'linear-gradient(166deg,#4a3121,#1d120b)', price: '$18' },
          { bag: 'linear-gradient(166deg,#8a4a24,#4a2412)', price: '$22' },
          { bag: 'linear-gradient(166deg,#c2551f,#7a3210)', price: '$16' },
          { bag: 'linear-gradient(166deg,#5d6b4a,#2c3423)', price: '$24' },
        ].map((p) => (
          <div key={p.price} className="flex flex-1 flex-col" style={{ gap: '1.4cqh' }}>
            <div className="relative flex flex-1 items-end justify-center overflow-hidden" style={{ background: '#efe0cd', borderRadius: '1.2cqw' }}>
              <div className="relative" style={{ height: '74%', aspectRatio: '0.66', background: p.bag, borderRadius: '0.7cqw 0.7cqw 0.4cqw 0.4cqw' }}>
                <span className="absolute left-1/2 -translate-x-1/2" style={{ top: '38%', width: '70%', height: '22%', background: '#f7ece0a6', borderRadius: '0.3cqw' }} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Bar w="58%" h="1cqh" color="#2e1b1033" />
              <p className="whitespace-nowrap font-display font-semibold tabular-nums" style={{ color: '#2e1b10', fontSize: '2.7cqw', lineHeight: 1 }}>{p.price}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center justify-between" style={{ height: '13%', background: '#2e1b10', paddingInline: '4cqw' }}>
        <Wordmark color="#f7ece0" size="2.8cqw">MERIDIAN</Wordmark>
        <div className="flex items-center" style={{ gap: '3cqw' }}>
          <NavLinks n={3} color="#f7ece040" w="5cqw" gap="3cqw" />
          <Pill w="10cqw" h="3.4cqh" border="#f7ece033" label="#f7ece073" />
        </div>
      </div>
    </div>
  )
}

/**
 * ODEON — fashion lookbook store (Ecommerce). Dominant colour is paper white with
 * `#0a0a0a` type; the only chroma on the card is one vermilion `#e5321a` tag.
 * Composition decision: a hard vertical split, type left and one full-bleed image
 * column right that runs past the top and bottom edges — the editorial device, and
 * the opposite of every centred-hero card in the library. The nav spans only the type
 * side, which is why it looks like a magazine spread rather than a website chrome.
 * The three tiles under the headline are colour swatches, the shop's actual content.
 */
function Fashion() {
  return (
    <div className="relative h-full w-full overflow-hidden font-sans" style={{ background: '#ffffff' }}>
      {/* the image column: two panels, full bleed, a white gutter between them */}
      <Photo
        className="absolute"
        style={{ right: 0, top: 0, width: '42%', height: '68%', background: 'linear-gradient(196deg,#54565c 0%,#2b2c30 44%,#111114 100%)' }}
      >
        <span className="absolute" style={{ left: '-6%', top: '18%', width: '58%', height: '64%', background: 'radial-gradient(50% 50% at 50% 50%,#c9bfae4d 0%,#c9bfae00 72%)' }} />
        {/* The one piece of colour on the card, wholly INSIDE the panel. Straddling the
            panel's edge (or anchoring it to the card) put it half over white and clipped
            it against the panel's overflow at one size or the other. */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: '7%', top: '9%', width: '11cqw', height: '5cqh', background: '#e5321a', transform: 'rotate(-6deg)', borderRadius: '0.4cqw' }}
        >
          <Bar w="62%" h="1cqh" color="#ffffffd9" />
        </div>
        {/* the price tag the board floats over the shot */}
        <div className="absolute flex items-center bg-white" style={{ left: '10%', bottom: '9%', padding: '1cqw', gap: '1.2cqw', borderRadius: '0.6cqw' }}>
          <Bar w="7cqw" h="0.9cqh" color="#0a0a0a33" />
          <p className="whitespace-nowrap font-display font-semibold tabular-nums" style={{ color: '#0a0a0a', fontSize: '2.4cqw', lineHeight: 1 }}>$240</p>
        </div>
      </Photo>
      <Photo
        className="absolute"
        style={{ right: 0, top: '69%', bottom: 0, width: '42%', background: 'linear-gradient(20deg,#d8d2c8 0%,#a79c8d 58%,#6f665c 100%)' }}
      />
      {/* the type side */}
      <div className="absolute flex flex-col" style={{ left: 0, top: 0, bottom: 0, width: '58%' }}>
        <div className="flex shrink-0 items-center justify-between" style={{ height: '13%', paddingInline: '4cqw' }}>
          <NavLinks n={3} color="#0a0a0a59" w="3.6cqw" gap="2.4cqw" />
          <span className="whitespace-nowrap font-display font-semibold" style={{ color: '#0a0a0a', fontSize: '3.4cqw', lineHeight: 1, letterSpacing: '0.26em' }}>
            ODEON
          </span>
          <div className="flex items-center" style={{ gap: '1.4cqw' }}>
            <Bar w="3cqw" h="1cqh" color="#0a0a0a59" />
            <span className="block rounded-full" style={{ width: '2.4cqw', height: '2.4cqw', background: '#0a0a0a' }} />
          </div>
        </div>
        <span className="shrink-0" style={{ marginInline: '4cqw', height: '0.25cqw', background: '#0a0a0a1f' }} />

        <div className="flex flex-1 flex-col justify-center" style={{ paddingInline: '4cqw', gap: '3cqh' }}>
          <p
            className="whitespace-nowrap font-display font-semibold"
            style={{ color: '#0a0a0a', fontSize: '9.6cqw', lineHeight: 0.94, letterSpacing: '-0.045em' }}
          >
            SPRING<br />SUMMER<br />26
          </p>
          <Copy rows={2} color="#0a0a0a26" w="26cqw" h="1.1cqh" gap="1.2cqh" />
          <div className="flex items-center" style={{ gap: '2cqw' }}>
            <Pill w="20cqw" h="5.4cqh" bg="#0a0a0a" label="#ffffffa6" />
            <div className="flex items-center" style={{ gap: '1.2cqw' }}>
              {['#1c1c1e', '#b9a288', '#7d8a76'].map((c) => (
                <span key={c} className="block" style={{ width: '4cqw', height: '4cqw', background: c, borderRadius: '0.4cqw' }} />
              ))}
            </div>
          </div>
        </div>

        {/* the lookbook index the crop catches at the bottom */}
        <div className="flex shrink-0 items-center justify-between" style={{ height: '13%', paddingInline: '4cqw', borderTop: '0.25cqw solid #0a0a0a1f' }}>
          <p className="whitespace-nowrap tabular-nums" style={{ color: '#0a0a0a', fontSize: '2.5cqw', lineHeight: 1, letterSpacing: '0.1em' }}>
            LOOKBOOK 01
          </p>
          <NavLinks n={2} color="#0a0a0a33" w="5cqw" gap="2cqw" />
        </div>
      </div>
    </div>
  )
}

/**
 * forge — developer-tools landing page (Tech & SaaS). Dominant colour is blue-black
 * `#0b1016`, accent cyan `#3ddbd9`; the syntax palette in the editor is the only
 * other chroma. Distinct from `crypto`, the library's other near-black page, by hue
 * (blue rather than violet) and by subject: an editor window instead of a glowing orb.
 * Monospace is real here — the wordmark, the `$` in the install line and the build
 * time — but the code itself is token BARS: nine rows of real 5px code would be mush,
 * and indent plus token colour is what makes a pane read as code anyway.
 */
function Devtools() {
  const code: { pad: string; toks: [string, string][] }[] = [
    { pad: '0cqw', toks: [['4cqw', '#c792ea'], ['7cqw', '#82aaff'], ['3cqw', '#59708a']] },
    { pad: '2.4cqw', toks: [['3cqw', '#3ddbd9'], ['8cqw', '#ecc48d']] },
    { pad: '2.4cqw', toks: [['5cqw', '#c792ea'], ['4cqw', '#e6e6ea'], ['6cqw', '#82aaff']] },
    { pad: '4.8cqw', toks: [['6cqw', '#ecc48d'], ['3cqw', '#59708a']] },
    { pad: '4.8cqw', toks: [['4cqw', '#3ddbd9'], ['5cqw', '#e6e6ea'], ['3cqw', '#c792ea']] },
    { pad: '2.4cqw', toks: [['3cqw', '#e6e6ea']] },
    { pad: '0cqw', toks: [['5cqw', '#c792ea'], ['6cqw', '#82aaff'], ['4cqw', '#ecc48d']] },
    { pad: '2.4cqw', toks: [['7cqw', '#3ddbd9'], ['4cqw', '#e6e6ea']] },
  ]
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#0b1016' }}>
      <span
        className="absolute"
        style={{ left: '18%', top: '-30%', width: '70cqw', height: '110%', background: 'radial-gradient(50% 50% at 50% 50%,#3ddbd91f 0%,#3ddbd900 70%)' }}
      />
      <div className="relative flex shrink-0 items-center justify-between" style={{ height: '9%', paddingInline: '3.5cqw' }}>
        <div className="flex items-center" style={{ gap: '1.4cqw' }}>
          <span className="block" style={{ width: '2.6cqw', height: '2.6cqw', background: '#3ddbd9', borderRadius: '0.5cqw', transform: 'rotate(45deg)' }} />
          <span className="whitespace-nowrap font-mono" style={{ color: '#ffffff', fontSize: '3cqw', lineHeight: 1, letterSpacing: '-0.02em' }}>forge</span>
        </div>
        <NavLinks n={4} color="#ffffff4d" w="3.8cqw" gap="2.4cqw" />
        <div className="flex items-center" style={{ gap: '1.6cqw' }}>
          <span className="whitespace-nowrap font-mono" style={{ color: '#ffffff59', fontSize: '2.2cqw', lineHeight: 1 }}>v2.4</span>
          <Pill w="9cqw" h="3.6cqh" bg="#3ddbd9" label="#06222699" />
        </div>
      </div>

      <div className="relative flex flex-1" style={{ paddingInline: '3.5cqw', paddingTop: '3cqh', gap: '3cqw' }}>
        {/* left: the pitch */}
        <div className="flex flex-col justify-center" style={{ width: '38%', gap: '2.4cqh' }}>
          <span className="flex items-center self-start rounded-full" style={{ padding: '1cqw', gap: '1.2cqw', boxShadow: 'inset 0 0 0 0.3cqw #3ddbd93d' }}>
            <span className="block rounded-full" style={{ width: '1.4cqw', height: '1.4cqw', background: '#3ddbd9' }} />
            <Bar w="8cqw" h="0.9cqh" color="#3ddbd9a6" />
          </span>
          <p
            className="whitespace-nowrap font-display font-semibold"
            style={{ color: '#eef4f7', fontSize: '4.6cqw', lineHeight: 1.16, letterSpacing: '-0.03em' }}
          >
            Ship your backend<br />in <span style={{ color: '#3ddbd9' }}>one command</span>
          </p>
          <Copy rows={2} color="#ffffff33" w="100%" h="1.1cqh" gap="1.2cqh" />
          {/* the install line: a real mono $, then bars — the command is texture, not text */}
          <div
            className="flex items-center justify-between"
            style={{ height: '6cqh', paddingInline: '1.4cqw', background: '#111a24', borderRadius: '0.8cqw', boxShadow: 'inset 0 0 0 0.25cqw #ffffff14' }}
          >
            <div className="flex items-center" style={{ gap: '1.2cqw' }}>
              <span className="whitespace-nowrap font-mono" style={{ color: '#3ddbd9', fontSize: '2.4cqw', lineHeight: 1 }}>$</span>
              <Bar w="7cqw" h="1cqh" color="#ffffff59" />
              <Bar w="4cqw" h="1cqh" color="#ffffff2e" />
            </div>
            <span className="block shrink-0" style={{ width: '2cqw', height: '2cqw', boxShadow: 'inset 0 0 0 0.25cqw #ffffff3d', borderRadius: '0.3cqw' }} />
          </div>
          <div className="flex items-center" style={{ gap: '1.8cqw' }}>
            <Pill w="14cqw" h="5cqh" bg="#3ddbd9" label="#06222699" />
            <Pill w="12cqw" h="5cqh" border="#ffffff26" label="#ffffff8c" />
          </div>
        </div>

        {/* right: the editor window, cut by the bottom band */}
        <div className="relative flex flex-1 flex-col overflow-hidden" style={{ background: '#0f1621', borderRadius: '1.4cqw 1.4cqw 0 0', boxShadow: 'inset 0 0 0 0.25cqw #ffffff14' }}>
          <div className="flex shrink-0 items-center" style={{ height: '13%', paddingInline: '1.6cqw', gap: '1cqw', borderBottom: '0.25cqw solid #ffffff0f' }}>
            {['#ffffff26', '#ffffff1f', '#ffffff1f'].map((c, i) => (
              <span key={i} className="block shrink-0 rounded-full" style={{ width: '1.2cqw', height: '1.2cqw', background: c }} />
            ))}
            <Bar w="7cqw" h="1.6cqh" color="#ffffff0f" radius="0.4cqw" />
            <Bar w="5cqw" h="1.6cqh" color="#ffffff08" radius="0.4cqw" />
          </div>
          <div className="flex flex-1 flex-col" style={{ paddingTop: '1.2cqh', paddingBottom: '1.2cqh', paddingRight: '2cqw' }}>
            {code.map((row, i) => (
              <div key={i} className="flex flex-1 items-center">
                <span className="flex shrink-0 justify-end" style={{ width: '10%', paddingRight: '1cqw' }}>
                  <Bar w="1.6cqw" h="0.85cqh" color="#ffffff1f" />
                </span>
                <div className="flex items-center" style={{ paddingLeft: row.pad, gap: '1.2cqw' }}>
                  {row.toks.map(([w, c], j) => <Bar key={j} w={w} h="0.85cqh" color={c} />)}
                </div>
              </div>
            ))}
          </div>
          {/* the build panel, pinned to the pane's bottom-right */}
          <div className="absolute flex items-center" style={{ right: '2cqw', bottom: '2cqh', padding: '1.2cqw', gap: '1.4cqw', background: '#070c12', borderRadius: '0.8cqw', boxShadow: 'inset 0 0 0 0.25cqw #ffffff14' }}>
            <span className="block rounded-full" style={{ width: '1.6cqw', height: '1.6cqw', background: '#4ade80' }} />
            <Bar w="6cqw" h="0.9cqh" color="#ffffff59" />
            <span className="whitespace-nowrap font-mono tabular-nums" style={{ color: '#4ade80', fontSize: '2.2cqw', lineHeight: 1 }}>1.4s</span>
          </div>
        </div>
      </div>

      {/* the "trusted by" strip */}
      <div className="relative flex shrink-0 items-center justify-center" style={{ height: '12%', background: '#080d13', gap: '4cqw', borderTop: '0.25cqw solid #ffffff0f' }}>
        {['9cqw', '7cqw', '10cqw', '7cqw', '8cqw'].map((w, i) => <Bar key={i} w={w} h="1.5cqh" color="#ffffff26" />)}
      </div>
    </div>
  )
}

/**
 * Lumen — AI analytics product page (Tech & SaaS). Dominant colour is a cool near-white
 * `#f4f5fb` with indigo `#4f46e5`; teal `#14b8a6` is the second series.
 * Distinct from `saas`, the library's other product page, on every axis that reads at
 * thumbnail size: light ground instead of saturated blue, left-aligned hero instead of
 * centred, and a chart card instead of an app window.
 * The chart is a `clip-path` polygon of nine samples — percentages, so it scales — and
 * its "line" is the same ridge walked back 6% lower, i.e. a band. An SVG stroke would
 * need a pixel width, and pixels are what this file does not have.
 */
function Analytics() {
  const series = [70, 56, 62, 41, 47, 27, 34, 15, 22]
  const back = [88, 79, 84, 68, 74, 60, 65, 48, 55]
  const at = (i: number) => `${(i / (series.length - 1)) * 100}%`
  const ridge = series.map((y, i) => `${at(i)} ${y}%`)
  const area = `polygon(${ridge.join(',')},100% 100%,0% 100%)`
  const line = `polygon(${ridge.join(',')},${series.map((y, i) => `${at(i)} ${y + 6}%`).reverse().join(',')})`
  const areaBack = `polygon(${back.map((y, i) => `${at(i)} ${y}%`).join(',')},100% 100%,0% 100%)`
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#f4f5fb' }}>
      <div className="flex shrink-0 items-center justify-between bg-white" style={{ height: '10%', paddingInline: '3.5cqw', borderBottom: '0.25cqw solid #171a2b0f' }}>
        <div className="flex items-center" style={{ gap: '1.4cqw' }}>
          <span className="block" style={{ width: '2.8cqw', height: '2.8cqw', background: 'linear-gradient(140deg,#6366f1,#4f46e5)', borderRadius: '0.7cqw' }} />
          <Wordmark color="#171a2b" size="3.2cqw">Lumen</Wordmark>
        </div>
        <NavLinks n={4} color="#171a2b59" w="4cqw" gap="2.6cqw" />
        <div className="flex items-center" style={{ gap: '1.8cqw' }}>
          <Bar w="3.4cqw" h="1cqh" color="#171a2b73" />
          <Pill w="9.5cqw" h="3.8cqh" bg="#4f46e5" label="#ffffffa6" />
        </div>
      </div>

      <div className="flex flex-1" style={{ paddingInline: '3.5cqw', paddingTop: '3.5cqh', gap: '3cqw' }}>
        {/* the pitch */}
        <div className="flex flex-col" style={{ width: '35%', gap: '2.4cqh' }}>
          <span className="flex items-center self-start rounded-full bg-white" style={{ padding: '1cqw', gap: '1.2cqw', boxShadow: 'inset 0 0 0 0.25cqw #4f46e526' }}>
            <span className="block rounded-full" style={{ width: '1.4cqw', height: '1.4cqw', background: '#4f46e5' }} />
            <Bar w="8cqw" h="0.9cqh" color="#4f46e58c" />
          </span>
          <p
            className="whitespace-nowrap font-display font-semibold"
            style={{ color: '#171a2b', fontSize: '4.6cqw', lineHeight: 1.16, letterSpacing: '-0.03em' }}
          >
            Every metric,<br />explained by <span style={{ color: '#4f46e5' }}>AI</span>
          </p>
          <Copy rows={2} color="#171a2b26" w="100%" h="1.1cqh" gap="1.2cqh" />
          <div className="flex items-center" style={{ gap: '1.8cqw' }}>
            <Pill w="15cqw" h="5cqh" bg="#4f46e5" label="#ffffffa6" />
            <Bar w="8cqw" h="1.1cqh" color="#171a2b40" />
          </div>
        </div>

        {/* the chart card */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-white" style={{ padding: '2cqw', gap: '1.6cqh', borderRadius: '1.6cqw', boxShadow: '0 1.4cqh 3cqw #171a2b14' }}>
          <div className="flex shrink-0 items-center justify-between">
            <div className="flex flex-col" style={{ gap: '1cqh' }}>
              <Bar w="12cqw" h="1.2cqh" color="#171a2b40" />
              <p
                className="whitespace-nowrap font-display font-semibold tabular-nums"
                style={{ color: '#171a2b', fontSize: '3.6cqw', lineHeight: 1, letterSpacing: '-0.02em' }}
              >
                48.2k
              </p>
            </div>
            <div className="flex items-center" style={{ gap: '1cqw' }}>
              <Bar w="5cqw" h="2cqh" color="#4f46e5" radius="0.5cqw" />
              <Bar w="5cqw" h="2cqh" color="#171a2b0f" radius="0.5cqw" />
            </div>
          </div>
          {/* the plot: gridlines, the teal series behind, the indigo series in front */}
          <div className="relative flex-1">
            {['22%', '48%', '74%'].map((top) => (
              <span key={top} className="absolute inset-x-0" style={{ top, height: '0.2cqw', background: '#171a2b14' }} />
            ))}
            <span className="absolute inset-0" style={{ clipPath: areaBack, background: 'linear-gradient(180deg,#14b8a640 0%,#14b8a600 78%)' }} />
            <span className="absolute inset-0" style={{ clipPath: area, background: 'linear-gradient(180deg,#4f46e559 0%,#4f46e500 82%)' }} />
            <span className="absolute inset-0" style={{ clipPath: line, background: '#4f46e5' }} />
          </div>
          <div className="flex shrink-0 items-center justify-between">
            {['4cqw', '4cqw', '4cqw', '4cqw', '4cqw', '4cqw', '4cqw'].map((w, i) => <Bar key={i} w={w} h="0.8cqh" color="#171a2b1f" />)}
          </div>
        </div>
      </div>

      {/* the three metric tiles; the middle one carries the only column chart */}
      <div className="flex shrink-0" style={{ paddingInline: '3.5cqw', paddingTop: '2.5cqh', paddingBottom: '3cqh', height: '30%', gap: '2.4cqw' }}>
        <div className="flex flex-1 items-center justify-between bg-white" style={{ padding: '1.8cqw', borderRadius: '1.2cqw' }}>
          <Stat value="+38%" color="#171a2b" label="#171a2b26" size="4cqw" labelW="11cqw" />
          <span className="block rounded-full" style={{ width: '4.6cqw', height: '4.6cqw', background: '#4f46e514' }} />
        </div>
        <div className="flex flex-1 flex-col justify-between bg-white" style={{ padding: '1.8cqw', borderRadius: '1.2cqw' }}>
          <Bar w="9cqw" h="1cqh" color="#171a2b26" />
          {/* Bars measured as percentages of their own row, not in cqh: the tile's
              height is a percentage of the card, so cqh bars would drift against the
              tile as the aspect changes. Inline rather than a primitive — one site
              needs a column chart, and this file only promotes a part on the second
              caller. */}
          <div className="flex w-full items-end" style={{ height: '52%', gap: '0.9cqw' }}>
            {[38, 62, 44, 78, 56, 92, 70].map((v, i) => (
              <span
                key={i}
                className="block flex-1"
                style={{ height: `${v}%`, background: i === 5 ? '#4f46e5' : '#c7c9f5', borderRadius: '0.4cqw 0.4cqw 0 0' }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-between bg-white" style={{ padding: '1.8cqw', borderRadius: '1.2cqw' }}>
          <Stat value="0.9s" color="#171a2b" label="#171a2b26" size="4cqw" labelW="9cqw" />
          {/* the donut: a conic gradient with a white plug — no arithmetic, no repaint */}
          <span className="relative block rounded-full" style={{ width: '6.4cqw', height: '6.4cqw', background: 'conic-gradient(#4f46e5 0turn 0.62turn,#14b8a6 0.62turn 0.84turn,#171a2b14 0.84turn 1turn)' }}>
            <span className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{ width: '54%', height: '54%' }} />
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * KORE STUDIO — photographer's portfolio (Portfolio). Dominant colour is near-black
 * `#0b0b0c`; there is no accent hue at all, only one amber "available" dot.
 * Composition decision: the work is the page. Four columns of gradient panels fill
 * everything between a big wordmark row and a thin index footer — no hero copy, no
 * buttons, no CTA. That absence is what separates it from `media` and `agency`, the
 * library's other dark pages, both of which are type-led. Panel heights use flex
 * ratios, so the mosaic keeps its rhythm at any aspect.
 */
function Photography() {
  const panels: [string, number][][] = [
    [['linear-gradient(196deg,#7c8794 0%,#2c333b 62%,#14181d 100%)', 1]],
    [['linear-gradient(166deg,#d3bb98 0%,#8a6f4d 60%,#40311f 100%)', 3], ['linear-gradient(200deg,#5b6b6a 0%,#1c2422 100%)', 2]],
    [['linear-gradient(180deg,#4c5a6b 0%,#1a2028 58%,#0d1014 100%)', 2], ['linear-gradient(150deg,#b5a3ad 0%,#4a3d46 62%,#221c22 100%)', 3]],
    [['linear-gradient(210deg,#9aa3a8 0%,#3c4348 56%,#171a1c 100%)', 1]],
  ]
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#0b0b0c' }}>
      <div className="flex shrink-0 items-center justify-between" style={{ height: '16%', paddingInline: '3.5cqw' }}>
        <span className="whitespace-nowrap font-display font-semibold" style={{ color: '#f4f2ee', fontSize: '6.2cqw', lineHeight: 1, letterSpacing: '0.02em' }}>
          KORE
        </span>
        <div className="flex items-center" style={{ gap: '2.6cqw' }}>
          <span className="flex items-center" style={{ gap: '1.2cqw' }}>
            <span className="block rounded-full" style={{ width: '1.4cqw', height: '1.4cqw', background: '#d8a35c' }} />
            <Bar w="7cqw" h="1cqh" color="#f4f2ee59" />
          </span>
          <NavLinks n={3} color="#f4f2ee59" w="4cqw" gap="2.4cqw" />
          <Pill w="11cqw" h="4cqh" border="#f4f2ee33" label="#f4f2eea6" />
        </div>
      </div>

      {/* the mosaic */}
      <div className="flex flex-1" style={{ paddingInline: '3.5cqw', gap: '1.6cqw' }}>
        {panels.map((col, ci) => (
          <div key={ci} className="flex flex-1 flex-col" style={{ gap: '1.6cqw' }}>
            {col.map(([g, grow], ri) => (
              <Photo key={ri} className="relative" style={{ flex: grow, background: g, borderRadius: '0.8cqw' }}>
                {/* one panel carries a caption, so the mosaic reads as captioned work */}
                {ci === 1 && ri === 0 ? (
                  <div className="absolute flex flex-col" style={{ left: '9%', bottom: '8%', gap: '0.9cqh' }}>
                    <Bar w="9cqw" h="1cqh" color="#f4f2eecc" />
                    <Bar w="6cqw" h="0.85cqh" color="#f4f2ee73" />
                  </div>
                ) : null}
              </Photo>
            ))}
          </div>
        ))}
      </div>

      {/* the index footer */}
      <div className="flex shrink-0 items-center justify-between" style={{ height: '15%', paddingInline: '3.5cqw' }}>
        <p className="whitespace-nowrap tabular-nums" style={{ color: '#f4f2ee', fontSize: '2.6cqw', lineHeight: 1, letterSpacing: '0.14em' }}>
          01 / 24
        </p>
        <p className="whitespace-nowrap" style={{ color: '#f4f2ee73', fontSize: '2.5cqw', lineHeight: 1, letterSpacing: '0.18em' }}>
          SELECTED WORK
        </p>
        <span className="block" style={{ width: '3cqw', height: '3cqw', borderTop: '0.3cqw solid #f4f2ee', borderRight: '0.3cqw solid #f4f2ee', transform: 'rotate(45deg)' }} />
      </div>
    </div>
  )
}

/**
 * HALE &amp; MARCH — law firm (Business &amp; services). Dominant colour is deep navy
 * `#0e1c38` with gold `#c8a35c`.
 * Composition decision: NO IMAGE ANYWHERE — not even a gradient panel. Authority on a
 * law-firm page comes from symmetry, rules and tracked capitals, and a stand-in photo
 * block would be the first thing to cheapen it. That makes this the only card in the
 * library built entirely from type, hairlines and one metal accent, which is exactly
 * why it is legible as "professional services" at 233px.
 * The board asks for a serif; the prototype ships none, so this follows the AURA
 * precedent — display face, wide tracking, small caps rhythm.
 */
function Lawfirm() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#0e1c38' }}>
      <div className="flex shrink-0 items-center justify-between" style={{ height: '11%', paddingInline: '4cqw', borderBottom: '0.25cqw solid #ffffff14' }}>
        <span className="whitespace-nowrap font-display font-semibold" style={{ color: '#eef1f7', fontSize: '3.2cqw', lineHeight: 1, letterSpacing: '0.14em' }}>
          HALE &amp; MARCH
        </span>
        <NavLinks n={4} color="#eef1f759" w="4cqw" gap="2.6cqw" />
        <Pill w="13cqw" h="4cqh" border="#c8a35c73" label="#c8a35c" />
      </div>

      {/* the centred hero — flex-1, so a taller headline squeezes the air, not the band below */}
      <div className="flex flex-1 flex-col items-center justify-center" style={{ paddingInline: '8cqw', gap: '2.6cqh' }}>
        <Bar w="8cqw" h="0.4cqw" color="#c8a35c" radius="0" />
        <p
          className="whitespace-nowrap text-center font-display font-semibold"
          style={{ color: '#eef1f7', fontSize: '4.9cqw', lineHeight: 1.2, letterSpacing: '-0.01em' }}
        >
          Counsel that holds<br />under pressure
        </p>
        <Copy rows={2} color="#eef1f733" w="40cqw" h="1.1cqh" gap="1.2cqh" center />
        <div className="flex items-center" style={{ gap: '2cqw' }}>
          <Pill w="17cqw" h="5.2cqh" bg="#c8a35c" label="#0e1c3899" />
          <Pill w="15cqw" h="5.2cqh" border="#eef1f733" label="#eef1f7a6" />
        </div>
      </div>

      {/* practice areas, divided by gold rules */}
      <div className="flex shrink-0" style={{ height: '25%', paddingInline: '4cqw', borderTop: '0.25cqw solid #ffffff14' }}>
        {['01', '02', '03'].map((n, i) => (
          <div
            key={n}
            className="flex flex-1 flex-col justify-center"
            style={{ paddingInline: '2.4cqw', gap: '1.4cqh', borderLeft: i ? '0.25cqw solid #c8a35c3d' : undefined }}
          >
            <p className="whitespace-nowrap font-display font-semibold tabular-nums" style={{ color: '#c8a35c', fontSize: '2.8cqw', lineHeight: 1, letterSpacing: '0.08em' }}>
              {n}
            </p>
            <Bar w="62%" h="1.2cqh" color="#eef1f7a6" />
            <Copy rows={2} color="#eef1f726" w="100%" h="0.9cqh" gap="0.9cqh" />
          </div>
        ))}
      </div>

      {/* the proof band */}
      <div className="flex shrink-0 items-center justify-around" style={{ height: '20%', background: '#0a1428', borderTop: '0.25cqw solid #c8a35c3d' }}>
        <Stat value="40+" color="#c8a35c" label="#eef1f733" size="4.6cqw" labelW="10cqw" center />
        <Stat value="$1.2B" color="#c8a35c" label="#eef1f733" size="4.6cqw" labelW="12cqw" center />
        <Stat value="98%" color="#c8a35c" label="#eef1f733" size="4.6cqw" labelW="9cqw" center />
      </div>
    </div>
  )
}

/**
 * Still — yoga studio (Health And Beauty). Dominant colour is warm sand `#e7ddcc`
 * with stone ink `#3d372e` and one clay accent `#a2603f`.
 * Composition decision: the whole card stays ONE tone. Every other light page in the
 * library breaks into a contrasting band (AURA's green strip, ArchiForm's white
 * footer, Serena's photo); here the only tonal event is the arch, so calm is the
 * thing the thumbnail communicates before you read a word. Type carries it instead:
 * the headline is 6.4cqw, the largest in the library outside the wordmark cards.
 * The arch is the mockup's studio interior — a gradient, per NO PEOPLE, its shape
 * held by `aspect-ratio` so it stays an arch and not a lozenge at 1600×880.
 */
function Yoga() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#e7ddcc' }}>
      <div className="flex shrink-0 items-center justify-between" style={{ height: '10%', paddingInline: '4.5cqw' }}>
        <Wordmark color="#3d372e" size="4cqw">Still</Wordmark>
        <NavLinks n={4} color="#3d372e59" w="4cqw" gap="2.6cqw" />
        <Pill w="13cqw" h="4cqh" bg="#a2603f" label="#ffffffa6" />
      </div>

      <div className="flex flex-1 items-center" style={{ paddingInline: '4.5cqw', gap: '3cqw' }}>
        <div className="flex flex-1 flex-col" style={{ gap: '3cqh' }}>
          <p
            className="whitespace-nowrap font-display font-semibold"
            style={{ color: '#3d372e', fontSize: '6.4cqw', lineHeight: 1.1, letterSpacing: '-0.03em' }}
          >
            Slow flow,<br />every morning.
          </p>
          <Copy rows={2} color="#3d372e2e" w="80%" h="1.1cqh" gap="1.2cqh" />
          <div className="flex items-center" style={{ gap: '2cqw' }}>
            <Pill w="17cqw" h="5.2cqh" bg="#3d372e" label="#e7ddccbf" />
            <Bar w="8cqw" h="1.1cqh" color="#3d372e59" />
          </div>
        </div>
        {/* the arch */}
        <Photo
          className="relative shrink-0"
          style={{
            height: '88%', aspectRatio: '0.62',
            borderRadius: '50% 50% 1.2cqw 1.2cqw / 34% 34% 1.2cqw 1.2cqw',
            background: 'linear-gradient(168deg,#efe7d8 0%,#c9c3ac 42%,#98a086 74%,#6f7861 100%)',
          }}
        >
          <span className="absolute" style={{ left: '18%', top: '12%', width: '54%', height: '46%', background: 'radial-gradient(50% 50% at 50% 50%,#fff6e099 0%,#fff6e000 72%)' }} />
        </Photo>
      </div>

      {/* the timetable — three rows, hairline-ruled, no band and no colour change */}
      <div className="flex shrink-0 flex-col" style={{ height: '34%', paddingInline: '4.5cqw', paddingBottom: '2cqh' }}>
        {[
          { t: '7:00', w: '22cqw' },
          { t: '9:30', w: '18cqw' },
          { t: '18:00', w: '24cqw' },
        ].map((r) => (
          <div key={r.t} className="flex flex-1 items-center" style={{ gap: '2.4cqw', borderTop: '0.25cqw solid #3d372e26' }}>
            <p className="shrink-0 whitespace-nowrap font-display font-semibold tabular-nums" style={{ width: '14%', color: '#3d372e', fontSize: '3cqw', lineHeight: 1 }}>
              {r.t}
            </p>
            <Bar w={r.w} h="1.2cqh" color="#3d372e73" />
            <span className="flex-1" />
            <Bar w="6cqw" h="1cqh" color="#3d372e40" />
            <Pill w="9cqw" h="3.6cqh" border="#3d372e33" label="#3d372e8c" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * IRONSIDE — barbershop (Health And Beauty). Dominant colour is warm charcoal
 * `#171413`, and vermilion `#ff4d24` is the single accent — nothing else on the card
 * carries chroma, which is the brief and also what keeps it apart from `restaurant`
 * (burgundy + gold) and `photography` (near-black, no accent at all).
 * Composition decision: brutal three-line capitals left, the shop's own facts in the
 * middle, one interior panel right, and then the thing an actual barbershop site
 * lives on — a price list.
 * ⚠️ Three things here are the way they are because of the WIDE end of the size
 * contract, and all three looked fine at 233px:
 *  · The middle hours column exists because a two-column hero (type left, photo
 *    right) left ~40% of a 1600×880 frame as empty near-black — a page with a
 *    missing column. The fill has to be content the shop would really publish.
 *  · The price list is TWO columns. One column put the label hard left and the price
 *    hard right with ~1000px of leader between them: a void with two ends.
 *  · The footer is a dark band with a vermilion RULE, not a vermilion band. Full
 *    bleed, the accent stopped reading as a footer and started reading as a raw
 *    slab or a progress bar; the other dark sites here all end on a darker band.
 *    The accent survives as the rule plus one small control.
 */
function Barbershop() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden font-sans" style={{ background: '#171413' }}>
      <div className="flex shrink-0 items-center justify-between" style={{ height: '10%', paddingInline: '4cqw' }}>
        <span className="whitespace-nowrap font-display font-semibold" style={{ color: '#f3efe9', fontSize: '3.2cqw', lineHeight: 1, letterSpacing: '0.16em' }}>
          IRONSIDE
        </span>
        <NavLinks n={4} color="#f3efe959" w="4cqw" gap="2.6cqw" />
        <Pill w="11cqw" h="4cqh" bg="#ff4d24" label="#ffffffbf" />
      </div>

      {/* justify-between, and the type column is shrink-0 rather than flex-1: with a
          flex-1 headline every pixel of slack pooled into one gap beside it, which is
          the void again in a smaller size. Spread between three blocks it reads as
          margin. */}
      <div className="flex flex-1 items-center justify-between" style={{ paddingInline: '4cqw', gap: '3cqw' }}>
        <div className="flex shrink-0 flex-col" style={{ gap: '3cqh' }}>
          <p
            className="whitespace-nowrap font-display font-semibold"
            style={{ color: '#f3efe9', fontSize: '7cqw', lineHeight: 0.96, letterSpacing: '-0.03em' }}
          >
            SHARP<br />EVERY<br /><span style={{ color: '#ff4d24' }}>TIME</span>
          </p>
          <div className="flex items-center" style={{ gap: '2cqw' }}>
            <Pill w="16cqw" h="5.2cqh" bg="#ff4d24" label="#ffffffbf" />
            <Pill w="13cqw" h="5.2cqh" border="#f3efe926" label="#f3efe98c" />
          </div>
        </div>

        {/* the opening hours, ruled off the headline. The divider stretches with the
            hero, so it is `self-stretch` inside a padded wrapper rather than a
            percentage height against an auto-height parent (which collapses) */}
        <div className="flex shrink-0 self-stretch items-center" style={{ gap: '2.4cqw', paddingTop: '7cqh', paddingBottom: '7cqh' }}>
          <span className="block self-stretch shrink-0" style={{ width: '0.25cqw', background: '#f3efe91f' }} />
          <div className="flex flex-col justify-center" style={{ width: '21cqw', gap: '1.5cqh' }}>
            <div className="flex items-center" style={{ gap: '1.2cqw' }}>
              <span className="block shrink-0 rounded-full" style={{ width: '1.5cqw', height: '1.5cqw', background: '#ff4d24' }} />
              <Bar w="12cqw" h="1cqh" color="#f3efe9a6" />
            </div>
            {[['8cqw', '5cqw'], ['6.5cqw', '5cqw'], ['7cqw', '4cqw']].map(([day, hrs], i) => (
              <div
                key={i}
                className="flex items-center justify-between"
                style={{ paddingTop: '1.2cqh', borderTop: '0.25cqw solid #f3efe914' }}
              >
                <Bar w={day} h="0.9cqh" color="#f3efe973" />
                <Bar w={hrs} h="0.9cqh" color="#f3efe94d" />
              </div>
            ))}
            <Pill w="14cqw" h="4cqh" border="#f3efe926" label="#f3efe98c" />
          </div>
        </div>

        {/* The shop interior. A PHOTO may follow the card's aspect — panels are cropped
            in real life — so this one is sized in percentages, unlike the coffee bag or
            the yoga arch, which are objects and need `aspect-ratio` to keep their shape.
            Held to aspect it went narrow at 1600×880 and left a dead zone mid-hero. */}
        <Photo
          className="relative shrink-0"
          style={{
            width: '30%', height: '92%', borderRadius: '1.2cqw',
            background: 'linear-gradient(202deg,#6b5140 0%,#3a2b22 46%,#171110 100%)',
          }}
        >
          <span className="absolute" style={{ left: '14%', top: '10%', width: '46%', height: '38%', background: 'radial-gradient(50% 50% at 50% 50%,#ffd9a666 0%,#ffd9a600 74%)' }} />
          {/* A rating badge, INSIDE the panel and legible as a badge: dark chip,
              vermilion mark, a real number. The bare orange square that used to hang
              off this corner read as a stray artifact rather than an accent. */}
          <span
            className="absolute flex items-center"
            style={{
              left: '8%', bottom: '8%', height: '5cqh', paddingInline: '1.2cqw', gap: '1cqw',
              background: '#0f0d0ce6', borderRadius: '0.5cqw', boxShadow: 'inset 0 0 0 0.25cqw #f3efe91f',
            }}
          >
            <span className="block shrink-0" style={{ width: '1.6cqw', height: '1.6cqw', background: '#ff4d24', transform: 'rotate(45deg)' }} />
            <span className="whitespace-nowrap font-display font-semibold tabular-nums" style={{ color: '#f3efe9', fontSize: '2.4cqw', lineHeight: 1 }}>
              4.9
            </span>
          </span>
        </Photo>
      </div>

      {/* the price list, two columns */}
      <div
        className="grid shrink-0"
        style={{ height: '31%', paddingInline: '4cqw', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', columnGap: '7cqw' }}
      >
        {[
          { w: '20cqw', p: '$35' },
          { w: '16cqw', p: '$28' },
          { w: '24cqw', p: '$45' },
          { w: '18cqw', p: '$22' },
        ].map((r) => (
          <div key={r.p} className="flex items-center" style={{ gap: '2cqw', borderTop: '0.25cqw solid #f3efe91a' }}>
            <Bar w={r.w} h="1.2cqh" color="#f3efe999" />
            <span className="flex-1" style={{ height: '0.2cqw', background: '#f3efe914' }} />
            <p className="whitespace-nowrap font-display font-semibold tabular-nums" style={{ color: '#f3efe9', fontSize: '3cqw', lineHeight: 1 }}>{r.p}</p>
          </div>
        ))}
      </div>

      {/* the footer: a darker band under a vermilion rule */}
      <div
        className="flex shrink-0 items-center justify-between"
        style={{ height: '12%', background: '#0f0d0c', paddingInline: '4cqw', borderTop: '0.35cqw solid #ff4d24' }}
      >
        <span className="whitespace-nowrap font-display font-semibold" style={{ color: '#f3efe9', fontSize: '2.6cqw', lineHeight: 1, letterSpacing: '0.16em' }}>
          IRONSIDE
        </span>
        <div className="flex items-center" style={{ gap: '2.6cqw' }}>
          <NavLinks n={3} color="#f3efe940" w="5cqw" gap="2.6cqw" />
          <Pill w="10cqw" h="3.6cqh" bg="#ff4d24" label="#2b0f06bf" />
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────── the export ──────────────────────────────── */

const SITES: Record<ThumbId, () => JSX.Element> = {
  payments: Payments,
  homeware: Homeware,
  campaign: Campaign,
  media: Media,
  architecture: Architecture,
  wellness: Wellness,
  agency: Agency,
  saas: Saas,
  restaurant: Restaurant,
  crypto: Crypto,
  coffee: Coffee,
  fashion: Fashion,
  devtools: Devtools,
  analytics: Analytics,
  photography: Photography,
  lawfirm: Lawfirm,
  yoga: Yoga,
  barbershop: Barbershop,
  synco: Synco,
}

/**
 * Drop-in miniature site. The caller owns the box — pass `absolute inset-0` (or any class
 * that gives the element a definite size) and the drawing fills it.
 */
export function Thumb({ id, className }: { id: ThumbId; className?: string }) {
  const Site = SITES[id]
  return (
    <div className={className} style={{ containerType: 'size' }}>
      <div className="relative h-full w-full overflow-hidden">
        <Site />
      </div>
    </div>
  )
}
