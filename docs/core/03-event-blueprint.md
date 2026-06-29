# CULO Operating System — Event Blueprint

**Version:** 1.0  
**Status:** Core Specification — Foundational  
**Scope:** Every engine interaction in CULO, present and future  
**References:** `docs/core/01-entity-blueprint.md`, `docs/core/02-lifecycle-blueprint.md`, `docs/ARCHITECTURE_INDEX.md`

---

## Philosophy

Everything that changes creates an event.

Events describe something that has already happened — they are facts, not instructions. An event does not tell other engines what to do. It tells them what occurred. Each engine decides independently how to react.

This is the core architectural principle:

**Events decouple engines. Engines do not call each other directly.**

When the Publishing Engine publishes a story, it does not call the SEO Engine, the Knowledge Engine, the Partner Engine, and the Analytics Engine one by one. It fires a single `StoryPublished` event. Every engine that cares listens and reacts independently. If a new engine is added, it simply subscribes to existing events — no existing engine changes.

This is how CULO stays maintainable as it grows from 5 engines to 20 engines to 50.

---

## Event Design Rules

1. **Events are named in past tense.** `StoryPublished`, not `PublishStory`. Events are facts, not commands.

2. **Events are immutable.** Once fired, an event cannot be changed. Engines react to it; they do not alter it.

3. **Events contain context, not logic.** An event payload carries the data downstream engines need. It does not carry decisions about what those engines should do.

4. **Events have exactly one source.** One engine fires each event type. Multiple engines may consume it.

5. **Events are idempotent where possible.** If an event is delivered twice (retry scenario), consuming engines should produce the same outcome both times.

6. **Events are versioned.** As the platform evolves, event schemas may change. Version numbers (`v1`, `v2`) allow consumers to handle schema migrations.

---

## Universal Event Structure

Every event in CULO shares this structure.

```typescript
{
  // Identity
  event_id:       UUID,          // Unique ID for this event instance
  event_name:     string,        // e.g. "StoryPublished"
  event_version:  string,        // e.g. "v1"
  event_category: string,        // e.g. "publishing"

  // Source
  source_engine:  string,        // Which engine fired this event
  fired_at:       timestamp,     // When the event occurred

  // Subject
  entity_id:      UUID,          // The primary entity this event concerns
  entity_type:    string,        // Entity type from Entity Blueprint
  entity_slug:    string | null, // Human-readable identifier

  // Actor
  actor_id:       UUID | null,   // The user_id who triggered this (null for system/automation)
  actor_type:     string,        // "publisher", "admin", "automation", "system", "api"

  // Owner context
  owner_id:       UUID | null,   // The user_id of the entity owner

  // Priority
  priority:       string,        // "critical", "high", "medium", "low", "background"

  // Payload
  payload:        object,        // Event-specific data. Documented per event below.

  // Routing
  consumers:      string[],      // Engines registered to receive this event
  requires_ack:   boolean,       // Whether consumers must acknowledge receipt
}
```

---

## Event Priority Levels

| Level | Description | Handling |
|---|---|---|
| `critical` | System integrity at risk. Missing disclosure, security event, data breach. | Immediate — synchronous if possible, maximum retry |
| `high` | Publisher-visible outcome depends on this. StoryPublished, RecommendationApproved. | Near-immediate — max 30 seconds delivery |
| `medium` | Important but not time-sensitive. SEO re-index, Knowledge Graph update. | Within 5 minutes |
| `low` | Background work. Analytics aggregation, widget refresh. | Within 30 minutes |
| `background` | Non-urgent optimisation. GEO entity enrichment, stale content scan. | Within 24 hours |

---

## Event Categories

Events are grouped into categories that map to engine domains.

| Category | Source Engine | Examples |
|---|---|---|
| `identity` | Identity Engine | PublisherCreated, BusinessVerified |
| `publishing` | Publishing Engine | StoryPublished, StoryUpdated |
| `knowledge` | Knowledge Engine | KnowledgeGraphUpdated, RelationshipCreated |
| `partner` | Partner Engine | RecommendationApproved, CampaignLive |
| `growth` | Growth Engine | OpportunityMatched, CollaborationSuggested |
| `media` | Media Engine / Publishing Engine | MediaUploaded, TranscriptGenerated |
| `widget` | Widget Engine | WidgetUpdated, WidgetViewed |
| `seo` | SEO Engine | MetadataGenerated, InternalLinksUpdated |
| `geo` | GEO Engine | EntityDefinitionUpdated, LLMSummaryGenerated |
| `analytics` | Analytics Engine | ViewRecorded, ConversionRecorded |
| `automation` | Automation Engine | AutomationTriggered, ScheduledPublishFired |
| `import` | Import Engine | ContentImported, ImportFailed |
| `notification` | Notification Engine | EmailQueued, NotificationDelivered |
| `billing` | Billing Engine | SubscriptionStarted, PayoutPaid |

