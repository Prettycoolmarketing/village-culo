import { slugify } from '../utils/slugify'
import { getFounderBySlug, getFounderByLinkedIn, getFounderByInstagram, normalizeLinkedInUrl, normalizeInstagramUrl, updateFounder } from './founders'
import { getBusinessBySlug, updateBusiness } from './businesses'
import { importedContentService, buildDraftImport } from './importedContent'
import { importedContentToInput, villageContentIntelligenceService } from './villageIntelligence'
import { buildStoryFromImport, publishStoryCore } from './publishStory'
import type { WriteResult } from '../lib/entityStore'
import { locations } from '../data/locations'
import { industries } from '../data/industries'
import { topics as ALL_TOPICS } from '../data/topics'
import type { Founder, Business, Location, Industry, Topic } from '../types'
import type { ImportedContent } from '../types/importedContent'
import type {
  VillageImportPackage,
  VillageImportFounder,
  VillageImportBusiness,
  VillageImportContent,
  VIFFounderPreview,
  VIFValidationResult,
  VIFImportOptions,
  VIFImportResult,
  VIFImportedFounder,
} from '../types/villageImport'

// ─── Location matching ────────────────────────────────────────────────────────

// A founder with no city/state given (common for a remote-first or
// nationally-known guest) used to silently default to locations[0]
// (Brisbane) — a specific, wrong-looking city with no basis in anything
// the row actually said. 'regional-remote' ("Regional or Remote
// Australia") is the real, honest fallback: still correctly Australian,
// but doesn't invent a city nobody claimed.
const UNKNOWN_LOCATION_FALLBACK_ID = 'regional-remote'

function resolveLocation(city?: string, state?: string): Location {
  if (city || state) {
    const needle = `${city ?? ''} ${state ?? ''}`.toLowerCase()
    const match = locations.find(l =>
      needle.includes(l.name.toLowerCase()) ||
      needle.includes(l.state.toLowerCase()) ||
      (l.slug && needle.includes(l.slug))
    )
    if (match) return match
  }
  return locations.find(l => l.id === UNKNOWN_LOCATION_FALLBACK_ID) ?? locations[0]
}

// ─── Industry matching ────────────────────────────────────────────────────────

function resolveIndustry(industryNames?: string[]): Industry {
  if (industryNames && industryNames.length > 0) {
    const first = industryNames[0].toLowerCase()
    const match = industries.find(i =>
      i.name.toLowerCase().includes(first) || first.includes(i.name.toLowerCase())
    )
    if (match) return match
  }
  return industries[0]
}

// ─── Topic matching ───────────────────────────────────────────────────────────

function resolveTopics(topicNames?: string[]): Topic[] {
  if (!topicNames || topicNames.length === 0) return []
  return topicNames
    .map(name => {
      const lower = name.toLowerCase()
      return ALL_TOPICS.find(t =>
        t.name.toLowerCase().includes(lower) || lower.includes(t.name.toLowerCase())
      )
    })
    .filter((t): t is Topic => !!t)
    .slice(0, 10)
}

// ─── Slug uniqueness ──────────────────────────────────────────────────────────

function uniqueSlug(base: string, taken: Set<string>): string {
  let candidate = base
  let n = 2
  while (taken.has(candidate) || !!getFounderBySlug(candidate)) {
    candidate = `${base}-${n}`
    n++
  }
  return candidate
}

function uniqueBizSlug(base: string, taken: Set<string>): string {
  let candidate = base
  let n = 2
  while (taken.has(candidate) || !!getBusinessBySlug(candidate)) {
    candidate = `${base}-${n}`
    n++
  }
  return candidate
}

// ─── Supplementary notes builder ─────────────────────────────────────────────
// Books, courses, events, communities stored as structured text until dedicated
// entity types exist.

