# CULO Operating System — Entity Blueprint

**Version:** 1.0  
**Status:** Core Specification — Foundational  
**Scope:** Every object in CULO, present and future  
**References:** `docs/ARCHITECTURE_INDEX.md`, `docs/engines/00-engine-blueprint.md`

---

## Why This Document Exists

As CULO grows from a publishing tool into an operating system, it accumulates objects: Publishers, Businesses, Stories, Partners, Campaigns, Recommendations, Events, Communities, Products, Widgets.

Without a shared foundation, every new object type becomes its own snowflake — its own database shape, its own permission logic, its own SEO handling, its own analytics wiring, its own AI processing rules. That divergence is how platforms become unmaintainable.

The Entity Blueprint solves this by defining what every object in CULO inherits by default. If a new object type is added to the platform, this document tells the developer or AI agent exactly what fields it carries, what behaviours it supports, what lifecycle hooks it exposes, and how every engine interacts with it.

Every future object is an Entity. This document is the parent class.

---

## Philosophy

Everything is an Entity.

A Publisher is an Entity. A Business is an Entity. A Story is an Entity. A Recommendation is an Entity. An Event is an Entity. A Product is an Entity. A Widget is an Entity.

This is not an abstraction for its own sake. It is a commitment to consistency.

When everything is an Entity:
- The Knowledge Graph can model any object as a node without special casing.
- The SEO Engine can generate structured data for any object type.
- The GEO Engine can create entity definitions for any object type.
- The Analytics Engine can track events for any object type.
- The Automation Engine can fire lifecycle hooks for any object type.
- AI agents can read and process any object type with shared context.
- Search can index any object type.
- Widgets can embed any object type.
- The Permission system protects any object type.

None of these capabilities require bespoke implementation for each object. They inherit from the Entity contract.

---

## The Universal Entity

Every Entity in CULO carries the following properties.

Not every property is populated for every Entity at all times. Some are optional. Some are populated by specific engines over time. But every Entity is *capable* of carrying all of them.

---

### 1. Identity

The minimum fields that make an Entity uniquely identifiable.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID | ✅ | Stable, globally unique identifier. Never changes. Never reused. Generated with `crypto.randomUUID()`. |
| `slug` | string | ✅ | URL-safe identifier for human-readable routes (`/founders/mitchell-bateman`). Unique within entity type. May change with care (canonical redirect required). |
| `entity_type` | enum | ✅ | The type of entity. See Entity Type Registry below. |
| `version` | integer | ✅ | Monotonically incrementing version number. Increments on every update. Used for optimistic concurrency and version history. |
| `created_at` | timestamp | ✅ | When this entity was first created. Never changes. |
| `updated_at` | timestamp | ✅ | When this entity was last modified. Updated automatically on any change. |
| `created_by` | UUID | ✅ | The `user_id` of the person who created this entity. |

**Key rule:** `id` is the permanent reference. `slug` is the URL address. Never use `slug` as a foreign key. Never use `id` in URLs.

---

### 2. Ownership

Who is responsible for this Entity.

| Field | Type | Required | Description |
|---|---|---|---|
| `owner_id` | UUID | ✅ | The `user_id` of the current owner. Used by RLS. An Entity without an owner is orphaned and not visible. |
| `owner_type` | enum | ✅ | `publisher`, `business`, `community`, `admin`, `system` |
| `founder_id` | UUID | context | The Founder profile associated with this Entity. Applies when owner is a publisher. |
| `business_id` | UUID | context | The Business profile associated. Applies when owned by or attached to a business. |
| `organisation_id` | UUID | future | For team/agency accounts. Multiple people share ownership. |

---

### 3. Status & Visibility

