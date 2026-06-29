# CULO Operating System — Versioning Blueprint

**Version:** 1.0  
**Status:** Core Specification — Foundational  
**Scope:** Every entity in CULO that may change over time  
**References:** `docs/core/01-entity-blueprint.md`, `docs/core/02-lifecycle-blueprint.md`, `docs/core/03-event-blueprint.md`

---

## Philosophy

Knowledge should evolve — not disappear.

Every meaningful change to an entity is a moment in its history. A story that was edited three times tells a more complete story about how the publisher's thinking developed. A business profile that was updated six times shows a business that is alive and growing.

Publishers should always be able to understand:
- What changed
- Who changed it
- When it changed
- Why it changed
- Whether AI suggested it
- Whether it was approved

Versioning is not bureaucracy. It is memory. And memory is what turns a collection of content into a body of knowledge.

---

## Core Principles

1. **Nothing meaningful is ever permanently overwritten.** When content changes, the previous version is retained, not replaced.

2. **Every version has an identity.** A version is not just a timestamp — it has an ID, an author, a reason and a classification.

3. **AI suggestions are part of the history.** If an AI agent proposes a change and the publisher accepts it, both the original and the AI suggestion are in the version history.

4. **Deletion does not destroy versions.** Soft-deleted entities retain their version history. Version history is only removed on legal request (GDPR) and only under Platform Owner authority.

5. **The current version is always accessible.** Version history never blocks access to the live content. History is a parallel record, not a burden.

6. **Restoration creates a new version.** Rolling back to a previous version does not erase the version that was replaced — it creates a new version that describes the restoration.

---

## Universal Version Record

Every version of every entity shares this structure.

| Field | Type | Description |
|---|---|---|
| `version_id` | UUID | Unique identifier for this version |
| `entity_id` | UUID | The entity this version belongs to |
| `entity_type` | string | The entity type (story, business, publisher, etc.) |
| `version_number` | integer | Monotonically incrementing. Starts at 1. |
| `previous_version_id` | UUID or null | The version immediately before this one |
| `created_by_type` | enum | `publisher`, `admin`, `automation`, `ai`, `import`, `api` |
| `created_by_id` | UUID or null | The user_id or agent ID that created this version |
| `created_at` | timestamp | When this version was created |
| `change_reason` | string or null | Why this change was made. Optional for publisher edits. Required for admin edits. |
| `change_summary` | string or null | A brief description of what changed. Auto-generated or publisher-provided. |
| `changed_fields` | string[] | List of field names that changed between this version and the previous |
| `change_type` | enum | `created`, `edited`, `published`, `featured`, `archived`, `restored`, `ai_applied`, `import_updated`, `auto_updated` |
| `ai_generated` | boolean | Whether the changes in this version were AI-generated |
| `ai_agent` | string or null | If ai_generated, which agent created this |
| `publisher_reviewed` | boolean | Whether a publisher explicitly reviewed and confirmed AI changes |
| `approval_status` | enum | `auto_approved`, `publisher_approved`, `admin_approved`, `pending_review` |
| `approved_by` | UUID or null | Who approved this version |
| `approved_at` | timestamp or null | When approved |
| `snapshot` | object | The full entity state at this version. JSONB. |
| `diff` | object | Only the changed fields and their old/new values (space-efficient alternative to full snapshot) |
| `metadata_only` | boolean | If `true`, this version changed only metadata (topics, SEO, etc.) — not the content body |
| `is_published_version` | boolean | Whether this version is the currently live, published version |
| `is_current_version` | boolean | Whether this version is the current (may be draft) version |

---

## Version Classification

Not all changes are equal. Version records are classified by change type to make history scannable.

| Change type | Description | Always stored | Publisher visible |
|---|---|---|---|
| `created` | Entity first created | ✅ | ✅ |
| `edited` | Publisher manually changed content | ✅ | ✅ |
| `published` | Status changed to published | ✅ | ✅ |
| `featured` | Admin featured the entity | ✅ | ✅ |
| `archived` | Entity archived | ✅ | ✅ |
| `restored` | Entity restored from archive | ✅ | ✅ |
| `ai_applied` | AI agent made changes (publisher reviewed) | ✅ | ✅ |
| `ai_suggested` | AI agent proposed changes (pending review) | ✅ | ✅ (as pending) |
| `import_updated` | Import Engine updated content | ✅ | ✅ |
| `auto_updated` | System updated metadata (SEO, topics, etc.) | ✅ | Optional (noise reduction) |
| `draft_saved` | Draft auto-save | Only last N drafts | ❌ (internal only) |

**Auto-save drafts:** Only the last 10 auto-save drafts are retained. Auto-save is not part of permanent version history — it is a recovery mechanism.

---

## Entities That Support Full Versioning

Full versioning (all change types) is maintained for:

| Entity | Justification |
|---|---|
| Story | Primary content unit — every change matters |
| Library Item | Reference material that may be cited by other content |
| Founder Profile | Identity document — track how it evolves |
| Business Profile | Brand record — track changes over time |
| Recommendation | Compliance requirement — full approval history |
| Partner Program | Commercial terms — audit trail for disputes |
| Campaign | Campaign terms and changes |
| Widget Configuration | Embed configuration changes |
| Knowledge Node | Entity definitions that inform GEO and SEO |

