# CULO Operating System — Metadata Blueprint

**Version:** 1.0  
**Status:** Core Specification — Foundational  
**Scope:** Every entity and engine in CULO  
**References:** `docs/core/01-entity-blueprint.md`, `docs/core/05-relationship-blueprint.md`

---

## Philosophy

Metadata is not an afterthought. Metadata is architecture.

In most platforms, metadata is what you add after content is created — a category here, a tag there. In CULO, metadata is what makes content findable, understandable, connectable, distributable and valuable.

Every piece of content has two forms: the content itself (what the publisher wrote), and the metadata (what the platform understands about it). Both matter. The content is what humans read. The metadata is what engines, AI systems, search tools and future APIs understand.

Good metadata is cumulative. It begins sparse when an entity is created and grows richer over time as AI processes it, publishers refine it, engines analyse it, and readers interact with it.

---

## Metadata Categories

CULO metadata is organised into 13 categories. Every entity carries metadata from one or more of these categories.

---

## 1. Identity Metadata

Who and what this entity is. The minimum set of fields needed to uniquely identify and address an entity.

| Field | Owner | Description |
|---|---|---|
| `entity_id` | System | UUID — never changes, never reused |
| `entity_type` | System | Publisher, Story, Business, Partner, etc. |
| `slug` | Publisher / System | URL-safe identifier. Human-readable. May change. |
| `canonical_name` | Publisher | The definitive name for this entity. Used in search, SEO, GEO. |
| `alternative_names` | Publisher / AI | Other names this entity is known by |
| `aliases` | Publisher / AI | Abbreviations, nicknames, former names |
| `language` | System / Publisher | ISO 639-1 code. Default: `en` |
| `country` | Publisher | Primary country |
| `region` | Publisher | State or region |
| `city` | Publisher | City |
| `created_at` | System | Cannot be changed |
| `updated_at` | System | Automatic on any change |
| `owner_id` | System | The primary owner's user_id |
| `status` | System / Publisher | Current lifecycle state |
| `visibility` | Publisher | Who can see this entity |
| `version` | System | Monotonically incrementing integer |
| `verification_level` | Admin | none · email · identity · business · partner |

**Owner:** Identity Engine and Publishing Engine set these. Publisher may edit `canonical_name`, `alternative_names`, `slug`.

---

## 2. Publishing Metadata

When, how and from where this entity was published.

| Field | Owner | Description |
|---|---|---|
| `published_at` | System | When status became `published` |
| `first_published_at` | System | First time published (persists across archive/restore cycles) |
| `last_updated_at` | System | When content was last meaningfully changed |
| `publication_source` | System | `native`, `canva_api`, `import_website`, `import_podcast`, `import_youtube`, `import_social`, `camera_roll` |
| `content_type` | Publisher / AI | blog · reel · carousel · podcast · talking-head · voice-over · photo-story · document · external-article · youtube-video · social-post |
| `content_intent` | AI / Publisher | tutorial · review · case-study · opinion · comparison · news · inspiration · educational · personal-experience |
| `original_source_url` | Import Engine | If imported — the original URL |
| `import_date` | System | When the content was imported |
| `canva_design_id` | Canva Engine | Future — Canva's ID for this design |
| `word_count` | System | Calculated from content |
| `reading_time_minutes` | System | Estimated from word count and media |
| `maturity_level` | AI / Publisher | beginner · intermediate · advanced · expert |
| `scheduled_publish_at` | Publisher | If scheduled, publish at this timestamp |

**Owner:** Publishing Engine manages all publishing metadata.

---

## 3. Search Metadata

What the Search Engine uses to index and rank this entity.

| Field | Owner | Description |
|---|---|---|
| `search_keywords` | Publisher / AI | Primary search terms |
| `search_synonyms` | AI | Related terms that should resolve to this entity |
| `search_weight` | Admin | Manual weight adjustment. Default `1.0`. Featured entities boosted. |
| `search_indexed` | System | Whether this entity is currently indexed |
| `search_indexed_at` | System | When last indexed |
| `search_popularity_score` | Analytics Engine | Calculated from views, clicks and engagement |
| `search_freshness_score` | System | Time-decayed recency signal |
| `search_tokens` | System | Pre-computed full-text search tokens |
| `search_embedding` | AI | Vector embedding for semantic search (future) |
| `autocomplete_terms` | AI | Terms to include in search autocomplete |

