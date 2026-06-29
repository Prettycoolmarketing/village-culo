# CULO AI Orchestration Engine — Master Blueprint

**Version:** 1.0  
**Status:** Architectural Blueprint — Pre-Implementation  
**Engine:** AI Orchestration Engine (Phase 4+)  
**Depends on:** 00-engine-blueprint.md, Knowledge Graph Engine, Partner Engine, Publishing Engine  

---

## Why This Engine Exists

Almost every intelligent feature in CULO's future roadmap — Canva publishing, camera roll imports, partner suggestions, widgets, founder matching, business discovery, SEO optimisation, GEO optimisation — requires multiple AI agents working together rather than one model doing everything.

Without orchestration, each AI feature becomes an isolated prompt. With orchestration, every AI agent operates within a shared framework: consistent data access, consistent approval rules, consistent output quality, and consistent learning from publisher behaviour.

The AI Orchestration Engine is the control centre for all future intelligence inside CULO. It decides which agent runs, when, what it receives, what it produces, and what happens next.

---

## Philosophy

**AI assists. Humans approve.**

AI should reduce friction — not remove ownership. The Publisher's voice, lived experience and editorial judgment are the product. AI is a tool in their service.

AI should preserve the Publisher's voice. A story written in a casual, warm, first-person voice should not be summarised into corporate copy by an agent.

AI should strengthen knowledge, relationships and discoverability. Every AI output should make the Knowledge Graph richer, the partner connections stronger, or the content more findable.

AI should never invent lived experience. If a publisher says they attended an event, AI can structure that story. AI cannot fabricate the experience.

AI should never silently publish, monetise or misrepresent content. No AI output that reaches a public surface does so without explicit publisher review and approval.

---

## Core Classification Principle

Every AI output is classified into one of seven categories. Classification determines the approval path.

| Class | Description | Approval Required |
|---|---|---|
| **Public Content** | Story body, captions, blog copy, profile text, public claims | Always — Publisher explicitly approves before publish |
| **Monetised Recommendation** | Affiliate, referral or sponsored links and disclosures | Always — Publisher explicitly approves each recommendation |
| **Draft** | Story drafts, summaries, titles — marked clearly as AI-generated | Publisher reviews and edits before approving |
| **Metadata** | SEO titles, meta descriptions, topics, alt text, schema | May auto-apply with review option; Publisher can override |
| **Relationship** | Knowledge Graph edges: connections between entities | Surfaced for review; auto-applied at low confidence risk if non-public |
| **Automation** | Scheduled tasks, content updates, index refreshes | Auto-applied unless output affects public content |
| **Alert** | Trust issues, missing disclosures, broken links, health check findings | Surfaced in dashboard, no auto-action |

---

## AI Agents

Each agent has a single, well-defined responsibility. Agents do not overlap in scope.

---

### Insight Agent

**Responsibility:** Extract meaning from content.

**What it finds:** Key lessons · Opinions held by the publisher · Personal experiences described · Problems identified · Solutions offered · Outcomes achieved · Memorable phrases · Core argument of the piece

**Output class:** Draft / Metadata  
**Approval:** Publisher reviews extracted insights before they become standalone ideas or FAQ entries. Technical extraction (topics, entities) may auto-apply.

**Used by:** Publishing Engine (populate Idea fields) · Knowledge Engine (extract knowledge nodes) · SEO Agent (find quotable moments) · GEO Agent (citation-ready summaries)

---

### Story Agent

**Responsibility:** Transform raw material into structured Story objects.

**Input types:** Canva design payload · Camera roll media · Website import · Podcast transcript · Raw text · Voice recording · Social import

**What it produces:** Story title · Story summary · Story body (formatted) · Suggested cover image · Suggested topics · Suggested CTA

**Output class:** Draft  
**Approval:** Full publisher review always required before any Story is published.

**Critical rule:** Story Agent drafts are always marked AI-generated until publisher edits them. No story with an AI-generated body can be published without the publisher touching the content.

---

### Format Agent

**Responsibility:** Identify what content format best represents the incoming material.

