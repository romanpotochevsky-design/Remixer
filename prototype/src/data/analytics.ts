/**
 * The Analytics module's demo data — the numbers behind the site in the preview.
 *
 * WHY THIS IS NOT THE BOARD'S CONTENT. Figma 30934:93319 draws a dashboard whose figures
 * contradict each other on every panel: 78,200 unique visitors up top, five country rows
 * all reading 227 under five bars of five different lengths, a Device list where 110 gets
 * a WIDER bar than 227, and a "Last 24 hours" range over an axis labelled Sun…Sat. That is
 * a placeholder, the same kind the domain result lists and the Cloud table carry (CLAUDE.md,
 * «сами макетные строки — плейсхолдер»). The board's CHROME is reproduced to the pixel; the
 * DATA is ours, and ours means it has to agree with itself:
 *
 *   · the four lists each total the 1,842 unique visitors (pages count visitors, not views,
 *     because every one of those cards is headed "Visitors");
 *   · the seven days of the Unique series total 1,842, and of Pageviews 4,317;
 *   · views per visit, visit duration and bounce rate are the averages of their own series.
 *
 * A dashboard is the one screen where a demo is read by adding things up, so a CEO who
 * checks a column has to find it right. The customer is fit·ration, the meal-delivery site
 * standing in the preview (`modules/preview/SitePreview.tsx`), one week after going live.
 */
import type { Text } from '@/i18n'

/** Sun…Sat, the axis the board draws under the chart. */
export const DAYS: Text[] = [
  { en: 'Sun', uk: 'Нд' },
  { en: 'Mon', uk: 'Пн' },
  { en: 'Tue', uk: 'Вт' },
  { en: 'Wed', uk: 'Ср' },
  { en: 'Thu', uk: 'Чт' },
  { en: 'Fri', uk: 'Пт' },
  { en: 'Sat', uk: 'Сб' },
]

export interface Metric {
  id: string
  label: Text
  /** What the tab prints — already formatted, because a duration is not a number. */
  value: string
  /** The change against the week before, in per cent. Negative prints the down arrow. */
  delta: number
  /** Seven days, Sun…Sat. The chart draws the selected metric's series. */
  series: number[]
}

/**
 * The five tabs of the big card, in the board's order. The board selects the first one and
 * draws no other state — so the strip could have been a picture. It is not: each tab carries
 * its own week, and pressing one redraws the chart. A tab strip whose tabs cannot be pressed
 * is a dead control, and the board drew the selected state precisely so it could move.
 */
export const METRICS: Metric[] = [
  {
    id: 'unique',
    label: { en: 'Unique', uk: 'Унікальні' },
    value: '1,842',
    delta: 18,
    series: [241, 168, 302, 214, 331, 209, 377],
  },
  {
    id: 'pageviews',
    label: { en: 'Pageviews', uk: 'Перегляди' },
    value: '4,317',
    delta: 12,
    series: [561, 402, 704, 498, 776, 489, 887],
  },
  {
    id: 'per-visit',
    label: { en: 'Views Per Visit', uk: 'Переглядів за візит' },
    value: '2.34',
    delta: -3,
    series: [2.1, 2.52, 2.19, 2.61, 2.2, 2.44, 2.33],
  },
  {
    id: 'duration',
    label: { en: 'Visit Duration', uk: 'Тривалість візиту' },
    value: '2m 41s',
    delta: 7,
    series: [142, 176, 151, 189, 154, 168, 147],
  },
  {
    id: 'bounce',
    label: { en: 'Bounce Rate', uk: 'Показник відмов' },
    value: '48%',
    delta: -4,
    series: [52, 44, 50, 43, 51, 46, 50],
  },
]

/** One row of a breakdown card: what it is, and how many visitors it brought. */
export interface Breakdown {
  id: string
  label: string
  count: number
  /** Country rows carry a 16px flag in front of the name; the other three cards do not. */
  flag?: string
}

export interface BreakdownCard {
  id: string
  title: Text
  rows: Breakdown[]
}

/** The four list cards, in the board's reading order: Country · Source, then Device · Page. */
export const BREAKDOWNS: BreakdownCard[] = [
  {
    id: 'country',
    title: { en: 'Country', uk: 'Країна' },
    rows: [
      { id: 'us', label: 'United States', count: 1106, flag: 'us' },
      { id: 'ca', label: 'Canada', count: 284, flag: 'ca' },
      { id: 'gb', label: 'United Kingdom', count: 197, flag: 'gb' },
      { id: 'de', label: 'Germany', count: 141, flag: 'de' },
      { id: 'fr', label: 'France', count: 114, flag: 'fr' },
    ],
  },
  {
    id: 'source',
    title: { en: 'Source', uk: 'Джерело' },
    rows: [
      { id: 'direct', label: 'Direct', count: 861 },
      { id: 'google', label: 'google.com', count: 512 },
      { id: 'instagram', label: 'instagram.com', count: 274 },
      { id: 'reddit', label: 'reddit.com', count: 118 },
      { id: 'mail', label: 'mail.fit-ration.com', count: 77 },
    ],
  },
  {
    id: 'device',
    title: { en: 'Device', uk: 'Пристрій' },
    rows: [
      { id: 'desktop', label: 'Desktop', count: 1022 },
      { id: 'mobile', label: 'Mobile', count: 703 },
      { id: 'tablet', label: 'Tablet', count: 117 },
    ],
  },
  {
    id: 'page',
    title: { en: 'Page', uk: 'Сторінка' },
    rows: [
      { id: 'home', label: '/', count: 1842 },
      { id: 'menu', label: '/menu', count: 1013 },
      { id: 'pricing', label: '/pricing', count: 604 },
      { id: 'how', label: '/how-it-works', count: 318 },
      { id: 'contact', label: '/contact', count: 96 },
    ],
  },
]

/**
 * The range the header's select is showing.
 *
 * ⚠️ IT READS "Last 7 days", AND THE BOARD READS "Last 24 hours". That is the `Add Promt`
 * class of correction — one label whose only possible right value is fixed by the drawing
 * next to it: the chart under this select is drawn with a Sun…Sat axis, so the range cannot
 * be a day. Shipped corrected, and raised with the designer.
 */
export const RANGES: Text[] = [
  { en: 'Last 7 days', uk: 'Останні 7 днів' },
  { en: 'Last 24 hours', uk: 'Останні 24 години' },
  { en: 'Last 30 days', uk: 'Останні 30 днів' },
]
