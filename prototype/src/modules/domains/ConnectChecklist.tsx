/**
 * The canonical success checklist — ONE list, two homes.
 *
 * Three items in one fixed order, and the order is the information: the padlock cannot
 * be issued until the address already answers here (FACTS **DH-301**), so it is always
 * last. Defined in `docs/features/domains/STATES.md`, "Канонический чеклист".
 *
 * FOUR stages behind THREE items, and the fourth stage is the whole point. "Connected to
 * your site" and "Security (SSL) on" are two events with a wait between them; they used
 * to tick together, which deleted `securing` — the single state the checklist exists to
 * explain.
 *
 * It lives in its own file because the status screen and the Publish panel both show it
 * (the panel from 20.08.2026, on the designer's word: that slot in the panel is where he
 * watches the statuses tick as the domain connects). Same three strings, same stage
 * mapping, one place to change them — copy that ships twice drifts twice.
 * Only the ROWS are shared; each surface wraps them in its own card, because the panel
 * and the surface do not share a background.
 */
import { useT } from '@/i18n'
import type { DomainState } from '@/state/world'

/** 0 nothing yet · 1 records in · 2 address answers, padlock pending · 3 live. */
export function connectStage(domain: DomainState): 0 | 1 | 2 | 3 {
  if (domain === 'live' || domain === 'multiple') return 3
  if (domain === 'securing') return 2
  if (domain === 'verifying') return 1
  return 0
}

export function ConnectChecklist({ stage }: { stage: number }) {
  const { t } = useT()
  const items = [
    { label: { en: 'Domain settings updated', uk: 'Налаштування домену оновлено' }, done: stage >= 1 },
    { label: { en: 'Connected to your site', uk: 'Під’єднано до вашого сайту' }, done: stage >= 2 },
    { label: { en: 'Security (SSL) on', uk: 'Захист (SSL) увімкнено' }, done: stage >= 3 },
  ]
  return (
    <div className="space-y-2.5">
      {items.map((c) => (
        <div key={c.label.en} className="flex items-center gap-2.5 text-[14px]">
          <span
            className={`grid h-5 w-5 flex-none place-items-center rounded-full text-[11px] ${
              c.done ? 'bg-[#48ba7933] text-[var(--live)]' : 'border border-[var(--gray-700)] text-transparent'
            }`}
            aria-hidden
          >
            ✓
          </span>
          <span className={c.done ? 'text-[var(--white-700)]' : 'text-[var(--white-400)]'}>{t(c.label)}</span>
        </div>
      ))}
    </div>
  )
}
