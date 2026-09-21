/**
 * THE PLAN'S PROSE, EDITABLE IN PLACE — one component, two homes.
 *
 * It renders inside the simplified card's 320 window (PlanCard.tsx) and inside the
 * full-screen sheet that the card's chevron opens (PlanFullscreen.tsx). ONE component and
 * not two copies, for the same reason the card and the full-size document have always
 * compiled from one `buildPlan`: a copy diverges on the first edit, and then the small
 * window promises something the big one does not say.
 *
 * Every line writes the SAME paths as the canvas-sized document (`title`, `goal`, `s{i}:h`,
 * `s{i}:b`, `s{i}:{j}`, `s{i}:after`), so `world.planEdits` is one layer over the compiled
 * plan no matter which window somebody typed in.
 *
 * Geometry is the board's (30596:27084): pl 16 / pr 24 / py 18, 16 between blocks, 10 inside
 * each, a 15 MEDIUM white line over 14 REGULAR at 64% white, both at leading 1.4.
 *
 * ⚠️ `.plan-edit` bleeds its hover surface 8px either side (margin −8 / padding 8), which is
 * exactly why the ink still lands on the board's 16: the box grows outwards and the text is
 * pushed back in by its own padding. Nothing here compensates for it, and nothing should.
 */
import { useWorld } from '@/state/world'
import { useT, type Text } from '@/i18n'
import type { Plan } from './plan'
import { PlanEditable, focusPlanBlock } from './PlanEditable'
import { editPlanItems, editPlanText } from './send'

export function PlanDocument({ plan }: { plan: Plan }) {
  const { t } = useT()
  const edits = useWorld((s) => s.world.planEdits)
  /** What this line says now: the customer's words if they wrote any, else the compiled ones. */
  const read = (path: string, fallback: string) => edits.text[path] ?? fallback

  return (
    <div className="flex flex-col gap-4 py-[18px] pl-4 pr-6">
      <div className="flex flex-col gap-2.5">
        <PlanEditable
          path="title"
          value={read('title', t(plan.title))}
          onCommit={(v) => editPlanText('title', v, t(plan.title))}
          label={t({ en: 'Plan title', uk: 'Заголовок плану' })}
          className="text-[15px] font-medium leading-[1.4] text-white"
        />
        <PlanEditable
          path="goal"
          value={read('goal', t(plan.goal))}
          onCommit={(v) => editPlanText('goal', v, t(plan.goal))}
          label={t({ en: 'The goal, in a paragraph', uk: 'Мета, одним абзацом' })}
          className="text-[14px] leading-[1.4] text-[#ffffffa3]"
        />
      </div>

      {plan.sections.map((section, i) => {
        const items = edits.items[i] ?? (section.items ?? []).map((x) => t(x))
        const setItems = (next: string[]) => editPlanItems(i, next)
        /* Hoisted: TypeScript narrows `section.body` for the JSX guard but not inside the
           callback under it, which closes over the section rather than the guard. */
        const body = section.body ? t(section.body) : null
        const after: Text | null = section.after ?? null
        return (
          <div key={section.heading.en} className="flex flex-col gap-2.5">
            <PlanEditable
              path={`s${i}:h`}
              value={read(`s${i}:h`, t(section.heading))}
              onCommit={(v) => editPlanText(`s${i}:h`, v, t(section.heading))}
              label={t({ en: 'Section heading', uk: 'Заголовок розділу' })}
              className="text-[15px] font-medium leading-[1.4] text-white"
            />
            {body !== null && (
              <PlanEditable
                path={`s${i}:b`}
                value={read(`s${i}:b`, body)}
                onCommit={(v) => editPlanText(`s${i}:b`, v, body)}
                label={t({ en: 'Section text', uk: 'Текст розділу' })}
                className="text-[14px] leading-[1.4] text-[#ffffffa3]"
              />
            )}
            {items.length > 0 && (
              /* the board sets a section's lines as ONE text block: consecutive
                 leading-1.4 lines, no bullets, sharing the block's 10px gap */
              <div className="text-[14px] leading-[1.4] text-[#ffffffa3]">
                {items.map((item, j) => (
                  <PlanEditable
                    key={`${i}:${j}`}
                    path={`s${i}:${j}`}
                    value={item}
                    label={t({ en: 'Plan item', uk: 'Пункт плану' })}
                    onCommit={(v) => { if (v !== item) setItems(items.map((x, k) => (k === j ? v : x))) }}
                    onEnter={(v) => {
                      const next = items.map((x, k) => (k === j ? v : x))
                      next.splice(j + 1, 0, '')
                      setItems(next)
                      focusPlanBlock(`s${i}:${j + 1}`)
                    }}
                    onEmptyBackspace={() => {
                      if (items.length === 1) return
                      setItems(items.filter((_, k) => k !== j))
                      if (j > 0) focusPlanBlock(`s${i}:${j - 1}`)
                    }}
                  />
                ))}
              </div>
            )}
            {after && (
              <PlanEditable
                path={`s${i}:after`}
                value={read(`s${i}:after`, t(after))}
                onCommit={(v) => editPlanText(`s${i}:after`, v, t(after))}
                label={t({ en: 'Section text', uk: 'Текст розділу' })}
                className="text-[14px] leading-[1.4] text-[#ffffffa3]"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
