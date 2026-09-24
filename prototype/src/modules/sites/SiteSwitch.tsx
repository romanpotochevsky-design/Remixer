/**
 * THE SITE'S NAME IN THE CHAT HEADER — where the wordmark stood (designer, 25.09.2026, with a
 * screenshot of the header: «вместо слова "Remixer" мы будем писать сайта название и стрелочку
 * вниз»). The mark beside it stays the door to the Home page; this is the door to the shelf of
 * the customer's sites (SitesShelf.tsx).
 *
 * Same type as the word it replaces (Gilroy 20 semibold — the slot's), a 16 chevron that turns
 * over while the shelf is up (the page switcher's rule), the house hover wash and press bloom.
 * It exists only once there is a site to name: through the brief and the build the wordmark
 * stands here, by the rule that hides every control the site does not yet exist for.
 *
 * Opening from a state that is not the plain canvas: a collapsed preview opens first, another
 * window closes first, and the shelf follows a beat later — the flight needs the canvas to
 * measure the site on.
 */
import { useReducedMotion } from 'motion/react'
import { useWorld, siteName } from '@/state/world'
import { useUI } from '@/state/ui'
import { useT } from '@/i18n'
import { IconChevronDown } from '@/ui/icons'
import { closeShelf } from './park'

export function SiteSwitch() {
  const { t } = useT()
  const world = useWorld((s) => s.world)
  const { surface, openSurface, closeSurface, previewOpen, setPreviewOpen } = useUI()
  const reduce = useReducedMotion() ?? false
  const open = surface === 'sites'
  const name = siteName(world)

  const toggle = () => {
    if (open) { closeShelf(reduce); return }
    if (!previewOpen) {
      /* the shelf lives on the canvas — bring it back first, then open (the aside's 0.42 s) */
      setPreviewOpen(true)
      window.setTimeout(() => openSurface('sites'), 460)
      return
    }
    if (surface !== 'preview') {
      /* a window is up: it leaves first, the site comes forward, and the shelf takes it */
      closeSurface()
      window.setTimeout(() => openSurface('sites'), 420)
      return
    }
    openSurface('sites')
  }

  return (
    <button
      type="button"
      data-site-switch
      aria-expanded={open}
      aria-label={t({ en: `${name} — switch site`, uk: `${name} — перемкнути сайт` })}
      onClick={toggle}
      className="press-bloom -ml-1.5 flex h-9 min-w-0 items-center gap-0.5 rounded-[10px] pl-1.5 pr-1 text-left transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
    >
      <span data-site-name className="arrive-word max-w-[220px] truncate font-display text-[20px] font-semibold leading-[1.2] text-white">
        {name}
      </span>
      <span
        data-site-chevron
        className="grid h-6 w-6 flex-none place-items-center text-[var(--white-400)]"
        style={{ transform: open ? 'scaleY(-1)' : undefined, transition: 'transform .2s var(--ease-std)' }}
        aria-hidden
      >
        <IconChevronDown size={16} />
      </span>
    </button>
  )
}