The lifecycle state of the Entity and who can see it.

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | enum | ✅ | See Lifecycle Blueprint for full per-entity-type state machines. Common values: `draft`, `published`, `archived`, `deleted`. |
| `visibility` | enum | ✅ | `public`, `unlisted`, `private`, `members-only`, `admin-only` |
| `featured` | boolean | ✅ | Whether this Entity is editorially featured in Village surfaces. Set by admin. |
| `verified` | boolean | ✅ | Whether CULO has verified this Entity is authentic. Default `false`. |
| `verification_level` | enum | — | `none`, `email`, `identity`, `business`, `partner`. Not all entity types use all levels. |
| `archived_at` | timestamp | — | When the Entity was archived. Null if not archived. |
| `deleted_at` | timestamp | — | Soft delete timestamp. Null if not deleted. Deleted Entities are never hard-deleted unless legally required. |

**Visibility rules:**
- `public` — anyone can see this entity, including unauthenticated visitors.
- `unlisted` — accessible by direct URL, not surfaced in listings or search.
- `private` — only the owner can see it.
- `members-only` — requires CULO Creatives membership.
- `admin-only` — internal use only.

---

### 4. Display

The fields that define how an Entity is presented to humans.

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | The primary display name. For a Story: the headline. For a Publisher: their name. For a Business: business name. |
| `subtitle` | string | — | Secondary display line. For a Story: subheading. For a Publisher: tagline. |
| `summary` | string | — | 1–3 sentence overview. Used in cards, listings, search results, SEO meta. |
| `description` | string | — | Full description. Rich text permitted. Used on full profile or detail pages. |
| `cover_image_url` | string | — | Primary visual. Displayed in cards, headers, social sharing previews. |
| `avatar_url` | string | — | Profile image. Applies to Publisher, Business, Partner, Community entity types. |
| `colour` | string | — | Brand colour (hex). Used for Entity-specific theming if applicable. |
| `emoji` | string | — | Optional emoji identifier for lightweight visual representation. |

---

### 5. Classification

How an Entity is categorised within the platform.

| Field | Type | Required | Description |
|---|---|---|---|
| `topics` | string[] | — | Topic tags from the platform taxonomy. Used for search, matching, Knowledge Graph. |
| `industries` | string[] | — | Industry categories. |
| `audience_types` | string[] | — | Who this Entity is relevant to. |
| `content_format` | enum | context | Applies to Story entities. `blog`, `reel`, `carousel`, `podcast`, `talking-head`, `voice-over`, `photo-story`, `document`, `external-article`, `youtube-video`, `social-post`. |
| `content_intent` | enum | context | Applies to content entities. `tutorial`, `opinion`, `case-study`, `review`, `comparison`, `news`, `inspiration`, `educational`, `personal-experience`. |
| `language` | string | — | ISO 639-1 language code. Default `en`. |
| `reading_time_minutes` | integer | — | Estimated reading/viewing time. Calculated from content length. |
| `maturity_level` | enum | — | `beginner`, `intermediate`, `advanced`, `expert`. Applies to content and resource entities. |

---

### 6. Location

Where an Entity is based or relevant.

| Field | Type | Required | Description |
|---|---|---|---|
| `country` | string | — | ISO 3166-1 alpha-2 country code. |
| `region` | string | — | State, province, or administrative region. |
| `city` | string | — | City name. |
| `coordinates` | object | — | `{ lat: number, lng: number }` — for map-based discovery (future). |
| `location_display` | string | — | Human-readable location string. e.g. "Sydney, Australia". |
| `remote` | boolean | — | Whether this entity operates remotely (for services, businesses, publishers). |
| `serves_locations` | string[] | — | Locations this entity serves, if different from where it is based. |

---

### 7. Media

All media associated with this Entity.

| Field | Type | Required | Description |
|---|---|---|---|
| `media_ids` | UUID[] | — | IDs of `media_uploads` records attached to this Entity. |
| `cover_image_url` | string | — | Primary display image. (Duplicated from Display for clarity.) |
| `video_url` | string | — | Primary video. For Story entities with video format. |
| `audio_url` | string | — | Primary audio. For podcast/voice-over entities. |
| `document_url` | string | — | Primary document. For document-format stories. |
| `transcript` | string | — | Full text transcript of audio or video content. |
| `gallery_urls` | string[] | — | Ordered list of additional images. |
| `thumbnail_url` | string | — | Thumbnail image distinct from cover. Used in widgets and embeds. |
| `alt_text` | string | — | Accessibility alt text for the primary cover image. |
| `media_metadata` | object | — | Technical metadata: dimensions, duration, file size, MIME type. |

