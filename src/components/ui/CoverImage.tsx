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

/**
 * Drop-in replacement for <img> on a cover/thumbnail. For YouTube-hosted
 * covers it requests the highest-res variant and falls back down the
 * ladder; for everything else it behaves exactly like <img>.
 */
export function CoverImage({ src, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  const ytimg = isYtimg(src)
  const [rung, setRung] = useState(0)

  const resolvedSrc = ytimg && typeof src === 'string'
    ? ytimgVariant(src, YTIMG_LADDER[Math.min(rung, YTIMG_LADDER.length - 1)])
    : src

  return (
    <img
      {...rest}
      src={resolvedSrc}
      onError={e => {
        if (ytimg && rung < YTIMG_LADDER.length - 1) {
          setRung(r => r + 1)
        } else {
          rest.onError?.(e)
        }
      }}
    />
  )
}
