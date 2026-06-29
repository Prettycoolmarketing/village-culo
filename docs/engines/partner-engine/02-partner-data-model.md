# CULO Partner Engine — Part 2: Data Model & Architecture

**Version:** 1.0  
**Status:** Architectural Blueprint — Pre-Implementation  
**Engine:** Partner Engine (Phase 2)  
**Depends on:** 01-partner-engine-blueprint.md, 00-engine-blueprint.md  

---

## Purpose

This document defines every data object the Partner Engine will own, how they relate to each other, and how they extend the existing CULO platform.

No database tables are created yet. No code is written yet.

This document is the authority that implementation sprints reference.

---

## Design Constraints

These constraints apply to every data decision in this document.

1. **Do not recreate existing objects.** `founders`, `businesses`, `stories`, `media_uploads`, `library_items`, `services` already exist. The Partner Engine extends them — it does not duplicate them.

2. **Every new table is owned by the Partner Engine.** Other engines may read; only the Partner Engine writes.

3. **JSONB column for full object storage.** All new tables follow the existing CULO convention: a `data JSONB NOT NULL` column stores the full typed object, and a minimal set of metadata columns (`id`, `user_id`, `status`, timestamps) are extracted for RLS and querying.

4. **UUID primary keys.** All IDs use `gen_random_uuid()` or `crypto.randomUUID()` on the client side. Slugs are separate fields, used for URLs only.

5. **Row-Level Security on every table.** Every table defines public read policies (for published/active records) and authenticated write policies.

6. **No foreign key enforcement at the database level** — all cross-table references are stored as IDs in JSONB and resolved in application logic. This matches the existing CULO approach.

---

## Existing Platform Objects — Extensions Required

The Partner Engine does not own these objects. It reads from them and, in some cases, adds metadata columns or joins.

### `stories` (Publishing Engine owns)

Partner Engine reads:
- `data` — full Story object (title, body, summary, topics, cover image, links)
- `status` — to determine if content is published and eligible for recommendation scanning
- `user_id` — to match publisher
- `founder_id` — to match publisher profile

No new columns on `stories`. Partner Engine stores its scan results in `brand_mentions`.

---

### `founders` (Identity Engine owns)

Partner Engine reads:
- `data` — full Founder object (name, topics, industries, location, bio)
- `status` — published founders are eligible for Partner Engine matching
- `user_id` — to identify which publisher account this profile belongs to

No new columns on `founders`. Partner Engine stores its publisher-specific data in `partner_publishers`.

---

### `businesses` (Identity Engine owns)

Partner Engine reads:
- `data` — full Business object (name, industry, location, website, topics)
- `status` — published businesses are eligible for Partner Engine discoverability

No new columns on `businesses`. Partner Engine stores its business-specific Partner data in `partners`.

---

## New Partner Engine Objects

These are the objects the Partner Engine creates and owns.

---

### Object 1 — Partner

A `Partner` is any external organisation participating in the Partner Network.

A Partner may or may not have a CULO Business Profile. An external SaaS tool without a Business Profile can still be a Partner if they have an affiliate program CULO tracks.

**Key fields:**

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `slug` | string | URL identifier (unique) |
| `name` | string | Display name |
| `description` | string | What this partner does |
| `website` | string | Partner website URL |
| `logo_url` | string | Logo image URL |
| `cover_url` | string | Cover image URL (optional) |
| `categories` | string[] | What types of things they offer (e.g., "software", "physical-product") |
| `industries` | string[] | Industries they serve |
| `topics` | string[] | Topics they relate to |
| `locations` | string[] | Countries or regions they serve |
| `culo_business_id` | UUID or null | If this Partner also has a CULO Business Profile, link it here |
| `status` | enum | `active`, `inactive`, `pending`, `suspended` |
| `verified` | boolean | CULO has verified this partner is legitimate |
| `affiliate_network` | string or null | If tracked through an affiliate network (e.g., "ShareASale", "Impact", "PartnerStack") |
| `external_program_url` | string or null | Direct URL to the partner's affiliate/referral program |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Supabase table:** `partners`

**Who creates it:** CULO admin (initially), self-serve registration in future.

**RLS:**
- Public read: `status = 'active'`
- Write: Admin only (initially), then authenticated business owner in future.

---

### Object 2 — Partner Program

A Partner Program is the specific commercial structure a Partner offers.

One Partner may offer multiple programs. Example: Canva has a public affiliate program and a separate ambassador program.

