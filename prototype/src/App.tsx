/**
 * The builder shell — placeholder geometry, real wiring.
 *
 * Proportions are measured from the live Remixer: 57px top bar, 64px rail, 16px preview
 * radius, 522px chat panel. Everything here reads from the world store, so the console
 * visibly drives the interface. Real screens from Figma replace the insides, not the frame.
 */
import { useWorld, canUseAI, hasPlan, trialDaysLeft } from '@/state/world'
import { useUI } from '@/state/ui'
import { ScenarioPanel } from '@/devtools/ScenarioPanel'
import { FlowRunner } from '@/devtools/FlowPlayer'
import { PublishPanel } from '@/modules/publish/PublishPanel'
import { DomainsSurface } from '@/modules/domains/DomainsSurface'
import { useT } from '@/i18n'

const RAIL = [
  { id: 'library', label: 'Library' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'analytics', label: 'Analytics' },
  // Domains and Email have no home in the rail today. That gap is the audit's headline.
]

export default function App() {
  const { world } = useWorld()
  const { surface, openDomains, togglePublish } = useUI()
  const { t } = useT()

  const address =
    world.domain === 'live' || world.domain === 'multiple'
      ? 'fit-ration.com'
      : 'fit-ration.remixer.app'

  const publish =
    world.unpublished > 0
      ? { label: { en: 'Update', uk: 'Оновити' }, tone: 'action' as const }
      : world.domain === 'live'
        ? { label: { en: 'Visit site', uk: 'Відкрити сайт' }, tone: 'quiet' as const }
        : { label: { en: 'Publish', uk: 'Опублікувати' }, tone: 'action' as const }

  return (
    <div className="flex h-full flex-col bg-[var(--gray-900)]">
      {/* ------------------------------------------------------------ top bar */}
      <header
        className="flex flex-none items-center gap-2 px-2"
        style={{ height: 'var(--topbar-h)' }}
      >
        <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-[var(--brand-from)] to-[var(--brand-to)] text-[13px] font-semibold">
          R
        </div>
        <button className="h-10 rounded-[10px] bg-[var(--gray-800)] px-3 text-[14px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-std)] hover:bg-[var(--gray-750)]">
          Visual Editor
        </button>

        <div className="flex-1" />

        {/* the live address lives in permanent chrome — nobody else in the category does this */}
        <button
          onClick={() => openDomains(world.domain === 'connecting' || world.domain === 'verifying' ? 'status' : 'home')}
          className="flex h-10 items-center gap-2 rounded-[10px] px-3 text-[14px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-std)] hover:bg-[var(--gray-800)]"
        >
          {world.domain === 'live' && (
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--live)]" aria-hidden />
          )}
          {world.domain === 'connecting' && (
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--attention)]" aria-hidden />
          )}
          {address}
          <span className="text-[var(--white-400)]">⌄</span>
        </button>

        <div className="flex-1" />

        <button
          onClick={() => togglePublish()}
          className={
            publish.tone === 'action'
              ? 'h-10 rounded-[10px] bg-[var(--action)] px-4 text-[14px] font-medium text-white transition-colors duration-[var(--dur-fast)] ease-[var(--ease-std)] hover:bg-[var(--action-hover)]'
              : 'h-10 rounded-[10px] border border-[var(--white-200)] px-4 text-[14px] font-medium text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-std)] hover:bg-[var(--gray-800)]'
          }
        >
          {t(publish.label)}
          {world.unpublished > 0 && (
            <span className="ml-1.5 text-[12px] opacity-70">{world.unpublished}</span>
          )}
        </button>

        {/* credits — persistent, in the toolbar. GoDaddy exiles this to another page and
            it is their loudest complaint. Never move it. */}
        <div
          className={`ml-1 flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] tabular-nums ${
            world.credits === 0
              ? 'bg-[#3d2e2e] text-[var(--danger)]'
              : world.credits < 100
                ? 'bg-[#3d3a2e] text-[var(--attention)]'
                : 'bg-[#3d3a2e] text-white'
          }`}
          title="Credits"
        >
          <span aria-hidden>⊕</span>
          {world.credits}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* --------------------------------------------------------- icon rail */}
        <nav
          className="flex flex-none flex-col items-center gap-2 pt-1"
          style={{ width: 'var(--rail-w)' }}
        >
          {RAIL.map((item) => (
            <button
              key={item.id}
              title={item.label}
              aria-label={item.label}
              className="grid h-12 w-12 place-items-center rounded-[10px] text-[var(--white-400)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-std)] hover:bg-[var(--gray-800)] hover:text-[var(--white-700)]"
            >
              <span className="h-4 w-4 rounded-[3px] border border-current" aria-hidden />
            </button>
          ))}
        </nav>

        {/* ------------------------------------------------------------ canvas */}
        {/* A surface module (domains today; analytics, library… tomorrow) renders in
            place of the preview inside the same frame — the pattern Lovable ships
            as "More" and Remixer already uses in production. */}
        <main className="relative min-w-0 flex-1 pb-2 pr-2">
          {surface === 'domains' ? (
            <DomainsSurface />
          ) : (
            <div className="grid h-full place-items-center rounded-shell bg-[var(--gray-950)]">
              <p className="font-mono text-[12px] text-[var(--white-300)]">
                {world.project === 'empty'
                  ? t({ en: 'Your site will appear here as Remixer builds it', uk: 'Ваш сайт з’явиться тут, щойно Remixer його збудує' })
                  : world.project === 'generating'
                    ? t({ en: 'Building your pages…', uk: 'Збираємо сторінки…' })
                    : 'preview'}
              </p>
            </div>
          )}
        </main>

        {/* -------------------------------------------------------- chat panel */}
        <aside
          className="flex flex-none flex-col border-l border-[var(--gray-850)]"
          style={{ width: 'var(--chat-w)' }}
        >
          <div className="flex flex-none items-center justify-between px-4 py-3">
            <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em]">Chat</h2>
            {!hasPlan(world) && (
              <span className="rounded-md bg-gradient-to-r from-[var(--brand-from)] to-[var(--brand-to)] px-2 py-1 text-[11px] font-medium">
                {world.account === 'trial'
                  ? t({ en: `Trial · ${trialDaysLeft(world)} days left`, uk: `Тріал · ${trialDaysLeft(world)} дн.` })
                  : t({ en: 'Plan required', uk: 'Потрібен план' })}
              </span>
            )}
          </div>

          <div className="min-h-0 flex-1 px-4 text-[14px] text-[var(--white-400)]">
            {world.chat === 'empty' && <p>{t({ en: 'Describe what you want to build.', uk: 'Опишіть, що збудувати.' })}</p>}
            {world.chat === 'working' && <p>{t({ en: 'The agent is working…', uk: 'Агент працює…' })}</p>}
            {world.chat === 'error' && <p className="text-[var(--danger)]">{t({ en: 'Something broke.', uk: 'Щось зламалось.' })}</p>}
            {(world.chat === 'short' || world.chat === 'long') && <p>{t({ en: 'Conversation history.', uk: 'Історія листування.' })}</p>}
          </div>

          <div className="flex-none p-3">
            <div className="rounded-[12px] border border-[var(--gray-800)] bg-[var(--gray-850)] p-3">
              <p className="text-[14px] text-[var(--white-300)]">
                {canUseAI(world)
                  ? t({ en: 'What should I change?', uk: 'Що змінити?' })
                  : t({ en: 'AI is off — a plan is required', uk: 'AI вимкнено — потрібен план' })}
              </p>
            </div>
          </div>
        </aside>
      </div>

      <PublishPanel />
      <FlowRunner />
      <ScenarioPanel />
    </div>
  )
}
