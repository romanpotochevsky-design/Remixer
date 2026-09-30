/**
 * THE BLOCKS A CHAT EDIT CAN ADD TO THE DEMO SITE — drawn when the AI's layer says so
 * (`World.siteAi.mods`, the catalogue in modules/versions/changes.ts).
 *
 * The version system (30.09.2026) needs a site that looks DIFFERENT from version to version, or the
 * eye and the revert show nothing. So «add testimonials» adds these quotes, «build a pricing
 * section» adds these plans — in the site's own voice and palette (the `--sa` / `--sd` / `--sp`
 * variables SitePreview sets from `siteAi.palette`), made of the same `T` and `Photo` parts as the
 * rest of the page, so the Visual Editor edits a block Remixer added exactly as it edits the hero.
 *
 * The copy is the prototype's hardcoded data, like everything on the page (content.ts `ai.*`).
 */
import { Photo, T } from './site-parts'

/** A strip of four kitchen photos under the hero — «add photos». */
export function PhotoStrip() {
  return (
    <div className="site-pad mx-auto max-w-[980px] pb-12" data-site-block="photos">
      <T k="ai.strip.eyebrow" className="mb-4 text-center text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--sa)]" />
      <div className="site-strip grid gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Photo key={i} k={`ai.strip.${i}.photo`} className="h-32 rounded-[14px]" tint="#e8e4dc" emoji="🥗" />
        ))}
      </div>
    </div>
  )
}

/** Three plans, the weekly one in the middle as the default choice — «add pricing». */
export function Pricing() {
  return (
    <div className="site-pad mx-auto max-w-[980px] py-16" data-site-block="pricing">
      <div className="mb-8 text-center">
        <T as="h2" k="ai.pricing.title" className="text-[28px] font-bold tracking-[-0.02em]" />
        <T k="ai.pricing.lead" className="mx-auto mt-2 max-w-[46ch] text-[15px] leading-[1.6] text-[#1d1f1a99]" />
      </div>
      <div className="site-plans grid gap-4">
        {[0, 1, 2].map((i) => {
          const hero = i === 1
          return (
            <div
              key={i}
              className={`relative flex flex-col rounded-[18px] bg-white p-6 ${hero ? 'shadow-[inset_0_0_0_2px_var(--sa),0_12px_32px_rgba(29,31,26,0.08)]' : 'shadow-[inset_0_0_0_1px_#1d1f1a14]'}`}
            >
              {hero && <T as="span" k="ai.plan.1.badge" className="absolute -top-3 left-6 rounded-full bg-[var(--sa)] px-3 py-1 text-[11.5px] font-semibold text-white" />}
              <T k={`ai.plan.${i}.name`} className="text-[15px] font-semibold" />
              <T k={`ai.plan.${i}.price`} className="mt-2 text-[24px] font-bold tracking-[-0.02em]" />
              <T k={`ai.plan.${i}.note`} className="mt-2 flex-1 text-[13.5px] leading-[1.5] text-[#1d1f1a99]" />
              <T
                as="span"
                k="ai.plan.cta"
                className={`mt-5 self-start rounded-full px-5 py-2.5 text-[13.5px] font-semibold ${hero ? 'bg-[var(--sa)] text-white' : 'text-[#1d1f1a] shadow-[inset_0_0_0_1px_#1d1f1a26]'}`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Three customers and their plans — «add testimonials». */
export function Testimonials() {
  return (
    <div className="bg-[color-mix(in_srgb,var(--sp)_93%,#1d1f1a)] py-16" data-site-block="testimonials">
      <div className="site-pad mx-auto max-w-[980px]">
        <T as="h2" k="ai.reviews.title" className="mb-8 text-center text-[28px] font-bold tracking-[-0.02em]" />
        <div className="site-plans grid gap-4">
          {[0, 1, 2].map((i) => (
            <figure key={i} className="flex flex-col justify-between gap-5 rounded-[18px] bg-white p-6 shadow-[inset_0_0_0_1px_#1d1f1a0f]">
              <T as="blockquote" k={`ai.review.${i}.quote`} className="text-[15.5px] leading-[1.55] text-[#1d1f1a]" />
              <T as="figcaption" k={`ai.review.${i}.name`} className="text-[13px] font-semibold text-[var(--sa)]" />
            </figure>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Four questions this kind of service always gets — «add an FAQ». */
export function Faq() {
  return (
    <div className="site-pad mx-auto max-w-[760px] py-16" data-site-block="faq">
      <T as="h2" k="ai.faq.title" className="mb-6 text-center text-[28px] font-bold tracking-[-0.02em]" />
      <div className="divide-y divide-[#1d1f1a14] rounded-[18px] bg-white px-6 shadow-[inset_0_0_0_1px_#1d1f1a14]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="py-5">
            <T k={`ai.faq.${i}.q`} className="text-[15.5px] font-semibold" />
            <T k={`ai.faq.${i}.a`} className="mt-1.5 text-[14.5px] leading-[1.55] text-[#1d1f1a99]" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** An order form on the dark band — «add an order form». The fields are decoration, like Contact's. */
export function OrderForm() {
  const FIELD = 'h-11 rounded-[10px] bg-[#ffffff0d] px-4 text-[14px] leading-[44px] text-[#ffffff66] shadow-[inset_0_0_0_1px_#ffffff1a]'
  return (
    <div className="bg-[var(--sd)] py-16 text-[#f4f4f0]" data-site-block="order">
      <div className="site-pad mx-auto grid max-w-[980px] items-center gap-8 md:grid-cols-2">
        <div>
          <T as="h2" k="ai.order.title" className="text-[28px] font-bold tracking-[-0.02em]" />
          <T k="ai.order.lead" className="mt-3 max-w-[40ch] text-[15px] leading-[1.6] text-[#f4f4f0a6]" />
        </div>
        <div className="flex flex-col gap-3">
          <div className={FIELD} aria-hidden>Your name</div>
          <div className={FIELD} aria-hidden>Phone</div>
          <div className={FIELD} aria-hidden>Delivery window · 07:00–07:30</div>
          <div className={FIELD} aria-hidden>Plan · Weekly</div>
          <T as="span" k="ai.order.cta" className="mt-1 self-start rounded-full bg-[var(--sa)] px-6 py-3 text-[14.5px] font-semibold text-white" />
        </div>
      </div>
    </div>
  )
}
