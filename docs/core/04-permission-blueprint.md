# CULO Operating System — Permission Blueprint

**Version:** 1.0  
**Status:** Core Specification — Foundational  
**Scope:** Every engine, entity, dashboard, API and AI agent in CULO  
**References:** `docs/core/01-entity-blueprint.md`, `docs/core/02-lifecycle-blueprint.md`, `docs/ARCHITECTURE_INDEX.md`

---

## Philosophy

Ownership is explicit. Every entity has a named owner, and only the owner can decide what happens to it.

Permissions are inherited. A publisher who owns a Business inherits permission to manage everything that Business owns.

Trust is earned. More capability is unlocked as publishers verify their identity, build their track record, and earn platform trust — not purchased.

Visibility is intentional. An entity is never visible to more people than its owner chose. Default states are restrictive. Publishers opt into broader visibility.

AI never owns content. An AI agent may suggest, draft, classify and analyse — but ownership always belongs to the human.

Automation never overrides ownership. Scheduled automations and system processes act within the same permission boundary as the owner they serve. They cannot elevate their own authority.

The Publisher always owns their knowledge. CULO may host, index, and distribute content — but the Publisher retains ownership. Data portability is a right, not a feature.

---

## Global Role Hierarchy

Roles are cumulative — each role inherits all capabilities of the roles below it.

```
Platform Owner
      │ (all permissions)
      ▼
Administrator
      │ (all permissions except billing changes)
      ▼
Moderator
      │ (content review, feature, remove — no data access)
      ▼
Village Pro Business Owner / Village Pro Publisher
      │ (full access to own entities + Partner Engine)
      ▼
Business Owner / Publisher
      │ (full access to own entities)
      ▼
Editor (future — team accounts)
      │ (edit owned entities, cannot publish or delete)
      ▼
Contributor (future)
      │ (create and save drafts only)
      ▼
Viewer (future)
      │ (read-only access to shared resources)
      ▼
Registered User
      │ (account exists, no content yet)
      ▼
Anonymous Visitor
        (public content only)
```

---

## Global Role Definitions

### Anonymous Visitor

**Purpose:** Anyone browsing CULO without an account.

**Can:** Read all `public` + `visibility = public` entities, view the Village, click CTAs, view partner links.  
**Cannot:** Create content, save anything, interact with Partner Engine, access dashboards.  
**Sees:** Public stories, public founder profiles, public business profiles, Partner Directory (future).

---

### Registered User

**Purpose:** Has created a CULO account but has not completed onboarding.

**Can:** Complete onboarding, sign in, access account settings.  
**Cannot:** Publish content, access dashboards beyond onboarding, participate in Partner Engine.  
**Transition to Publisher:** On onboarding completion.

---

### Publisher

**Purpose:** A founder with a CULO account who creates content and manages a profile.

**Can:** Create and publish Stories, manage their Founder profile, manage their Business profiles, manage their Library, manage their Services, participate in Partner Engine (if enabled), access their dashboard.  
**Cannot:** Feature their own content, verify their own account, access other publishers' content, access admin tools.

---

### Verified Publisher

**Purpose:** A Publisher whose identity has been confirmed by CULO.

**Inherits:** All Publisher permissions.  
**Additional:** Verified badge on profile, boosted in search and recommendation matching, higher default trust score in Partner Engine.

---

### Village Pro Publisher

**Purpose:** A Publisher with an active CULO Creatives membership.

**Inherits:** All Verified Publisher permissions (if verified; otherwise all Publisher permissions).  
**Additional:** Full Partner Centre access, Growth Dashboard, advanced analytics, campaign participation, priority recommendation matching.

---

### Business Owner

**Purpose:** The Publisher who owns a specific Business profile.

**Inherits:** All Publisher permissions, applied to their Business entities.  
**Additional:** Manage Business profile, manage Services, manage Campaigns (if Village Pro), manage Partner Programs (if Village Pro).

---

### Village Pro Business

**Purpose:** A Business with Village Pro active.

**Inherits:** All Business Owner permissions.  
**Additional:** Village Pro Business Centre, partner discovery, campaign creation, recommendation analytics, publisher network view.

---

### Editor (Future — Team Accounts)

