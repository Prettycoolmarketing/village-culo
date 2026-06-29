# CULO Partner Engine — Part 4: Publisher Partner Centre

**Version:** 1.0  
**Status:** Architectural Blueprint — Pre-Implementation  
**Engine:** Partner Engine (Phase 2)  
**Depends on:** 01-partner-engine-blueprint.md, 02-partner-data-model.md, 03-partner-automations.md  

---

## Philosophy

Publishers should never have to think about affiliate marketing.

They should publish great content, review opportunities as they arrive, approve the ones that fit, and watch relationships and earnings grow.

The Partner Centre is not a dashboard for managing links. It is a business relationship centre — a place where a publisher understands who they influence, what their recommendations are worth, and what opportunities exist for them based on what they already publish.

---

## Access

The Partner Centre is available to all CULO Creatives members (Village Pro publishers).

- Active Village Pro membership → full Partner Centre access.
- No membership → Partner Centre visible as a locked preview with upgrade prompt.
- Free-tier publishers (if introduced in future) → view suggestions only, cannot approve affiliate/referral recommendations.

Access is controlled by the Identity Engine, not the Partner Engine. Partner Engine reads membership status from publisher profile.

---

## Dashboard Overview

On first open, the Partner Centre answers four questions:

1. How much have I earned and what's pending?
2. What needs my attention right now?
3. Which businesses are interested in me?
4. What opportunities exist that I haven't explored?

Every element on the home screen traces back to one of these four questions. Nothing decorative. Nothing that requires action to remove.

---

## Section 1 — Home

The home screen is a summary layer only. Every item is clickable and leads to a deeper section.

### Overview Cards (top row):

| Card | Value shown | Links to |
|---|---|---|
| Monthly Earnings | This calendar month, publisher amount | Earnings section |
| Pending Earnings | Awaiting approval / not yet paid | Earnings → Pending filter |
| Approved Recommendations | Total across all stories | Recommendations → Approved filter |
| Pending Reviews | Recommendations awaiting publisher action | Recommendations → Pending filter |
| Business Invitations | Businesses who have sent an invitation | Businesses section |
| Campaign Opportunities | Active campaigns the publisher is eligible for | Campaigns section |

### Recommendation Score Card:

A single number (0–100) representing the quality and consistency of the publisher's recommendation history.

Factors (not displayed individually — shown as a composite):
- Authenticity index (ratio of personal-recommendation to commercial disclosures)
- Consistency (regular publishing pace)
- Conversion quality (conversions per click, not just click volume)
- Diversity (recommendations across multiple categories)

Not a gamification mechanic. It is a signal used by the Partner Engine to improve match quality and programme eligibility.

### Recent Activity Feed:

A chronological list of the last 10 events:
- Recommendation approved
- Recommendation suggestion received
- Conversion recorded
- Business viewed publisher profile
- Campaign opportunity matched
- Earnings updated
- Payout scheduled

Each event is a one-line summary with a timestamp and a link to the relevant section.

---

## Section 2 — Recommendations

The full list of every Recommendation the Partner Engine has created for this publisher — pending, approved, rejected, expired and broken.

### Status Filters:

| Status | Meaning |
|---|---|
| Pending | Suggestion waiting for publisher review |
| Approved | Publisher has approved — disclosure applied, tracking active |
| Rejected | Publisher declined — archived, not re-suggested unless context changes |
| Expired | Program ended or Partner became inactive |
| Broken | Partner link returning error — action required |
| Missing Disclosure | Approved but disclosure not applied in story — action required |

### For each Recommendation, show:

**Summary view (list):**
- Story title + cover thumbnail
- Detected entity name and type
- Status badge
- Disclosure type (if approved)
- Earnings total (if any)
- Last activity date

**Expanded view (on click):**
- Full story preview
- Context excerpt: the exact text where the entity was detected
- Why this was suggested (e.g., "Canva was mentioned 3 times in this story")
- Partner details: name, description, programs available
- Disclosure preview: what readers will see
- Estimated opportunity (not guaranteed earnings — shown as a range based on program performance)
- Approval history: when suggested, any previous action taken

### Actions available:

| Action | Available when |
|---|---|
| Approve | Status = Pending |
| Edit disclosure type | Status = Pending or Approved |
| Reject | Status = Pending |
| View Story | Always |
| Edit Story | Always |
| Withdraw | Status = Approved |
| Report issue | Always |

### Approval Flow (inline, not a separate page):

1. Publisher clicks "Review" on a pending recommendation.
2. Inline panel expands showing: entity, why suggested, partner details, disclosure options.
3. Publisher selects disclosure type (or accepts default).
4. Publisher reads disclosure preview text.
5. Publisher clicks "Approve".
6. Confirmation state: "Recommendation approved. Disclosure applied to your story."
7. Story automatically updated in background.

