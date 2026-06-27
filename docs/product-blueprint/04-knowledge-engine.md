# Part 4 — The CULO Knowledge Engine

> This document defines the engine that powers CULO after a Publisher clicks **Publish**.
> The Knowledge Engine is the core intellectual property of CULO.
> Every automation inside CULO must follow this architecture.

---

## Contents

- [1. Core Principle](#1-core-principle)
- [2. First-Time Setup](#2-first-time-setup)
- [3. Publish Flow](#3-publish-flow)
- [4. Structured Publish Payload](#4-structured-publish-payload)
- [5. Knowledge Engine Responsibilities](#5-knowledge-engine-responsibilities)
- [6. Relationship Engine](#6-relationship-engine)
- [7. Publisher Dashboard Updates](#7-publisher-dashboard-updates)
- [8. Website Widget Updates](#8-website-widget-updates)
- [9. Activity System](#9-activity-system)
- [10. AI Responsibilities](#10-ai-responsibilities)
- [11. Future Integrations](#11-future-integrations)
- [12. Principles](#12-principles)
- [13. Success Criteria](#13-success-criteria)

---

## 1. Core Principle

**Publishing is the only action a Publisher should need to take. Everything else should happen automatically.**

After a Publisher clicks Publish, CULO should take care of every downstream consequence: updating their profile, extracting their ideas, answering questions, updating search, strengthening relationships, refreshing their website widget and celebrating the contribution.

The Publisher should never need to manually maintain:

- Founder profile
- Business profile
- Ideas index
- FAQ library
- Expertise areas
- Library listings
- Service listings
- Search indexes
- Internal links
- Knowledge relationships

Each publication triggers the Knowledge Engine. The Knowledge Engine handles the rest.

---

## 2. First-Time Setup

The first time a Publisher publishes from Canva, CULO runs a one-time setup flow. This is the only moment of onboarding. After this, publishing requires a single click.

### Setup flow

```
Publisher clicks Publish to CULO in Canva (first time)
    │
    ▼
CULO Setup Wizard opens
    │
    ▼
Step 1 — Publisher Identity
    Name, bio, location, expertise areas, photo

Step 2 — Business (optional)
    Business name, category, website, logo
    May be skipped and completed later

Step 3 — Website Connection (optional)
    URL for widget installation
    May be skipped and completed later

Step 4 — Social Links (optional)
    Instagram, LinkedIn, TikTok, YouTube, etc.

Step 5 — Publisher Badge
    Generated automatically
    Embeddable HTML snippet provided

Step 6 — Publisher Dashboard
    Created automatically
    Ready to receive first analytics
    │
    ▼
Setup complete
    │
    ▼
Original publication continues to Knowledge Engine
```

### Setup rules

- Setup should take no more than 5 minutes
- All steps except Publisher Identity are optional
- The Publisher should never need to create a separate Village account
- CULO becomes the publishing identity — no second login
- Setup data is immediately reflected in the Village profile

---

## 3. Publish Flow

The complete flow from Canva to live knowledge:

```
Publisher works in CULO Creatives (Canva)
    │
    ▼
Publisher clicks "Publish to CULO"
    │
    ▼
CULO API receives structured publish payload
    │
    ▼
Knowledge Engine begins processing
    │
    ├── Content object created or updated
    ├── Relationships resolved and written
    ├── Profile(s) updated
    ├── Search index updated
    ├── Publisher Dashboard updated
    ├── Website widget refreshed (if connected)
    └── Activity system triggered
    │
    ▼
Publisher receives confirmation
    │
    ▼
CHE CULO! — Your knowledge is now live.
```

### Publish flow rules

- The Publisher should receive confirmation within a reasonable processing time
- If processing takes longer than a few seconds, a status indicator should be visible
- Failure states must be handled gracefully — no silent failures
- Every successful publish is logged with timestamp, Publisher ID, content ID and knowledge engine version

---

## 4. Structured Publish Payload

Every publication arriving from CULO Creatives carries a structured payload. The Knowledge Engine enriches this data — it does not recreate it.

### Payload fields

| Field | Type | Source | Required |
|-------|------|--------|----------|
| `title` | string | AI-generated, Publisher-approved | ✅ |
| `body` | string | AI-generated, Publisher-approved | ✅ |
| `transcript` | string | Transcribed from video/audio | If video/audio |
| `media` | array | Uploaded by Publisher | If media content |
| `content_type` | enum | Identified by AI, confirmed by Publisher | ✅ |
| `caption` | string | AI-generated, Publisher-approved | ✅ |
| `cover_image` | string | Selected by Publisher | Recommended |
| `author_id` | string | Publisher account ID | ✅ |
| `business_id` | string | Connected Business ID | If applicable |
| `location` | object | Publisher location or specific location | Optional |
| `topics` | array | AI-identified, Publisher-confirmed | Recommended |
| `products_mentioned` | array | AI-identified product references | Optional |
| `services_mentioned` | array | AI-identified service references | Optional |
| `call_to_action` | object | Publisher-set CTA and URL | Optional |
| `tags` | array | Publisher-added or AI-suggested | Optional |
| `media_assets` | array | All media files with metadata | If media content |
| `publishing_date` | datetime | Publisher-set or current datetime | ✅ |
| `language` | string | Detected or Publisher-set | ✅ |
| `accessibility` | object | Alt text, subtitles, transcript | Recommended |
| `ai_metadata` | object | Confidence scores, extraction notes | Internal use |
| `seo` | object | Title, description, slug | Recommended |
| `distribution` | array | Target distribution destinations | Optional |
| `affiliate_links` | array | Partner links attached to content | Optional |

---

## 5. Knowledge Engine Responsibilities

After receiving the publish payload, the Knowledge Engine executes the following automatically. All actions are logged.

### Immediate actions (synchronous)

These complete before the Publisher receives confirmation:

1. **Create content object** — Story, Blog, Reel, Carousel, FAQ, Idea or other output type
2. **Assign permanent URL** — Unique, permanent slug assigned to the publication
3. **Write to Village** — Content becomes publicly accessible at its URL
4. **Update search index** — Full-text search indexed immediately

### Deferred actions (asynchronous)

These complete in the background after confirmation is sent:

| Action | Description |
|--------|-------------|
| **Extract Ideas** | Pull quotable insights and principles from the content body |
| **Extract FAQs** | Identify questions the content answers and create FAQ entries |
| **Update Expertise** | Add or strengthen expertise area connections based on content topics |
| **Update Founder Profile** | Reflect new publication in Publisher's profile summary |
| **Update Business Profile(s)** | Reflect publication in connected Business profiles |
| **Update Library** | Link new content to relevant Library items if identified |
| **Update Services** | Link new content to relevant Service listings if identified |
| **Update Products** | Update product references in content |
| **Update Talks** | Link to any Talk or event referenced in content |
| **Update Related Resources** | Surface connections to existing Library items |
| **Build Internal Links** | Create cross-links between new content and related existing content |
| **Update Knowledge Relationships** | Write all entity relationships to the knowledge graph |
| **Update Publisher Badge** | Reflect updated publication count and Knowledge Score |
| **Update Discoverability Score** | Recalculate based on new content and relationships |
| **Update Knowledge Score** | Recalculate based on depth and breadth of published knowledge |
| **Update Website Widget** | Push latest content to connected website widgets |
| **Update Activity Feed** | Post to Village activity feed |
| **Trigger CHE CULO!** | Send celebration notification to Publisher |
| **Update AI Discoverability Index** | Ensure content is appropriately represented in AI-accessible structure |
| **Update Analytics Baseline** | Establish baseline analytics for new content object |

### Failure handling

- Each action should fail independently — one failure should not cascade to block others
- Failed actions should be retried automatically with exponential backoff
- Persistent failures should be surfaced in the Publisher Dashboard, not silently dropped
- The content remains live and discoverable even if deferred actions are still processing

---

## 6. Relationship Engine

The Relationship Engine is the component of the Knowledge Engine responsible for building and maintaining the connections between all objects in the CULO knowledge graph.

### Object types and their relationships

```
Story / Blog
    │
    ├── authoredBy ──────────── Founder
    ├── relatedTo ───────────── Business(es)
    ├── topicOf ─────────────── Topic(s)
    ├── demonstrates ────────── Expertise area(s)
    ├── spawned ─────────────── Idea(s)
    ├── answers ─────────────── FAQ(s)
    ├── references ──────────── Product(s)
    ├── references ──────────── Service(s)
    ├── references ──────────── Resource(s)
    ├── includes ────────────── Media asset(s)
    ├── mentionedAt ─────────── Talk / Event(s)
    ├── publishedBy ─────────── Platform(s)
    ├── locatedIn ───────────── Location
    ├── relatedTo ───────────── Story / Blog (other)
    ├── relatedTo ───────────── Founder (other)
    └── relatedTo ───────────── Business (other)
```

Every edge in the graph is bidirectional. If a Story connects to a Business, that Business page also surfaces the Story. If a Story demonstrates an Expertise area, that Expertise area page surfaces the Story.

### Relationship strength

Relationships have weights that strengthen over time:

- **Direct mention** — highest weight (Publisher explicitly connected two objects)
- **AI-extracted** — medium weight (AI identified the relationship with Publisher confirmation)
- **Inferred** — lower weight (relationship inferred from shared topics or co-occurring entities)

Weight influences surfacing in the Village — strong relationships produce more prominent cross-references.

### Graph integrity rules

- No object should exist as an orphan — every content object must connect to at least a Founder
- Relationship conflicts should be flagged to Administrator for resolution
- Deleting an object does not delete its relationships — they are archived
- Archiving content removes it from public discovery but preserves its position in the graph

---

## 7. Publisher Dashboard Updates

Every publication automatically updates the Publisher Dashboard. The Publisher never needs to manually maintain these numbers.

| Dashboard element | Updated when |
|------------------|-------------|
| Stories Published | New Story or Blog published |
| Ideas Published | Ideas extracted from any publication |
| FAQs Answered | FAQs extracted from any publication |
| Expertise Areas | New expertise identified in any publication |
| Businesses connected | Business linked to any publication |
| Products listed | Product reference found in any publication |
| Services listed | Service reference found in any publication |
| Resources linked | Library item connected to any publication |
| Talks recorded | Talk entry created from any publication |
| Knowledge Score | Recalculated after every publication |
| Discoverability Score | Recalculated after every publication |
| Publisher Badge | Updated to reflect new Knowledge Score |
| Partner Earnings | Updated as referral and affiliate activity occurs |
| Analytics | Updated continuously based on content performance |
| Website Widget | Refreshed after every publication |

---

## 8. Website Widget Updates

If a Publisher has connected a website, every publication automatically updates the widget embedded on that site.

### Widget content updated per publication

| Widget element | Trigger |
|---------------|---------|
| Latest Story | New Story or Blog published |
| Latest Blog | New Blog published |
| Latest Reel | New Reel (any type) published |
| Latest Library Item | New Library item created or linked |
| Latest Product | New Product created or linked |
| Latest Workshop | New Workshop created or linked |
| Latest FAQ | New FAQ extracted or published |
| Publisher Badge | Knowledge Score updated |
| Knowledge Score | Recalculated after every publication |

### Widget rules

- Widget updates should be reflected on connected websites within a short delay of publishing
- The widget should gracefully handle cases where certain content types are not yet present
- The Publisher Badge in the widget must always link back to the Publisher's Village profile
- Widget implementation should not require technical skill to install (simple embed code)

---

## 9. Activity System

Every publication triggers an activity event. The activity system celebrates contribution and keeps the Village ecosystem informed.

### Activity events generated per publication

| Event | Recipient | Purpose |
|-------|-----------|---------|
| **CHE CULO!** | Publisher | Celebrate the contribution |
| Village Activity Feed | All Village visitors | Surface new content in Village |
| Related Publisher notification | Publishers whose work is referenced | Acknowledge the connection |
| Business profile notification | Business followers | Notify of new related content |
| Community notification | Community members | Surface content relevant to community |
| Website widget refresh | Website visitors | New content visible on Publisher website |
| Future: Follower notifications | Accounts following this Publisher | Notify followers of new publication |

### Activity rules

- The CHE CULO! celebration should be visible and joyful — it marks a genuine contribution
- Activity notifications should inform, not pressurise — quantity of notifications should be managed
- All notification preferences are configurable by the recipient
- Activity events are logged for analytics and audit purposes

---

## 10. AI Responsibilities

Within the Knowledge Engine, AI has specific, bounded responsibilities. These are clearly distinguished from Publisher responsibilities.

### AI does

| Responsibility | Description |
|---------------|-------------|
| **Detect relationships** | Identify connections between new content and existing objects in the knowledge graph |
| **Suggest improvements** | Propose better titles, accessibility additions, missing connections |
| **Extract knowledge** | Pull Ideas, FAQs, expertise signals and topic tags from content |
| **Improve discoverability** | Generate SEO metadata, schema markup, AI-discoverability structures |
| **Improve accessibility** | Generate alt text, subtitle files, transcripts |
| **Generate AI metadata** | Confidence scores, extraction notes, model version used |
| **Generate schema** | Structured data (JSON-LD) for search engines and AI systems |
| **Surface related content** | Identify existing Village content related to the new publication |

### AI does not

- Publish anything without Publisher approval
- Modify content already approved and live without triggering a new approval
- Make editorial judgments on behalf of the Publisher
- Override Publisher corrections to AI-identified relationships or metadata
- Generate knowledge that did not originate from the Publisher's actual content

**The Publisher always approves editorial decisions.** AI is an assistant, not a decision-maker.

---

## 11. Future Integrations

The Knowledge Engine is designed to accept content from sources beyond CULO Creatives. Every integration should enrich the existing knowledge graph rather than create separate, isolated content.

### Planned import integrations

| Source | What it adds to the knowledge graph |
|--------|-------------------------------------|
| **Website import** | Existing blog posts, pages and services pulled into Village |
| **YouTube** | Video content imported, transcribed and connected |
| **Podcast** | Episodes imported, transcribed and connected |
| **LinkedIn** | Articles and posts imported and connected |
| **Instagram** | Posts and reels connected (metadata only, not re-hosted) |
| **Books** | Published books listed in Library and connected to Publisher |
| **Workshops** | Events listed, connected to expertise and business |
| **Speaking events** | Talks connected to Publisher profile and topic graph |
| **CRM systems** | Client case studies imported and connected |
| **Partner platforms** | Co-created content attributed and connected to both parties |
| **Marketplace products** | External products surfaced within Library with affiliate links |

### Integration rules

- All imported content must be attributed correctly
- Imported content goes through the same approval flow as created content
- Imports should not duplicate content — they should connect to it
- External platform content should link back to the original source, not replace it

---

## 12. Principles

The Knowledge Engine exists to ensure:

| Principle | What it means |
|-----------|--------------|
| **One publication creates many assets** | A single video creates a story, ideas, FAQs, expertise signals and profile updates |
| **Knowledge compounds** | Every new publication strengthens the discoverability of everything already published |
| **Relationships strengthen over time** | The graph grows richer and more connected with every publish |
| **Publishing becomes easier** | The engine should learn the Publisher's knowledge base and require less guidance over time |
| **The Publisher remains in control** | All automation is transparent, reversible and subject to Publisher approval |
| **Automation reduces effort, not quality** | Speed should never come at the expense of accuracy, authenticity or trust |
| **Trust remains central** | The Knowledge Engine should never take an action that would embarrass or misrepresent a Publisher |
| **Human knowledge becomes permanent** | Every published object has a permanent URL and a permanent place in the knowledge graph |

---

## 13. Success Criteria

The ideal Publisher experience should be:

```
Create.

Publish.

Done.
```

The Knowledge Engine is responsible for everything that happens between "Done" and the moment a reader in a different country finds that knowledge in a search result months later.

The engine should be invisible to the Publisher but felt in the quality, richness and discoverability of their growing body of work.

A Publisher who has been publishing inside CULO for two years should be meaningfully easier to discover, more comprehensively represented, and more commercially visible than the same Publisher who published for two years on social media alone.

That outcome is the measure of whether the Knowledge Engine is working.

---

*← [Part 3 — Publisher Workflow](./03-publisher-workflow.md) · [Blueprint Index](./README.md) · Next: [Part 5 — CULO Creatives](./05-culo-creatives.md) →*
