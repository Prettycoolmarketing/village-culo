# CULO Knowledge Graph Engine — Master Blueprint

**Version:** 1.0  
**Status:** Architectural Blueprint — Pre-Implementation  
**Engine:** Knowledge Engine (Phase 3)  
**Depends on:** 00-engine-blueprint.md  

---

## Philosophy

Publishing creates knowledge.  
Knowledge creates relationships.  
Relationships create discovery.  
Discovery creates opportunity.  
Opportunity creates growth.

The Knowledge Graph exists so that every piece of knowledge produced inside CULO strengthens the entire ecosystem — not just the person who published it.

When a founder writes about running a photography business in Bali, that story doesn't just help people who happen to find it. It connects that founder to every other node in the CULO graph: other founders in creative industries, businesses that serve photographers, events in Bali, communities around visual storytelling, podcasts about travel entrepreneurship. The story becomes a permanent node in a living graph that grows smarter with every piece of content added.

---

## Core Principles

1. **Knowledge should never exist in isolation.** Every object connects to many others.

2. **Every Story strengthens the graph.** A story that doesn't create new relationships or strengthen existing ones is a missed opportunity.

3. **Relationships have direction and strength.** "Publisher recommends Product" is a stronger and more specific relationship than "Publisher mentioned Product." Relationship type and strength matter.

4. **The graph improves over time.** Early relationships are thin. As more content is published and more connections are made, the graph becomes dense and powerful.

5. **The graph is the intelligence layer.** Every engine in CULO that needs to understand meaning, relationships, or relevance queries the Knowledge Graph.

---

## What the Knowledge Graph is Not

It is not a database of records. The database of records is Supabase.

It is not a content index. The content index belongs to the Search Engine.

It is not a user directory. User identity belongs to the Identity Engine.

The Knowledge Graph is a map of meaning — what things are, how they relate, and how strongly.

---

## Graph Nodes

Every object in CULO that can be represented as a node in the graph.

### People & Organisations:
`Publisher` · `Founder` · `Business` · `Brand` · `Agency` · `Partner` · `Community` · `Investor` · `Accelerator` · `Mentor` · `Coach` · `Creator` · `Organisation`

### Content:
`Story` · `Blog` · `Carousel` · `Reel` · `Voice Over` · `Talking Head` · `Quick Rhythm` · `Vlog` · `Podcast Episode` · `Video` · `Library Item` · `Resource` · `Newsletter` · `Article` · `Imported Content`

### Ideas & Knowledge:
`Idea` · `Topic` · `Industry` · `Technology` · `Tool` · `Software` · `Audience Type` · `Problem` · `Solution`

### Products & Commerce:
`Product` · `Service` · `Course` · `Program` · `Campaign`

### Places & Events:
`Location` (city, region, country) · `Event` · `Festival` · `Workshop` · `Market` · `Retreat` · `Conference`

### Media:
`Podcast` · `Book` · `Website` · `YouTube Channel` · `Social Account`

### Future:
Any entity type should be addable as a new node type without restructuring the graph. Node schema is flexible.

---

## Relationship Types

Relationships describe how nodes connect to each other. Every relationship has:
- A **type** (what kind of connection)
- A **direction** (from node A to node B)
- A **strength** (0.0–1.0, updated over time)
- A **confidence** (how certain the engine is this relationship is correct)
- A **source** (where the relationship came from: story content, user input, AI inference)
- A **created_at** and **last_reinforced_at** timestamp

### Creation relationships:
```
Publisher  CREATED       → Story
Publisher  OWNS          → Business
Publisher  PUBLISHED     → Library Item
Business   OFFERS        → Service
Brand      CREATED       → Product
```

### Content relationships:
```
Story      REFERENCES    → Idea
Story      REFERENCES    → Resource
Story      RECOMMENDS    → Product
Story      RECOMMENDS    → Service
Story      RECOMMENDS    → Software
Story      MENTIONS      → Brand
Story      MENTIONS      → Business
Story      MENTIONS      → Person
Story      FEATURES      → Business
Story      TEACHES       → Topic
Story      SOLVES        → Problem
Story      DESCRIBES     → Location
Story      COVERS        → Industry
Story      ATTENDED      → Event (when author describes attending)
```

### Participation relationships:
```
Founder    SPEAKS_AT     → Event
Founder    BELONGS_TO    → Community
Founder    ATTENDED      → Event
Founder    COMPLETED     → Course
Publisher  USES          → Software
Publisher  RECOMMENDS    → Product
Publisher  ENDORSED      → Business
```

### Commercial relationships:
```
Business   SPONSORS      → Event
Business   PARTNERS_WITH → Business
Business   AFFILIATED    → Community
Partner    OFFERS        → Partner Program
Publisher  JOINED        → Partner Program
```

### Media relationships:
```
Podcast    INTERVIEWS    → Founder
Podcast    COVERS        → Topic
Podcast    BELONGS_TO    → Publisher
Book       WRITTEN_BY    → Person
Book       TEACHES       → Topic
Course     TEACHES       → Topic
Course     CREATED_BY    → Founder
```

