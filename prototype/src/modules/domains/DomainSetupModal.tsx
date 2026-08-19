/**
 * The two lines to paste — ㉘ A2, rebuilt as a sheet.
 *
 * This is the one place in the whole product where the customer has to do work we cannot
 * do for them. DreamHost supports Domain Connect in no role (verified), so there is no
 * one-click path to offer and pretending otherwise is what retired the boards this
 * replaces. The honest shape is: show exactly what to paste, say plainly that nothing
 * else breaks, keep checking on their behalf, and let them walk away mid-way.
 *
 * It is a SHEET rather than a page, and that is the substantive change from the screen it
 * replaces. The errand happens at somebody else's website; the customer's own site should
 * still be visible behind it, and coming back to finish should not mean navigating
 * anywhere. Everything visual is lifted from the Connect-domain sheet the customer
 * pressed a moment ago — same shell, same header, same 48px tile, same guard grammar —
 * so the surface reads as refilled rather than replaced.
 *
 * Two rules govern the copy:
 *  - our prose carries no jargon: "two lines", "point your domain to us", never "A record"
 *    as an explanation;
 *  - the values are exact, because the customer is about to retype them into a form we
 *    do not control. Blurring `A` or `@` into plain language would be kind right up until
 *    they cannot find the field.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useWorld, domainResolves } from '@/state/world'
import type { SetupLine } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT, type Text } from '@/i18n'
import { DH_WEB_IP } from '@/data/domains'
import { armExternalSetup, checkExternalSetup, resumePolling } from '@/state/externalSetup'
import { ScrollArea } from '@/ui/ScrollArea'
import { IconCheck, IconCopy, IconLink } from '@/ui/icons'
import { ModalShell, SheetHeader, GlobeTile } from './sheet-parts'
import { listSwap, listSwapItem } from '@/ui/motion'

/**
 * The two rows, in the order a registrar's form wants them.
 *
 * Both point at the same address: one for the domain itself, one for the `www` version.
 * Sending only the first is the classic half-finished setup — the site works at
 * example.com and 404s at www.example.com — so they are presented as one job of two
 * parts, never as a main line and an optional extra.
 */
const LINES: { id: SetupLine; name: string; for: (d: string) => Text }[] = [
  {
    id: 'root',
    name: '@',
    for: (d) => ({ en: `for ${d}`, uk: `для ${d}` }),
  },
  {
    id: 'www',
    name: 'www',
    for: (d) => ({ en: `for www.${d}`, uk: `для www.${d}` }),
  },
]

/** One pasteable line. Three labelled values, and one action that becomes a state. */
function LineRow({ line, domain, found, onCopy, copied }: {
  line: (typeof LINES)[number]
  domain: string
  found: boolean
  onCopy: () => void
  copied: boolean
}) {
  const { t } = useT()
  return (
    <div className="flex h-[72px] items-center justify-between gap-4 px-4">
      <div className="flex min-w-0 flex-1 items-center gap-5">
        <div className="w-[42px] flex-none">
          <p className="text-[11.5px] uppercase tracking-[0.08em] text-[var(--white-300)]">
            {t({ en: 'Type', uk: 'Тип' })}
          </p>
          <p className="mt-1 font-mono text-[13px] text-[var(--white-700)]">A</p>
        </div>
        <div className="w-[64px] flex-none">
          <p className="text-[11.5px] uppercase tracking-[0.08em] text-[var(--white-300)]">
            {t({ en: 'Name', uk: 'Імʼя' })}
          </p>
          <p className="mt-1 font-mono text-[13px] text-[var(--white-700)]">{line.name}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11.5px] uppercase tracking-[0.08em] text-[var(--white-300)]">
            {t({ en: 'Points to', uk: 'Вказує на' })} <span className="normal-case tracking-normal">· {t(line.for(domain))}</span>
          </p>
          <p className="mt-1 truncate font-mono text-[13px] text-[var(--white-700)]">{DH_WEB_IP}</p>
        </div>
      </div>

      {/* The right-hand slot IS the row's state: a button while it is outstanding, a
          settled label once we can see it. No status dot — ⑲'s one-dot rule means the
          dots in this product belong to the domain as a whole, not to its parts. */}
      {found ? (
        <span className="flex flex-none items-center gap-2 pr-1 text-[13px] font-medium" style={{ color: 'var(--live)' }}>
          <IconCheck size={12} />
          {t({ en: 'Added', uk: 'Додано' })}
        </span>
      ) : (
        <button
          onClick={onCopy}
          className="h-9 flex-none rounded-[8px] border border-[#ffffff3d] px-3.5 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
        >
          <span className="inline-flex items-center gap-2">
            {copied ? <IconCheck size={12} /> : <IconCopy size={14} />}
            {copied ? t({ en: 'Copied', uk: 'Скопійовано' }) : t({ en: 'Copy', uk: 'Копіювати' })}
          </span>
        </button>
      )}
    </div>
  )
}