---

### 8. Relationships

How this Entity connects to others in the Knowledge Graph.

| Field | Type | Required | Description |
|---|---|---|---|
| `related_entity_ids` | UUID[] | — | Manually or algorithmically related entities. Used for "Related content" surfaces. |
| `parent_entity_id` | UUID | — | Parent entity. A Campaign belongs to a Partner. A Service belongs to a Business. |
| `child_entity_ids` | UUID[] | — | Child entities owned by this entity. |
| `mentioned_entity_ids` | UUID[] | — | Entities detected as mentioned in this entity's content. Populated by Recommendation Intelligence Engine. |
| `recommended_entity_ids` | UUID[] | — | Entities the Publisher has approved a Recommendation for within this entity. |
| `knowledge_graph_node_id` | UUID | — | The corresponding node in the Knowledge Graph. Created when Knowledge Engine processes this Entity. |
| `relationship_strength` | object | — | Map of `{entity_id: strength_score}` for most important relationships. Maintained by Knowledge Graph Agent. |

---

### 9. SEO

Fields used by the SEO Engine to optimise for search engine discovery.

| Field | Type | Required | Description |
|---|---|---|---|
| `seo_title` | string | — | Custom SEO page title. If null, generated from `title` by SEO Agent. |
| `seo_description` | string | — | Custom meta description. If null, generated from `summary` by SEO Agent. |
| `seo_keywords` | string[] | — | Keyword signals. Supplementary — not a ranking factor but useful for internal routing. |
| `canonical_url` | string | — | The authoritative URL for this Entity. Set if entity has multiple URL paths. |
| `no_index` | boolean | — | Whether to exclude from search indexing. Default `false`. Set to `true` for private/draft entities. |
| `schema_type` | enum | — | The JSON-LD schema type: `Article`, `Person`, `Organization`, `FAQPage`, `HowTo`, `BreadcrumbList`, `Product`, `Event`. |
| `schema_data` | object | — | The full JSON-LD structured data object. Generated by SEO Agent. |
| `sitemap_priority` | float | — | 0.0–1.0 priority in XML sitemap. Default `0.5`. Featured entities get `0.8–1.0`. |
| `sitemap_change_frequency` | enum | — | `always`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, `never`. |
| `internal_links` | object[] | — | Suggested internal links: `[{ anchor: string, target_entity_id: UUID, target_url: string }]`. Generated by SEO Agent. |
| `seo_health_score` | integer | — | 0–100 score from SEO Agent health check. Low score surfaces improvement suggestions. |

---

### 10. GEO (Generative Engine Optimisation)

Fields used by the GEO Engine to make this Entity discoverable by AI systems.

| Field | Type | Required | Description |
|---|---|---|---|
| `geo_entity_name` | string | — | Canonical name as the GEO Engine defines it for AI systems. May differ from `title` if `title` is ambiguous. |
| `geo_entity_type` | string | — | Plain-language type description. e.g. "Australian business founder", "marketing software tool". |
| `geo_summary` | string | — | 2–4 sentence entity definition written for LLM comprehension. Citation-ready. |
| `geo_relationships` | string | — | Prose description of this entity's key relationships. e.g. "Mitchell Bateman is the founder of Pretty Cool Marketing and publishes about Italian food culture." |
| `geo_citation_excerpt` | string | — | The most quotable, factual, verifiable passage from this entity's content. |
| `geo_aliases` | string[] | — | Alternative names, abbreviations, or references to this entity. Used for entity resolution. |
| `geo_disambiguation` | string | — | Clarification if this entity shares a name with another. e.g. "Not to be confused with Apple Inc." |
| `llms_txt_eligible` | boolean | — | Whether this entity contributes to the site's `llms.txt` AI-readable summary. |
| `geo_health_score` | integer | — | 0–100 score from GEO Agent. Low score surfaces improvement suggestions. |

---

### 11. Analytics

Tracking and performance signals for this Entity.

