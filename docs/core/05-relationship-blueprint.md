# CULO Operating System — Relationship Blueprint

**Version:** 1.0  
**Status:** Core Specification — Foundational  
**Scope:** Every connection between entities in CULO  
**References:** `docs/core/01-entity-blueprint.md`, `docs/engines/knowledge-engine/01-knowledge-graph-engine.md`

---

## Philosophy

Knowledge is relationships.

A Story about sustainable business in Bali is not just content. It creates a relationship between a Publisher and a Location. Between that Publisher and the Topic of sustainability. Between that Topic and the Local Business they mentioned. Between that business and the Industry of hospitality. Between that Publisher and any other Publisher who writes about sustainable travel.

Each relationship is a thread. The more threads, the stronger the fabric.

The more relationships created inside CULO, the more valuable the Village becomes — not just for the publisher who created them, but for every publisher, business, community and visitor who shares a node in the graph.

Relationships are not metadata. Relationships are first-class citizens.

---

## Relationship Principles

1. **Relationships have their own identity.** Each relationship has a unique ID, a type, a source, a strength and a confidence level. A relationship is not just a field in a record — it is its own entity.

2. **Relationships have direction.** `Publisher CREATED Story` is different from `Story CREATED Publisher`. Direction is explicit and meaningful.

3. **Relationships have strength.** A publisher who has mentioned a brand 15 times across 8 stories has a stronger MENTIONS relationship with that brand than one who mentioned it once. Strength is a score, not a boolean.

4. **Relationships evolve.** They begin weak and uncertain, and strengthen over time as signals accumulate. They also decay if signals stop.

5. **Relationships are versioned.** When a relationship changes — strengthens, weakens, or changes type — the history is retained.

6. **Relationships should never disappear without an audit trail.** Even a deleted relationship leaves a history entry. Knowledge once created is not erased — it is archived.

7. **AI may suggest. Humans confirm.** AI agents propose relationships based on content analysis. Publishers and the system confirm or reject them. Ownership and commercial relationships always require human confirmation.

---

## Universal Relationship Record

Every relationship between two entities shares this structure.

| Field | Type | Description |
|---|---|---|
| `relationship_id` | UUID | Unique identifier for this relationship instance |
| `relationship_type` | string | See type registry below |
| `source_entity_id` | UUID | The entity the relationship originates from |
| `source_entity_type` | string | Entity type of source |
| `target_entity_id` | UUID | The entity the relationship points to |
| `target_entity_type` | string | Entity type of target |
| `direction` | enum | `source_to_target`, `target_to_source`, `bidirectional` |
| `strength` | float | 0.0–1.0. How strong this relationship is. Updated over time. |
| `confidence` | float | 0.0–1.0. How certain the system is this relationship is correct. |
| `status` | enum | `suggested`, `pending_review`, `confirmed`, `verified`, `archived`, `deleted` |
| `visibility` | enum | `public`, `private`, `system_only` |
| `ai_generated` | boolean | Whether this relationship was first suggested by an AI agent |
| `human_approved` | boolean | Whether a human has explicitly confirmed this relationship |
| `approved_by` | UUID or null | The user_id who confirmed (or null if auto-confirmed by system rule) |
| `source_engine` | string | Which engine created or last updated this relationship |
| `created_by` | UUID or null | The user_id who created (null if system-created) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |
| `last_reinforced_at` | timestamp | When a new signal last strengthened this relationship |
| `last_verified_at` | timestamp | When this relationship was last confirmed as accurate |
| `decay_starts_at` | timestamp | When strength decay begins (12 months from last reinforcement by default) |
| `version` | integer | Monotonically incrementing version number |
| `context` | string | Optional excerpt or note explaining the relationship origin |
| `source_story_id` | UUID or null | If this relationship was detected in a story, reference it |

---

## Relationship Type Registry

Organised by category. Each type has a defined source → target direction.

---

### Category: Ownership

High-confidence relationships. Usually explicit — set by the publisher, not inferred.

