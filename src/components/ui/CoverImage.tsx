import { useState, type ImgHTMLAttributes } from 'react'

// YouTube thumbnails imported at 480x360 (hqdefault) or smaller look soft
// once a card scales them up. YouTube also hosts a 1280x720 maxresdefault
// and a 640x480 sddefault for the same video at a predictable URL, so this
// upgrades any i.ytimg.com cover to the sharpest variant and steps back
// down on error (maxresdefault genuinely 404s for some older uploads).
const YTIMG_LADDER = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault'] as const

function ytimgVariant(url: string, name: string): string {
  return url.replace(/\/vi\/([\w-]+)\/[\w-]+\.jpg/, `/vi/$1/${name}.jpg`)
}

function isYtimg(url: string | undefined): url is string {
  return !!url && /(^https?:)?\/\/i\d?\.ytimg\.com\/vi\//.test(url)
}

interface CoverImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  // Shown instead of a bare broken/blank <img> when there's no src at all,
  // or the real image genuinely fails to load — one of the designed
  // /placeholders/village-*.svg per content type, not the browser's broken-
  // image icon sitting on a bare dark card background.
  fallbackSrc?: string
}

/**
 * Drop-in replacement for <img> on a cover/thumbnail. For YouTube-hosted
 * covers it requests the highest-res variant and falls back down the
 * ladder; for everything else it behaves exactly like <img>, except a
 * missing or failed src renders `fallbackSrc` (when given) instead of a
 * blank box.
 */
export function CoverImage({ src, fallbackSrc, ...rest }: CoverImageProps) {
  const ytimg = isYtimg(src)
  const [rung, setRung] = useState(0)
  const [failed, setFailed] = useState(false)

  const noRealSrc = !src || (typeof src === 'string' && src.trim() === '')
  const resolvedSrc = failed || noRealSrc
    ? fallbackSrc ?? src
    : ytimg && typeof src === 'string'
      ? ytimgVariant(src, YTIMG_LADDER[Math.min(rung, YTIMG_LADDER.length - 1)])
      : src

  return (
    <img
      {...rest}
      src={resolvedSrc}
      onError={e => {
        if (ytimg && rung < YTIMG_LADDER.length - 1) {
          setRung(r => r + 1)
        } else if (fallbackSrc && !failed) {
          setFailed(true)
        } else {
          rest.onError?.(e)
        }
      }}
      // A missing maxresdefault.jpg doesn't reliably 404 — YouTube's CDN
      // often serves a 200 OK with a generic 120x90 grey placeholder
      // instead, so onError above never fires and the card is left
      // stretching that placeholder to fill the whole cover, reading as a
      // blank grey box. That placeholder's fixed 120x90 size is the tell:
      // step down the ladder the same as a real error would, and fall back
      // once the ladder's exhausted too.
      onLoad={e => {
        const img = e.currentTarget
        if (ytimg && rung < YTIMG_LADDER.length - 1 && img.naturalWidth === 120 && img.naturalHeight === 90) {
          setRung(r => r + 1)
        } else if (ytimg && img.naturalWidth === 120 && img.naturalHeight === 90 && fallbackSrc && !failed) {
          setFailed(true)
        } else {
          rest.onLoad?.(e)
        }
      }}
    />
  )
}