| Field | Type | Required | Description |
|---|---|---|---|
| `analytics_enabled` | boolean | ✅ | Whether analytics events are tracked for this entity. Default `true`. |
| `view_count` | integer | — | Total all-time views. Updated by Analytics Engine. |
| `unique_visitor_count` | integer | — | Total unique visitors. |
| `click_count` | integer | — | Total CTA or partner link clicks. |
| `share_count` | integer | — | Times shared externally (future). |
| `engagement_score` | float | — | Composite engagement signal from Analytics Engine. |
| `trending_score` | float | — | Short-term velocity signal. Used for "Trending" surfaces. |
| `last_viewed_at` | timestamp | — | Last time this entity was viewed by anyone. Used for staleness detection. |
| `analytics_events` | UUID[] | — | References to `analytics_events` records for this entity (future). |

---

### 12. Permissions

Who can do what with this Entity.

| Field | Type | Required | Description |
|---|---|---|---|
| `is_public` | boolean | ✅ | Derived from `visibility = 'public'`. Shortcut for RLS policies. |
| `read_roles` | string[] | — | Roles that can read this entity. Default: `['public']` for published entities. |
| `write_roles` | string[] | — | Roles that can write. Default: `['owner']`. |
| `publish_roles` | string[] | — | Roles that can change status to `published`. Default: `['owner']`. |
| `delete_roles` | string[] | — | Roles that can delete. Default: `['owner', 'admin']`. |
| `feature_roles` | string[] | — | Roles that can set `featured = true`. Default: `['admin']`. |
| `verify_roles` | string[] | — | Roles that can set `verified = true`. Default: `['admin']`. |

**Permission hierarchy:** `admin` > `owner` > `editor` (future team accounts) > `member` (future) > `public`

---

### 13. AI Metadata

Context the AI Orchestration Engine maintains about this Entity.

| Field | Type | Required | Description |
|---|---|---|---|
| `ai_processed_at` | timestamp | — | When AI agents last processed this entity. |
| `ai_processing_version` | string | — | Version identifier of the agent pipeline that last ran. Used to detect entities that need reprocessing after agent upgrades. |
| `ai_confidence_scores` | object | — | Map of `{agent_name: confidence}` for each agent that has processed this entity. |
| `ai_flags` | string[] | — | Issues flagged by Safety & Trust Agent. e.g. `['missing-disclosure', 'unsupported-claim']`. |
| `ai_suggestions_pending` | integer | — | Count of AI-generated suggestions awaiting publisher review. Surfaces notification badge. |
| `ai_voice_fingerprint_id` | UUID | — | Reference to publisher's learned voice model (future). Used by Story Agent to maintain voice consistency. |
| `ai_excluded` | boolean | — | Whether AI agents are excluded from processing this entity. Set by admin or publisher for specific content. |

---

### 14. Automation Metadata

Context the Automation Engine maintains for triggering and tracking automations.

| Field | Type | Required | Description |
|---|---|---|---|
| `automation_hooks` | string[] | — | Which lifecycle hooks are active for this entity. e.g. `['on_publish', 'on_feature', 'on_archive']`. |
| `last_automation_at` | timestamp | — | When the last automation ran for this entity. |
| `automation_history` | UUID[] | — | References to `automation_log` records for this entity (future). |
| `notification_sent_at` | object | — | Map of `{notification_type: timestamp}` to prevent duplicate notifications. |
| `scheduled_publish_at` | timestamp | — | If status is `scheduled`, publish at this timestamp. |
| `scheduled_archive_at` | timestamp | — | If set, archive automatically at this timestamp. |

---

### 15. Search Metadata

Fields used by the Search Engine for indexing and ranking.

| Field | Type | Required | Description |
|---|---|---|---|
| `search_indexed` | boolean | — | Whether this entity is included in the search index. |
| `search_indexed_at` | timestamp | — | When this entity was last indexed. |
| `search_weight` | float | — | Manual weight adjustment for search ranking. Default `1.0`. Featured entities may be boosted. |
| `search_tokens` | string[] | — | Pre-computed search tokens for fast matching (future full-text search). |
| `search_embedding` | vector | — | Semantic embedding vector for semantic/AI search (future). |