| Type | Source | Target | Notes |
|---|---|---|---|
| `OWNS` | Publisher | Business | Publisher is the primary owner |
| `CREATED` | Publisher | Story | Publisher authored this story |
| `CREATED` | Publisher | Idea | Publisher captured this idea |
| `CREATED` | Publisher | Library Item | Publisher created this resource |
| `CREATED` | Publisher | Course | Publisher created this course |
| `CREATED` | Publisher | Podcast | Publisher hosts this podcast |
| `HOSTS` | Community | Event | Community is the primary organiser |
| `HOSTS` | Business | Event | Business is the primary organiser |

---

### Category: Commercial

Requires human confirmation. AI may suggest but never auto-confirm.

| Type | Source | Target | Notes |
|---|---|---|---|
| `OFFERS` | Business | Service | Business lists this service |
| `SELLS` | Business | Product | Business sells this product |
| `SPONSORS` | Business | Event | Business is a financial sponsor |
| `PARTNERS_WITH` | Business | Business | Formal commercial partnership |
| `AFFILIATED` | Publisher | Business | Publisher has a non-ownership commercial relationship |
| `EMPLOYED_BY` | Publisher | Business | Publisher works for this Business (future) |
| `RECOMMENDS` | Publisher | Product | Publisher has an approved affiliate/referral recommendation |
| `RECOMMENDS` | Publisher | Service | As above for services |
| `RECOMMENDS` | Publisher | Software | As above for software tools |
| `RECOMMENDS` | Publisher | Business | As above for a business |
| `JOINED_PROGRAM` | Publisher | Partner Program | Publisher is an active member of this program |
| `PARTICIPATED_IN` | Publisher | Campaign | Publisher participated in this campaign |

---

### Category: Reference

Content-level relationships. Usually AI-detected from story content.

| Type | Source | Target | Notes |
|---|---|---|---|
| `MENTIONS` | Story | Business | Story mentions this business |
| `MENTIONS` | Story | Brand | Story mentions this brand |
| `MENTIONS` | Story | Person | Story mentions this person by name |
| `MENTIONS` | Story | Product | Story mentions this product |
| `MENTIONS` | Story | Software | Story mentions this software tool |
| `MENTIONS` | Story | Event | Story mentions this event |
| `MENTIONS` | Story | Community | Story mentions this community |
| `REFERENCES` | Story | Idea | Story explicitly links to or builds on an Idea |
| `REFERENCES` | Story | Library Item | Story cites or links to a Library resource |
| `REFERENCES` | Story | Book | Story references this book |
| `REFERENCES` | Story | Podcast | Story references or quotes this podcast |
| `SUPPORTS` | Library Item | Story | Resource supports the argument in a story |
| `CONTRADICTS` | Story | Story | Story challenges claims made in another story (future) |

---

### Category: Education

Content teaching relationships.

| Type | Source | Target | Notes |
|---|---|---|---|
| `TEACHES` | Story | Topic | Story educates about this topic |
| `TEACHES` | Course | Topic | Course covers this topic |
| `SOLVES` | Story | Problem | Story addresses this problem |
| `DEMONSTRATES` | Story | Software | Story shows how to use this software |
| `REVIEWS` | Story | Product | Story evaluates this product |
| `COMPARES` | Story | Product | Story compares multiple products (multi-target) |
| `WRITTEN_BY` | Book | Person | Book authored by this person |
| `CREATED_BY` | Course | Publisher | Course created by this publisher |

---

### Category: Membership & Participation

Publisher activity relationships.

| Type | Source | Target | Notes |
|---|---|---|---|
| `BELONGS_TO` | Publisher | Community | Publisher is a member of this community |
| `ATTENDED` | Publisher | Event | Publisher attended this event |
| `SPOKE_AT` | Publisher | Event | Publisher spoke at this event |
| `FACILITATED` | Publisher | Workshop | Publisher ran this workshop |
| `INTERVIEWED` | Podcast | Publisher | Podcast episode features Publisher as guest |
| `INTERVIEWED` | Publisher | Person | Publisher conducted this interview |
| `COMPLETED` | Publisher | Course | Publisher has completed this course |
| `ENROLLED_IN` | Publisher | Course | Publisher is enrolled in this course |
| `USES` | Publisher | Software | Publisher actively uses this tool in their work |

---

### Category: Collaboration

Relationships between publishers or between a publisher and another entity.

