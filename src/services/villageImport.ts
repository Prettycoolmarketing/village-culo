import { slugify } from '../utils/slugify'
import { getFounderBySlug, updateFounder } from './founders'
import { getBusinessBySlug, updateBusiness } from './businesses'
import { importedContentService, buildDraftImport } from './importedContent'
import { importedContentToInput, villageContentIntelligenceService } from './villageIntelligence'
import { locations } from '../data/locations'
import { industries } from '../data/industries'
import { topics as ALL_TOPICS } from '../data/topics'
import type { Founder, Business, Location, Industry, Topic } from '../types'
import type { ImportedContent } from '../types/importedContent'
import type {
  VillageImportPackage,
  VillageImportFounder,
  VIFFounderPreview,
  VIFValidationResult,
  VIFImportOptions,
  VIFImportResult,
  VIFImportedFounder,
} from '../types/villageImport'

// ─── Location matching ────────────────────────────────────────────────────────

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
  return locations[0] // Brisbane default
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

// ─── Validate ─────────────────────────────────────────────────────────────────

export function parseVIF(raw: string): { pkg: VillageImportPackage | null; error: string | null } {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return { pkg: null, error: 'JSON must be an object.' }
    const obj = parsed as Record<string, unknown>
    if (!obj.batchName) return { pkg: null, error: 'Missing required field: batchName' }
    if (!Array.isArray(obj.founders)) return { pkg: null, error: 'Missing required field: founders (must be an array)' }
    if (obj.founders.length === 0) return { pkg: null, error: 'founders array is empty' }
    return { pkg: parsed as VillageImportPackage, error: null }
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
    if (!f.city && !f.state) warnings.push('No location — will default to Brisbane, QLD')
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

export function importVIF(pkg: VillageImportPackage, options: VIFImportOptions): VIFImportResult {
  const now = new Date().toISOString()
  const created: VIFImportedFounder[] = []
  const skipped: string[] = []
  const errors: { name: string; error: string }[] = []
  let businessesCreated = 0
  let contentCreated = 0
  let intelGenerated = 0

  const slugsTaken = new Set<string>()
  const bizSlugsTaken = new Set<string>()

  for (const f of pkg.founders) {
    const displayName = f.preferredName?.trim() || f.fullName?.trim() || 'Unknown'

    try {
      // Slug
      const baseSlug = f.slug?.trim() || slugify(displayName)
      const existingFounder = getFounderBySlug(baseSlug)

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
            logo:        '/placeholders/village-logo.svg',
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
          updateBusiness(newBiz)
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
        status:       'published',
        featured:     false,
        createdAt:    existingFounder?.createdAt ?? now,
        profileStatus: 'village-curated',
        isClaimable:  true,
        curatedBy:    'CULO Village',
        curatedAt:    now,
        claimNotes:   claimNotes || undefined,
      }
      updateFounder(founder)

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
          importedContentService.upsert(item)
          contentCreated++

          if (options.runIntelligence && (contentStatus === 'published' || contentStatus === 'featured')) {
            try {
              const input = importedContentToInput(item)
              const intel = villageContentIntelligenceService.analyse(input)
              villageContentIntelligenceService.upsert(intel)
              intelGenerated++
            } catch {
              // non-fatal
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

  return { created, skipped, errors, businessesCreated, contentCreated, intelGenerated }
}
