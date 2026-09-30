/**
 * THE EDITING SESSION — what the Visual Editor holds while it is open, and nothing the world
 * needs to remember.
 *
 * Two stores share the feature on purpose (the rule of state/ui.ts, «the world is product truth,
 * this store is where the camera points»):
 *  · `World.siteEdits` is the SAVED layer — the customer's words and pictures, per site, stashed
 *    and restored with the site, cleared by `startBuild`. The only writer is `save()` below.
 *  · this store is the SESSION — which tool is on, what is selected, the STAGED draft, its undo
 *    history. It dies with the page, which is what «unsaved» means; the console cannot stage it
 *    (nor should it stage «somebody is mid-edit»).
 *
 * THE MODEL IS LOVABLE'S, WITH THE HISTORY THE DESIGNER ASKED FOR (30.09.2026: «мы хотим оставить
 * Undo/Redo функции и встроить их в ту панель где кнопка Save… кнопки очистить правки или Save
 * чтобы применить изменения все»): edits STAGE while the mode is on — the site shows them at once,
 * the bar counts them — and nothing reaches the world until Save. Save applies the whole batch as
 * ONE change: +1 to `unpublished` (one Save = one "unpublished change", as one AI turn is one),
 * credits untouched, no glow, no transcript line (designer: «согласен»). Clear drops the batch.
 * Undo / Redo walk the batch one step at a time. While the batch is dirty the mode cannot be left
 * except through Save or Clear — Lovable hides its other tools the same way once a change is
 * pending, and it is the only rule under which a customer never loses work without choosing to.
 *
 * ⚠️ THE ONLY FREE WRITE IN THE PRODUCT goes through `useWorld.getState().set(...)` with the
 * current preset — the `editPlanText` pattern (send.ts) — never through `sendMessage`, which
 * charges COST and lights the glow. The KB is explicit and the designer confirmed it (13.09.2026):
 * «manual edits, hosting, and publishing never use credits». It also has to work with a zero
 * balance, so nothing here reads `canUseAI`.
 *
 * ⚠️ THE SESSION HAS AN OWNER. `site` is the site the draft was made on; a world move that
 * changes the site, or takes the project away from `built`, or stages another situation from the
 * console, ends the session synchronously (the `subscribe` at the bottom) — a draft carried into
 * another site would put one customer's words on another's page.
 */
import { create } from 'zustand'
import { useWorld, EMPTY_SITE_EDITS, type PhotoRef, type SiteEdits } from '@/state/world'
import { countEdits, mergeEdits, sameEdits } from '@/modules/preview/content'
import { followThread, recordEdit } from '@/modules/versions/model'

/** The bar's two tools (board 31280:115372): `edit` changes text and photos, `select` gives the
 *  chat an element to talk about (designer, 30.09.2026: «это инструмент select — нажать на что-то
 *  и задать контекст чату»). */
export type Tool = 'edit' | 'select'

type Field = keyof SiteEdits
type Value = string | PhotoRef | 'fill' | 'fit' | number | undefined

/** One undoable move: what a key said before and after. `undefined` means "as saved". */
export interface Step {
  field: Field
  key: string
  before: Value
  after: Value
}

interface EditorStore {
  /** Which tool is on, or null: the mode is off. */
  tool: Tool | null
  /** The site this session belongs to (World.site at open). */
  site: string | null
  /** The staged layer over `World.siteEdits`, shown at once, saved on Save. */
  draft: SiteEdits
  past: Step[]
  future: Step[]
  /** The element under the editor's attention — a text host with the caret, or the photo whose
   *  Image panel is open. A content key from modules/preview/content.ts. */
  selected: string | null
  /** The photo whose Image panel is open (a photo key), or null. */
  panel: string | null
  /** The Select tool's pick: the element the composer's chip names, or null. */
  context: string | null

  open: (tool: Tool) => void
  toggle: (tool: Tool) => void
  close: () => void
  select: (key: string | null) => void
  openPanel: (key: string | null) => void
  setContext: (key: string | null) => void
  /** Stage one change. No-op when the value already reads so. */
  stage: (field: Field, key: string, after: Value) => void
  undo: () => void
  redo: () => void
  clear: () => void
  save: () => void
}

const fresh = { draft: EMPTY_SITE_EDITS, past: [] as Step[], future: [] as Step[], selected: null, panel: null }

