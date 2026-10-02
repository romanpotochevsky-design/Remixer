/**
 * THE BOARD'S THREAD, STAGED — the scenario console's «Versions — the board's thread» (state/
 * scenarios.ts). Board 31422:42642 draws one conversation: a text edit · «Can you update the main
 * navigation menu?» · Navigation Update · three image replacements folded into a stack · «Please
 * add a testimonials section» · Testimonials Section Added, current. This builds exactly that, on
 * the demo site, by running the SAME functions the live flow runs (`applyChange`, `diffEdits`) —
 * so every card's details and every snapshot are real: the eye on any of them shows that site,
 * and a restore goes back to it. A staged history typed out by hand would drift from the product
 * on its first change of copy.
 */
import { EMPTY_SITE_AI, EMPTY_SITE_EDITS, type Message, type PhotoRef, type SiteAi, type SiteEdits, type Version } from '@/state/world'
import { matchPrompt } from '@/modules/chat/thread'
import { applyChange } from './changes'
import { diffEdits } from './model'

const MIN = 60_000

export function boardHistory(now = Date.now()) {
  let ai: SiteAi = EMPTY_SITE_AI
  let edits: SiteEdits = EMPTY_SITE_EDITS
  const versions: Version[] = []
  const sent: Message[] = []
  let id = 1000
  const msg = (m: Omit<Message, 'id'>) => sent.push({ ...m, id: ++id } as Message)
  const card = (v: Version) => { versions.push(v); msg({ who: 'ai', kind: 'version', version: v.n, text: '' }) }
  const at = (minsAgo: number) => now - minsAgo * MIN

  msg({ who: 'user', text: 'Build me a clean site for my meal-prep service — exact macros, weekly menus, delivery in Odesa.' })
  card({
    n: 1, kind: 'build', at: at(48), cost: 10, ai, edits,
    title: { en: 'First Version', uk: 'Перша версія' },
    changes: [
      { kind: 'add', text: { en: 'Home — hero, this week’s menu and the footer', uk: 'Головна — хіро, меню тижня і футер' } },
      { kind: 'add', text: { en: 'Named for later: About, Services, Contact', uk: 'Названо на потім: About, Services, Contact' } },
      { kind: 'style', text: { en: 'Palette', uk: 'Палітра' }, after: 'Ink on ivory', swatch: ['#1b1a17', '#faf8f4'] },
    ],
  })
  msg({ who: 'ai', text: { en: 'Done — five pages with a hero, menu grid and order form. Want me to tune the palette next?', uk: 'Готово — п’ять сторінок: хіро, сітка меню та форма замовлення. Далі підлаштувати палітру?' } })

  /* the board's first card: the customer's own text edit */
  const e1: SiteEdits = { ...edits, text: { ...edits.text, 'home.hero.title': 'Chef-made meals, exact macros, zero effort' } }
  card({ n: 2, kind: 'edit', at: at(31), cost: 0, ai, edits: e1, title: { en: 'Text Edit', uk: 'Редагування тексту' }, changes: diffEdits(edits, e1, ai) })
  edits = e1

  /* «Can you update the main navigation menu?» → Navigation Update */
  const navPrompt = 'Can you update the main navigation menu?'
  msg({ who: 'user', text: navPrompt })
  const nav = applyChange('nav', ai, edits, navPrompt)
  card({ n: 3, kind: 'ai', at: at(24), cost: 10, ai: nav.ai, edits: nav.edits, title: nav.title, changes: nav.changes })
  ai = nav.ai; edits = nav.edits
  msg({ who: 'ai', text: matchPrompt(navPrompt).text })

  /* three image replacements in a row — the stack */
  const swaps: [string, PhotoRef][] = [
    ['meal.power-bowl.photo', { kind: 'site', id: 'protein-pancakes' }],
    ['meal.greek-wrap.photo', { kind: 'site', id: 'svc-custom-macros' }],
    ['about.photo', { kind: 'site', id: 'svc-weekly-plan' }],
  ]
  swaps.forEach(([k, ref], i) => {
    const next: SiteEdits = { ...edits, photo: { ...edits.photo, [k]: ref } }
    card({ n: 4 + i, kind: 'edit', at: at(19 - i * 3), cost: 0, ai, edits: next, title: { en: 'Image Replacement', uk: 'Заміна фото' }, changes: diffEdits(edits, next, ai) })
    edits = next
  })

  /* «Please add a testimonials section» → current */
  const tPrompt = 'Please add a testimonials section'
  msg({ who: 'user', text: tPrompt })
  const tes = applyChange('testimonials', ai, edits, tPrompt)
  card({ n: 7, kind: 'ai', at: at(4), cost: 10, ai: tes.ai, edits: tes.edits, title: tes.title, changes: tes.changes })
  ai = tes.ai; edits = tes.edits
  msg({ who: 'ai', text: matchPrompt(tPrompt).text })

  return { sent, versions, siteAi: ai, siteEdits: edits }
}
