/**
 * The builder shell — 2026 redesign, pixel source: Figma node 25819:143144
 * "Website Builder" (2560×1166, captured 16.08.2026).
 *
 * Layout: AI chat column 432px on the LEFT, canvas in the middle, icon rail 56px on
 * the RIGHT, both toolbars 52px. Chrome controls are "glass": rgba(24,24,27,.8) with
 * a 16px backdrop blur and a 15%-white hairline. Ground is gray-950; the site preview
 * floats on it with an 8px gutter.
 *
 * Everything still renders from the world store — the scenario console and flows
 * drive this shell exactly as they drove the old one.
 */
import { useWorld, canUseAI, hasPlan } from '@/state/world'
import { useUI } from '@/state/ui'
import { ScenarioPanel } from '@/devtools/ScenarioPanel'
import { FlowRunner } from '@/devtools/FlowPlayer'
import { PublishPanel } from '@/modules/publish/PublishPanel'
import { DomainsSurface } from '@/modules/domains/DomainsSurface'
import { ChatPanel } from '@/modules/chat/ChatPanel'
import { SitePreview, SiteSkeleton } from '@/modules/preview/SitePreview'
import { SiriGlow } from '@/ui/SiriGlow'
import { useT } from '@/i18n'
import {
  LogoRemixer, IconHistory, IconSidebar, IconVisualEditor, IconReload, IconMonitor, IconPhone, IconGrid,
  IconChevronDown, IconCoin, IconStyle, IconExtension, IconAnalytics, IconCloud,
  IconChatBubble,
} from '@/ui/icons'

/** Glass pill: the shared chrome surface — liquid-glass fill, blur and gradient rim. */
function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`liquid-glass flex items-center rounded-[12px] ${className}`}>
      {children}
    </div>
  )
}

const RAIL = [
  { id: 'style', label: 'Website Styles', Icon: IconStyle },
  { id: 'integrations', label: 'Integrations', Icon: IconExtension },
  { id: 'analytics', label: 'Analytics', Icon: IconAnalytics },
  { id: 'cloud', label: 'Cloud', Icon: IconCloud },
  // Domains and Email still have no home in the rail. That gap is the audit's headline.
]