Nothing navigates away from the Recommendations section during this flow.

---

## Section 3 — My Partners

All businesses and brands with an active relationship to this publisher.

A relationship exists when:
- Publisher has at least one approved recommendation for this partner, OR
- Publisher has an active membership in a partner program, OR
- Publisher has applied to a campaign from this partner.

### For each Partner card, show:

- Logo and name
- Relationship type (affiliate, referral, ambassador, etc.)
- Programs joined (list of program names)
- Recommendations published (count)
- Total clicks (aggregate)
- Total conversions (aggregate)
- Revenue generated (total publisher earnings from this partner)
- Latest activity date

### On click — Partner detail page:

- Full partner description
- All programs joined with current status
- All recommendations linked to this partner (across all stories)
- Full analytics: clicks over time, conversions over time, earnings over time
- Option to manage membership (pause, leave)
- Option to message partner (future)

---

## Section 4 — Opportunities

Recommendations and Programs the Partner Engine believes fit this publisher but have not been actioned yet.

Opportunities are generated by Automation 12 (Partner Match Suggestions) and Automation 14 (Campaign Match).

### Categories shown:

- **Programs** — Partner Programs the publisher is eligible for based on their content and profile.
- **Campaigns** — Active campaigns with matching eligibility.
- **Brands to connect with** — Partners who have mentioned interest in this publisher's topics or location.
- **Retroactive suggestions** — Brand mentions in older stories where a Partner now exists that wasn't in the system when the story was published.

### For each Opportunity card, show:

- Partner / Campaign name and logo
- Opportunity type
- One-sentence description
- Why it was suggested: "You mentioned this tool in 4 stories" or "This campaign matches your Home Office topic"
- Estimated reward (if applicable)
- CTA: "Review" (leads to Recommendations section), "Apply" (for campaigns), "Learn more"

### Sort and filter:

- By category (Programs / Campaigns / Brand Connections)
- By topic
- By potential earnings
- By match quality (highest confidence first)

---

## Section 5 — Earnings

Full earnings history and balance overview.

### Summary cards (top):

| Card | Value |
|---|---|
| Today | Earnings since midnight |
| This week | Current calendar week |
| This month | Current calendar month |
| Lifetime | All-time publisher earnings |
| Pending | Earned but not yet approved for payout |
| Approved | Approved, awaiting payout |
| Paid | Paid out to publisher |

### Earnings table:

Each row is one Earnings record.

Columns:
- Date
- Partner name
- Story title
- Conversion type (sale, signup, lead, etc.)
- Gross amount
- Commission rate
- Publisher amount
- Status

Filters:
- Date range
- Partner
- Conversion type
- Status (pending / approved / paid / reversed)

### Export:

CSV export of all earnings records. For tax reporting.

---

## Section 6 — Analytics

Performance data for the publisher's entire recommendation portfolio.

### Overview charts:

| Chart | Metric | Time range |
|---|---|---|
| Earnings over time | Publisher earnings by week | Last 12 months |
| Clicks over time | Total partner link clicks | Last 12 months |
| Conversions over time | Total conversions attributed | Last 12 months |
| Recommendation activity | Approvals and suggestions | Last 12 months |

### Performance breakdowns:

**By Partner:**
- Which partners generate the most clicks
- Which partners generate the most conversions
- Which partners generate the most earnings

**By Story:**
- Which stories generate the most partner clicks
- Which stories generate the most conversions
- Top-performing stories by earnings

**By Category:**
- Which recommendation categories perform best (software, physical products, services, etc.)

**By Topic:**
- Which content topics drive partner performance

**By Disclosure Type:**
- Distribution of affiliate / referral / personal-recommendation approvals

### Trust indicators (publisher-only view):

- Rejection rate (how often publisher rejects suggestions — not shown publicly)
- Withdrawal rate (how often publisher removes approved recommendations)
- Average days to approve or reject a suggestion

These metrics exist to improve match quality, not to penalise the publisher.

---

## Section 7 — Businesses

Village Pro Businesses that have interacted with, expressed interest in, or are matched to this publisher.

This is distinct from My Partners. Partners are confirmed relationships. Businesses here are potential relationships or inbound interest.

### Sub-tabs:

**Invitations:** Businesses that have sent a specific invitation to this publisher to join their program or campaign.

**Interested:** Businesses whose topics, industry or location closely match this publisher's profile (engine-suggested, no explicit invitation yet).

**Viewing my profile:** Businesses who have viewed this publisher's profile in the Partner Directory (future, requires analytics event).

### For each Business card, show:

