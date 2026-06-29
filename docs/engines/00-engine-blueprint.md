# CULO Operating System — Engine Blueprint

**Version:** 1.0  
**Status:** Architectural Reference  
**Scope:** All future development  

---

## Philosophy

CULO is not a collection of pages.

CULO is an operating system for founder-led publishing.

Pages are interfaces. Engines perform the work.

Every feature built from this point forward must belong to an engine. Features that cannot be assigned to an engine should not be built — they are symptoms of missing architecture, not missing features.

Every dashboard, page, API, automation, widget and AI process connects to one of the engines below. No system operates in isolation. Every output from one engine becomes a potential input for another.

---

## The Development Rule

Before any future coding sprint begins, identify:

1. **Which engine owns this feature?**
2. **Which existing engines are affected?**
3. **Which automations will trigger?**
4. **Which dashboards change?**
5. **Which public pages change?**
6. **Which database tables change?**
7. **Which APIs are affected?**
8. **Where does the Canva API integration eventually connect?**

No implementation begins until this analysis is complete.

---

## Engine Map

```
Identity Engine
      │
      ▼
Publishing Engine
      │
      ▼
Knowledge Engine
      │
      ├──────────────────────────────────────┐
      ▼                                      ▼
Distribution Engine                   Partner Engine
      │                                      │
      ├──────────┐                           │
      ▼          ▼                           ▼
SEO Engine   Search Engine           Analytics Engine
      │                                      │
      ▼                                      ▼
GEO Engine                          Automation Engine
                                            │
                                            ▼
                                      Widget Engine
```

---

## Engine 1 — Identity Engine

**What it does:** Manages every person, business and relationship inside CULO.

### Owns today:

- Publisher accounts and authentication
- Founder profiles
- Business profiles
- Onboarding flow
- Profile permissions
- Session management

### Owns in future:

- Village Pro status and gating
- Partner Centre access
- Team accounts (multiple publishers under one business)
- Agency accounts (one publisher managing multiple businesses)
- Publisher roles (Editor, Contributor, Owner)
- Multiple business support per publisher
- Profile verification

### Inputs from:

- Auth provider (Supabase Auth)
- Onboarding form

### Outputs to:

- Every other engine (identity is the foundation layer)
- Publishing Engine (who is publishing)
- Partner Engine (who is eligible for Partner Centre)
- Analytics Engine (who is being tracked)
- Distribution Engine (which profiles content appears on)

### Database objects:

`founders` · `businesses` · `services`

### Key rule:

No content, recommendation, analytics event or automated action exists without an identity attached to it. The Identity Engine is the root of the trust graph.

---

## Engine 2 — Publishing Engine

**What it does:** Transforms raw content into structured, distributable Village publications.

### Owns today:

- Universal Publisher (7-step wizard)
- 11 content formats (blog, reel, carousel, podcast, talking-head, voice-over, photo-story, document, external-article, youtube-video, social-post)
- File uploads (image, video, audio, document)
- Story metadata (title, summary, cover image, topics, CTA)
- Draft management
- Publishing status (draft, submitted, published, featured, archived)

### Owns in future:

- Canva API import
- Camera roll / photo library import
- Website content import
- Social media import (Instagram, TikTok, LinkedIn)
- Podcast RSS import
- Bulk publishing
- Version history
- Editorial calendar
- Scheduled publishing
- Co-authoring

### Inputs from:

- Identity Engine (who is publishing)
- Knowledge Engine (topic suggestions, related content)
- Partner Engine (recommendation detection triggers)
- Media uploads (Supabase Storage)

### Outputs to:

- Knowledge Engine (new entity relationships created)
- Distribution Engine (trigger distribution on publish)
- Partner Engine (new content available for recommendation matching)
- SEO Engine (new metadata to index)
- Analytics Engine (publish event)
- Automation Engine (trigger publish workflow)

### Database objects:

`stories` · `media_uploads`

### Key rule:

Publishing Engine produces structured data. Raw content in means structured Story out. Every field the Publishing Engine captures becomes available to every downstream engine.

---

## Engine 3 — Knowledge Engine

**What it does:** Understands the meaning of content. Creates the relationships between everything.

### Owns today:

- Topics (taxonomy)
- Ideas
- Related stories
- Founder expertise areas
- Business expertise areas

### Owns in future:

- Knowledge Graph (the full relationship map between publishers, businesses, topics, entities and content)
- Entity detection (brands, products, places, people mentioned in content)
- FAQ generation from stories
- Resource collections (grouped content by topic or expertise)
- Suggested topics for publishers
- Content gap detection (topics a publisher hasn't covered)
- Expertise scoring per publisher per topic
- Semantic relationships between stories
- Cross-publisher topic clusters

### Inputs from:

- Publishing Engine (new story content)
- Identity Engine (founder expertise, business category)

### Outputs to:

- Partner Engine (entity detection for recommendation matching)
- Distribution Engine (related content suggestions)
- Search Engine (topic and entity index)
- SEO Engine (topic cluster structure)
- GEO Engine (entity relationships for LLM discoverability)
- Analytics Engine (topic performance)

### Database objects:

`ideas` (future: `topics`, `entities`, `relationships`, `knowledge_graph_nodes`, `knowledge_graph_edges`)

### Key rule:

Knowledge Engine never produces user-facing content directly. It is an internal intelligence layer. Pages read from it; it does not render itself.

---

## Engine 4 — Distribution Engine

**What it does:** Ensures published content appears everywhere it should, automatically.

### Owns today:

- Founder profile page (stories appear here)
- Business profile page (stories appear here)
- Story archive
- Homepage widgets (StoryGrid, FounderGrid, FeaturedWidget)
- `publicSync` (distributes Supabase published content to Village on app load)

### Owns in future:

- Embeddable website widgets (founder publishes once → appears on their website)
- RSS feeds
- Email digest triggers
- Partner page appearances
- Related content panels (cross-story linking)
- API feeds for third-party consumption

### Inputs from:

- Publishing Engine (new published story)
- Identity Engine (which profiles to attach content to)
- Knowledge Engine (which related content to surface alongside)

### Outputs to:

- SEO Engine (URLs to index, internal links to build)
- Analytics Engine (distribution events)
- Widget Engine (content to render in embeds)
- Automation Engine (trigger notifications on distribution)

### Database objects:

None of its own. Reads from `stories`, `founders`, `businesses`.

### Key rule:

Distribution Engine is read-only at runtime. It does not create data — it routes existing data to the right surfaces. Publish once, appear everywhere.

---

## Engine 5 — Partner Engine

**What it does:** Connects Publishers, Businesses and Brands into a Recommendation Economy.

### Owns today:

- Nothing yet. Partner Engine is Phase 2.

### Owns in future:

- Partner Centre (publisher-facing)
- Village Pro (business-facing)
- Partner directory
- Recommendation detection and matching
- Recommendation approvals
- Disclosure management
- Affiliate / referral / ambassador programs
- Sponsored opportunities
- Revenue tracking
- Publisher earnings
- Partner analytics
- Campaigns
- Payout management

### Inputs from:

- Publishing Engine (new content to scan)
- Knowledge Engine (entities detected in content)
- Identity Engine (which publishers and businesses are eligible)
- Analytics Engine (performance of existing recommendations)

### Outputs to:

- Distribution Engine (recommendation disclosures added to published content)
- Analytics Engine (click and conversion events)
- Automation Engine (match found → notify publisher)
- SEO Engine (partner pages)
- GEO Engine (partner entity relationships)
- Widget Engine (partner widgets on publisher sites)

### Database objects:

(future) `partners` · `partner_programs` · `recommendations` · `recommendation_approvals` · `campaigns` · `earnings` · `payouts` · `brand_mentions`

### Key rule:

Recommendations are never automatic and never forced. The Publisher approves every recommendation. Trust is the product. Revenue is the outcome.

---

## Engine 6 — Search Engine

**What it does:** Finds everything inside the Village.

### Owns today:

- Filter bars on /stories, /founders, /mercato
- Location, industry, topic, format filters
- URL-based filter state

### Owns in future:

- Full-text search across all content types
- Semantic search (search by meaning, not just keyword)
- Publisher search
- Business search
- Idea search
- Partner search
- AI-powered search suggestions
- Search analytics (what people search for that returns no results)

### Inputs from:

- Knowledge Engine (topic and entity index)
- Publishing Engine (new content to index)
- Identity Engine (publisher and business data)

### Outputs to:

- Analytics Engine (search queries, click-through rates)
- Knowledge Engine (search patterns reveal content gaps)

### Database objects:

None of its own. Queries across `stories`, `founders`, `businesses`, `library_items`.

### Key rule:

Search Engine must never surface unpublished content to unauthenticated users. RLS + `publicOnly` filters are non-negotiable.

---

## Engine 7 — SEO Engine

**What it does:** Makes CULO content discoverable by traditional search engines.

### Owns today:

- Page titles via `usePageTitle`
- Basic HTML structure (semantic headings, structured content)

### Owns in future:

- Structured data / JSON-LD (Article, Person, Organization, BreadcrumbList, FAQPage)
- Open Graph meta tags (for social sharing)
- Canonical URLs
- Sitemap generation
- Internal linking automation (related stories linked in content)
- Topic cluster pages (hub + spoke structure per topic)
- Business location pages (SEO landing pages per location + industry)
- Partner pages (co-branded SEO opportunity)
- Knowledge pages (FAQ pages built from Knowledge Engine data)

### Inputs from:

- Publishing Engine (new content to tag)
- Knowledge Engine (topics, entities, relationships)
- Distribution Engine (URL structure)
- Partner Engine (partner pages)

### Outputs to:

- Search engines (via structured data in HTML)
- GEO Engine (structured data is also LLM-readable)

### Database objects:

None of its own. Reads metadata from all other objects and renders in HTML.

### Key rule:

SEO Engine does not own content — it wraps content. Every SEO output is generated from existing structured data, never invented.

---

## Engine 8 — GEO Engine

**What it does:** Makes CULO entities discoverable by AI systems — ChatGPT, Perplexity, Google AI Overview, Claude, Gemini.

GEO stands for Generative Engine Optimisation.

### Owns today:

- Nothing yet.

### Owns in future:

- Entity definitions (what is this founder, business, or topic in plain language)
- Citation-ready structured content (short authoritative summaries LLMs can quote)
- Knowledge graph definitions (who is connected to whom and how)
- Disambiguation pages (when two entities share a name)
- Machine-readable relationship data (founder → business → topics → stories)
- LLM-friendly content format guidelines for publishers

### Inputs from:

- Identity Engine (entities to define)
- Knowledge Engine (relationships to describe)
- Publishing Engine (citable content)
- SEO Engine (structured data already produced)

### Outputs to:

- AI systems via structured HTML, JSON-LD and readable page structure
- Search engines (GEO and SEO overlap significantly)

### Key rule:

GEO Engine optimises for machine comprehension, not human reading. The output should make it easier for an LLM to understand "who is this person, what do they do, who do they know, and what have they published" in a single context window.

---

## Engine 9 — Analytics Engine

**What it does:** Measures everything. Gives publishers data to make better decisions.

### Owns today:

- Publishing health scores (missing assets detection)
- Record counts on dashboard home

### Owns in future:

- Story views, unique visitors, time on page
- Profile views (founder, business)
- Recommendation clicks and conversions
- Content performance by format, topic, location
- Publisher leaderboards (optional, with consent)
- Traffic sources
- Search query analytics
- Partner revenue per publisher
- Publishing frequency trends
- Business analytics (which stories drive enquiries)
- Dashboard analytics overview

### Inputs from:

- All other engines (every engine fires events to Analytics)

### Outputs to:

- Publisher dashboard (Analytics tab)
- Partner Engine (which recommendations are converting)
- Knowledge Engine (which topics are performing)
- Automation Engine (trigger alerts on performance milestones)

### Database objects:

(future) `analytics_events` · `page_views` · `recommendation_clicks`

### Key rule:

Analytics Engine is passive. It listens to events from other engines. It does not control behaviour — it reports on it.

---

## Engine 10 — Automation Engine

**What it does:** Triggers actions automatically when events happen across the platform.

### Owns today:

- Nothing yet.

### Owns in future:

- Publish event → trigger distribution → notify publisher
- Recommendation match found → notify publisher
- Draft idle for 7 days → nudge publisher
- New partner joins → notify relevant publishers
- Story reaches milestone views → notify publisher
- Payout ready → notify publisher
- Approval required → notify publisher
- New business joins Village → notify publishers in same location/industry
- Scheduled imports (podcast RSS sync, website import)
- Onboarding drip sequence

### Inputs from:

- Every engine (events trigger automations)

### Outputs to:

- Email (transactional notifications)
- In-app notifications (future notification centre)
- Webhook endpoints (future third-party integrations)
- Partner Engine (trigger approval flows)

### Database objects:

(future) `automation_triggers` · `notification_queue` · `notification_log`

### Key rule:

Every automation must be auditable. Publishers must be able to see what triggered, when, and why. No silent background processes.

---

## Engine 11 — Widget Engine

**What it does:** Embeds CULO content anywhere outside the Village.

### Owns today:

- Nothing yet.

### Owns in future:

- Founder story feed widget (for publisher websites)
- Business stories widget
- Latest publications widget
- Partner recommendation badge
- Library item widget (buy button + product detail)
- Events widget
- Canva-designed story cards (auto-generated from Publishing Engine output)
- Iframe-embeddable widgets with theming
- JavaScript snippet-based widgets (no iframe)

### Inputs from:

- Distribution Engine (what content to show)
- Identity Engine (whose widget is this)
- Partner Engine (include partner disclosures in widgets)
- Publishing Engine (latest content feed)

### Outputs to:

- Publisher websites
- Third-party platforms
- Future: Canva designs

### Database objects:

(future) `widget_configurations` · `widget_embed_tokens`

### Key rule:

Widgets are read-only. They display content from the Village. They do not accept input or create records.

---

## Engine Relationships — Full Map

```
INPUTS
  Auth Provider
  Publisher (human)
  Business (human)
  Visitor (human)
        │
        ▼
┌────────────────┐
│ Identity Engine│  ◄── Root of everything
└───────┬────────┘
        │
        ▼
┌──────────────────┐
│ Publishing Engine│  ◄── Content enters here
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌──────────┐  ┌──────────────────┐
│Knowledge │  │ Distribution     │
│Engine    │  │ Engine           │
└────┬─────┘  └────────┬─────────┘
     │                 │
  ┌──┴──┐         ┌────┴──────┐
  ▼     ▼         ▼           ▼
SEO   Partner   Search      Widget
Engine Engine  Engine       Engine
  │     │
  ▼     ▼
GEO   Analytics
Engine  Engine
          │
          ▼
       Automation
        Engine
```

### Partner Engine Connection Map

Partner Engine connects to every other engine:

| Engine | Connection |
|---|---|
| Identity | Determines who is eligible for Partner Centre |
| Publishing | Scans new content for recommendation opportunities |
| Knowledge | Uses entity detection to find matched partners |
| Distribution | Adds disclosure layer to published recommendations |
| Search | Partner directory is searchable |
| SEO | Partner pages are indexed |
| GEO | Partner entities added to knowledge graph |
| Analytics | Tracks clicks, conversions, earnings |
| Automation | Fires approval requests, earnings notifications |
| Widget | Publisher websites show partner-approved content |

---

## Architectural Constraints

These rules apply to all future development:

1. **Engines do not share ownership of database tables.** Each table is owned by one engine. Other engines may read from it — only the owning engine writes to it.

2. **No feature is built without an engine assignment.** If a sprint cannot answer "which engine owns this," the sprint is not ready to begin.

3. **Schema changes require justification.** From Phase 2 onwards, new database tables require a documented engine assignment before they are created.

4. **Engines communicate via events, not direct coupling.** Publishing Engine does not call Partner Engine directly. It fires a publish event. Partner Engine listens and responds.

5. **The Identity Engine owns authentication.** No other engine handles auth, permissions or sessions.

6. **The Analytics Engine is downstream of everything.** It never writes to business data — only to its own event log.

7. **Widgets are always read-only.** They display; they do not create.

8. **The Canva API, when integrated, belongs to the Publishing Engine.** It is a content import mechanism — not an engine of its own.

---

## Phase Roadmap

| Phase | Engine Focus | Status |
|---|---|---|
| 1 — Platform Foundation | Identity + Publishing + Distribution + Search (basic) | ✅ Complete |
| 2 — Partner Engine | Partner + Analytics (foundations) | Next |
| 3 — Knowledge Engine | Knowledge + Search (full-text + semantic) | Planned |
| 4 — SEO Engine | SEO (structured data, sitemaps, topic clusters) | Planned |
| 5 — GEO Engine | GEO (entity optimisation, citation readiness) | Planned |
| 6 — Canva Engine | Publishing Engine extension (Canva API import) | Planned |
| 7 — Automation Engine | Automation (triggers, notifications, drip) | Planned |
| 8 — Widget Engine | Widget (embeds, publisher websites) | Planned |

---

*This document is the permanent architectural reference for CULO development. All future sprints reference it. It is updated only when a new engine is defined or an existing engine's scope changes materially.*
