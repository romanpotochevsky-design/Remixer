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
 * Headline lines are `whitespace-nowrap` with explicit `<br/>`s. Letting them wrap on
 * their own is what breaks these layouts: a headline that reflows into one extra line
 * walks straight into the photo below it, and it does so only at some sizes.
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
    <div className="relative h-full w-full font-sans" style={{ background: '#1d2a19' }}>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between" style={{ height: '10%', paddingInline: '4cqw' }}>
        <Wordmark color="#ffffff">PayNexus</Wordmark>
        <NavLinks n={4} color="#ffffff66" />
        <div className="flex items-center" style={{ gap: '2.2cqw' }}>
          <Bar w="3.4cqw" h="1.1cqh" color="#ffffff8c" />
          <Pill w="9cqw" h="4.6cqh" bg="#b4ef4d" label="#1d2a1966" />
        </div>
      </div>

      {/* hero copy */}
      <div className="absolute" style={{ left: '4.5cqw', top: '14%' }}>
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

      {/* the photo of the man with the phone */}
      <Photo
        className="absolute"
        style={{
          right: '3.5cqw', top: '13%', width: '38cqw', height: '60%', borderRadius: '2cqw',
          background:
            'radial-gradient(38% 26% at 72% 22%,#f6d7ae 0%,#f6d7ae00 66%),' +
            'linear-gradient(212deg,#d7ddcb 0%,#a7b195 28%,#74805e 60%,#3f4a2b 100%)',
        }}
      >
        {/* the phone in his hand, hinted rather than drawn */}
        <span className="absolute" style={{ right: '15%', top: '30%', width: '23%', height: '46%', background: '#12180db3', borderRadius: '1.2cqw' }} />
      </Photo>

      {/* the payment card, overlapping the photo's left edge */}
      <div
        className="absolute flex flex-col bg-white"
        style={{ left: '45cqw', top: '25%', width: '25cqw', padding: '2.2cqw', gap: '1.5cqh', borderRadius: '1.6cqw' }}
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
      <div className="absolute" style={{ right: '5cqw', bottom: '22%', width: '19cqw' }}>
        <Copy rows={3} color="#ffffff80" w="100%" h="1.1cqh" gap="1cqh" />
      </div>

      {/* the next section, cut off by the card's bottom edge */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: '14%', background: '#f4f4ef' }}>
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
    <div className="relative h-full w-full overflow-hidden font-sans" style={{ background: '#f0ebdf' }}>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between" style={{ height: '9%', paddingInline: '4.5cqw' }}>
        <Wordmark color="#22331f" size="4.2cqw">AURA</Wordmark>
        <Pill w="12cqw" h="4.2cqh" bg="#3f6b3a" label="#ffffff8c" />
      </div>

      <p
        className="absolute whitespace-nowrap text-center font-display font-semibold"
        style={{ left: 0, right: 0, top: '12%', color: '#22331f', fontSize: '5cqw', lineHeight: 1.2, letterSpacing: '-0.02em' }}
      >
        Fuel Sustainable Growth. Power<br />Exceptional Performance.
      </p>

      {/* left column: "VITAMINS" + copy + CTA */}
      <div className="absolute" style={{ left: '4.5cqw', top: '32%', width: '23cqw' }}>
        <p className="font-display font-semibold" style={{ color: '#22331f', fontSize: '4cqw', letterSpacing: '0.02em' }}>
          VITAMINS
        </p>
        <div style={{ marginTop: '2.4cqh' }}><Copy rows={3} color="#22331f33" w="100%" h="1.1cqh" gap="1.3cqh" /></div>
        <div style={{ marginTop: '3cqh' }}><Pill w="14cqw" h="4.4cqh" bg="#3f6b3a" label="#ffffff8c" /></div>
      </div>

      {/* the hero jar — a product, so it can be drawn: neck, body, label */}
      <div className="absolute" style={{ left: '38cqw', top: '28%', width: '22cqw', height: '41%' }}>
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
      <div className="absolute bg-white" style={{ right: '7cqw', top: '33%', width: '13cqw', padding: '1.3cqw', borderRadius: '1.2cqw' }}>
        <span className="block" style={{ height: '8cqh', background: 'linear-gradient(150deg,#dfe8d6,#9fbc8e)', borderRadius: '0.8cqw' }} />
        <div style={{ marginTop: '1.3cqh' }}><Copy rows={2} color="#22331f26" w="100%" h="0.85cqh" gap="0.8cqh" /></div>
      </div>
      <div className="absolute flex flex-col" style={{ right: '2.5cqw', top: '24%', gap: '1.2cqh' }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="block rounded-full" style={{ width: '2.2cqw', height: '2.2cqw', background: '#22331f' }} />
        ))}
      </div>

      {/* "Protected and Featured On" — the dark-green band of partner logos */}
      <div className="absolute inset-x-0 flex flex-col items-center justify-center" style={{ top: '70%', height: '16%', background: '#2f5233', gap: '2cqh' }}>
        <Bar w="19cqw" h="1.1cqh" color="#ffffff59" />
        <div className="flex items-center" style={{ gap: '3.6cqw' }}>
          {['12cqw', '8cqw', '11cqw', '8cqw', '13cqw'].map((w, i) => <Bar key={i} w={w} h="1.7cqh" color="#ffffffa6" />)}
        </div>
      </div>

      {/* the white section below, cut off by the card edge */}
      <div className="absolute inset-x-0 bottom-0 flex items-center bg-white" style={{ top: '86%', paddingInline: '4.5cqw', gap: '4cqw' }}>
        <Photo style={{ width: '24cqw', height: '76%', borderRadius: '1.2cqw', background: 'linear-gradient(150deg,#d9e2ea,#8f9aa4)' }} />
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
function SyncoHero({ children }: { children?: ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden font-sans" style={{ background: '#050505' }}>
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between" style={{ height: '13%', paddingInline: '5cqw' }}>
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

      {/* the faint column rules the mockup shows under the nav */}
      {['16%', '48%', '80%'].map((left) => (
        <span key={left} className="absolute" style={{ left, top: '13%', bottom: 0, width: '0.25cqw', background: '#ffffff14' }} />
      ))}

      {/* the blue wave: one blob, made organic by lopsided percentage radii */}
      <span
        className="absolute"
        style={{
          left: '-20cqw', top: '31%', width: '72cqw', height: '47%',
          background: 'linear-gradient(112deg,#1636b4 0%,#2b66ec 48%,#5f97ff 100%)',
          borderRadius: '38% 62% 34% 66% / 78% 52% 48% 22%',
        }}
      />
      <p
        className="absolute whitespace-nowrap font-display font-semibold text-white"
        style={{ left: '36cqw', top: '38%', fontSize: '27cqw', lineHeight: 0.86, letterSpacing: '-0.045em' }}
      >
        Synco
      </p>
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
    <div className="relative h-full w-full overflow-hidden font-sans" style={{ background: '#37422f' }}>
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between" style={{ height: '9%', paddingInline: '4cqw' }}>
        <div className="flex items-center" style={{ gap: '1.4cqw' }}>
          <span className="block rounded-full" style={{ width: '2.8cqw', height: '2.8cqw', background: '#efe8da' }} />
          <Copy rows={2} color="#efe8da8c" w="11cqw" h="0.85cqh" gap="0.8cqh" />
        </div>
        <div className="flex items-center" style={{ gap: '3cqw' }}>
          <NavLinks n={3} color="#efe8da8c" w="4cqw" gap="3cqw" />
          <Pill w="10cqw" h="4cqh" bg="#efe8da" label="#37422f80" />
        </div>
      </div>

      <p
        className="absolute z-10 whitespace-nowrap font-display font-semibold"
        style={{ left: '3.5cqw', top: '13%', color: '#efe8da', fontSize: '10.8cqw', lineHeight: 1, letterSpacing: '-0.035em' }}
      >
        WE MAKE MEDIA
      </p>
      <div className="absolute z-10" style={{ left: '4cqw', top: '30%' }}>
        <Bar w="16cqw" h="1.1cqh" color="#efe8da73" />
      </div>
      <p
        className="absolute z-10 whitespace-nowrap font-display italic"
        style={{ right: '9cqw', top: '27.5%', color: '#efe8da', fontSize: '9.6cqw', lineHeight: 1, letterSpacing: '-0.02em' }}
      >
        Human
      </p>

      {/* the portrait, in its arch — abstract, with the mockup's blurred band at eye level */}
      <Photo
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: '31%', width: '30cqw', height: '32%',
          borderRadius: '50% 50% 2.4cqw 2.4cqw / 44% 44% 2.4cqw 2.4cqw',
          background: 'linear-gradient(174deg,#c9a074 0%,#c9a074 34%,#a87a58 44%,#a87a58 58%,#33636e 66%,#254d59 100%)',
        }}
      >
        <span className="absolute inset-x-0" style={{ top: '22%', height: '15%', background: '#ded8c9b3', filter: 'blur(0.5cqw)' }} />
      </Photo>

      <div className="absolute z-10 flex flex-col items-center" style={{ left: '25cqw', right: '25cqw', top: '67%', gap: '2.6cqh' }}>
        <Copy rows={3} color="#efe8da73" w="100%" h="1.05cqh" gap="1.1cqh" center />
        <Pill w="23cqw" h="4.4cqh" border="#efe8da59" label="#efe8daa6" />
      </div>

      {/* the cream section the card edge cuts into */}
      <div className="absolute inset-x-0 bottom-0 flex items-end" style={{ height: '13%', background: '#efe8da', paddingInline: '4cqw', gap: '6cqw' }}>
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
    <div className="relative h-full w-full overflow-hidden font-sans" style={{ background: '#fbfbfd' }}>
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between" style={{ height: '9%', paddingInline: '4cqw' }}>
        <div className="flex items-center" style={{ gap: '1.2cqw' }}>
          <span className="block" style={{ width: '2.6cqw', height: '2.6cqw', background: '#1a2340', borderRadius: '0.5cqw' }} />
          <Wordmark color="#1a2340" size="3.2cqw">ArchiForm</Wordmark>
        </div>
        <div className="flex items-center" style={{ gap: '3cqw' }}>
          <NavLinks n={4} color="#1a234073" w="4cqw" gap="3cqw" />
          <Pill w="11cqw" h="4.2cqh" bg="#1a2340" label="#ffffff8c" />
        </div>
      </div>

      {/* the facade, bleeding off the right edge */}
      <Photo
        className="absolute"
        style={{ right: 0, top: '11%', width: '50cqw', height: '71%', borderRadius: '2cqw 0 0 2cqw', background: '#20406b' }}
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
      </Photo>

      {/* hero copy */}
      <div className="absolute z-10" style={{ left: '4cqw', top: '17%' }}>
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

      {/* the small project card floating over the facade */}
      <div
        className="absolute z-10 flex items-center bg-white"
        style={{ right: '4cqw', top: '52%', width: '27cqw', padding: '1.3cqw', gap: '1.5cqw', borderRadius: '1.4cqw' }}
      >
        <Photo style={{ width: '7.5cqw', height: '8cqh', borderRadius: '1cqw', background: 'linear-gradient(150deg,#e8a86b,#3a6aa8)' }} />
        <Copy rows={3} color="#1a234026" w="100%" h="0.85cqh" gap="0.85cqh" />
      </div>

      {/* the "Who We Are" strip at the bottom */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center bg-white" style={{ height: '18%', gap: '1.6cqh' }}>
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
    <div className="relative h-full w-full overflow-hidden font-sans" style={{ background: '#eef1e3' }}>
      <Photo
        className="absolute"
        style={{
          left: '2cqw', right: '2cqw', top: '2cqh', height: '79%', borderRadius: '2cqw',
          background: 'linear-gradient(166deg,#a9c8de 0%,#c6d8e4 36%,#e3d8c6 76%,#cdbca3 100%)',
        }}
      >
        {/* where the figure stands in the mockup — soft, abstract, deliberately not a person */}
        <span
          className="absolute"
          style={{
            left: '26%', top: '20%', width: '50%', height: '92%',
            background: 'linear-gradient(172deg,#caa78c6b 0%,#b48f7266 40%,#8f725c40 72%,#7d6a5900 100%)',
            borderRadius: '42% 58% 28% 72% / 62% 66% 34% 38%',
            filter: 'blur(3.2cqw)',
          }}
        />
        <span
          className="absolute"
          style={{ left: '24%', top: '4%', width: '56%', height: '52%', background: 'radial-gradient(50% 50% at 50% 50%,#6b4f3959 0%,#6b4f3900 74%)' }}
        />
      </Photo>

      {/* the floating glass nav pill */}
      <div
        className="absolute flex items-center justify-between"
        style={{ left: '5cqw', right: '5cqw', top: '4cqh', height: '9%', paddingInline: '2.2cqw', borderRadius: '99em', background: '#ffffffd9' }}
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

      {/* the "10k+ happy customers" chip */}
      <div
        className="absolute flex items-center"
        style={{ left: '5cqw', top: '36%', padding: '1.1cqw', gap: '1.3cqw', borderRadius: '99em', background: '#ffffffe6' }}
      >
        <Avatars size="3.2cqw" ring="#ffffff" />
        <Copy rows={2} color="#2b3a2826" w="9cqw" h="0.85cqh" gap="0.8cqh" />
      </div>

      {/* the small paragraph the mockup sets over the right of the photo */}
      <div className="absolute" style={{ right: '6cqw', top: '32%', width: '21cqw' }}>
        <Copy rows={3} color="#ffffffbf" w="100%" h="1cqh" gap="1cqh" />
      </div>

      <p
        className="absolute whitespace-nowrap font-display font-semibold text-white"
        style={{ left: '5cqw', top: '55%', fontSize: '5.2cqw', lineHeight: 1.2, letterSpacing: '-0.02em' }}
      >
        Your mental health is<br />super important.
      </p>

      <div className="absolute flex items-center" style={{ right: '6cqw', top: '65%', gap: '1.5cqw' }}>
        <Pill w="14cqw" h="4.8cqh" bg="#ffffff" label="#2b3a2873" />
        <span className="block rounded-full" style={{ width: '4.6cqw', height: '4.6cqw', background: '#2b3a28' }} />
      </div>

      {/* the sage section under the photo */}
      <div className="absolute inset-x-0 bottom-0 flex items-start justify-center" style={{ height: '16%', paddingTop: '2.4cqh' }}>
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
    <SyncoHero>
      <div
        className="absolute inset-x-0 bottom-0 flex items-center"
        style={{ height: '23%', background: '#f4f4f5', paddingInline: '4cqw', gap: '3cqw' }}
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
    <div className="relative h-full w-full overflow-hidden font-sans" style={{ background: '#0a0a0a' }}>
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

      {/* nav, riding over the ribbon's crest */}
      <div className="absolute top-0 z-10 flex items-center justify-between" style={{ left: '4cqw', right: '23cqw', height: '8%' }}>
        <Wordmark color="#ffffff" size="2.8cqw">Synco</Wordmark>
        <NavLinks n={3} color="#ffffff59" w="3.6cqw" gap="2.6cqw" />
      </div>

      {/* the headline is a REGULAR-weight grotesk on the board — no font-semibold here */}
      <p
        className="absolute z-10 whitespace-nowrap font-display text-white"
        style={{ left: '19%', top: '11%', fontSize: '9.6cqw', lineHeight: 1.18, letterSpacing: '-0.015em' }}
      >
        Synco<span style={{ fontSize: '0.38em', verticalAlign: 'super' }}>®</span><br />Creative<br />Agency
      </p>
      <div className="absolute z-10" style={{ left: '19%', top: '58%' }}>
        <Copy rows={2} color="#ffffff40" w="30cqw" h="0.95cqh" gap="1cqh" />
      </div>

      {/* the white stats band; the 50+/100+ run past the card edge and get clipped */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: '28%', background: '#f4f4f2' }}>
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
    <div className="relative h-full w-full overflow-hidden font-sans" style={{ background: '#306ef2' }}>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between" style={{ height: '8%', paddingInline: '3.5cqw' }}>
        <Wordmark color="#ffffff" size="3.2cqw">WorkPro</Wordmark>
        <NavLinks n={4} color="#ffffff66" w="4cqw" gap="2.4cqw" />
        <div className="flex items-center" style={{ gap: '2cqw' }}>
          <Bar w="3.4cqw" h="1cqh" color="#ffffff8c" />
          <Pill w="9.5cqw" h="4cqh" bg="#ffffff" label="#306ef259" />
        </div>
      </div>

      <p
        className="absolute inset-x-0 whitespace-nowrap text-center font-display font-semibold text-white"
        style={{ top: '10%', fontSize: '4.9cqw', lineHeight: 1.3, letterSpacing: '-0.02em' }}
      >
        A powerful tool to automate<br />
        your <span style={{ borderBottom: '0.45cqw solid #ffffff', paddingBottom: '0.2cqh' }}>social media</span>
      </p>

      {/* 28.5%, not 25 — at the wide 480×360 aspect the headline runs taller relative
          to the box than at the popup's near-square crop, and 25% collides with it */}
      <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center" style={{ top: '28.5%', width: '46cqw', gap: '1.1cqh' }}>
        <Bar w="100%" h="1cqh" color="#ffffff59" />
        <Bar w="72%" h="1cqh" color="#ffffff59" />
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center" style={{ top: '34%', gap: '2cqw' }}>
        <Pill w="17cqw" h="5cqh" bg="#ffffff" label="#306ef259" />
        <Pill w="15cqw" h="5cqh" border="#ffffff73" label="#ffffffa6" />
      </div>

      {/* the app window; its bottom edge hides under the claim band, as in the crop */}
      <div className="absolute overflow-hidden bg-white" style={{ left: '11%', right: '11%', top: '42%', height: '41%', borderRadius: '1.8cqw 1.8cqw 0 0' }}>
        <div className="flex items-center" style={{ height: '9%', paddingInline: '1.8cqw', gap: '0.9cqw' }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="block shrink-0 rounded-full" style={{ width: '1.1cqw', height: '1.1cqw', background: '#10182b2e' }} />
          ))}
        </div>
        <div className="flex" style={{ height: '91%' }}>
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

      <div className="absolute inset-x-0 flex items-center justify-center" style={{ top: '83%', height: '14.5%', background: '#ffffff' }}>
        <p className="whitespace-nowrap text-center font-display font-semibold" style={{ color: '#0f172c', fontSize: '3.6cqw', lineHeight: 1.32, letterSpacing: '-0.02em' }}>
          Engage your audience<br />without wasting your time
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0" style={{ height: '2.5%', background: '#0c0d12' }} />
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
    <div className="relative h-full w-full overflow-hidden font-sans" style={{ background: '#6b1613' }}>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between" style={{ height: '7%', background: '#521010', paddingInline: '3.5cqw' }}>
        <NavLinks n={4} color="#f2e0b866" w="4cqw" gap="2.2cqw" />
        <Pill w="9cqw" h="3.2cqh" bg="#d9a94f" label="#52101080" />
        <NavLinks n={3} color="#f2e0b866" w="4cqw" gap="2.2cqw" />
      </div>

      {/* hero copy */}
      <p
        className="absolute whitespace-nowrap font-display font-semibold"
        style={{ left: '4.5cqw', top: '11.5%', color: '#f2e0b8', fontSize: '4.4cqw', lineHeight: 1.32, letterSpacing: '-0.01em' }}
      >
        A Taste of Tradition,<br />A Promise of Quality
      </p>
      {/* 28.5% clears the two-line headline even at the wide 480×360 aspect */}
      <div className="absolute" style={{ left: '4.5cqw', top: '28.5%' }}>
        <Copy rows={3} color="#f2e0b859" w="30cqw" h="1cqh" gap="1.2cqh" />
      </div>
      {/* the round quality stamp and a small CTA beside it */}
      <div className="absolute flex items-center" style={{ left: '4.5cqw', top: '36.5%', gap: '2cqw' }}>
        <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: '6.5cqw', height: '6.5cqw', boxShadow: 'inset 0 0 0 0.45cqw #d9a94f' }}>
          <span className="block rounded-full" style={{ width: '2.2cqw', height: '2.2cqw', background: '#d9a94f' }} />
        </span>
        <Pill w="11cqw" h="4cqh" bg="#d9a94f" label="#52101073" />
      </div>

      {/* the food photography, as discs: a warm glow, the big platter (gold rim, brown
          food), a second platter cut by the top-right corner, two side dishes */}
      <span className="absolute" style={{ left: '42%', top: '2%', width: '56cqw', height: '52%', background: 'radial-gradient(50% 50% at 50% 50%,#8a2a1a4d 0%,#8a2a1a00 72%)' }} />
      <Photo
        className="absolute rounded-full"
        style={{
          left: '54%', top: '7%', width: '34cqw', height: '34cqw',
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
          right: '-6cqw', top: '2%', width: '17cqw', height: '17cqw',
          background: 'radial-gradient(circle,#7a4515 0%,#7a4515 52%,#eab54e 57%,#cf8f35 100%)',
        }}
      />
      <Photo className="absolute rounded-full" style={{ left: '46%', top: '40%', width: '8cqw', height: '8cqw', background: 'radial-gradient(circle at 40% 35%,#6f3a12 0%,#40200a 100%)' }} />
      <Photo className="absolute rounded-full" style={{ left: '57%', top: '45%', width: '5.5cqw', height: '5.5cqw', background: 'radial-gradient(circle at 40% 35%,#d9a355 0%,#8a5a20 100%)' }} />

      {/* the little dish carousel under the copy — thumbnails, so gradient tiles */}
      <div className="absolute flex" style={{ left: '4.5cqw', top: '46%', gap: '1.6cqw' }}>
        {['linear-gradient(150deg,#c98a3b,#7a4515)', 'linear-gradient(150deg,#8a2a1a,#4f1108)', 'linear-gradient(150deg,#e3b054,#a4652b)', 'linear-gradient(150deg,#a4652b,#5f3110)'].map((g, i) => (
          <Photo key={i} style={{ width: '8.5cqw', height: '4.5cqh', borderRadius: '0.8cqw', background: g }} />
        ))}
      </div>

      {/* the stats band — the numbers are the site's four proof points */}
      <div className="absolute inset-x-0 flex" style={{ top: '54%', height: '20%', background: '#5a100d' }}>
        {['2k', '1k', '99', '10'].map((n) => (
          <div key={n} className="flex flex-1 flex-col items-center justify-center" style={{ gap: '1.2cqh' }}>
            <p className="font-display font-semibold" style={{ color: '#f2e0b8', fontSize: '4.6cqw', letterSpacing: '-0.01em' }}>{n}</p>
            <Bar w="10cqw" h="0.85cqh" color="#f2e0b84d" />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: '77%', gap: '1.4cqh' }}>
        <p className="whitespace-nowrap font-display font-semibold" style={{ color: '#f2e0b8', fontSize: '3.6cqw', letterSpacing: '-0.01em' }}>
          Discover Our Complete Range
        </p>
        <Bar w="24cqw" h="0.9cqh" color="#f2e0b840" />
      </div>

      {/* the cream gallery strip, its tiles taller than the card leaves room for */}
      <div className="absolute inset-x-0 bottom-0 flex" style={{ height: '11%', background: '#f2e8d4', paddingInline: '3cqw', paddingTop: '1.2cqh', gap: '2cqw' }}>
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
    <div className="relative h-full w-full overflow-hidden font-sans" style={{ background: '#07060b' }}>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between" style={{ height: '7%', paddingInline: '3.5cqw' }}>
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

      {/* the little tag chip above the headline */}
      <span className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full" style={{ top: '9.5%', width: '12cqw', height: '3.4cqh', boxShadow: 'inset 0 0 0 0.35cqw #7c57f259' }}>
        <Bar w="55%" h="0.85cqh" color="#a98ef7" />
      </span>

      <p
        className="absolute inset-x-0 whitespace-nowrap text-center font-display font-semibold"
        style={{ top: '15%', color: '#eae6f8', fontSize: '5.4cqw', lineHeight: 1.24, letterSpacing: '-0.02em' }}
      >
        AI Revolutionizing<br />Crypto Mining
      </p>

      {/* anchored low enough to clear the headline at the wide 480×360 aspect too */}
      <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center" style={{ top: '33%', width: '40cqw', gap: '1.1cqh' }}>
        <Bar w="100%" h="1cqh" color="#ffffff38" />
        <Bar w="66%" h="1cqh" color="#ffffff38" />
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center" style={{ top: '40.5%', gap: '1.8cqw' }}>
        <Pill w="13cqw" h="4.6cqh" bg="#7c57f2" label="#ffffffa6" />
        <Pill w="12cqw" h="4.6cqh" border="#ffffff2e" label="#ffffff8c" />
      </div>

      {/* the rig: ground glow, circuit traces brightening toward the centre,
          two satellite nodes, then the orb with its halo and crystal glyph */}
      <div className="absolute inset-x-0" style={{ top: '46%', height: '27%' }}>
        <span className="absolute" style={{ left: '18%', right: '18%', top: '40%', bottom: '-34%', background: 'radial-gradient(50% 46% at 50% 58%,#6d3df059 0%,#6d3df000 72%)' }} />
        <span className="absolute" style={{ left: 0, width: '34%', top: '48%', height: '0.35cqh', background: 'linear-gradient(90deg,#171226 0%,#5646a0 100%)' }} />
        <span className="absolute" style={{ right: 0, width: '34%', top: '48%', height: '0.35cqh', background: 'linear-gradient(270deg,#171226 0%,#5646a0 100%)' }} />
        <span className="absolute" style={{ left: '6%', width: '18%', top: '20%', height: '0.35cqh', background: '#221a3d' }} />
        <span className="absolute" style={{ right: '6%', width: '18%', top: '76%', height: '0.35cqh', background: '#221a3d' }} />
        <span className="absolute rounded-full" style={{ left: '21%', top: '34%', width: '4.6cqw', height: '4.6cqw', background: '#120c22', boxShadow: 'inset 0 0 0 0.35cqw #4a3f78' }} />
        <span className="absolute rounded-full" style={{ right: '21%', top: '34%', width: '4.6cqw', height: '4.6cqw', background: '#120c22', boxShadow: 'inset 0 0 0 0.35cqw #4a3f78' }} />
        <span className="absolute left-1/2 -translate-x-1/2" style={{ top: '-18%', width: '44cqw', height: '136%', background: 'radial-gradient(50% 50% at 50% 50%,#7b4df066 0%,#7b4df000 70%)' }} />
        <span className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full" style={{ top: '8%', width: '15cqw', height: '15cqw', background: 'radial-gradient(circle at 50% 38%,#241946 0%,#0d0918 76%)', boxShadow: 'inset 0 0 0 0.45cqw #8b5cf6' }}>
          <span className="block" style={{ width: '3.6cqw', height: '3.6cqw', boxShadow: 'inset 0 0 0 0.4cqw #cabdf8', transform: 'rotate(45deg)' }} />
        </span>
      </div>

      <p className="absolute inset-x-0 text-center font-display font-semibold" style={{ top: '73.5%', color: '#ffffffd9', fontSize: '3cqw' }}>
        Join MineMax
      </p>

      {/* the two purple feature cards, cut by the card's bottom edge */}
      <div className="absolute flex" style={{ left: '3.5cqw', right: '3.5cqw', top: '79%', gap: '2.4cqw' }}>
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
