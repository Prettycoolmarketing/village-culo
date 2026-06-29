# CULO Operating System — Lifecycle Blueprint

**Version:** 1.0  
**Status:** Core Specification — Foundational  
**Scope:** Every entity in CULO, present and future  
**References:** `docs/core/01-entity-blueprint.md`, `docs/ARCHITECTURE_INDEX.md`

---

## Philosophy

Everything has a lifecycle.

An entity is not static. It is created, shaped, released, evolved, and eventually retired. The lifecycle governs who can see it, who can change it, what happens automatically at each stage, and which engines respond.

Without lifecycle rules:
- Drafts leak into public pages.
- Archived content stays in search indexes.
- Deleted entities linger in widgets.
- Notifications fire at wrong times.
- Analytics count the wrong states.
- AI agents process entities that shouldn't be processed.

The Lifecycle Blueprint prevents all of this by defining, for every entity type, the exact set of valid states, the allowed transitions between them, and the engine events each transition fires.

---

## Core Principles

1. **Nothing jumps states.** An entity cannot go from `draft` to `featured` without passing through `published`. Every transition is explicit and ordered.

2. **Every transition fires an event.** When an entity changes state, the Event System is notified. Engines react — they do not poll.

3. **Most transitions are reversible.** `published` → `archived` → `published` is valid. `deleted` is the only irreversible state (and even then, soft delete preserves the data).

4. **Transitions have permission gates.** Only authorised actors can trigger certain transitions. A publisher cannot `feature` their own content. Only an admin can.

5. **Automated transitions are audited.** When the Automation Engine triggers a lifecycle transition (e.g., scheduled publish), it is logged as the actor, not the publisher.

---

## Universal Lifecycle States

Every entity supports this base set of states. Entity-specific types extend this with additional states where needed.

| State | Description | Visible to |
|---|---|---|
| `draft` | Created but not ready for others to see. Being worked on. | Owner only |
| `ready` | Owner considers it complete. Awaiting publishing action or admin review. | Owner, Admin |
| `published` | Live and publicly visible (if `visibility = public`). | Public / per visibility setting |
| `featured` | Published and editorially highlighted. Appears in featured surfaces. | Public |
| `archived` | Removed from public surfaces but retained. Owner can restore. | Owner, Admin |
| `deleted` | Soft deleted. Removed from all surfaces. Retained for legal/audit purposes. | Admin only |

Not all entity types use all states. Some have additional states. Each entity's lifecycle is documented below.

---

## Transition Rules — Universal

```
         ┌─────────────────────────────────┐
         │                                 │
 draft ──► ready ──► published ──► archived ──► deleted
         │                │                     ▲
         └────────────────┘                     │
                          │                     │
                      featured ─────────────────┘
                          │
                    (back to published
                    when unfeatured)
```

| Transition | Allowed by | Event fired |
|---|---|---|
| `draft` → `ready` | Owner | `EntityReady` |
| `ready` → `draft` | Owner | `EntityReverted` |
| `ready` → `published` | Owner | `EntityPublished` |
| `draft` → `published` | Owner (skip ready) | `EntityPublished` |
| `published` → `featured` | Admin | `EntityFeatured` |
| `featured` → `published` | Admin | `EntityUnfeatured` |
| `published` → `archived` | Owner, Admin | `EntityArchived` |
| `archived` → `published` | Owner, Admin | `EntityRestored` |
| `archived` → `deleted` | Owner (own content), Admin | `EntityDeleted` |
| `published` → `deleted` | Admin only | `EntityDeleted` |

---

## Publisher Lifecycle

A Publisher is the human behind a CULO account. Their lifecycle tracks their maturity and relationship with the platform.

