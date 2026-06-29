# CULO Operating System — Architecture Index

**Version:** 1.0  
**Status:** Living Document — Updated as platform evolves  
**Purpose:** Master reference for every engine, object, event, automation and integration in CULO  

---

## Start Here

CULO is no longer a single application. It is a platform made up of interconnected engines, each owning specific data and operations, communicating via events rather than direct coupling.

Every future sprint begins with this document. Before writing any code, a developer or AI agent must answer:

1. Which engine owns this feature?
2. Which objects change?
3. Which events fire?
4. Which automations trigger?
5. Which dashboards change?
6. Which public pages change?
7. Which widgets update?
8. Which SEO/GEO metadata changes?
9. Which AI agents participate?
10. Which integrations are affected?

If these questions cannot be answered, the sprint is not ready to begin.

---

## Core Philosophy

CULO exists to help people preserve, organise, publish and distribute human knowledge.

Publishing is the beginning. Knowledge, relationships and discoverability are the outcome.

- Every Story should strengthen the Knowledge Graph.
- Every interaction should improve discoverability.
- Every relationship should create new opportunity.
- Every engine should work together.
- Nothing should exist in isolation.

---

## Platform Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│  Layer 6 — Optimisation                                              │
│  SEO · GEO · Analytics · Automation · AI · Notifications            │
├──────────────────────────────────────────────────────────────────────┤
│  Layer 5 — Distribution                                              │
│  Homepage · Widgets · Archive · Profiles · API · RSS · Embeds       │
├──────────────────────────────────────────────────────────────────────┤
│  Layer 4 — Growth                                                    │
│  Partner Engine · Discovery · Recommendations · Campaigns           │
├──────────────────────────────────────────────────────────────────────┤
│  Layer 3 — Knowledge                                                 │
│  Knowledge Graph · Entities · Topics · Relationships · Authority    │
├──────────────────────────────────────────────────────────────────────┤
│  Layer 2 — Publishing                                                │
│  Stories · Media · Library · Ideas · Services · Profiles            │
├──────────────────────────────────────────────────────────────────────┤
│  Layer 1 — Identity                                                  │
│  Auth · Publishers · Businesses · Permissions · Village Pro         │
└──────────────────────────────────────────────────────────────────────┘
```

Higher layers depend on lower layers. No layer should bypass a lower layer.

---

## Engine Registry

### Engine 1 — Identity Engine
**Purpose:** Manages every person, business and relationship inside CULO.  
**Owner:** Supabase Auth + `founders` + `businesses` + `services` tables  
**Status:** ✅ Phase 1 — Active  
**Blueprint:** `docs/engines/00-engine-blueprint.md`  
**Consumes:** Auth provider, onboarding form  
**Produces:** Publisher identity, business identity, session, permissions  
**Future:** Team accounts, agency accounts, profile verification, Village Pro gating  

---

### Engine 2 — Publishing Engine
**Purpose:** Transforms raw content into structured, distributable Village publications.  
**Owner:** `stories` + `media_uploads` tables  
**Status:** ✅ Phase 1 — Active  
**Blueprint:** `docs/engines/00-engine-blueprint.md`  
**Consumes:** Identity Engine, media uploads, Knowledge Engine suggestions, Partner Engine triggers  
**Produces:** Published stories, structured metadata, publish events  
**Future:** Canva API import, camera roll import, social import, bulk publishing, scheduled publishing  

---

### Engine 3 — Knowledge Engine
**Purpose:** Understands the meaning of content. Creates relationships between everything.  
**Owner:** Topics, entities, relationships, knowledge graph nodes and edges  
**Status:** 🟡 Phase 3 — Planned  
**Blueprint:** `docs/engines/knowledge-engine/01-knowledge-graph-engine.md`  
**Consumes:** Publishing Engine (story content), Identity Engine (expertise data)  
**Produces:** Knowledge Graph relationships, entity definitions, topic clusters, FAQ content  
**Future:** Full Knowledge Graph, entity resolution, expertise scoring, semantic relationships  

---

### Engine 4 — Distribution Engine
**Purpose:** Ensures published content appears everywhere it should, automatically.  
**Owner:** No owned tables — reads from `stories`, `founders`, `businesses`  
**Status:** ✅ Phase 1 — Active  
**Blueprint:** `docs/engines/00-engine-blueprint.md`  
**Consumes:** Publishing Engine (new published story), Identity Engine (profile data), Knowledge Engine (related content)  
**Produces:** Profile pages, story archive, homepage widgets, `publicSync`  
**Future:** RSS feeds, email digest, API feeds, widget content, partner pages  

---

### Engine 5 — Partner Engine
**Purpose:** Connects Publishers, Businesses and Brands into a Recommendation Economy.  
**Owner:** `partners` · `partner_programs` · `recommendations` · `brand_mentions` · `publisher_partner_profiles` · `publisher_partner_memberships` · `campaigns` · `campaign_applications` · `earnings` · `payouts`  
**Status:** 🔴 Phase 2 — Blueprint complete, not yet built  
**Blueprints:**  
- `docs/engines/partner-engine/01-partner-engine-blueprint.md`  
- `docs/engines/partner-engine/02-partner-data-model.md`  
- `docs/engines/partner-engine/03-partner-automations.md`  
- `docs/engines/partner-engine/04-publisher-partner-centre.md`  
- `docs/engines/partner-engine/05-village-pro-business-centre.md`  
- `docs/engines/partner-engine/06-recommendation-intelligence-engine.md`  
**Consumes:** Publishing Engine (content to scan), Knowledge Engine (entity detection), Identity Engine (eligibility)  
**Produces:** Recommendation suggestions, disclosures, affiliate links, earnings, payout records  
**Future:** Full Recommendation Economy, campaigns, Village Pro Business Centre, Publisher Partner Centre  

---

### Engine 6 — Growth Engine
**Purpose:** Connects the right people, businesses, communities and opportunities together automatically.  
**Owner:** Growth opportunity records, opportunity scores (future)  
**Status:** 🔴 Phase 3+ — Blueprint complete, not yet built  
**Blueprint:** `docs/engines/growth-engine/01-growth-discovery-engine.md`  
**Consumes:** Knowledge Engine (graph queries), Identity Engine (profiles), Partner Engine (commercial opportunities)  
**Produces:** Opportunity suggestions, connection recommendations, Growth Dashboard content  
**Future:** Full discovery system for publishers, businesses, events, communities, podcasts  

---

### Engine 7 — Recommendation Intelligence Engine
**Purpose:** AI layer that understands content rather than simply scanning for keywords.  
**Owner:** Sub-system of the Partner Engine  
**Status:** 🔴 Phase 2 — Blueprint complete, not yet built  
**Blueprint:** `docs/engines/partner-engine/06-recommendation-intelligence-engine.md`  
**Consumes:** Story content, Knowledge Graph entities, publisher behaviour signals  
**Produces:** Brand mentions with confidence scores, recommendation candidates, entity relationships  
**Future:** Full NLP pipeline, sentiment analysis, publisher voice learning  

---

### Engine 8 — Search Engine
**Purpose:** Finds everything inside the Village.  
**Owner:** No owned tables — queries across all content tables  
**Status:** 🟡 Phase 1 — Basic filters only  
**Blueprint:** `docs/engines/00-engine-blueprint.md`  
**Consumes:** Knowledge Engine (index), Publishing Engine (new content), Identity Engine (profiles)  
**Produces:** Search results, filter state  
**Future:** Full-text search, semantic search, AI search suggestions  

---

### Engine 9 — SEO Engine
**Purpose:** Makes CULO content discoverable by traditional search engines.  
**Owner:** No owned tables — generates metadata from existing content  
**Status:** 🟡 Phase 1 — Basic titles only  
**Blueprint:** `docs/engines/00-engine-blueprint.md`  
**Consumes:** Publishing Engine, Knowledge Engine, Distribution Engine, Partner Engine  
**Produces:** Structured data / JSON-LD, Open Graph tags, canonical URLs, sitemaps, internal links  
**Future:** Full structured data suite, topic clusters, business location pages, sitemap generation  
**Next Blueprint:** `docs/engines/seo-engine/` — pending  

---

### Engine 10 — GEO Engine
**Purpose:** Makes CULO entities discoverable by AI systems (ChatGPT, Perplexity, Google AI, Claude).  
**Owner:** No owned tables — exports entity definitions and structured summaries  
**Status:** 🔴 Phase 5 — Planned  
**Blueprint:** `docs/engines/00-engine-blueprint.md`  
**Consumes:** Identity Engine, Knowledge Engine, SEO Engine, Publishing Engine  
**Produces:** Entity definitions, citation-ready summaries, llms.txt, knowledge graph summaries  
**Future:** Full GEO suite, disambiguation pages, machine-readable relationship data  
**Next Blueprint:** `docs/engines/geo-engine/` — pending  

---

### Engine 11 — Analytics Engine
**Purpose:** Measures everything. Gives publishers data to make better decisions.  
**Owner:** `analytics_events` · `page_views` · `recommendation_clicks` (all future)  
**Status:** 🟡 Phase 1 — Basic record counts and health scores only  
**Blueprint:** `docs/engines/00-engine-blueprint.md`  
**Consumes:** All other engines (event listener)  
**Produces:** Publisher analytics dashboard, partner performance data, knowledge performance signals  
**Future:** Full analytics suite, recommendation analytics, business analytics, publisher leaderboards  

---

### Engine 12 — Automation Engine
**Purpose:** Triggers actions automatically when events happen across the platform.  
**Owner:** `automation_triggers` · `notification_queue` · `notification_log` (all future)  
**Status:** 🔴 Phase 2 — Not yet built  
**Blueprint:** `docs/engines/00-engine-blueprint.md`  
**Consumes:** Every engine (event listener)  
**Produces:** Email notifications, in-app notifications, webhook calls, scheduled sync jobs  
**Future:** Full automation suite, drip sequences, scheduled imports  
**Next Blueprint:** `docs/engines/automation-engine/` — pending  

---

### Engine 13 — Widget Engine
**Purpose:** Embeds CULO content anywhere outside the Village.  
**Owner:** `widget_configurations` · `widget_embed_tokens` (all future)  
**Status:** 🔴 Phase 8 — Planned  
**Blueprint:** `docs/engines/00-engine-blueprint.md`  
**Consumes:** Distribution Engine (content), Identity Engine (permissions), Partner Engine (disclosures)  
**Produces:** Embeddable iframe/script widgets for publisher websites  
**Future:** Story feed widget, business stories widget, partner recommendation badge, Canva card widget  
**Next Blueprint:** `docs/engines/widget-engine/` — pending  

---

### Engine 14 — AI Orchestration Engine
**Purpose:** Coordinates every AI process inside CULO. Decides which agent runs, when, with what data, and with what approval requirements.  
**Owner:** Agent routing, publisher AI preferences, learning signals (all future)  
**Status:** 🔴 Phase 4+ — Blueprint complete, not yet built  
**Blueprint:** `docs/engines/ai-orchestration-engine/01-ai-orchestration-engine.md`  
**Agents:** Insight · Story · Format · Media · Relationship · Knowledge Graph · FAQ · Topic · SEO · GEO · Partner · Disclosure · Distribution · Widget · Analytics · Growth · Safety & Trust  
**Consumes:** All engines  
**Produces:** Drafts, metadata, relationship suggestions, alerts, automations  
**Future:** Full AI agent suite, publisher assistant, Village search AI, autonomous publishing agents  

---

### Engine 15 — Media Engine (Planned)
**Purpose:** Manages all media uploads — images, video, audio, documents — through their complete lifecycle.  
**Status:** 🔴 Planned  
**Next Blueprint:** `docs/engines/media-engine/` — pending  
**Scope:** Upload handling, transcoding, thumbnail generation, transcript extraction, storage lifecycle, CDN management  

---

### Engine 16 — Import Engine (Planned)
**Purpose:** Brings external content into CULO from any source.  
**Status:** 🔴 Planned  
**Next Blueprint:** `docs/engines/import-engine/` — pending  
**Scope:** Website import, YouTube transcript, podcast RSS, blog import, Instagram, LinkedIn, newsletter, Canva, camera roll  

---

### Engine 17 — Canva Engine (Planned)
**Purpose:** Manages the full Canva API integration — login, publishing, media sync, approvals, content events.  
**Status:** 🔴 Planned  
**Next Blueprint:** `docs/engines/canva-engine/` — pending  
**Scope:** Canva OAuth, publish webhook, design payload processing, content routing to Publishing Engine  

---

### Engine 18 — Notification Engine (Planned)
**Purpose:** Manages all publisher and business notifications — email, in-app, and future push.  
**Status:** 🔴 Planned  
**Next Blueprint:** `docs/engines/notification-engine/` — pending  
**Scope:** Email delivery, in-app notification centre, notification preferences, digest scheduling  

---

### Engine 19 — Admin Engine (Planned)
**Purpose:** Moderation, approvals, spam control, featured content management, platform health.  
**Status:** 🔴 Planned  
**Next Blueprint:** `docs/engines/admin-engine/` — pending  
**Scope:** Content moderation, featured content, abuse reporting, partner approvals, platform analytics  

---

### Engine 20 — Billing Engine (Planned)
**Purpose:** Manages CULO memberships, Village Pro, Stripe subscriptions, invoices and usage.  
**Status:** 🔴 Planned  
**Next Blueprint:** `docs/engines/billing-engine/` — pending  
**Scope:** Stripe integration, subscription management, Village Pro gating, invoice generation, publisher payouts  

---

## Object Registry

Every major object in CULO, its owning engine, and its key relationships.

| Object | Owner Engine | DB Table | Lifecycle States | Public Page | Dashboard Page |
|---|---|---|---|---|---|
| Publisher | Identity | `founders` | created → onboarded → published → verified → leader | `/founders/{slug}` | `/dashboard/profile` |
| Business | Identity | `businesses` | created → configured → village-pro → verified → featured → archived | `/mercato/{slug}` | `/dashboard/business` |
| Story | Publishing | `stories` | draft → submitted → published → featured → archived → deleted | `/stories/{slug}` | `/dashboard/publish` |
| Idea | Publishing | `library_items` (type: idea) | draft → published → archived | future | `/dashboard/library` |
| Library Item | Publishing | `library_items` | draft → published → archived | future | `/dashboard/library` |
| Media Upload | Publishing | `media_uploads` | uploading → stored → attached → orphaned → deleted | none (attached to story) | n/a |
| Service | Identity | `services` | draft → active → archived | `/mercato/{business}` | `/dashboard/services` |
| Partner | Partner | `partners` | pending → active → inactive → suspended | future partner directory | n/a (admin) |
| Partner Program | Partner | `partner_programs` | draft → active → paused → closed | none | future business dashboard |
| Brand Mention | Partner | `brand_mentions` | detected → matched / no-match → ignored | none | Publisher Partner Centre |
| Recommendation | Partner | `recommendations` | pending → approved / rejected / withdrawn / expired | in-story disclosure | Publisher Partner Centre |
| Publisher Partner Profile | Partner | `publisher_partner_profiles` | inactive → active → suspended | none | Publisher Partner Centre |
| Campaign | Partner | `campaigns` | draft → active → paused → completed → archived | future partner directory | future business dashboard |
| Earnings | Partner | `earnings` | pending → approved → paid / reversed | none | Publisher earnings |
| Payout | Partner | `payouts` | scheduled → processing → paid / failed | none | Publisher payouts |
| Knowledge Node | Knowledge | (future graph tables) | created → enriched → resolved → deprecated | future entity pages | n/a |
| Widget Config | Widget | `widget_configurations` (future) | draft → active → paused | embedded on publisher site | future widget dashboard |

---

## Event Registry

Every major event that engines fire and listen to.

| Event | Source Engine | Destination Engines | Key Automations |
|---|---|---|---|
| `PublisherCreated` | Identity | Knowledge, Analytics | Onboarding sequence |
| `BusinessCreated` | Identity | Knowledge, Analytics | Business profile suggestions |
| `StoryCreated` | Publishing | Knowledge, Analytics | Draft saved notification |
| `StoryPublished` | Publishing | Knowledge, Partner, Distribution, SEO, GEO, Analytics, Automation | Full publish pipeline |
| `StoryUpdated` | Publishing | Knowledge, Partner (re-scan), SEO | Metadata refresh |
| `StoryArchived` | Publishing | Distribution, SEO, Analytics | Remove from public pages |
| `StoryDeleted` | Publishing | Distribution, Partner, Analytics | Remove all references |
| `BrandMentionDetected` | Partner | Partner (match check) | Queue recommendation suggestion |
| `RecommendationSuggested` | Partner | Automation | Notify publisher |
| `RecommendationApproved` | Partner | Publishing (story update), Distribution, Analytics, Automation | Apply disclosure, notify business |
| `RecommendationRejected` | Partner | Analytics | Store signal, suppress re-suggestion |
| `RecommendationWithdrawn` | Partner | Publishing (story update), Analytics | Remove disclosure from story |
| `MediaUploaded` | Publishing | AI Orchestration (Media Agent), Analytics | Alt text suggestion, transcript |
| `MediaDeleted` | Publishing | Distribution, Analytics | Remove from all surfaces |
| `CampaignCreated` | Partner | Automation (match publishers) | Surface to eligible publishers |
| `CampaignApplied` | Partner | Automation | Notify business |
| `CampaignApproved` | Partner | Automation | Notify publisher |
| `EarningsCreated` | Partner | Analytics, Automation | Update publisher earnings dashboard |
| `PayoutScheduled` | Partner | Automation | Notify publisher |
| `WidgetUpdated` | Widget | Distribution, Analytics | Refresh embed |
| `KnowledgeGraphUpdated` | Knowledge | Partner, Growth, SEO, GEO | Downstream engine updates |
| `GrowthOpportunityMatched` | Growth | Automation | Notify publisher of new opportunity |
| `SEOMetaUpdated` | SEO | Distribution | Refresh page metadata |
| `GEOEntityUpdated` | GEO | SEO | Refresh structured data |
| `AnalyticsCalculated` | Analytics | (consumer) | No downstream action |
| `AutomationTriggered` | Automation | Notification | Send email / in-app notification |

---

## Automation Registry

Summary of every automation domain. Each links to its detailed blueprint.

| Domain | Blueprint Location | Status |
|---|---|---|
| Partner Engine automations (18 automations) | `docs/engines/partner-engine/03-partner-automations.md` | 🔴 Planned |
| Publishing automations | `docs/engines/automation-engine/` — pending | 🔴 Planned |
| Knowledge automations | `docs/engines/knowledge-engine/` — future | 🔴 Planned |
| Growth automations | `docs/engines/growth-engine/01-growth-discovery-engine.md` | 🔴 Planned |
| SEO automations | `docs/engines/seo-engine/` — pending | 🔴 Planned |
| GEO automations | `docs/engines/geo-engine/` — pending | 🔴 Planned |
| Media automations | `docs/engines/media-engine/` — pending | 🔴 Planned |
| Import automations | `docs/engines/import-engine/` — pending | 🔴 Planned |
| Notification automations | `docs/engines/notification-engine/` — pending | 🔴 Planned |

---

## Dashboard Registry

Every dashboard surface in CULO and which engine owns it.

| Dashboard | Primary Engine | Objects Managed | Permissions |
|---|---|---|---|
| Publisher Dashboard Home | Analytics | Stories, health scores, record counts | Owner |
| Story Publisher (7-step wizard) | Publishing | Stories, media | Owner |
| Profile Dashboard | Identity | Founder profile, business profile | Owner |
| Library Dashboard | Publishing | Library items, ideas | Owner |
| Services Dashboard | Identity | Services, pricing | Owner |
| Publisher Partner Centre | Partner | Recommendations, earnings, programs, campaigns | Owner + Village Pro |
| Publisher Growth Dashboard | Growth | Opportunities, connections | Owner + Village Pro |
| Village Pro Business Centre | Partner | Partner profile, programs, campaigns, analytics | Business owner + Village Pro |
| Analytics Dashboard | Analytics | Story performance, recommendation analytics | Owner |
| Media Dashboard | Media | Uploads, storage, transcripts | Owner |
| Admin Dashboard | Admin | Moderation, featured content, approvals, platform health | Admin |
| Billing Dashboard | Billing | Membership, Stripe, invoices | Owner |

---

## Public Experience Registry

Every public page and the engines that power it.

| Page | URL Pattern | Engines Involved | Key Objects |
|---|---|---|---|
| Homepage | `/` | Distribution, Knowledge, SEO | Featured stories, featured founders, village intro |
| Village / Piazza | `/village` or `/piazza` | Distribution, Search, SEO | All published stories, founders, businesses |
| Story | `/stories/{slug}` | Distribution, Partner, SEO, GEO | Story, disclosures, related content |
| Founder Profile | `/founders/{slug}` | Distribution, Partner, SEO, GEO | Founder, stories, recommendations |
| Business Profile | `/mercato/{slug}` | Distribution, Partner, SEO, GEO | Business, stories, services, recommendations |
| Library | `/library` | Distribution, Search, SEO | Library items, resources |
| Partner Directory | future | Partner, Search, SEO, GEO | Partners, programs |
| Event | future | Distribution, Growth, SEO | Events, speakers |
| Community | future | Distribution, Growth, SEO | Communities, members |
| Search | future | Search, Knowledge | All content types |
| Map | future | Distribution, Growth | Location-based discovery |
| Widget Embed | publisher website | Widget, Partner, Distribution | Publisher content feed |

---

## AI Agent Registry

All AI agents managed by the AI Orchestration Engine.

| Agent | Responsibility | Output Class | Approval Required |
|---|---|---|---|
| Insight Agent | Extract ideas, lessons, experiences from content | Draft / Metadata | Publisher confirms ideas |
| Story Agent | Transform raw material into Story drafts | Draft | Always — full publisher review |
| Format Agent | Identify content format | Metadata | Auto-apply |
| Media Agent | Alt text, transcripts, thumbnail suggestions | Metadata / Draft | Alt text auto; captions require review |
| Relationship Agent | Suggest Knowledge Graph connections | Relationship | Auto for high-confidence; review for uncertain |
| Knowledge Graph Agent | Create and maintain graph nodes and edges | Relationship / Automation | Node merges require admin review |
| FAQ Agent | Extract Q&A from content | Draft | Publisher confirms before public |
| Topic Agent | Assign topics, industries, audience | Metadata | Auto-apply with override |
| SEO Agent | Titles, meta, schema, internal links | Metadata / Draft | Schema auto; titles for review |
| GEO Agent | Entity definitions, llms.txt, AI summaries | Metadata | Auto-apply with override |
| Partner Agent | Detect brand mentions, match partners | Alert | Never auto — publisher approves each |
| Disclosure Agent | Ensure disclosures are applied correctly | Automation / Alert | Blocks publish if disclosure missing |
| Distribution Agent | Determine where content surfaces | Metadata | Standard distribution automatic |
| Widget Agent | Select and arrange widget content | Automation | Auto per publisher settings |
| Analytics Agent | Interpret performance, recommend improvements | Alert | Never auto-changes content |
| Growth Agent | Surface collaboration and partnership opportunities | Alert | Publisher initiates all connections |
| Safety & Trust Agent | Check for risk, missing disclosures, false claims | Alert / Block | Blocks publish on critical issues |

**Blueprint:** `docs/engines/ai-orchestration-engine/01-ai-orchestration-engine.md`

---

## Integration Registry

Every current and planned external integration.

| Integration | Engine(s) | Status | Notes |
|---|---|---|---|
| Supabase Auth | Identity | ✅ Active | Auth, RLS, session management |
| Supabase Database | All | ✅ Active | JSONB + metadata column pattern |
| Supabase Storage | Publishing, Media | ✅ Active | `{user_id}/{filename}` path pattern |
| Canva API | Canva Engine, Publishing | 🔴 Planned | Phase 6 — see Canva Engine blueprint |
| Stripe | Billing, Partner | 🔴 Planned | Subscriptions, publisher payouts |
| Email (Resend / SendGrid) | Notification, Automation | 🔴 Planned | Transactional + digest emails |
| Website Import | Import Engine | 🔴 Planned | URL scraping, content extraction |
| Podcast RSS | Import Engine | 🔴 Planned | Episode import, transcript sync |
| YouTube | Import Engine | 🔴 Planned | Video + transcript import |
| Google Drive | Import Engine | 🔴 Future | Document import |
| OneDrive | Import Engine | 🔴 Future | Document import |
| Dropbox | Import Engine | 🔴 Future | Media import |
| Instagram | Import Engine | 🔴 Future | Post import (platform permitting) |
| LinkedIn | Import Engine | 🔴 Future | Article and post import |
| TikTok | Import Engine | 🔴 Future | Caption + video import |
| WordPress | Import Engine | 🔴 Future | Blog post import |
| Affiliate Networks | Partner Engine | 🔴 Planned | Impact, ShareASale, PartnerStack |
| Webhooks | Automation Engine | 🔴 Planned | Outbound event notifications |

---

## Blueprint Document Index

Complete index of all architectural blueprints created.

### Master:
- `docs/engines/00-engine-blueprint.md` — CULO OS Engine Blueprint (all 11 engines) ✅
- `docs/ARCHITECTURE_INDEX.md` — This document ✅

### Partner Engine:
- `docs/engines/partner-engine/01-partner-engine-blueprint.md` ✅
- `docs/engines/partner-engine/02-partner-data-model.md` ✅
- `docs/engines/partner-engine/03-partner-automations.md` ✅
- `docs/engines/partner-engine/04-publisher-partner-centre.md` ✅
- `docs/engines/partner-engine/05-village-pro-business-centre.md` ✅
- `docs/engines/partner-engine/06-recommendation-intelligence-engine.md` ✅
- `docs/engines/partner-engine/07-partner-directory.md` — pending
- `docs/engines/partner-engine/08-partner-analytics.md` — pending
- `docs/engines/partner-engine/09-revenue-engine.md` — pending
- `docs/engines/partner-engine/10-legal-compliance.md` — pending
- `docs/engines/partner-engine/11-admin-dashboard.md` — pending
- `docs/engines/partner-engine/12-implementation-sprint.md` — pending

### Knowledge Engine:
- `docs/engines/knowledge-engine/01-knowledge-graph-engine.md` ✅

### Growth Engine:
- `docs/engines/growth-engine/01-growth-discovery-engine.md` ✅

### AI Orchestration Engine:
- `docs/engines/ai-orchestration-engine/01-ai-orchestration-engine.md` ✅

### Pending Blueprints (priority order):
1. `docs/engines/entity-blueprint.md` — Entity foundation (shared behaviour across all objects)
2. `docs/engines/lifecycle-blueprint.md` — Lifecycle states for every object
3. `docs/engines/event-blueprint.md` — Complete event catalogue (engine communication protocol)
4. `docs/engines/canva-engine/01-canva-engine.md` — Canva API integration
5. `docs/engines/automation-engine/01-automation-engine.md` — All triggers, jobs, webhooks
6. `docs/engines/widget-engine/01-widget-engine.md` — Website embeds and Village widgets
7. `docs/engines/seo-engine/01-seo-engine.md` — Search engine optimisation
8. `docs/engines/geo-engine/01-geo-engine.md` — AI engine optimisation
9. `docs/engines/media-engine/01-media-engine.md` — Media lifecycle
10. `docs/engines/import-engine/01-import-engine.md` — Content import
11. `docs/engines/distribution-engine/01-distribution-engine.md` — One publish, everywhere
12. `docs/engines/notification-engine/01-notification-engine.md` — All notifications
13. `docs/engines/admin-engine/01-admin-engine.md` — Moderation and oversight
14. `docs/engines/billing-engine/01-billing-engine.md` — Memberships and payments

---

## Development Rules

### Before any sprint begins, answer these questions:

**Architecture:**
- Which engine owns this feature?
- Is there an existing engine that should own this, or does a new engine need to be defined?
- Does this change any existing engine's scope?

**Data:**
- Which objects change or are created?
- Which existing DB tables are affected?
- Does this require a new table? (If yes: is there a blueprint for it?)
- Are there schema changes? (Must be justified and documented.)

**Events:**
- Which events does this feature fire?
- Which engines need to listen for these events?
- Are new events needed? (If yes: add to Event Registry.)

**Automations:**
- Which automations trigger?
- Are new automations needed? (If yes: add to relevant automation blueprint.)

**Interfaces:**
- Which dashboard pages change?
- Which public pages change?
- Which widgets update?

**Discoverability:**
- Which SEO metadata changes?
- Which GEO entity definitions change?
- Does this affect the Knowledge Graph?

**AI:**
- Which AI agents participate?
- What is the output class? (Public Content / Monetised Recommendation / Draft / Metadata / Relationship / Automation / Alert)
- What are the approval requirements?

**Integrations:**
- Which external integrations are affected?
- Are there new integration requirements?

---

## Long-Term Vision

CULO is building the operating system for human knowledge.

The platform combines publishing, relationships, discovery, community, business growth, AI and knowledge into one connected ecosystem — not as features bolted together, but as engines that amplify each other.

The objective is not to replace human creativity. The objective is to amplify it: to ensure that the knowledge people already have, and the content they already create, reaches further, connects more people, creates more opportunities and builds more trust than it could without the platform.

Every architectural decision should serve this vision. Features that don't clearly strengthen the ecosystem, deepen relationships or expand discoverability should be deferred until they do.

---

*This document is the permanent entry point for every future developer, AI agent and architectural decision. Update it whenever a new engine is defined, a blueprint is completed, or a significant architectural change is made.*