**Purpose:** A team member with permission to edit content but not publish.

**Can:** Edit assigned Stories, Library Items, Business profile fields.  
**Cannot:** Publish, archive, delete, manage permissions, access analytics.

---

### Contributor (Future)

**Purpose:** A team member who can draft content.

**Can:** Create and save drafts. Cannot edit published content.  
**Cannot:** Publish, delete, access analytics, manage anything.

---

### Viewer (Future)

**Purpose:** A team member with read-only access to shared content.

**Can:** View all content owned by the organisation.  
**Cannot:** Create, edit, publish, delete, manage anything.

---

### Moderator

**Purpose:** A CULO staff member responsible for content review.

**Can:** Read all content (any visibility), archive content that violates policies, feature/unfeature content, approve partner applications, review flagged content.  
**Cannot:** Delete content (only archive), access billing, access PII beyond what is needed for moderation, impersonate publishers.

---

### Administrator

**Purpose:** A CULO staff member with full platform access.

**Can:** All moderator permissions + verify publishers and businesses, manage all entities at any lifecycle stage, manage partner programs, view all analytics, manage integrations, restore deleted entities within retention window.  
**Cannot:** Access billing configuration (Platform Owner only), delete entities permanently outside retention window.

---

### Platform Owner

**Purpose:** The CULO founder/operator with unrestricted access.

**Can:** All permissions including billing, permanent deletion, platform configuration, staff management.

---

### System Automation

**Purpose:** The Automation Engine acting on behalf of a publisher.

**Can:** Trigger lifecycle transitions that the publisher has authorised (e.g. scheduled publish), fire notifications, queue AI agent tasks.  
**Cannot:** Override explicit publisher preferences, approve recommendations, change ownership, access content marked `ai_excluded = true`.

---

### AI Agent

**Purpose:** An AI agent within the AI Orchestration Engine.

**Can:** Read entity content, produce suggestions and drafts, update non-public metadata (topics, alt text, SEO meta), strengthen Knowledge Graph relationships.  
**Cannot:** Publish, approve, change ownership, add affiliate/referral links, modify disclosure labels, access private entities it has not been granted access to, read entities marked `ai_excluded = true`.

---

### API Client

**Purpose:** An external application accessing CULO via API.

**Scopes (must be explicitly granted):** `read`, `write`, `publish`, `upload`, `analytics`, `partner`, `billing`, `admin`.  
**Cannot:** Exceed granted scope. Cannot impersonate a user without that user's explicit OAuth grant.

---

## Permission Types

| Permission | Description |
|---|---|
| `view` | See the entity and its content |
| `create` | Create a new entity of this type |
| `edit` | Modify fields on an existing entity |
| `delete` | Soft-delete the entity |
| `archive` | Move entity to archived state |
| `restore` | Restore entity from archived state |
| `publish` | Change status to `published` |
| `feature` | Set `featured = true` |
| `approve` | Approve a pending item (recommendation, campaign application, partner program) |
| `reject` | Reject a pending item |
| `share` | Generate a public shareable link |
| `export` | Export entity as JSON or structured format |
| `import` | Import content into this entity |
| `connect` | Create a relationship between this entity and another |
| `disconnect` | Remove a relationship |
| `assign` | Assign this entity to a different owner or group |
| `transfer_ownership` | Change primary owner of an entity |
| `invite` | Invite another user to access this entity |
| `manage_permissions` | Change who has access to this entity |
| `manage_ai` | Configure AI agent access for this entity |
| `manage_automations` | Configure automations that fire on this entity |
| `manage_integrations` | Connect external integrations to this entity |
| `manage_billing` | Access billing and subscription settings |

---

## Permission Matrix — By Role

