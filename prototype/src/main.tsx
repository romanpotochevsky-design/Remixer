import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import Root from './Root'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* One reduced-motion policy for BOTH animation engines. The CSS side
        already dies under prefers-reduced-motion (index.css kills animation and
        transition), but motion/react springs ignore that media query unless
        told — so the send bubble kept springing while the typing reveal was
        dead, which reads as "animations are broken", not as an accessibility
        setting being honoured. */}
    <MotionConfig reducedMotion="user">
      <Root />
    </MotionConfig>
  </StrictMode>,
)