**Determination:** Is this a blog? Reel? Carousel? Voice over? Talking head? Photo story? Document? Podcast? Mixed?

**Output class:** Metadata (low risk — classification only)  
**Approval:** Auto-applied. Publisher can change format before publishing.

**Used by:** Publishing Engine (routes content to correct format UI) · Story Agent (passes format context for structured output)

---

### Media Agent

**Responsibility:** Understand and optimise media files.

**For images:** Alt text suggestion · Image description · Gallery order suggestion · Featured image selection · Thumbnail selection · Colour palette extraction

**For video:** Transcript extraction · Chapter suggestion · Thumbnail frame suggestion · Caption timing · Duration

**For audio:** Transcript extraction · Speaker diarisation (who is speaking) · Audio quality assessment

**For documents:** Text extraction · Structure identification · Key section extraction

**Output class:** Metadata (alt text, transcripts may auto-apply) / Draft (captions, descriptions require review)  
**Approval:** Alt text and technical metadata auto-apply with override option. Captions and public-facing descriptions require publisher review.

---

### Relationship Agent

**Responsibility:** Identify connections between entities that should be reflected in the Knowledge Graph.

**What it suggests:** This story mentions that business → create MENTIONS edge · This publisher attended this event → create ATTENDED edge · This course teaches this topic → create TEACHES edge · This business partners with that business → create PARTNERS_WITH edge

**Output class:** Relationship  
**Approval:** Low-confidence relationships surfaced for review. High-confidence relationships (publisher stated explicitly) applied automatically. All relationships visible to publisher in Knowledge Graph view (future).

**Used by:** Knowledge Engine (graph updates) · Partner Engine (recommendation matching) · Growth Engine (opportunity matching)

---

### Knowledge Graph Agent

**Responsibility:** Maintain and grow the Knowledge Graph.

**Actions:** Create new entity nodes · Match mentions to existing nodes (entity resolution) · Strengthen relationship edges · Apply relationship decay on stale edges · Flag conflicting relationships for review · Merge duplicate nodes when confirmed

**Output class:** Relationship / Automation  
**Approval:** Entity creation and relationship strengthening are automatic. Node merges and relationship rewrites flagged for admin review.

**Used by:** Knowledge Engine (primary consumer and producer)

---

### FAQ Agent

**Responsibility:** Extract questions and answers from content.

**What it finds:** Questions the content implicitly answers · Questions the publisher explicitly poses and answers · Common questions the topic raises · Structured Q&A pairs suitable for schema

**Output class:** Draft (FAQ entries require publisher confirmation)  
**Approval:** Suggested FAQs surfaced in publisher dashboard. Publisher approves before they become public.

**Used by:** Knowledge Engine · SEO Engine (FAQ schema) · GEO Engine (AI-readable Q&A)

---

### Topic Agent

**Responsibility:** Classify content by topic, industry, audience and format.

**What it produces:** Primary topic · Secondary topics · Relevant industries · Audience type · Content maturity (beginner / intermediate / advanced) · Content intent (tutorial / opinion / case study / news)

**Output class:** Metadata  
**Approval:** Auto-applied with review option. Publisher can always edit.

**Used by:** Publishing Engine · Knowledge Engine · Partner Engine · Growth Engine · Search Engine · SEO Engine

---

### SEO Agent

**Responsibility:** Optimise content for traditional search engine discovery.

**What it produces:** Page title (search-optimised) · Meta description · Canonical URL suggestion · Internal link suggestions (related stories to link to/from) · Schema type (Article, FAQPage, HowTo, BreadcrumbList) · JSON-LD markup · Keyword focus suggestion · Topic cluster position (hub vs. spoke)

**Output class:** Metadata (schema and internal links) / Draft (titles and descriptions for review)  
**Approval:** Schema and technical metadata auto-apply. Titles and descriptions surfaced for publisher review before adoption.

**Used by:** SEO Engine · Distribution Engine · Widget Engine

---

### GEO Agent

**Responsibility:** Optimise content for AI system discovery (Generative Engine Optimisation).

