/**
 * THE TWO LANDING SITES ON THE SHELF — synco.com and meridianroast.com (02.10.2026).
 *
 * Until today the shelf carried one site the prototype could render (fit-ration) and three
 * DRAWINGS (modules/home/thumbs.tsx) the canvas showed at full width. The designer opened one:
 * «а этот сайт сделай более похожим на сайт, а то что-то непонятное, пустое», asked for the
 * Visual Editor on all three («добавь эдитор этот на вот эти 3 сайта»), removed the fourth
 * («этот вообще убери из списка») and named the brief: «3 лендинга, только пару верхних секций,
 * но чтобы они выглядели нормально и стильно и по разному, 1 белый минималистичный, 2-й черная
 * тема… 3-й цветной какой то яркий, фото».
 *
 *   fit-ration         the white one — the demo site, untouched (SitePreview.tsx)
 *   synco.com          the black one — an audio store, studio product shots under coloured light
 *   meridianroast.com  the bright one — a roastery in colour blocks and sunlit flat-lays
 *
 * A LANDING, NOT A SITE MAP. Each is a nav, a hero and one section — the "couple of top sections"
 * asked for — so their page list is Home alone (pages.ts `landingOf`): the switcher must not list
 * an About that does not exist.
 *
 * EDITABLE THE SAME WAY. Every text run is a `T` and every picture a `Photo` under keys in
 * content.ts (`synco.*`, `meridian.*`), so the editor's Edit and Select tools, the Image panel and
 * the per-site edit layer (`world.siteEdits`, a site axis) work here exactly as on fit-ration. The
 * photographs are placeholders (scratchpad/landing-photos/make.py) until real ones come.
 *
 * NOT THE DEMO SITE'S CHAT LAYER. Remixer's own changes (`siteAi`: added blocks, palettes) are
 * written for fit-ration's page; these two pages do not draw them. Said to the designer.
 */
import { T, Photo } from './site-parts'

export type LandingId = 'synco' | 'meridian'

/** Which of the shelf's sites is a landing, by site id. Anything else is the demo site. */
export const LANDINGS: Record<string, LandingId> = { synco: 'synco', meridian: 'meridian' }
export const landingOf = (site: string | undefined): LandingId | null => (site ? LANDINGS[site] ?? null : null)

/** The page ground each landing paints under its scroller. */
export const LANDING_GROUND: Record<LandingId, string> = { synco: '#070708', meridian: '#fff4e6' }

/* ------------------------------------------------------------------ synco */

const SYNCO_PRODUCTS = ['orb', 'pods', 'halo'] as const
const SYNCO_INK = 'bg-gradient-to-r from-[#a28bff] via-[#7aa7ff] to-[#5ee0ff] bg-clip-text text-transparent'

