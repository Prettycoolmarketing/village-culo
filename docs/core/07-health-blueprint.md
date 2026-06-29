# CULO Operating System — Health Blueprint

**Version:** 1.0  
**Status:** Core Specification — Foundational  
**Scope:** Every entity, engine, dashboard and AI agent in CULO  
**References:** `docs/core/01-entity-blueprint.md`, `docs/core/06-metadata-blueprint.md`

---

## Philosophy

Health should guide. Not punish.

A publisher staring at a wall of red warnings stops publishing. A publisher who sees a clear, prioritised list of improvements with plain-language explanations and quick wins becomes a better publisher over time.

Health should encourage continuous improvement. Every check should explain not just what is missing, but why it matters and what to do about it. "You're missing a cover image" is not guidance. "Add a cover image — stories with images get 3× more clicks in the Village" is guidance.

Health should never block creativity. A story with a low SEO score can still be published. Health surfaces opportunities, not gates.

Every improvement should create real value. Health checks exist because they improve discoverability, trust, relationships or earnings — not because a checkbox needs to be ticked.

---

## Universal Health Score

Every entity has an Overall Health Score (0–100). It is a weighted composite of category scores.

```
Overall Health Score = weighted sum of category scores

Publisher / Business entity:
  Identity & completeness    25%
  SEO                        20%
  GEO                        15%
  Relationships              15%
  Media quality              10%
  Compliance                 10%
  Activity                    5%

Story entity:
  Identity & completeness    20%
  Media quality              20%
  SEO                        20%
  GEO                        10%
  Relationships              15%
  Compliance                 15%

Partner / Recommendation entity:
  Disclosure compliance      40%
  Link health                30%
  Analytics coverage         15%
  Program status             15%
```

### Health levels:

| Score | Level | Colour | Meaning |
|---|---|---|---|
| 90–100 | Excellent | Green | No significant issues. Optimised. |
| 75–89 | Healthy | Light Green | Minor improvements available |
| 60–74 | Good | Yellow | Several improvements recommended |
| 40–59 | Needs Attention | Orange | Important issues affecting discoverability |
| 20–39 | Poor | Red | Significant problems. Action recommended. |
| 0–19 | Critical | Dark Red | Major issues. Content may not be discoverable. |

---

## Publisher Health

The complete list of health checks for a Publisher (Founder) entity.

### Identity & Profile:

| Check | Severity | Why it matters |
|---|---|---|
| Missing profile photo | Warning | Profiles with photos are trusted more and rank higher in Village discovery |
| Missing bio | Warning | Bio is used in SEO meta and GEO entity definitions |
| Missing location | Info | Location enables local discovery and partner matching |
| Missing topics | Warning | Topics power search, partner matching and Growth Engine |
| Missing industry | Warning | Industry is required for business partner matching |
| Missing website | Info | Website link enables GEO verification of identity |
| Missing social links | Info | Social links strengthen GEO authority signals |

### Publishing Activity:

| Check | Severity | Why it matters |
|---|---|---|
| No published stories | Warning | Publishers with no stories are not discoverable in the Village |
| No story in last 90 days | Info | Recent activity improves freshness score in search |
| No ideas captured | Info | Ideas strengthen the Knowledge Graph |
| No library items | Info | Library resources attract inbound discovery |

### SEO:

| Check | Severity | Why it matters |
|---|---|---|
| No SEO description on profile | Warning | Search engines use the meta description for profile pages |
| No schema markup on profile | Warning | Person or Organization schema improves search understanding |
| Profile page has low seo_health_score | Warning | See SEO health checks below |

### GEO:

| Check | Severity | Why it matters |
|---|---|---|
| Missing geo_summary | Warning | AI systems cannot accurately describe this publisher without a clear entity definition |
| Missing geo_citation_excerpt | Info | Reduces citeability in AI search results |
| No geo_aliases defined | Info | Entity resolution may fail for alternate name variations |
| geo_health_score below 60 | Warning | Publisher is poorly represented in AI discovery |

### Relationships:

| Check | Severity | Why it matters |
|---|---|---|
| No business connected | Info | Publisher has no business entity — reduces discoverability for service-related searches |
| No stories mentioning other entities | Info | Isolated content creates weak Knowledge Graph presence |
| No community memberships | Info | Community relationships improve Growth Engine matching |
| No events attended | Info | Event attendance relationships open speaking opportunity matching |

### Village Pro:

| Check | Severity | Why it matters |
|---|---|---|
| Partner Centre not enabled | Info | (If Village Pro) Partner Centre is not activated |
| No recommendations approved | Info | (If Partner Centre enabled) No revenue relationships active |
| Missing payout method | Warning | (If earnings > $0) Cannot receive payout without method configured |

---

## Business Health

The complete list of health checks for a Business entity.

