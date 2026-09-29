/**
 * THE ACCOUNT MENU — a click on the avatar at the top of the right rail (board 31243:82905, designer
 * 29.09.2026: «вот макет с меню пользователя, это клик по аватару в правом верхнем углу… как в макете
 * меню перфект пиксель, а так же красивую анимацию открытия и закрытия в нашем стиле Apple liquid glass»).
 *
 * WHERE IT SITS — the board's `User menu` lies at x 2264, y 8 in the 2560 frame, 288 wide: top 8,
 * right 8. It COVERS the avatar that opened it, the way the Publish panel covers its button; the glass
 * inflates out of the avatar's centre (20 px in from the menu's top-right corner).
 *
 * THE BOARD'S NUMBERS (re-drawn 29.09.2026 — «я обновил дизайн меню пользователя»), 598 tall =
 * header 139 + credits card 260 + list 191 + 8 (the first board was 320 × 609 = 152 + 256 + 193 + 8):
 *   · glass — `rgba(31,31,31,.7)` under a 40 px backdrop blur (the board's BACKGROUND_BLUR 80 is
 *     Figma's radius; CSS takes half), rim `Neutral Alpha/100` INSIDE, r20, `0 8 72` at 50 %.
 *     Glass for real here: what is behind it is the site and the rail, so the blur has work to do.
 *   · header — pt 16 / pb 11, avatar 56 (ring 2 px centred on its edge), gap 10, name Gilroy SemiBold
 *     20/1.4, plan Proxima 13/1.4 on 48 %.
 *   · credits card — px 6, 6 % white under an 8 % rim INSIDE, r24: balance row pt 21 / pl 20 / pr 16
 *     (Gilroy Medium 16, cap-trimmed, + a 24 chevron on 32 % two apart), the three-segment bar (pt 12 /
 *     pb 16, gap 3, h 8 r8), an inner card (6 % under a 4 % rim, r16, px 4) of two rows 53 / 52 with an
 *     8 % hairline between — label 14 medium, figure Gilroy Medium 14 and, 11 to its right, a 6 px dot
 *     in the figure's bar colour (the dot is the bar's legend) — and `Add Credits` 40 r12 in p 16, word
 *     only. The plan row carries an 18 px cycle glyph where the first board printed «Resets 27 May»;
 *     the date lives in its tooltip now (the board hides that text, it does not delete the fact).
 *   · list — pt 12 / px 8: three rows 40 r8 (p 8, gap 12, glyph 24, 14/24) ONE apart and no trailing
 *     glyph, an 8 % hairline 8 below, then `Logout` (15/24, pl 8 / pr 12) in a group with pr 4.
 *   ⚠️ Every rim is an INSET SHADOW, never a `border` — Figma's stroke sits inside the geometry and a
 *   CSS border would take a pixel from every child (the fifth time this lesson has paid, design-system §5).
 *
 * WHAT IS OURS, not the board's (flagged to the designer, not decided silently):
 *   · the NAME and the avatar — the board draws a real actor's photograph under a film character's
 *     name; the product never draws a person, so the disc is the rail's own `R` in its ring.
 *   · the NUMBERS — the board's 250.2 / 7.20 / 2.80 do not add up and carry decimals the toolbar never
 *     shows. Ours read the world: the balance IS `world.credits` (the toolbar's pill), split into plan
 *     credits and the one-time bonus, and the bar is drawn against a month's 1,000.
 *   · what the rows DO — Help and Contact Support open DreamHost's pages in a new tab (the glyph says
 *     «opens elsewhere»), Logout returns to the Home page (the prototype has no signed-out screen),
 *     Add Credits closes the menu (no top-up flow is drawn).
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useUI } from '@/state/ui'
import { useWorld } from '@/state/world'
import { useT } from '@/i18n'
import { accountIn, accountInBody, accountInFade, accountRow, accountStill } from '@/ui/motion'
import { Tooltip } from '@/ui/Tooltip'
import { CreditDot, IconBug, IconChevronRightS, IconHelp, IconLogout, IconPlanCycle, IconSupport } from './boardIcons'

/** The demo account's holder — ours (the board's is a film character); `R` matches the rail's disc. */
export const ACCOUNT_NAME = 'Riley Carter'
/** A month of plan credits (product-facts: 1,000 / month) — the bar's full length. */
const PLAN_MONTH = 1000
/** How much of the balance is the one-time first-month bonus, while the bonus is on. */
const BONUS_LEFT = 180

/* main thread, not WAAPI: a composited fade hands the element back at its pre-animation opacity for one
   frame (the verb roll's lesson, CLAUDE.md) */
const keepOnMainThread = () => {}

function Row({ i, children }: { i: number; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div custom={i} variants={reduce ? accountStill : accountRow} onUpdate={keepOnMainThread} className="w-full">
      {children}
    </motion.div>
  )
}

