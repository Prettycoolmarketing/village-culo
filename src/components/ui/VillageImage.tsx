type PlaceholderType = 'story' | 'cover' | 'library' | 'event' | 'location' | 'logo' | 'video'

interface VillageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholder?: PlaceholderType
}

export function VillageImage({
  placeholder = 'cover',
  src,
  onError,
  ...props
}: VillageImageProps) {
  const fallbackSrc = `/placeholders/village-${placeholder}.svg`
  const resolvedSrc = src || fallbackSrc

  return (
    <img
      src={resolvedSrc}
      onError={(e) => {
        const img = e.currentTarget
        if (img.src !== fallbackSrc) {
          img.src = fallbackSrc
        }
        onError?.(e)
      }}
      {...props}
    />
  )
}