function buildSupplementaryNotes(f: VillageImportFounder, adminNotes?: string): string | undefined {
  const parts: string[] = []
  if (adminNotes) parts.push(`ADMIN NOTES: ${adminNotes}`)
  if (f.notes) parts.push(`RESEARCH NOTES: ${f.notes}`)
  if (f.speakingTopics && f.speakingTopics.length > 0) {
    parts.push(`SPEAKING TOPICS: ${f.speakingTopics.join(', ')}`)
  }
  if (f.books && f.books.length > 0) {
    const bk = f.books.map(b => `${b.title}${b.url ? ` (${b.url})` : ''}${b.description ? ` — ${b.description}` : ''}`).join(' | ')
    parts.push(`BOOKS: ${bk}`)
  }
  if (f.courses && f.courses.length > 0) {
    const cs = f.courses.map(c => `${c.title}${c.url ? ` (${c.url})` : ''}`).join(' | ')
    parts.push(`COURSES: ${cs}`)
  }
  if (f.events && f.events.length > 0) {
    const ev = f.events.map(e => `${e.name}${e.date ? ` [${e.date}]` : ''}${e.location ? ` @ ${e.location}` : ''}`).join(' | ')
    parts.push(`EVENTS: ${ev}`)
  }
  if (f.communities && f.communities.length > 0) {
    const cm = f.communities.map(c => `${c.name}${c.url ? ` (${c.url})` : ''}`).join(' | ')
    parts.push(`COMMUNITIES: ${cm}`)
  }
  if (f.recommendations && f.recommendations.length > 0) {
    const rc = f.recommendations.map(r => `${r.name}${r.type ? ` [${r.type}]` : ''}${r.url ? ` (${r.url})` : ''}`).join(' | ')
    parts.push(`RECOMMENDATIONS: ${rc}`)
  }
  if (f.sourceLinks && f.sourceLinks.length > 0) {
    parts.push(`SOURCE LINKS: ${f.sourceLinks.join(', ')}`)
  }
  return parts.length > 0 ? parts.join('\n') : undefined
}

// ─── URL validation ───────────────────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ─── Raw spreadsheet row adapter ───────────────────────────────────────────────
// The curation workflow's real output (Claude in Excel, Sellable, a plain
// spreadsheet-to-JSON export) is a flat array of rows with human column
// headers ("Full Name", "YouTube URL", "Business Location", …) — not the
// camelCase VillageImportFounder shape, and not wrapped in a {batchName,
// founders: [...]} package at all. That's not a malformed file, it's just a
// different, equally real shape; this converts it into one instead of
// rejecting it.

function str(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t.length > 0 ? t : undefined
}

// "construction contracts, contract administration, AI in construction" → 3
// trimmed, non-empty entries — used for Topics/Industries/Speaking Topics,
// which all arrive as one comma-separated cell rather than a real array.
function splitList(v: unknown): string[] | undefined {
  const s = str(v)
  if (!s) return undefined
  const parts = s.split(',').map(p => p.trim()).filter(Boolean)
  return parts.length > 0 ? parts : undefined
}

// A row that already looks like a proper VillageImportFounder (has a
// camelCase fullName) passes through untouched; only a raw spreadsheet row
// (has "Full Name" instead) gets converted.
function looksLikeRawRow(row: Record<string, unknown>): boolean {
  return !('fullName' in row) && ('Full Name' in row || 'Full name' in row)
}