---

## Identity Events

### `PublisherCreated`
**Fires when:** A new publisher completes onboarding and their Founder profile is created.  
**Priority:** High  
**Payload:** `{ founder_id, user_id, name, slug, location, topics }`  
**Consumers:** Knowledge Engine (create graph node), Analytics Engine, Automation Engine (welcome sequence), Notification Engine (welcome email), Growth Engine (initialise opportunity matching)

---

### `PublisherUpdated`
**Fires when:** Publisher updates their profile (name, bio, topics, location, avatar).  
**Priority:** Medium  
**Payload:** `{ founder_id, user_id, changed_fields: string[] }`  
**Consumers:** Knowledge Engine (update graph node), SEO Engine (re-generate meta), GEO Engine (update entity definition), Search Engine (re-index), Distribution Engine (refresh profile pages)

---

### `PublisherVerified`
**Fires when:** Admin marks a publisher as verified.  
**Priority:** Medium  
**Payload:** `{ founder_id, user_id, verification_level }`  
**Consumers:** Identity Engine (apply badge), Analytics Engine, Notification Engine (notify publisher), Search Engine (boost ranking), Partner Engine (update trust score)

---

### `PublisherArchived`
**Fires when:** Publisher account is deactivated.  
**Priority:** High  
**Payload:** `{ founder_id, user_id, reason }`  
**Consumers:** Distribution Engine (remove from all surfaces), Search Engine (de-index), Widget Engine (disable widgets), Partner Engine (suspend recommendations), Knowledge Engine (mark node inactive)

---

### `PublisherDeleted`
**Fires when:** Publisher account is permanently removed (GDPR or admin).  
**Priority:** Critical  
**Payload:** `{ founder_id, user_id }`  
**Consumers:** All engines (remove all references), Analytics Engine (anonymise data), Knowledge Engine (remove graph node), Storage Engine (delete media)

---

### `BusinessCreated`
**Fires when:** A Business profile is first created.  
**Priority:** Medium  
**Payload:** `{ business_id, founder_id, user_id, name, slug, industry, location }`  
**Consumers:** Knowledge Engine, Search Engine, Analytics Engine

---

### `BusinessPublished`
**Fires when:** Business profile status changes to `published`.  
**Priority:** High  
**Payload:** `{ business_id, founder_id, user_id, slug, topics, industries, location }`  
**Consumers:** Distribution Engine (add to Mercato), Knowledge Engine (create/update graph node), Search Engine (index), SEO Engine, GEO Engine, Analytics Engine, Growth Engine

---

### `BusinessUpdated`
**Fires when:** Business profile fields change.  
**Priority:** Medium  
**Payload:** `{ business_id, user_id, changed_fields: string[] }`  
**Consumers:** Knowledge Engine, SEO Engine, GEO Engine, Search Engine, Distribution Engine

---

### `BusinessVerified`
**Fires when:** Admin verifies a business.  
**Priority:** Medium  
**Payload:** `{ business_id, user_id, verification_level }`  
**Consumers:** Partner Engine (boost in matching), Search Engine (boost ranking), Notification Engine, Analytics Engine

---

### `BusinessArchived`
**Fires when:** Business is archived.  
**Priority:** High  
**Payload:** `{ business_id, user_id, reason }`  
**Consumers:** Distribution Engine (remove), Search Engine (de-index), Partner Engine (suspend programs), Widget Engine (remove)

---

### `VillageProEnabled`
**Fires when:** Publisher or Business activates Village Pro (CULO Creatives membership).  
**Priority:** High  
**Payload:** `{ user_id, entity_id, entity_type, membership_tier }`  
**Consumers:** Identity Engine (unlock features), Partner Engine (unlock Partner Centre / Business discoverability), Analytics Engine, Notification Engine (confirmation)

---

### `VillageProDisabled`
**Fires when:** Village Pro membership lapses or is cancelled.  
**Priority:** High  
**Payload:** `{ user_id, entity_id, entity_type, reason }`  
**Consumers:** Identity Engine (gate features), Partner Engine (suspend Partner Centre / remove from discovery pool), Notification Engine (lapse warning)

---

## Publishing Events

### `StoryCreated`
**Fires when:** Publisher creates a new Story (any format) in draft state.  
**Priority:** Low  
**Payload:** `{ story_id, user_id, founder_id, content_format, created_at }`  
**Consumers:** Analytics Engine (record creation), AI Orchestration Engine (initialise — queue on save, not immediately)

---

### `StoryDraftSaved`
**Fires when:** Publisher saves draft (auto-save or manual save).  
**Priority:** Background  
**Payload:** `{ story_id, user_id, version }`  
**Consumers:** Publishing Engine only (local persistence) — no downstream engines react to save events

---