**Key fields:**

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `partner_id` | UUID | References `partners.id` |
| `name` | string | Program name (e.g., "Canva Affiliate Program") |
| `description` | string | What publishers get and what they do |
| `type` | enum | `affiliate`, `referral`, `ambassador`, `creator`, `sponsorship`, `gifting`, `lead-generation`, `community`, `custom` |
| `reward_type` | enum | `percentage`, `flat`, `product`, `service`, `access`, `custom` |
| `reward_value` | string | Human-readable description of the reward (e.g., "30% recurring commission") |
| `reward_currency` | string or null | ISO currency code if monetary |
| `tracking_url_template` | string or null | URL template with publisher placeholder (e.g., `https://canva.com?ref={publisher_id}`) |
| `approval_required` | boolean | Does the Partner approve each publisher before they join? |
| `auto_approve` | boolean | Can publishers self-join? |
| `application_url` | string or null | Where publishers apply if approval required |
| `restrictions` | string[] | Any restrictions (e.g., "No coupon sites", "AU/NZ only") |
| `eligible_locations` | string[] | Countries where program is available |
| `cookie_duration_days` | number or null | Attribution window |
| `minimum_payout` | number or null | Minimum earnings before payout |
| `payout_frequency` | string or null | e.g., "Monthly", "Weekly" |
| `status` | enum | `active`, `paused`, `closed` |
| `starts_at` | timestamp or null | |
| `ends_at` | timestamp or null | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Supabase table:** `partner_programs`

**RLS:**
- Public read: `status = 'active'`
- Write: Admin only (initially).

---

### Object 3 — Brand Mention

A Brand Mention is a detected reference to a brand, product, service, place or entity inside a Story.

Brand Mentions are created by the Knowledge Engine's entity detection. The Partner Engine reads them to find recommendation opportunities.

**Key fields:**

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `story_id` | UUID | References `stories.id` |
| `user_id` | UUID | The publisher who wrote the story |
| `founder_id` | UUID | The founder profile linked to the story |
| `entity_name` | string | The detected entity (e.g., "Canva", "Nike", "James Clear") |
| `entity_type` | enum | `brand`, `product`, `software`, `service`, `person`, `place`, `event`, `community`, `media` |
| `context_excerpt` | string | The sentence or phrase where the mention was detected |
| `confidence_score` | number | 0–1 confidence that this is a real mention (not incidental) |
| `partner_id` | UUID or null | If this entity matched a known Partner |
| `partner_program_id` | UUID or null | If a specific program matched |
| `detection_source` | enum | `nlp`, `link`, `manual`, `image-tag` |
| `url_found` | string or null | If a link to this entity was found in the story |
| `status` | enum | `detected`, `matched`, `no-match`, `ignored` |
| `created_at` | timestamp | |

**Supabase table:** `brand_mentions`

**RLS:**
- Read: Owner (`user_id = auth.uid()`) or admin.
- Write: System / admin only (publishers do not manually create brand mentions).

---

### Object 4 — Recommendation

A Recommendation is the formal record of a publisher endorsing something inside CULO.

Recommendations are created after a Brand Mention is matched to a Partner and the publisher approves.

**Key fields:**

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | The publisher |
| `founder_id` | UUID | The founder profile |
| `story_id` | UUID | The story where the recommendation appears |
| `brand_mention_id` | UUID or null | The Brand Mention that triggered this |
| `partner_id` | UUID or null | The matched Partner |
| `partner_program_id` | UUID or null | The specific program joined |
| `entity_name` | string | What is being recommended (display name) |
| `entity_type` | enum | Same enum as Brand Mention |
| `disclosure_type` | enum | `affiliate`, `referral`, `gifted`, `sponsored`, `community-partner`, `personal-recommendation` |
| `disclosure_text` | string | Plain-English disclosure shown to readers |
| `partner_link` | string or null | The tracked affiliate/referral link |
| `original_link` | string or null | The original untracked link in the story |
| `approval_status` | enum | `pending`, `approved`, `rejected`, `expired`, `withdrawn` |
| `approved_at` | timestamp or null | When the publisher approved |
| `rejected_at` | timestamp or null | |
| `rejection_reason` | string or null | Optional reason |
| `withdrawn_at` | timestamp or null | If publisher later removed it |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Supabase table:** `recommendations`

**RLS:**
- Read: Owner (`user_id = auth.uid()`) for full record. Public read of `approved` recommendations via story context.
- Write: Owner creates/updates. System creates suggestions.

---

### Object 5 — Publisher Partner Profile

Stores the Partner Engine-specific settings and history for each publisher.