function normalizeRawFounderRow(row: Record<string, unknown>): VillageImportFounder {
  const fullName = str(row['Full Name']) ?? str(row['Full name']) ?? 'Unknown Founder'

  // Curator's own working notes (fit assessment, evidence, flagged link
  // issues) — not part of the founder's public profile, but too useful to
  // silently drop. Lands in `notes`, which buildSupplementaryNotes() already
  // surfaces as admin-only claimNotes on the founder record.
  const curatorNotes = [
    str(row['Culo Village Fit']) && `Culo Village Fit: ${row['Culo Village Fit']}`,
    str(row['Fit Evidence']) && `Fit Evidence: ${row['Fit Evidence']}`,
    str(row['Link Issues']) && `Link Issues: ${row['Link Issues']}`,
    str(row['Other businesses']) && `Other businesses: ${row['Other businesses']}`,
  ].filter((s): s is string => !!s).join('\n')

  const businessName = str(row['Business Name'])
  const businesses: VillageImportBusiness[] | undefined = businessName ? [{
    name: businessName,
    website: str(row['Business Website']),
    description: str(row['Business Description']),
    industry: str(row['Industry']),
    role: str(row['Role']),
    location: str(row['Business Location']),
  }] : undefined

  // One content entry per real link this founder actually has — Article,
  // YouTube, Podcast — not just a single "best" one. The whole point of a
  // curated import is that it should read like this founder connected their
  // own accounts and published each piece themselves, the same as anyone
  // who joins directly; picking only one link and dropping the rest doesn't
  // match that. Every entry gets the founder's own bio as its description —
  // without it, an entry has no description of its own, falls well under
  // MIN_AUTO_PUBLISH_DESCRIPTION_LENGTH, and silently stays a bare linked
  // embed instead of becoming its own real, published article page.
  const headline = str(row['Headline'])
  const bio = str(row['Bio'])
  const articleUrl  = str(row['Article URL'])
  const youtubeUrl  = str(row['YouTube URL'])
  const podcastUrl  = str(row['Podcast URL'])
  const content: VillageImportContent[] = (
    [
      articleUrl  ? { title: headline ?? `${fullName}'s article`, url: articleUrl,  description: bio } : undefined,
      youtubeUrl  ? { title: `${fullName} on YouTube`,            url: youtubeUrl,  description: bio } : undefined,
      podcastUrl  ? { title: `${fullName} on Podcast`,            url: podcastUrl,  description: bio } : undefined,
    ] as (VillageImportContent | undefined)[]
  ).filter((c): c is VillageImportContent => !!c)

  const digitalProductUrl = str(row['Digital Product URL'])

  return {
    fullName,
    headline,
    bio,
    country: str(row['Country']),
    state: str(row['State']),
    city: str(row['City']),
    website: str(row['Website']),
    linkedinUrl: str(row['LinkedIn URL']),
    youtubeUrl: str(row['YouTube URL']),
    instagramUrl: str(row['Instagram URL']),
    tiktokUrl: str(row['TikTok URL']),
    podcastUrl: str(row['Podcast URL']),
    claimEmail: str(row['Claim Email']),
    topics: splitList(row['Topics']),
    industries: splitList(row['Industries']),
    speakingTopics: splitList(row['Speaking Topics']),
    businesses,
    content,
    sourceLinks: digitalProductUrl ? [digitalProductUrl] : undefined,
    notes: curatorNotes || undefined,
  }
}

// ─── Validate ─────────────────────────────────────────────────────────────────

// `curatedBy` is whichever staff member is actually running this import
// (their derived display name, e.g. "Shakas" or "Gia" — see
// DashboardBulkImportPage) — always appended to the batch's name so the
// import history is attributable at a glance, whether the file brought its
// own name or not. Multiple staff each importing their own lists is exactly
// the case this exists for: "Untitled batch — 2026-09-26" told you nothing
// about who actually curated it.
function withCuratorLabel(name: string, curatedBy?: string): string {
  if (!curatedBy) return name
  return `${name} · curated by ${curatedBy}`
}