### `StoryReady`
**Fires when:** Publisher marks story as ready (status → `ready`).  
**Priority:** Medium  
**Payload:** `{ story_id, user_id, founder_id, content_format, title, topics }`  
**Consumers:** AI Orchestration Engine (run full pre-publish agent pipeline)

---

### `StoryPublished`
**Fires when:** Publisher publishes a story (status → `published`).  
**Priority:** High  
**Payload:**
```typescript
{
  story_id: UUID,
  user_id: UUID,
  founder_id: UUID,
  business_id: UUID | null,
  slug: string,
  title: string,
  summary: string,
  topics: string[],
  industries: string[],
  content_format: string,
  cover_image_url: string | null,
  video_url: string | null,
  audio_url: string | null,
  published_at: timestamp,
  visibility: string,
}
```
**Consumers:**

| Engine | Reaction |
|---|---|
| Knowledge Engine | Create/update graph node, detect entity relationships |
| Recommendation Intelligence Engine | Scan for brand mentions and recommendation candidates |
| Partner Engine | Check brand mentions against Partner database |
| Distribution Engine | Add to Village listings, profile pages, homepage |
| Search Engine | Index content |
| SEO Engine | Generate meta, schema, sitemap entry |
| GEO Engine | Create entity definition and citation excerpt |
| Analytics Engine | Record publish event |
| Automation Engine | Trigger registered publish automations |
| Widget Engine | Add to eligible widget pool |
| Notification Engine | (Optional) Notify publisher followers (future) |

---

### `StoryUpdated`
**Fires when:** Publisher edits a published story.  
**Priority:** Medium  
**Payload:** `{ story_id, user_id, version, changed_fields: string[], significant_content_change: boolean }`  
**Consumers:** Knowledge Engine (re-scan if significant), Partner Engine (re-scan if significant), SEO Engine (re-generate), Distribution Engine (update), Search Engine (re-index), Widget Engine (refresh), Analytics Engine

---

### `StoryFeatured`
**Fires when:** Admin sets `featured = true` on a story.  
**Priority:** Medium  
**Payload:** `{ story_id, featured_by: UUID (admin), featured_at: timestamp }`  
**Consumers:** Distribution Engine (add to featured surfaces), Analytics Engine, Notification Engine (notify publisher), Search Engine (boost weight)

---

### `StoryUnfeatured`
**Fires when:** Admin sets `featured = false`.  
**Priority:** Medium  
**Payload:** `{ story_id, unfeatured_by: UUID }`  
**Consumers:** Distribution Engine (remove from featured), Search Engine (restore normal weight)

---

### `StoryArchived`
**Fires when:** Story status → `archived`.  
**Priority:** High  
**Payload:** `{ story_id, user_id, reason }`  
**Consumers:** Distribution Engine (remove), Search Engine (de-index), Widget Engine (remove), SEO Engine (set no-index), Partner Engine (expire active recommendations on this story), Analytics Engine (retain data, stop new events)

---

### `StoryRestored`
**Fires when:** Story restored from archived to published.  
**Priority:** High  
**Payload:** `{ story_id, user_id }`  
**Consumers:** Full publish pipeline re-runs (same consumers as `StoryPublished`)

---

### `StoryDeleted`
**Fires when:** Story soft-deleted.  
**Priority:** High  
**Payload:** `{ story_id, user_id, reason }`  
**Consumers:** All engines (remove all references), Analytics Engine (anonymise if required), Knowledge Engine (remove graph node), Partner Engine (terminate recommendations), Widget Engine (remove)

---

## Knowledge Events

### `KnowledgeGraphUpdated`
**Fires when:** Any node or edge in the Knowledge Graph is created, updated or removed.  
**Priority:** Medium  
**Payload:** `{ node_id, node_type, edge_type, source_entity_id, target_entity_id, strength_delta, update_type: 'created'|'strengthened'|'weakened'|'removed' }`  
**Consumers:** Partner Engine (re-evaluate matches), Growth Engine (re-evaluate opportunities), SEO Engine (update internal link suggestions), GEO Engine (update entity relationships), Search Engine (update entity index), Automation Engine (trigger opportunity notifications)

---

### `RelationshipCreated`
**Fires when:** A new relationship edge is added to the Knowledge Graph.  
**Priority:** Low  
**Payload:** `{ relationship_type, source_id, source_type, target_id, target_type, strength, confidence, source: 'content'|'user'|'ai' }`  
**Consumers:** Growth Engine, Partner Engine, Analytics Engine

---

### `EntityResolved`
**Fires when:** Two previously separate entity candidates are merged into one.  
**Priority:** Medium  
**Payload:** `{ primary_entity_id, merged_entity_id, merge_type: 'confirmed'|'auto' }`  
**Consumers:** Knowledge Engine (update all edges), Partner Engine (update brand mentions), SEO Engine, GEO Engine

---