**Owner:** Search Engine reads; Analytics Engine updates popularity; AI agents enrich synonyms and autocomplete.

---

## 4. SEO Metadata

What traditional search engines (Google, Bing) need to discover and understand this entity.

| Field | Owner | Description |
|---|---|---|
| `seo_title` | AI / Publisher | Custom page title (max 60 chars). If null, generated from `canonical_name`. |
| `seo_description` | AI / Publisher | Meta description (max 160 chars). If null, generated from `summary`. |
| `seo_keywords` | Publisher / AI | Supplementary keyword signals |
| `canonical_url` | System | The definitive URL for this entity |
| `open_graph_title` | AI / Publisher | OG title for social sharing |
| `open_graph_description` | AI / Publisher | OG description |
| `open_graph_image_url` | Publisher / AI | OG image (ideally 1200×630px) |
| `twitter_card_type` | System | `summary_large_image` for most entities |
| `no_index` | System / Admin | Exclude from indexing. Auto-set for draft and private entities. |
| `schema_type` | SEO Engine | JSON-LD schema type: Article, Person, Organization, FAQPage, etc. |
| `schema_data` | SEO Engine | Full JSON-LD object. Regenerated on update. |
| `sitemap_priority` | SEO Engine | 0.0–1.0. Default 0.5. Featured: 0.9. |
| `sitemap_change_frequency` | SEO Engine | always · hourly · daily · weekly · monthly · never |
| `internal_links` | SEO Engine | Suggested outbound internal links |
| `backlinks` | Analytics / External | Future: inbound link count from external sources |
| `seo_health_score` | SEO Agent | 0–100. Updated by SEO health scan. |
| `seo_issues` | SEO Agent | List of active SEO issue codes |

**Owner:** SEO Agent generates all SEO metadata. Publisher may override `seo_title` and `seo_description`. System auto-sets `no_index` based on lifecycle state.

---

## 5. GEO Metadata

What AI systems (ChatGPT, Perplexity, Claude, Google AI Overview) need to understand and cite this entity.

| Field | Owner | Description |
|---|---|---|
| `geo_entity_name` | GEO Agent / Publisher | Canonical name as AI systems should reference this entity |
| `geo_entity_type` | GEO Agent | Plain-language type: "Australian business founder", "marketing software" |
| `geo_summary` | GEO Agent / Publisher | 2–4 sentence entity definition. Citation-ready. Factual. |
| `geo_relationships` | GEO Agent | Prose description of key relationships. e.g. "Mitchell Bateman is the founder of Pretty Cool Marketing." |
| `geo_citation_excerpt` | GEO Agent / Publisher | The most quotable, verifiable passage from this entity's content |
| `geo_primary_entities` | GEO Agent | The most important entities related to this one (for LLM context window) |
| `geo_secondary_entities` | GEO Agent | Supporting entities (lower importance) |
| `geo_topics` | GEO Agent | Topics this entity is authoritative on |
| `geo_industries` | GEO Agent | Industries this entity belongs to |
| `geo_locations` | GEO Agent | Locations associated with this entity |
| `geo_aliases` | Publisher / AI | All known alternative names for entity resolution |
| `geo_disambiguation` | GEO Agent / Publisher | Disambiguation note if entity shares a name with another |
| `geo_authority_signals` | GEO Agent | What evidence exists that this entity is authoritative |
| `llms_txt_eligible` | GEO Agent | Whether to include in the site's llms.txt |
| `geo_health_score` | GEO Agent | 0–100. Updated by GEO health scan. |

**Owner:** GEO Agent generates all GEO metadata. Publisher may edit `geo_summary` and `geo_citation_excerpt`.

---

## 6. AI Metadata