export function parseVIF(raw: string, curatedBy?: string): { pkg: VillageImportPackage | null; error: string | null } {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed === null || typeof parsed !== 'object') return { pkg: null, error: 'JSON must be an object or an array of founders.' }

    // A bare array — a raw spreadsheet export with no {batchName, founders}
    // wrapper at all — is founders on its own, not a malformed package.
    const isBareFounderArray = Array.isArray(parsed)
    const founderList = isBareFounderArray ? (parsed as unknown[]) : undefined

    const obj: Record<string, unknown> = isBareFounderArray
      ? { founders: founderList }
      : (parsed as Record<string, unknown>)

    // batchName is only ever used as a label (the import history log, the
    // preview screen) — nothing downstream depends on it structurally, so
    // hard-failing an otherwise-good file just because whatever produced it
    // (Claude, ChatGPT, Sellable) used a slightly different key, or left it
    // out altogether, was blocking real, importable batches for no real
    // reason. Accept the common alternate keys, and default it rather than
    // reject the file if none of them are present.
    if (!obj.batchName) {
      const altKey = ['batch_name', 'name', 'title'].find(k => typeof obj[k] === 'string' && (obj[k] as string).trim())
      const base = altKey
        ? (obj[altKey] as string)
        : new Date().toISOString().slice(0, 10)
      obj.batchName = withCuratorLabel(base, curatedBy)
    } else {
      obj.batchName = withCuratorLabel(obj.batchName as string, curatedBy)
    }

    if (!Array.isArray(obj.founders)) return { pkg: null, error: 'Missing required field: founders (must be an array)' }
    if (obj.founders.length === 0) return { pkg: null, error: 'founders array is empty' }

    // Convert any row still using raw spreadsheet column names (whether the
    // file was a bare array or already wrapped in {batchName, founders}) —
    // real VIF founders pass through untouched.
    obj.founders = (obj.founders as unknown[]).map(f => {
      if (typeof f !== 'object' || f === null) return f
      const row = f as Record<string, unknown>
      return looksLikeRawRow(row) ? normalizeRawFounderRow(row) : row
    })

    return { pkg: obj as unknown as VillageImportPackage, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON'
    return { pkg: null, error: `JSON parse error: ${msg}` }
  }
}

export function validateVIF(pkg: VillageImportPackage): VIFValidationResult {
  const globalErrors: string[] = []
  const globalWarnings: string[] = []
  const slugsTaken = new Set<string>()
  const founders: VIFFounderPreview[] = []
  let totalBusinesses = 0
  let totalContent = 0

  for (let i = 0; i < pkg.founders.length; i++) {
    const f = pkg.founders[i]
    const errors: string[] = []
    const warnings: string[] = []

    const displayName = f.preferredName?.trim() || f.fullName?.trim() || `Founder ${i + 1}`

    if (!f.fullName?.trim()) errors.push('fullName is required')
    if (!f.bio?.trim()) warnings.push('bio is missing — profile will have no description')
    if (!f.city && !f.state) warnings.push('No location — will default to Regional or Remote Australia')
    if (!f.industries || f.industries.length === 0) warnings.push('No industry — will use first available industry')

    const baseSlug = f.slug?.trim() || slugify(f.preferredName?.trim() || f.fullName?.trim() || `founder-${i}`)
    let resolvedSlug = baseSlug
    if (slugsTaken.has(resolvedSlug) || !!getFounderBySlug(resolvedSlug)) {
      if (slugsTaken.has(resolvedSlug)) {
        errors.push(`Slug "${resolvedSlug}" is already used within this batch`)
      } else {
        warnings.push(`Slug "${resolvedSlug}" already exists in Village — will auto-suffix`)
      }
      let n = 2
      while (slugsTaken.has(resolvedSlug) || !!getFounderBySlug(resolvedSlug)) {
        resolvedSlug = `${baseSlug}-${n}`
        n++
      }
    }
    slugsTaken.add(resolvedSlug)

    const isDuplicate = !!getFounderBySlug(baseSlug)

    const bizCount = f.businesses?.length ?? 0
    const contentCount = f.content?.length ?? 0
    totalBusinesses += bizCount
    totalContent += contentCount

    if (f.website && !isValidUrl(f.website)) warnings.push(`website URL appears invalid: ${f.website}`)
    if (f.linkedinUrl && !isValidUrl(f.linkedinUrl)) warnings.push('linkedinUrl appears invalid')
    if (f.youtubeUrl && !isValidUrl(f.youtubeUrl)) warnings.push('youtubeUrl appears invalid')

    f.content?.forEach((c, ci) => {
      if (!c.url) errors.push(`content[${ci}] missing url`)
      else if (!isValidUrl(c.url)) warnings.push(`content[${ci}] "${c.title}" has an invalid URL`)
    })

    founders.push({
      index: i,
      displayName,
      resolvedSlug,
      businessCount: bizCount,
      contentCount,
      isDuplicate,
      errors,
      warnings,
    })
  }

  const hasErrors = founders.some(f => f.errors.length > 0) || globalErrors.length > 0

  return {
    isValid: !hasErrors,
    founderCount: pkg.founders.length,
    totalBusinesses,
    totalContent,
    founders,
    globalErrors,
    globalWarnings,
  }
}

