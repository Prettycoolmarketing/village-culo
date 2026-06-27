# Part 2 — User Types & Permissions

> Every workflow, permission, automation and interface in CULO must reference the user types defined in this document.

---

## Contents

- [1. Overview](#1-overview)
- [2. Visitor](#2-visitor)
- [3. Publisher](#3-publisher)
- [4. Business](#4-business)
- [5. Agency](#5-agency)
- [6. Partner](#6-partner)
- [7. Platform](#7-platform)
- [8. Administrator](#8-administrator)
- [9. Future Roles](#9-future-roles)
- [10. Permission Philosophy](#10-permission-philosophy)
- [11. Relationships](#11-relationships)

---

## 1. Overview

CULO contains multiple user types. A person may hold more than one role simultaneously.

**Examples of multi-role users:**
- A founder may be both a Publisher (publishing knowledge) and a Business owner (representing their company)
- A speaker may be a Publisher and also sell products through the Library
- An agency may be a Publisher who manages Business profiles for clients
- A platform like Canva may be both a Platform and a Partner

Permissions are **role-based**, not account-based. Each role grants a specific set of capabilities. Where a user holds multiple roles, they hold the union of all capabilities across those roles.

No role should receive permissions it does not require.

---

## 2. Visitor

**Purpose:** Discover and consume published knowledge in the Village without an account.

Visitors are the primary audience for published content. The Village is publicly accessible. All published content should be discoverable by visitors without requiring registration.

### Capabilities

| Action | Allowed |
|--------|---------|
| Browse Village | ✅ |
| Read Stories and Blogs | ✅ |
| Browse Library | ✅ |
| Search Archive | ✅ |
| View Business profiles | ✅ |
| View Publisher profiles | ✅ |
| Read FAQs | ✅ |
| Explore Expertise areas | ✅ |
| View Talks | ✅ |
| View Ideas | ✅ |
| Click Library purchase links | ✅ |
| Click Service CTAs | ✅ |

### Cannot

- Publish any content
- Access Publisher Dashboard
- Comment (future feature)
- Edit any content
- Access administrative functions
- View draft or unapproved content

---

## 3. Publisher

**Purpose:** Create, manage and publish knowledge within CULO.

A Publisher is any person with an account who actively contributes knowledge to the Village. Publishers are the core of the ecosystem. Everything in CULO is designed to help Publishers share what they know.

### Capabilities

**Profile & Identity**
- Own a Publisher profile on the Village
- Set biography, expertise areas, topics, location
- Generate and embed Publisher Badge
- Connect personal website(s)

**Content Creation**
- Access CULO Creatives inside Canva
- Import raw material (video, audio, photos, text)
- Review and approve AI-generated outputs
- Publish content to Piazza and Village

**Content Management**
- Publish, edit, update and archive own content
- Manage Stories, Blogs, Ideas, FAQs, Expertise, Talks
- Manage Library items and digital products
- Manage Services and CTAs
- Manage Business profiles (if also a Business owner)

**Discovery & Analytics**
- View Publisher Dashboard
- View analytics for own content
- View Knowledge Score
- View Discoverability Score

**Monetisation**
- Sell products through Library
- Set affiliate links on products and resources
- Join Partner Program
- View partner earnings
- Connect payment methods

**Notifications**
- Receive notifications when content is published
- Receive Che CULO celebrations
- Receive activity feed updates

**Future**
- Book and manage speaking events
- Manage translations

---

## 4. Business

**Purpose:** Represent an organisation within the Village.

A Business is a distinct entity from its founder(s). A Business profile exists in the Village alongside — and connected to — the Publisher profiles of the people who built it.

One Publisher may own multiple Business profiles. One Business may be connected to multiple Publishers.

### Capabilities

**Profile & Identity**
- Business profile page on the Village
- Business name, description, category, location
- Logo and cover image
- Website URL and social links
- CTA buttons (book, enquire, buy, visit)

**Content**
- Services listing
- Products and Library items
- Case studies and testimonials
- FAQs
- Events and talks
- Stories linked from Publisher profiles

**Team**
- Connect multiple Publisher profiles as team members or founders
- Define roles within the business (founder, employee, collaborator)

**Monetisation**
- Affiliate settings for products and services
- Partner links
- Marketplace integration (Library)

---

## 5. Agency

**Purpose:** Manage publishing and content operations across multiple businesses and Publishers.

Agencies are Publishers who manage content on behalf of clients. An agency account inherits all Publisher capabilities and adds team and client management layers.

### Capabilities

All Publisher capabilities, plus:

**Client Management**
- Manage multiple Business profiles under one agency account
- Assign team members to specific client accounts
- Set client-specific permissions (what team members can and cannot do for each client)

**Publishing Workflows**
- Submit content for client approval before publishing
- Manage approval queues for multiple clients
- View publishing status across all client accounts

**Shared Resources**
- Shared Library across clients (with privacy controls)
- Shared content templates
- Shared analytics across client portfolio

**Reporting**
- Combined analytics across all managed clients
- Per-client performance breakdowns
- Team activity logs

---

## 6. Partner

**Purpose:** Commercial partnerships — affiliate programs, referral networks and sponsored integrations.

Partners earn revenue by referring Publishers, products or services to the CULO ecosystem. Partners may be individuals, businesses or platforms.

### Capabilities

**Affiliate & Referral**
- Unique affiliate links for CULO subscriptions and products
- Partner dashboard with click, conversion and earnings reporting
- Referral program access

**Campaigns**
- Create partner campaigns tied to specific products or periods
- Sponsored resources within the Library (clearly labelled)
- Marketplace integration (products visible within Village under partner category)

**Revenue**
- Revenue reporting and payout management
- Earnings history
- Performance benchmarks

**Key constraint:** All sponsored or affiliated content within the Village must be clearly labelled as such. Partner relationships must never distort organic discovery results.

---

## 7. Platform

**Purpose:** Represent software platforms and ecosystems that integrate with CULO or are referenced within the Village.

Platforms are distinct from Partners (though a Platform may also be a Partner). A Platform entity exists in the Village as a discoverable object — it has a profile, resources and connections to the Publishers and businesses that use it.

**Current examples:** Canva, Systeme.io, Sellable AI

### Capabilities

**Profile**
- Platform profile page in the Village
- Platform name, description, category, website
- Integration documentation (if applicable)
- Help resources and FAQs

**Connections**
- Connected Publisher profiles (Publishers who use the platform)
- Connected Business profiles (businesses built on the platform)
- Related stories, ideas and resources that reference the platform

**Partner Layer** *(if Platform is also a Partner)*
- Affiliate links
- Referral programs
- Co-marketing resources in Library

---

## 8. Administrator

**Purpose:** Manage, curate and maintain the health of the CULO ecosystem.

Administrators have access to all areas of the platform. Administrator accounts should be strictly limited in number. All administrative actions should be logged.

### Capabilities

All capabilities across all roles, plus:

**Moderation**
- Review and moderate reported content
- Archive or remove content that violates community standards
- Issue warnings or suspend Publisher accounts

**Curation**
- Feature content on Village homepage and hub pages
- Curate topic hub pages
- Manage editorial selections

**Taxonomy**
- Create and manage Topics
- Create and manage Expertise areas
- Create and manage Communities
- Create and manage Locations
- Create and manage Industry categories

**Verification**
- Verify Business profiles
- Verify Publisher credentials
- Manage Platform partner status

**Platform Management**
- Manage Partner accounts and commission structures
- Manage affiliate programs
- Manage marketplace listings

**Knowledge Graph**
- View and edit all entity relationships
- Resolve graph conflicts or orphaned entities
- Run graph integrity checks

**Site Settings**
- Feature flags
- Email templates
- Notification settings
- Automation rules
- Integration settings

**Logs**
- View all publishing logs
- View all administrative action logs
- View all automation logs

---

## 9. Future Roles

The following roles are reserved for future expansion. They are not yet implemented but are documented here to ensure the permission model is designed with them in mind.

| Role | Purpose |
|------|---------|
| **Moderator** | Community moderation without full administrative access |
| **Editor** | Review and suggest edits to Publisher content (with Publisher approval) |
| **Community Leader** | Facilitate and manage specific community groups |
| **Reviewer** | Verify and review Library products before listing |
| **Translator** | Provide verified translations of published content |
| **Event Host** | Manage and publish live or virtual events |
| **Marketplace Seller** | Sell physical products through a dedicated marketplace layer |
| **Recruiter** | Post opportunities connected to Publisher expertise |
| **Organisation** | Non-profit or institutional profile (separate from Business) |
| **University** | Educational institution profile with course and resource integration |
| **Government** | Government or council profile for public interest publishing |

---

## 10. Permission Philosophy

All permission decisions in CULO follow these principles:

**1. Least privilege**
Each role receives only the permissions required for its purpose. A Visitor does not need publishing access. A Publisher does not need administrative access. Roles do not inherit permissions from other roles unless explicitly combined.

**2. Publisher ownership**
A Publisher always has full control over their own content. No other role — including Administrator — should modify or remove a Publisher's content without the Publisher's knowledge, except in cases of clear community standards violation (which should remain auditable).

**3. Business ownership**
The Publisher who creates a Business profile owns it by default. Ownership may be transferred. Multiple owners may be assigned.

**4. Transparent administration**
All administrative actions should be logged and traceable. Administrators should not be able to take anonymous actions that affect Publisher accounts.

**5. Role-based access**
Permissions are attached to roles, not to individual accounts. Changing a user's role changes their access. No ad-hoc permission grants outside the role system.

**6. Future scalability**
The permission model should accommodate the future roles listed in Section 9 without requiring a rebuild. The model should be additive, not replaced.

---

## 11. Relationships

User types do not exist in isolation. The following diagram shows how they connect within the CULO ecosystem.

```
Publisher
    │
    ├── owns ──────────────── Business(es)
    │                              │
    │                              ├── Services
    │                              ├── Products / Library
    │                              ├── FAQs
    │                              └── Events
    │
    ├── publishes ─────────── Stories
    │                         Ideas
    │                         FAQs
    │                         Talks
    │                         Expertise
    │
    ├── sells ──────────────── Library Items
    │                         Workshops
    │                         Courses
    │
    ├── belongs to ─────────── Communities
    │                         Platforms
    │
    └── earns through ──────── Partner Program
                              Affiliate Links
                              Library Sales

Agency
    │
    └── manages ────────────── Publisher(s)
                               Business(es)
                               Publishing Workflows

Partner
    │
    └── connects to ─────────── Products
                                Subscriptions
                                Campaigns

Platform
    │
    └── connects to ─────────── Publisher(s)
                                Business(es)
                                Resources

Administrator
    │
    └── manages ────────────── Everything
```

### Key relationship rules

- One Publisher may own many Businesses
- One Business may be connected to many Publishers
- One Agency may manage many Publishers and Businesses
- One Publisher may belong to many Communities
- One Platform may connect to many Publishers and Businesses
- All relationships are bidirectional — if a Story connects to a Business, that Business page also surfaces the Story

---

*← [Part 1 — Platform Overview](./01-platform-overview.md) · [Blueprint Index](./README.md) · Next: [Part 3 — Publisher Workflow](./03-publisher-workflow.md) →*
