/**
 * AUTOPILOT — what Remixer proposes, and when.
 *
 * The mode switcher in the composer has offered `Autopilot` since 08.09.2026, but until now
 * the axis only flipped: nothing stood behind it. This is what stands behind it (designer,
 * 09.09.2026): "это режим когда чат сам присылает форму с выбором и рекомендацией что делать
 * дальше… это режим для пользователей которые вообще не шарят и им нужно постоянно
 * подсказывать и вести их".
 *
 * So Autopilot is not a different chat. It is the SAME question panel the brief docks above
 * the composer (Figma 29464:33917 / 34334), arriving on its own after a piece of work instead
 * of at the start of one — one question, two or three answers, each with the consequence line
 * the board draws under its title, and the recommendation already picked.
 *
 * THREE RULES HOLD THE WHOLE THING UP.
 *
 *  1. **A proposal is COMPILED, never stored.** Every option here is derived from the plan the
 *     customer already agreed to (`buildOutline`, the same function the generation card and the
 *     plan document read), from the pages Remixer has already been asked to start, and from
 *     whether the site is live. A hard-coded proposal would eventually offer a page that no
 *     plan promised — the exact failure the brief's own copy rules were written to avoid.
 *
 *  2. **It only comes after work that MOVED THE SITE.** An edit earns a proposal; a question
 *     does not. "How many credits do I have?" is answered and left alone — there is nothing to
 *     lead on from, and a panel there would read as a tic rather than as guidance. This is the
 *     designer's "почти после каждой задачи" made exact (09.09.2026).
 *
 *  3. **Nothing to propose means no panel.** When every page in the plan has been started and
 *     the site is live, Autopilot has run out of things to lead towards, and the panel simply
 *     does not come. Same house rule as the greyed-out `Publish` and the missing right-rail
 *     buttons: a control with nothing to do is better absent than idle.
 *
 * The panel that renders this is `SuggestPanel.tsx`; the axis is `world.suggest`.
 */
import type { Text } from '@/i18n'
import { BRIEF_QUESTIONS, optionById, type BriefAnswers } from './brief'
import { buildOutline } from './build'
import type { OutlineEdits } from '@/state/world'

/** What accepting an option does. */
export type SuggestAct =
  /** Post `say` into the chat as if the customer had typed it, and answer with `reply`. */
  | 'send'
  /** Open the Publish panel. The one option that is a surface, not a sentence. */
  | 'publish'

export interface SuggestOption {
  id: string
  /** The row's title. */
  name: Text
  /** The consequence line under it — what happens if this is picked (29464:34362). */
  detail: Text
  /**
   * What the blue button says once this option is picked.
   *
   * It names what will HAPPEN, which is the rule the plan card's `Start Building` came from
   * (09.09.2026): a generic "Next" on a panel that spends a build is a label that describes
   * the panel rather than the press. The page options therefore borrow that exact verb —
   * pressing them costs a build, the same as pressing it on the plan card does.
   */
  verb: Text
  act: SuggestAct
  /** The message posted as the customer's own, for `act: 'send'`. */
  say?: Text
  /** Remixer's answer to it. Written here so it can name the page the row named. */
  reply?: Text
  /** The page this option starts, remembered in `suggest.started` so it is offered once. */
  page?: string
}

export interface Proposal {
  question: Text
  options: SuggestOption[]
  /** Placeholder of the free-text row — the escape hatch, not a fourth option. */
  placeholder: Text
}

/* ------------------------------------------------------------------- the copy */

/**
 * What each page in the plan is FOR.
 *
 * Keyed by the English name `buildOutline` gives the page, because that outline is where the
 * names come from in the first place — the plan promised "About", so the proposal offers
 * "About". A page with no line of its own still gets offered, on the generic one: an
 * un-described option is a small loss, a missing option is a broken plan.
 */
