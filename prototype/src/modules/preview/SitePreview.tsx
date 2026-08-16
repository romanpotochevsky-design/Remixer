/**
 * The generated site inside the preview canvas — hardcoded, like all prototype data.
 *
 * In the Figma frame the canvas shows a real generated website; an empty dark panel
 * reads as a broken build in any demo. This is the fit-ration demo project rendered
 * as a light one-page site. It is deliberately NOT in the builder's design language:
 * a generated site must look like a customer's site, not like Remixer chrome.
 */
import { useT } from '@/i18n'
import { ScrollArea } from '@/ui/ScrollArea'

const MEALS = [
  { name: 'Power Bowl', kcal: 520, protein: 42, tint: 'linear-gradient(135deg,#dff1e4,#b7dfc4)', emoji: '🥗' },
  { name: 'Lean Beef & Rice', kcal: 610, protein: 48, tint: 'linear-gradient(135deg,#f6e8d9,#eacdaa)', emoji: '🍛' },
  { name: 'Salmon Teriyaki', kcal: 570, protein: 39, tint: 'linear-gradient(135deg,#fbe3dc,#f3bfae)', emoji: '🍣' },
  { name: 'Chicken Pesto Pasta', kcal: 640, protein: 45, tint: 'linear-gradient(135deg,#eef2da,#d7e3ae)', emoji: '🍝' },
  { name: 'Greek Wrap', kcal: 480, protein: 33, tint: 'linear-gradient(135deg,#e7ecf6,#c3d2ec)', emoji: '🌯' },
  { name: 'Protein Pancakes', kcal: 430, protein: 31, tint: 'linear-gradient(135deg,#f9ecdf,#f0d3b0)', emoji: '🥞' },
]

export function SitePreview() {
  const { t } = useT()
  return (
    <ScrollArea
      className="h-full"
      innerClassName="bg-[#fbfaf7] font-sans text-[#1d1f1a]"
      thumb="auto"
      data-prototype-note="generated site, not builder chrome"
    >
      {/* site nav */}
      <div className="site-pad sticky top-0 z-10 flex items-center justify-between border-b border-[#1d1f1a14] bg-[#fbfaf7f2] py-4 backdrop-blur-sm">
        <span className="text-[20px] font-bold tracking-[-0.02em]">fit<span className="text-[#2e7d4f]">.</span></span>
        <nav className="site-nav-links gap-7 text-[13.5px] text-[#1d1f1aa6]" aria-hidden>
          <span>Menu</span><span>How it works</span><span>Pricing</span><span>FAQ</span>
        </nav>
        <span className="rounded-full bg-[#2e7d4f] px-4 py-2 text-[13px] font-semibold text-white">Order now</span>
      </div>

      {/* hero */}
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

      {/* footer strip */}
      <div className="site-pad bg-[#0b0d0a] py-10 text-center">
        <p className="text-[18px] font-bold text-white">
          {t({ en: 'Ready when you are.', uk: 'Готові, коли готові ви.' })}
        </p>
        <p className="mt-1 text-[13px] text-[#ffffff8c]">fit. — chef-made meals, Odesa · hello@fit-ration.com</p>
      </div>
    </ScrollArea>
  )
}