```
Anonymous Visitor
      │
      ▼ (signs up)
Registered User
      │
      ▼ (completes onboarding)
Publisher Created
      │
      ▼ (fills profile)
Profile Completed
      │
      ▼ (publishes first story)
Active Publisher
      │
      ├──► Village Pro Enabled (optional — requires membership)
      │           │
      │           ▼
      │    Village Pro Active
      │           │
      │    (membership lapses)
      │           │
      │           ▼
      │    Village Pro Paused
      │           │
      │    (re-subscribes)
      │           ▼
      │    Village Pro Active (restored)
      │
      ├──► Verified (admin action — confirmed real person and legitimate publisher)
      │
      ├──► Trusted Publisher (future — high trust score + verified + sustained activity)
      │
      ├──► Community Leader (future — editorial role, nominated by admin)
      │
      ▼
Archived (account suspended or voluntarily deactivated)
      │
      ▼
Deleted (GDPR request or admin removal)
```

### State definitions:

| State | Meaning | Visible on |
|---|---|---|
| Registered User | Account exists, onboarding not complete | Not visible |
| Publisher Created | Onboarding complete, profile exists | Owner only |
| Profile Completed | All core fields filled | Village if published |
| Active Publisher | Has published at least one story | Full Village presence |
| Village Pro Enabled | CULO Creatives member with Partner Centre access | Partner features unlocked |
| Verified | CULO confirmed authentic identity | Verification badge on profile |
| Trusted Publisher | High trust score sustained over time | Future trust badge |
| Community Leader | Editorial/moderation role | Future community badge |
| Archived | Deactivated — content retained, profile hidden | Admin only |
| Deleted | GDPR or admin removal — data anonymised | Not visible |

### Transition events:

| Transition | Automation triggered |
|---|---|
| → Publisher Created | Send welcome email, create Knowledge Graph node |
| → Profile Completed | Suggest first story, update search index |
| → Active Publisher | Enable full distribution, update Growth Engine |
| → Village Pro Enabled | Unlock Partner Centre, schedule partner match scan |
| → Verified | Apply verification badge, boost search ranking |
| → Archived | Remove from all public surfaces, retain content |
| → Deleted | Anonymise analytics, soft-delete all owned content |

---

## Business Lifecycle

```
Business Created
      │
      ▼ (fills profile details)
Profile In Progress
      │
      ▼ (core fields complete)
Profile Completed
      │
      ▼ (owner publishes it)
Published
      │
      ├──► Village Pro Enabled (optional)
      │           │
      │           ▼
      │    Partner Discoverable
      │           │
      │           ├──► Partner Program Added
      │           │           │
      │           │           ▼
      │           │    Program Active
      │           │
      │           └──► Campaign Created
      │                       │
      │                       ▼
      │                Campaign Live
      │
      ├──► Verified (admin action)
      │
      ├──► Featured (admin action)
      │
      ▼
Archived
      │
      ▼
Deleted
```

### State definitions:

| State | Meaning | Visible on |
|---|---|---|
| Profile In Progress | Being configured | Owner only |
| Profile Completed | All core fields filled | Owner only (until published) |
| Published | Live in Village Mercato | Public |
| Village Pro Enabled | Discoverable in Partner Engine | Partner surfaces |
| Partner Discoverable | Appears in publisher recommendation matching | Recommendation suggestions |
| Partner Program Added | At least one active program | Publisher Partner Centre |
| Verified | Authentic business confirmed | Verification badge |
| Featured | Highlighted in Village | Homepage, featured surfaces |
| Archived | Removed from public, retained | Admin only |
| Deleted | Soft deleted | Admin only |

### Transition events:

| Transition | Automation triggered |
|---|---|
| → Published | Update search index, create Knowledge Graph node, update Distribution Engine |
| → Village Pro Enabled | Add to partner discovery pool, run initial publisher match scan |
| → Partner Program Added | Surface to matching publishers, update Partner Directory |
| → Verified | Apply badge, boost in search and recommendation matching |
| → Featured | Update homepage widget, notify admin |
| → Archived | Remove from all public surfaces, suspend partner programs |

---

## Story Lifecycle

The most frequently traversed lifecycle in CULO.

```
Story Created (empty)
      │
      ▼ (publisher fills fields)
Draft
      │
      ▼ (AI agents run — async)
AI Assisted
      │
      ▼ (publisher reviews, edits)
Ready
      │
      ▼ (publisher clicks Publish)
Published
      │
      ├──► Featured (admin promotes)
      │           │
      │    (admin removes feature)
      │           │
      │           ▼
      │       Published (returned)
      │
      ├──► Updated (publisher edits after publish)
      │           │
      │           ▼
      │       Published (updated version)
      │
      ▼ (publisher or admin archives)
Archived
      │
      ▼ (publisher or admin deletes)
Deleted
```

