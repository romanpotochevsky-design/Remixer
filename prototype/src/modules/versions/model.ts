/**
 * THE VERSION SYSTEM'S MODEL — what a version is, where the list comes from, and the three things
 * that make one: a chat edit (send.ts calls `beginChange` / `landChange`), a Save in the Visual
 * Editor (`recordEdit`, from modules/editor/session.ts) and a restore (`restoreVersion`).
 *
 * Designer, 30.09.2026, with board 31422:42642: «если ты попросил что-то изменить, как выглядит
 * сообщение в чате с этим изменением и версией, ну и кнопку вернуться на версию или посмотреть
 * старую какую-то версию… это так же работает и у lovable.dev». The research behind every rule here
 * is docs/features/versions/README.md; the three that shape the code:
 *
 *  · NOTHING IS EVER DELETED. Going back is a NEW version on top that copies the old one (Lovable's
 *    Versioning 2.0, v0's restore, git's revert). The versions after it stay in the chat and one
 *    press brings any of them back — which is what makes the button safe to press, and the reason
 *    the confirmation can say «nothing is deleted» and mean it.
 *  · THE CURRENT VERSION IS THE LAST ONE, and its snapshot is by construction what the site shows.
 *    Every writer below moves `siteAi` / `siteEdits` and appends the version in ONE `set`, so the
 *    two cannot disagree for a frame.
 *  · A VERSION IS A STATE OF THE SITE. A reply that changed nothing on the page leaves no card.
 */
import { useWorld, EMPTY_SITE_AI, EMPTY_SITE_EDITS, type Chat, type Message, type PhotoRef, type SiteAi, type SiteEdits, type Version, type VersionChange, type World } from '@/state/world'
import { useUI } from '@/state/ui'
import { useEditor } from '@/modules/editor/session'
import { baselineThread } from '@/modules/chat/thread'
import { compiledText, labelOf, SITE_PHOTO_DEFAULTS } from '@/modules/preview/content'
import type { Text } from '@/i18n'
import { applyChange, doingOf, restoreChanges } from './changes'

/* ------------------------------------------------------------ the list */

/** The page's load time — the scenario's own history is dated back from it, once. */
const LOAD = Date.now()

/**
 * THE SCENARIO'S OWN HISTORY — what a staged situation shows before anything is made live (the
 * rule `baselineThread` follows for the transcript). A built scenario has one version: the first
 * generation, dated 26 minutes ago, and — this is the invariant — its snapshot is whatever the site
 * shows NOW, so the current version never disagrees with the canvas even in a world staged by
 * hand (a link, a preset, a snapshot saved by an older build).
 */
export function baselineVersions(chat: Chat, project: World['project'], ai: SiteAi, edits: SiteEdits): Version[] {
  /* no site, no version — and a site being generated has none until its first page lands
     (`firstVersion`, called by the build's finish) */
  if (project !== 'built' || chat === 'empty' || chat === 'short') return []
  return [{
    n: 1,
    kind: 'build',
    title: FIRST_TITLE,
    at: LOAD - 26 * 60_000,
    cost: 10,
    changes: FIRST_CHANGES,
    ai,
    edits,
  }]
}

const FIRST_TITLE: Text = { en: 'First Version', uk: 'Перша версія' }
const FIRST_CHANGES: VersionChange[] = [
  { kind: 'add', text: { en: 'Home — hero, this week’s menu and the footer', uk: 'Головна — хіро, меню тижня і футер' } },
  { kind: 'add', text: { en: 'About, Services and Contact pages', uk: 'Сторінки About, Services і Contact' } },
  { kind: 'style', text: { en: 'Palette', uk: 'Палітра' }, after: 'Garden green on warm white', swatch: ['#2e7d4f', '#fbfaf7'] },
]

type VersionWorld = Pick<World, 'versions' | 'chat' | 'project' | 'siteAi' | 'siteEdits'>

/** The site's versions as the chat shows them — the live list, or the scenario's own. */
export function versionsOf(w: VersionWorld): Version[] {
  return w.versions.length ? w.versions : baselineVersions(w.chat, w.project, w.siteAi, w.siteEdits)
}