const PAGE_DETAIL: Record<string, Text> = {
  About: {
    en: 'Your story and the people behind it, in the layout and lettering the home page already uses.',
    uk: 'Ваша історія і люди за нею — у тій самій верстці й шрифтах, що вже стоять на головній.',
  },
  Services: {
    en: 'What you offer, laid out to be scanned rather than read.',
    uk: 'Те, що ви пропонуєте, — у вигляді, який проглядають, а не вичитують.',
  },
  Contact: {
    en: 'A form and your details, wired to the same look as the rest of the site.',
    uk: 'Форма і ваші контакти, у вигляді решти сайту.',
  },
  Catalogue: {
    en: 'Every item in one grid, with filters that keep working as the list grows.',
    uk: 'Усі позиції в одній сітці, з фільтрами, які працюють і на довгому списку.',
  },
  'Item page': {
    en: 'The template every product uses — photographs, description, price and the way to buy.',
    uk: 'Шаблон для кожного товару — фото, опис, ціна і спосіб купити.',
  },
}

const PAGE_DETAIL_ANY: Text = {
  en: 'A new page in the same layout and lettering as the one that is live.',
  uk: 'Нова сторінка в тій самій верстці й шрифтах, що вже стоїть.',
}

/** The verb on the blue button for a page — the plan card's, because it costs the same. */
const START_BUILDING: Text = { en: 'Start Building', uk: 'Почати збірку' }

/**
 * Staying put — always the first option, and always the recommendation.
 *
 * It is first because the designer put it first (09.09.2026: "1 — Продолжить работу над
 * текущей страницей"), and being first makes it the one the panel arrives with picked. That
 * is the right recommendation on its own merits too: it is the only option that spends
 * nothing, and looking at what you just got before ordering more of it is what a competent
 * assistant would advise.
 */
const STAY: SuggestOption = {
  id: 'stay',
  name: { en: 'Keep working on this page', uk: 'Далі працювати над цією сторінкою' },
  detail: {
    en: 'We stay on the home page — wording, images, the order of the sections. Nothing new gets generated.',
    uk: 'Лишаємось на головній — тексти, зображення, порядок секцій. Нічого нового не генерується.',
  },
  verb: { en: 'Keep going', uk: 'Далі' },
  act: 'send',
  say: { en: 'Let us keep working on the home page.', uk: 'Попрацюймо ще над головною.' },
  reply: {
    en: 'Staying on the home page, then. Tell me what to change — a heading, a photograph, the order things come in — and I will change just that and leave the rest alone.',
    uk: 'Тоді лишаємось на головній. Скажіть, що змінити — заголовок, фото, порядок блоків — і я зміню саме це, не чіпаючи решти.',
  },
}

/**
 * Going live — the last thing Autopilot has to propose.
 *
 * The one option that opens a SURFACE instead of saying a sentence, and it is the honest end
 * of the ladder: once the pages are under way, the next real move is the one the whole
 * product is for. The copy says the two things a beginner does not know and would otherwise
 * hesitate over — that the address is free, and that publishing does not freeze anything.
 */
const PUBLISH: SuggestOption = {
  id: 'publish',
  name: { en: 'Put the site online', uk: 'Опублікувати сайт' },
  detail: {
    en: 'Publish to your free remixer.site address. Editing carries on afterwards — publishing is not a lock.',
    uk: 'Публікація на вашу безкоштовну адресу remixer.site. Редагувати можна й далі — публікація нічого не замикає.',
  },
  verb: { en: 'Publish', uk: 'Опублікувати' },
  act: 'publish',
}

/* -------------------------------------------------------------- the compiler */

/** The id an option carries for one page of the plan. */
export const pageOptionId = (name: string) => `page:${name}`

function pageOption(name: Text): SuggestOption {
  return {
    id: pageOptionId(name.en),
    page: name.en,
    name: { en: `Start the ${name.en} page`, uk: `Почати сторінку «${name.uk}»` },
    detail: PAGE_DETAIL[name.en] ?? PAGE_DETAIL_ANY,
    verb: START_BUILDING,
    act: 'send',
    say: { en: `Start the ${name.en} page.`, uk: `Почни сторінку «${name.uk}».` },
    reply: {
      en: `${name.en} is in — the same grid, palette and lettering as the home page, and linked from the nav so the site reads as one piece. Tell me what belongs on it and I will fill it in.`,
      uk: `Сторінка «${name.uk}» на місці — та сама сітка, палітра і шрифти, що на головній, і посилання в меню, щоб сайт читався цілим. Скажіть, що на ній має бути, і я наповню.`,
    },
  }
}