### Brand Assets:

| Check | Severity | Why it matters |
|---|---|---|
| Missing logo | Warning | Logo appears in Village Mercato, partner matching and widget embeds |
| Missing cover image | Warning | Cover image used in business profile header and social sharing |
| Missing description | Error | Description is required for SEO, GEO and partner matching |
| Missing website | Warning | Website link is an authority signal for GEO and partner trust |
| Missing tagline | Info | Tagline appears in cards and search results |

### Classification:

| Check | Severity | Why it matters |
|---|---|---|
| Missing industries | Warning | Industry is required for publisher-business matching |
| Missing topics | Warning | Topics power recommendation matching and Growth Engine |
| Missing location | Warning | Location enables local discovery and location-based partner matching |
| Missing business type | Warning | Business type determines which partner programs are appropriate |

### Content:

| Check | Severity | Why it matters |
|---|---|---|
| No linked stories | Warning | Business pages with no stories are thin and poorly ranked |
| No active services | Info | Services are searchable and appear in Mercato |
| No products listed | Info | Products improve partner matching opportunities |

### Village Pro:

| Check | Severity | Why it matters |
|---|---|---|
| Partner profile incomplete | Warning | (If Village Pro) Incomplete partner profile reduces discovery |
| No partner programs configured | Info | (If Village Pro) Cannot receive recommendations without a program |
| No active campaigns | Info | (If Village Pro) Campaigns attract publishers proactively |
| No verified status | Info | Verification badge increases publisher trust |

### SEO & GEO:

| Check | Severity | Why it matters |
|---|---|---|
| Low seo_health_score | Warning | Business profile page is not optimised for search |
| Low geo_health_score | Warning | Business is not well-represented in AI search |
| Missing Organization schema | Warning | Search engines cannot correctly understand business type |
| Missing LocalBusiness schema | Info | For businesses with a physical location |

---

## Story Health

The most detailed health check category — stories are the primary content unit of CULO.

### Identity:

| Check | Severity | Why it matters |
|---|---|---|
| Missing title | Error | Story cannot be published without a title |
| Missing summary | Warning | Summary used in cards, search results, SEO and social sharing |
| Missing cover image | Warning | Stories without cover images get significantly fewer clicks |
| Missing topics | Warning | Topics required for search, recommendations and Knowledge Graph |

### Media:

| Check | Severity | Why it matters |
|---|---|---|
| Missing alt text on cover image | Warning | Required for accessibility; also used by SEO and GEO agents |
| Video story missing transcript | Warning | Transcript enables full-text search and partner detection |
| Audio story missing transcript | Warning | As above |
| Low resolution cover image | Info | Cover images should be at least 800px wide |
| No media in story | Info | Stories with at least one media asset perform better |

### Relationships:

| Check | Severity | Why it matters |
|---|---|---|
| Story not connected to any business | Info | Connecting reduces isolation in the Knowledge Graph |
| Story references no ideas | Info | Idea references strengthen the knowledge layer |
| No internal links to related stories | Warning | Internal links improve SEO and reader navigation |
| No entities detected | Info | May indicate very generic content with no specific mentions |

### SEO:

| Check | Severity | Why it matters |
|---|---|---|
| Missing seo_title | Warning | Page title is one of the most important SEO signals |
| Missing seo_description | Warning | Meta description affects click-through rate from search results |
| Missing Article schema | Warning | Schema helps search engines understand content type |
| seo_health_score below 60 | Warning | Story not well-optimised for search |
| No heading structure in body | Info | Heading hierarchy improves readability and SEO |

### GEO:

| Check | Severity | Why it matters |
|---|---|---|
| Missing geo_citation_excerpt | Info | The most citable part of the story is not yet identified |
| geo_health_score below 50 | Info | Story not optimised for AI search |

### Compliance:

| Check | Severity | Why it matters |
|---|---|---|
| Approved recommendation missing disclosure | Error | Disclosure is legally and ethically required on all commercial recommendations |
| Affiliate link without tracking | Warning | Affiliate link found but not connected to a Partner Engine recommendation |
| Safety & Trust Agent flags unresolved | Warning | AI flagged a potential issue (unsupported claim, missing disclosure, risk) |
| Broken partner link | Error | Active recommendation has a non-functioning link |

---

## Media Health

Checks for media files (images, video, audio, documents).

| Check | Severity | Why it matters |
|---|---|---|
| Missing alt text | Warning | Required for accessibility |
| Image resolution below 800px wide | Info | Low resolution reduces display quality in Village and widgets |
| Video missing transcript | Warning | Required for search indexing and accessibility |
| Audio missing transcript | Warning | As above |
| Orphaned media (not attached to any entity) | Info | Media not used by any entity wastes storage |
| Duplicate media detected | Info | Duplicate files increase storage cost |
| Media not compressed | Info | Large files slow page load |

