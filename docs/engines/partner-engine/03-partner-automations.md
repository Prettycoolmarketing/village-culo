# CULO Partner Engine — Part 3: Automation Blueprint

**Version:** 1.0  
**Status:** Architectural Blueprint — Pre-Implementation  
**Engine:** Partner Engine (Phase 2)  
**Depends on:** 01-partner-engine-blueprint.md, 02-partner-data-model.md  

---

## Core Automation Principle

CULO may detect and suggest. The Publisher approves.

CULO must never silently monetise content.

Every monetised recommendation must follow this flow:

```
Detected → Suggested → Reviewed → Approved → Disclosed → Tracked
```

No step may be skipped. No step may be automated away. The Publisher is in control at every stage.

---

## Automation 1 — Publisher Enables Partner Centre

**Trigger:** Publisher chooses to enable earning from recommendations.

**Actions:**

1. Create `publisher_partner_profiles` record for this publisher.
2. Set `partner_centre_enabled = true`.
3. Ask which categories of brands, tools and businesses they genuinely recommend (populate `preferred_categories`).
4. Ask which topics they publish about (populate `preferred_topics`).
5. Ask which locations they're based in and serve (populate `preferred_locations`).
6. Set `recommendation_suggestions_enabled = true`.
7. Add Partner Centre section to publisher dashboard.
8. Trigger: Automation 12 — initial Partner Match Suggestions for existing published stories.

**State before:** Publisher has no `publisher_partner_profiles` record.  
**State after:** Publisher receives recommendation suggestions going forward.

---

## Automation 2 — Business Enables Village Pro

**Trigger:** Business chooses to become discoverable through Village Pro.

**Actions:**

1. Create `partners` record for this business, linking to existing `businesses` record via `culo_business_id`.
2. Collect program preferences: which types of programs they offer (affiliate, referral, ambassador, creator, sponsorship, gifting).
3. For each program type selected, create a `partner_programs` record with provided terms.
4. Set discoverability preferences (topics, industries, eligible locations).
5. Set `status = 'active'` on the partner record.
6. Add business to the recommendation matching pool.
7. Add Village Pro section to business dashboard.
8. Trigger: Automation 12 — match new partner against existing published stories for any existing publisher.

**State before:** Business exists in `businesses` but has no `partners` record.  
**State after:** Business is discoverable in the Partner Engine.

---

## Automation 3 — Story Published

**Trigger:** Publisher publishes a Story (status changes to `published` or `featured`).

**Actions:**

1. Receive story ID, user ID, founder ID from Publishing Engine publish event.
2. Retrieve full story content: title, summary, body, transcript (if audio/video), captions, links, media metadata.
3. Pass content to Knowledge Engine for entity detection.
4. For each entity returned with confidence ≥ threshold:
   a. Create `brand_mentions` record with `entity_name`, `entity_type`, `context_excerpt`, `confidence_score`, `detection_source`.
   b. Query `partners` for name match (exact, then fuzzy).
   c. If no match: set `brand_mentions.status = 'no-match'`.
   d. If match found: set `brand_mentions.partner_id`, proceed to Automation 4.
5. Do not insert affiliate links automatically.
6. Do not notify publisher until Automation 4 confirms eligibility.

**What does NOT happen here:** No links are added. No disclosures are applied. No notifications are sent.

---

## Automation 4 — Recommendation Opportunity Found

**Trigger:** Brand Mention created with a matched Partner (from Automation 3).

**Actions:**

1. Check `partner_programs` for active programs linked to this partner.
2. If no active programs: log opportunity, set `brand_mentions.status = 'matched'`, no publisher notification.
3. If active programs exist:
   a. Check publisher eligibility for each program:
      - Location match (publisher location vs `partner_programs.eligible_locations`)
      - Topic match (publisher topics vs partner topics)
      - Category match
      - Any program-specific restrictions
   b. If not eligible for any program: log, no notification.
   c. If eligible for at least one program:
      - Create `recommendations` record with `approval_status = 'pending'`.
      - Set `entity_name`, `entity_type`, `story_id`, `partner_id`, `partner_program_id`.
      - Prepare suggestion data: why detected, what the program offers, disclosure preview.
      - Queue publisher notification (Automation Engine).
