# CULO Partner Engine — Part 6: Recommendation Intelligence Engine

**Version:** 1.0  
**Status:** Architectural Blueprint — Pre-Implementation  
**Engine:** Partner Engine (Phase 2) — Intelligence Layer  
**Depends on:** 01-partner-engine-blueprint.md, 02-partner-data-model.md, 03-partner-automations.md  

---

## Philosophy

CULO should never behave like an affiliate plugin.

An affiliate plugin finds keywords and inserts links.

CULO should behave like a trusted editor — one who has read everything a publisher has written, understands their voice, knows what they genuinely recommend versus what they happen to mention, and can quietly suggest when something they said could be recognised and made valuable.

Recommendations should feel like helpful suggestions from someone who knows the publisher's work. Never advertisements. Never forced monetisation.

The Recommendation Intelligence Engine exists to understand stories, not keywords.

---

## Position in the Architecture

The Recommendation Intelligence Engine is a sub-system within the Partner Engine. It is the intelligence layer — the component responsible for turning raw content into structured recommendation signals that the Partner Engine can act on.

```
Publishing Engine (story arrives)
      │
      ▼
Knowledge Engine (topics, entities, relationships)
      │
      ▼
Recommendation Intelligence Engine  ←── This document
      │
      ▼
Partner Engine (match, suggest, track)
      │
      ▼
Publisher (review, approve)
      │
      ▼
Distribution Engine (disclose, publish)
      │
      ▼
Analytics Engine (track, report)
```

The Recommendation Intelligence Engine sits between the Knowledge Engine and the Partner Engine. It receives entity signals from the Knowledge Engine and produces structured recommendation candidates for the Partner Engine to act on.

---

## Content Sources

The engine analyses content from every format CULO supports.

**Text-based:**
Story body · Story title · Story summary · Blog posts · Carousels (text layer) · Library resources · Business pages · Founder profiles · Imported websites · Imported newsletters · Imported articles

**Audio/Video:**
Talking-head transcripts · Voice-over transcripts · Quick Rhythm video captions · Vlog transcripts · Podcast transcripts

**Visual:**
Image alt text and captions · Media metadata · Camera Roll AI descriptions (future) · Canva design text layers (future)

**Structured data:**
Story topics · Story links · CTA links · Resource citations · Event mentions · Product names in metadata

**Imported sources (future):**
Social imports (Instagram, TikTok, LinkedIn) · Podcast RSS · YouTube transcripts · Newsletter archives

---

## Understanding Layer

Before entity detection begins, the engine builds a structural understanding of the content.

### What the engine identifies:

**Topical:**
- Main topic (primary subject of the story)
- Supporting topics (secondary themes)
- Industry context
- Audience implied (who is this content for?)

**Intentional:**
- Content intent: tutorial, review, case study, opinion, comparison, personal experience, news, event coverage, educational, inspirational

**Relational:**
- Problem stated (what challenge is the content addressing?)
- Solution proposed (what does the author recommend?)
- Outcome described (what result did the solution produce?)

**Sentiment (future):**
- Author sentiment toward mentioned entities: positive, neutral, negative, ambiguous
- Recommendation strength: strong endorsement, passing mention, cautionary reference

**Commercial context:**
- Is the author describing their own product or someone else's?
- Is there an existing commercial relationship that should be disclosed?
- Is this educational (reduces commercial intent) or promotional (increases disclosure importance)?

---

## Entity Detection

The engine detects entities — named things — mentioned in the content.

### Entity categories:

