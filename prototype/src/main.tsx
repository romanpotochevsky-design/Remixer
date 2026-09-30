/* FIRST: the crash guard must be evaluated before any app module can throw (crash-guard.ts) */
import { reportCrash } from './crash-guard'
import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import Root from './Root'
import { installGlassInteractions } from './ui/ripple'
import './index.css'

/* Press ripples for the Liquid Glass controls: one document-level delegation,
   zero per-button wiring — a control opts in with `glass-interactive`. */
installGlassInteractions()

/** A render-time crash reaches the guard through here; the panel replaces the blank root. */
class CrashBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false }
  static getDerivedStateFromError() { return { crashed: true } }
  componentDidCatch(err: unknown) { reportCrash(err, 'render') }
  render() { return this.state.crashed ? null : this.props.children }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* One reduced-motion policy for BOTH animation engines. The CSS side
        already dies under prefers-reduced-motion (index.css kills animation and
        transition), but motion/react springs ignore that media query unless
        told — so the send bubble kept springing while the typing reveal was
        dead, which reads as "animations are broken", not as an accessibility
        setting being honoured. */}
    <MotionConfig reducedMotion="user">
      <CrashBoundary>
        <Root />
      </CrashBoundary>
    </MotionConfig>
  </StrictMode>,
)