### `TopicAdded`
**Fires when:** A new topic is added to the platform taxonomy.  
**Priority:** Low  
**Payload:** `{ topic_id, topic_name, parent_topic_id }`  
**Consumers:** Search Engine, Growth Engine, Partner Engine

---

## Media Events

### `MediaUploaded`
**Fires when:** A file is successfully stored in Supabase Storage.  
**Priority:** Medium  
**Payload:** `{ media_id, user_id, file_name, mime_type, file_size, bucket, path, story_id }`  
**Consumers:** AI Orchestration Engine (queue Media Agent), Analytics Engine

---

### `MediaProcessed`
**Fires when:** Technical processing complete (dimensions, duration extracted).  
**Priority:** Low  
**Payload:** `{ media_id, dimensions, duration_seconds, file_size_compressed }`  
**Consumers:** Publishing Engine (update media record), Widget Engine (update card dimensions)

---

### `ThumbnailGenerated`
**Fires when:** Media Agent selects or generates a thumbnail.  
**Priority:** Low  
**Payload:** `{ media_id, thumbnail_url, selected_by: 'ai'|'system' }`  
**Consumers:** Publishing Engine (suggest thumbnail), Distribution Engine

---

### `TranscriptGenerated`
**Fires when:** Audio or video transcript is extracted.  
**Priority:** Medium  
**Payload:** `{ media_id, story_id, transcript_length, language, confidence_score }`  
**Consumers:** Publishing Engine (populate transcript field), AI Orchestration Engine (re-run content agents now that text is available), Partner Agent (re-scan for brand mentions)

---

### `AltTextGenerated`
**Fires when:** Media Agent generates alt text for an image.  
**Priority:** Low  
**Payload:** `{ media_id, alt_text, confidence_score }`  
**Consumers:** Publishing Engine (surface as suggestion), SEO Engine

---

### `MediaDeleted`
**Fires when:** Media file removed from Supabase Storage.  
**Priority:** High  
**Payload:** `{ media_id, user_id, story_id }`  
**Consumers:** Publishing Engine (remove from story), Distribution Engine (remove from surfaces), Widget Engine (remove from widgets), Analytics Engine

---

## Partner Events

### `BrandMentionDetected`
**Fires when:** Recommendation Intelligence Engine detects an entity mention in content.  
**Priority:** Medium  
**Payload:** `{ mention_id, story_id, user_id, entity_name, entity_type, confidence_score, context_excerpt, detection_source }`  
**Consumers:** Partner Engine (check against partner database), Knowledge Engine (add entity candidate)

---

### `RecommendationSuggested`
**Fires when:** A pending recommendation is created for a publisher to review.  
**Priority:** High  
**Payload:** `{ recommendation_id, story_id, user_id, partner_id, program_id, entity_name, confidence_score }`  
**Consumers:** Notification Engine (notify publisher), Analytics Engine

---

### `RecommendationApproved`
**Fires when:** Publisher approves a recommendation.  
**Priority:** High  
**Payload:** `{ recommendation_id, story_id, user_id, partner_id, disclosure_type, partner_link, approved_at }`  
**Consumers:** Publishing Engine (apply disclosure to story), Distribution Engine (republish story), Analytics Engine, Partner Engine (begin tracking), Knowledge Engine (strengthen publisher→entity relationship), Notification Engine (notify business if Village Pro)

---

### `RecommendationRejected`
**Fires when:** Publisher rejects a recommendation suggestion.  
**Priority:** Low  
**Payload:** `{ recommendation_id, user_id, partner_id, reason }`  
**Consumers:** Partner Engine (store rejection signal), Analytics Engine

---

### `RecommendationWithdrawn`
**Fires when:** Publisher withdraws a previously approved recommendation.  
**Priority:** High  
**Payload:** `{ recommendation_id, story_id, user_id, partner_id, withdrawn_at }`  
**Consumers:** Publishing Engine (remove disclosure from story), Distribution Engine (republish), Analytics Engine, Partner Engine (terminate tracking)

---

### `RecommendationExpired`
**Fires when:** An approved recommendation becomes invalid (program ended, partner inactive, link broken).  
**Priority:** Medium  
**Payload:** `{ recommendation_id, story_id, user_id, reason }`  
**Consumers:** Notification Engine (alert publisher), Partner Engine (flag for review), Analytics Engine

---

### `CampaignCreated`
**Fires when:** A Village Pro Business creates a campaign.  
**Priority:** Medium  
**Payload:** `{ campaign_id, partner_id, name, topics, industries, locations, reward_description, starts_at, ends_at }`  
**Consumers:** Partner Engine (match publishers), Growth Engine (surface in Opportunities), Analytics Engine

---

### `CampaignApplicationReceived`
**Fires when:** A publisher applies to a campaign.  
**Priority:** Medium  
**Payload:** `{ application_id, campaign_id, user_id, applied_at }`  
**Consumers:** Notification Engine (notify business), Analytics Engine

