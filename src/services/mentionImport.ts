// "Featured on someone else's blog" — the single-article counterpart to
// connectedSources.ts's feed-based import. That path requires discovering
// an RSS/Atom feed, which works for a founder's own blog but is a dead end
// for a third-party site they don't control and likely can't find the feed
// URL for (see WebsiteConnectForm's single-article mode). This path needs
// no feed at all: resolve-article reads the one page, editorial-write's
// mention_article type writes an ORIGINAL piece from that excerpt (never a
// copy — see its prompt), and the result lands as a normal draft in the
// founder's Import review queue, ready to review and publish like any
// other import.

import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { resolveArticle } from './websiteResolve'
import { importedContentService } from './importedContent'
import type { ImportedContent } from '../types/importedContent'

export class MentionImportError extends Error {}

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}

export async function importMentionArticle(
  founderId: string,
  founderName: string,
  articleUrl: string,
): Promise<ImportedContent> {
  if (!isSupabaseConfigured || !supabase) throw new MentionImportError('Not configured.')

  const resolved = await resolveArticle(articleUrl)
  if (resolved.status === 'error') throw new MentionImportError(resolved.message)
  const { article } = resolved

  const { data, error } = await supabase.functions.invoke<{ draft?: { title?: string; body: string }; error?: string }>(
    'editorial-write',
    {
      body: {
        type: 'mention_article',
        founderName,
        firstName: firstNameOf(founderName),
        mentionSource: { url: article.url, title: article.title, siteName: article.siteName, excerpt: article.excerpt },
      },
    },
  )
  if (error) throw new MentionImportError(`Could not reach the writer: ${error.message}`)
  if (data?.error || !data?.draft?.body) throw new MentionImportError(data?.error ?? 'The writer returned nothing.')

  const draft: ImportedContent = {
    id: crypto.randomUUID(),
    founderId,
    sourcePlatform: 'website',
    originalUrl: article.url,
    canonicalUrl: article.url,
    thumbnailUrl: article.image,
    title: data.draft.title || article.title,
    description: data.draft.body,
    originalAuthor: article.siteName,
    topics: [],
    locations: [],
    importedAt: new Date().toISOString(),
    status: 'draft',
    visibility: 'private',
    thirdPartyAuthored: true,
    // Written by the mention_article Writer, not scraped text — already
    // safe for safeStoryBody's gate in publishStory.ts the moment it's
    // created, same as a manual "Rewrite with AI" pass.
    descriptionRewrittenAt: new Date().toISOString(),
    ctaLabel: 'View original',
    ctaUrl: article.url,
  }

  const result = await importedContentService.upsert(draft)
  if (!result.success) throw new MentionImportError(result.error ?? 'Could not save this import.')
  return draft
}