---

## SEO Health

Detailed checks run by the SEO Agent.

| Check | Severity | Why it matters |
|---|---|---|
| Missing page title | Error | Cannot be indexed without a title |
| Title too long (>60 chars) | Warning | Truncated in search results |
| Title too short (<20 chars) | Warning | Too little context for search engines |
| Missing meta description | Warning | Google may generate its own (often poor quality) |
| Meta description too long (>160 chars) | Warning | Truncated in search results |
| Missing canonical URL | Warning | Duplicate content may be indexed |
| Missing schema markup | Warning | Rich results (FAQPage, HowTo, Article) require schema |
| schema_data invalid format | Error | Malformed schema not processed by search engines |
| No internal links | Warning | Isolated content receives less crawl authority |
| No inbound internal links | Info | Content not linked from anywhere else in the Village |
| Cover image missing Open Graph tags | Warning | Social sharing preview will not render correctly |
| `no_index = true` on published content | Error | Published content is invisible to search engines |
| Duplicate seo_title with another entity | Warning | Duplicate titles cause cannibalisation |

---

## GEO Health

Detailed checks run by the GEO Agent.

| Check | Severity | Why it matters |
|---|---|---|
| Missing geo_summary | Warning | AI systems cannot describe this entity in their own output |
| geo_summary too short (<50 words) | Warning | Insufficient context for AI comprehension |
| Missing geo_entity_name | Warning | AI systems may use the wrong name when referencing this entity |
| Missing geo_aliases | Info | Name variations may not resolve to this entity |
| Missing geo_citation_excerpt | Info | No clearly quotable passage available for AI citation |
| geo_summary contains unsupported claims | Error | Safety & Trust Agent flagged factual accuracy concern |
| Missing geo_relationships | Info | AI cannot describe who this entity is connected to |
| Not included in llms.txt | Info | Entity is not included in AI-readable site summary |
| Low geo_health_score (<50) | Warning | Entity is not AI-discoverable |

---

## Relationship Health

| Check | Severity | Why it matters |
|---|---|---|
| Entity has no Knowledge Graph node | Warning | Entity is not in the Knowledge Graph — invisible to matching engines |
| Entity has fewer than 3 relationships | Info | Very isolated — limits matching, discovery and authority |
| Strong relationship with entity that no longer exists | Warning | Stale relationship to deleted or archived entity |
| Duplicate relationship detected | Info | Same relationship exists under two different IDs |
| Relationship confidence below 0.30 | Info | Low-confidence relationships are poor matching signals |
| No BELONGS_TO_TOPIC relationships | Warning | Entity is not classified under any topic — invisible to topic-based search |

---

## Partner Health

| Check | Severity | Why it matters |
|---|---|---|
| Approved recommendation has broken link | Error | Reader clicks to a dead URL — damages publisher trust |
| Missing disclosure on approved recommendation | Error | Legal and ethical violation |
| Expired partner program with active recommendations | Warning | Recommendation is no longer trackable |
| Partner link not tracked | Warning | Clicks and conversions cannot be attributed |
| No recommendations after 90 days of Partner Centre access | Info | Partner Centre not being used |
| Pending recommendation suggestions older than 30 days | Info | Publisher has unreviewed suggestions |
| Campaign participation incomplete | Warning | Applied to campaign but not fulfilled requirements |

---

## Widget Health

| Check | Severity | Why it matters |
|---|---|---|
| Widget embed returning errors | Error | Publisher's website is showing an empty or broken widget |
| Widget not receiving any views | Info | Widget may not be placed on the website yet |
| Widget content not updated in 30+ days | Info | Widget content may be stale |
| Widget missing required analytics token | Warning | Widget views cannot be tracked |

---

## Automation Health

| Check | Severity | Why it matters |
|---|---|---|
| Scheduled automation failed | Error | Check automation logs for cause |
| Notification delivery failed | Warning | Publisher may not have received important updates |
| AI processing queue stalled | Warning | AI agents have not processed recently published content |
| Pending reviews older than 14 days | Info | Publisher has items awaiting review |
| Automation not enabled for any hook | Info | Publisher is not receiving any automated suggestions or notifications |

---

## Knowledge Health

| Check | Severity | Why it matters |
|---|---|---|
| No ideas captured in 30 days | Info | Knowledge is not being built |
| Duplicate ideas detected | Info | Multiple ideas with identical or near-identical content |
| Library items not linked to any story | Info | Resources not being referenced reduce their value |
| Publisher topic count below 3 | Info | Narrow topic coverage limits discovery and matching |
| No content in high-priority topic | Info | A topic listed as a strength has no content supporting it |

---

## AI Health

