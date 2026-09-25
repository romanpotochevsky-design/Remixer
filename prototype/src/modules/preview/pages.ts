/**
 * THE SITE'S PAGES, AS ROUTES — the model under the page switcher (PageSwitcher.tsx) and under
 * the preview's own navigation (SitePreview.tsx).
 *
 * The list is NOT its own data: it is `buildOutline`, the one outline the Build Plan, the
 * generation card and the Autopilot proposals all read (modules/chat/build.ts). Rename a page
 * in the plan and the switcher lists the new name; add one and it appears here. A second list
 * would drift from the plan on the first edit — the same rule that keeps the plan, the card and
 * the proposals on one structure.
 *
 * Paths are derived, Lovable-style: the first page is `/`, every other page is `/` + a slug of
 * its English name (`About` → `/about`, `Item page` → `/item-page`). Since the menu's own board
 * (Figma 31076:31629, 25.09.2026) the switcher's rows and its pill PRINT these routes — the board
 * lists `/`, `/blog`, `/about`…, which replaced the names (Home, About…) the rows showed that
 * morning. The names still drive everything else: the route is derived from the page's name, so
 * rename a page in the plan and its route follows, and the filter still finds a page by its name
 * (`con` finds `/contact`).
 */
import { buildOutline } from '@/modules/chat/build'
import type { BriefAnswers } from '@/modules/chat/brief'
import type { OutlineEdits } from '@/state/world'
import type { Text } from '@/i18n'

export interface SitePage {
  id: string
  name: Text
  /** `/` for the first page, `/slug` for the rest. */
  path: string
  /** Position in the outline — the first page is the one this pass built. */
  index: number
}

/** `About` → `about`, `Item page` → `item-page`, anything empty → `page`. */
export const slugOf = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'page'

/**
 * What the customer typed into "enter path", as a route: a leading slash, one, lower-case,
 * spaces to hyphens, no trailing slash but on the root. `Go to promo` and `Go to /promo` land
 * on the same page — Lovable prints the text as typed and normalises on navigation; we print it
 * normalised, so the row says exactly where it goes.
 */
export function normalizePath(raw: string): string {
  const t = raw.trim().toLowerCase().replace(/\s+/g, '-').replace(/^\/+/, '').replace(/\/+$/, '')
  return t ? `/${t}` : '/'
}

export function sitePages(answers: BriefAnswers, outline?: OutlineEdits): SitePage[] {
  return buildOutline(answers, outline).map((p, i) => ({
    id: p.id,
    name: p.name,
    path: i === 0 ? '/' : `/${slugOf(p.name.en)}`,
    index: i,
  }))
}

export const findPage = (pages: SitePage[], path: string) => pages.find((p) => p.path === normalizePath(path))

/**
 * The switcher's filter: a page matches when its name (either language) or its path contains
 * the query, case-insensitively, with a leading slash on the query ignored — `con`, `Con` and
 * `/con` all find Contact. No matches at all is what turns the list into a single "Go to …" row.
 */
export function matchPages(pages: SitePage[], query: string): SitePage[] {
  const q = query.trim().toLowerCase().replace(/^\/+/, '')
  if (!q) return pages
  return pages.filter((p) =>
    p.name.en.toLowerCase().includes(q) || p.name.uk.toLowerCase().includes(q) || p.path.slice(1).includes(q))
}