// ─── Import ───────────────────────────────────────────────────────────────────

/**
 * Awaits a write and retries it once on failure before giving up — bulk import
 * is exactly the situation where a single transient network hiccup shouldn't
 * sink one founder's record out of a 500-row batch.
 */
async function writeWithRetry(write: () => Promise<WriteResult>): Promise<WriteResult> {
  const first = await write()
  if (first.success) return first
  return write()
}

export async function importVIF(pkg: VillageImportPackage, options: VIFImportOptions): Promise<VIFImportResult> {
  const now = new Date().toISOString()
  const created: VIFImportedFounder[] = []
  const skipped: string[] = []
  const errors: { name: string; error: string }[] = []
  let businessesCreated = 0
  let contentCreated = 0
  let intelGenerated = 0
  let storiesCreated = 0
  // Below this, a content entry's description isn't enough to write a real
  // blog from — it stays an ImportedContent-only embed rather than
  // becoming a Story page with almost nothing on it.
  const MIN_AUTO_PUBLISH_DESCRIPTION_LENGTH = 40

  const slugsTaken = new Set<string>()
  const bizSlugsTaken = new Set<string>()

  for (const f of pkg.founders) {
    const displayName = f.preferredName?.trim() || f.fullName?.trim() || 'Unknown'

    try {
      // Identity match — LinkedIn or Instagram first, since either
      // actually identifies a real person, unlike a name two different
      // people could share (this has already happened on a real curated
      // batch: two different people named Rohit Bhargava). Instagram
      // matters as its own check, not just a LinkedIn substitute — a
      // founder can post under a personal name on LinkedIn but under a
      // completely different brand/handle on Instagram (e.g. "Anaita
      // Sukar" personally, "Sell Anything Online" as her Instagram handle),
      // so a name match alone would neither catch that as a duplicate nor
      // correctly tell two different people apart. Falls back to the
      // name/slug match only when neither side has a social URL to check —
      // if BOTH sides have one and they disagree, that's positive evidence
      // this is a different person with the same name, not a duplicate.
      const baseSlug = f.slug?.trim() || slugify(displayName)
      const bySlug = getFounderBySlug(baseSlug)
      const byLinkedIn = f.linkedinUrl?.trim() ? getFounderByLinkedIn(f.linkedinUrl) : undefined
      const byInstagram = !byLinkedIn && f.instagramUrl?.trim() ? getFounderByInstagram(f.instagramUrl) : undefined
      const socialMatch = byLinkedIn ?? byInstagram
      const slugMatchIsActuallyDifferentPerson = !!(
        !socialMatch && (
          (bySlug?.linkedin?.trim() && f.linkedinUrl?.trim() && normalizeLinkedInUrl(bySlug.linkedin) !== normalizeLinkedInUrl(f.linkedinUrl)) ||
          (bySlug?.instagram?.trim() && f.instagramUrl?.trim() && normalizeInstagramUrl(bySlug.instagram) !== normalizeInstagramUrl(f.instagramUrl))
        )
      )
      const existingFounder = socialMatch ?? (slugMatchIsActuallyDifferentPerson ? undefined : bySlug)

      if (existingFounder) {
        if (options.skipDuplicates && !options.overwriteDuplicates) {
          skipped.push(displayName)
          continue
        }
      }

      const founderId = existingFounder?.id ?? crypto.randomUUID()
      const resolvedSlug = existingFounder ? existingFounder.slug : uniqueSlug(baseSlug, slugsTaken)
      slugsTaken.add(resolvedSlug)

      // Resolve location, industry, topics
      const location = resolveLocation(f.city, f.state)
      const industry = resolveIndustry(f.industries)
      const topics   = resolveTopics(f.topics)

      // Businesses
      let primaryBusinessId = existingFounder?.businessId ?? ''
      if (options.createBusinesses && f.businesses && f.businesses.length > 0) {
        for (let bi = 0; bi < f.businesses.length; bi++) {
          const vb = f.businesses[bi]
          const bizBaseSlug = vb.slug?.trim() || slugify(vb.name)
          const existingBiz = getBusinessBySlug(bizBaseSlug)
          if (existingBiz) {
            if (bi === 0 && !primaryBusinessId) primaryBusinessId = existingBiz.id
            continue
          }
          const bizSlug = uniqueBizSlug(bizBaseSlug, bizSlugsTaken)
          bizSlugsTaken.add(bizSlug)

          const bizIndustry = vb.industry
            ? (industries.find(i => i.name.toLowerCase().includes(vb.industry!.toLowerCase())) ?? industry)
            : industry

          const newBiz: Business = {
            id:          crypto.randomUUID(),
            slug:        bizSlug,
            name:        vb.name,
            tagline:     '',
            description: vb.description ?? `${vb.name} — founded by ${displayName}.`,
            // vb.logoUrl was being silently discarded here, always
            // overwritten with the generic placeholder graphic even when a
            // real logo was provided. Left blank when there genuinely isn't
            // one — BizLogo already falls back to a clean first-letter
            // badge instead of a broken image, no placeholder file needed.
            // coverImage still needs a real fallback: a bare <img>, no
            // built-in initial-letter treatment like BizLogo has.
            logo:        vb.logoUrl?.trim() || '',
            coverImage:  '/placeholders/village-cover.svg',
            founderId,
            location,
            industry:    bizIndustry,
            topics,
            website:     vb.website || undefined,
            offers:      [],
            status:      'published',
            featured:    false,
            createdAt:   now,
          }
          const bizResult = await writeWithRetry(() => updateBusiness(newBiz))
          if (!bizResult.success) {
            throw new Error(`Failed to save business "${vb.name}": ${bizResult.error ?? 'unknown error'}`)
          }
          businessesCreated++
          if (bi === 0 && !primaryBusinessId) primaryBusinessId = newBiz.id
        }
      }

      // Supplementary notes
      const claimNotes = buildSupplementaryNotes(f)

      // Founder record
      const founder: Founder = {
        id:         founderId,
        slug:       resolvedSlug,
        name:       displayName,
        bio:        f.bio?.trim() ?? '',
        avatar:     f.profileImageUrl?.trim() ?? '',
        location,
        industry,
        businessId: primaryBusinessId,
        topics,
        website:      f.website?.trim() || undefined,
        instagram:    f.instagramUrl?.trim() || undefined,
        linkedin:     f.linkedinUrl?.trim() || undefined,
        youtube:      f.youtubeUrl?.trim() || undefined,
        tiktok:       f.tiktokUrl?.trim() || undefined,
        podcast:      f.podcastUrl?.trim() || undefined,
        newsletter:   f.newsletterUrl?.trim() || undefined,
        claimEmail:   f.claimEmail?.trim() || existingFounder?.claimEmail || undefined,
        // A brand-new curated founder lands as a draft — invisible in
        // Founders, the homepage, search, everywhere public-facing relies
        // on getFounders({ publicOnly: true }) — until a staff member has
        // actually opened their profile and pressed Publish. Overwriting an
        // existing founder (already published, claimed, whatever they were)
        // keeps their real status; this only affects genuinely new rows.
        status:       existingFounder?.status ?? 'draft',
        featured:     false,
        createdAt:    existingFounder?.createdAt ?? now,
        profileStatus: 'village-curated',
        isClaimable:  true,
        curatedBy:    'CULO Village',
        curatedAt:    now,
        claimNotes:   claimNotes || undefined,
      }
      const founderResult = await writeWithRetry(() => updateFounder(founder))
      if (!founderResult.success) {
        throw new Error(`Failed to save founder: ${founderResult.error ?? 'unknown error'}`)
      }

      // Content
      if (f.content && f.content.length > 0) {
        for (const c of f.content) {
          if (!c.url || !isValidUrl(c.url)) continue

          const contentStatus: ImportedContent['status'] = options.publishContent
            ? (c.status ?? 'published')
            : 'draft'

          const draft = buildDraftImport(founderId, c.url)

          // Find matching business by name
          let contentBizId: string | undefined
          if (c.businessName && options.createBusinesses) {
            const matchedBiz = f.businesses?.find(b =>
              b.name.toLowerCase().includes(c.businessName!.toLowerCase())
            )
            if (matchedBiz) {
              const mb = getBusinessBySlug(matchedBiz.slug?.trim() || slugify(matchedBiz.name))
              if (mb) contentBizId = mb.id
            }
          }

          const item: ImportedContent = {
            ...draft,
            title:      c.title || draft.title,
            description: c.description || draft.description,
            businessId: contentBizId ?? (primaryBusinessId || undefined),
            status:     contentStatus,
            visibility: contentStatus === 'published' || contentStatus === 'featured' ? 'public' : 'private',
            topics:     c.topics ?? [],
            locations:  c.locations ?? [],
            publishedAt: c.publishedAt,
          }
          const contentResult = await writeWithRetry(() => importedContentService.upsert(item))
          if (!contentResult.success) {
            // Non-fatal to the founder as a whole — record it and move on to the
            // next content item rather than discarding everything already saved.
            errors.push({ name: `${displayName} — "${item.title}"`, error: contentResult.error ?? 'Failed to save imported content' })
            continue
          }
          contentCreated++

          if (options.runIntelligence && (contentStatus === 'published' || contentStatus === 'featured')) {
            try {
              const input = importedContentToInput(item)
              const intel = villageContentIntelligenceService.analyse(input)
              const intelResult = await writeWithRetry(() => villageContentIntelligenceService.upsert(intel))
              if (intelResult.success) intelGenerated++
            } catch {
              // non-fatal — intelligence generation failing shouldn't fail the import
            }
          }

          // Turn this into a real Story right away — same field mapping
          // (buildStoryFromImport) the founder's own "Turn into Story"
          // action uses, just triggered at import time instead of waiting
          // for them to do it by hand. Skipped for anything too thin to
          // read as a genuine article — see MIN_AUTO_PUBLISH_DESCRIPTION_LENGTH.
          if (
            options.autoPublishAsStories &&
            (contentStatus === 'published' || contentStatus === 'featured') &&
            (item.description?.trim().length ?? 0) >= MIN_AUTO_PUBLISH_DESCRIPTION_LENGTH
          ) {
            try {
              const story = buildStoryFromImport(item, founder)
              // publishStoryCore, not a raw updateStory — this used to skip
              // the entire canonical publish pipeline (Ideas, relationship
              // syncing, authority scores, publish-limit checks) that every
              // other publish path goes through. A bulk-imported founder's
              // stories were silently missing all of it.
              const storyResult = await writeWithRetry(() => publishStoryCore(story))
              if (storyResult.success) {
                storiesCreated++
                await writeWithRetry(() => importedContentService.upsert({ ...item, relatedStoryId: story.id }))
              }
            } catch {
              // non-fatal — the ImportedContent record above already saved either way
            }
          }
        }
      }

      created.push({ id: founderId, name: displayName, slug: resolvedSlug })
    } catch (err) {
      errors.push({
        name: displayName,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return { created, skipped, errors, businessesCreated, contentCreated, intelGenerated, storiesCreated }
}
