/**
 * ─────────────────── ONE STATUS VOCABULARY FOR THE DOMAIN ───────────────────
 *
 * Two surfaces read the connected domain's state and must never disagree: the project
 * chip in the topbar (a 6px dot and a tooltip — `App.tsx`) and the domain row in the
 * Publish panel (a glass chip dyed in the same tone, with a word — `PublishPanel.tsx`).
 * Until 16.09.2026 the tone lived in `App.tsx` as a private table, and the row had no
 * word at all. Both now read from here, so a rule fixed in one place (the amber
 * withdrawal below, for one) reaches both by construction.
 *
 * The TONE is four-valued and shared; the WORD is finer, because the row can afford a
 * sentence fragment where the chip has only a dot: `Setting up` / `Ready` / `Waiting on
 * your email` / `Live` / `Not responding` / `Showing your old site`. Where a third
 * surface wants the same vocabulary (the domains window's row prints `Connecting` today
 * — open question to the designer), it should read `domainRowStatus` and not invent a
 * seventh word.
 */
import { registrantUnconfirmed, type World } from '@/state/world'
import type { Text } from '@/i18n'
import type { ChipTone } from '@/ui/Chip'

/** The four tones of the domain, by name. `ChipTone` is the same union — the chip is the
 *  thing that wears them. */
export type DomainTone = ChipTone

/**
 * WHAT THE DOT ON THE PROJECT CHIP MEANS — the Publish panel's own tones, verbatim
 * (`StatusCard`, modules/publish/PublishPanel.tsx), so the two never say different things
 * about the same domain: amber while something is running and there is nothing for the
 * customer to do, red when it is stuck and needs them, blue when nothing is wrong and
 * nothing is in flight and the next move is theirs, green once it is live — secured and
 * published, which is later than "the address answers" by exactly the padlock beat (D5).
 *
 * The chip is the one piece of chrome on screen for the whole set-up, so every state the
 * panel paints has to reach it. Keyed on `connecting` alone it went blank
 * through `registering` and `propagating` — together ~11 of the bought walk's 17 seconds
 * (modules/domains/connect.ts) — and the topbar read as if the flow had stopped.
 *
 * ⚠️ `ready` is BLUE and must never wear amber. Nothing is in progress there: the domain
 * is attached and correct, and the site is one press of Publish from being live. Painting
 * that like a spinner is precisely what makes a novice sit and wait for a product that is
 * already waiting for them (states.md's "не ошибку и не спиннер").
 */
export const DOMAIN_STATUS = {
  working: { dot: 'bg-[var(--attention)]', note: { en: 'Setting up your domain', uk: 'Домен налаштовується' } },
  stuck: { dot: 'bg-[var(--danger)]', note: { en: 'Needs your attention', uk: 'Потребує уваги' } },
  ready: { dot: 'bg-[var(--action)]', note: { en: 'Ready to publish', uk: 'Готово до публікації' } },
  live: { dot: 'bg-[var(--live)]', note: { en: 'Live', uk: 'Онлайн' } },
} as const

/**
 * ⚠️ IT TAKES THE WORLD, NOT THE AXIS, AND THAT IS THE WHOLE FIX (14.09.2026).
 *
 * Keyed on `world.domain` alone this could not see `world.icann`, so a live domain whose
 * registrant email was still unconfirmed came out `live` — a green dot and a "Live"
 * tooltip, directly above a Publish panel withholding its all-clear and an amber card
 * saying the address does not work yet. The chip was the loudest thing on the screen and
 * it was the thing that was wrong: on the developer's answer (see `domainIsHome`) the
 * name does not resolve at all until the mail is confirmed.
 *
 * So a confirmation outstanding withdraws the two tones that claim the domain is FINISHED
 * — green ("live") and blue ("nothing wrong, your move") — and leaves amber. One rule, not
 * a second opinion: the address beside the dot is `domainIsHome`'s decision and stays so.
 * ⚠️ And since 15.09.2026 that decision prints the customer's own domain while the letter
 * is still owed, which makes THIS the only thing left saying the name does not open yet.
 * Do not soften it to match the address: they are answering different questions. The walk cannot produce those
 * states any more either (modules/domains/connect.ts, THE GATE; `violations` calls the
 * rest impossible), so this is the belt to that braces: a hand-staged world, or a shared
 * `?d=live&k=true` link, still cannot show green.
 *
 * ⚠️ AND IT WITHDRAWS ONLY THOSE TWO — red survives it. Written as a leading `return
 * 'working'` this quietly repainted `old-site` and `unreachable` amber, i.e. "in flight,
 * nothing for you to do", over a panel showing a red card that needs them. A domain that
 * is stuck AND owes a confirmation is still stuck; the mail is the smaller of its two
 * problems and the panel stacks both cards in that order anyway.
 */
