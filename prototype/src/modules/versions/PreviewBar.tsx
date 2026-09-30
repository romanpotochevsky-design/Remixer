/**
 * THE PREVIEW BAR — what the canvas says while an old version is on it (the version card's eye).
 *
 * Lovable previews a version in place and keeps a «Restore» beside it; the category's complaint is
 * the opposite failure — people could not tell they were looking at an old site and edited it, or
 * thought the preview WAS the restore (docs/features/versions/README.md §2). So the preview is
 * loud about being a preview, in three places that agree: this bar, a blue ring round the canvas
 * (App.tsx `VersionStageRing`), and the card whose eye is on (its rim goes blue).
 *
 * WHERE. In the edit bar's slot at the canvas's foot — the edit bar steps aside while an old
 * version is shown (an old version is looked at, never edited), so the canvas has one bar and it
 * is always the one that fits. The edit bar's own glass (`.liquid-glass--editbar`) and its lift.
 *
 * WHAT IT DOES. «Restore this version» — the one decision the preview exists to help with, blue,
 * through the same confirmation as the card's arrow; ✕ (and Esc, and pressing the eye again, and
 * sending a message) — back to the site as it is. Nothing here changes the site until Restore.
 */
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import { useT } from '@/i18n'
import { useWorld } from '@/state/world'
import { useUI } from '@/state/ui'
import { useConfirm } from '@/ui/ConfirmDialog'
import { Tooltip } from '@/ui/Tooltip'
import { previewBarIn, previewBarInFade, swapText } from '@/ui/motion'
import { IconCloseM } from '@/ui/icons'
import { GlyphPreview } from './icons'
import { currentOf, restoreVersion, timeOf, versionAt, versionBlock } from './model'

const keepOnMainThread = () => {}

export function PreviewBar() {
  const { t, lang } = useT()
  const reduce = useReducedMotion()
  const n = useUI((s) => s.versionPreview)
  const setPreview = useUI((s) => s.setVersionPreview)
  const surface = useUI((s) => s.surface)
  const world = useWorld((s) => s.world)
  const v = n !== null ? versionAt(world, n) : undefined
  const cur = currentOf(world)
  const block = versionBlock(world)

  /* a preview of a version that no longer exists, or that has become the current one (a restore,
     a staged world), is no preview: step back to the site */
  useEffect(() => {
    if (n !== null && (!v || v.n === cur?.n || surface !== 'preview' || world.project !== 'built')) setPreview(null)
  }, [n, v, cur?.n, surface, world.project, setPreview])

  /* Esc — the way out of every temporary state in the shell — unless a dialog is up (its own Esc) */
  useEffect(() => {
    if (n === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || useConfirm.getState().req) return
      const el = document.activeElement as HTMLElement | null
      if (el && (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) return
      setPreview(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [n, setPreview])

  const restore = () => {
    if (!v) return
    const when = timeOf(v.at, lang)
    useConfirm.getState().ask({
      title: t({ en: 'Restore this version?', uk: 'Відновити цю версію?' }),
      body: t({
        en: `Your site goes back to “${v.title.en}” — Version ${v.n}, ${when}. Nothing is deleted: every version after it stays in the chat, and you can switch back anytime. Restoring is free.${world.published ? ' Visitors keep seeing your live site until you publish.' : ''}`,
        uk: `Сайт повернеться до «${v.title.uk}» — версія ${v.n}, ${when}. Нічого не видаляється: усі наступні версії лишаються в чаті, і повернутися можна будь-коли. Відновлення безкоштовне.${world.published ? ' Відвідувачі бачитимуть опублікований сайт, доки ви не опублікуєте.' : ''}`,
      }),
      confirmLabel: t({ en: 'Restore', uk: 'Відновити' }),
      cancelLabel: t({ en: 'Cancel', uk: 'Скасувати' }),
      onConfirm: () => restoreVersion(v.n),
    })
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[29px] z-30 flex justify-center" data-version-bar-host>
      <AnimatePresence initial={false}>
        {v && (
          <motion.div
            key="bar"
            data-version-bar={v.n}
            role="status"
            className="liquid-glass liquid-glass--editbar pointer-events-auto flex h-14 items-center gap-3 rounded-[18px] pl-4 pr-2 shadow-[0_8px_32px_rgba(0,0,0,0.33)]"
            variants={reduce ? previewBarInFade : previewBarIn}
            initial="initial"
            animate="animate"
            exit="exit"
            onUpdate={keepOnMainThread}
          >
            <span className="grid h-6 w-6 flex-none place-items-center text-[var(--action-ink)]"><GlyphPreview /></span>
            <AnimatePresence initial={false} mode="wait">
              <motion.div key={v.n} className="flex min-w-0 max-w-[340px] flex-col gap-0.5" variants={swapText} initial="initial" animate="animate" exit="exit" onUpdate={keepOnMainThread}>
                <span className="truncate text-[14px] font-semibold leading-[18px] text-white">
                  {t({ en: 'Viewing an earlier version', uk: 'Ви дивитеся попередню версію' })}
                </span>
                <span className="truncate text-[12.5px] leading-[16px] text-[var(--white-560)]">
                  {t(v.title)} · {t({ en: `Version ${v.n}`, uk: `Версія ${v.n}` })} · {timeOf(v.at, lang)}
                </span>
              </motion.div>
            </AnimatePresence>
            <Tooltip text={block ?? { en: 'Make this your site again — free', uk: 'Повернути сайт до цієї версії — безкоштовно' }} interactive>
              <button
                type="button"
                data-version-bar-restore
                disabled={!!block}
                onClick={restore}
                className="press-bloom ml-2 h-10 flex-none rounded-[10px] bg-[var(--action)] px-4 text-[14px] font-semibold text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)] active:bg-[var(--action-pressed)] disabled:opacity-40"
              >
                {t({ en: 'Restore this version', uk: 'Відновити цю версію' })}
              </button>
            </Tooltip>
            <Tooltip text={{ en: 'Back to your site as it is · Esc', uk: 'Назад до поточного сайту · Esc' }} interactive>
              <button
                type="button"
                data-version-bar-close
                aria-label={t({ en: 'Back to your site as it is', uk: 'Назад до поточного сайту' })}
                onClick={() => setPreview(null)}
                className="vc-tonal press-bloom grid h-10 w-10 flex-none place-items-center"
              >
                <IconCloseM size={24} />
              </button>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