---

### `CampaignApplicationApproved`
**Fires when:** Business approves a publisher's campaign application.  
**Priority:** High  
**Payload:** `{ application_id, campaign_id, user_id }`  
**Consumers:** Notification Engine (notify publisher), Partner Engine (update campaign participant count), Analytics Engine

---

### `EarningsCreated`
**Fires when:** A new earnings record is created (conversion reported).  
**Priority:** High  
**Payload:** `{ earnings_id, user_id, recommendation_id, partner_id, publisher_amount, currency, conversion_type }`  
**Consumers:** Analytics Engine, Notification Engine (notify publisher), Partner Engine (update earnings totals)

---

### `PayoutScheduled`
**Fires when:** A payout is created and scheduled for payment.  
**Priority:** High  
**Payload:** `{ payout_id, user_id, amount, currency, scheduled_at }`  
**Consumers:** Notification Engine (notify publisher), Analytics Engine

---

### `PayoutPaid`
**Fires when:** Payout payment is confirmed.  
**Priority:** High  
**Payload:** `{ payout_id, user_id, amount, currency, paid_at, reference }`  
**Consumers:** Notification Engine (confirm to publisher), Analytics Engine, Billing Engine

---

## Growth Events

### `OpportunityMatched`
**Fires when:** Growth Engine finds a new opportunity for a publisher or business.  
**Priority:** Low  
**Payload:** `{ user_id, entity_id, opportunity_type, opportunity_entity_id, match_score, reason }`  
**Consumers:** Notification Engine (digest notification), Analytics Engine

---

### `CollaborationSuggested`
**Fires when:** Growth Engine suggests a publisher-to-publisher or publisher-to-business collaboration.  
**Priority:** Low  
**Payload:** `{ from_entity_id, to_entity_id, collaboration_type, match_score, shared_signals: string[] }`  
**Consumers:** Notification Engine (surface in Growth Dashboard), Analytics Engine

---

## Widget Events

### `WidgetCreated`
**Fires when:** Publisher creates a widget configuration.  
**Priority:** Low  
**Payload:** `{ widget_id, user_id, widget_type, entity_id }`  
**Consumers:** Widget Engine (generate embed token), Analytics Engine

---

### `WidgetUpdated`
**Fires when:** Widget configuration or content changes.  
**Priority:** Low  
**Payload:** `{ widget_id, user_id, changed_fields: string[] }`  
**Consumers:** Widget Engine (refresh cached content), Analytics Engine

---

### `WidgetViewed`
**Fires when:** A widget embed on a publisher's website receives a page view.  
**Priority:** Background  
**Payload:** `{ widget_id, user_id, session_id (anonymised), referrer_domain }`  
**Consumers:** Analytics Engine only

---

## SEO Events

### `SEOMetadataGenerated`
**Fires when:** SEO Agent completes metadata generation for an entity.  
**Priority:** Low  
**Payload:** `{ entity_id, entity_type, seo_title, seo_description, schema_type, seo_health_score }`  
**Consumers:** Distribution Engine (update page headers), GEO Engine (structured data overlap), Search Engine (update index)

---

### `InternalLinksUpdated`
**Fires when:** SEO Agent generates new internal link suggestions.  
**Priority:** Low  
**Payload:** `{ entity_id, suggested_links: Array<{anchor, target_entity_id, target_url}> }`  
**Consumers:** Distribution Engine (embed in page templates)

---

### `SEOHealthDegraded`
**Fires when:** SEO health score for an entity drops below 50.  
**Priority:** Low  
**Payload:** `{ entity_id, entity_type, seo_health_score, issues: string[] }`  
**Consumers:** Notification Engine (surface in Publishing Health dashboard), Analytics Engine

---

## GEO Events

### `GEOEntityUpdated`
**Fires when:** GEO Agent updates an entity's definition or citation excerpt.  
**Priority:** Low  
**Payload:** `{ entity_id, entity_type, geo_entity_name, geo_summary, geo_health_score }`  
**Consumers:** SEO Engine (structured data), Search Engine (entity index update), Knowledge Engine

---

### `LLMSummaryGenerated`
**Fires when:** GEO Agent generates a new AI-readable summary.  
**Priority:** Background  
**Payload:** `{ entity_id, summary_length, llms_txt_eligible }`  
**Consumers:** GEO Engine (update llms.txt), Distribution Engine (update entity pages)

---

## Analytics Events

### `ViewRecorded`
**Fires when:** Any entity page is loaded by a visitor.  
**Priority:** Background  
**Payload:** `{ entity_id, entity_type, user_id (null if anonymous), session_id (anonymised), referrer, country_code, timestamp }`  
**Consumers:** Analytics Engine only (no side effects from view events)

---