/**
 * The version the site is on — the last one that has LANDED. A change Remixer is still making is
 * posted already, but the site has not moved yet: the green mark stays where it is until the change
 * lands, and then moves in the same frame the site does.
 */
export function currentOf(w: VersionWorld): Version | undefined {
  const list = versionsOf(w)
  for (let i = list.length - 1; i >= 0; i--) if (!list[i].pending) return list[i]
  return undefined
}

/** A version by its number. */
export function versionAt(w: VersionWorld, n: number): Version | undefined {
  return versionsOf(w).find((v) => v.n === n)
}

/* ------------------------------------------------------------ ids */

/** The next message id, past everything in the transcript (send.ts `nextId`'s rule, for the same bug). */
function nextMessageId(over: Message[]): number {
  let max = 1000
  for (const m of over) if (m.id > max) max = m.id
  return max + 1
}

/** The transcript as it stands, frozen out of the scenario if nothing has been sent yet. */
const transcript = (w: World): Message[] => (w.sent.length ? w.sent : baselineThread(w.chat))

/* ------------------------------------------------------------ a chat edit */

/**
 * Remixer starts making a change: the version card is posted at once, in its «working» form (the
 * card IS the progress — the board's hidden «Message + Loader» layer, 31422:43032, and Lovable's
 * «-ing» title while it writes). Nothing on the site moves yet. Returns the patch for send.ts to
 * write together with its own axes, so the whole move is one `set`.
 */
export function beginChange(w: World, key: string, prompt: string, reply?: Text): { sent: Message[]; versions: Version[] } {
  const list = versionsOf(w)
  const n = (list[list.length - 1]?.n ?? 0) + 1
  const sent = transcript(w)
  const cur = list[list.length - 1]
  const v: Version = {
    n,
    kind: 'ai',
    title: doingOf(key),
    doing: doingOf(key),
    at: Date.now(),
    cost: 10,
    changes: [],
    ai: cur?.ai ?? w.siteAi,
    edits: cur?.edits ?? w.siteEdits,
    pending: { key, prompt, ...(reply ? { reply } : null) },
  }
  const card: Message = { id: nextMessageId(sent), who: 'ai', kind: 'version', version: n, text: '' }
  return { sent: [...sent, card], versions: [...list, v] }
}

/**
 * …and it lands: the change is applied to the site's layers, the card settles into its past-tense
 * title with the current mark, and the reply the chat prints under it is handed back.
 */
export function landChange(w: World): { patch: Pick<World, 'versions' | 'siteAi' | 'siteEdits'>; reply?: Text } | null {
  const list = versionsOf(w)
  const last = list[list.length - 1]
  if (!last?.pending) return null
  const prev = list[list.length - 2]
  const base = { ai: prev?.ai ?? w.siteAi, edits: prev?.edits ?? w.siteEdits }
  const r = applyChange(last.pending.key, base.ai, base.edits, last.pending.prompt)
  const reply = r.reply ?? last.pending.reply
  const done: Version = { n: last.n, kind: 'ai', title: r.title, at: Date.now(), cost: last.cost, changes: r.changes, ai: r.ai, edits: r.edits }
  return { patch: { versions: [...list.slice(0, -1), done], siteAi: r.ai, siteEdits: r.edits }, reply }
}

/* ------------------------------------------------------------ the first generation */

/**
 * The first page has landed — version 1, the card between the outline and the «done» line. Its
 * details list what was actually built: the home page's sections by the names the plan gave them,
 * and the pages still waiting (they are named, not built — the outline card says the same).
 */