export function AccountMenu() {
  const open = useUI((s) => s.accountOpen)
  const toggle = useUI((s) => s.toggleAccount)
  const goHome = useUI((s) => s.goHome)
  const { world } = useWorld()
  const { t } = useT()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const el = e.target as Element
      /* the avatar toggles itself; the console is a staging tool, not "outside" */
      if (el.closest?.('[data-account-trigger]') || el.closest?.('[data-console]')) return
      if (ref.current && !ref.current.contains(el)) toggle(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') toggle(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open, toggle])

  const total = Math.max(0, world.credits)
  const extra = world.bonus ? Math.min(total, BONUS_LEFT) : 0
  const plan = total - extra
  const cap = Math.max(PLAN_MONTH, total)
  /* the board prints bare digits — «12000», «9000» — no group separator */
  const fmt = (n: number) => String(n)
  /* the plan resets at the end of the 30-day cycle the trial day counts through */
  const reset = new Date(Date.now() + Math.max(1, 30 - world.trialDay) * 86_400_000)
  const resetDay = String(reset.getDate())
  const resetMonth = reset.toLocaleString(world.lang === 'uk' ? 'uk-UA' : 'en-US', { month: 'short' }).replace('.', '')
  const planName =
    world.account === 'paid' ? t({ en: 'Build Plan', uk: 'План Build' })
      : world.account === 'trial' ? t({ en: `Free trial · ${Math.max(0, 30 - world.trialDay)} days left`, uk: `Пробний період · ${Math.max(0, 30 - world.trialDay)} дн.` })
        : world.account === 'trial-expired' ? t({ en: 'Trial ended', uk: 'Пробний період завершився' })
          : t({ en: 'No plan', uk: 'Без плану' })

  const listRow = (i: number, icon: ReactNode, label: string, href: string) => (
    <Row i={i} key={label}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => toggle(false)}
        data-account-row
        className="press-bloom flex h-10 w-full items-center gap-3 rounded-[8px] p-2 transition-colors duration-150 hover:bg-[var(--white-100)] focus-visible:bg-[var(--white-100)] focus-visible:outline-none"
      >
        <span className="text-[var(--white-480)]">{icon}</span>
        <span className="min-w-0 flex-1 text-[14px] leading-[24px] text-white">{label}</span>
      </a>
    </Row>
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          role="dialog"
          aria-label={t({ en: 'Account', uk: 'Акаунт' })}
          data-account-menu
          variants={reduce ? accountInFade : accountIn}
          initial="initial"
          animate="animate"
          exit="exit"
          onUpdate={keepOnMainThread}
          className="fixed right-2 top-2 z-50 w-[288px] rounded-[20px] backdrop-blur-[40px]"
          style={{
            transformOrigin: 'calc(100% - 20px) 20px',
            background: 'rgba(31,31,31,0.7)',
            boxShadow: 'inset 0 0 0 1px var(--white-100), 0 8px 72px rgba(0,0,0,0.5)',
          }}
        >
          {/* the rim catching the light as the glass forms (the Panel Arrival's glint) */}
          <span aria-hidden className="glass-glint" />
          <motion.div variants={reduce ? accountStill : accountInBody} onUpdate={keepOnMainThread} className="flex flex-col pb-2" style={{ transformOrigin: 'calc(100% - 20px) 20px' }}>
            {/* ------------------------------------------------ header 139 */}
            <div className="flex flex-col items-center px-6 pb-[11px] pt-4" data-account-header>
              <Row i={0}>
                <div className="flex flex-col items-center gap-[10px]">
                  {/* avatar 56 — the ring is a 2 px stroke CENTRED on the edge, so it paints 58 and the
                      layout box stays 56 */}
                  <span className="relative block h-14 w-14" data-account-avatar>
                    <span
                      aria-hidden
                      className="absolute -inset-px rounded-full"
                      style={{ background: 'conic-gradient(from 90deg, #a49aff 0deg, #cb9dff 180deg, #cb9dff 180deg, #a49aff 299deg, #a49aff 360deg)' }}
                    />
                    <span className="absolute inset-px grid place-items-center rounded-full bg-gradient-to-br from-[#e0a94a] to-[#a3651f] font-display text-[22px] font-semibold text-white">
                      R
                    </span>
                  </span>
                  <div className="flex flex-col items-center">
                    <p className="font-display text-[20px] font-semibold leading-[1.4] text-white" data-account-name>{ACCOUNT_NAME}</p>
                    <p className="text-[13px] leading-[18px] text-[var(--white-480)]">{planName}</p>
                  </div>
                </div>
              </Row>
            </div>

            {/* ------------------------------------------------ credits card 260 */}
            <div className="px-1.5">
              <Row i={1}>
                <div className="flex flex-col rounded-[24px]" style={{ background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px var(--white-100)' }} data-account-credits>
                  {/* 45 = pt 21 + the chevron's 24 box */}
                  <div className="flex items-center justify-between pl-5 pr-4 pt-[21px]" data-account-balance-row>
                    <span className="font-display text-[15px] font-semibold leading-[1.2] text-white">{t({ en: 'Credit Balance', uk: 'Баланс кредитів' })}</span>
                    <span className="flex items-center gap-0.5">
                      <span className="font-display text-[16px] font-medium tabular-nums leading-[1.2] text-white [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]" data-account-balance>{fmt(total)}</span>
                      <IconChevronRightS className="text-[var(--white-320)]" />
                    </span>
                  </div>
                  <div className="px-5 pb-4 pt-3">
                    <div className="flex h-2 w-full gap-[3px]" data-account-bar>
                      {extra > 0 && (
                        <span className="h-2 rounded-[8px]" style={{ width: `${(extra / cap) * 100}%`, backgroundImage: 'linear-gradient(199.74deg, #ff6959 14.13%, #a22cec 92.46%)' }} />
                      )}
                      {plan > 0 && (
                        <span className="h-2 rounded-[8px]" style={{ width: `${(plan / cap) * 100}%`, backgroundImage: 'linear-gradient(to right, #ffe082 1.22%, #fa9f6a 104.57%)' }} />
                      )}
                      <span className="h-2 min-w-px flex-1 rounded-[8px] bg-[var(--gray-800)]" />
                    </div>
                  </div>
                  <div className="px-1.5">
                    {/* 264 × 107 with its 4 % stroke INSIDE: the rows start one pixel in on every side (the board's
                        child sits at x 5, y 1, 254 × 105 — the frame's px 4 plus the stroke's 1) */}
                    <div className="flex flex-col rounded-[16px] px-[5px] py-px" style={{ background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px var(--white-050)' }} data-account-inner>
                      {/* Plan credits — 53 = 18 + 20 + 15, the 8 % hairline inside the row's bottom */}
                      <div className="flex items-center justify-between px-[14px] pb-[15px] pt-[18px]" style={{ boxShadow: 'inset 0 -1px 0 0 var(--white-100)' }} data-account-plan-row>
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-[14px] font-medium leading-5 text-white">{t({ en: 'Plan Credits', uk: 'Кредити плану' })}</span>
                          <Tooltip text={t({ en: `Resets ${resetDay} ${resetMonth}`, uk: `Оновлення ${resetDay} ${resetMonth}` })}>
                            <IconPlanCycle className="block text-[var(--white-480)]" />
                          </Tooltip>
                        </span>
                        <span className="flex items-center gap-[11px]">
                          <span className="font-display text-[14px] font-medium tabular-nums leading-[1.2] text-white" data-account-plan>{fmt(plan)}</span>
                          <CreditDot tone="plan" />
                        </span>
                      </div>
                      {/* One-time credits — 52 = 15 + 20 + 17 */}
                      <div className="flex items-center justify-between gap-6 px-[14px] pb-[17px] pt-[15px]" data-account-extra-row>
                        <span className="text-[14px] font-medium leading-5 text-white">{t({ en: 'One-Time Credits', uk: 'Разові кредити' })}</span>
                        <span className="flex items-center gap-[11px]">
                          <span className="font-display text-[14px] font-medium tabular-nums leading-[1.2] text-white" data-account-extra>{fmt(extra)}</span>
                          <CreditDot tone="extra" />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <button
                      type="button"
                      onClick={() => toggle(false)}
                      data-account-add
                      className="press-bloom flex h-10 w-full items-center justify-center overflow-hidden rounded-[12px] bg-[var(--action)] px-5 text-[14px] font-semibold leading-none text-white transition-colors duration-150 hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)]"
                    >
                      {t({ en: 'Add Credits', uk: 'Додати кредити' })}
                    </button>
                  </div>
                </div>
              </Row>
            </div>

            {/* ------------------------------------------------ list 191 */}
            <div className="flex flex-col gap-2 px-2 pt-3" data-account-list>
              <div className="flex flex-col gap-px">
                {listRow(2, <IconSupport />, t({ en: 'Contact Support', uk: 'Звернутися в підтримку' }), 'https://panel.dreamhost.com/?tree=support.msg')}
                {listRow(3, <IconHelp />, t({ en: 'Help', uk: 'Довідка' }), 'https://help.dreamhost.com/')}
                {listRow(4, <IconBug />, t({ en: 'Bug Report', uk: 'Повідомити про помилку' }), 'https://panel.dreamhost.com/?tree=support.msg')}
              </div>
              <Row i={5}><span aria-hidden className="block h-px w-full bg-[var(--white-100)]" /></Row>
              <div className="pr-1">
                <Row i={6}>
                  <button
                    type="button"
                    onClick={() => goHome()}
                    data-account-logout
                    className="press-bloom flex h-10 w-full items-center gap-3 rounded-[8px] py-2 pl-2 pr-3 text-left transition-colors duration-150 hover:bg-[var(--white-100)] focus-visible:bg-[var(--white-100)] focus-visible:outline-none"
                  >
                    <IconLogout className="text-[var(--white-480)]" />
                    <span className="min-w-0 flex-1 text-[15px] leading-[24px] text-white">{t({ en: 'Logout', uk: 'Вийти' })}</span>
                  </button>
                </Row>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