### State definitions:

| State | Visibility | Description |
|---|---|---|
| `draft` | Owner only | Being written. No public access. AI suggestions incoming. |
| `ready` | Owner only | Publisher considers it ready. Awaiting publish action. |
| `published` | Public | Live in Village. All engines active. |
| `featured` | Public (promoted) | Highlighted. Appears in featured surfaces and homepage. |
| `archived` | Owner, Admin | Removed from Village. Not deleted. Publisher can restore. |
| `deleted` | Admin only | Soft deleted. Content retained. |

### Full transition event map:

| Transition | Fires | Engine consumers |
|---|---|---|
| → Draft | `StoryCreated` | Publishing Engine, Analytics |
| Draft saved | `StoryDraftSaved` | Publishing Engine (local only) |
| → Ready | `StoryReady` | AI Orchestration (queue full processing) |
| → Published | `StoryPublished` | Knowledge Engine, Partner Engine, Distribution Engine, Search Engine, SEO Engine, GEO Engine, Analytics Engine, Automation Engine, Widget Engine |
| Published + edit | `StoryUpdated` | SEO Engine (re-index), Knowledge Engine (re-scan), Partner Engine (re-scan), Distribution Engine (re-distribute), Analytics (note update) |
| → Featured | `StoryFeatured` | Distribution Engine (add to featured), Analytics, Automation (notify publisher) |
| Featured removed | `StoryUnfeatured` | Distribution Engine (remove from featured) |
| → Archived | `StoryArchived` | Distribution Engine (remove), Search Engine (de-index), Widget Engine (remove), SEO Engine (no-index), Analytics (retain data) |
| Archived → Published | `StoryRestored` | Full publish pipeline re-runs |
| → Deleted | `StoryDeleted` | All engines (remove all references), Analytics (anonymise if required) |

### AI agent pipeline on `StoryPublished`:

```
StoryPublished
  ├── Insight Agent → extract ideas, key lessons
  ├── Topic Agent → assign topics and industries
  ├── Relationship Agent → detect entity mentions
  ├── Partner Agent → scan for brand mentions
  ├── FAQ Agent → extract Q&A pairs
  ├── SEO Agent → generate meta, schema, internal links
  ├── GEO Agent → create entity summary, citation excerpt
  ├── Safety & Trust Agent → check for flags
  └── Analytics Agent → record publish event
```

All agents run asynchronously. Publish is not blocked waiting for AI. Agent outputs queue as suggestions in the publisher's dashboard.

---

## Idea Lifecycle

An Idea is a captured thought, insight or question that may or may not become a Story.

```
Idea Captured (quick capture — minimal fields)
      │
      ▼ (publisher expands it)
Expanded
      │
      ▼ (related stories or entities linked)
Connected
      │
      ▼ (publisher chooses to publish it)
Published
      │
      ▼ (another story references it)
Referenced
      │
      ▼
Archived
      │
      ▼
Deleted
```

### Transition events:

| Transition | Automation |
|---|---|
| → Captured | Create Knowledge Graph node candidate |
| → Expanded | Suggest related stories, suggest related entities |
| → Connected | Update Knowledge Graph relationships |
| → Published | Add to search index, surface in Library |
| → Referenced | Strengthen relationship edge to referencing story |
| → Archived | Remove from Library listing, retain in Knowledge Graph |

---

## Library Item Lifecycle

```
Created (uploaded or authored)
      │
      ▼ (publisher adds metadata)
Configured
      │
      ▼ (media processed, tags added)
Tagged
      │
      ▼ (linked to stories or topics)
Connected
      │
      ▼ (publisher publishes it)
Published
      │
      ├──► Featured (admin promotes)
      │
      ▼
Archived
      │
      ▼
Deleted
```

### Transition events:

| Transition | Automation |
|---|---|
| → Created | Media Agent queued (if file upload) |
| → Tagged | Update search index, suggest Knowledge Graph connections |
| → Published | Add to Library listing, update search, SEO Agent, Knowledge Graph |
| → Featured | Surface in featured Library, notify publisher |
| → Archived | Remove from Library listing |

