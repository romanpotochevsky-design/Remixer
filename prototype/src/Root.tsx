/**
 * Which page is on screen.
 *
 * The Home page is not a surface inside the builder — it has its own chrome (a
 * transparent topbar over the hero, no chat column, no right rail), so it cannot
 * render inside the shell. It gets picked here instead, off `ui.page`.
 *
 * Deliberately the thinnest possible switch. `App.tsx` is the builder shell and its
 * send choreography, glow timing and scroll parking are tuned to the millisecond;
 * wrapping it, re-parenting it or hoisting anything out of it would put every one of
 * those measurements back in play. Both pages mount the prototype console themselves,
 * so only one copy is ever alive.
 *
 * Every future top-level page (account, billing, the hosting panel) is one more branch
 * here, not another special case inside the shell.
 */
import { useUI } from '@/state/ui'
import App from './App'
import { HomePage } from '@/modules/home/HomePage'

export default function Root() {
  const page = useUI((s) => s.page)
  return page === 'home' ? <HomePage /> : <App />
}
