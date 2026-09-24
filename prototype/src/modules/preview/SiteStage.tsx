/**
 * WHAT THE CANVAS SHOWS FOR THE SITE THE BUILDER STANDS IN (`world.site`, 25.09.2026).
 *
 * The prototype has ONE generated site it can render — fit-ration (SitePreview.tsx) — and a
 * shelf of others it only has drawings of (modules/home/thumbs.tsx). A site drawn `'live'`
 * renders the real page; any other renders its drawing at the canvas's full width, top-aligned
 * and scrolling, exactly as the template picker's stage shows a template (design-system §5
 * «Миниатюра в карточке и в полноэкранном превью — ОДНА картинка в двух масштабах»). The card
 * on the shelf and this stage are therefore the same picture at two scales for every site,
 * which is what the shelf's flight needs at both ends.
 *
 * A drawn site's pages do not exist as pages, so the page switcher's rows change nothing on
 * it; said to the designer, not hidden.
 */
import { useWorld, currentSite } from '@/state/world'
import { SitePreview } from './SitePreview'
import { Thumb } from '@/modules/home/thumbs'
import { ScrollArea } from '@/ui/ScrollArea'

export function SiteStage() {
  const project = useWorld((s) => currentSite(s.world))
  if (!project || project.thumb === 'live') return <SitePreview />
  return (
    <ScrollArea className="h-full" thumb="auto" innerClassName="bg-[var(--gray-900)]">
      <div className="relative w-full" style={{ aspectRatio: '233.333 / 218' }} data-site-drawing={project.thumb}>
        <Thumb id={project.thumb} className="absolute inset-0" />
      </div>
    </ScrollArea>
  )
}