**Key fields:**

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | The publisher's auth user ID (unique) |
| `founder_id` | UUID | Their CULO founder profile |
| `partner_centre_enabled` | boolean | Has this publisher enabled the Partner Centre? |
| `recommendation_suggestions_enabled` | boolean | Do they want suggestions? |
| `preferred_disclosure_type` | enum or null | Their default disclosure preference |
| `preferred_categories` | string[] | What categories they're most likely to recommend |
| `preferred_topics` | string[] | Which topics they focus on |
| `preferred_locations` | string[] | Relevant locations for partner matching |
| `payout_email` | string or null | Email for payouts (may differ from login email) |
| `payout_method` | string or null | e.g., "stripe", "paypal", "bank" (future) |
| `total_earnings` | number | Lifetime earnings (in base currency) |
| `pending_earnings` | number | Not yet approved for payout |
| `paid_earnings` | number | Paid out to publisher |
| `recommendation_count` | number | Total recommendations approved |
| `trust_score` | number | 0–100 internal score (not shown publicly yet) |
| `status` | enum | `active`, `suspended`, `inactive` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Supabase table:** `publisher_partner_profiles`

**RLS:**
- Read/Write: Owner only (`user_id = auth.uid()`). Admin read.

---

### Object 6 — Publisher Partner Membership

Tracks which programs a publisher has joined.

**Key fields:**

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | The publisher |
| `partner_id` | UUID | The Partner |
| `partner_program_id` | UUID | The specific program |
| `status` | enum | `applied`, `approved`, `rejected`, `active`, `paused`, `ended` |
| `publisher_tracking_id` | string or null | The publisher's unique ID within this program |
| `tracking_link_base` | string or null | Their specific affiliate/referral link base |
| `joined_at` | timestamp or null | When they were approved |
| `ended_at` | timestamp or null | |
| `notes` | string or null | |
| `created_at` | timestamp | |

**Supabase table:** `publisher_partner_memberships`

**RLS:**
- Read/Write: Owner only.

---

### Object 7 — Earnings

A single earnings event — a confirmed commission or reward earned by a publisher.