### `ClickRecorded`
**Fires when:** A partner link, CTA or widget link is clicked.  
**Priority:** Low  
**Payload:** `{ entity_id, link_type: 'partner'|'cta'|'widget', recommendation_id, destination_url, user_id (null), timestamp }`  
**Consumers:** Analytics Engine, Partner Engine (for partner link clicks)

---

### `ConversionRecorded`
**Fires when:** A partner conversion is confirmed and matched to a recommendation.  
**Priority:** High  
**Payload:** `{ recommendation_id, partner_id, user_id, conversion_type, gross_amount, currency, source }`  
**Consumers:** Partner Engine (create Earnings record), Analytics Engine, Notification Engine

---

### `HealthScoreUpdated`
**Fires when:** Any entity's health score changes.  
**Priority:** Background  
**Payload:** `{ entity_id, entity_type, old_score, new_score, issues_added: string[], issues_resolved: string[] }`  
**Consumers:** Notification Engine (if score drops below threshold), Analytics Engine

---

## Automation Events

### `AutomationTriggered`
**Fires when:** Automation Engine begins executing a registered automation.  
**Priority:** Low  
**Payload:** `{ automation_id, trigger_event, entity_id, actor_type, triggered_at }`  
**Consumers:** Analytics Engine, Notification Engine (if automation sends notification)

---

### `AutomationCompleted`
**Fires when:** Automation Engine finishes executing.  
**Priority:** Low  
**Payload:** `{ automation_id, result: 'success'|'partial'|'failed', actions_taken: string[] }`  
**Consumers:** Analytics Engine

---

### `ScheduledPublishFired`
**Fires when:** Automation Engine publishes a story that was scheduled.  
**Priority:** High  
**Payload:** `{ story_id, user_id, scheduled_at, published_at }`  
**Consumers:** Same as `StoryPublished`

---

## Notification Events

### `EmailQueued`
**Fires when:** Notification Engine adds an email to the send queue.  
**Priority:** Medium  
**Payload:** `{ notification_id, user_id, email_type, entity_id, queued_at }`  
**Consumers:** Analytics Engine

---

### `EmailSent`
**Fires when:** Email is confirmed delivered.  
**Priority:** Low  
**Payload:** `{ notification_id, user_id, email_type, sent_at, provider_id }`  
**Consumers:** Analytics Engine

---

### `NotificationCreated`
**Fires when:** An in-app notification is created.  
**Priority:** Medium  
**Payload:** `{ notification_id, user_id, notification_type, entity_id, message }`  
**Consumers:** No downstream engines — notification is the endpoint

---

## Billing Events

### `SubscriptionStarted`
**Fires when:** Publisher or Business starts a CULO Creatives subscription.  
**Priority:** High  
**Payload:** `{ user_id, subscription_id, plan, started_at }`  
**Consumers:** Identity Engine (unlock Village Pro), Analytics Engine, Notification Engine (confirmation)

---

### `SubscriptionCancelled`
**Fires when:** Subscription is cancelled (end of period).  
**Priority:** High  
**Payload:** `{ user_id, subscription_id, ends_at, reason }`  
**Consumers:** Identity Engine (schedule Village Pro disable), Notification Engine (cancel confirmation + warning)

---

### `SubscriptionRenewed`
**Fires when:** Subscription renews for another period.  
**Priority:** Low  
**Payload:** `{ user_id, subscription_id, renewed_at, next_renewal_at }`  
**Consumers:** Analytics Engine, Notification Engine (renewal receipt)

---

### `InvoicePaid`
**Fires when:** Stripe confirms payment.  
**Priority:** High  
**Payload:** `{ user_id, invoice_id, amount, currency, paid_at }`  
**Consumers:** Analytics Engine, Notification Engine

---

## Event Flow — StoryPublished (Full Diagram)

The most important event flow in CULO.

```
Publisher clicks Publish
      │
      ▼
Publishing Engine → fires StoryPublished (priority: High)
      │
      ├──► Knowledge Engine
      │         └── Creates/updates Knowledge Graph node
      │         └── Fires KnowledgeGraphUpdated
      │                   └──► Growth Engine (re-evaluate opportunities)
      │                   └──► SEO Engine (update internal link suggestions)
      │
      ├──► Recommendation Intelligence Engine
      │         └── Scans content for brand mentions
      │         └── Fires BrandMentionDetected (per mention)
      │                   └──► Partner Engine
      │                             └── Matches to partner database
      │                             └── Fires RecommendationSuggested
      │                                       └──► Notification Engine
      │
      ├──► Distribution Engine
      │         └── Adds to Village listings, profile pages, homepage feeds
      │
      ├──► Search Engine
      │         └── Indexes new content
      │
      ├──► SEO Engine
      │         └── Generates meta, schema, sitemap entry
      │         └── Fires SEOMetadataGenerated
      │
      ├──► GEO Engine
      │         └── Creates entity definition and citation excerpt
      │         └── Fires GEOEntityUpdated
      │
      ├──► Analytics Engine
      │         └── Records StoryPublished event
      │
      ├──► Automation Engine
      │         └── Checks trigger registry
      │         └── Fires registered automations (e.g. publisher notification)
      │
      └──► Widget Engine
                └── Adds story to eligible widget pool
                └── Fires WidgetUpdated (for publisher's configured widgets)
```