### Knowledge relationships:
```
Topic      BELONGS_TO    → Industry
Topic      RELATED_TO    → Topic
Technology IS_USED_FOR   → Topic
Software   COMPETES_WITH → Software
Problem    SOLVED_BY     → Solution
Industry   LOCATED_IN    → Location
```

### Discovery relationships (created by Growth Engine):
```
Publisher  MATCHED_TO    → Opportunity
Business   INTERESTED_IN → Publisher
Community  RELEVANT_FOR  → Founder
Event      NEEDS         → Speaker (in their topic)
```

---

## Relationship Strength

Every relationship has a strength score from 0.0 (weak/uncertain) to 1.0 (very strong/certain).

Strength is not static — it changes based on ongoing signals.

### Signals that increase strength:

| Signal | Effect |
|---|---|
| Publisher mentions entity a second time | +0.10 on MENTIONS relationship |
| Publisher mentions entity across multiple stories | +0.05 per additional story |
| Publisher explicitly recommends entity | MENTIONS upgraded to RECOMMENDS, strength +0.20 |
| Publisher approves affiliate recommendation | RECOMMENDS strength +0.15 |
| Recommendation generates conversions | +0.10 (outcome-validated relationship) |
| Publisher uses entity in tutorial (teaches via it) | USES relationship, strength +0.20 |
| Publisher attends event (stated explicitly) | ATTENDED relationship, strength +0.30 |
| Multiple publishers independently recommend same entity to same topic | Topic↔Entity relationship +0.05 per publisher |
| Community mentions a topic in multiple contexts | Topic→Community strength +0.10 per mention |

### Signals that decrease strength:

| Signal | Effect |
|---|---|
| Publisher states they stopped using something | USES relationship strength -0.30 |
| Publisher rejects affiliate recommendation | RECOMMENDS relationship confidence -0.15 |
| Negative sentiment detected in mention | MENTIONS strength -0.20 |
| Relationship hasn't been reinforced in 12 months | Strength decay: -0.05 per month after 12 months |
| Entity becomes inactive or deleted | All relationships flagged as stale |

### Strength decay:

Relationships that aren't reinforced over time gradually weaken. A mention that was made once three years ago should not carry the same weight as a recent repeated recommendation.

Decay rate: `-0.05 per month` after 12 months of no reinforcement.  
Floor: `0.0` — relationships don't go negative, they become dormant.

---

## Entity Resolution

The graph must recognise when two references to the same entity are the same node.

### Challenge examples:
- "Canva" and "canva.com" are the same entity
- "James Clear" and "@jamesclear" are the same person
- "PCM", "Pretty Cool Marketing" and "prettycoolmarketing.com" are the same business
- "GPT-4" and "ChatGPT" may resolve to the same entity or separate entities depending on context

### Resolution approach:

**Exact match:** Entity name matches an existing node name exactly → same node.

**Alias match:** Entity name matches a registered alias for an existing node → same node.

**Domain match:** URL domain matches a registered website for an existing node → same node.

**Fuzzy match:** Entity name is sufficiently similar (edit distance, normalised) → flagged for review before merge.

**Disambiguation:** If two distinct entities share a name, they remain separate nodes with disambiguation data (e.g., "Apple (technology company)" vs "Apple (fruit)").

**Manual override:** Admin or publisher can confirm or reject proposed entity resolutions.

Entity aliases are stored per node. They grow over time as new variations are encountered.

---

## Knowledge Expansion

Every time a new Story is published, the graph expands.

```
Story published
      │
      ▼
Recommendation Intelligence Engine processes content
      │
      ▼
Entities detected → new nodes created (if not existing) or matched to existing nodes
      │
      ▼
Relationships detected → new edges created or existing edges strengthened
      │
      ▼
Topic assignments confirmed → Story node connected to Topic nodes
      │
      ▼
Industry context inferred → Story node connected to Industry nodes
      │
      ▼
Location context detected → Story node connected to Location nodes
      │
      ▼
Knowledge Graph updated
      │
      ▼
Downstream engines notified of graph update:
  - Partner Engine: new recommendation opportunities
  - Growth Engine: new opportunity matches
  - SEO Engine: new structured data opportunities
  - GEO Engine: new entity definitions for AI discoverability
  - Search Engine: new content indexed
  - Analytics Engine: knowledge event logged
```

---

## Graph Queries

Questions the Knowledge Graph should be able to answer efficiently.

**Publisher discovery:**
- Which publishers publish about `{topic}` in `{location}`?
- Which publishers have recommended `{product}` more than twice?
- Which publishers have attended `{event_type}` events?
- Which publishers use `{software}` in their workflow?
- Which publishers have expertise in `{industry}` and `{industry}`?

**Business discovery:**
- Which businesses offer `{service_type}` in `{location}`?
- Which businesses have been recommended by publishers who publish about `{topic}`?
- Which businesses are connected to `{publisher}` through recommendations?