export function firstVersion(w: World, home: string[], rest: string[]): Pick<World, 'sent' | 'versions'> {
  const changes: VersionChange[] = [
    { kind: 'add', text: { en: `Home — ${home.join(', ')}`, uk: `Головна — ${home.join(', ')}` } },
    ...(rest.length ? [{ kind: 'add' as const, text: { en: `Named for later: ${rest.join(', ')}`, uk: `Названо на потім: ${rest.join(', ')}` } }] : []),
  ]
  const v: Version = { n: 1, kind: 'build', title: FIRST_TITLE, at: Date.now(), cost: 10, changes, ai: w.siteAi, edits: w.siteEdits }
  const card: Message = { id: nextMessageId(w.sent), who: 'ai', kind: 'version', version: 1, text: '' }
  return { sent: [...w.sent, card], versions: [v] }
}

/* ------------------------------------------------------------ the customer's own edit */

const samePhoto = (a?: PhotoRef, b?: PhotoRef) => !!a && !!b && a.kind === b.kind && a.id === b.id
const PHOTO_LABEL: Record<string, string> = { fill: 'Fill', fit: 'Fit' }

/** What a Save changed, line by line — the customer's words before and after, the pictures swapped. */
export function diffEdits(before: SiteEdits, after: SiteEdits, ai: SiteAi): VersionChange[] {
  const out: VersionChange[] = []
  const keys = new Set([...Object.keys(before.text), ...Object.keys(after.text)])
  for (const k of keys) {
    const was = before.text[k] ?? ai.text[k] ?? compiledText(k) ?? ''
    const now = after.text[k] ?? ai.text[k] ?? compiledText(k) ?? ''
    if (was !== now) out.push({ kind: 'edit', text: labelOf(k), before: was, after: now })
  }
  const photos = new Set([...Object.keys(before.photo), ...Object.keys(after.photo)])
  for (const k of photos) {
    const was = before.photo[k] ?? SITE_PHOTO_DEFAULTS[k]
    const now = after.photo[k] ?? SITE_PHOTO_DEFAULTS[k]
    if (was && now && !samePhoto(was, now)) out.push({ kind: 'photo', text: { en: 'Photo replaced', uk: 'Фото замінено' }, photo: [was, now] })
  }
  const fits = new Set([...Object.keys(before.fit), ...Object.keys(after.fit)])
  for (const k of fits) {
    const was = before.fit[k] ?? 'fill', now = after.fit[k] ?? 'fill'
    if (was !== now) out.push({ kind: 'style', text: { en: 'Photo fit', uk: 'Вписування фото' }, before: PHOTO_LABEL[was], after: PHOTO_LABEL[now] })
  }
  const ops = new Set([...Object.keys(before.opacity), ...Object.keys(after.opacity)])
  for (const k of ops) {
    const was = before.opacity[k] ?? 100, now = after.opacity[k] ?? 100
    if (was !== now) out.push({ kind: 'style', text: { en: 'Photo opacity', uk: 'Прозорість фото' }, before: `${was}%`, after: `${now}%` })
  }
  const hs = new Set([...Object.keys(before.height), ...Object.keys(after.height)])
  for (const k of hs) {
    const was = before.height[k], now = after.height[k]
    if (was !== now) out.push({ kind: 'style', text: { en: 'Photo height', uk: 'Висота фото' }, before: was ? `${was} px` : 'Auto', after: now ? `${now} px` : 'Auto' })
  }
  return out
}

/** The title a free edit's card wears — the board's two («Text edit», «Image Replacement») and their mix. */
function editTitle(changes: VersionChange[]): Text {
  const text = changes.some((c) => c.kind === 'edit')
  const photo = changes.some((c) => c.kind === 'photo')
  const style = changes.some((c) => c.kind === 'style')
  if (text && (photo || style)) return { en: 'Text & Image Edit', uk: 'Текст і фото' }
  if (photo) return { en: 'Image Replacement', uk: 'Заміна фото' }
  if (style) return { en: 'Image Adjusted', uk: 'Фото налаштовано' }
  return { en: 'Text Edit', uk: 'Редагування тексту' }
}

/**
 * A Save in the Visual Editor — a FREE version (the T in a frame on its card, no reply under it:
 * nothing was asked of Remixer, so Remixer says nothing). Returns the patch for the editor's own
 * `set`, so the saved layer, the counter, the card and the version land together.
 *
 * ⚠️ This replaces the 30.09.2026 rule «Save leaves no line in the transcript» — the designer's
 * board draws a card for exactly this (31422:42697, «Text edit»), and a history that forgot the
 * customer's own edits could not be gone back through. Still no credits, no glow, no reply.
 */