---

### 16. Widget Metadata

How this Entity behaves when embedded in a Widget.

| Field | Type | Required | Description |
|---|---|---|---|
| `widget_eligible` | boolean | — | Whether this entity can appear in widgets. Default `true` for published entities. |
| `widget_card_type` | enum | — | Which card template to use: `story-card`, `profile-card`, `product-card`, `event-card`, `recommendation-card`. |
| `widget_embed_url` | string | — | The URL for this entity's embeddable widget, if it has one. |
| `widget_data_url` | string | — | The API endpoint that returns this entity's data for widget rendering. |

---

### 17. Health

Computed quality signals that surface improvement suggestions.

| Field | Type | Required | Description |
|---|---|---|---|
| `health_score` | integer | — | 0–100 composite health score. Computed from checks below. |
| `health_checks` | object | — | Map of `{check_name: pass/fail/warning}`. Updated by AI agents and system scans. |
| `health_issues` | string[] | — | List of active health issue codes. Cleared when issues are resolved. |
| `health_last_checked_at` | timestamp | — | When the health check last ran for this entity. |

**Common health checks (applied where relevant to entity type):**

| Check | Entity Types | Severity |
|---|---|---|
| `missing-cover-image` | Story, Publisher, Business, Event | Warning |
| `missing-seo-description` | Story, Publisher, Business | Warning |
| `missing-geo-summary` | Publisher, Business, Partner | Warning |
| `missing-alt-text` | Any with media | Warning |
| `missing-topics` | Story, Library, Idea | Warning |
| `missing-location` | Publisher, Business, Event | Info |
| `broken-partner-link` | Recommendation | Error |
| `missing-disclosure` | Recommendation | Error |
| `no-published-stories` | Publisher, Business | Info |
| `expired-program` | Partner Program, Campaign | Warning |
| `stale-content` | Story (>12 months, no updates) | Info |
| `missing-transcript` | Video/audio Story | Info |
| `no-internal-links` | Story | Info |
| `low-seo-score` | Story, Publisher, Business | Warning |
| `low-geo-score` | Publisher, Business, Partner | Warning |

---

## Entity Type Registry

Every first-class entity type in CULO.

| Entity Type | Owner Engine | DB Table | Slug Prefix | Public Page |
|---|---|---|---|---|
| `publisher` | Identity | `founders` | `/founders/{slug}` | ✅ |
| `business` | Identity | `businesses` | `/mercato/{slug}` | ✅ |
| `story` | Publishing | `stories` | `/stories/{slug}` | ✅ |
| `idea` | Publishing | `library_items` (type=idea) | future | future |
| `library_item` | Publishing | `library_items` | future | future |
| `service` | Identity | `services` | within business profile | context |
| `media` | Publishing | `media_uploads` | none | no |
| `partner` | Partner | `partners` | future `/partners/{slug}` | future |
| `partner_program` | Partner | `partner_programs` | within partner profile | no |
| `recommendation` | Partner | `recommendations` | none (inline in story) | no |
| `brand_mention` | Partner | `brand_mentions` | none | no |
| `campaign` | Partner | `campaigns` | future | future |
| `earnings` | Partner | `earnings` | none | no |
| `payout` | Partner | `payouts` | none | no |
| `product` | Partner/Future | future | future | future |
| `brand` | Knowledge | Knowledge Graph | future | future |
| `event` | Future | future | `/events/{slug}` | future |
| `community` | Future | future | `/communities/{slug}` | future |
| `course` | Future | future | future | future |
| `podcast` | Future | future | future | future |
| `book` | Future | future | future | future |
| `resource` | Knowledge | `library_items` (type=resource) | future | future |
| `location` | Knowledge | Knowledge Graph | future | future |
| `industry` | Knowledge | Knowledge Graph | future | future |
| `topic` | Knowledge | Knowledge Graph | future | future |
| `technology` | Knowledge | Knowledge Graph | future | future |
| `software` | Knowledge | Knowledge Graph | future | future |
| `organisation` | Knowledge | Knowledge Graph | future | future |
| `widget` | Widget | `widget_configurations` (future) | none | embedded |