function Synco({ missing }: { missing?: string }) {
  return (
    <div className="flex flex-1 flex-col bg-[#070708] font-sans text-[#f5f5f7]">
      <T k="synco.bar" className="py-2.5 text-center text-[12.5px] font-medium tracking-[0.01em] text-[#070708] [background:linear-gradient(90deg,#a28bff,#7aa7ff,#5ee0ff)]" />
      <div className="site-pad sticky top-0 z-10 flex items-center justify-between border-b border-[#ffffff12] bg-[#070708d9] py-4 backdrop-blur-md">
        <span className="font-display text-[22px] font-semibold tracking-[-0.03em]">synco<span className={SYNCO_INK}>●</span></span>
        <nav className="lp-links gap-8 text-[13.5px] text-[#ffffff99]" aria-hidden>
          <span>Speakers</span><span>Earbuds</span><span>Lighting</span><span>Support</span>
        </nav>
        <T as="span" k="synco.nav.cta" className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#070708]" />
      </div>

      {missing ? (
        <div className="site-pad flex flex-1 flex-col items-center justify-center py-24 text-center" data-site-notfound>
          <p className={`font-display text-[64px] font-semibold ${SYNCO_INK}`}>404</p>
          <p className="mt-2 text-[16px] text-[#ffffff8c]">There’s nothing at {missing} — yet.</p>
        </div>
      ) : (
        <>
          <div className="site-pad lp-split mx-auto w-full max-w-[1180px] gap-12 pb-20 pt-16">
            <div>
              <T k="synco.eyebrow" className="mb-5 inline-block rounded-full border border-[#ffffff1f] px-3 py-1 text-[12px] font-medium text-[#c9c2ff]" />
              <T as="h1" k="synco.hero.title" className="lp-title font-display font-semibold leading-[1.02] tracking-[-0.045em]" style={{ textWrap: 'balance' }} />
              <T k="synco.hero.lead" className="mt-6 max-w-[44ch] text-[16.5px] leading-[1.6] text-[#ffffff99]" />
              <div className="site-cta mt-8 gap-3">
                <T as="span" k="synco.cta.primary" className="rounded-full bg-white px-6 py-3 text-center text-[14.5px] font-semibold text-[#070708]" />
                <T as="span" k="synco.cta.secondary" className="rounded-full border border-[#ffffff2e] px-6 py-3 text-center text-[14.5px] font-medium" />
              </div>
              <div className="lp-specs mt-12 border-t border-[#ffffff14] pt-6">
                {[0, 1, 2].map((i) => (
                  <span key={i}>
                    <T as="b" k={`synco.spec.${i}.value`} className="block font-display text-[26px] font-semibold tracking-[-0.02em]" />
                    <T as="span" k={`synco.spec.${i}.label`} className="text-[13px] text-[#ffffff73]" />
                  </span>
                ))}
              </div>
            </div>
            <Photo k="synco.hero.photo" className="aspect-[960/760] rounded-[28px] shadow-[0_0_0_1px_#ffffff14,0_40px_120px_-30px_#6d4dff80]" />
          </div>

          <div className="site-pad mx-auto w-full max-w-[1180px] pb-20">
            <div className="mb-6 flex items-end justify-between gap-4">
              <T as="h2" k="synco.line.title" className="font-display text-[32px] font-semibold tracking-[-0.03em]" />
              <T as="span" k="synco.line.badge" className="rounded-full bg-[#ffffff12] px-3 py-1.5 text-[12.5px] font-semibold text-[#c9c2ff]" />
            </div>
            <div className="lp-three gap-4">
              {SYNCO_PRODUCTS.map((id) => (
                <div key={id} className="overflow-hidden rounded-[22px] bg-[#111114] shadow-[inset_0_0_0_1px_#ffffff10]">
                  <Photo k={`synco.p.${id}.photo`} className="aspect-[640/520]" />
                  <div className="flex items-end justify-between gap-3 p-5">
                    <div>
                      <T k={`synco.p.${id}.name`} className="font-display text-[20px] font-semibold tracking-[-0.02em]" />
                      <T k={`synco.p.${id}.text`} className="mt-1 text-[13.5px] text-[#ffffff80]" />
                    </div>
                    <div className="text-right tabular-nums">
                      <T k={`synco.p.${id}.was`} className="text-[12.5px] text-[#ffffff59] line-through" />
                      <T k={`synco.p.${id}.price`} className="text-[17px] font-semibold" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <T k="synco.footer" className="site-pad mt-auto border-t border-[#ffffff12] py-8 text-center text-[13px] text-[#ffffff66]" />
    </div>
  )
}

/* --------------------------------------------------------------- meridian */

const MERIDIAN_ROASTS = [
  { id: 'sunrise', ground: '#ffd23f' },
  { id: 'cobalt', ground: '#ff9ecb' },
  { id: 'jungle', ground: '#5ad1ff' },
] as const
const NAVY = '#1f1a33'

function Meridian({ missing }: { missing?: string }) {
  return (
    <div className="flex flex-1 flex-col bg-[#fff4e6] font-sans" style={{ color: NAVY }}>
      <div className="site-pad sticky top-0 z-10 flex items-center justify-between bg-[#fff4e6e6] py-4 backdrop-blur-md">
        <span className="flex items-center gap-2 font-display text-[23px] font-bold tracking-[-0.03em]">
          <span className="inline-block size-[22px] rounded-full bg-[#ff6b35] shadow-[inset_-5px_-5px_0_#ff4f9a]" aria-hidden />
          meridian
        </span>
        <nav className="lp-links gap-8 text-[14px] font-medium" aria-hidden>
          <span>Shop</span><span>Subscriptions</span><span>Brew guides</span><span>Visit us</span>
        </nav>
        <T as="span" k="meridian.nav.cta" className="rounded-full bg-[#ff4f9a] px-5 py-2.5 text-[13.5px] font-bold text-white shadow-[0_3px_0_#1f1a33]" />
      </div>

      {missing ? (
        <div className="site-pad flex flex-1 flex-col items-center justify-center py-24 text-center" data-site-notfound>
          <p className="font-display text-[72px] font-bold text-[#ff6b35]">404</p>
          <p className="mt-2 text-[16px] opacity-70">Nothing brewing at {missing}.</p>
        </div>
      ) : (
        <>
          <div className="site-pad mx-auto w-full max-w-[1200px] pt-4">
            <div className="lp-split overflow-hidden rounded-[36px] bg-[#ff6b35]">
              <div className="lp-pad text-[#1f1a33]">
                <T k="meridian.eyebrow" className="mb-5 inline-block rounded-full bg-[#1f1a33] px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[#ffd23f]" />
                <T as="h1" k="meridian.hero.title" className="lp-title font-display font-bold leading-[0.98] tracking-[-0.045em]" style={{ textWrap: 'balance' }} />
                <T k="meridian.hero.lead" className="mt-6 max-w-[40ch] text-[17px] font-medium leading-[1.55]" />
                <div className="site-cta mt-8 gap-3">
                  <T as="span" k="meridian.cta.primary" className="rounded-full bg-[#1f1a33] px-6 py-3.5 text-center text-[15px] font-bold text-white" />
                  <T as="span" k="meridian.cta.secondary" className="rounded-full bg-[#fff4e6] px-6 py-3.5 text-center text-[15px] font-bold" />
                </div>
              </div>
              <div className="relative">
                <Photo k="meridian.hero.photo" className="aspect-square h-full w-full" />
                <span className="absolute left-6 top-6 grid size-[118px] rotate-[-12deg] place-content-center rounded-full bg-[#ffd23f] text-center shadow-[0_4px_0_#1f1a33]">
                  <T as="b" k="meridian.sticker.value" className="block font-display text-[30px] font-bold leading-none" />
                  <T as="span" k="meridian.sticker.label" className="mt-1 block text-[12px] font-bold leading-[1.15]" />
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden whitespace-nowrap bg-[#1f1a33] py-3.5 font-display text-[22px] font-bold tracking-[-0.01em] text-[#ffd23f]">
            <T as="span" k="meridian.strip" className="inline-block px-4" />
            <span className="inline-block px-4 text-[#ff9ecb]" aria-hidden>Ethiopia · Colombia · Guatemala · Kenya · Brazil · Rwanda ·</span>
          </div>

          <div className="site-pad mx-auto w-full max-w-[1200px] pb-20 pt-14">
            <T as="h2" k="meridian.roasts.title" className="font-display text-[40px] font-bold tracking-[-0.035em]" />
            <T k="meridian.roasts.lead" className="mt-2 max-w-[52ch] text-[16px] opacity-70" />
            <div className="lp-three mt-8 gap-5">
              {MERIDIAN_ROASTS.map((r) => (
                <div key={r.id} className="overflow-hidden rounded-[28px] shadow-[0_0_0_2px_#1f1a33,0_6px_0_#1f1a33]" style={{ background: r.ground }}>
                  <Photo k={`meridian.r.${r.id}.photo`} className="aspect-[640/560]" />
                  <div className="flex items-end justify-between gap-3 bg-white p-5">
                    <div>
                      <T k={`meridian.r.${r.id}.name`} className="font-display text-[22px] font-bold tracking-[-0.02em]" />
                      <T k={`meridian.r.${r.id}.notes`} className="mt-0.5 text-[13.5px] opacity-70" />
                    </div>
                    <div className="text-right">
                      <T k={`meridian.r.${r.id}.price`} className="font-display text-[22px] font-bold" />
                      <T k="meridian.r.sub" className="whitespace-nowrap text-[12px] font-semibold text-[#e0397f]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <T k="meridian.footer" className="site-pad mt-auto bg-[#1f1a33] py-8 text-center text-[13px] text-[#ffffffa6]" />
    </div>
  )
}

/** The landing's whole page. `missing` — a route the landing does not have: its own 404. */
export function Landing({ id, missing }: { id: LandingId; missing?: string }) {
  return id === 'synco' ? <Synco missing={missing} /> : <Meridian missing={missing} />
}