---

## Media Lifecycle

Media (images, video, audio, documents) has its own lifecycle independent of the story it may be attached to.

```
Uploaded (file arrives in Supabase Storage)
      │
      ▼ (technical processing)
Processing
      │
      ▼ (Media Agent runs)
Analysed
      │
      ├── Thumbnail generated
      ├── Alt text suggested
      ├── Transcript extracted (for audio/video)
      ├── Compression applied
      └── Dimensions / duration extracted
      │
      ▼ (attached to an entity)
Connected
      │
      ▼ (entity published)
Used
      │
      ▼ (entity archived or media removed from entity)
Orphaned (media exists but has no connected entity)
      │
      ├──► Re-connected (publisher reattaches)
      │
      ▼ (auto-archive after 30 days if orphaned)
Archived
      │
      ▼
Deleted (removed from Supabase Storage)
```

### Transition events:

| Transition | Automation |
|---|---|
| → Uploaded | Media Agent queued |
| → Analysed | Thumbnail, alt text, transcript suggestions surfaced |
| → Connected | Update entity `media_ids` |
| → Orphaned | Notify publisher, start 30-day archive countdown |
| → Deleted | Remove from Supabase Storage, remove from all entity references |

---

## Partner (Entity) Lifecycle

A Partner is an external organisation participating in the Partner Network.

```
Detected (brand mention found in content, no partner record yet)
      │
      ▼ (admin creates partner record, or brand claims profile)
Created
      │
      ▼ (admin or brand completes profile)
Configured
      │
      ▼ (admin activates)
Active
      │
      ├──► Program Added (at least one Partner Program created)
      │
      ├──► Verified (admin confirms legitimate business)
      │
      ├──► Suspended (violation of trust rules)
      │           │
      │    (violation resolved)
      │           │
      │           ▼
      │         Active
      │
      ▼
Inactive (partner opted out or program ended)
      │
      ▼
Archived
```

### Transition events:

| Transition | Automation |
|---|---|
| → Detected | Create candidate Partner record in admin queue |
| → Active | Add to partner matching pool, run retroactive story scan |
| → Program Added | Surface to eligible publishers, update Partner Directory |
| → Verified | Boost in recommendation matching, apply verification badge |
| → Suspended | Remove from recommendation suggestions, notify any active publishers |

---

## Recommendation Lifecycle

The lifecycle of a single recommendation from detection to completion.

```
Story published
      │
      ▼ (Partner Agent scans)
Detected (brand mention found)
      │
      ▼ (confidence calculated)
Scored
      │
      ├── Score < threshold → Discarded (no suggestion)
      │
      └── Score ≥ threshold
            │
            ▼ (partner match check)
            ├── No partner → Logged (no suggestion)
            │
            └── Partner found + publisher eligible
                  │
                  ▼
                Suggested (shown in publisher Partner Centre)
                  │
                  ├──► Ignored (publisher doesn't act for 30 days → auto-expires)
                  │
                  ├──► Rejected (publisher explicitly declines)
                  │
                  └──► Approved (publisher accepts)
                              │
                              ▼
                          Published (disclosure applied, link inserted)
                              │
                              ▼
                          Live + Tracked (clicks and conversions monitored)
                              │
                              ├──► Updated (publisher edits story, context changes)
                              │
                              ├──► Expired (program ended, link broken)
                              │
                              └──► Withdrawn (publisher removes)
                                          │
                                          ▼
                                      Archived
```

### Transition events:

| Transition | Automation |
|---|---|
| → Suggested | Notify publisher in Partner Centre |
| → Approved | Update story with disclosure, notify business, start tracking |
| → Rejected | Store signal, suppress re-suggestion for this story |
| → Expired | Alert publisher, remove from active tracking |
| → Withdrawn | Remove disclosure from story, notify analytics |

---

## Campaign Lifecycle

