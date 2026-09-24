/**
 * The Cloud window's Users room — the demo data behind Figma 30971:98655.
 *
 * WHY THIS IS NOT THE BOARD'S CONTENT. The board's People table is a placeholder of the kind
 * the Cloud table and the Analytics dashboard carried (CLAUDE.md, «сами макетные строки —
 * плейсхолдер»): five rows share ONE address (a real person's gmail), all read «3 sign-ins»
 * and «18h ago», one of the names is a basketball player's, and the header's «Total users
 * 78,200» is the same figure the Analytics board prints for unique visitors. The CHROME is the
 * board's to the pixel; the DATA is ours, and ours has to agree with the rest of the demo:
 *
 *   · the customer is fit·ration, the meal-delivery site standing in the preview;
 *   · the Analytics window counts 1,842 unique visitors this week — so 214 new accounts in the
 *     last 7 days is an 11.6 % sign-up rate, which is what a delivery site asking for an address
 *     plausibly gets, and 1,286 in total says the site has lived longer than a week;
 *   · every name and address is invented. No row may name a real person.
 *
 * What the board says and we keep: an Unconfirmed user wears the GREY avatar (it is the only
 * grey one, so the colour is the status, not decoration); the other four avatars are the board's
 * blue, amber, pink and green in its order; providers are the mail and Google marks.
 * What we fix: an unconfirmed account signed up with a password — Google verifies the address
 * itself, so a Google user can never be «Unconfirmed», and such a user has never signed in.
 */
import type { Text } from '@/i18n'

export const USERS_TOTAL = '1,286'
export const USERS_WEEK = '214'

export type SignInId = 'public' | 'password' | 'google'

export interface SignInMethod {
  id: SignInId
  title: Text
  hint: Text
  /** the board's switch states: on · off · on */
  on: boolean
}

export const SIGN_IN: SignInMethod[] = [
  {
    id: 'public',
    title: { en: 'Public sign-up', uk: 'Відкрита реєстрація' },
    hint: { en: 'Anyone can create an account', uk: 'Будь-хто може створити акаунт' },
    on: true,
  },
  {
    id: 'password',
    title: { en: 'Email and password', uk: 'Пошта й пароль' },
    hint: { en: 'Standard email sign-in', uk: 'Звичайний вхід через пошту' },
    on: false,
  },
  {
    id: 'google',
    title: { en: 'Google', uk: 'Google' },
    hint: { en: 'Sign in with a Google account', uk: 'Вхід через акаунт Google' },
    on: true,
  },
]

export interface CloudUser {
  id: string
  name: string
  email: string
  /** «N sign-ins» — how many times this account has signed in. */
  logins: number
  provider: 'email' | 'google'
  unconfirmed?: boolean
  /** the last sign-in, already phrased; `null` = never */
  last: Text | null
  /** the avatar: the board's five colours, in its order; the grey one is the unconfirmed row's */
  tone: string
}

export const PEOPLE: CloudUser[] = [
  { id: 'maya', name: 'Maya Okafor', email: 'maya.okafor@gmail.com', logins: 14, provider: 'email', last: { en: '12m ago', uk: '12 хв тому' }, tone: '#0073ec' },
  { id: 'liam', name: 'Liam Brennan', email: 'liam.brennan@outlook.com', logins: 0, provider: 'email', unconfirmed: true, last: null, tone: '#71717a' },
  { id: 'sofia', name: 'Sofia Marquez', email: 'sofia.marquez@gmail.com', logins: 6, provider: 'google', last: { en: '2h ago', uk: '2 год тому' }, tone: '#ffb300' },
  { id: 'daniel', name: 'Daniel Kim', email: 'dan.kim@icloud.com', logins: 3, provider: 'email', last: { en: '18h ago', uk: '18 год тому' }, tone: '#d81b60' },
  { id: 'priya', name: 'Priya Raman', email: 'priya.raman@gmail.com', logins: 9, provider: 'google', last: { en: '3d ago', uk: '3 дні тому' }, tone: '#689f38' },
]

/**
 * THE CHART, AS DRAWN. The board titles it «Chart», labels its axis 100 · 80 · 60 · 20 · 0 % and
 * draws a hand-placed polyline whose seven vertices do not sit on the day ticks — the Analytics
 * chart recoloured, with nothing it is a chart OF. Unlike the Analytics chart, whose tabs each
 * carry a real series, there is no data here to re-space onto the axis, so the board's own path is
 * reproduced to the unit (exported from node 30971:100980) and the question of what it should
 * chart goes to the designer.
 *
 * Coordinates are the export's: a 1145 × 177 box whose origin sits at (−0.5, 38.5) of the plot
 * area. It stretches horizontally with the card; the stroke is pinned with non-scaling-stroke.
 */
export const USERS_CHART = {
  w: 1145,
  h: 177,
  line: 'M1.50049 102.46L151.667 144.5L282.516 60.77L448.636 123L610.424 40.5L877.115 123L1143.5 1.5',
  area: 'M1.50049 103.29V176.5H1143.5V2.5L878.033 123L609.813 41L448.636 122.5L282.516 61.6703L152.585 145.5C152.585 145.5 25.989 103.594 1.50049 103.29Z',
  /** the fill: a vertical ramp from 25 % at y −43.45 to 0 at the box's foot, the board's own stops */
  fillFrom: -43.4485,
  fillTo: 176.5,
}