Context the AI Orchestration Engine maintains about how AI has interacted with this entity.

| Field | Owner | Description |
|---|---|---|
| `ai_processed_at` | AI Orchestration | Timestamp of last full agent pipeline run |
| `ai_processing_version` | AI Orchestration | Version identifier — used to detect entities needing reprocessing after agent upgrade |
| `ai_agents_run` | AI Orchestration | List of agents that have processed this entity |
| `ai_confidence_scores` | AI Agents | Map of `{agent_name: confidence}` |
| `ai_flags` | Safety & Trust Agent | Active issues: `missing-disclosure`, `unsupported-claim`, etc. |
| `ai_suggestions_pending` | AI Orchestration | Count of unreviewed AI suggestions |
| `ai_generated_fields` | AI Orchestration | List of fields that were AI-generated and not yet edited by publisher |
| `ai_voice_fingerprint_id` | AI Orchestration | Reference to publisher's voice model (future) |
| `ai_excluded` | Publisher / Admin | If `true`, AI agents do not process this entity |
| `ai_risk_score` | Safety & Trust Agent | 0–1. Higher = more content risk flagged. |
| `ai_last_flag_reviewed_at` | Publisher | When publisher last reviewed AI flags |

**Owner:** AI Orchestration Engine writes all AI metadata. Publishers can set `ai_excluded` and review flags.

---

## 7. Relationship Metadata

Summarised relationship signals attached to the entity (full detail in the relationship graph).

| Field | Owner | Description |
|---|---|---|
| `knowledge_graph_node_id` | Knowledge Engine | The entity's node ID in the Knowledge Graph |
| `relationship_count` | Knowledge Engine | Total active relationships |
| `relationship_strength_avg` | Knowledge Engine | Average strength across all relationships |
| `top_connected_entities` | Knowledge Engine | Top 5 most strongly connected entity IDs (for quick access) |
| `mentioned_entity_ids` | Partner / Knowledge | Entities detected as mentioned in this entity's content |
| `recommends_entity_ids` | Partner Engine | Entities the publisher has approved recommendations for |
| `related_entity_ids` | Knowledge / AI | Semantically or editorially related entities |
| `parent_entity_id` | System | Parent in ownership hierarchy |
| `child_entity_ids` | System | Children in ownership hierarchy |

**Owner:** Knowledge Engine manages all relationship metadata.

---

## 8. Analytics Metadata

Performance signals attached to the entity.

| Field | Owner | Description |
|---|---|---|
| `view_count` | Analytics Engine | Total page views |
| `unique_visitor_count` | Analytics Engine | Estimated unique visitors (anonymised) |
| `read_count` | Analytics Engine | Visitors who scrolled ≥70% (proxy for reads) |
| `avg_scroll_depth` | Analytics Engine | Average scroll depth across visits |
| `click_count` | Analytics Engine | Total CTA / partner link clicks |
| `share_count` | Analytics Engine | Times shared externally (future) |
| `recommendation_click_count` | Analytics Engine | Clicks specifically on partner recommendation links |
| `conversion_count` | Analytics Engine | Attributed conversions from partner recommendations |
| `revenue_attributed` | Analytics Engine | Total publisher earnings attributed to this entity |
| `engagement_score` | Analytics Engine | Composite signal: views × depth × clicks |
| `trending_score` | Analytics Engine | Short-term velocity (last 7 days normalised) |
| `last_viewed_at` | Analytics Engine | Last time anyone loaded this entity's page |
| `analytics_enabled` | Publisher / System | Whether tracking is active for this entity |

**Owner:** Analytics Engine writes all analytics metadata. Read-only for all other engines.

---

## 9. Widget Metadata

How this entity behaves when included in a Widget.

