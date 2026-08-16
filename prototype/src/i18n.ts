/**
 * Localisation.
 *
 * The product ships to the US market: **English is the default**, Ukrainian is the second
 * language. Russian appears nowhere in the product — it is only the language Roman and I
 * talk in.
 *
 * Strings are written as `{ en, uk }` pairs inline at the point of use rather than through
 * a key registry. For a prototype that is the more maintainable choice: both languages sit
 * side by side, so a translation can never silently go missing behind a key that still
 * resolves to something stale.
 */
import { useWorld } from './state/world'

export type Lang = 'en' | 'uk'

export interface Text {
  en: string
  uk: string
}

/** Resolve a bilingual string. Falls back to English if a translation is missing. */
export function t(text: Text | string, lang: Lang): string {
  if (typeof text === 'string') return text
  return text[lang] || text.en
}

/** Hook form — reads the current language from the world store. */
export function useT() {
  const lang = useWorld((s) => s.world.lang)
  return {
    lang,
    t: (text: Text | string) => t(text, lang),
  }
}

export const LANGUAGES: { value: Lang; label: string; note: string }[] = [
  { value: 'en', label: 'English', note: 'Default — the US market' },
  { value: 'uk', label: 'Українська', note: 'Second language' },
]