```
Draft (business building campaign)
      │
      ▼ (business activates)
Scheduled (if future start date) or Live (if immediate)
      │
      ▼ (start date reached, if scheduled)
Live
      │
      ▼ (business pauses or deadline reached)
Paused ──► Live (if resumed before deadline)
      │
      ▼ (deadline reached or max publishers met)
Completed
      │
      ▼
Archived
```

### Transition events:

| Transition | Automation |
|---|---|
| → Live | Match eligible publishers, surface in Opportunities |
| → Paused | Remove from available Opportunities, notify active participants |
| → Completed | Notify participants, close applications, finalise analytics |
| → Archived | Remove from Partner Directory |

---

## Event Lifecycle

```
Created (event organiser creates record)
      │
      ▼ (details filled)
Draft
      │
      ▼ (organiser publishes)
Published / Upcoming
      │
      ▼ (event start date reached)
Live
      │
      ▼ (event end date reached)
Completed
      │
      ▼
Archived
```

### Transition events:

| Transition | Automation |
|---|---|
| → Published | Growth Engine matches speakers and sponsors, add to search |
| → Live | Notify registered attendees (future) |
| → Completed | Archive event content, retain for Knowledge Graph |

---

## Community Lifecycle

```
Created
      │
      ▼ (admin or owner configures)
Configured
      │
      ▼ (published)
Published
      │
      ▼ (active members, regular content)
Growing
      │
      ▼ (established presence, consistent activity)
Established
      │
      ▼ (inactive, no content in 90 days)
Dormant ──► Growing (if activity resumes)
      │
      ▼
Archived
```

---

## Widget Lifecycle

```
Created (publisher creates widget config)
      │
      ▼ (publisher configures content selection)
Configured
      │
      ▼ (publisher generates embed code)
Embedded (code exists, may or may not be placed)
      │
      ▼ (embed placed on publisher website and receiving traffic)
Live
      │
      ▼ (publisher updates content selection)
Updated ──► Live
      │
      ▼ (publisher deactivates widget)
Retired (embed code no longer returns content)
      │
      ▼
Archived (config retained for publisher records)
```

### Transition events:

| Transition | Automation |
|---|---|
| → Configured | Generate embed token |
| → Live | Begin widget analytics tracking |
| → Updated | Refresh widget content |
| → Retired | Return empty response to embed requests |

---

## Automation Rules by Lifecycle State

For every state, what is allowed, what is blocked, and what fires automatically.

### `draft`

| Rule | Detail |
|---|---|
| Allowed actions | Edit all fields, add media, save, AI agents may process async |
| Blocked actions | Partner Engine scanning, public distribution, SEO indexing |
| Auto-triggers | AI agent pipeline queued (runs async, does not block) |
| AI agents active | Story Agent, Insight Agent, Topic Agent, Format Agent, Media Agent |
| AI agents blocked | SEO Agent, GEO Agent, Partner Agent (content not final) |

### `published`

| Rule | Detail |
|---|---|
| Allowed actions | Edit (fires `EntityUpdated`), archive, feature (admin), add recommendations |
| Blocked actions | Deletion without archiving first |
| Auto-triggers | Full engine pipeline (Knowledge, Partner, Distribution, SEO, GEO, Analytics, Widget) |
| AI agents active | All agents |
| Visibility | Per entity `visibility` setting |

### `archived`

| Rule | Detail |
|---|---|
| Allowed actions | Restore to published, delete |
| Blocked actions | All public-facing operations |
| Auto-triggers | Remove from Distribution Engine, Search Engine de-index, Widget Engine remove, SEO no-index |
| AI agents active | None (archived entities are not reprocessed) |
| Visibility | Owner and Admin only |

### `deleted`

| Rule | Detail |
|---|---|
| Allowed actions | Admin restore (within retention period) |
| Blocked actions | All operations |
| Auto-triggers | Remove all references from all surfaces, anonymise analytics where required |
| AI agents active | None |
| Visibility | Admin only |

---

## Permissions by Transition