| Field | Owner | Description |
|---|---|---|
| `widget_eligible` | System | Auto-set to `true` for published entities |
| `widget_card_type` | System / Publisher | story-card · profile-card · product-card · event-card · recommendation-card |
| `widget_embed_url` | Widget Engine | The URL for this entity's embeddable widget |
| `widget_data_url` | Widget Engine | API endpoint returning entity data for widget rendering |
| `widget_count` | Widget Engine | How many active widgets include this entity |
| `widget_view_count` | Analytics Engine | Views generated from widget embeds |
| `widget_click_count` | Analytics Engine | Clicks originating from widget embeds |
| `featured_in_widgets` | Widget Engine | List of widget IDs that feature this entity |

**Owner:** Widget Engine manages widget metadata. Analytics Engine updates performance counters.

---

## 10. Automation Metadata

What the Automation Engine knows about scheduled and triggered automations for this entity.

| Field | Owner | Description |
|---|---|---|
| `automation_hooks_active` | Automation Engine | Which lifecycle hooks are registered |
| `last_automation_at` | Automation Engine | When the last automation ran |
| `next_scheduled_automation_at` | Automation Engine | If a scheduled automation is pending |
| `automation_history_count` | Automation Engine | Total automations run for this entity |
| `pending_review_count` | Automation Engine | Items awaiting publisher action |
| `notification_sent_log` | Automation Engine | Map of `{notification_type: last_sent_at}` to prevent duplicates |
| `scheduled_publish_at` | Publisher | If `status = scheduled`, publish at this time |
| `scheduled_archive_at` | Publisher | Auto-archive at this time |

**Owner:** Automation Engine manages all automation metadata.

---

## 11. Quality Metadata

Signals that describe how well-formed, trustworthy and complete this entity is.

| Field | Owner | Description |
|---|---|---|
| `content_quality_score` | AI Agent | 0–100. Considers depth, originality, clarity |
| `authority_score` | Knowledge Engine | 0–100. Relationship strength × topic expertise depth |
| `completeness_score` | System | 0–100. Based on required and recommended fields present |
| `trust_score` | Partner Engine | 0–100. Publisher trust in recommendation context |
| `readability_score` | AI Agent | 0–100. Sentence complexity, paragraph length |
| `accessibility_score` | System | 0–100. Alt text presence, heading structure, contrast (future) |
| `media_quality_score` | Media Engine | 0–100. Resolution, aspect ratio, compression |
| `recommendation_quality_score` | Partner Engine | 0–100. Conversion quality, click rate, disclosure compliance |
| `overall_quality_score` | System | Weighted composite of above scores |

**Owner:** Respective engines and agents write quality scores. No single engine owns them all.

---

## 12. Health Metadata

Active issues that need attention. (Full Health system defined in `docs/core/07-health-blueprint.md`.)

| Field | Owner | Description |
|---|---|---|
| `health_score` | System | 0–100 weighted composite |
| `health_checks` | System | Map of `{check_name: 'pass'|'fail'|'warning'}` |
| `health_issues` | System | Active issue codes |
| `health_last_checked_at` | System | When health scan last ran |
| `seo_health_score` | SEO Agent | 0–100 |
| `geo_health_score` | GEO Agent | 0–100 |
| `relationship_health_score` | Knowledge Engine | 0–100 |
| `media_health_score` | Media Engine | 0–100 |
| `partner_health_score` | Partner Engine | 0–100 |
| `automation_health_score` | Automation Engine | 0–100 |

---

## 13. Future Metadata

These fields are reserved for future capabilities. They are not currently populated but are defined to ensure the schema is forward-compatible.

| Field | Future use |
|---|---|
| `marketplace_listing_id` | If entity is listed in a future CULO Marketplace |
| `plugin_metadata` | Extension fields added by third-party plugins |
| `enterprise_metadata` | Custom fields for enterprise accounts |
| `crm_sync_id` | Reference to CRM contact or company |
| `commerce_metadata` | Pricing, inventory, purchase URL for product entities |
| `subscription_metadata` | For subscription-based content (future) |
| `event_metadata` | Tickets, dates, location, capacity for event entities |
| `course_metadata` | Curriculum, modules, enrolment for course entities |
| `community_metadata` | Membership rules, size, moderation for community entities |
| `ai_memory_id` | Reference to publisher's personalised AI memory model (future) |

---