**Key fields:**

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | The publisher who earned |
| `recommendation_id` | UUID | The recommendation that generated this |
| `partner_id` | UUID | The Partner |
| `partner_program_id` | UUID | The Program |
| `conversion_type` | enum | `sale`, `signup`, `lead`, `install`, `subscription`, `custom` |
| `gross_amount` | number | Total conversion value (in partner's currency) |
| `commission_rate` | number | Rate applied (e.g., 0.30 for 30%) |
| `publisher_amount` | number | Amount due to publisher |
| `culo_amount` | number | CULO's share |
| `currency` | string | ISO currency code |
| `source` | enum | `api`, `manual-import`, `csv-upload`, `webhook` |
| `conversion_id` | string or null | Partner's own ID for this conversion |
| `conversion_at` | timestamp or null | When the conversion occurred |
| `status` | enum | `pending`, `approved`, `paid`, `reversed`, `disputed` |
| `payout_id` | UUID or null | References `payouts.id` when paid |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Supabase table:** `earnings`

**RLS:**
- Read: Owner only.
- Write: Admin / system only.

---

### Object 8 — Payout

A grouped payment to a publisher covering one or more Earnings records.

**Key fields:**

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | The publisher |
| `amount` | number | Total payout amount |
| `currency` | string | ISO currency code |
| `method` | string | e.g., "stripe", "paypal", "bank-transfer" |
| `status` | enum | `scheduled`, `processing`, `paid`, `failed`, `cancelled` |
| `reference` | string or null | Payment reference or transaction ID |
| `earnings_ids` | UUID[] | All Earnings records included in this payout |
| `scheduled_at` | timestamp or null | |
| `paid_at` | timestamp or null | |
| `notes` | string or null | |
| `created_at` | timestamp | |

**Supabase table:** `payouts`

**RLS:**
- Read: Owner only.
- Write: Admin / system only.

---

### Object 9 — Campaign

A targeted opportunity a Village Pro Business creates for eligible Publishers.

**Key fields:**

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `partner_id` | UUID | The Partner running this campaign |
| `name` | string | Campaign name |
| `description` | string | What they want publishers to do |
| `objective` | string | e.g., "Mention our product in a story about home office setups" |
| `reward_description` | string | What publishers receive |
| `reward_type` | enum | Same as Partner Program reward types |
| `requirements` | string[] | What publishers must do |
| `eligible_topics` | string[] | Topics that make a publisher eligible |
| `eligible_industries` | string[] | Industries that make a publisher eligible |
| `eligible_locations` | string[] | Countries/regions |
| `minimum_recommendations` | number or null | Minimum number of existing recommendations required |
| `max_publishers` | number or null | Cap on how many publishers can join |
| `current_publishers` | number | Counter |
| `status` | enum | `draft`, `active`, `paused`, `completed`, `cancelled` |
| `starts_at` | timestamp | |
| `ends_at` | timestamp | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Supabase table:** `campaigns`

**RLS:**
- Public read: `status = 'active'`
- Write: Admin only (initially), then authenticated partner in future.

---

### Object 10 — Campaign Application

A publisher applying to join a Campaign.

**Key fields:**

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `campaign_id` | UUID | The Campaign |
| `user_id` | UUID | The Publisher |
| `founder_id` | UUID | |
| `status` | enum | `applied`, `approved`, `rejected`, `completed` |
| `applied_at` | timestamp | |
| `reviewed_at` | timestamp or null | |
| `completed_at` | timestamp or null | |
| `notes` | string or null | |

**Supabase table:** `campaign_applications`

**RLS:**
- Read: Owner or admin.
- Write: Owner creates (apply). Admin updates (approve/reject).

---

## Relationships Diagram

```
partners
   │
   ├── partner_programs (many per partner)
   │
   └── campaigns (many per partner)

stories (Publishing Engine)
   │
   └── brand_mentions (many per story, created by Knowledge Engine scan)
            │
            └── recommendations (one per approved brand mention)
                     │
                     ├── earnings (many per recommendation)
                     │       │
                     │       └── payouts (grouped earnings)
                     │
                     └── partner_link (generated from publisher_partner_memberships)

founders (Identity Engine)
   │
   └── publisher_partner_profiles (one per founder in Partner Engine)
            │
            └── publisher_partner_memberships (many per publisher, one per program joined)
```

---

## Entity Detection Flow

This is how a Brand Mention is created.

```
Story published
      │
      ▼
Knowledge Engine scans story content
(title + summary + body + links + captions + transcript)
      │
      ▼
NLP / pattern matching identifies entity candidates
      │
      ▼
For each entity candidate:
  └── Confidence score calculated
        ├── Score < threshold → discard
        └── Score ≥ threshold → create Brand Mention

For each Brand Mention:
  └── Query partners table for name match
        ├── No match → Brand Mention status = 'no-match'
        └── Match found
              └── Query partner_programs for active programs
                    ├── No active programs → Brand Mention status = 'matched' (no suggestion yet)
                    └── Active programs found
                          └── Check publisher eligibility (location, topics, history)
                                ├── Not eligible → log, no notification
                                └── Eligible → create Recommendation (status: pending)
                                                        │
                                                        ▼
                                              Notify publisher
                                              (in-app + email)
```

---

## Permissions Model

| Action | Visitor | Publisher (own) | Publisher (other) | Admin |
|---|---|---|---|---|
| View active Partner | ✓ | ✓ | ✓ | ✓ |
| View Partner Program | ✓ | ✓ | ✓ | ✓ |
| View own Recommendations | — | ✓ | — | ✓ |
| Approve Recommendation | — | ✓ | — | ✓ |
| Reject Recommendation | — | ✓ | — | ✓ |
| View own Earnings | — | ✓ | — | ✓ |
| View own Payouts | — | ✓ | — | ✓ |
| View Campaign | ✓ | ✓ | ✓ | ✓ |
| Apply to Campaign | — | ✓ | — | ✓ |
| Create Partner | — | — | — | ✓ |
| Create Program | — | — | — | ✓ |
| Create Campaign | — | — | — | ✓ (partner later) |
| Create Brand Mention | — | — | — | System |
| Create Recommendation | — | — | — | System |
| Approve Payout | — | — | — | ✓ |

---

## Supabase Table List — Partner Engine

When implementation begins, these tables are created in this order (respecting dependencies):

| Order | Table | Depends on |
|---|---|---|
| 1 | `partners` | none |
| 2 | `partner_programs` | `partners` |
| 3 | `publisher_partner_profiles` | `founders` (Identity Engine) |
| 4 | `publisher_partner_memberships` | `partners`, `partner_programs`, `publisher_partner_profiles` |
| 5 | `brand_mentions` | `stories` (Publishing Engine) |
| 6 | `recommendations` | `brand_mentions`, `partners`, `partner_programs` |
| 7 | `campaigns` | `partners` |
| 8 | `campaign_applications` | `campaigns` |
| 9 | `earnings` | `recommendations` |
| 10 | `payouts` | `earnings` |

---

## Future Expansion

These objects are anticipated but not defined yet. They will be added to this document when their design is complete.

| Object | Purpose |
|---|---|
| `partner_analytics_events` | Granular click/conversion event log |
| `recommendation_withdrawals` | Audit trail for publisher withdrawals |
| `partner_verification_records` | Verification data for trusted partners |
| `partner_payouts` | When partners pay CULO (vs CULO paying publishers) |
| `partner_contacts` | Individual contact records within a partner company |
| `recommendation_link_clicks` | Per-click attribution log |
| `partner_invitations` | When a Partner invites a specific Publisher |
| `publisher_trust_scores` | Detailed trust score history |

---

*This document defines the complete data architecture for the Partner Engine. No tables are created until document 12 (Implementation Sprint). All schemas are subject to refinement during planning documents 03–11.*