**What it produces:** Plain-language entity definition ("Who is this publisher?") · Relationship summary ("What do they publish about and who are they connected to?") · Citation-ready excerpt (the most quotable, factual passage from the story) · llms.txt entry suggestion · AI search metadata · Disambiguation notes (if entity shares name with another entity)

**Output class:** Metadata (AI-readable data is technical, not public copy)  
**Approval:** GEO outputs auto-apply. Publisher may review and override entity definitions.

**Used by:** GEO Engine · SEO Engine (overlap on structured data)

---

### Partner Agent

**Responsibility:** Detect brand mentions and identify recommendation opportunities.

**What it does:** Scans story content for entity mentions · Scores each mention for recommendation confidence · Matches entities to known Partners · Checks publisher eligibility for partner programs · Produces Recommendation candidates

**Output class:** Alert (recommendation suggestion surfaced in dashboard)  
**Approval:** Every recommendation requires explicit publisher approval. No recommendation is ever auto-applied.

**Used by:** Partner Engine · Recommendation Intelligence Engine

---

### Disclosure Agent

**Responsibility:** Ensure every monetised recommendation carries the correct disclosure.

**What it checks:** Are all approved affiliate recommendations disclosed? · Is the disclosure type appropriate for the relationship? · Is the disclosure text human-readable and accurate? · Does the disclosure appear before the affiliate link in the content?

**What it produces:** Disclosure text · Disclosure type recommendation · Alert if disclosure is missing · Block if disclosure cannot be applied

**Output class:** Alert / Automation (disclosure text generation is automatic; missing disclosure is an alert that blocks publishing)  
**Approval:** Disclosure text is auto-generated from the disclosure type selected by the publisher. The publisher's approval of the recommendation implicitly approves the disclosure.

**Used by:** Partner Engine · Publishing Engine

---

### Distribution Agent

**Responsibility:** Determine where published content should appear throughout the Village.

**What it suggests:** Featured placement recommendation · Related content suggestions · Profile page featuring recommendation · Village homepage positioning · Widget data inclusion · Partner page appearance

**Output class:** Metadata  
**Approval:** Featured placement recommendations surfaced for admin review. Standard distribution (profile page, story archive) automatic on publish.

**Used by:** Distribution Engine · Widget Engine

---

### Widget Agent

**Responsibility:** Determine what content should appear in publisher website widgets.

**What it produces:** Widget content selection (which stories to include) · Widget order (newest vs. most relevant) · Widget disclosure requirements (if recommendations appear in widget) · Widget category filtering recommendation

**Output class:** Automation / Metadata  
**Approval:** Widget content is automatic based on publisher settings. Changes to widget configuration require publisher action.

**Used by:** Widget Engine

---

### Analytics Agent

**Responsibility:** Interpret performance data and surface improvement recommendations.

**What it does:** Identifies top-performing content types and topics · Identifies underperforming content · Identifies recommendation click-through patterns · Identifies audience interest clusters · Generates plain-language insights ("Your video content gets 3× more clicks than blog posts")

**Output class:** Alert / Metadata  
**Approval:** Recommendations surfaced in dashboard. No automatic content changes.

**Used by:** Analytics Engine · Publishing Engine (improvement nudges) · Growth Engine (topic gap suggestions)

---

### Growth Agent

**Responsibility:** Identify and surface collaboration, partnership and discovery opportunities.

**What it suggests:** Publishers to connect with · Businesses to partner with · Events to speak at · Podcasts to appear on · Communities to join · Campaigns to apply for

**Output class:** Alert  
**Approval:** Opportunities surfaced in Growth Dashboard. Publisher always initiates the connection.

**Used by:** Growth Engine · Partner Engine

---

### Safety & Trust Agent

**Responsibility:** Identify risk, inaccuracy, missing disclosures and trust violations before they reach a public surface.

**What it checks:** Unsupported health, legal, or financial claims · Missing affiliate disclosures · Missing sponsorship disclosures · Private information inadvertently included · Content that could damage a publisher's credibility · False claims about a named person or business

**Output class:** Alert (flags for publisher review) / Block (stops publishing if critical issue found)  
**Approval:** Publisher reviews flagged issues before publishing. Critical issues block publishing until resolved.

