/**
 * WHAT THE SELECT TOOL CALLS AN ELEMENT — and which element it means.
 *
 * Lovable's tool picks ANY element under the pointer — the deepest one, a word inside a heading,
 * the photo, the column that holds them — and names it by its HTML tag in a pill at the cursor
 * (`div`, `span`, `img`; designer 01.10.2026: «нам нужно сделать точно так же»). That is the
 * default here (`World.selectNames = 'tag'`). The other side of the A/B gives the same element a
 * word a customer knows (`Block`, `Heading`, `Photo`) — content keys first (`labelOf`), then the
 * tag's plain-English role.
 */
import type { SelectNames } from '@/state/world'
import { labelOf } from '@/modules/preview/content'

/** The element a pointer event means: the deepest one, except inside an icon — a `<path>` is a
 *  drawing instruction, not a thing on the page, so the pick is the `<svg>` that holds it. */
export function pickTarget(raw: EventTarget | null, host: Element): Element | null {
  let el = raw instanceof Element ? raw : null
  if (!el) return null
  const svg = el.closest('svg')
  if (svg) el = svg
  if (el === host || !host.contains(el)) return null
  if (el.closest('[data-ve-overlay]')) return null
  return el
}

const ROLE: Record<string, string> = {
  h1: 'Heading', h2: 'Heading', h3: 'Heading', h4: 'Heading', h5: 'Heading', h6: 'Heading',
  p: 'Text', span: 'Text', strong: 'Text', em: 'Text', b: 'Text', i: 'Text', small: 'Text', blockquote: 'Quote',
  a: 'Link', button: 'Button', img: 'Photo', svg: 'Icon', picture: 'Photo', video: 'Video',
  section: 'Section', header: 'Header', nav: 'Menu', footer: 'Footer', main: 'Page', article: 'Card', aside: 'Sidebar',
  ul: 'List', ol: 'List', li: 'List item', form: 'Form', input: 'Field', textarea: 'Field', label: 'Label',
  figure: 'Figure', figcaption: 'Caption', table: 'Table',
}

/** The pill's word for `el`. */
export function pickName(el: Element, mode: SelectNames): string {
  const tag = el.tagName.toLowerCase()
  if (mode === 'tag') return tag
  const own = el.getAttribute('data-pick')
  if (own) return labelOf(own)
  /* a photo slot is a box with the picture inside: the picture is the slot */
  const slot = tag === 'img' ? el.parentElement?.getAttribute('data-pick') : null
  if (slot) return labelOf(slot)
  return ROLE[tag] ?? 'Block'
}

let seq = 0
/** The pick's id in the session: its content key when it has one, else a fresh `el:N`. */
export const pickKey = (el: Element) => el.getAttribute('data-pick') ?? `el:${++seq}`