Entities with lightweight versioning (field-level change log only, no snapshots):

| Entity | What is tracked |
|---|---|
| Idea | Title and content changes |
| Service | Price, description, availability changes |
| Media | Alt text and caption changes |
| Earnings | Status changes only (pending → approved → paid) |
| Payout | Status changes only |

---

## Draft System

Drafts are pre-publication versions of an entity.

### Draft types:

| Type | Description | Retained |
|---|---|---|
| Auto-save draft | System saves every 30 seconds while publisher is editing | Last 10 only |
| Manual save draft | Publisher explicitly saves | All — until replaced by new manual save or publish |
| AI draft | Story Agent or other AI agent produces a draft | Retained as a named version for publisher review |
| Import draft | Import Engine creates a draft from external content | Retained until publisher publishes or discards |

### Draft recovery:

If a publisher's browser crashes mid-edit, the last auto-save draft is shown on re-open.

"It looks like you were editing this story. Your last save was at [time]. Want to continue from where you left off?"

---

## Publishing Versions

When a publisher clicks Publish:

1. Current draft is saved as a version with `change_type = published`.
2. Previous published version (if any) is marked `is_published_version = false`.
3. New version is marked `is_published_version = true` and `is_current_version = true`.
4. `StoryPublished` or `EntityPublished` event fires.
5. All downstream engines receive the new version.

When a publisher updates published content:

1. Edit is saved as a version with `change_type = edited`.
2. Previous published version remains in history.
3. New version becomes `is_current_version = true`.
4. `StoryUpdated` event fires.
5. SEO Engine re-indexes. Knowledge Engine re-scans if `significant_content_change = true`.

---

## AI Versioning

AI changes are versioned differently from publisher changes.

### AI Suggestion (publisher has not yet reviewed):

- Version created with `change_type = ai_suggested`, `ai_generated = true`, `publisher_reviewed = false`.
- Version status: `pending_review`.
- Entity content is NOT changed until publisher acts.
- Suggestion is shown in publisher dashboard as a pending item.

### Publisher accepts AI suggestion:

- New version created with `change_type = ai_applied`, `ai_generated = true`, `publisher_reviewed = true`.
- Entity content updated with AI-suggested changes.
- Both the suggestion version and the accepted version are in history.

### Publisher rejects AI suggestion:

- Suggestion version is marked as rejected in version history.
- Entity content unchanged.
- Rejection signal sent to AI Orchestration Engine for model learning.

### Publisher edits AI suggestion before accepting:

- AI suggestion version retained.
- Publisher's modified version created as a new version with `change_type = edited`, `ai_generated = false`.
- History shows: AI suggested X → Publisher changed it to Y → Published as Y.

**Critical rule:** The publisher's accepted version always takes precedence over the AI suggestion in version history. The AI suggestion is context — the publisher's decision is the record.

---

## Relationship Versioning

Relationships have their own version history.

Every relationship state change (strength increase, confidence update, status change, removal) is recorded.

| Change | Version entry |
|---|---|
| Relationship suggested | `change_type = suggested, created_by = ai` |
| Publisher confirms | `change_type = confirmed, created_by = publisher` |
| Strength increases | `change_type = strengthened, change_summary = "strength 0.40 → 0.55"` |
| Strength decreases / decay | `change_type = decayed, change_summary = "no reinforcement for 14 months"` |
| Publisher removes relationship | `change_type = removed, created_by = publisher` |
| Relationship archived | `change_type = archived` |

---

## Metadata Versioning

Not all metadata changes justify a full version record. The following approach balances completeness with noise:

**Always versioned (stored in full version record):**
- `title` changes
- `summary` changes
- `description` / body changes
- `status` changes
- `visibility` changes
- `topics` changes
- `disclosure_type` changes on Recommendations

**Versioned in lightweight field-change log (not full snapshot):**
- `seo_title`, `seo_description` changes
- `geo_summary` changes
- `cover_image_url` changes
- `topics`, `industries` additions/removals
- AI flag additions/resolutions

**Not versioned (too noisy):**
- `view_count` updates
- `engagement_score` updates
- `trending_score` updates
- `health_score` updates
- `ai_processed_at` updates
- Auto-save timestamps

---

## Media Versioning

| Change | Versioning approach |
|---|---|
| New file uploaded | Version: `change_type = media_added` |
| File replaced with new version | Version: `change_type = media_replaced`. Old file URL retained in previous version. |
| Alt text changed | Lightweight field-change log |
| Transcript regenerated | Version: `change_type = transcript_updated` |
| File deleted | Version: `change_type = media_deleted`. File URL retained in history for 90 days. |

---

## Approval History

Every entity that requires approval before a change is applied maintains an approval history:

| Entity type | What is approved | Who approves |
|---|---|---|
| Recommendation | Publisher approves the recommendation | Publisher |
| Recommendation | Admin may approve in special cases | Admin |
| Campaign Application | Business approves publisher application | Business Owner |
| Partner Program | Admin activates a new partner program | Admin |
| Story (future enterprise) | Editorial approval before publish | Reviewer role |

For every approval event, the version record captures:
- `approved_by` (user_id)
- `approved_at` (timestamp)
- `approval_status` (`publisher_approved`, `admin_approved`, `auto_approved`)
- Optional: `approval_note` — the approver's comment

For every rejection:
- `rejected_by`
- `rejected_at`
- `rejection_reason`

---

## Audit Trail

All version records collectively form the entity's audit trail.

The audit trail answers:
- When was this entity created and by whom?
- What has changed and when?
- Who approved what?
- Did any AI make changes?
- Were those AI changes reviewed?
- Was the entity ever archived and restored?
- Were any compliance issues flagged?

The audit trail is available to:
- The entity owner (for their own entities)
- Admin (for all entities)
- Platform Owner (for all entities)
- Future: external compliance auditors (with explicit grant)

---

## Recovery Flows

### Undo the last change:

1. Publisher opens version history.
2. Publisher clicks "Undo" on the most recent version.
3. System creates a new version restoring the previous state (`change_type = restored, change_summary = "Reverted to version N"`).
4. Entity content updates.
5. If entity is published, `StoryUpdated` event fires.

**Maximum undo:** Publisher can undo to any version in history, not just the immediately previous one.

### Restore from archive:

1. Publisher or admin changes status from `archived` to `published`.
2. New version created: `change_type = restored`.
3. Entity re-enters the publish pipeline.
4. All downstream engines notified via `EntityRestored` event.

### Version rollback (explicit):

1. Publisher selects a specific past version from version history.
2. System shows diff between current state and selected version.
3. Publisher confirms rollback.
4. New version created with all content from the selected version, `change_type = restored, change_summary = "Rolled back to version N from [date]"`.
5. The rolled-back version and all intermediate versions remain in history — they are not deleted.

### Draft recovery:

1. On next session open, if unpublished auto-save exists newer than the last manual save:
2. Publisher sees: "You have unsaved changes from [time]. Restore them?"
3. If yes: auto-save content restored, treated as current draft.
4. If no: auto-save discarded, manual save version restored.

---

## Version Health

Health checks related to versioning:

| Check | Severity | Why it matters |
|---|---|---|
| Published story not backed up (no snapshot) | Error | Cannot recover if data is corrupted |
| Version history gap detected | Warning | Versions appear to be missing — possible data integrity issue |
| AI changes applied without publisher review | Warning | Publisher may not be aware of AI-generated content in their live story |
| Pending AI suggestion older than 14 days | Info | Publisher has unreviewed AI suggestions |
| Many versions with no published version | Info | Entity has been heavily edited but never published |

---

## Future — Collaboration

The version system is designed to support multi-author collaboration in future.

**Branching:** Multiple editors work on separate branches of the same entity. Each branch maintains its own version history. Branches are merged when ready.

**Merge conflicts:** If two editors change the same field simultaneously, the system flags a conflict and presents both versions for manual resolution. Resolution creates a new merge version.

**Approval chains:** Enterprise: before publishing, content must pass through one or more named approvers. Each approval creates a version entry.

**Comments:** Future: editors can attach comments to a version. Comments explain the reasoning behind a change.

**Digital signatures:** Enterprise/compliance: a version can be digitally signed to prove it was approved by a specific person at a specific time.

---

## Engine Relationships

| Engine | Versioning role |
|---|---|
| **Identity Engine** | Versions of Founder and Business profiles |
| **Publishing Engine** | Versions of Stories, Library Items, Ideas, Media |
| **Knowledge Engine** | Versions of Knowledge Graph nodes and relationship records |
| **Partner Engine** | Versions of Recommendations, Programs, Campaigns — approval history is critical |
| **AI Orchestration Engine** | Creates ai_suggested and ai_applied version entries. Records which agent made each change. |
| **Automation Engine** | Creates auto_updated version entries for scheduled changes |
| **Import Engine** | Creates import_updated version entries when external content is updated |
| **Analytics Engine** | Reads version history to understand content evolution vs. performance changes |
| **SEO Engine** | Reads version history to detect SEO regressions after content updates |
| **GEO Engine** | Reads version history to maintain entity definition accuracy over time |
| **Widget Engine** | Reads version history to update widget content when published versions change |
| **Admin Engine** | Full access to all version history for audit and compliance |

---

## Development Rules

Every future feature must answer:

1. Does this feature change an entity's content? → Create a version record.
2. Who is the `created_by`? Publisher, AI, Automation or Admin?
3. Is this an AI-generated change? If so, has it been `publisher_reviewed`?
4. Is this change significant enough to be shown in version history to the publisher?
5. Does this change require approval? If so, who approves?
6. Can this change be undone? If so, what does recovery look like?
7. Should this change appear in the audit trail?
8. Does this change affect the published version? If so, which downstream engines need to be notified?

---

*This document is the permanent versioning contract for the CULO Operating System. Every change to every entity is governed by the principles defined here.*