**Used by:** Publishing Engine (pre-publish gate) · Partner Engine (disclosure compliance) · Disclosure Agent

---

## Inputs

The Orchestration Engine accepts:

| Input | Primary Agent(s) |
|---|---|
| Raw video file | Media Agent → Story Agent |
| Audio recording | Media Agent → Story Agent |
| Transcript (AI or human) | Story Agent → Insight Agent |
| Photos / camera roll | Media Agent → Story Agent |
| Canva publish payload | Format Agent → Story Agent → all downstream agents |
| Blog text | Story Agent → Insight Agent |
| Website import | Story Agent → Relationship Agent |
| Podcast transcript | Story Agent → FAQ Agent → Topic Agent |
| Documents | Media Agent → Story Agent |
| Social links | Format Agent → Story Agent |
| Publisher profile | Relationship Agent → Knowledge Graph Agent |
| Business profile | Relationship Agent → Knowledge Graph Agent |
| Past stories | Insight Agent (baseline for voice matching) |
| Library items | Knowledge Graph Agent (resource relationships) |
| Analytics data | Analytics Agent |
| Partner data | Partner Agent → Disclosure Agent |

---

## Outputs

The Orchestration Engine produces:

| Output | Class | Agent |
|---|---|---|
| Story draft | Draft | Story Agent |
| Summary | Draft | Insight Agent |
| Title | Draft | Story Agent / SEO Agent |
| Blog body | Draft | Story Agent |
| Caption | Draft | Story Agent / Media Agent |
| Reel structure | Draft | Format Agent → Story Agent |
| Carousel structure | Draft | Format Agent → Story Agent |
| Transcript | Metadata (auto) | Media Agent |
| Alt text | Metadata (auto) | Media Agent |
| Thumbnail suggestion | Metadata | Media Agent |
| FAQ | Draft | FAQ Agent |
| Idea | Metadata | Insight Agent |
| Topic | Metadata (auto) | Topic Agent |
| Internal links | Metadata | SEO Agent |
| Related content | Metadata | Relationship Agent |
| Schema / JSON-LD | Automation | SEO Agent |
| llms.txt content | Automation | GEO Agent |
| Partner suggestion | Alert | Partner Agent |
| Disclosure text | Automation | Disclosure Agent |
| Growth opportunity | Alert | Growth Agent |
| Widget suggestion | Automation | Widget Agent |
| Publishing health alert | Alert | Safety & Trust Agent |

---

## Approval Rules

### Always requires explicit Publisher approval:

- Story body (any public-facing copy)
- Blog text
- Captions and descriptions
- Public-facing claims about any named person or business
- Partner recommendations (affiliate, referral, sponsorship)
- Affiliate and referral links
- Disclosures on commercial content
- Business and founder profile descriptions
- Product and service claims

### May auto-apply (publisher can review and override):

- Topics and category tags
- Internal link suggestions
- Related story suggestions
- Featured placement (can also be a dashboard suggestion)
- FAQs (require confirmation before becoming public)
- SEO meta descriptions (applied, publisher notified to review)
- GEO entity summaries (applied, publisher can edit)
- Alt text on media (applied, reviewable in media manager)

### Auto-applies without publisher involvement:

- Technical metadata (file dimensions, duration, format detection)
- Timestamps
- Content type classification
- Search indexing (of already-published content)
- Analytics calculations
- Knowledge Graph relationship strengthening (for high-confidence, non-public relationships)

---

## Orchestration Workflows

### Workflow 1 — Canva Publish

```
Canva payload received via API
      │
      ▼
Format Agent → identifies slides, video, text layers
      │
      ▼
Media Agent → processes each slide, extracts text, suggests thumbnail
      │
      ▼
Story Agent → creates Story draft from all content
      │
      ▼
Insight Agent → extracts key ideas and lessons
      │
      ▼
Topic Agent → assigns topics and industry
      │
      ▼
Relationship Agent → identifies entity mentions
      │
      ▼
Partner Agent → scans for recommendation opportunities
      │
      ▼
SEO Agent → creates title, meta, schema
      │
      ▼
GEO Agent → creates AI-readable entity summary
      │
      ▼
Safety & Trust Agent → checks for risk
      │
      ▼
Publisher sees Story draft in Publishing Engine
Publisher reviews, edits, approves
      │
      ▼
Distribution Engine publishes
```

