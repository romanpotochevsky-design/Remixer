/**
 * The generated site inside the preview canvas — hardcoded, like all prototype data.
 *
 * In the Figma frame the canvas shows a real generated website; an empty dark panel
 * reads as a broken build in any demo. This is the fit-ration demo project rendered
 * as a light one-page site. It is deliberately NOT in the builder's design language:
 * a generated site must look like a customer's site, not like Remixer chrome.
 */
import { useT } from '@/i18n'
import { revealScrollbar } from '@/ui/scroll'

const MEALS = [
  { name: 'Power Bowl', kcal: 520, protein: 42, tint: 'linear-gradient(135deg,#dff1e4,#b7dfc4)', emoji: '🥗' },
  { name: 'Lean Beef & Rice', kcal: 610, protein: 48, tint: 'linear-gradient(135deg,#f6e8d9,#eacdaa)', emoji: '🍛' },
  { name: 'Salmon Teriyaki', kcal: 570, protein: 39, tint: 'linear-gradient(135deg,#fbe3dc,#f3bfae)', emoji: '🍣' },
  { name: 'Chicken Pesto Pasta', kcal: 640, protein: 45, tint: 'linear-gradient(135deg,#eef2da,#d7e3ae)', emoji: '🍝' },
  { name: 'Greek Wrap', kcal: 480, protein: 33, tint: 'linear-gradient(135deg,#e7ecf6,#c3d2ec)', emoji: '🌯' },
  { name: 'Protein Pancakes', kcal: 430, protein: 31, tint: 'linear-gradient(135deg,#f9ecdf,#f0d3b0)', emoji: '🥞' },
]

/** The blank-page skeleton shown while the site "reloads" — grey slabs shimmering
 *  where the nav, hero and menu grid will land. Reads instantly as a page loading. */
export function SiteSkeleton() {
  return (
    <div className="h-full overflow-hidden bg-[#fbfaf7]" aria-hidden>
      <div className="flex items-center justify-between border-b border-[#1d1f1a0f] px-10 py-4">
        <div className="skeleton h-6 w-14" />
        <div className="flex gap-4">
          <div className="skeleton h-4 w-14" /><div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-14" /><div className="skeleton h-4 w-10" />
        </div>
        <div className="skeleton h-9 w-28 rounded-full" />
      </div>
      <div className="mx-auto max-w-[880px] px-10 pt-16 text-center">
        <div className="skeleton mx-auto h-3.5 w-44" />
        <div className="skeleton mx-auto mt-6 h-11 w-[70%]" />
        <div className="skeleton mx-auto mt-3 h-11 w-[52%]" />
        <div className="skeleton mx-auto mt-7 h-4 w-[64%]" />
        <div className="skeleton mx-auto mt-2 h-4 w-[46%]" />
        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="skeleton h-12 w-40 rounded-full" />
          <div className="skeleton h-12 w-40 rounded-full" />
        </div>
      </div>
      <div className="mx-auto mt-16 grid max-w-[980px] grid-cols-3 gap-4 px-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[14px] border border-[#1d1f1a0f] bg-white">
            <div className="skeleton h-28 rounded-none" />
            <div className="p-4">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton mt-2 h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SitePreview() {
  const { t } = useT()
  return (
    <div onScroll={revealScrollbar} className="scroll-light h-full overflow-y-auto bg-[#fbfaf7] font-sans text-[#1d1f1a]" data-prototype-note="generated site, not builder chrome">
      {/* site nav */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1d1f1a14] bg-[#fbfaf7f2] px-10 py-4 backdrop-blur-sm">
        <span className="text-[20px] font-bold tracking-[-0.02em]">fit<span className="text-[#2e7d4f]">.</span></span>
        <nav className="hidden items-center gap-7 text-[13.5px] text-[#1d1f1aa6] md:flex" aria-hidden>
          <span>Menu</span><span>How it works</span><span>Pricing</span><span>FAQ</span>
        </nav>
        <span className="rounded-full bg-[#2e7d4f] px-4 py-2 text-[13px] font-semibold text-white">Order now</span>
      </div>

      {/* hero */}
      <div className="mx-auto max-w-[880px] px-10 pb-14 pt-16 text-center">
        <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[#2e7d4f]">
          Meal prep · Odesa delivery
        </p>
        <h1 className="mx-auto max-w-[16ch] text-[42px] font-bold leading-[1.08] tracking-[-0.03em]" style={{ textWrap: 'balance' }}>
          Chef-made meals with exact macros
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-[16px] leading-[1.6] text-[#1d1f1a99]">
          Weekly menus cooked fresh every morning. Calories, protein, fat and carbs counted
          to the gram — so you don’t have to.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <span className="rounded-full bg-[#2e7d4f] px-6 py-3 text-[14.5px] font-semibold text-white">Build my plan</span>
          <span className="rounded-full border border-[#1d1f1a26] px-6 py-3 text-[14.5px] font-medium text-[#1d1f1a]">See the menu</span>
        </div>
        <div className="mt-10 flex items-center justify-center gap-10 text-[13px] text-[#1d1f1a80]">
          <span><b className="text-[16px] font-bold text-[#1d1f1a]">4 000+</b><br />meals delivered</span>
          <span><b className="text-[16px] font-bold text-[#1d1f1a]">±2 g</b><br />macro accuracy</span>
          <span><b className="text-[16px] font-bold text-[#1d1f1a]">07:30</b><br />at your door</span>
        </div>
      </div>

      {/* menu grid */}
      <div className="mx-auto max-w-[980px] px-10 pb-16">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-[24px] font-bold tracking-[-0.02em]">This week’s menu</h2>
          <span className="text-[13px] font-medium text-[#2e7d4f]">Full menu →</span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {MEALS.map((m) => (
            <div key={m.name} className="overflow-hidden rounded-[14px] border border-[#1d1f1a12] bg-white">
              <div className="grid h-28 place-items-center text-[40px]" style={{ background: m.tint }} aria-hidden>
                {m.emoji}
              </div>
              <div className="p-4">
                <p className="text-[15px] font-semibold">{m.name}</p>
                <p className="mt-1 text-[12.5px] tabular-nums text-[#1d1f1a80]">
                  {m.kcal} kcal · {m.protein} g protein
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* footer strip */}
      <div className="border-t border-[#1d1f1a14] bg-[#12140f] px-10 py-10 text-center">
        <p className="text-[18px] font-bold text-white">
          {t({ en: 'Ready when you are.', uk: 'Готові, коли готові ви.' })}
        </p>
        <p className="mt-1 text-[13px] text-[#ffffff8c]">fit. — chef-made meals, Odesa · hello@fit-ration.com</p>
      </div>
    </div>
  )
}
