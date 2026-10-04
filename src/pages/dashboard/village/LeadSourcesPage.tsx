import { useState } from 'react'
import { CapoBackLink } from '../../../components/dashboard/CapoBackLink'
import { downloadCSV } from '../../../utils/emailExport'
import { testInstagramCommentImport, type LeadComment } from '../../../services/leadSources'

// MVP1 only — paste one public Instagram Reel/post URL, see exactly what a
// real provider (Apify's apidojo Instagram Comments Scraper, see the edge
// function) returns for it, nothing else. No Australia filtering, no AI
// scoring, no profile enrichment, no Bulk Curate handoff — those are only
// worth building once staff have manually checked that this data is real
// and usable. See CULO_Scrape_Founder_Qualification_Technical_Spec.md for
// the full later-phase plan this deliberately does not build yet.
//
// `embedded` drops the outer page chrome — same convention as
// VillageBulkImportPage, since this renders inside the Founder Management
// tab bar rather than as its own standalone route.

function leadsToCSV(leads: LeadComment[]): string {
  const headers = ['displayName', 'handle', 'profileUrl', 'commentText', 'sourceUrl', 'likeCount', 'createdAt']
  const esc = (v: string | number | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [
    headers.join(','),
    ...leads.map(l => [l.displayName, l.handle, l.profileUrl, l.commentText, l.sourceUrl, l.likeCount, l.createdAt].map(esc).join(',')),
  ].join('\n')
}

export function LeadSourcesPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<LeadComment[] | null>(null)
  // A real page of comments is mostly one-word noise ("edit", "Edit
  // please") repeated by dozens of different accounts — this lets staff
  // either hide that noise or isolate it (e.g. filter TO "claude" to find
  // the real intent-signal commenters). Client-side only, over whatever's
  // already been fetched — no extra provider spend to re-filter.
  const [filterWord, setFilterWord] = useState('')
  const [filterMode, setFilterMode] = useState<'exclude' | 'include'>('exclude')

  async function handleTest() {
    if (!url.trim()) { setError('Paste an Instagram post or Reel URL first.'); return }
    setLoading(true)
    setError(null)
    setComments(null)
    const result = await testInstagramCommentImport(url.trim())
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setComments(result.comments ?? [])
  }

  const word = filterWord.trim().toLowerCase()
  const filteredComments = comments && word
    ? comments.filter(c => {
        const hasWord = c.commentText.toLowerCase().includes(word)
        return filterMode === 'include' ? hasWord : !hasWord
      })
    : comments

  return (
    <div className={embedded ? '' : 'p-8 max-w-5xl'} style={embedded ? undefined : { fontFamily: "'DM Sans', sans-serif" }}>
      {!embedded && <CapoBackLink />}
      <div className={embedded ? '' : 'mt-4'}>
        {!embedded && <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO · Village Staff</p>}
        {!embedded && <h1 className="text-2xl font-bold text-[#2D2A26] mb-1">Lead Sources</h1>}
        <p className="text-sm text-[#6B7280] mb-6 max-w-2xl">
          Paste a public Instagram post or Reel URL to see the accessible public commenters. This is a data-quality
          test only — nothing here is saved, filtered for Australia, scored or sent anywhere. Check the results
          against Instagram directly before this goes any further.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/reel/…"
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
          />
          <button
            onClick={() => void handleTest()}
            disabled={loading}
            className="px-5 py-2.5 bg-[#C86A43] text-white text-sm font-semibold rounded-xl hover:bg-[#b05a35] disabled:opacity-60 transition-colors shrink-0"
          >
            {loading ? 'Importing…' : 'Test Comment Import'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {comments && (
          <div className="mt-6">
            {comments.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  value={filterWord}
                  onChange={e => setFilterWord(e.target.value)}
                  placeholder="Filter by word in comment (e.g. edit, claude)…"
                  className="flex-1 px-3 py-2 rounded-lg border border-[#E8E4DD] text-sm text-[#2D2A26] bg-white placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43] transition-colors"
                />
                <div className="flex rounded-lg border border-[#E8E4DD] overflow-hidden shrink-0">
                  <button
                    onClick={() => setFilterMode('exclude')}
                    className={`px-3 py-2 text-xs font-semibold transition-colors ${filterMode === 'exclude' ? 'bg-[#C86A43] text-white' : 'bg-white text-[#6B7280] hover:bg-[#F3EDE6]'}`}
                  >
                    Hide matches
                  </button>
                  <button
                    onClick={() => setFilterMode('include')}
                    className={`px-3 py-2 text-xs font-semibold transition-colors ${filterMode === 'include' ? 'bg-[#C86A43] text-white' : 'bg-white text-[#6B7280] hover:bg-[#F3EDE6]'}`}
                  >
                    Only matches
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#2D2A26]">
                {filteredComments!.length} commenter{filteredComments!.length === 1 ? '' : 's'}
                {word ? ` shown (of ${comments.length})` : ' returned'}
              </p>
              {filteredComments!.length > 0 && (
                <button
                  onClick={() => downloadCSV(leadsToCSV(filteredComments!), `lead-sources-${new Date().toISOString().slice(0, 10)}.csv`)}
                  className="text-xs font-semibold px-3 py-2 rounded-lg text-[#6B7280] bg-[#F3EDE6] hover:bg-[#E8E4DD] transition-colors"
                >
                  Download CSV
                </button>
              )}
            </div>
            {filteredComments!.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">
                {comments.length === 0 ? 'No accessible comments were found for this source.' : 'No comments match that filter.'}
              </p>
            ) : (
              <div className="border border-[#E8E4DD] rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8F5F0] text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                    <tr>
                      <th className="text-left px-4 py-2.5">Name</th>
                      <th className="text-left px-4 py-2.5">Handle</th>
                      <th className="text-left px-4 py-2.5">Comment</th>
                      <th className="text-left px-4 py-2.5">Likes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DD]">
                    {filteredComments!.map((c, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 font-medium text-[#2D2A26] whitespace-nowrap">{c.displayName}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <a href={c.profileUrl} target="_blank" rel="noopener noreferrer" className="text-[#C86A43] hover:underline">
                            @{c.handle}
                          </a>
                        </td>
                        <td className="px-4 py-2.5 text-[#6B7280] max-w-md">{c.commentText}</td>
                        <td className="px-4 py-2.5 text-[#9CA3AF]">{c.likeCount ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
