/**
 * The engine behind the two-lines setup — opening it, arming it, and re-checking.
 *
 * It lives outside the component on purpose. ㉘ A2 requires that we keep checking on the
 * customer's behalf, and ㉘ C requires that closing the sheet does not abandon the job:
 * both are only true if the timers outlive the React tree. A checker that stops when the
 * sheet closes would make "you can close this" a lie, which is the one thing this whole
 * screen exists to avoid.
 *
 * Nothing is ever found before `armed`. The customer has to have done something that
 * could plausibly have started the work — pressed Copy, or pressed the check button —
 * because a screen that ticks itself off while you watch teaches everyone in the room
 * that the product does the pasting for you. It does not.
 */
import { useWorld, startExternalSetup, runDomainTimeline, EXTERNAL_LIVE_TIMELINE } from './world'
import type { ExternalSetup, SetupLine } from './world'
import { useUI } from './ui'
import { registrarFor } from '@/data/domains'

/** One schedule at a time: re-arming replaces the pending check, never stacks another. */
let timers: ReturnType<typeof setTimeout>[] = []
const clear = () => { timers.forEach(clearTimeout); timers = [] }

/** How long the prototype pretends a registrar takes to show a saved record. */
const CHECK_INTERVAL = 7000
/** The manual button's own wait, so pressing it feels like it did something. */
const MANUAL_CHECK = 1400

/** Where the lines get pasted, decided once so the flow never names two places. */
export const setupHost = (domain: string, kind: ExternalSetup['kind']) =>
  kind === 'dh-external-ns' ? 'Cloudflare' : registrarFor(domain)

/** Open the sheet for a domain, starting or resuming its setup. */
export function openExternalSetup(domain: string, kind: ExternalSetup['kind']) {
  const ui = useUI.getState()
  ui.closeDomainModal()
  startExternalSetup(domain, kind, setupHost(domain, kind))
  ui.openSetupModal(domain)
  resumePolling()
}

/**
 * Mark that the customer has plausibly started the work. Idempotent, and safe to call
 * from every interaction that implies it.
 */
export function armExternalSetup() {
  const { world, set } = useWorld.getState()
  const s = world.externalSetup
  if (!s) return
  if (!s.armed) set({ externalSetup: { ...s, armed: true } })
  resumePolling()
}

/** (Re)schedule the background check. Called on mount too, so a reload resumes. */
export function resumePolling() {
  clear()
  const s = useWorld.getState().world.externalSetup
  if (!s || !s.armed || s.found.length >= 2) return
  timers.push(setTimeout(reveal, CHECK_INTERVAL))
}

/** The explicit "I've pasted them" button. Same reveal, with a visible wait. */
export function checkExternalSetup() {
  const { world, set } = useWorld.getState()
  const s = world.externalSetup
  if (!s || s.checking || s.found.length >= 2) return
  clear()
  set({ externalSetup: { ...s, checking: true, armed: true } })
  timers.push(setTimeout(reveal, MANUAL_CHECK))
}

/** Stop everything — used when the setup is abandoned or the world is rewritten. */
export function cancelExternalSetup() {
  clear()
  useWorld.getState().set({ externalSetup: null })
}

function reveal() {
  const { world, set } = useWorld.getState()
  const s = world.externalSetup
  if (!s || s.found.length >= 2) return

  const found: SetupLine[] = s.found.includes('root') ? ['root', 'www'] : ['root']
  set({ externalSetup: { ...s, found, checking: false } })

  if (found.length < 2) {
    resumePolling()
    return
  }

  /* Both lines are in. From here it is our work, so it moves to the states the panel
     already speaks — and the domain finally stops showing staging. */
  runDomainTimeline(EXTERNAL_LIVE_TIMELINE)

  /* A toast may only report something the customer is not already watching. With the
     sheet open they are looking straight at the checklist ticking over; a toast would
     be the same news, twice, in two places. */
  if (useUI.getState().setupModal === null) {
    useUI.getState().showToast(
      { en: `${s.domain} is on its way`, uk: `${s.domain} у дорозі` },
      'progress',
    )
  }
}