/** One line of the canonical success checklist (audit rule: same three, same order). */
function CheckRow({ done, label }: { done: boolean; label: Text }) {
  const { t } = useT()
  return (
    <div className="flex items-center gap-2.5 text-[14px]">
      {done ? (
        <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-[#48ba7933] text-[var(--live)]">
          <IconCheck size={11} />
        </span>
      ) : (
        <span className="h-5 w-5 flex-none rounded-full border border-[#ffffff8f]" aria-hidden />
      )}
      <span className={done ? 'text-white' : 'text-[#ffffff8f]'}>{t(label)}</span>
    </div>
  )
}

export function DomainSetupModal() {
  const { world } = useWorld()
  const { setupModal, closeSetupModal } = useUI()
  const { t } = useT()
  const [copied, setCopied] = useState<SetupLine | null>(null)

  const s = world.externalSetup
  const open = setupModal !== null && s !== null

  /* Timers live in the module, not here, so closing the sheet does not abandon the job.
     Re-arming on mount is what makes a page reload resume rather than restart. */
  useEffect(() => { if (open) resumePolling() }, [open])

  if (!s) return <ModalShell open={false} onClose={closeSetupModal} width={560} label="">{null}</ModalShell>

  const { domain, host, found, checking, kind } = s
  const pending = found.length < 2

  const copy = async (id: SetupLine) => {
    /* Wrapped because the clipboard is walled off inside sandboxed embeds — the published
       artifact is one — and a rejected promise must not take the interaction down. */
    try { await navigator.clipboard.writeText(DH_WEB_IP) } catch { /* ignore */ }
    setCopied(id)
    setTimeout(() => setCopied(null), 1400)
    armExternalSetup()
  }

  return (
    <ModalShell
      open={open}
      onClose={closeSetupModal}
      width={560}
      label={t({ en: 'Connect your domain', uk: 'Підключення вашого домену' })}
    >
      <SheetHeader
        title={pending
          ? t({ en: 'Two lines to paste', uk: 'Два рядки, які треба вставити' })
          : t({ en: 'Domain connected', uk: 'Домен підключено' })}
        onClose={closeSetupModal}
        closeLabel={t({ en: 'Close', uk: 'Закрити' })}
      />

      <div className="min-h-0 flex-1 px-1.5">
        <ScrollArea className="h-full">
          <div className="rounded-[16px] border border-[#ffffff0a] bg-[#ffffff0a]">
            {/* ------------------------------------------------- identity row.
                Geometry locked to the confirm sheet's lean mode so the handoff from
                one to the other is a refill, not a jump. */}
            <div className="flex items-center gap-4 border-b border-[#ffffff0a] py-6 pl-4 pr-6">
              <GlobeTile />
              <div className="min-w-0 flex-1 pb-0.5">
                <div className="flex h-[34px] items-baseline justify-between gap-4">
                  <p className="min-w-0 truncate font-display text-[24px] font-medium leading-[1.2] text-white">
                    {domain}
                  </p>
                </div>
                <div className="flex h-5 items-baseline justify-between gap-4 pr-0.5">
                  {pending ? (
                    <p className="flex items-center gap-0.5 truncate text-[14px] leading-[1.4]">
                      <span className="text-[#ffffffa3]">
                        {kind === 'dh-external-ns'
                          ? t({ en: `Managed at ${host}`, uk: `Керується на ${host}` })
                          : t({ en: `Registered at ${host}`, uk: `Зареєстровано на ${host}` })}
                      </span>
                      <span className="mx-0.5 flex-none text-[rgba(255,240,186,0.9)]"><IconLink size={20} /></span>
                      <span className="text-[rgba(255,240,186,0.9)]">
                        {t({ en: 'about 5 minutes', uk: 'близько 5 хвилин' })}
                      </span>
                    </p>
                  ) : (
                    <p className="truncate text-[14px] leading-[1.4] text-[#ffffff8f]">
                      {t({ en: 'Both lines are in — nothing left to do here', uk: 'Обидва рядки на місці — тут більше нічого робити' })}
                    </p>
                  )}
                  {pending && (
                    <p className="flex-none whitespace-nowrap text-[13px] leading-none text-[#ffffff7a]">
                      {t({ en: `${found.length} of 2 found`, uk: `знайдено: ${found.length} з 2` })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- guard.
                First fear on this screen is breaking the email. Answer it before
                asking for anything, in the position the confirm sheet uses. */}
            {pending && (
              <div className="border-b border-[#ffffff0a] px-4 py-4">
                <p className="text-[14px] font-semibold leading-[1.4] text-[rgba(255,240,186,0.9)]">
                  {kind === 'dh-external-ns'
                    ? t({ en: `Your domain stays with us — only its settings live at ${host}`, uk: `Домен залишається в нас — на ${host} живуть лише його налаштування` })
                    : t({ en: `It stays at ${host} — no transfer needed`, uk: `Він залишиться на ${host} — переносити не треба` })}
                </p>
                <p className="mt-1 text-[13px] leading-[1.45] text-[#ffffff8f]">
                  {t({
                    en: 'Everything else — email included — stays untouched.',
                    uk: 'Усе інше — разом із поштою — залишиться як було.',
                  })}
                </p>
              </div>
            )}

            {/* ----------------------------------------------------- the work */}
            <AnimatePresence mode="wait">
              <motion.div key={pending ? 'lines' : 'done'} variants={listSwap} initial="initial" animate="animate" exit="exit">
                {pending ? (
                  <>
                    <motion.div variants={listSwapItem} className="px-4 pb-3 pt-4">
                      <p className="text-[14px] font-semibold leading-[1.4] text-[#f5f5fa]">
                        {t({ en: `Paste these at ${host}`, uk: `Вставте це на ${host}` })}
                      </p>
                      <p className="mt-1 text-[13px] leading-[1.45] text-[#ffffff7a]">
                        {t({
                          en: 'Both lines send visitors to the same place — one for your domain, one for the www version.',
                          uk: 'Обидва рядки ведуть в одне місце — один для домену, другий для версії з www.',
                        })}
                      </p>
                    </motion.div>

                    {LINES.map((line, i) => (
                      <motion.div key={line.id} variants={listSwapItem}>
                        {i > 0 && <div className="mx-4 h-px bg-[#ffffff0a]" aria-hidden />}
                        <LineRow
                          line={line}
                          domain={domain}
                          found={found.includes(line.id)}
                          copied={copied === line.id}
                          onCopy={() => copy(line.id)}
                        />
                      </motion.div>
                    ))}

                    <motion.div variants={listSwapItem} className="px-4 pb-4 pt-2">
                      <p className="text-[13px] leading-[1.45] text-[#ffffff8f]">
                        {t({
                          en: '“@” means the domain on its own, with nothing in front of it.',
                          uk: '«@» означає сам домен, без нічого попереду.',
                        })}
                      </p>
                      <p className="mt-1 text-[13px] leading-[1.45] text-[#ffffff8f]">
                        {t({
                          en: `Look for DNS settings at ${host} — paste both lines there and save.`,
                          uk: `Знайдіть налаштування DNS на ${host} — вставте туди обидва рядки та збережіть.`,
                        })}
                      </p>
                    </motion.div>
                  </>
                ) : (
                  <motion.div variants={listSwapItem}>
                    <div className="space-y-3 px-4 pt-4">
                      <CheckRow done label={{ en: 'Domain settings updated', uk: 'Налаштування домену оновлено' }} />
                      <CheckRow
                        done={domainResolves(world.domain)}
                        label={{ en: 'Connected to your site', uk: 'Підключено до вашого сайту' }}
                      />
                      <CheckRow
                        done={world.domain === 'live' || world.domain === 'multiple'}
                        label={{ en: 'Security (SSL) on', uk: 'Захист (SSL) увімкнено' }}
                      />
                    </div>
                    <div className="px-4 pb-4 pt-3">
                      <p className="text-[12.5px] leading-[1.45] text-[#ffffff7a]">
                        {t({
                          en: 'The last two happen on our side — Publish shows how they’re going.',
                          uk: 'Останні два — на нашому боці; як вони йдуть, видно в «Публікації».',
                        })}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* ------------------------------------------------------ transfer.
                A sentence, never a control: no transfer flow is drawn on any live
                board, and a button that goes nowhere is the exact defect being
                removed from the screen this replaces. Gated to genuinely external
                domains — offering to transfer a DreamHost domain to DreamHost would
                be a factual error on the customer's own record. */}
            {pending && kind === 'external' && (
              <div className="px-4 pb-4">
                <p className="text-[12.5px] leading-[1.45] text-[#ffffff7a]">
                  {t({ en: `You can move ${domain} to DreamHost later — `, uk: `Пізніше можна перенести ${domain} у DreamHost — ` })}
                  <span className="font-display font-medium">$9.99</span>
                  {t({ en: ', adds a year, takes 5–7 days. Not needed to connect it.', uk: ', додає рік, триває 5–7 днів. Для підключення це не потрібно.' })}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ------------------------------------------------------- button bar.
          The left line answers "what if I close this" at the moment the question
          gets asked, which is while looking at the button. */}
      <div className="flex flex-none items-center justify-between py-4 pl-6 pr-[18px]">
        {pending ? (
          <p className="text-[12.5px] leading-[1.45] text-[#ffffff7a]">
            {t({ en: 'We keep checking — you can close this.', uk: 'Ми продовжуємо перевіряти — можна закрити.' })}
          </p>
        ) : <span />}
        <button
          onClick={pending ? checkExternalSetup : closeSetupModal}
          disabled={checking}
          className={`h-10 flex-none rounded-[10px] px-5 text-[14px] font-semibold leading-none transition-colors duration-[var(--dur-fast)] ease-std ${
            checking
              ? 'cursor-not-allowed bg-[var(--white-100)] text-[var(--white-400)]'
              : 'bg-[var(--action)] text-white hover:bg-[var(--action-hover)]'
          }`}
        >
          {checking
            ? t({ en: 'Checking…', uk: 'Перевіряємо…' })
            : pending
              ? t({ en: 'I’ve pasted them — check now', uk: 'Я вставив(-ла) — перевірити' })
              : t({ en: 'Back to editing', uk: 'Назад до редагування' })}
        </button>
      </div>
    </ModalShell>
  )
}