| Permission | Visitor | Publisher | Village Pro | Moderator | Admin | Platform Owner | AI Agent | Automation |
|---|---|---|---|---|---|---|---|---|
| `view` (public) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `view` (own private) | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `create` | — | ✅ | ✅ | — | ✅ | ✅ | — | — |
| `edit` (own) | — | ✅ | ✅ | — | ✅ | ✅ | ✅ (metadata) | — |
| `edit` (other) | — | — | — | ✅ (limited) | ✅ | ✅ | — | — |
| `delete` (own) | — | ✅ | ✅ | — | ✅ | ✅ | — | — |
| `archive` (own) | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ (with rule) |
| `restore` | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `publish` (own) | — | ✅ | ✅ | — | ✅ | ✅ | — | ✅ (scheduled) |
| `feature` | — | — | — | ✅ | ✅ | ✅ | — | — |
| `approve` (recommendation) | — | ✅ (own) | ✅ (own) | — | ✅ | ✅ | — | — |
| `approve` (partner program) | — | — | — | — | ✅ | ✅ | — | — |
| `share` | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| `export` (own) | — | ✅ | ✅ | — | ✅ | ✅ | — | — |
| `import` | — | ✅ | ✅ | — | ✅ | ✅ | — | — |
| `connect` (own) | — | ✅ | ✅ | — | ✅ | ✅ | ✅ (suggest) | — |
| `transfer_ownership` | — | — | — | — | ✅ | ✅ | — | — |
| `manage_permissions` | — | ✅ (own) | ✅ (own) | — | ✅ | ✅ | — | — |
| `manage_billing` | — | ✅ (own) | ✅ (own) | — | — | ✅ | — | — |

---

## Entity Ownership Rules

| Entity | Primary Owner | Secondary Owner | Transfer Rules |
|---|---|---|---|
| Story | Publisher (user_id) | Business (if story attached to business) | Transfer to another publisher requires admin approval |
| Founder Profile | Publisher (user_id) | — | Cannot be transferred (identity document) |
| Business Profile | Publisher (user_id who created) | Future: team members | Transfer via admin action |
| Library Item | Publisher (user_id) | Business (if attached) | Transfer via admin |
| Service | Publisher (user_id) — inherits from Business | — | Follows Business ownership |
| Partner | Admin (initially), then claimed Business | — | Claim requires verification |
| Recommendation | Publisher (user_id) | — | Cannot be transferred |
| Campaign | Business Owner / Partner Owner | — | Cannot be transferred |
| Earnings | Publisher (user_id) | — | Read-only for publisher; managed by admin |
| Payout | Publisher (user_id) | — | Managed by admin |
| Widget | Publisher (user_id) | — | Cannot be transferred (tied to embed token) |
| Knowledge Node | Knowledge Engine (system) | — | No individual owner — system asset |

**Orphan policy:** If an owner account is deleted, their entities move to `visibility = admin-only`. Admin reviews and either archives or, for published content, contacts the publisher's designated representative.

---

## Permission Inheritance Diagram

```
Publisher (user_id)
      │
      ├── Founder Profile
      │         └── (all profile fields)
      │
      ├── Business Profile(s)
      │         ├── Services
      │         ├── Products (future)
      │         ├── Campaigns (Village Pro)
      │         ├── Partner Programs (Village Pro)
      │         └── Media attached to Business
      │
      ├── Stories
      │         ├── Media attached to Story
      │         └── Recommendations on Story
      │
      ├── Library Items
      │         └── Media attached to Library Item
      │
      ├── Ideas
      │
      └── Widget Configurations
```

A Publisher who owns a Business automatically inherits ownership of everything the Business owns. They do not need separate permission grants.

---

## Dashboard Access Matrix

| Dashboard | Required Role | Notes |
|---|---|---|
| Publisher Dashboard Home | Publisher | Own data only |
| Story Publisher (7-step wizard) | Publisher | Own stories only |
| Profile Dashboard | Publisher | Own profile only |
| Library Dashboard | Publisher | Own library only |
| Services Dashboard | Publisher + Business | Must own the business |
| Publisher Partner Centre | Village Pro Publisher | Requires active membership |
| Publisher Growth Dashboard | Village Pro Publisher | Requires active membership |
| Village Pro Business Centre | Village Pro Business | Requires active membership |
| Business Analytics | Business Owner | Own business only |
| Media Dashboard | Publisher | Own media only |
| Admin Dashboard | Moderator, Admin, Platform Owner | Role-scoped views |
| Billing Dashboard | Publisher (own), Platform Owner | Own subscription data |

---

## AI Permission Constraints

AI agents operate within a strict permission boundary.

### AI Agents MAY:

- Read any entity the owner has not marked `ai_excluded = true`
- Produce metadata suggestions (topics, alt text, SEO meta, GEO summaries)
- Produce draft content marked clearly as AI-generated
- Suggest Knowledge Graph relationships
- Flag potential issues via `ai_flags`
- Update `ai_processed_at`, `ai_confidence_scores`, `ai_suggestions_pending`

### AI Agents MAY NEVER:

- Set `status = published` without explicit publisher action
- Approve a Recommendation (requires publisher action)
- Insert an affiliate or referral link
- Remove or modify a disclosure
- Change an entity's `owner_id`
- Archive or delete any entity
- Read entities with `ai_excluded = true`
- Access `earnings` or `payouts` records
- Access another publisher's private entities
- Pretend to be the publisher in any output shown to readers

---

## Automation Permission Constraints

Automation acts on behalf of owners, never beyond them.

### Automations MAY:

- Publish a story at a scheduled time (if publisher enabled scheduled publish)
- Archive content after a set period (if publisher enabled auto-archive)
- Send notifications on behalf of the system
- Queue AI agent tasks
- Update analytics records
- Fire webhook events

### Automations MAY NEVER:

- Approve a Recommendation
- Insert partner or affiliate links
- Change ownership of an entity
- Delete an entity
- Access entities not related to the triggering event
- Elevate their permission beyond the owner's permission

---

## API Permission Scopes

External integrations must be granted explicit scopes. Each scope grants the minimum access needed.

| Scope | Grants |
|---|---|
| `read` | Read all `public` + `visibility = public` entities |
| `read:own` | Read all entities owned by the authenticated user |
| `write:own` | Create and edit entities owned by the authenticated user |
| `publish:own` | Publish entities owned by the authenticated user |
| `upload` | Upload media files (attached to authenticated user) |
| `analytics:own` | Read analytics for the authenticated user's entities |
| `partner:read` | Read partner programs, recommendations, earnings (authenticated user only) |
| `partner:write` | Update recommendation approvals (authenticated user only) |
| `search` | Query the search index (public content only, unless `read:own` also granted) |
| `widgets:own` | Read and update widget configurations |
| `admin` | Unrestricted access — requires Platform Owner grant |

Canva API integration will use `write:own` + `publish:own` + `upload` scopes.

---

## Security Principles

Every permission decision in CULO follows these principles:

**Least privilege.** Every role, agent and integration is granted only the minimum access needed. Scopes are not bundled beyond necessity.

**Explicit ownership.** No entity is accessible without a documented owner. Anonymous ownership is not permitted.

**Auditability.** Every permission change is logged with the actor, timestamp and reason.

**Revocation.** Any permission grant can be revoked. Revocation takes effect immediately.

**Temporary access.** Future: time-limited permission grants for agency work, guest contributors, and compliance review periods.

**No permission escalation.** An agent, automation or API cannot grant itself higher permissions than it was given. Automation acting for a Publisher cannot do things the Publisher cannot do.

---

## Future Expansion

The permission model is designed to support growth without redesign.

**Teams:** Add `organisation_id` to entities and a `team_roles` table. Role inheritance already modelled (`Editor`, `Contributor`, `Viewer` roles are reserved).

**Agencies:** An Agency role that allows one Publisher to manage multiple Business accounts under a single login. Agency members inherit Business Owner permissions for assigned businesses.

**Enterprise:** Approval chains, multi-person publishing workflows, and compliance holds are addable as permission conditions on top of the existing role model.

**White label and franchises:** Future: entity-level permission namespacing, allowing a white-label operator to restrict their publishers to specific features.

**Marketplace plugin developers:** `API Client` role with restricted scopes. Plugin developers never get `admin` scope.

---

## Development Rules

Every future feature must answer:

1. Who owns this entity?
2. Who can view it at each lifecycle state?
3. Who can edit it?
4. Who can publish it?
5. Who can archive it?
6. Who can approve it?
7. Which AI agents may access it and what may they modify?
8. Which automations may act on it?
9. What API scopes are required to interact with it?
10. How is ownership inherited if a parent entity exists?

---

*This document is the permanent permission contract for CULO. Every engine, every dashboard, every AI agent, and every API integration operates within the boundaries defined here.*