| Type | Source | Target | Notes |
|---|---|---|---|
| `COLLABORATES_WITH` | Publisher | Publisher | Two publishers have co-created something |
| `MENTORS` | Publisher | Publisher | One publisher mentors another (future) |
| `REFERRED_BY` | Publisher | Publisher | Publisher joined CULO via another publisher's referral (future) |
| `WORKS_WITH` | Publisher | Business | Publisher has a professional services relationship |

---

### Category: Taxonomy

Classification relationships that connect entities to the knowledge taxonomy.

| Type | Source | Target | Notes |
|---|---|---|---|
| `BELONGS_TO_TOPIC` | Any entity | Topic | Entity is categorised under this topic |
| `BELONGS_TO_INDUSTRY` | Any entity | Industry | Entity belongs to this industry |
| `LOCATED_IN` | Any entity | Location | Entity is based in or relevant to this location |
| `SERVES` | Business | Location | Business serves this location (may differ from base) |
| `TARGETS` | Story / Campaign | Audience | Intended audience type |
| `RELATES_TO` | Topic | Topic | Topics are related to each other |
| `PARENT_OF` | Industry | Industry | Industry is a parent category of a sub-industry |
| `COMPETES_WITH` | Software | Software | Software tools in the same category |

---

### Category: Discovery (Growth Engine)

Relationships created when Growth Engine makes a match. Transitional — confirmed when a connection is made.

| Type | Source | Target | Notes |
|---|---|---|---|
| `MATCHED_TO` | Publisher | Opportunity | Growth Engine identified this opportunity for this publisher |
| `INTERESTED_IN` | Business | Publisher | Business has expressed interest in working with this publisher |
| `RELEVANT_FOR` | Community | Publisher | Community is a strong match for this publisher |
| `NEEDS` | Event | Publisher | Event is seeking this publisher's expertise as a speaker |

---

### Category: Partner (Partner Engine)

Relationships created and maintained by the Partner Engine.

| Type | Source | Target | Notes |
|---|---|---|---|
| `DETECTED_IN` | Brand | Story | Brand was detected as an entity mention in this story |
| `APPROVED_FOR` | Partner | Story | Partner recommendation was approved for this story |
| `EARNS_FROM` | Publisher | Partner | Publisher has earned from this partner |
| `ENROLLED_IN` | Publisher | Partner Program | Publisher has joined this program |

---

## Relationship Categories Summary

| Category | Confidence default | Approval required | Strength decay |
|---|---|---|---|
| Ownership | Very High | Human confirms on creation | No decay |
| Commercial | High | Human always | No decay until program ends |
| Reference | Medium (AI) → High (confirmed) | Optional — AI can auto-confirm above threshold | Yes — 12 months |
| Education | Medium | Optional | Yes — 12 months |
| Membership & Participation | High (if explicit) | Human confirms for memberships | Slow decay — 24 months |
| Collaboration | High | Human confirms | Slow decay |
| Taxonomy | Low (AI) → Medium (confirmed) | Auto-confirm for topics/industries; human for edge cases | No decay (taxonomy) |
| Discovery | Low (initial) | Human acts on opportunity to confirm | 30 days then expires if not acted on |
| Partner | High | Publisher approves recommendation | Yes — on program end |

---

## Relationship Direction

Every relationship has a named direction. The direction affects how the Knowledge Graph is traversed.

```
Publisher CREATED → Story
(Publisher is the source; Story is the target)

Story MENTIONS → Brand
(Story is the source; Brand is the target)

Business PARTNERS_WITH ↔ Business
(Bidirectional — both benefit from knowing this relationship in both directions)

Publisher BELONGS_TO → Community
(Publisher is the member; Community is the group)
```

**Traversal example:** "Which publishers write about sustainability in Sydney?"

```
Topic(sustainability) ←BELONGS_TO_TOPIC— Story —CREATED← Publisher
Story —LOCATED_IN→ Location(Sydney)
```

Traversing the graph in both directions finds publishers who have written sustainability stories located in or relevant to Sydney.

---

## Relationship Strength Scoring

Strength is a float from 0.0 to 1.0. It represents how strong and reliable this relationship is.

### Starting strength by creation method:

| Creation method | Starting strength |
|---|---|
| Publisher explicitly confirms | 0.80 |
| AI detected with Very High confidence (≥ 0.90) | 0.60 |
| AI detected with High confidence (0.70–0.89) | 0.40 |
| AI detected with Medium confidence (0.50–0.69) | 0.20 |
| System inferred (topic taxonomy, location) | 0.30 |

### Signals that increase strength:

| Signal | Effect |
|---|---|
| Mention detected again in a new story | +0.08 per new mention |
| Publisher explicitly approves recommendation for this entity | +0.20 |
| Recommendation generates conversion | +0.10 |
| Publisher uses entity in tutorial (high engagement signal) | +0.15 |
| Multiple publishers independently connect to same entity | +0.05 per additional publisher |
| Publisher or admin explicitly confirms relationship | +0.25 (capped at 1.0) |

### Signals that decrease strength:

| Signal | Effect |
|---|---|
| Publisher marks entity as "no longer relevant" | -0.30 |
| Publisher rejects affiliate recommendation for this entity | -0.15 |
| Negative sentiment detected in new mention | -0.20 |
| No reinforcement for 12 months | -0.05 per month after 12 months |
| Entity becomes inactive/deleted | All relationships set to 0.0, status → archived |

**Strength floor:** 0.0. Relationships do not go negative.  
**Archived threshold:** Relationships with strength < 0.05 after 24 months of no reinforcement are automatically archived (not deleted).

---

## Relationship Confidence

Confidence (0.0–1.0) represents how certain the system is that this relationship is real and correct.

| Level | Score | Description |
|---|---|---|
| Very High | 0.90 – 1.00 | Publisher explicitly stated. Admin verified. |
| High | 0.70 – 0.89 | Strong AI detection + multiple signals |
| Medium | 0.50 – 0.69 | AI detected, moderate signals |
| Low | 0.30 – 0.49 | Weak AI signal, unconfirmed |
| Unknown | 0.00 – 0.29 | Insufficient data |

### Confidence states:

| State | Meaning |
|---|---|
| `ai_suggested` | AI proposed this relationship, awaiting confirmation |
| `publisher_confirmed` | Publisher explicitly confirmed |
| `business_confirmed` | Business owner confirmed |
| `admin_verified` | Admin has verified this relationship as factual |
| `auto_confirmed` | System auto-confirmed based on high confidence + rule |

---

## Relationship Sources

| Source | Examples |
|---|---|
| Publisher (explicit) | Publisher marks they attended an event, owns a business |
| Business (explicit) | Business states they partner with another business |
| Story content (AI) | Recommendation Intelligence Engine detects brand in story |
| Partner Engine | Recommendation approval creates RECOMMENDS relationship |
| Knowledge Engine | Graph update after new story published |
| Growth Engine | MATCHED_TO relationships from opportunity matching |
| Import Engine | Imported website content → entity mentions detected |
| Canva API | Canva design content → entity mentions detected |
| Camera Roll AI | Image analysis → location or entity detected |
| Admin | Manual relationship creation for verified facts |

---

## Relationship Lifecycle

```
Suggested (AI or system proposes)
      │
      ├── Confidence < threshold → Discarded (never stored)
      │
      └── Confidence ≥ threshold
            │
            ▼
      Pending Review (shown to publisher if human confirmation needed)
            │
            ├── Publisher rejects → Rejected (stored in history, never re-suggested for same pair)
            │
            └── Publisher confirms (or auto-confirmed by rule)
                  │
                  ▼
            Confirmed (active relationship in Knowledge Graph)
                  │
                  ▼ (additional signals arrive)
            Strengthening (strength score increases over time)
                  │
                  ▼ (admin or publisher confirms it is factual)
            Verified (highest confidence state)
                  │
                  ├── (strength decays below 0.05 after 24 months without reinforcement)
                  │         ▼
                  │       Archived (retained, not active in matching)
                  │
                  └── (entity deleted or explicitly removed)
                              ▼
                            Deleted (audit entry retained)
```

---

## Relationship Consumers

Every engine that reads or writes relationships:

| Engine | Uses relationships for |
|---|---|
| **Knowledge Engine** | Stores and maintains the graph. Primary owner of all relationships. |
| **Partner Engine** | Reads MENTIONS and RECOMMENDS relationships to surface opportunities. Writes RECOMMENDS on approval. |
| **Growth Engine** | Reads all relationships to score opportunity matches. Writes MATCHED_TO on match creation. |
| **Recommendation Intelligence Engine** | Creates MENTIONS and DETECTED_IN relationships from story content analysis. |
| **SEO Engine** | Reads TEACHES, REFERENCES, BELONGS_TO_TOPIC relationships to generate internal links and topic clusters. |
| **GEO Engine** | Reads all relationships to build entity definitions and relationship summaries for AI systems. |
| **Search Engine** | Reads BELONGS_TO_TOPIC, BELONGS_TO_INDUSTRY, LOCATED_IN to power filtered search. |
| **Analytics Engine** | Records EARNS_FROM, PARTICIPATED_IN relationship events for analytics. |
| **Automation Engine** | Reacts to new relationships as triggers (e.g., new MATCHED_TO → send notification). |
| **Widget Engine** | Reads CREATED relationships to populate publisher story feeds. Reads RECOMMENDS for recommendation widgets. |
| **Distribution Engine** | Reads OWNS and CREATED relationships to determine which profile pages show which content. |
| **AI Orchestration Engine** | All agents read relevant relationships. Relationship Agent writes new relationship suggestions. |

---

## Relationship Visualisation (Future)

Future dashboard views that make relationships visible to publishers:

| View | Description |
|---|---|
| **Publisher Network** | All entities connected to this publisher — businesses, topics, brands, communities, events |
| **Business Network** | All entities connected to this business — publishers, stories, products, partners |
| **Story Map** | All entities mentioned or recommended in a specific story |
| **Topic Cluster** | All stories, publishers and businesses connected through a shared topic |
| **Knowledge Timeline** | How a publisher's relationships have grown over time |
| **Partner Map** | Publishers connected to a Partner through recommendations |
| **Community Graph** | Members, topics and events within a community |
| **Campaign Network** | Publishers, businesses and stories involved in a campaign |

---

## AI Relationship Management

### AI Agents MAY:

- Suggest new relationships based on content analysis
- Increase confidence score when additional signals are detected
- Detect and flag potential duplicate relationships (same pair, different relationship IDs)
- Detect missing relationships (publisher wrote about an event but no ATTENDED relationship exists)
- Suggest collaborations based on shared nodes in the graph
- Suggest businesses based on topic overlap in the graph

### AI Agents MAY NEVER:

- Confirm an ownership relationship
- Create a commercial relationship (RECOMMENDS, SPONSORS, PARTNERS_WITH) without publisher action
- Override a publisher's relationship rejection
- Merge two entities (entity resolution) without admin review
- Delete or archive an active relationship

---

## Future Expansion

The relationship model is designed to scale without restructuring.

**Multi-owner relationships:** A story co-authored by two publishers has two CREATED relationships. No schema changes required — both exist as separate records pointing to the same story.

**Weighted relationships:** Multiple signals can exist on the same relationship pair, each contributing to the aggregate strength score. No new relationship types needed.

**Temporal relationships:** A `valid_from` / `valid_until` field can be added to any relationship for time-bounded connections (e.g. EMPLOYED_BY for a specific period).

**Geographic relationships:** LOCATED_IN relationships already support geographic context. Coordinates added to Location entities enable spatial querying without changing the relationship structure.

**Organisation relationships:** When team accounts are introduced, organisations become entities in the graph. BELONGS_TO_ORGANISATION is a new relationship type — the rest of the model is unchanged.

**Marketplace and plugin relationships:** Third-party plugins can create and read relationships within defined scopes — without access to private relationships or the ability to delete existing ones.

---

## Development Rules

Every future feature must answer:

1. What relationships does this feature create?
2. Which existing relationships does it strengthen?
3. What is the source engine and confidence?
4. Does it require human confirmation?
5. What is the starting strength?
6. Which engines consume these new relationships?
7. Which dashboards surface them?
8. Which widgets use them?
9. Which analytics track them?
10. Which AI agents learn from them?

---

*This document is the permanent relationship contract for CULO. Every relationship between every entity is governed by the rules defined here.*