Publishing is never blocked while agents run. If agents haven't completed, publisher can still publish — agent outputs are added async and publisher can review them in their dashboard.

---

### Workflow 2 — Camera Roll Publish

```
Publisher uploads media from camera roll
      │
      ▼
Media Agent → analyses files (photo or video)
Identifies: people, places, activities, products visible
      │
      ▼
Publisher answers: "What happened?" (brief prompt)
      │
      ▼
Story Agent → creates draft using media context + publisher answer
      │
      ▼
Format Agent → suggests: photo story, reel, blog, or mixed
      │
      ▼
Insight Agent → extracts lesson or message
      │
      ▼
Topic Agent → assigns topics
      │
      ▼
Publisher reviews draft, edits, approves
      │
      ▼
Distribution Engine publishes
```

---

### Workflow 3 — Website Import

```
Publisher submits URL
      │
      ▼
Story Agent → extracts content from page
      │
      ▼
Format Agent → identifies: article, product page, resource, blog
      │
      ▼
Media Agent → extracts images, suggests featured image
      │
      ▼
Relationship Agent → identifies entity mentions in imported content
      │
      ▼
Topic Agent → assigns topics
      │
      ▼
SEO Agent → notes original URL, canonical guidance
      │
      ▼
GEO Agent → creates entity summary
      │
      ▼
Publisher reviews imported content, edits, approves before publish
```

All imported content starts as draft. Nothing auto-publishes from an import.

---

### Workflow 4 — Partner Recommendation

```
Story published
      │
      ▼
Partner Agent → scans content for brand mentions
      │
      ▼
Recommendation Intelligence Engine → confidence scoring + sentiment
      │
      ▼
Partner Agent → matches to Partner database
      │
      ▼
Disclosure Agent → prepares disclosure text for each match
      │
      ▼
Opportunity surfaces in Publisher Partner Centre
      │
      ▼
Publisher reviews suggestion
      │
      ├── Approved → Disclosure Agent confirms disclosure, Partner Engine tracks
      │
      └── Rejected → signal stored, suggestion not re-surfaced for this story
```

---

### Workflow 5 — Discoverability Health Check (Scheduled)

```
Scheduled trigger (weekly per publisher)
      │
      ▼
SEO Agent → reviews all published stories:
  Missing meta descriptions?
  Missing schema?
  Missing internal links?
      │
      ▼
GEO Agent → reviews entity definitions:
  Incomplete entity descriptions?
  Missing relationship context?
      │
      ▼
Relationship Agent → finds obvious missing links:
  Stories about the same topic not linked to each other?
      │
      ▼
Media Agent → checks for missing alt text
      │
      ▼
Disclosure Agent → checks for missing or expired disclosures
      │
      ▼
Safety & Trust Agent → checks for outdated claims or broken links
      │
      ▼
Dashboard → Publishing Health panel shows all issues found
Publisher acts on issues at their own pace
```

No content is automatically changed by this workflow. All findings are surfaced as suggestions.

---

## Memory & Learning

The AI Orchestration Engine learns from publisher behaviour over time.

**What it learns from:**

| Signal | Learned behaviour |
|---|---|
| Publisher accepts Story Agent draft with minimal edits | Draft quality high for this publisher — maintain current parameters |
| Publisher rewrites Story Agent draft significantly | Adjust tone, structure and vocabulary parameters for this publisher |
| Publisher rejects a topic suggestion | Decrease confidence for this topic pattern |
| Publisher consistently accepts Partner suggestions in one category | Increase confidence for that category with this publisher |
| Publisher's audience clicks heavily on certain content types | Growth Agent learns to prioritise those types in opportunity matching |
| Publisher edits GEO entity summary consistently | GEO Agent learns their preferred self-description |

**Critical constraints on learning:**