---

## AI Agent Event Consumers

Which AI agents react to which events.

| Event | AI Agents that react |
|---|---|
| `StoryPublished` | Insight Agent · Topic Agent · Relationship Agent · FAQ Agent · SEO Agent · GEO Agent · Partner Agent · Safety & Trust Agent · Analytics Agent |
| `StoryUpdated` (significant change) | Insight Agent · Relationship Agent · Partner Agent · SEO Agent · GEO Agent |
| `MediaUploaded` | Media Agent |
| `TranscriptGenerated` | Insight Agent · Topic Agent · Partner Agent · FAQ Agent |
| `KnowledgeGraphUpdated` | Growth Agent |
| `RecommendationApproved` | Disclosure Agent |
| `HealthScoreUpdated` | Safety & Trust Agent (if critical issues) |
| `ScheduledPublishFired` | Same as `StoryPublished` |
| `BrandMentionDetected` | Knowledge Graph Agent (add entity candidate) |

---

## Future API Webhook Events

External systems may subscribe to these events via webhook (Phase 3+).

| Webhook Event | When | Payload |
|---|---|---|
| `publisher.created` | New publisher signs up | `{ founder_id, name, slug }` |
| `business.created` | New business profile | `{ business_id, name, slug, industry }` |
| `story.published` | Story published | `{ story_id, title, slug, founder_id, published_at }` |
| `recommendation.approved` | Publisher approves recommendation | `{ recommendation_id, partner_id, story_id }` |
| `campaign.matched` | Publisher matched to campaign | `{ campaign_id, user_id, match_score }` |
| `media.uploaded` | File stored | `{ media_id, file_name, mime_type, story_id }` |
| `knowledge.updated` | Knowledge Graph changes | `{ node_id, update_type, entity_type }` |
| `widget.updated` | Widget content changes | `{ widget_id, user_id }` |
| `payout.paid` | Publisher paid | `{ payout_id, user_id, amount, currency }` |

---

## Event Reliability Architecture (Future)

When event volume justifies it, the Event System should be upgraded with:

| Feature | Description |
|---|---|
| **Retry logic** | Failed event deliveries retry with exponential backoff (3× by default) |
| **Dead-letter queue** | Events that fail all retries are moved to a DLQ for admin review |
| **Idempotency keys** | Each event carries a UUID; consumers check `event_id` before processing to prevent double-processing |
| **Ordering guarantees** | Events within a single entity's lifecycle are delivered in order |
| **Replay** | Admin can replay events from a specific timestamp (useful for backfilling after engine upgrades) |
| **Event versioning** | `event_version` field allows schema migration without breaking existing consumers |
| **Audit history** | All events retained for 90 days for debugging; summary retained indefinitely |
| **Event streaming** | Future: real-time event stream (Supabase Realtime or external queue) for high-volume events |

---

## Master Event Registry

Summary index of every event.