export default function App() {
  const { world } = useWorld()
  const { surface, openDomains, togglePublish, reloading, reloadTick, triggerReload } = useUI()
  const { t } = useT()

  const address =
    world.domain === 'live' || world.domain === 'multiple'
      ? 'fit-ration.com'
      : 'fit-ration.remixer.site'

  const publishLabel =
    world.unpublished > 0
      ? { en: 'Update', uk: 'Оновити' }
      : { en: 'Publish', uk: 'Опублікувати' }

  return (
    <div className="flex h-full overflow-hidden bg-[var(--gray-950)] text-[var(--white-900)]">
      {/* ================================================== chat column, 432px */}
      <aside className="flex flex-none flex-col" style={{ width: 'var(--chat-w)' }}>
        {/* chat top toolbar (Figma 25819:143769) */}
        <header className="flex flex-none items-center justify-between pr-2" style={{ height: 'var(--topbar-h)' }}>
          <div className="flex items-center">
            <div className="grid w-14 place-items-center">
              <LogoRemixer size={32} />
            </div>
            <span className="font-display text-[20px] font-semibold leading-[1.2] text-white">Remixer</span>
          </div>
          <Glass className="gap-0.5 p-0.5">
            <button
              aria-label={t({ en: 'Version history', uk: 'Історія версій' })}
              className="grid h-8 w-8 place-items-center rounded-[10px] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
            >
              <IconHistory size={18} />
            </button>
            <span className="h-8 w-px bg-[var(--gray-850)]" aria-hidden />
            <button
              aria-label={t({ en: 'Collapse chat', uk: 'Згорнути чат' })}
              className="grid h-8 w-8 place-items-center rounded-[10px] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
            >
              <IconSidebar size={18} />
            </button>
          </Glass>
        </header>

        <ChatPanel />
      </aside>

      {/* ================================================== center column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* canvas top toolbar (Figma 25819:143717) */}
        <header className="flex flex-none items-center justify-between pr-2" style={{ height: 'var(--topbar-h)' }}>
          {/* left: Visual Editor + device preview */}
          <div className="flex items-center gap-2 pl-2">
            <Glass className="h-9 justify-center pr-5">
              <span className="grid h-9 w-10 place-items-center text-[var(--white-700)]">
                <IconVisualEditor size={18} />
              </span>
              <span className="text-[14px] leading-none text-[var(--white-900)]">Visual Editor</span>
            </Glass>
            <Glass className="h-9 gap-0.5 p-0.5">
              <button
                onClick={() => triggerReload()}
                aria-label={t({ en: 'Reload preview', uk: 'Перезавантажити прев’ю' })}
                className="grid h-8 w-8 place-items-center rounded-[10px] text-[var(--white-900)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
              >
                <span className={reloading ? 'animate-spin' : undefined} style={reloading ? { animationDuration: '1.1s' } : undefined}>
                  <IconReload size={17} />
                </span>
              </button>
              <span className="h-8 w-px bg-[var(--white-100)]" aria-hidden />
              <button
                aria-label={t({ en: 'Desktop preview', uk: 'Прев’ю для десктопа' })}
                className="grid h-8 w-8 place-items-center rounded-[10px] text-[var(--white-900)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]"
              >
                <IconMonitor size={17} />
              </button>
              <span className="h-8 w-px bg-[var(--white-100)]" aria-hidden />
              <button
                aria-label={t({ en: 'Mobile preview', uk: 'Прев’ю для мобільного' })}
                className="grid h-8 w-8 place-items-center rounded-[10px] text-[var(--white-400)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-[var(--white-700)]"
              >
                <IconPhone size={17} />
              </button>
            </Glass>
          </div>

          {/* center: project button, 280×40 — the live address in permanent chrome */}
          <button
            onClick={() => openDomains(world.domain === 'connecting' || world.domain === 'verifying' ? 'status' : 'home')}
            className="mx-2 flex h-10 w-[280px] min-w-0 shrink items-center justify-between rounded-[10px] border border-[var(--white-200)] px-2 transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)]/[0.04]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="grid h-6 w-6 flex-none place-items-center text-[var(--white-400)]">
                <IconGrid size={22} />
              </span>
              {world.domain === 'live' && <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--live)]" aria-hidden />}
              {(world.domain === 'connecting' || world.domain === 'verifying') && (
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--attention)]" aria-hidden />
              )}
              <span className="truncate text-[15px] font-semibold leading-[1.4]">{address}</span>
            </span>
            <span className="flex-none text-[var(--white-400)]"><IconChevronDown size={18} /></span>
          </button>

          {/* right: credits (amber, permanent — never move it off the toolbar) + Publish */}
          <div className="flex items-center gap-2">
            <div
              className={`flex h-9 items-center gap-3 rounded-[12px] border py-0 pl-[7px] pr-[6px] ${
                world.credits === 0 ? 'border-[#ef444440]' : 'border-[var(--credit-border)]'
              }`}
              style={{ background: 'linear-gradient(to bottom, var(--credit-from), var(--credit-to))' }}
              title={t({ en: 'Credits', uk: 'Кредити' })}
            >
              <span className="flex items-center gap-2">
                <IconCoin size={20} />
                <span className="text-[15px] font-medium tabular-nums text-white">
                  {world.credits.toLocaleString('en-US').replace(/,/g, ' ')}
                </span>
              </span>
              <span className="grid h-6 w-6 place-items-center text-[var(--white-400)]">
                <IconChevronDown size={16} />
              </span>
            </div>
            <button
              onClick={() => togglePublish()}
              className="h-9 rounded-[10px] bg-[var(--action)] px-4 text-[13px] font-semibold leading-[1.4] text-white transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--action-hover)]"
            >
              {t(publishLabel)}
              {world.unpublished > 0 && <span className="ml-1.5 tabular-nums opacity-70">{world.unpublished}</span>}
            </button>
          </div>
        </header>

        {/* canvas — 8px gutter, the preview floats on the ground.
            While the agent works, the frame lights up with the Siri-style edge glow. */}
        <main className="relative min-h-0 min-w-0 flex-1 pb-2 pl-2">
          {(() => {
            const busy = world.project === 'generating' || world.chat === 'working' || reloading
            return surface === 'domains' ? (
              <DomainsSurface />
            ) : (
              <div className="relative h-full overflow-hidden rounded-shell">
                {world.project === 'built' ? (
                  reloading ? (
                    <SiteSkeleton />
                  ) : (
                    <div key={reloadTick} className={reloadTick > 0 ? 'site-enter h-full' : 'h-full'}>
                      <SitePreview />
                    </div>
                  )
                ) : (
                  <div className="grid h-full place-items-center bg-[var(--gray-900)]">
                    {world.project === 'generating' ? (
                      <p className="text-[14px] text-[var(--white-400)]">
                        {t({ en: 'Building your pages…', uk: 'Збираємо сторінки…' })}
                      </p>
                    ) : (
                      <p className="text-[14px] text-[var(--white-300)]">
                        {t({ en: 'Your site will appear here as Remixer builds it', uk: 'Ваш сайт з’явиться тут, щойно Remixer його збудує' })}
                      </p>
                    )}
                  </div>
                )}
                {busy && (
                  <>
                    {/* like iOS: the content recedes a step while the glow works */}
                    {world.project === 'built' && !reloading && (
                      <div className="absolute inset-0 z-10 bg-[#09090b73]" style={{ animation: 'siri-in 0.5s var(--ease-std) both' }} aria-hidden />
                    )}
                    <SiriGlow />
                  </>
                )}
              </div>
            )
          })()}
          <PublishPanel />
        </main>
      </div>

      {/* ================================================== right rail, 56px */}
      <nav className="flex flex-none flex-col items-center pb-6" style={{ width: 'var(--rail-w)' }}>
        <div className="grid place-items-center" style={{ height: 'var(--topbar-h)' }}>
          <button
            aria-label={t({ en: 'Account', uk: 'Акаунт' })}
            className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-[#e0a94a] to-[#a3651f] text-[12px] font-semibold text-white"
          >
            R
          </button>
        </div>
        <div className="mt-2.5 flex flex-col gap-2">
          {RAIL.map(({ id, label, Icon }) => (
            <button
              key={id}
              title={label}
              aria-label={label}
              className="grid h-12 w-12 place-items-center rounded-[16px] text-[var(--white-700)] transition-colors duration-[var(--dur-fast)] ease-std hover:bg-[var(--white-100)] hover:text-white"
            >
              <Icon size={22} />
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          aria-label={t({ en: 'Support chat', uk: 'Чат підтримки' })}
          className="grid h-9 w-9 place-items-center rounded-full bg-[#48ba79] text-white transition-transform duration-[var(--dur-fast)] ease-std hover:scale-105"
        >
          <IconChatBubble size={20} />
        </button>
      </nav>

      {/* AI availability notice for expired accounts, kept from the old shell */}
      {!canUseAI(world) && !hasPlan(world) && world.account === 'trial-expired' && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[var(--gray-850)] px-4 py-2 text-[13px] text-[var(--white-500)] shadow-lg">
          {t({ en: 'Trial ended — your site is safe. Upgrade to keep editing with AI.', uk: 'Тріал завершився — сайт у безпеці. Оновіться, щоб редагувати з AI.' })}
        </div>
      )}

      <FlowRunner />
      <ScenarioPanel />
    </div>
  )
}