**Content discovery:**
- Which stories reference `{product}` or `{brand}`?
- Which stories teach `{topic}` to `{audience}`?
- Which stories mention events in `{location}` in `{year}`?

**Relationship discovery:**
- Who knows about both `{topic_A}` and `{topic_B}`?
- Which founders have collaborated with `{business}`?
- Which publishers are connected through shared community membership?

**Opportunity discovery:**
- Which publishers should speak at an event about `{topic}` in `{location}`?
- Which publishers would be good guests for a podcast about `{topic}`?
- Which businesses should partner with `{publisher}` based on topic overlap?

**Gap discovery:**
- Which `{industry}` topics have no coverage in the Village?
- Which `{location}` businesses have no publishers recommending them?
- Which `{topic}` communities have no Village publishers as members?

---

## Knowledge Score

A score per publisher (0–100) representing the depth and quality of their contribution to the Knowledge Graph.

This is an internal signal — not a public ranking.

### Factors:

| Factor | Weight | Description |
|---|---|---|
| Publishing consistency | 20% | Regular cadence, sustained over time |
| Topic depth | 20% | Number of distinct ideas and subtopics covered within their focus areas |
| Relationship diversity | 15% | Breadth of entity relationships created (brands, communities, events, people) |
| Authority signals | 15% | How often other stories or publishers link to or reference their content |
| Practical experience | 15% | Recommendations, tutorials, and case studies (applied knowledge) |
| Community participation | 10% | Connections to communities, events, and other publishers in the graph |
| Verification quality | 5% | Data completeness on their profile and stories |

### Uses of the Knowledge Score:

- Growth Engine uses it to prioritise suggestions (higher score publishers surface as better matches)
- Partner Engine uses it as a trust signal in partner matching
- Future: may contribute to a public Publisher Authority signal
- Future: may influence ranking in Village discovery features

---

## Automatic Graph Updates

Every graph update follows a consistent pattern:

```
Event occurs (story published, recommendation approved, event attended, etc.)
      │
      ▼
Knowledge Engine receives event
      │
      ▼
Extract entities from event data
      │
      ▼
Resolve entities (match existing nodes or create new)
      │
      ▼
Determine relationship type and direction
      │
      ▼
Calculate strength delta
      │
      ▼
Update graph (upsert relationship with new strength)
      │
      ▼
Notify downstream engines of graph update
```

Graph updates are asynchronous. They do not block content publishing.

---

## Future AI Applications

The Knowledge Graph becomes the foundation for every AI capability in CULO.

| AI Capability | Graph Dependency |
|---|---|
| AI search | Natural language queries resolved against graph entities |
| AI recommendations | Graph traversal finds relevant nodes near a starting publisher |
| AI collaborator matching | Multi-hop graph traversal: who do people similar to this publisher connect with? |
| AI opportunity discovery | Graph scores potential connections by relationship distance and strength |
| AI founder matching | Common nodes in different publisher graphs → potential collaboration |
| AI business matching | Publisher graph overlap with business topic nodes |
| AI learning paths | Graph traversal from current knowledge to target knowledge through related topics |
| AI coaching | AI agent reads a publisher's graph and identifies gaps relative to their stated goals |
| AI content understanding | New content evaluated against existing graph to determine what's new vs. repetitive |
| AI publishing assistance | Suggestions based on topic gaps identified in publisher's own graph |
| AI memory | AI agent stores a publisher's preferences and history as weighted graph relationships |
| Future autonomous agents | Agents with read/write access to the graph can reason, plan and take action |

---

## Engine Connections

| Engine | Connection |
|---|---|
| **Identity Engine** | Publisher and Business nodes created here. Knowledge Engine extends them with graph relationships. |
| **Publishing Engine** | Every published story triggers graph update. |
| **Recommendation Intelligence Engine** | Primary consumer of Knowledge Graph — queries graph to find matches and produce recommendation candidates. |
| **Partner Engine** | Reads brand mention and partner match data from graph. Writes recommendation approval events back. |
| **Growth Engine** | Queries graph extensively for all opportunity matching. Writes connection events back when connections are made. |
| **Distribution Engine** | Reads related content graph to surface related stories alongside published content. |
| **Automation Engine** | Receives graph update events and fires relevant automations (e.g., new match found → notify publisher). |
| **Analytics Engine** | Reads graph for audience and topic analytics. Writes engagement events back to strengthen relationships. |
| **Search Engine** | Indexes graph entities and relationships for search. |
| **SEO Engine** | Uses graph relationships to build structured data (JSON-LD) for search engine indexing. |
| **GEO Engine** | Exports entity definitions and relationship data in formats optimised for LLM comprehension. |
| **Widget Engine** | Reads graph to determine what related content appears in publisher website widgets. |
| **Future AI Agents** | All AI agents operate with the Knowledge Graph as their primary context source. |

---

*This document defines the complete CULO Knowledge Graph Engine before any implementation begins. It is the permanent architectural foundation for all intelligence features in the platform.*