| Category | Examples |
|---|---|
| Business | "Pretty Cool Marketing", "Apple", "a Sydney-based agency" |
| Brand | "Nike", "Canva", "Notion" |
| Software / App | "Notion", "Figma", "ChatGPT", "CapCut" |
| Product | "Sony ZV-E10", "a standing desk from Flexispot" |
| Service | "a VA service based in the Philippines", "their copywriting package" |
| Person / Founder | "James Clear", "Gary Vaynerchuk" |
| Book | "Atomic Habits", "The E-Myth" |
| Podcast | "How I Built This", "The Daily" |
| Course / Program | "a 12-week coaching program", "Kajabi-hosted course" |
| Community | "Slack community", "a membership site" |
| Event | "Canva Create", "a local business summit" |
| Location | "the Amalfi Coast", "Tokyo" |
| Organisation | "a local chamber of commerce", "HubSpot Academy" |
| Technology | "AI tools", "a GPT integration" |
| Future entity types | Any category should be addable without architecture changes |

### Detection methods:

**Named Entity Recognition (NLP):**
Identifies proper nouns and resolves them to entity types. Preferred method for text content.

**Link extraction:**
Any URL in the story content is a strong signal. The domain resolves to a brand or business entity. Links to known affiliate networks are recognised automatically.

**Pattern matching:**
Common patterns: "I use [product]", "I recommend [brand]", "you can find it at [URL]", "they offer a [discount/trial]."

**Confidence scoring:**
Every detected entity is assigned a confidence score (0.0 to 1.0).

| Score range | Meaning |
|---|---|
| 0.90 – 1.00 | Near-certain recommendation context |
| 0.70 – 0.89 | High confidence — strong mention with positive context |
| 0.50 – 0.69 | Medium confidence — mentioned but context is ambiguous |
| 0.30 – 0.49 | Low confidence — incidental mention |
| 0.00 – 0.29 | Below threshold — discard |

The minimum confidence threshold for creating a `brand_mention` record is `0.50`. The minimum for sending a recommendation suggestion to the publisher is `0.70`.

These thresholds are configurable per entity type and will be tuned based on publisher feedback over time.

---

## Relationship Detection

Beyond individual entities, the engine builds relationship signals.

### Relationship types detected:

| Relationship | Example |
|---|---|
| Founder created Business | "I started a creative agency in 2019..." |
| Publisher uses Product | "I write everything in Notion..." |
| Publisher recommends Service | "We've been using Xero for three years..." |
| Publisher attended Event | "I was at Canva Create last year..." |
| Story references Book | "After reading Atomic Habits..." |
| Business sponsors Story | "This post is brought to you by..." |
| Publisher interviewed Person | "I sat down with [Name]..." |
| Publisher enrolled in Course | "I completed their certification..." |
| Publisher is member of Community | "Inside the community I'm part of..." |

### Relationship strength:

Each detected relationship is assigned a strength score based on:

- Frequency (how many times this relationship appears across the publisher's content)
- Context (primary subject vs. passing mention)
- Recency (recent mentions weighted higher)
- Specificity (named product vs. generic category)
- Sentiment (positive context vs. neutral vs. cautionary)

Relationships are stored in the Knowledge Engine's entity graph and strengthen over time as more content is published.

---

## Recommendation Confidence Model

Not all mentions are recommendations. The engine must distinguish between:

- A passing reference
- An educational mention
- A genuine recommendation
- A comparison or alternative
- A cautionary warning
- A paid placement that must be disclosed

### Confidence levels:

| Level | Score | Meaning |
|---|---|---|
| Very High | 0.90+ | Publisher explicitly recommends. Personal experience stated. Clear positive outcome. |
| High | 0.70 – 0.89 | Strong positive mention. Repeated across content. Contextually clear recommendation. |
| Medium | 0.50 – 0.69 | Positive mention but context is tutorial or educational rather than personal recommendation. |
| Low | 0.30 – 0.49 | Incidental mention. No clear recommendation intent. |
| Unknown | 0.00 – 0.29 | Insufficient signal. No recommendation created. |

### Factors that increase confidence:

- Publisher uses first person ("I use", "I love", "we recommend")
- Positive outcome described ("it helped me", "I doubled my output")
- Personal experience stated ("I've been using this for two years")
- Multiple mentions across different stories
- Link included (especially to a product or pricing page)
- Tutorial built around the product (strong usage signal)
- Publisher teaching others to use the product

### Factors that decrease confidence:

- Comparison context ("compared to X, Y is better" — lower confidence for X)
- Cautionary context ("I wouldn't recommend..." or "be careful with...")
- Generic category mention ("I use a CRM tool" without naming it)
- Past-tense discontinuation ("I used to use Notion but switched")
- Negative sentiment ("frustrating", "overpriced", "doesn't work")

**Critical rule:** Negative sentiment toward an entity never creates a recommendation suggestion. Detection stores the brand mention. No suggestion is created.

---

## Recommendation Types

The engine distinguishes between different kinds of mentions so the right disclosure is suggested.

| Type | Description | Disclosure Suggested |
|---|---|---|
| Personal recommendation | Publisher genuinely advocates based on their own experience | `personal-recommendation` or `affiliate` if program exists |
| Educational reference | Publisher teaches using the tool but doesn't explicitly endorse | `personal-recommendation` only if strong positive signal co-exists |
| Comparison | Publisher comparing multiple options | Present all options as potential matches, lower confidence |
| Case study | Publisher describing how a client used a product | Lower confidence — may not be publisher's own recommendation |
| Tutorial | Publisher teaching how to use a tool | High confidence — using it implies comfort and recommendation |
| Tool mention | Publisher lists a tool without elaboration | Medium confidence — needs other signals to create suggestion |
| Customer story | Publisher is the customer describing their own journey | High confidence |
| Partner story | Publisher describing a business collaboration | Flag for `sponsored` or `community-partner` disclosure |
| Review | Explicit evaluative content | High confidence if positive |
| Opinion | Publisher shares view without personal use | Medium confidence |
| Experience | Publisher describes personal use | High confidence |
| Affiliate opportunity | Publisher already using an external affiliate link | Detect existing link, suggest to formalise through CULO |

---

## Matching Engine Flow

The complete flow from content to recommendation candidate:

```
Content arrives (story published / updated)
      │
      ▼
Text extraction
(title + summary + body + transcript + captions + links)
      │
      ▼
Understanding Layer
(intent, topic, audience, problem, solution, outcome)
      │
      ▼
Entity Detection
(NLP + link extraction + pattern matching)
      │
      ▼
Confidence scoring per entity
      │
      ├── Score < 0.50 → discard
      │
      └── Score ≥ 0.50 → create Brand Mention record
                │
                ▼
        Sentiment check
                │
                ├── Negative sentiment → no suggestion
                │
                └── Neutral or positive
                        │
                        ▼
                Relationship Detection
                (how publisher relates to this entity)
                        │
                        ▼
                Recommendation Type Classification
                        │
                        ▼
                Partner Match
                (query Partners database)
                        │
                        ├── No match → Brand Mention status = no-match
                        │
                        └── Match found
                                │
                                ▼
                        Program eligibility check
                                │
                                ├── Not eligible → log, no suggestion
                                │
                                └── Eligible
                                        │
                                        ▼
                                Create Recommendation (pending)
                                        │
                                        ▼
                                Publisher notified
```

---

## Learning Layer

The Recommendation Intelligence Engine improves over time by learning from publisher behaviour and recommendation outcomes.

### Signals that train the model:

**Approval signals:**
- Publisher approved → this entity/context pattern is valid for this publisher
- Publisher approved quickly → high-confidence pattern
- Publisher approved with default disclosure → strong match

**Rejection signals:**
- Publisher rejected → reduce confidence for this entity pattern with this publisher
- Publisher rejected repeatedly → lower entity confidence threshold for this publisher
- Publisher provided rejection reason → direct training signal

**Editing signals:**
- Publisher edited disclosure type before approving → improve default disclosure prediction
- Publisher changed context excerpt → refine entity extraction for similar patterns
- Publisher withdrew a previously approved recommendation → strong negative signal

**Outcome signals:**
- High click rate on approved recommendation → this type of recommendation resonates with this publisher's audience
- Low conversion despite high clicks → mismatch between audience and partner offer
- High conversion → partner offer aligned with publisher audience

**Cross-publisher signals (aggregated, anonymised):**
- Which entities get high approval rates across publishers in similar topics
- Which entity types tend to be rejected in educational contexts
- Which partner programs see consistent publisher approval

---

## Recommendation Rules — Non-Negotiable

These rules apply to the intelligence engine regardless of any AI improvements made in future:

1. **Keyword alone is never enough.** A brand name appearing once in content does not create a recommendation. Context, confidence score, and sentiment must all pass threshold.

2. **Negative experiences are never monetised.** If sentiment toward an entity is negative, no recommendation is created, regardless of whether a partner program exists.

3. **Confidence threshold is enforced before any suggestion reaches the publisher.** No low-confidence suggestion is surfaced. Publishers should only see suggestions that are genuinely plausible.

4. **The engine suggests. The publisher decides.** No recommendation is ever applied automatically. Every approved recommendation is the result of explicit publisher action.

5. **The same entity is not suggested repeatedly for the same story.** After a publisher rejects a suggestion, the same partner is not re-suggested for the same story unless the story is materially edited.

6. **Paid programs do not increase confidence scores.** A Partner paying for Village Pro does not make their entity more likely to be detected or suggested. Detection is content-driven only.

---

## Business Discovery via Intelligence Engine

The intelligence engine also powers business discovery — helping Village Pro Businesses become visible to relevant publishers.

When a new Partner is added:
1. Engine scans existing published stories for past mentions of this entity.
2. Creates retroactive Brand Mention records.
3. Identifies publishers who have mentioned this entity.
4. Creates pending Recommendations for eligible publisher-partner matches.
5. Publishers notified of new retroactive opportunity.

This means a publisher who mentioned a brand six months ago — before the brand joined Village Pro — will automatically receive a suggestion when the brand joins.

---

## Future AI Capabilities

Phase 2 establishes the pattern-matching and NLP foundation. Future phases add AI layers:

| Capability | Description |
|---|---|
| Entity enrichment | AI augments entity records with description, aliases, related entities |
| Relationship expansion | AI infers relationships from context even when not explicitly stated |
| Knowledge Graph automation | AI continually updates the entity graph from new content |
| Suggested collaborations | "Based on your content, this founder should meet [Name]" |
| Suggested podcasts | AI matches publisher to podcasts seeking guests in their topic area |
| Suggested communities | AI identifies which communities a publisher would benefit from joining |
| Sentiment refinement | AI models trained specifically on recommendation sentiment |
| Publisher voice model | AI learns each publisher's writing style to improve entity and intent detection |
| Cross-format intelligence | Video + text + audio understood as a unified content piece |

---

## Engine Connections

| Engine | Connection |
|---|---|
| **Publishing Engine** | Receives new story content on every publish and update event |
| **Knowledge Engine** | Shares entity detection results with the Knowledge Engine's entity graph. Knowledge Engine enriches entity data back. |
| **Partner Engine** | Produces Recommendation candidates. Partner Engine manages the approval workflow. |
| **Identity Engine** | Reads publisher profile topics, industries and locations to improve match quality |
| **Analytics Engine** | Receives approval, rejection, click and conversion signals for model learning |
| **Automation Engine** | Fires notification when new recommendation suggestion created |
| **SEO Engine** | Entity detection results feed into structured data for SEO |
| **GEO Engine** | Entity and relationship data adds to the CULO Knowledge Graph for AI discoverability |
| **Distribution Engine** | Approved recommendations trigger story update, which Distribution Engine republishes |
| **Canva API (future)** | Canva content receives same intelligence pipeline as native stories |
| **Future AI Agents** | Intelligence engine provides entity + relationship context to any future AI agent layer |

---

*This document defines the complete Recommendation Intelligence Engine before any implementation begins. It is the permanent specification for how CULO understands content rather than simply scanning it.*
