/**
 * THE CHIP — the Liquid Glass canon's `--chip` member, one component in every home
 * (CLAUDE.md: «ОДИН компонент на два дома», now three):
 *
 *   · `Recommended` on a brief row and `Remixer's pick` on a plan decision card — the
 *     neutral chip: 8% white wash, the house diagonal rim, 72%-white label;
 *   · the domain's status in the Publish panel's domain row — the SAME chip with its
 *     glass DYED in the status tone (designer, 16.09.2026: «я хочу чтобы стекла были в
 *     цвет статуса … и текст … тоже должен быть оттенков статуса»): fill, rim and ink
 *     all in one colour, the rim keeping the canon's diagonal so it is still the same
 *     glass, only coloured. The dyeing is `data-tone` + CSS (`.liquid-glass--chip[data-tone]`
 *     in index.css); the component adds nothing but the attribute.
 *
 * It used to live in BriefPanel.tsx and moved here when the third home arrived: a chip
 * imported from the brief into the Publish panel would have made the panel depend on a
 * question sheet for a pill.
 */
import { useT, type Text } from '@/i18n'

/** The status tones a chip can wear — the Publish panel's own four (see DOMAIN_STATUS). */
export type ChipTone = 'working' | 'stuck' | 'ready' | 'live'

export function Chip({ label, tone }: { label: Text; tone?: ChipTone }) {
  const { t } = useT()
  return (
    <span
      data-tone={tone}
      className={`liquid-glass liquid-glass--chip flex h-6 flex-none items-center whitespace-nowrap rounded-full px-2.5 text-[13px] font-medium leading-none${tone ? '' : ' text-[var(--white-720)]'}`}
    >
      {t(label)}
    </span>
  )
}
