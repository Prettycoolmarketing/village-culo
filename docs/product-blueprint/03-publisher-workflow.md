# Part 3 — Publisher Workflow

> This document defines the complete publishing lifecycle inside CULO.
> Every future publishing feature must follow this workflow.

---

## Contents

- [1. Overview](#1-overview)
- [2. Capture](#2-capture)
- [3. Organise](#3-organise)
- [4. Shape](#4-shape)
- [5. Review & Approval](#5-review--approval)
- [6. Publish](#6-publish)
- [7. Distribution](#7-distribution)
- [8. Notifications](#8-notifications)
- [9. Analytics](#9-analytics)
- [10. Continuous Improvement](#10-continuous-improvement)
- [11. Automation Rules](#11-automation-rules)
- [12. Workflow Principles](#12-workflow-principles)

---

## 1. Overview

Publishing begins with a real experience. It ends with connected, discoverable knowledge.

Publishing is not a single action. It is a complete workflow — one that CULO should make as effortless as possible while never compromising the Publisher's ownership over what goes live.

### Complete publishing lifecycle

```
Experience
    │
    ▼
Capture         ← Raw material enters CULO
    │
    ▼
Organise        ← AI analyses and structures content
    │
    ▼
Shape           ← Publisher selects desired outputs
    │
    ▼
Approve         ← Publisher reviews and approves each output
    │
    ▼
Publish         ← Approved content publishes to Village via Piazza
    │
    ▼
Distribute      ← Content pushed to selected destinations
    │
    ▼
Connect         ← Knowledge graph updated with relationships
    │
    ▼
Discover        ← Content becomes findable via search, AI, Village
    │
    ▼
Measure         ← Analytics updated in Publisher Dashboard
    │
    ▼
Improve         ← Publisher refines, expands or archives based on performance
```

The workflow should feel simple at the surface regardless of how much is happening underneath.

---

## 2. Capture

A Publisher begins by importing raw material into CULO Creatives (inside Canva). Capture should never restrict what a Publisher can bring — if they made it, CULO should be able to work with it.

### Accepted input types

**Video**
- Talking head footage (face to camera)
- Voice over recordings (narration without face)
- Vlog footage (behind-the-scenes, on-location)
- B-roll footage (supporting visuals, no speaker)

**Audio**
- Voice memos
- Podcast recordings
- Interview recordings

**Written**
- Journal or notes
- Draft blog post
- Existing article or essay
- Book chapter
- Presentation outline
- Workshop notes

**Photos**
- Product photography
- Behind-the-scenes stills
- Event photography
- Portrait or headshot

**Imports** *(future integrations)*
- Imported website URL
- YouTube video
- LinkedIn article
- Instagram post or reel
- Podcast episode
- PDF document

### Capture rules

- No minimum quality threshold for capture — CULO should work with what the Publisher has
- No format should be excluded because it seems too informal
- The best content often comes from the most casual capture

---

## 3. Organise

After capture, CULO's AI engine analyses the source material and builds a structured model of what it contains. Nothing is published at this stage. Everything is editable before the Publisher moves forward.

### What the AI identifies

| Category | Examples |
|----------|---------|
| **Content type** | Story, idea, FAQ, how-to, behind-the-scenes, case study |
| **Topics** | Based on CULO taxonomy |
| **People mentioned** | Publisher, team members, collaborators, clients |
| **Businesses mentioned** | Own businesses, partner businesses, platforms |
| **Products or services mentioned** | Library items, services offered |
| **Locations** | City, region, country |
| **Expertise areas** | Skills and knowledge domains demonstrated |
| **Questions implied** | Content that answers a question (for FAQ extraction) |
| **Ideas embedded** | Quotable insights and principles |
| **Media** | Which media files match which parts of the content |
| **Suggested relationships** | Related existing stories, ideas, Library items |

### Organise rules

- All analysis is presented as suggestions, not decisions
- The Publisher sees the full analysis and can correct any misidentification
- No connections are written to the knowledge graph until after approval
- AI confidence levels should be visible where relevant

---

## 4. Shape

The Publisher reviews the organised content and selects which outputs to produce. One piece of source material can generate multiple distinct outputs.

### Available output types

| Output | Description |
|--------|-------------|
| **Talking Head Reel** | Face-to-camera video with on-screen hook text and subtitles |
| **Voice Over Reel** | Scripted narration over B-roll, photos or graphics |
| **Vlog Reel** | Quick-cut behind-the-scenes footage with minimal text |
| **Carousel** | Multi-slide layout with copy, designed in Canva |
| **Blog Post** | Long-form, SEO-structured written article |
| **Caption** | Standalone caption for any social platform |
| **FAQ** | Question-and-answer pair extracted from content |
| **Idea** | A quotable principle or insight extracted from content |
| **Case Study** | Structured narrative of a client or project outcome |
| **Library Item** | Resource, guide or product derived from content |
| **Newsletter** | Email-formatted version of content *(future)* |
| **LinkedIn Post** | Platform-formatted written post *(future)* |
| **Talk** | Event talk entry derived from a speaking engagement |

### Shape rules

- The Publisher selects which outputs to generate — they are never forced on them
- AI should suggest the most appropriate outputs based on content type
- A Publisher may choose to produce only one output or all available outputs
- Each output should be independently editable before approval

---

## 5. Review & Approval

No content is published without explicit Publisher review and approval. This is a non-negotiable rule.

### What the Publisher reviews for each output

| Element | Review required |
|---------|----------------|
| Headline or hook | ✅ |
| Body copy or script | ✅ |
| Caption | ✅ |
| Media selection | ✅ |
| Relationship connections (Stories, Ideas, Businesses) | ✅ |
| Call to action and URL | ✅ |
| Affiliate or partner links | ✅ |
| SEO metadata (title, description) | ✅ |
| Accessibility data (alt text, subtitles, transcript) | ✅ |
| Publishing destination(s) | ✅ |

### Approval rules

- The Publisher must take an explicit action to publish — no silent auto-publish
- Individual outputs may be approved independently (publish reel without blog, etc.)
- Draft outputs may be saved and returned to later
- Rejected outputs may be regenerated with revised parameters
- All approval actions are logged in Piazza with timestamp

---

## 6. Publish

When a Publisher approves and publishes, CULO creates or updates the following automatically. See [Part 4 — Knowledge Engine](./04-knowledge-engine.md) for full detail on what happens after publish.

### What publishing creates or updates

| Object | Action |
|--------|--------|
| Story / Blog | Created |
| Ideas | Extracted and created |
| FAQs | Extracted and created |
| Expertise areas | Updated |
| Publisher profile | Updated |
| Business profile(s) | Updated |
| Library | Updated if applicable |
| Search index | Updated |
| Knowledge graph relationships | Created or updated |
| Publisher Dashboard | Updated |
| Website widget | Updated if connected |

### Publish rules

- Publishing should complete within a reasonable processing time — the Publisher should not wait
- Every published object receives a permanent URL
- All published objects default to publicly discoverable unless the Publisher explicitly sets otherwise
- Publishing is logged with timestamp, Publisher ID and content ID

---

## 7. Distribution

After publishing to the Village, the Publisher chooses which additional destinations receive the content.

### Distribution destinations

**Owned**
- Village (default, always)
- Connected website (via widget or direct integration)

**Social** *(future integrations)*
- Instagram
- TikTok
- LinkedIn
- Facebook
- Pinterest
- YouTube

**Email** *(future)*
- Newsletter list (via integrated email platform)
- Systeme.io sequences

**Third-party** *(future)*
- Podcast platform
- Medium or Substack
- Press release syndication

### Distribution rules

- Village is always the primary destination — it cannot be deselected
- Social distribution sends the content but does not replicate the Village page — the Village remains the source of truth
- Publisher Badge and Village URL should accompany every distribution wherever possible
- Distribution history is logged in Piazza

---

## 8. Notifications

Publishing triggers activity across the CULO ecosystem.

### Notification types

| Notification | Recipient | Trigger |
|-------------|-----------|---------|
| **Che CULO!** celebration | Publisher | Every successful publish |
| Activity Feed update | Village visitors | New content from followed Publishers |
| Business profile update | Business followers | Content connected to a Business |
| Related Publisher notification | Connected Publishers | Content that references their work |
| Community notification | Community members | Content published by a community member |
| Website widget refresh | Website visitors | New content triggers widget update |

### Notification principles

- Notifications should celebrate contribution, not create pressure to post more
- Volume of notifications should be manageable — no spam
- All notifications should be opt-out configurable by the recipient
- Future: follower notifications when a Publisher they follow publishes

---

## 9. Analytics

Every published piece of content generates analytics. The Publisher Dashboard surfaces these in meaningful, actionable form.

### Metrics tracked

| Metric | What it measures |
|--------|-----------------|
| **Views** | Times content page was loaded |
| **Reads / watch time** | Engagement depth — did they stay? |
| **Search discovery** | Times found via Village or Google search |
| **AI discovery** | Times surfaced via AI assistant queries |
| **Website clicks** | Traffic sent to Publisher website or service CTAs |
| **Library sales** | Products purchased via Library listings |
| **Workshop bookings** | Bookings via Workshop listings |
| **Partner earnings** | Revenue from affiliate and referral activity |
| **Knowledge Score** | Depth and breadth of published knowledge |
| **Discoverability Score** | How findable the Publisher's work is |
| **Publisher Badge clicks** | Clicks from Publisher Badge on external sites |

### Analytics principles

- Analytics should measure long-term value, not short-term engagement
- Vanity metrics (raw impressions, follower counts) should be deprioritised
- Knowledge Score and Discoverability Score are the primary performance indicators
- All analytics data remains the property of the Publisher

---

## 10. Continuous Improvement

Publishing is never permanently finished. Knowledge should evolve with the Publisher.

### Post-publish actions available

| Action | Purpose |
|--------|---------|
| **Update** | Revise content as knowledge evolves |
| **Expand** | Add additional related content (new stories, FAQs, ideas) |
| **Archive** | Remove from public discovery while preserving the record |
| **Republish** | Re-surface older content with updated context |
| **Connect additional resources** | Link new Library items, services or products |
| **Improve accessibility** | Add or improve subtitles, alt text, transcripts |
| **Add translations** | Publish content in additional languages |
| **Update products** | Revise pricing, availability or links |
| **Add new FAQs** | Answer questions that have emerged since original publication |

### Improvement rules

- Updates are versioned — prior versions are preserved in the publishing log
- Archiving removes content from public discovery but does not delete it
- All improvements are logged in Piazza
- Improvements should automatically update the knowledge graph

---

## 11. Automation Rules

Every automation within the CULO publishing workflow must satisfy all of the following criteria:

| Rule | Requirement |
|------|------------|
| **Save time** | The automation must measurably reduce Publisher effort |
| **Protect authenticity** | The automation must not alter the Publisher's voice or message without their knowledge |
| **Require approval** | Any automation that produces content visible to the public requires Publisher approval before execution |
| **Maintain relationships** | Automations must update knowledge graph relationships — never create isolated objects |
| **Improve discoverability** | Automations should strengthen search and AI discoverability |
| **Preserve ownership** | Automations must never take action on a Publisher's content in a way the Publisher has not authorised |
| **Strengthen the knowledge graph** | Every automated action should leave the knowledge graph more complete and connected than before |
| **Never prioritise automation over trust** | If an automation could compromise the quality or integrity of the Village, it should not run |

---

## 12. Workflow Principles

Every publishing workflow, current and future, should follow these principles:

| Principle | Implementation |
|-----------|---------------|
| **One experience, many outputs** | A single video should be able to become a reel, a carousel, a blog and a set of FAQs |
| **Publishing creates permanent assets** | Every publication receives a permanent URL and remains discoverable |
| **Knowledge compounds** | Each new publication strengthens the discoverability of everything already published |
| **Humans approve** | No content goes live without an explicit Publisher decision |
| **AI assists** | AI handles analysis, generation and relationship suggestions — not publishing decisions |
| **Relationships matter** | Every new object is connected to the knowledge graph on creation |
| **Publishing becomes easier over time** | The workflow should get faster as CULO learns the Publisher's preferences and knowledge base |

The workflow should remain simple regardless of how powerful the underlying engine becomes. A Publisher should be able to go from raw footage to published content without ever feeling like they're using complex software.

---

*← [Part 2 — User Types](./02-user-types.md) · [Blueprint Index](./README.md) · Next: [Part 4 — Knowledge Engine](./04-knowledge-engine.md) →*