---

## Entity Ownership Rules

| Who | Owns |
|---|---|
| **Publisher** | Stories · Ideas · Media Uploads · Library Items · Services (via their Business) · Businesses |
| **Business** | Campaigns · Partner Programs (via Partner entity) · Products · Services |
| **Partner** | Partner Programs · Campaigns |
| **Community** | Events · Resources · Announcements (future) |
| **System / Admin** | Topics · Industries · Locations · Technology entities · Brand entities (until claimed) |
| **Knowledge Engine** | Knowledge Graph nodes and edges (derived, not user-created) |

**Ownership transfer:** Ownership of an Entity may be transferred by admin. It may not be transferred by the current owner unilaterally — this prevents content hijacking.

**Orphan policy:** An Entity without a valid owner (e.g., owner account deleted) becomes `visibility = 'admin-only'`. It is not deleted. Admin reviews and either reassigns or archives.

---

## Entity Relationship Types

The types of connections that can exist between any two Entities in the Knowledge Graph.

| Relationship | Direction | Example |
|---|---|---|
| `OWNS` | Publisher → Business | Mitchell owns Pretty Cool Marketing |
| `CREATED` | Publisher → Story | Mitchell created this story |
| `MENTIONS` | Story → Brand | Story mentions Canva |
| `RECOMMENDS` | Publisher → Product | Publisher recommends Notion |
| `USES` | Publisher → Software | Publisher uses CapCut |
| `ATTENDS` | Publisher → Event | Publisher attended FinanceConf |
| `BELONGS_TO` | Publisher → Community | Publisher is a member of Founders Club |
| `PARTNERS_WITH` | Business → Business | Agency partners with SaaS tool |
| `TEACHES` | Story → Topic | Tutorial teaches productivity |
| `REFERENCES` | Story → Library Item | Story links to a resource |
| `SUPPORTS` | Library Item → Story | Resource supports story argument |
| `HOSTS` | Community → Event | Community hosts annual summit |
| `SPONSORS` | Business → Event | Business sponsors the summit |
| `EMPLOYS` | Business → Publisher | Publisher is employed by Business (future) |
| `COLLABORATES_WITH` | Publisher → Publisher | Two publishers co-authored content |
| `PUBLISHES` | Publisher → Story | (synonym for CREATED, used in graph traversal) |
| `INTERVIEWED` | Podcast → Publisher | Podcast interviewed Publisher |
| `WRITTEN_BY` | Book → Person | Book authored by Person |
| `COVERS` | Podcast → Topic | Podcast covers AI topic |
| `COMPETES_WITH` | Software → Software | Two tools in same category |
| `SOLVED_BY` | Problem → Solution | Problem is addressed by this content |
| `MATCHED_TO` | Publisher → Opportunity | Growth Engine matched Publisher to Opportunity |

---

## Entity Capabilities

Each capability is opt-in per entity type. The table below defines which capabilities apply to each.

| Capability | Publisher | Business | Story | Partner | Campaign | Event | Community | Library |
|---|---|---|---|---|---|---|---|---|
| SEO | ✅ | ✅ | ✅ | ✅ | future | ✅ | ✅ | future |
| GEO | ✅ | ✅ | ✅ | ✅ | — | future | future | — |
| Analytics | ✅ | ✅ | ✅ | ✅ | ✅ | future | future | ✅ |
| Knowledge Graph | ✅ | ✅ | ✅ | ✅ | — | future | future | ✅ |
| AI Processing | ✅ | ✅ | ✅ | ✅ | — | future | — | ✅ |
| Automation Hooks | ✅ | ✅ | ✅ | ✅ | ✅ | future | future | — |
| Widgets | ✅ | ✅ | ✅ | ✅ | — | future | — | future |
| Partner Engine | ✅ | ✅ | ✅ | ✅ | ✅ | future | — | — |
| Versioning | — | — | ✅ | — | — | — | — | ✅ |
| Media | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| Health Score | ✅ | ✅ | ✅ | ✅ | ✅ | future | future | ✅ |
| Trust Score | ✅ | ✅ | — | ✅ | — | — | — | — |
| Quality Score | — | — | ✅ | — | — | — | — | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Search Indexing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Commenting | — | — | future | — | — | future | future | — |
| History | — | — | ✅ | — | — | — | — | — |