| Check | Severity | Why it matters |
|---|---|---|
| Unresolved AI flags older than 7 days | Warning | Publisher has not reviewed AI concerns |
| High ai_risk_score (>0.70) | Warning | Multiple issues flagged by Safety & Trust Agent |
| AI not processed this entity | Info | Recently published content has not been analysed yet |
| High rejection rate of AI suggestions | Info | AI match quality may be poor for this publisher — triggers model tuning |
| ai_excluded = true on many entities | Info | Publisher has excluded AI from many entities — may be intentional |

---

## Dashboard Health Display

Every dashboard that has health context should display it consistently.

### Summary card (top of dashboard):

```
┌─────────────────────────────────────────────────┐
│  Publishing Health                        82/100 │
│  ●●●●●●●●●○○  Healthy                          │
│                                                  │
│  ⚠ 2 items need attention                       │
│  ℹ 4 improvements available                     │
│                              [View all checks →] │
└─────────────────────────────────────────────────┘
```

### Check list (expanded):

Items grouped by severity: Errors first, then Warnings, then Opportunities.

For each item:
- What is wrong (brief)
- Why it matters (one sentence)
- What to do (link to the relevant field or section)
- Estimated impact ("Fixes this are shown to improve SEO score by ~12 points")

### Quick wins section:

3 highest-impact, lowest-effort improvements surfaced automatically.

---

## Health Alert Types

| Type | Icon | Meaning |
|---|---|---|
| `error` | 🔴 | Blocks a system function or creates a compliance issue. Should be fixed before publishing or distribution. |
| `warning` | 🟠 | Reduces quality, discoverability or trust. Strongly recommended. |
| `opportunity` | 🟡 | An improvement that would meaningfully help. No urgency. |
| `info` | 🔵 | A suggestion for completeness. Low priority. |
| `success` | 🟢 | A check that recently moved from failing to passing. Positive reinforcement. |

---

## Health Timeline

Health history should be tracked and displayed as a trend.

```
Story: "Building a Slow Business in Bali"

Health Score over time:

  Created    Draft saved   Published   SEO fix   Partner rec
     │           │             │          │           │
  45 ─────── 52 ──────── 68 ────── 74 ───────── 81
     Jan 3    Jan 4       Jan 7    Jan 14      Jan 21
```

This timeline tells the publisher that improving their content over time has real, measurable impact.

Display periods: last 30 days · last 90 days · last 12 months · lifetime

---

## Future AI Coaching

Future AI layer that interprets health trends and gives proactive guidance:

| Scenario | AI coaching output |
|---|---|
| Health score dropped after update | "Your recent edit removed the cover image. This reduced your SEO score by 8 points. Add a new cover image to restore it." |
| Publisher consistently skips GEO | "Your GEO scores are lower than similar publishers. Adding a bio summary will make you more discoverable in AI search." |
| Partner recommendation with no conversions | "Your Notion recommendation has 80 clicks but 0 conversions. Consider updating the context around the recommendation — tutorials with specific use cases convert better." |
| Story with high views but low read depth | "Your story is being opened but readers leave before the end. Consider moving your most important insight to the first paragraph." |
| Health plateau at 72 | "Your three biggest opportunities: add internal links (estimated +6 pts), complete your GEO summary (estimated +8 pts), and add alt text to your cover images (estimated +4 pts). Together these could take you to 90+." |

---

## Engine Relationships

| Engine | Health role |
|---|---|
| **Identity Engine** | Checks profile completeness, verification status |
| **Publishing Engine** | Checks story completeness, disclosure compliance, media presence |
| **Knowledge Engine** | Checks Knowledge Graph coverage, relationship health |
| **Growth Engine** | Contributes community and event relationship health signals |
| **Partner Engine** | Checks recommendation disclosures, link health, program status |
| **Search Engine** | Checks search indexing status |
| **SEO Engine** | Runs SEO health checks, updates seo_health_score |
| **GEO Engine** | Runs GEO health checks, updates geo_health_score |
| **Analytics Engine** | Contributes engagement signals to quality scores |
| **Automation Engine** | Checks automation health, pending reviews, failed jobs |
| **Widget Engine** | Checks widget connectivity and performance |
| **AI Orchestration Engine** | Checks AI processing coverage, unresolved flags, risk scores |
| **Billing Engine** | Checks payout method (future) |

---

## Development Rules

Every new feature must answer:

1. What health checks does this feature introduce?
2. What severity are they?
3. What plain-language explanation should accompany each check?
4. What does the publisher do to resolve each check?
5. What is the estimated impact of resolving each check?
6. Which health category score does this affect?
7. Which dashboard surfaces this check?
8. Which AI agent runs this check?

---

*This document is the permanent health contract for CULO. Every check, every score, every coaching output and every alert is governed by the rules defined here.*