- Learning is per-publisher. One publisher's preferences do not influence another publisher's AI outputs.
- Learning must be reversible. Publishers can reset their AI preferences.
- Learning is transparent. Publishers can view what the AI has learned about them (future: AI preferences panel).
- Learning never overrides the publisher's direct instruction in the current session.

---

## Safety Rules — Non-Negotiable

These rules cannot be overridden by any configuration or future development:

1. **AI never publishes without publisher approval.** No AI agent has direct publish access. Every publish action requires an explicit publisher action.

2. **AI never invents lived experience.** If a publisher did not state something, the AI does not state it for them. Story Agent works with publisher-provided material, not imagination.

3. **AI never auto-inserts affiliate or referral links.** Affiliate links require explicit publisher approval through the Partner Engine flow.

4. **AI never publishes private information.** If the Media Agent detects personal information in an image (credit card, ID, private documents), it flags and blocks.

5. **AI never removes the publisher's voice.** Style and tone parameters exist to match the publisher, not replace them.

6. **AI never creates unsupported claims.** Safety & Trust Agent flags any claim that cannot be supported by the content the publisher provided.

7. **AI never misrepresents sponsorship.** Disclosure Agent ensures every commercial relationship is disclosed. If disclosure cannot be applied, publishing is blocked.

8. **AI never generates misleading medical, legal, or financial advice.** Safety & Trust Agent flags any content that crosses into professional advice territory.

---

## Engine Connections

| Engine | Connection |
|---|---|
| **Identity Engine** | Reads publisher and business profiles. Publisher preferences (voice, topics) stored here. |
| **Publishing Engine** | Primary destination for Story Agent drafts. Receives metadata from all agents. |
| **Knowledge Engine** | Knowledge Graph Agent writes relationships here. All agents read entity data from here. |
| **Partner Engine** | Partner Agent and Disclosure Agent feed recommendation candidates into this engine. |
| **Growth Engine** | Growth Agent feeds opportunity matches. Knowledge Graph data informs matching. |
| **Distribution Engine** | Distribution Agent informs where content surfaces. SEO metadata flows to this engine. |
| **Search Engine** | Topic Agent outputs feed search indexing. |
| **SEO Engine** | SEO Agent outputs (schema, meta, internal links) feed this engine directly. |
| **GEO Engine** | GEO Agent outputs (entity definitions, llms.txt) feed this engine directly. |
| **Analytics Engine** | Analytics Agent reads performance data from here and writes insight summaries back. |
| **Automation Engine** | Orchestration triggers Automation Engine for notifications when AI outputs are ready for review. |
| **Widget Engine** | Widget Agent determines widget content selection. |
| **Canva API** | Primary input source for Canva Publish workflow. |
| **Supabase** | All AI outputs that become structured data are persisted here. Drafts stored in publisher's draft queue. |

---

## Future Capabilities

| Capability | Description |
|---|---|
| **AI Publisher Assistant** | Conversational AI that helps publishers improve their content, find opportunities and understand their analytics |
| **AI Village Search** | Natural language search across all Village content and entities |
| **AI Opportunity Scout** | Proactive agent that finds and surfaces growth opportunities without being asked |
| **AI Partner Matcher** | Advanced entity understanding to find affiliate and referral matches beyond simple name detection |
| **AI SEO/GEO Coach** | Explains why content is or isn't discoverable and what to change |
| **AI Widget Curator** | Selects and arranges publisher website widget content based on audience behaviour |
| **AI Brand Intelligence Assistant** | Gives Village Pro Businesses insight into how their brand is perceived and discussed in the Village |
| **AI Podcast Guest Matcher** | Matches specific publishers to specific podcast needs |
| **AI Event Speaker Matcher** | Matches founder expertise to event programming needs |
| **AI Content Librarian** | Organises and connects all Library Items into a navigable knowledge resource |
| **AI Knowledge Graph Curator** | Continually refines the graph — resolving duplicates, strengthening connections, flagging gaps |
| **Autonomous Publishing Agents** | Future: agents that can draft, schedule and optimise content within publisher-set guardrails |

---

*This document defines the complete CULO AI Orchestration Engine before any implementation begins. It is the permanent architectural specification for how intelligence is coordinated across every engine in the platform.*