| Transition | Publisher (own) | Publisher (other) | Admin | Automation Engine | AI |
|---|---|---|---|---|---|
| → draft | ✅ | — | ✅ | — | — |
| draft → published | ✅ | — | ✅ | ✅ (scheduled) | — |
| published → featured | — | — | ✅ | — | — |
| featured → published | — | — | ✅ | — | — |
| published → archived | ✅ | — | ✅ | ✅ (health rule) | — |
| archived → published | ✅ | — | ✅ | — | — |
| archived → deleted | ✅ | — | ✅ | — | — |
| published → deleted | — | — | ✅ | — | — |
| Village Pro enabled | ✅ (self) | — | ✅ | ✅ (billing event) | — |
| Entity verified | — | — | ✅ | — | — |

---

## Lifecycle Health Checks

Scheduled scans that flag lifecycle issues:

| Check | Entities | Threshold | Action |
|---|---|---|---|
| Draft too long | Story, Library Item | In draft > 30 days | Alert publisher: "You have a draft you haven't published" |
| Ready but not published | Story | In ready > 7 days | Alert publisher: nudge to publish |
| Archived content with broken references | All | Any archived entity still referenced by active entity | Flag for admin review |
| Orphaned media | Media | No connected entity for > 30 days | Notify publisher, auto-archive at 60 days |
| Expired partner programs on live recommendations | Recommendation | Program end_at in past | Flag recommendation as expired, alert publisher |
| Campaign with no applicants | Campaign | Live > 14 days, 0 applicants | Alert business, suggest publisher invite |
| Publisher inactive | Publisher | No publish in 90 days | Optional nudge (publisher can disable) |
| Business with no stories | Business | Published > 30 days, no linked stories | Suggest publisher creates first story |

---

## Recovery

### Archive recovery (restore to published):

1. Owner or admin changes status from `archived` to `published`.
2. `EntityRestored` event fires.
3. Full publish pipeline re-runs: Distribution Engine re-distributes, Search Engine re-indexes, SEO Engine refreshes metadata, Widget Engine re-includes.
4. Partner Engine re-scans story content for new recommendation opportunities.

### Undo deletion (soft delete recovery):

1. Admin only — within 90-day retention window.
2. `deleted_at` cleared.
3. Status returned to `archived`.
4. Owner notified.
5. Full re-integration from archive state.

### Version rollback (Story only):

1. Publisher views version history (future feature, requires `version` increment tracking).
2. Publisher selects previous version.
3. Current version archived as a version snapshot.
4. Previous version content restored.
5. `StoryUpdated` event fires — SEO and Knowledge Engine re-process.

---

## Engine Relationships

Every lifecycle transition connects to one or more engines:

| Engine | Lifecycle role |
|---|---|
| **Identity Engine** | Creates Publisher and Business entities. Controls access and permissions at every state. |
| **Publishing Engine** | Manages Story, Library Item, Idea creation and state transitions. |
| **Knowledge Engine** | Reacts to `published` and `updated` events. Updates graph. Reacts to `archived` and `deleted` to remove graph edges. |
| **Growth Engine** | Reacts to `published` events to find new opportunity matches. Reacts to `archived` to remove from opportunity pool. |
| **Partner Engine** | Reacts to `StoryPublished` to run recommendation scan. Reacts to `StoryArchived` to expire recommendations. |
| **Distribution Engine** | Reacts to `published` to add to public surfaces. Reacts to `archived` to remove. Reacts to `featured` to add to featured surfaces. |
| **Automation Engine** | Listens to all lifecycle events and fires registered automations. Manages scheduled transitions. |
| **Analytics Engine** | Records publish, archive, view, click events. Does not act on lifecycle state — it records it. |
| **SEO Engine** | Reacts to `published` to index. Reacts to `updated` to re-index. Reacts to `archived` to set no-index. |
| **GEO Engine** | Reacts to `published` to create entity definition. Reacts to `archived` to remove entity reference. |
| **Widget Engine** | Reacts to `published` to make eligible for widgets. Reacts to `archived` to remove from widget data. |
| **AI Orchestration Engine** | Reacts to `draft` creation and `published` transitions to queue appropriate agent pipelines. |
| **Notification Engine** | Fires on transitions that are publisher-visible: publish, feature, archive, health issues. |

---

*This document defines the lifecycle contract for every entity in CULO. No entity may skip states. No transition may bypass an event. Every engine reacts to lifecycle events — it never polls for state changes.*