| Event | Category | Priority | Source Engine | Key Consumers |
|---|---|---|---|---|
| PublisherCreated | identity | high | Identity | Knowledge, Analytics, Automation, Notification |
| PublisherUpdated | identity | medium | Identity | Knowledge, SEO, GEO, Search, Distribution |
| PublisherVerified | identity | medium | Identity | Identity, Analytics, Notification, Search, Partner |
| PublisherArchived | identity | high | Identity | Distribution, Search, Widget, Partner, Knowledge |
| PublisherDeleted | identity | critical | Identity | All engines |
| BusinessCreated | identity | medium | Identity | Knowledge, Search, Analytics |
| BusinessPublished | identity | high | Identity | Distribution, Knowledge, Search, SEO, GEO, Analytics, Growth |
| BusinessUpdated | identity | medium | Identity | Knowledge, SEO, GEO, Search, Distribution |
| BusinessVerified | identity | medium | Identity | Partner, Search, Notification, Analytics |
| BusinessArchived | identity | high | Identity | Distribution, Search, Partner, Widget |
| VillageProEnabled | identity | high | Identity / Billing | Identity, Partner, Analytics, Notification |
| VillageProDisabled | identity | high | Identity / Billing | Identity, Partner, Notification |
| StoryCreated | publishing | low | Publishing | Analytics, AI Orchestration |
| StoryDraftSaved | publishing | background | Publishing | Publishing only |
| StoryReady | publishing | medium | Publishing | AI Orchestration |
| StoryPublished | publishing | high | Publishing | Knowledge, Partner, Distribution, Search, SEO, GEO, Analytics, Automation, Widget |
| StoryUpdated | publishing | medium | Publishing | Knowledge, Partner, SEO, Distribution, Search, Widget, Analytics |
| StoryFeatured | publishing | medium | Publishing | Distribution, Analytics, Notification, Search |
| StoryUnfeatured | publishing | medium | Publishing | Distribution, Search |
| StoryArchived | publishing | high | Publishing | Distribution, Search, Widget, SEO, Partner, Analytics |
| StoryRestored | publishing | high | Publishing | Full publish pipeline |
| StoryDeleted | publishing | high | Publishing | All engines |
| KnowledgeGraphUpdated | knowledge | medium | Knowledge | Partner, Growth, SEO, GEO, Search, Automation |
| RelationshipCreated | knowledge | low | Knowledge | Growth, Partner, Analytics |
| EntityResolved | knowledge | medium | Knowledge | Knowledge, Partner, SEO, GEO |
| TopicAdded | knowledge | low | Knowledge | Search, Growth, Partner |
| MediaUploaded | media | medium | Publishing | AI Orchestration, Analytics |
| MediaProcessed | media | low | Media | Publishing, Widget |
| ThumbnailGenerated | media | low | Media | Publishing, Distribution |
| TranscriptGenerated | media | medium | Media | Publishing, AI Orchestration, Partner |
| AltTextGenerated | media | low | Media | Publishing, SEO |
| MediaDeleted | media | high | Publishing | Publishing, Distribution, Widget, Analytics |
| BrandMentionDetected | partner | medium | Partner | Partner, Knowledge |
| RecommendationSuggested | partner | high | Partner | Notification, Analytics |
| RecommendationApproved | partner | high | Partner | Publishing, Distribution, Analytics, Partner, Knowledge, Notification |
| RecommendationRejected | partner | low | Partner | Partner, Analytics |
| RecommendationWithdrawn | partner | high | Partner | Publishing, Distribution, Analytics, Partner |
| RecommendationExpired | partner | medium | Partner | Notification, Partner, Analytics |
| CampaignCreated | partner | medium | Partner | Partner, Growth, Analytics |
| CampaignApplicationReceived | partner | medium | Partner | Notification, Analytics |
| CampaignApplicationApproved | partner | high | Partner | Notification, Partner, Analytics |
| EarningsCreated | partner | high | Partner | Analytics, Notification, Partner |
| PayoutScheduled | partner | high | Partner | Notification, Analytics |
| PayoutPaid | partner | high | Partner | Notification, Analytics, Billing |
| OpportunityMatched | growth | low | Growth | Notification, Analytics |
| CollaborationSuggested | growth | low | Growth | Notification, Analytics |
| WidgetCreated | widget | low | Widget | Widget, Analytics |
| WidgetUpdated | widget | low | Widget | Widget, Analytics |
| WidgetViewed | widget | background | Widget | Analytics |
| SEOMetadataGenerated | seo | low | SEO | Distribution, GEO, Search |
| InternalLinksUpdated | seo | low | SEO | Distribution |
| SEOHealthDegraded | seo | low | SEO | Notification, Analytics |
| GEOEntityUpdated | geo | low | GEO | SEO, Search, Knowledge |
| LLMSummaryGenerated | geo | background | GEO | GEO, Distribution |
| ViewRecorded | analytics | background | Analytics | Analytics only |
| ClickRecorded | analytics | low | Analytics | Analytics, Partner |
| ConversionRecorded | analytics | high | Analytics | Partner, Analytics, Notification |
| HealthScoreUpdated | analytics | background | Analytics | Notification, Analytics |
| AutomationTriggered | automation | low | Automation | Analytics, Notification |
| AutomationCompleted | automation | low | Automation | Analytics |
| ScheduledPublishFired | automation | high | Automation | Same as StoryPublished |
| EmailQueued | notification | medium | Notification | Analytics |
| EmailSent | notification | low | Notification | Analytics |
| NotificationCreated | notification | medium | Notification | — |
| SubscriptionStarted | billing | high | Billing | Identity, Analytics, Notification |
| SubscriptionCancelled | billing | high | Billing | Identity, Analytics, Notification |
| SubscriptionRenewed | billing | low | Billing | Analytics, Notification |
| InvoicePaid | billing | high | Billing | Analytics, Notification |

---

## Development Rules

Every future feature must answer these questions before implementation:

1. What event does this feature fire?
2. Which engines consume it?
3. Which automations fire?
4. Which AI agents react?
5. Which dashboards update?
6. Which widgets update?
7. Which analytics record it?
8. Which notifications are sent?

No feature should bypass the Event System unless a technical constraint makes it unavoidable — and that constraint must be documented.

Direct engine-to-engine calls are a last resort, not a first choice.

---

*This document is the complete event contract for the CULO Operating System. Every event that exists today is documented here. Every event that will exist tomorrow is designed against this specification before implementation.*