4. Show suggestion in Publisher Dashboard → Recommendations tab.
5. Show suggestion in Story review panel if publisher is editing.

---

## Automation 5 — Publisher Approves Recommendation

**Trigger:** Publisher clicks "Approve" on a pending recommendation.

**Actions:**

1. Update `recommendations.approval_status = 'approved'`, set `approved_at`.
2. Generate partner link:
   - Check `publisher_partner_memberships` for existing membership in this program.
   - If membership exists: use `tracking_link_base` from existing membership.
   - If no membership yet: create `publisher_partner_memberships` record, generate tracking link using program's `tracking_url_template`.
3. Set `recommendations.partner_link`.
4. Apply disclosure:
   - Set `recommendations.disclosure_type` (publisher's preference or program default).
   - Generate `recommendations.disclosure_text` (plain-English explanation).
5. Update the Story in the Publishing Engine: add disclosure label and partner link where the entity was mentioned.
6. Publishing Engine triggers Distribution Engine to republish updated story.
7. Update `publisher_partner_profiles.recommendation_count`.
8. Update Partner analytics.
9. Begin click tracking for this recommendation.
10. Add recommendation to Publisher's Partner Centre → Recommendations tab.
11. Notify business (Village Pro Business dashboard — Automation 13).

---

## Automation 6 — Publisher Rejects Recommendation

**Trigger:** Publisher clicks "Reject" or "Not for me" on a pending recommendation.

**Actions:**

1. Update `recommendations.approval_status = 'rejected'`, set `rejected_at`.
2. Store rejection reason if publisher provided one.
3. Remove suggestion from pending list.
4. Do not re-suggest the same partner for the same story unless the story is substantially updated.
5. Store rejection signal to improve future match quality (adjust confidence threshold for this publisher × partner combination).
6. No changes are made to the Story.
7. No notification is sent to the Partner.

---

## Automation 7 — Partner Link Clicked

**Trigger:** Visitor clicks a disclosed Partner Link on a published Story.

**Actions:**

1. Record click event:
   - `user_id` (publisher, not the visitor)
   - `recommendation_id`
   - `partner_id`
   - `story_id`
   - Timestamp
   - Source page URL
   - Referrer (anonymised)
2. Do not store visitor PII.
3. Redirect visitor to partner link destination.
4. Increment click counter on recommendation analytics.
5. Report click event to Analytics Engine.

**Privacy note:** Click logging records which story and which recommendation generated the click, not who clicked.

---

## Automation 8 — Conversion Reported

**Trigger:** Partner platform reports a conversion, OR manual/CSV import by admin.

**Actions:**

1. Receive conversion data: `conversion_id`, `publisher_tracking_id`, `gross_amount`, `currency`, `conversion_type`, `conversion_at`.
2. Match conversion to `publisher_partner_memberships` via `publisher_tracking_id`.
3. Match to specific `recommendations` record if possible (via story/click data).
4. Calculate earnings:
   - `publisher_amount = gross_amount × commission_rate`
   - `culo_amount = gross_amount × culo_rate`
5. Create `earnings` record with `status = 'pending'`.
6. Update `publisher_partner_profiles.pending_earnings`.
7. Report to Publisher Dashboard → Earnings tab.
8. Report conversion to Analytics Engine.
9. Notify publisher of new earnings.

---

## Automation 9 — Payout Ready

**Trigger:** Earnings pass the program's minimum payout threshold AND the scheduled payout date arrives.

**Actions:**

1. Identify all `earnings` records for this publisher with `status = 'approved'` above threshold.
2. Create `payouts` record with grouped `earnings_ids`.
3. Set `payouts.status = 'scheduled'`.
4. Update `earnings.status = 'paid'` for included records.
5. Update `publisher_partner_profiles.pending_earnings` and `paid_earnings`.
6. Notify publisher: payout scheduled, amount, expected date.
7. CULO admin receives payout queue notification.
8. Process payment via configured payout method (Stripe or manual in Phase 2).
9. On payment confirmed: set `payouts.status = 'paid'`, set `paid_at`.

---

## Automation 10 — Disclosure Applied

**Trigger:** Recommendation becomes approved and a partner link is generated.

**Actions:**

1. Confirm disclosure type is set on the Recommendation.
2. Generate disclosure text appropriate to type:
   - `affiliate` → "This publisher earns a commission if you purchase through this link."
   - `referral` → "This publisher earns a reward if you sign up through this link."
   - `gifted` → "This publisher received this product or service for free."
   - `sponsored` → "This publisher was compensated for this mention."
   - `community-partner` → "This publisher is affiliated with this organisation."
   - `personal-recommendation` → "This is a personal recommendation with no commercial arrangement."
3. Pass disclosure to Publishing Engine for inline placement in the Story.
4. Confirm disclosure is visible (not hidden, not collapsed by default).
5. If disclosure cannot be applied (e.g., story format doesn't support inline disclosure): flag for manual review, block recommendation approval until resolved.

**Non-negotiable:** Disclosure is never optional. If disclosure cannot be applied, the recommendation cannot be approved.

---

## Automation 11 — Brand Mention Intelligence

**Trigger:** Any Story mentions a brand or business (regardless of Partner match).

**Accumulated over time — for each entity detected:**

1. Track mention frequency (how many times a publisher has mentioned this entity).
2. Track mention context (positive, neutral, instructional — future sentiment analysis).
3. Track which topics appear alongside this entity across all publishers.
4. Track which publishers are mentioning the same entity.
5. Track story volume per entity (how much content exists about this entity in the Village).
6. Store accumulated data in `brand_mentions` and Knowledge Engine entity records.

**Used for:**
- Improving future partner match quality.
- Identifying which brands have organic traction in the Village (for CULO to proactively recruit as Partners).
- Publisher insights: "You've mentioned Notion 12 times — here's a partner opportunity."
- Village insights: which brands are part of the founder community conversation.

---

## Automation 12 — Partner Match Suggestions

**Trigger:** Publisher enables Partner Centre (Automation 1), OR new Partner is added, OR publisher publishes new content.

**Actions:**

1. Retrieve publisher's `preferred_topics`, `preferred_categories`, `preferred_locations`.
2. Retrieve all stories published by this publisher.
3. Retrieve all `brand_mentions` for those stories with `status = 'matched'` or `'no-match'`.
4. For `no-match` mentions: re-check against newly added Partners (Partner database grows over time).
5. For topic/category match: query `partners` and `partner_programs` for matches even without explicit brand mentions.
   - Example: Publisher writes frequently about "home office" topics → suggest home office product Partners.
6. For each eligible match: create or update `recommendations` record with `approval_status = 'pending'`.
7. Surface all new suggestions in Publisher Dashboard → Opportunities tab.
8. Send batch notification: "You have N new partner opportunities."

---

## Automation 13 — Business Receives Publisher Interest

**Trigger:** Publisher approves a recommendation for a Village Pro Business (Automation 5).

**Actions:**

1. Identify the `partner_id` from the approved Recommendation.
2. Check if this Partner is linked to a Village Pro Business (`partners.culo_business_id` is not null).
3. If linked:
   a. Add publisher to the business's "Recommending Publishers" list in their dashboard.
   b. Show the Story where the recommendation appeared.
   c. Show traffic and click data (aggregated, updated in real time).
   d. Notify business admin: "A publisher has recommended you."
4. If not linked (external partner): log for CULO admin review.

---

## Automation 14 — Campaign Match

**Trigger:** Business creates a Campaign (or publisher publishes new content).

**Actions:**

1. For new Campaign:
   a. Retrieve campaign eligibility criteria (`eligible_topics`, `eligible_industries`, `eligible_locations`).
   b. Query `publisher_partner_profiles` for publishers matching all criteria.
   c. For each matched publisher: surface campaign in their Opportunities tab.
   d. Send campaign notification: "A new opportunity matches your profile."

2. For new publisher content:
   a. Retrieve all active Campaigns.
   b. Check if publisher's new story topics/content match any Campaign's criteria.
   c. If match: add Campaign to publisher's Opportunities for this story specifically.

---

## Automation 15 — Recommendation Health Check

**Trigger:** Scheduled — runs weekly for every publisher with an active Partner Centre.

**Checks performed:**

1. **Broken links** — Test each `recommendations.partner_link` for HTTP errors. Flag broken links.
2. **Missing disclosures** — Find approved recommendations where disclosure is not applied in the story. Flag.
3. **Expired programs** — Find recommendations linked to `partner_programs` that have `ended_at` in the past. Mark as expired.
4. **Inactive partners** — Find recommendations linked to `partners` with `status != 'active'`. Flag.
5. **Old pending suggestions** — Find `recommendations` with `approval_status = 'pending'` older than 30 days. Send reminder or auto-expire.
6. **Stale memberships** — Find `publisher_partner_memberships` with no activity in 90 days. Surface for publisher review.

**Output:** Surfaced issues in Publisher Partner Centre → Recommendations tab with action required labels.

---

## Automation 16 — Partner Page Update

**Trigger:** New recommendation, story, publisher membership or campaign is created or updated.

**Actions:**

1. Identify which Partner is affected.
2. Update the Partner's public-facing page content:
   - Story count mentioning this partner.
   - Publisher count recommending this partner.
   - Latest stories mentioning this partner.
   - Active programs.
3. Update SEO Engine: regenerate structured data / JSON-LD for the Partner page.
4. Update GEO Engine: update entity definition with new relationship data.
5. Update search index for the Partner.

---

## Automation 17 — Canva Publish (Future)

**Trigger:** Canva API delivers published content to CULO.

**Actions:**

1. Receive structured Canva payload via webhook.
2. Pass to Publishing Engine to create Story.
3. Publishing Engine fires publish event.
4. Partner Engine receives publish event → Automation 3 (Story Published).
5. Entity detection runs on imported content.
6. Recommendation suggestions queued.

**Critical rule:** Do not delay Canva content from publishing while scans run. Scan asynchronously. Suggestions appear after publishing, not as a gate.

---

## Automation 18 — Website Widget (Future)

**Trigger:** Publisher's website widget requests updated content feed.

**Actions:**

1. Widget sends publisher ID + widget token to Widget Engine API.
2. Widget Engine retrieves approved recommendations for included stories.
3. For each approved recommendation: include disclosure label in widget data.
4. Track widget click events separately from in-Village clicks.
5. Attribution: widget clicks credited to publisher for earnings.

---

## Approval Rules Summary

| Scenario | Requires Explicit Publisher Approval |
|---|---|
| Affiliate link added to story | Yes — always |
| Referral link added to story | Yes — always |
| Sponsored link added to story | Yes — always |
| Any partner link added | Yes — always |
| Disclosure label added | Yes — always |
| Recommendation suggestion created | No — suggestions are passive |
| Brand mention recorded | No — mentions are informational |
| Campaign surfaced in Opportunities | No — campaigns are passive |
| Click tracked | No — clicks are events |
| Conversion recorded | No — conversions are events |
| Earnings created | No — earnings are records |

---

## Dashboard Notifications

### Publisher Sees:

| Notification | Trigger |
|---|---|
| "You have a new recommendation opportunity" | Automation 4 — match found |
| "Your recommendation is now earning" | Automation 8 — first conversion |
| "A partner link may be broken" | Automation 15 — health check |
| "Missing disclosure detected" | Automation 15 — health check |
| "A new campaign matches your profile" | Automation 14 — campaign match |
| "Your payout is scheduled" | Automation 9 — payout ready |
| "Your payout has been sent" | Automation 9 — payment confirmed |

### Business Sees:

| Notification | Trigger |
|---|---|
| "A publisher has recommended you" | Automation 13 — publisher approval |
| "Your campaign has been matched to N publishers" | Automation 14 — campaign match |
| "Your partner program is receiving traffic" | Automation 7 — link clicks |
| "A conversion was reported" | Automation 8 — conversion recorded |
| "A partner link is expired or broken" | Automation 15 — health check |

---

## Engine Dependencies

Every automation in this document relies on events from other engines:

| Engine | Provides |
|---|---|
| **Publishing Engine** | Publish events, story content, story updates |
| **Knowledge Engine** | Entity detection results, confidence scores |
| **Identity Engine** | Publisher profiles, business profiles, auth state |
| **Analytics Engine** | Receives all click, conversion and approval events |
| **Automation Engine** | Sends all notifications (email + in-app) |
| **Distribution Engine** | Republishes stories after disclosure is applied |
| **Widget Engine** | Receives widget click events |

---

*This document defines every automation that powers the Partner Engine before any implementation begins. All automations reference objects defined in 02-partner-data-model.md.*
