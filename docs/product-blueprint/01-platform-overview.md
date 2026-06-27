# Part 1 — Platform Overview

> This document is the executive overview of CULO. Every future Blueprint chapter references it.
> Read this first before reading any other implementation document.

---

## Contents

- [1. Vision](#1-vision)
- [2. Core Products](#2-core-products)
- [3. Core Users](#3-core-users)
- [4. Core Principles](#4-core-principles)
- [5. Platform Structure](#5-platform-structure)
- [6. Publishing Flow](#6-publishing-flow)
- [7. Documentation Structure](#7-documentation-structure)

---

## 1. Vision

CULO is a publishing ecosystem that transforms lived experience into connected, discoverable knowledge.

It exists to close the gap between what people know and what they are able to share. Most people carry expertise, stories and perspective that could help others. Most of that knowledge disappears because the tools required to publish it are either too complex, too time-consuming, or optimised for the wrong goal.

CULO addresses that gap in three ways:

- **AI-assisted creation** — reducing the effort required to turn raw experience into structured content
- **Permanent publishing** — ensuring knowledge remains discoverable long after it is first created
- **Connected knowledge** — organising every publication into a graph of relationships so that finding one thing leads to finding more

Publishing should become effortless. Knowledge should become permanent.

---

## 2. Core Products

### CULO Creatives

**Type:** AI publishing workspace  
**Location:** Inside Canva (Canva App)  
**Status:** Live

CULO Creatives is the content creation and approval environment. Publishers import raw material — video footage, voice recordings, photos, written drafts — and CULO's AI engine analyses the content, generates structured outputs across multiple formats, and presents them for Publisher review and approval.

**Purpose:**
- Create content from raw footage, ideas and experiences
- Edit and refine AI-generated outputs
- Approve content before it moves to publishing
- Publish directly to Piazza and onward to the Village

**Outputs produced:**
- Talking Head Reels (with hooks, subtitles, captions)
- Voice Over Reels (scripted narration over B-roll or photos)
- Vlog Reels (quick-cut behind-the-scenes footage)
- Carousels (slide-by-slide layout with copy)
- Blog Posts (long-form, SEO-structured)
- Captions (standalone, for all formats)

**Key constraint:** Nothing is ever published without explicit Publisher approval. AI proposes. Publisher decides.

---

### Village

**Type:** Public publishing ecosystem  
**Location:** Web (village.culo.com or equivalent)  
**Status:** Live (prototype)

The Village is the public-facing layer of CULO. It is where published knowledge lives, is discovered and is explored. It is not a social feed. It is a structured knowledge ecosystem where every Publisher, business, story, idea, service, resource and expertise area exists in relationship with the others.

**Purpose:**
- Discovery: helping people find knowledge, Publishers and businesses
- Search: full-text and structured search across all content types
- Trust: presenting Publisher knowledge in a way that builds credibility
- Authority: demonstrating depth and expertise through connected work
- Knowledge Graph: making visible the relationships between all content

**Key pages:**
- Publisher profile
- Business profile
- Story / Blog
- Idea
- FAQ
- Service
- Library item
- Talk
- Expertise area
- Topic hub
- Community page
- Location page

---

### Piazza

**Type:** Publishing gateway  
**Location:** Publisher Dashboard (web)  
**Status:** Planned

Piazza is the internal publishing control centre. It sits between content creation (CULO Creatives) and public publication (Village). Publishers use Piazza to review drafts, manage publishing schedules, view publishing history, and approve automated publishing actions.

**Purpose:**
- Manual publishing of all content types
- Draft management and version history
- Publishing approvals (for agency and team workflows)
- Future: scheduled and automated publishing
- Audit log of all publishing actions

**Key constraint:** All publishing — including future automated publishing — must pass through Piazza and maintain an auditable record.

---

### Library

**Type:** Resource and product marketplace  
**Location:** Village (public) + Publisher Dashboard (management)  
**Status:** Live (prototype)

The Library is where Publishers sell or share products, resources, templates, courses, books and workshops. It is part of the Village and discoverable alongside all other content. Library items are connected to the Publisher's knowledge graph — a book on storytelling links to the Publisher's stories and expertise.

**Purpose:**
- Resources: guides, frameworks, checklists, playbooks
- Books: physical and digital
- Digital products: templates, prompt packs, toolkits
- Courses and programs: structured learning, online or in-person
- Workshops: bookable events
- Downloads: PDFs, assets, files

---

### Publisher Dashboard

**Type:** Analytics and management interface  
**Location:** Web (authenticated)  
**Status:** Planned

The Publisher Dashboard is the private management interface for each Publisher. It surfaces data and settings relevant to the Publisher's body of work and performance within the Village.

**Components:**
- **Analytics:** views, reads, watch time, discovery sources, search rankings
- **Publisher Badge:** embeddable badge showing Publisher status and Village link
- **Knowledge Score:** a measure of depth and breadth of published knowledge
- **Discoverability Score:** a measure of how findable the Publisher's knowledge is
- **Partner earnings:** referral revenue, affiliate commissions
- **Publishing statistics:** total publications, formats used, publishing frequency
- **Connected websites:** websites displaying Publisher Badge or Village widget

---

## 3. Core Users

See [Part 2 — User Types](./02-user-types.md) for full detail.

| User Type | Primary Purpose |
|-----------|----------------|
| **Visitor** | Discover and consume published knowledge |
| **Publisher** | Create, approve and publish knowledge |
| **Business** | Represent an organisation within the Village |
| **Agency** | Manage multiple Publishers and brands |
| **Partner** | Affiliate and referral programs, platform integrations |
| **Platform** | Represent software ecosystems (Canva, Systeme.io, etc.) |
| **Administrator** | Manage and curate the ecosystem |

A single person may hold multiple roles. A founder may be both a Publisher and a Business owner. An agency owner may be a Publisher who also manages Business profiles for clients.

---

## 4. Core Principles

These principles are derived from the [CULO Constitution](../constitution/) and translated into practical product decisions. They should govern every feature built within CULO.

| Principle | What it means in practice |
|-----------|--------------------------|
| **Publish Once. Discover Forever.** | One piece of content should be discoverable across time, formats, search and AI — not just at the moment of posting |
| **AI assists. Humans publish.** | AI generates, organises and suggests. Publishers approve and publish. Nothing goes live without explicit human decision |
| **Knowledge compounds.** | Every new publication should increase the discoverability and value of existing work |
| **Relationships matter.** | Every content object connects to related objects. Isolation is a bug, not a feature |
| **Community over competition.** | Discovery should benefit everyone in the Village, not create zero-sum competition for visibility |
| **Trust over growth.** | No feature should compromise the quality or integrity of the Village in exchange for user numbers or revenue |
| **Accessibility by default.** | Subtitles, alt text, transcripts and readable structure are requirements, not enhancements |
| **Ownership is absolute.** | Publishers own their knowledge. CULO hosts it. Publishers can always export or remove it |
| **Revenue rewards contribution.** | Visibility and commercial opportunity within the Village should reflect the quality and depth of knowledge contributed, not the size of commercial investment |

---

## 5. Platform Structure

The following shows how the core products connect in the flow of knowledge from creation to discovery.

```
CULO Creatives (Canva App)
        │
        │  [Publisher creates and approves content]
        ▼
      Piazza
        │
        │  [Content published to Village]
        ▼
  Knowledge Graph
        │
        │  [Relationships built and updated]
        ▼
      Village
        │
        │  [Public discovery]
        ▼
     Discovery
   ┌────┼────┐
Search  AI  Village Browser
        │
        │  [Performance data returned]
        ▼
Publisher Dashboard
        │
        │  [Analytics, scores, earnings, badges]
        ▼
    Improvement
```

Every layer feeds the next. Publishing creates knowledge. Knowledge creates relationships. Relationships create discovery. Discovery creates opportunity. Opportunity rewards contribution.

---

## 6. Publishing Flow

The following is a high-level summary. Part 3 — Publisher Workflow defines each stage in full.

| Stage | What happens |
|-------|-------------|
| **Create** | Publisher captures raw material — video, audio, text, photos — in CULO Creatives |
| **Approve** | Publisher reviews AI-generated outputs and approves what should be published |
| **Publish** | Approved content is published to Village via Piazza |
| **Distribute** | Content is distributed to selected destinations: Village, website widget, social platforms |
| **Connect** | Published content is connected to related objects in the knowledge graph |
| **Discover** | Content becomes findable through Village search, Google, and AI systems |
| **Measure** | Publisher Dashboard reports on discoverability and performance |
| **Improve** | Publisher updates, expands or archives content based on performance and evolution of knowledge |

---

## 7. Documentation Structure

This Product Blueprint is divided into 13 implementation chapters. Each chapter covers a specific area of the CULO platform in detail.

| Chapter | Focus |
|---------|-------|
| 01 — Platform Overview | This document. Executive summary of CULO |
| 02 — User Types | Every user role and their permissions |
| 03 — Publisher Workflow | The complete publishing lifecycle |
| 04 — Knowledge Graph | Data model and entity relationship structure |
| 05 — CULO Creatives | AI workspace inside Canva |
| 06 — Village | Public ecosystem, pages and discovery |
| 07 — Piazza | Publishing gateway and approval system |
| 08 — Library | Resources, products and marketplace |
| 09 — Partner Network | Affiliates, referrals and integrations |
| 10 — Monetisation | Pricing, earnings and commercial model |
| 11 — Automations | Automation rules, triggers and guardrails |
| 12 — Business Rules | Commercial rules and policies |
| 13 — API & Data Model | API structure, schemas and contracts |

Every chapter in the Blueprint should be read alongside the [CULO Constitution](../constitution/). Where implementation decisions conflict with the Constitution, the Constitution takes precedence and the conflict should be documented before any change is made.

---

*← [Blueprint Index](./README.md) · Next: [Part 2 — User Types](./02-user-types.md) →*