export function domainStatus(w: World): DomainTone | null {
  const dot = ((): DomainTone | null => {
    switch (w.domain) {
      /* both walks: the registry, the world, our records, the padlock — in flight, and
         nothing the customer can do about any of them */
      case 'provisioning': case 'connecting': case 'propagating': return 'working'
      case 'ready': return 'ready'
      case 'old-site': case 'unreachable': return 'stuck'
      case 'live': case 'multiple': return 'live'
      /* staging · searching · checkout — the project still has only its free address, and
         there is no domain to report on yet */
      default: return null
    }
  })()
  if (registrantUnconfirmed(w) && (dot === 'live' || dot === 'ready')) return 'working'
  return dot
}

const WAITING: Text = { en: 'Waiting on your email', uk: 'Чекаємо на ваш лист' }

/**
 * THE ROW'S WORD — what stands in the Publish panel's domain row beside `Unlink`, as a
 * glass chip dyed in the status tone (designer, 16.09.2026, choosing form C of the stand
 * in `scratchpad/slot-stand/`: «мне нравится вариант C но я хочу чтобы стекло было
 * зеленым» → «я хочу чтобы стекла были в цвет статуса» → «и текст… тоже должен быть
 * оттенков статуса»).
 *
 * Why a status word and not the padlock or the renewal line that stood here before: the
 * panel says three different things on three surfaces — the TITLE is about the site
 * (has it ever gone out), the BAR is about the edits (is what is out current), and this
 * row is about the DOMAIN (does the address answer). Until the word came, nobody said the
 * middle one: a live site with three edits queued was titled `Publish`, its bar counted
 * the edits, and not one word in the panel said the domain works.
 *
 * The tone comes from `domainStatus`, the same function the topbar chip reads, so the
 * amber withdrawal for an unconfirmed registrant reaches the row too: `ready` with the
 * letter owed is not blue `Ready` — nothing is the customer's move except their inbox.
 * `propagating` with the letter owed stays `Setting up`: the address is still being set,
 * and the letter is the card's business, not the row's.
 *
 * Null wherever the row does not render (`domainIsHome` is false) — the caller hides the
 * row, not this function.
 */
/**
 * WHAT THE WORD MEANS — the tooltip on the row's chip (`ui/Tooltip.tsx`; designer,
 * 16.09.2026: «непонятно что значат эти статусы… что такое "Ready"?… короткий и лаконичный
 * понятный текст с описанием статусов»). One sentence, two at most, in the customer's own
 * vocabulary (no records, no servers, no certificates — glossary.md), and each one answers
 * the question a status word leaves open: what do I do now — or is there nothing to do.
 * Kept beside the words so a word cannot change without its meaning.
 */
const HINT: Record<'unreachable' | 'old-site' | 'live' | 'waiting' | 'ready' | 'setting-up', Text> = {
  unreachable: {
    en: 'The address isn’t answering right now. Your site is safe on its free address.',
    uk: 'Адреса зараз не відповідає. Ваш сайт цілий і працює за безкоштовною адресою.',
  },
  'old-site': {
    en: 'This address still opens your previous site. It has to come off before this one can go on.',
    uk: 'За цією адресою досі відкривається ваш попередній сайт. Його треба зняти, перш ніж стане цей.',
  },
  live: { en: 'Your site is up at this address.', uk: 'Ваш сайт відкривається за цією адресою.' },
  waiting: {
    en: 'The address starts working once you confirm the email we sent you.',
    uk: 'Адреса запрацює, щойно ви підтвердите лист, який ми надіслали.',
  },
  ready: {
    en: 'Connected and set up. Hit Publish to put your site on this address.',
    uk: 'Підключено й налаштовано. Натисніть Publish, щоб сайт відкривався за цією адресою.',
  },
  'setting-up': {
    en: 'We’re connecting the domain to your site. Nothing for you to do yet.',
    uk: 'Підключаємо домен до вашого сайту. Поки що від вас нічого не потрібно.',
  },
}

export function domainRowStatus(w: World): { tone: DomainTone; word: Text; hint: Text } | null {
  const tone = domainStatus(w)
  if (!tone) return null
  const [word, hint] = ((): [Text, Text] => {
    switch (w.domain) {
      case 'unreachable': return [{ en: 'Not responding', uk: 'Не відповідає' }, HINT.unreachable]
      case 'old-site': return [{ en: 'Showing your old site', uk: 'Показує старий сайт' }, HINT['old-site']]
      case 'live': case 'multiple':
        return registrantUnconfirmed(w) ? [WAITING, HINT.waiting] : [{ en: 'Live', uk: 'Онлайн' }, HINT.live]
      case 'ready':
        return registrantUnconfirmed(w) ? [WAITING, HINT.waiting] : [{ en: 'Ready', uk: 'Готово' }, HINT.ready]
      /* provisioning · connecting · propagating — the address is being set, on both walks */
      default: return [{ en: 'Setting up', uk: 'Налаштовується' }, HINT['setting-up']]
    }
  })()
  return { tone, word, hint }
}