/**
 * What Remixer proposes right now — or nothing, if it has run out of things to lead towards.
 *
 * The ladder, in order: stay on the page that exists · start the next pages the plan promised,
 * newest first and never one already asked for · put it online. At most three options, the
 * designer's cap for a radio list (07.09.2026), with the free-text field as the escape hatch
 * that does not count as one of them.
 *
 * ⚠️ `STAY` alone is not a proposal. If every page has been started and the site is live,
 * the only row left would be "keep working on this page" — which is what the composer under
 * it already is. A panel that offers the thing you can do without it is worse than no panel,
 * so this returns null and nothing docks.
 */
export function nextProposal(answers: BriefAnswers, started: string[], published: boolean, outline?: OutlineEdits): Proposal | null {
  const waiting = buildOutline(answers, outline)
    .slice(1)
    .filter((p) => !started.includes(p.name.en))

  const options: SuggestOption[] = [STAY]
  for (const page of waiting) {
    if (options.length === 3) break
    options.push(pageOption(page.name))
  }
  if (options.length < 3 && !published) options.push(PUBLISH)

  if (options.length === 1) return null

  return {
    question: { en: 'What should I do next?', uk: 'Що робити далі?' },
    options,
    placeholder: { en: 'Something else — tell me…', uk: 'Щось інше — напишіть…' },
  }
}

/** The option a proposal arrives with picked — its recommendation. */
export const recommended = (p: Proposal) => p.options[0].id

export const optionOf = (p: Proposal, id: string) => p.options.find((o) => o.id === id)

/* ------------------------------------------------------------------- turning off */

/**
 * The line Remixer leaves when the customer turns Autopilot off from the panel's footer.
 *
 * It exists because the footer button is a mode switch, not a dismissal, and the person most
 * likely to press it is the one who meant "not this suggestion" — a beginner who would then
 * have lost their guide with no idea where it went. One sentence naming the control that
 * brings it back costs nothing and closes that trap without adding a second control.
 */
export const AUTOPILOT_OFF: Text = {
  en: 'Autopilot is off — I will do what you ask and stay out of the way. Turn it back on any time from the mode button below.',
  uk: 'Autopilot вимкнено — робитиму те, що просите, і не заважатиму. Увімкнути назад можна будь-коли кнопкою режиму нижче.',
}

/* ------------------------------------------------- the hand-over after the first build */

/** Small counts read as words; the ladder never gets past four pages in practice. */
const WORD_EN = ['no', 'one', 'two', 'three', 'four', 'five']
const WORD_UK = ['жодної', 'одна', 'дві', 'три', 'чотири', 'п’ять']
const PAGES_UK = ['сторінок', 'сторінка', 'сторінки', 'сторінки', 'сторінки', 'сторінок']

/**
 * The line that lands when the first page is finished AND Remixer is leading.
 *
 * The `build` mode's version of it (`briefDone`) ends by naming the two things to do next —
 * "Tell me what to change, or hit Publish when it feels right" — which is exactly the job
 * the proposal below it is about to do, in rows, with consequences. Two lists of the same
 * options, one in prose and one in controls, is the mistake the plan card's status line
 * already had to be cured of (09.09.2026): prose that names choices a control owns.
 *
 * So this states the fact, says how much of the plan is still outstanding — the one thing
 * the panel cannot say, because a panel shows at most two pages of it — and hands over.
 */
export function leadingDone(a: BriefAnswers, outline?: OutlineEdits): Text {
  const goal = optionById(BRIEF_QUESTIONS.find((q) => q.key === 'goal')!, a.goal)
  const gEn = goal ? `, ${goal.ack!.en}` : ''
  const gUk = goal ? `, ${goal.ack!.uk}` : ''
  const n = Math.max(0, buildOutline(a, outline).length - 1)

  /* ⚠️ CAPITALISED at the use site, not in the table: this word opens a SENTENCE. The first
     build of it read "…built to sell. three more pages are waiting", which `check:brief`
     caught — the table is a list of counts, and only here does one of them start a clause. */
  const word = WORD_EN[n] ? WORD_EN[n][0].toUpperCase() + WORD_EN[n].slice(1) : String(n)
  const restEn = n === 0 ? '' : ` ${word} more page${n === 1 ? '' : 's'} ${n === 1 ? 'is' : 'are'} waiting in the plan, so`
  const restUk = n === 0 ? '' : ` У плані чекають ще ${WORD_UK[n] ?? n} ${PAGES_UK[n] ?? 'сторінок'}, тож`

  return {
    en: `Done — your home page is live${gEn}.${restEn ? `${restEn} here is what I would do next.` : ' Here is what I would do next.'}`,
    uk: `Готово — ваша головна сторінка онлайн${gUk}.${restUk ? `${restUk} ось що я зробив би далі.` : ' Ось що я зробив би далі.'}`,
  }
}