---

## Entity Interfaces

Standard operations every Entity exposes. Engines call these interfaces rather than working directly with database rows.

| Interface | Description | Who calls it |
|---|---|---|
| `display()` | Return the minimal card data for a listing: `{ id, slug, title, summary, cover_image_url, entity_type, status }` | Distribution Engine, Search Engine, Widgets |
| `search()` | Return search-indexed representation: `{ title, summary, topics, industries, location, entity_type }` | Search Engine |
| `edit()` | Return full editable object for dashboard forms | Publishing Engine, Identity Engine |
| `archive()` | Set status to `archived`, set `archived_at`, fire `EntityArchived` event | Owner, Admin |
| `publish()` | Set status to `published`, fire `EntityPublished` event, trigger downstream engines | Owner |
| `feature()` | Set `featured = true`, fire `EntityFeatured` event | Admin only |
| `recommend()` | Create a Recommendation record linking this entity to a publisher | Partner Engine |
| `share()` | Generate shareable URL with Open Graph metadata | Distribution Engine |
| `embed()` | Return widget embed configuration and data | Widget Engine |
| `export()` | Export this entity as JSON or structured format | Owner, API |
| `import()` | Populate entity fields from external source | Import Engine |
| `synchronise()` | Re-sync this entity with its Supabase record, Knowledge Graph node, SEO metadata, and search index | System |
| `analyse()` | Run AI agent pipeline against this entity | AI Orchestration Engine |
| `delete()` | Soft delete — set `deleted_at`, set visibility to `admin-only`, fire `EntityDeleted` event | Owner, Admin |

---

## Entity Lifecycle Hook Points

Every Entity exposes these hooks to the Automation Engine. When a hook fires, the Automation Engine checks its trigger registry and runs any matching automations.

| Hook | Fires when | Example automations |
|---|---|---|
| `entity.created` | Entity is first created in any state | Send welcome notification, initialise health score |
| `entity.updated` | Any field changes | Re-run affected AI agents, update search index |
| `entity.published` | Status changes to `published` | Full publish pipeline: Knowledge Graph, Partner scan, SEO, GEO, Distribution, Analytics |
| `entity.featured` | `featured` set to `true` | Update homepage widget, notify publisher, boost search weight |
| `entity.unfeatured` | `featured` set to `false` | Remove from featured surfaces |
| `entity.archived` | Status changes to `archived` | Remove from public surfaces, retain data |
| `entity.deleted` | `deleted_at` set | Remove from all surfaces, anonymise analytics if required |
| `entity.viewed` | Entity page loaded by any user | Increment `view_count`, update `last_viewed_at` |
| `entity.shared` | Share action triggered | Increment `share_count`, analytics event |
| `entity.recommended` | A Recommendation is approved for this entity | Update Knowledge Graph, notify business if applicable |
| `entity.imported` | Entity created via Import Engine | Run AI processing pipeline, queue publisher review |
| `entity.exported` | Entity exported via API or manual export | Log export event |
| `entity.matched` | Growth Engine matches this entity to an opportunity | Notify publisher, add to Growth Dashboard |
| `entity.analysed` | AI Orchestration Engine completes processing | Update `ai_processed_at`, surface suggestions in dashboard |
| `entity.health_degraded` | Health score drops below threshold | Notify publisher of specific issues |
| `entity.verified` | `verified` set to `true` | Update public profile, unlock verification badge |

---

## Entity Health Score — Computation

The Health Score (0–100) is computed from weighted checks.

| Check Group | Weight | Checks Included |
|---|---|---|
| Identity completeness | 20% | Title, summary, cover image, slug |
| Classification | 15% | Topics, industries, location (where applicable) |
| Media quality | 15% | Cover image, alt text, transcript (for video/audio) |
| SEO | 20% | Meta description, schema, internal links, seo_health_score |
| GEO | 10% | Entity summary, aliases, geo_health_score |
| Relationships | 10% | At least one Knowledge Graph relationship, no broken links |
| Compliance | 10% | No unresolved AI flags, no missing disclosures |

