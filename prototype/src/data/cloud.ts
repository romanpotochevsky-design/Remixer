/**
 * The Cloud module's demo data — the tables behind the site in the preview.
 *
 * WHY THIS IS NOT THE BOARD'S CONTENT. Figma 30816:49569 draws five identical rows
 * ("Ambre Sacré", a perfume description, $70.00, category "Home", size S, an Unsplash
 * shoe photo) under a table titled "Blogs", with the left menu showing "Blog" selected
 * and "Products" under it. The row is internally inconsistent — a perfume named, a shoe
 * pictured, a home category — and it is pasted five times: that is a placeholder, the
 * same kind the domain result lists carry (CLAUDE.md, "сами макетные строки —
 * плейсхолдер"). The board's CHROME is reproduced to the pixel; the DATA is ours.
 *
 * Ours means: the demo customer's site is fit·ration, a meal-delivery service
 * (`modules/preview/SitePreview.tsx`, the same six dishes, the same tints and emoji).
 * Cloud shows what is behind that page — so the table holds those six meals, in the
 * board's exact columns: Image · Name · Description · Price · Category · size ·
 * image_url. Every column keeps its meaning (a meal has a portion size and a price),
 * so nothing about the drawn table had to change to hold real data.
 */

export interface CloudRow {
  id: string
  name: string
  description: string
  price: string
  category: string
  /** The board's column is lowercase `size` — a portion here: S · M · L. */
  size: string
  imageUrl: string
  /** The dish tile: the site's own gradient + emoji, because we ship no photos. */
  tint: string
  emoji: string
  /**
   * The two macros the site prints under every dish (SitePreview.tsx reads THIS table since
   * 30.09.2026 — one source for the six meals, so a name the customer changes in the Visual
   * Editor changes here too instead of drifting). Only meals carry them.
   */
  kcal?: number
  protein?: number
}

export interface CloudTable {
  id: string
  /** What the left menu calls it. */
  name: string
  /** What the page title calls it — the board titles "Blog" as "Blogs". */
  title: string
  rows: CloudRow[]
}

/** The six dishes — the site's menu and the Cloud table are this one list (see `kcal`). */
export const CLOUD_MEALS: CloudRow[] = [
  {
    id: 'power-bowl',
    name: 'Power Bowl',
    description: 'Quinoa, roasted chickpeas and grilled chicken with a lemon-tahini dressing. Built for the 520 kcal slot.',
    price: '$12.50',
    category: 'Lunch',
    size: 'M',
    imageUrl: 'https://cdn.remixer.ai/fit-ration/power-bowl.jpg?w=600&q=80',
    tint: 'linear-gradient(135deg,#dff1e4,#b7dfc4)',
    emoji: '🥗',
    kcal: 520,
    protein: 42,
  },
  {
    id: 'lean-beef-rice',
    name: 'Lean Beef & Rice',
    description: 'Slow-cooked lean beef over jasmine rice with steamed greens. The highest protein plate on the menu.',
    price: '$14.00',
    category: 'Dinner',
    size: 'L',
    imageUrl: 'https://cdn.remixer.ai/fit-ration/lean-beef-rice.jpg?w=600&q=80',
    tint: 'linear-gradient(135deg,#f6e8d9,#eacdaa)',
    emoji: '🍛',
    kcal: 610,
    protein: 48,
  },
  {
    id: 'salmon-teriyaki',
    name: 'Salmon Teriyaki',
    description: 'Norwegian salmon glazed in teriyaki, soba noodles, sesame and pickled ginger on the side.',
    price: '$15.50',
    category: 'Dinner',
    size: 'M',
    imageUrl: 'https://cdn.remixer.ai/fit-ration/salmon-teriyaki.jpg?w=600&q=80',
    tint: 'linear-gradient(135deg,#fbe3dc,#f3bfae)',
    emoji: '🍣',
    kcal: 570,
    protein: 39,
  },
  {
    id: 'chicken-pesto-pasta',
    name: 'Chicken Pesto Pasta',
    description: 'Wholegrain fusilli, basil pesto and shredded chicken breast, finished with toasted pine nuts.',
    price: '$13.00',
    category: 'Dinner',
    size: 'L',
    imageUrl: 'https://cdn.remixer.ai/fit-ration/chicken-pesto-pasta.jpg?w=600&q=80',
    tint: 'linear-gradient(135deg,#eef2da,#d7e3ae)',
    emoji: '🍝',
    kcal: 640,
    protein: 45,
  },
  {
    id: 'greek-wrap',
    name: 'Greek Wrap',
    description: 'Feta, olives, cucumber and herbed yoghurt in a wholemeal wrap. The lightest thing we deliver.',
    price: '$10.50',
    category: 'Lunch',
    size: 'S',
    imageUrl: 'https://cdn.remixer.ai/fit-ration/greek-wrap.jpg?w=600&q=80',
    tint: 'linear-gradient(135deg,#e7ecf6,#c3d2ec)',
    emoji: '🌯',
    kcal: 480,
    protein: 33,
  },
  {
    id: 'protein-pancakes',
    name: 'Protein Pancakes',
    description: 'Oat and whey pancakes with berry compote. Breakfast that still counts towards the day’s macros.',
    price: '$9.50',
    category: 'Breakfast',
    size: 'S',
    imageUrl: 'https://cdn.remixer.ai/fit-ration/protein-pancakes.jpg?w=600&q=80',
    tint: 'linear-gradient(135deg,#f9ecdf,#f0d3b0)',
    emoji: '🥞',
    kcal: 430,
    protein: 31,
  },
]

const ORDERS: CloudRow[] = [
  {
    id: 'ord-4192',
    name: 'Order #4192',
    description: 'Weekly plan, five dinners, delivered Mondays at 07:30. Paid by card, renews automatically.',
    price: '$68.00',
    category: 'Weekly',
    size: 'L',
    imageUrl: 'https://cdn.remixer.ai/fit-ration/orders/4192.json?v=2',
    tint: 'linear-gradient(135deg,#e7ecf6,#c3d2ec)',
    emoji: '🧾',
  },
  {
    id: 'ord-4193',
    name: 'Order #4193',
    description: 'Trial box, three lunches, delivered once. First order for this customer.',
    price: '$36.00',
    category: 'Trial',
    size: 'S',
    imageUrl: 'https://cdn.remixer.ai/fit-ration/orders/4193.json?v=2',
    tint: 'linear-gradient(135deg,#dff1e4,#b7dfc4)',
    emoji: '🧾',
  },
  {
    id: 'ord-4194',
    name: 'Order #4194',
    description: 'Weekly plan, seven dinners plus breakfasts, paused until the 14th at the customer’s request.',
    price: '$94.00',
    category: 'Weekly',
    size: 'L',
    imageUrl: 'https://cdn.remixer.ai/fit-ration/orders/4194.json?v=2',
    tint: 'linear-gradient(135deg,#f9ecdf,#f0d3b0)',
    emoji: '🧾',
  },
]

/** The databases the left menu lists, in the order the board draws them. */
export const CLOUD_TABLES: CloudTable[] = [
  { id: 'meals', name: 'Meals', title: 'Meals', rows: CLOUD_MEALS },
  { id: 'orders', name: 'Orders', title: 'Orders', rows: ORDERS },
]

/** The menu's second group — named by the board, all four still empty rooms. */
export const CLOUD_SECTIONS = ['emails', 'secrets', 'users', 'storage'] as const
export type CloudSection = (typeof CLOUD_SECTIONS)[number]