const same = (a: Value, b: Value) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

function withValue(draft: SiteEdits, field: Field, key: string, v: Value): SiteEdits {
  const next = { ...draft, [field]: { ...(draft[field] as Record<string, unknown>) } } as SiteEdits
  const table = next[field] as Record<string, unknown>
  if (v === undefined) delete table[key]
  else table[key] = v
  return next
}

/** Is there unsaved work — what keeps the mode from being left (Save or Clear first). */
export const isDirty = (s: Pick<EditorStore, 'past'>) => s.past.length > 0
/** Is there a history at all — what keeps the bar's batch segment (Undo · Redo · Clear · Save) up:
 *  after undoing the only change the work is clean, but Redo must still be there to take it back. */
export const hasHistory = (s: Pick<EditorStore, 'past' | 'future'>) => s.past.length > 0 || s.future.length > 0
export const draftCount = (s: Pick<EditorStore, 'draft'>) => countEdits(s.draft)

export const useEditor = create<EditorStore>((set, get) => ({
  tool: null,
  site: null,
  ...fresh,
  context: null,

  open: (tool) => {
    const { world } = useWorld.getState()
    const cur = get()
    /* switching tools keeps a clean session's site; a dirty batch never changes tools (the bar
       hides the other tool while dirty, and a programmatic switch must not drop the work) */
    if (cur.tool && isDirty(cur) && tool !== cur.tool) return
    set({ tool, site: world.site, selected: null, panel: null })
  },
  toggle: (tool) => {
    const cur = get()
    if (cur.tool === tool) get().close()
    else get().open(tool)
  },
  /* leaving with a dirty batch is not a thing — Save or Clear first (see the header) */
  close: () => {
    if (isDirty(get())) return
    set({ tool: null, site: null, ...fresh })
  },
  select: (selected) => set({ selected }),
  openPanel: (panel) => set({ panel, ...(panel ? { selected: panel } : {}) }),
  setContext: (context) => set({ context }),

  stage: (field, key, after) => {
    const { draft, past } = get()
    const before = (draft[field] as Record<string, Value>)[key]
    if (same(before, after)) return
    set({ draft: withValue(draft, field, key, after), past: [...past, { field, key, before, after }], future: [] })
  },
  undo: () => {
    const { past, future, draft } = get()
    const step = past[past.length - 1]
    if (!step) return
    set({ draft: withValue(draft, step.field, step.key, step.before), past: past.slice(0, -1), future: [step, ...future], panel: null })
  },
  redo: () => {
    const { past, future, draft } = get()
    const step = future[0]
    if (!step) return
    set({ draft: withValue(draft, step.field, step.key, step.after), past: [...past, step], future: future.slice(1), panel: null })
  },
  clear: () => set({ ...fresh }),
  save: () => {
    const { draft } = get()
    const { world, set: setWorld, preset } = useWorld.getState()
    /* a chat change in flight lands on the site as it stood when it was posted — no Save under it */
    if (world.chat === 'working') return
    const next = mergeEdits(world.siteEdits, draft)
    if (!sameEdits(next, world.siteEdits)) {
      /* the one free write: the saved layer, the publish counter — and, since the version cards
         (30.09.2026, board 31422:42642), a FREE version with its card in the chat, so the edit can
         be gone back through. Still no credits, no glow, no reply (manual edits never use credits;
         designer 13.09 / 30.09.2026) */
      setWorld({ ...recordEdit(world, next), siteEdits: next, unpublished: world.unpublished + 1 }, preset)
      followThread()
    }
    set({ ...fresh })
  },
}))

/*
 * THE SESSION ENDS WITH ITS SITE. Synchronous on the world store, not an effect a frame later:
 * the render that shows the new site must already show it without the old draft. Selection is
 * dropped too — the keys are another site's.
 */
useWorld.subscribe((state, prev) => {
  const s = useEditor.getState()
  if (!s.tool) { if (s.context && (state.world.site !== prev.world.site)) useEditor.setState({ context: null }); return }
  const siteMoved = state.world.site !== s.site
  const noSite = state.world.site === prev.world.site && state.world.project !== 'built'
  const restaged = state.preset !== prev.preset && state.preset !== null
  if (siteMoved || noSite || restaged) useEditor.setState({ tool: null, site: null, ...fresh, context: null })
})