- Business name and logo
- Industry and location
- Which programs they offer
- Why matched: "Your Sustainable Living topic overlaps with their product range"
- CTA: "View Profile", "Explore Programs", "Connect" (future)

---

## Section 8 — Campaigns

Active and historical campaigns this publisher is eligible for, applied to, or has completed.

### Status tabs:

| Tab | Content |
|---|---|
| Available | Campaigns matching publisher's eligibility, not yet applied |
| Applied | Applications submitted, awaiting business approval |
| Active | Approved campaigns the publisher is participating in |
| Completed | Past campaigns |
| Expired | Campaigns that ended before publisher applied |

### Campaign card (Available):

- Campaign name
- Partner / Business name and logo
- Objective (one sentence)
- Reward description
- Deadline
- Why eligible: matched topics / industries / locations
- CTA: "View Details", "Apply"

### Campaign application flow:

1. Publisher clicks "Apply".
2. Short application form: how they plan to fulfill the campaign objective.
3. Publisher submits.
4. Status moves to "Applied".
5. Business reviews and approves or declines.
6. Publisher notified.

---

## Section 9 — Settings

Publisher-controlled preferences for the Partner Centre.

### Recommendation Preferences:

| Setting | Description |
|---|---|
| Recommendation suggestions | On / Off — receive Partner Engine suggestions |
| Auto-review | Off by default — future: auto-approve personal-recommendation type only |
| Default disclosure type | Publisher's preferred default (can always change per recommendation) |
| Preferred categories | Which categories to prioritise in suggestions |

### Notification Preferences:

| Notification | Channel | Default |
|---|---|---|
| New recommendation opportunity | In-app + email | On |
| Pending review reminder | Email | On — weekly digest |
| Earnings update | In-app + email | On |
| Payout scheduled | Email | On |
| Campaign opportunity | In-app + email | On |
| Business invitation | In-app + email | On |
| Health check issues | In-app + email | On |

### Payout Settings (future):

- Payout email address
- Payout method (Stripe / PayPal / bank transfer)
- Minimum payout threshold (above platform minimum)
- Preferred payout currency

### Privacy Settings:

- Whether to allow Village Pro Businesses to see that this publisher mentioned them (default: yes, for approved recommendations; always anonymised for brand mentions that are not approved)
- Whether to appear in the Publisher Directory visible to businesses

---

## Trust Score — Detailed Definition

The Trust Score (0–100) is an internal signal used to improve partner matching. It is not displayed publicly in Phase 2.

**Factors:**

| Factor | Weight | Description |
|---|---|---|
| Authenticity | 30% | Ratio of personal-recommendation disclosures to commercial disclosures |
| Publishing consistency | 20% | Regular publishing pace; sustained vs. burst-then-silence |
| Recommendation quality | 20% | Conversion rate of approved recommendations (not just clicks) |
| Diversity | 15% | Recommendations span multiple categories, not just one partner repeatedly |
| Responsiveness | 15% | How quickly publisher reviews suggestions (slow response degrades score) |

**Effect of Trust Score:**

- Higher score → better partner programs suggested.
- Higher score → higher priority in Campaign matching.
- Future: Visible Trust Badge for publishers who consistently earn high scores.

---

## Engine Connections

The Publisher Partner Centre reads from and writes to:

| Engine | Connection |
|---|---|
| **Publishing Engine** | Reads story list and story content. Writes disclosure updates back to stories on approval. |
| **Knowledge Engine** | Reads entity detection results that power suggestion reasons. |
| **Partner Engine** | Primary source — all recommendations, programs, earnings, memberships. |
| **Analytics Engine** | Reports approval, rejection, click and conversion events. |
| **Automation Engine** | Triggers notifications on all approval, earnings and campaign events. |
| **Identity Engine** | Reads Village Pro membership status to gate access. |
| **SEO Engine** | Publisher's approved recommendations contribute to their profile page SEO. |
| **Widget Engine** | Publisher can embed approved recommendations in their website widget. |
| **Distribution Engine** | Story republished after disclosure is applied. |

---

## Future Integrations

| Integration | When | Description |
|---|---|---|
| Canva | Phase 6 | Approved recommendation cards auto-generated as Canva designs |
| Website Widget | Phase 8 | Approved recommendations embedded on publisher's website with disclosure |
| Email digest | Phase 7 | Weekly earnings and activity summary email |
| Stripe | Phase 2+ | Direct payout integration |
| CRM | Future | Publisher can connect their CRM to log partner interactions |
| Community Events | Future | Campaign attendance and event recommendations tracked |
| AI Insights | Future | "Based on your content, here are 3 partners you should know about" |

---

*This document defines the complete Publisher Partner Centre before any development begins. No UI components are created until the Implementation Sprint (document 12).*