/* ============================================ THE SATISFACTION CARD (Figma 25744:139153) */

/**
 * "How would you rate Remixer?" — a 1–10 scale, asked once, after the first proposal the
 * customer actually answered (designer, 09.09.2026: "после первого Autopilot вопроса, когда
 * пользователь что-то выберет, нам нужно узнать у кастомера насколько он доволен
 * сгенерированным сайтом", with the board).
 *
 * WHY IT LIVES HERE and not in a module of its own: it is the same dock, put up by the same
 * gate as a proposal, and it is the second half of the same conversation — Autopilot leads,
 * and having led once it asks whether that was any good. The panel is `RatingPanel.tsx`.
 *
 * ⚠️ ASKED ONCE. `suggest.rated` is set whether the answer was given or skipped: a survey
 * that comes back is not a survey, it is nagging — and this one interrupts a customer who
 * has a site to finish.
 *
 * ⚠️ IT COSTS NOTHING. Answering does not go through `sendMessage`: that path spends ten
 * credits and lights the preview, and charging somebody for telling us we did badly would be
 * the single worst line in the product.
 */
export const RATE_TITLE: Text = {
  en: 'How would you rate Remixer?',
  uk: 'Як ви оцінили б Remixer?',
}

/** The ends of the scale. ⚠️ The board spells the right-hand one "Exellent" — shipped fixed. */
export const RATE_LOW: Text = { en: 'Poor', uk: 'Погано' }
export const RATE_HIGH: Text = { en: 'Excellent', uk: 'Відмінно' }

export const RATE_PLACEHOLDER: Text = {
  en: 'Share your thoughts (optional)…',
  uk: 'Поділіться думками (необов’язково)…',
}

export const RATE_SKIP: Text = { en: 'Skip', uk: 'Пропустити' }
export const RATE_SUBMIT: Text = { en: 'Submit', uk: 'Надіслати' }

/** What the customer's own turn says, so the transcript can account for the answer. */
export function ratingSaid(score: number, note: string): Text {
  const tail = note.trim() ? ` ${note.trim()}` : ''
  return { en: `${score} out of 10.${tail}`, uk: `${score} з 10.${tail}` }
}

/**
 * What Remixer says back.
 *
 * THREE ANSWERS, NOT ONE, because a three and a ten cannot honestly get the same sentence.
 * The bands are the ones the question is built on — a 1–10 scale with "Poor" and "Excellent"
 * at its ends is read that way by everyone who has ever been sent one — and each reply does
 * the one thing that band deserves: a high score is thanked, a middling one is asked what the
 * missing point was, a low one is taken seriously and answered with an offer to fix. None of
 * them promises anything the product cannot do.
 */
export function ratingThanks(score: number, note: string): Text {
  const base: Text =
    score >= 9
      ? {
          en: 'Thank you — that is good to hear. I will keep the bar there.',
          uk: 'Дякую — приємно чути. Триматиму цю планку.',
        }
      : score >= 7
        ? {
            en: 'Thank you. If one thing would have made it a nine, name it and I will do it.',
            uk: 'Дякую. Якщо чогось одного бракує до дев’ятки — назвіть, і я це зроблю.',
          }
        : {
            en: 'Thank you for being straight with me — that is the answer worth having. Tell me what is wrong and I will put it right.',
            uk: 'Дякую за прямоту — така відповідь і потрібна. Скажіть, що не так, і я виправлю.',
          }
  if (!note.trim()) return base
  return { en: `${base.en} Your note goes with it.`, uk: `${base.uk} Ваш коментар іде разом із оцінкою.` }
}