export function recordEdit(w: World, next: SiteEdits): Pick<World, 'sent' | 'versions'> {
  const list = versionsOf(w)
  const n = (list[list.length - 1]?.n ?? 0) + 1
  const changes = diffEdits(w.siteEdits, next, w.siteAi)
  const v: Version = { n, kind: 'edit', title: editTitle(changes), at: Date.now(), cost: 0, changes, ai: w.siteAi, edits: next }
  const sent = transcript(w)
  const card: Message = { id: nextMessageId(sent), who: 'ai', kind: 'version', version: n, text: '' }
  return { sent: [...sent, card], versions: [...list, v] }
}

/* ------------------------------------------------------------ going back */

/**
 * Restore a version: a new version on top that copies it. Free, like every manual act («manual
 * edits, hosting, and publishing never use credits»); it moves the unpublished counter because the
 * site now differs from what visitors see; it lights the preview's glow for the reload the site
 * would really do. The live site does not change until Publish — the confirmation says so.
 */
export function restoreVersion(n: number) {
  const { world: w, set, preset } = useWorld.getState()
  if (w.chat === 'working') return
  const list = versionsOf(w)
  const target = list.find((v) => v.n === n)
  const cur = list[list.length - 1]
  if (!target || !cur || target.n === cur.n) return
  const v: Version = {
    n: cur.n + 1,
    kind: 'restore',
    title: { en: `Restored “${target.title.en}”`, uk: `Відновлено «${target.title.uk}»` },
    at: Date.now(),
    cost: 0,
    from: target.n,
    changes: restoreChanges({ ai: cur.ai, edits: cur.edits }, { ai: target.ai, edits: target.edits }),
    ai: target.ai,
    edits: target.edits,
  }
  const sent = transcript(w)
  const card: Message = { id: nextMessageId(sent), who: 'ai', kind: 'version', version: v.n, text: '' }
  useUI.getState().setVersionPreview(null)
  set({ sent: [...sent, card], versions: [...list, v], siteAi: target.ai, siteEdits: target.edits, unpublished: w.unpublished + 1 }, preset)
  useUI.getState().triggerReload(1600)
  followThread()
}

/**
 * Bring the thread to its end — a card posted by a press elsewhere (a restore from an old card
 * scrolled far up, a Save on the canvas) lands at the bottom, and the customer should see it land.
 * ChatPanel listens; this module does not reach into its scroller.
 */
export function followThread() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('remixer:thread-end'))
}

/* ------------------------------------------------------------ gates */

/**
 * Why a version's buttons cannot act right now, or null when they can. Two reasons, both a moment
 * the site is in someone else's hands: Remixer is working on it, or the customer has an unsaved
 * batch in the Visual Editor (leaving it is Save or Clear, the editor's own rule).
 */
export function versionBlock(w: Pick<World, 'chat'>): Text | null {
  if (w.chat === 'working') return { en: 'Wait until Remixer finishes', uk: 'Зачекайте, поки Remixer закінчить' }
  const ed = useEditor.getState()
  if (ed.tool && ed.past.length > 0) return { en: 'Save or clear your edits first', uk: 'Спершу збережіть або скасуйте правки' }
  return null
}

/** Before previewing or restoring, a clean editor session steps aside (a dirty one blocks, above). */
export function closeCleanEditor() {
  const ed = useEditor.getState()
  if (ed.tool && ed.past.length === 0) ed.close()
}

/* ------------------------------------------------------------ words */

/** «2:14 PM» — the time a card prints. */
export function timeOf(at: number, lang: 'en' | 'uk'): string {
  return new Date(at).toLocaleTimeString(lang === 'uk' ? 'uk-UA' : 'en-US', { hour: 'numeric', minute: '2-digit' })
}

export { EMPTY_SITE_AI, EMPTY_SITE_EDITS }