## Metadata Ownership Matrix

Who creates, who may edit, and who reads each metadata category.

| Category | Created by | Editable by | Read by |
|---|---|---|---|
| Identity | System / Publisher | Publisher (name, slug, aliases) | All engines |
| Publishing | System / Publisher | Publisher (type, intent, scheduled dates) | All engines |
| Search | Search Engine / AI | Admin (weight) | Search Engine, Analytics |
| SEO | SEO Agent | Publisher (title, description override) | SEO Engine, Distribution, GEO |
| GEO | GEO Agent | Publisher (summary, citation override) | GEO Engine, SEO Engine, Knowledge |
| AI | AI Orchestration | Publisher (ai_excluded, flag review) | All engines |
| Relationship | Knowledge Engine | Knowledge Engine, Publisher (confirm/reject) | All engines |
| Analytics | Analytics Engine | Read-only | Publisher (own), Admin, Partner |
| Widget | Widget Engine | Publisher (widget settings) | Widget Engine, Analytics |
| Automation | Automation Engine | Publisher (schedules, hooks) | Automation Engine |
| Quality | Various agents | Read-only | Publisher (own), Admin |
| Health | Various engines | Read-only | Publisher (own), Admin |
| Future | Reserved | TBD | TBD |

---

## Metadata Lifecycle

```
Entity Created
      │
      ▼
Initial metadata set
(identity, status, owner, slug, created_at)
      │
      ▼
Publisher completes fields
(title, summary, description, cover image, topics, location)
      │
      ▼
Entity Published
      │
      ▼
AI Enrichment begins (async)
  ├── Topic Agent → topics, industries, content_intent
  ├── SEO Agent → seo_title, seo_description, schema_data
  ├── GEO Agent → geo_summary, geo_entity_name, geo_citation_excerpt
  ├── Relationship Agent → knowledge_graph_node_id, relationship updates
  ├── Analytics Engine → view_count tracking begins
  └── Safety & Trust Agent → ai_flags, ai_risk_score
      │
      ▼
Publisher reviews AI suggestions
(accepts, edits, or rejects AI-generated metadata)
      │
      ▼
Knowledge Graph updates
(relationship metadata populated, authority score updated)
      │
      ▼
Analytics accumulate
(view_count, engagement_score, trending_score updated)
      │
      ▼
Health scans run (weekly)
(health_score, health_issues updated)
      │
      ▼
Continuous improvement
(metadata enriched over time as signals accumulate)
```

---

## Metadata Standards

**Consistency:** The same field means the same thing across all entity types. `summary` is always 1–3 sentences. `seo_description` is always ≤160 characters.

**Completeness:** Health scores measure completeness. Incomplete metadata degrades discoverability. Publisher is encouraged (not forced) to complete it.

**Validation:** Required fields are validated at write time. Optional fields are not — they are enriched progressively.

**Normalisation:** Tags and topics are normalised against the platform taxonomy. Free-text tags are deprecated in favour of controlled vocabulary.

**Internationalisation:** `language` field is on every entity. Future: all display metadata will have translation variants.

**Accessibility:** `alt_text`, heading structure and reading level are tracked as metadata. These affect `accessibility_score`.

**Privacy:** PII (personal email, phone, private addresses) must never appear in public-facing metadata fields. Media Agent flags potential PII in uploaded images.

**Performance:** Heavy metadata fields (schema_data, search_embedding) are lazy-loaded — not included in list views. Card display uses only `title`, `summary`, `cover_image_url`, `slug`.

---

## Development Rules

Every future feature must answer:

1. What metadata fields does this feature create or change?
2. Who owns those fields?
3. Who may edit them?
4. Which engines consume them?
5. Which widgets display them?
6. Which AI agents generate or learn from them?
7. Which analytics track them?
8. Do any of the new fields carry PII? If so, how is it protected?
9. Are any new fields added to the Entity Blueprint? If so, add them there too.

---

*This document is the permanent metadata contract for CULO. Every field, every category, and every ownership rule is defined here. Metadata does not exist outside this blueprint.*
