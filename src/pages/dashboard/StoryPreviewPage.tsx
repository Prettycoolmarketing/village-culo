import { Link, useParams } from 'react-router-dom'
import { importedContentService } from '../../services/importedContent'
import { buildStoryFromImport } from '../../services/publishStory'
import { getFounder } from '../../services/founders'
import { getBusiness } from '../../services/businesses'
import { normalizeUrl } from '../../utils/url'

// A real preview of what an imported piece will look like as a published
// story — built the exact same way publishing does (buildStoryFromImport),
// just never saved. Exists because a founder had no way to see a piece with
// no external link (a raw Instagram archive file, for example) until after
// actually publishing it live.
export function StoryPreviewPage() {
  const { importId } = useParams<{ importId: string }>()
  const item = importId ? importedContentService.get(importId) : undefined
  const founder = item ? getFounder(item.founderId) : undefined
  const business = item?.businessId ? getBusiness(item.businessId) : undefined
  const story = item && founder ? buildStoryFromImport(item, founder) : undefined

  if (!item || !founder || !story) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-sm font-semibold text-[#2D2A26]">Couldn't load a preview for this.</p>
        <Link to="/dashboard/profile?tab=content" className="text-sm text-[#C86A43] hover:underline mt-2 inline-block">
          ← Back to Content
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F7FA]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="bg-[#2D2A26] text-white text-center text-xs font-semibold py-2 px-4">
        Preview — not published. This is roughly how it'll look on the Village once you publish.
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link to="/dashboard/profile?tab=content" className="text-xs font-semibold text-[#6B7280] hover:text-[#2D2A26] mb-4 inline-block">
          ← Back to Content
        </Link>

        <div className="bg-white rounded-2xl border border-[#E8E4DD] overflow-hidden">
          {story.coverImage && !story.coverImage.includes('/placeholders/') && (
            <img src={story.coverImage} alt="" className="w-full aspect-video object-cover" />
          )}

          <div className="p-6 flex flex-col gap-4">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#2D2A26] leading-tight">{story.title}</h1>
              <p className="text-sm text-[#6B7280] mt-1">
                {founder.name}{business ? ` · ${business.name}` : ''} · {story.location.name}
              </p>
            </div>

            {story.reelUrl && (
              <div className="rounded-xl overflow-hidden bg-black">
                <video src={normalizeUrl(story.reelUrl)} controls className="w-full max-h-[70vh]" />
              </div>
            )}

            {story.audioUrl && (
              <audio src={normalizeUrl(story.audioUrl)} controls className="w-full" />
            )}

            {story.carouselImages && story.carouselImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {story.carouselImages.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-lg" />
                ))}
              </div>
            )}

            {/* story.subtitle, not summary — summary is SEO/meta text that
                falls back to the same caption as blog when no subtitle was
                ever set, which printed the same paragraph twice here. The
                real published story page only ever shows subtitle + blog. */}
            {story.subtitle && <p className="text-sm text-[#4B4845] leading-relaxed">{story.subtitle}</p>}

            {story.blog && (
              <div className="text-sm text-[#2D2A26] leading-relaxed whitespace-pre-wrap border-t border-[#F3EDE6] pt-4">
                {story.blog}
              </div>
            )}

            {story.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-[#F3EDE6] pt-4">
                {story.topics.map(t => (
                  <span key={t.id} className="text-xs px-2.5 py-1 rounded-full bg-[#F3EDE6] text-[#6B7280]">{t.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