A score of 0–49 = Poor. 50–74 = Fair. 75–89 = Good. 90–100 = Excellent.

Health Score is surfaced in:
- Publisher dashboard Publishing Health panel
- Story review panel
- Partner Centre (for Recommendation entities)
- Admin dashboard (across all entities)

---

## AI Agent Interactions

How each AI agent interacts with Entities.

| Agent | Reads from Entity | Writes to Entity | May Never |
|---|---|---|---|
| Insight Agent | `description`, `transcript`, `summary` | `ai_suggestions_pending` | Modify `title`, `status` |
| Story Agent | All content fields | Draft fields only | Set `status = published` without publisher action |
| Format Agent | `description`, `media_ids` | `content_format` | Modify any content |
| Media Agent | `media_ids`, `video_url`, `audio_url` | `alt_text`, `transcript`, `thumbnail_url` | Modify story body |
| Relationship Agent | `description`, `transcript`, `topics` | `mentioned_entity_ids`, `knowledge_graph_node_id` | Modify owned content |
| Knowledge Graph Agent | All fields | `knowledge_graph_node_id`, `relationship_strength` | Modify any user-created content |
| FAQ Agent | `description`, `transcript` | `ai_suggestions_pending` | Publish FAQs without publisher approval |
| Topic Agent | `title`, `summary`, `description` | `topics`, `industries`, `content_intent` | Modify title |
| SEO Agent | All display, classification, media fields | `seo_title`, `seo_description`, `schema_data`, `internal_links`, `seo_health_score` | Modify story body |
| GEO Agent | All display and relationship fields | `geo_summary`, `geo_entity_name`, `geo_citation_excerpt`, `geo_health_score` | Modify any public content |
| Partner Agent | `description`, `transcript`, `media_ids` | `mentioned_entity_ids`, `ai_flags` | Insert partner links |
| Disclosure Agent | `recommended_entity_ids`, `ai_flags` | `ai_flags` | Remove disclosures |
| Safety & Trust Agent | All content fields | `ai_flags`, `health_issues` | Modify content — flags only |
| Analytics Agent | `analytics_events`, `view_count` | `engagement_score`, `trending_score` | Modify any other field |
| Growth Agent | `topics`, `industries`, `locations`, `relationship_strength` | `ai_suggestions_pending` | Modify entity data |

---

## Future Expansion

The Entity System is designed to accommodate growth without redesign.

**Enterprise and team accounts:** The `owner_id` field transitions from a single user to an organisation with role-based access. No Entity field changes required — permission logic changes.

**Custom entity types:** An `entity_type` registry allows future entity types to be added. As long as a new type inherits the Universal Entity fields, all engines continue to work.

**Plugins and marketplace (future):** Third-party developers can create new entity types by registering them in the entity type registry. The entity system defines the contract; third parties implement within it.

**Multiple owners:** The `organisation_id` field is reserved for future team accounts where multiple publishers share ownership of entities.

**Version history:** The `version` field is in place. Full version history storage is a future implementation — the field provides the hook.

**Permissions extensions:** `read_roles`, `write_roles` arrays can be extended with new role types (Editor, Contributor, Reviewer) without changing the permission model.

**External APIs:** Every entity's `id`, `slug`, and `entity_type` provide a stable address for API consumers. The entity interface methods provide the operations. External API development requires no architecture changes.

---

## The One Rule

Every object in CULO is an Entity.

If a new object is proposed and it cannot be described using the Universal Entity fields — if it requires a fundamentally different identity model, permission model, or lifecycle — that is a signal to revisit the Entity Blueprint before building, not a signal to build outside it.

The Entity Blueprint is a living document. It grows as the platform grows. But it remains the single parent specification.

---

*This document is the foundational specification for every object in CULO. Every new entity type, every new engine, and every new feature inherits from this blueprint before implementation begins.*
