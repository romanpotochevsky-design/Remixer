/**
 * UPLOADED PHOTOS — the bytes, kept OUT of the world.
 *
 * `World.siteEdits.photo` holds `{ kind: 'upload', id }`; the picture itself lives here, under its
 * own storage key. Why not in the world: `syncUrl` (state/world.ts) serialises the WHOLE world to
 * localStorage on every `set()` — every chat beat, every console click — and a data URL inside it
 * turned each write from ~0.1 ms into ~40 ms (measured by the architecture review, 30.09.2026,
 * headless Chromium, 1.76 MB world), got copied into every stash slice on a site switch, and a
 * quota hit would have silently stopped ALL persistence. Here a quota hit fails ONE upload, loudly.
 *
 * Pictures are DOWNSCALED before they are kept (`fileToPhoto`, longest side `MAX_SIDE`): the site
 * never shows more than ~800 px of a photo, the artifact page lives inside claude.ai's sandbox
 * where storage is small, and a phone snapshot is 4000 px of nothing the page can use.
 *
 * `data:` URLs, not `blob:`: the published page's CSP already serves `data:` images (the CSS masks
 * ship that way), a blob URL dies with the tab, and a data URL is what localStorage can hold.
 */

const KEY = 'remixer-prototype/media/v1'
export const MAX_SIDE = 800

type Store = Record<string, string>

let cache: Store | null = null

function load(): Store {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || '{}') as Store
  } catch {
    cache = {}
  }
  return cache
}

/** The data URL of an upload, or null when this browser never saw it (another machine, a
 *  cleared store) — the photo host then falls back to the site's own picture. */
export function getUpload(id: string): string | null {
  return load()[id] ?? null
}

/** Keep a picture. Returns null when storage refuses (quota) — the caller says so to the user. */
export function putUpload(id: string, dataUrl: string): boolean {
  const store = { ...load(), [id]: dataUrl }
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
    cache = store
    return true
  } catch {
    /* keep it for this session at least: the page can show it, a reload may not */
    cache = store
    return false
  }
}

export interface UploadedPhoto {
  id: string
  src: string
  w: number
  h: number
  name: string
}

/** Read a chosen file, downscale it to `MAX_SIDE`, and hand back a data URL with its size. */
export function fileToPhoto(file: File): Promise<UploadedPhoto> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.max(1, Math.round(img.naturalWidth * k))
      const h = Math.max(1, Math.round(img.naturalHeight * k))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('no canvas')); return }
      ctx.drawImage(img, 0, 0, w, h)
      /* WebP where the browser writes it (Chromium), JPEG otherwise — both far smaller than PNG */
      let src = canvas.toDataURL('image/webp', 0.82)
      if (!src.startsWith('data:image/webp')) src = canvas.toDataURL('image/jpeg', 0.85)
      URL.revokeObjectURL(url)
      resolve({ id: `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, src, w, h, name: file.name })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('not an image')) }
    img.src = url
  })
}
