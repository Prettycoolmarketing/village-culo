# CULO Partner Engine — Part 5: Village Pro Business Centre

**Version:** 1.0  
**Status:** Architectural Blueprint — Pre-Implementation  
**Engine:** Partner Engine (Phase 2)  
**Depends on:** 01-partner-engine-blueprint.md, 02-partner-data-model.md, 03-partner-automations.md  

---

## Philosophy

Businesses do not pay to buy recommendations.

Businesses become discoverable.

Publishers choose who they recommend. Trust always comes before revenue.

Village Pro is not advertising. It is relationship building. A Village Pro Business that has ten authentic recommendations from publishers who genuinely love their product is worth more than ten paid placements in a directory no one trusts.

Village Pro increases opportunities. It never guarantees placement.

---

## Access

Village Pro is automatically included with an active CULO Creatives membership.

- Active CULO Creatives membership → Village Pro Business Centre access.
- No membership → Business profile visible in Village but not discoverable inside Partner Engine.
- Future self-serve option: Village Pro as a standalone business subscription.

---

## Business Journey

```
Business created
      │
      ▼
Village Pro enabled (with CULO Creatives membership)
      │
      ▼
Business profile completed
(name, logo, description, industry, location, website, topics)
      │
      ▼
Discovery preferences set
(which publisher types, topics and locations are relevant)
      │
      ▼
Partner programs configured (optional)
(affiliate / referral / ambassador / creator / sponsorship / gifting)
      │
      ▼
Campaigns created (optional)
      │
      ▼
Recommendations begin appearing
(from publisher content already published in the Village)
      │
      ▼
Analytics grow
      │
      ▼
Publisher relationships develop
      │
      ▼
Business renews or expands presence
```

---

## Dashboard Overview

On first open, the Village Pro Business Centre answers four questions:

1. Who is talking about my business and what are they saying?
2. Which publishers recommend me and what has that generated?
3. What campaigns do I have running and how are they performing?
4. What opportunities exist to deepen my Village presence?

---

## Section 1 — Home

The home screen is a summary layer. Every card links to a deeper section.

### Overview Cards (top row):

| Card | Value | Links to |
|---|---|---|
| Stories mentioning me | Count of published stories with a brand mention | Recommendations section |
| Publishers recommending me | Count of publishers with ≥1 approved recommendation | Publisher Network section |
| Recommendation requests | Pending publisher applications to campaigns | Campaigns section |
| Active campaigns | Running campaigns | Campaigns section |
| Traffic from Village | Estimated clicks from Village stories | Analytics section |
| Conversions | Attributed conversions this month | Analytics section |

### Trust Presence Card:

A snapshot of the business's organic Village footprint:
- Number of publishers who mentioned this business organically (before any program)
- Number of stories that mention this business
- Recency of last mention

This is the "earned media" picture — what exists independent of any program the business created.

### Recent Activity Feed:

Chronological list of the last 10 events:
- New publisher recommendation approved
- Campaign match found
- Traffic milestone reached
- Publisher applied to a campaign
- New story mentioning the business published
- Conversion recorded

---

## Section 2 — Business Profile

The business controls everything about how they appear in the Village.

### Basic Information:

| Field | Description |
|---|---|
| Business name | Display name |
| Tagline | One sentence — what the business does |
| Description | Full description (rendered in Village Business Profile and Partner Directory) |
| Logo | Square logo image |
| Cover image | Wide cover for profile header |
| Website | Primary URL |
| Social links | Instagram, LinkedIn, TikTok, YouTube (optional) |
| Contact email | Public contact (can differ from account email) |
| Location | City, country — used for location-based matching |

### Classification:

| Field | Description |
|---|---|
| Industries | Which industries this business operates in |
| Topics | Which content topics this business is relevant to |
| Business type | e.g., SaaS, Physical Product, Service, Community, Event |
| Product / Service categories | What the business sells or offers |
| Target audience | Who buys from them — used for publisher-audience matching |

### Verification:

- **Unverified:** Standard listing. No verification badge.
- **Verified:** CULO has confirmed the business is legitimate. Verification badge appears on profile and Partner Directory listing. Priority in matching.
- Verification process defined in document 10 (Legal & Compliance).

---

## Section 3 — Discoverability

Controls how the business appears in the Partner Engine's matching system.

### Publisher Matching Preferences:

| Setting | Description |
|---|---|
| Eligible topics | Which content topics should trigger matching |
| Eligible industries | Which publisher industry focus is relevant |
| Eligible locations | Which countries/regions publishers should be in |
| Audience types | What kind of audience the business wants to reach |
| Publisher tier | Whether to match any publisher or filter by trust score or activity level |

### Visibility:

| Setting | Description |
|---|---|
| Partner Directory visibility | Whether the business appears in the searchable Partner Directory |
| Campaign visibility | Whether campaigns are visible to publishers who haven't connected yet |
| Profile visibility | Whether non-publishers (visitors) can see the Village Pro Business profile |

### Entity Aliases:

List alternative names, product names or brand variations that should also be matched during entity detection.

Example: "Pretty Cool Marketing" might also be matched on "PCM" or a specific product name.

---

## Section 4 — Recommendation Programs

Businesses may configure one or more Partner Programs.

Programs are how a business structures the opportunity for publishers. Programs are optional — a business may choose to be discoverable without offering a formal program.

### Program Types Available:

| Type | Description |
|---|---|
| Affiliate | Publisher earns a commission on sales made through their link |
| Referral | Publisher earns a flat reward when someone they refer signs up |
| Ambassador | Long-term relationship — publisher represents the brand |
| Creator Program | Publisher receives products or services to create content |
| Sponsorship | Business pays publisher to mention them in specific content |
| Gifting | Business sends free products for honest review, no commercial obligation |
| Lead Generation | Business rewards publisher for sending qualified leads |
| Community Access | Business gives publisher access to their paid community |
| Custom | Any arrangement that doesn't fit above |

### For each Program, business configures:

| Field | Description |
|---|---|
| Program name | e.g., "Canva Affiliate Program" |
| Description | What publishers get and what they do |
| Reward type | Percentage, flat fee, product, service, access |
| Reward value | Human-readable (e.g., "30% recurring commission") |
| Reward currency | ISO currency code if monetary |
| Tracking link | URL template or external program link |
| Approval required | Whether business approves each publisher or auto-approves |
| Program URL | Where publishers formally apply (external) |
| Restrictions | Any limitations |
| Eligible locations | Countries the program is available in |
| Cookie duration | Attribution window in days |
| Minimum payout | If applicable |
| Status | Active / Paused / Closed |
| Start / End date | Optional campaign dates |

### Program lifecycle:

| Status | Description |
|---|---|
| Draft | Being configured, not yet live |
| Active | Available to eligible publishers |
| Paused | Temporarily unavailable |
| Closed | Program ended, existing memberships honoured |

---

## Section 5 — Publisher Network

Every publisher with a relationship to this business.

A relationship exists when:
- A publisher has an approved recommendation for this business.
- A publisher is a member of one of this business's programs.
- A publisher has applied to one of this business's campaigns.
- This business has invited a specific publisher.

### Publisher Network views:

**Recommending Publishers:**
Publishers who have at least one approved recommendation mentioning this business.

For each publisher:
- Name and avatar
- Founder profile link
- Stories recommending the business (list)
- Total clicks generated
- Total conversions generated
- Most recent recommendation date
- Disclosure types used

**Program Members:**
Publishers who have joined one of the business's programs.

For each publisher:
- Name and avatar
- Program joined
- Membership status
- Join date
- Activity level (clicks, conversions)

**Campaign Participants:**
Publishers who have applied to or been accepted into campaigns.

For each publisher:
- Name and avatar
- Campaign name
- Application status
- Completion status

**Invitations Sent:**
Publishers the business has directly invited to connect.

For each invitation:
- Publisher name
- Date sent
- Status (pending / accepted / declined)

---

## Section 6 — Campaigns

Businesses create Campaigns to target eligible publishers with a specific opportunity.

### What a Campaign is:

A campaign is an opportunity with a specific objective, a reward, and eligibility criteria. It is not an ad. It is a structured invitation for publishers who already talk about relevant topics.

### Campaign creation form:

| Field | Description |
|---|---|
| Campaign name | Internal name |
| Objective | What the business wants publishers to do (one sentence) |
| Content brief | Full brief — what to cover, tone, key messages, restrictions |
| Reward description | What publishers receive |
| Reward type | Same types as Partner Programs |
| Requirements | What publishers must do to receive reward |
| Eligible topics | Content topic match criteria |
| Eligible industries | Publisher industry match |
| Eligible locations | Country/region |
| Minimum trust score | Optional threshold (future) |
| Maximum publishers | Cap on campaign participation |
| Deadline | Campaign end date |
| Status | Draft / Active / Paused / Completed / Cancelled |

### Campaign lifecycle:

```
Draft (business building it)
      │
      ▼
Active (open to eligible publishers)
      │
      ├── Publishers apply
      │       │
      │       ▼
      │   Business reviews applications
      │       │
      │       ├── Approved → Publisher joins campaign
      │       └── Rejected → Publisher notified
      │
      ▼
Completed (deadline reached or max publishers met)
      │
      ▼
Archived
```

### Campaign analytics:

For each campaign:
- Applications received
- Applications approved
- Publishers active
- Stories published
- Total clicks
- Total conversions
- Total cost (rewards paid or committed)

---

## Section 7 — Recommendations

Every published recommendation mentioning this business.

This is the full record of organic Village presence — every time a publisher has mentioned the business in content, approved as a recommendation.

### Status filters:

| Status | Meaning |
|---|---|
| Published | Approved by publisher and live in Village |
| Pending | Suggested but publisher has not reviewed yet |
| Rejected | Publisher declined |
| Expired | Recommendation was approved but program or link became inactive |
| Withdrawn | Publisher removed a previously approved recommendation |

### For each Recommendation, show:

- Publisher name and avatar
- Story title + cover
- Story date
- Context excerpt: the exact text where the mention appeared
- Disclosure type applied
- Clicks from this recommendation
- Conversions from this recommendation
- Status badge

### Business view is read-only:

The business cannot edit, approve, or modify recommendations. They can only view.

The only action available: "Invite this publisher to a campaign" (surfaces a campaign invitation flow).

---

## Section 8 — Analytics

Full performance data across all Village recommendations, programs and campaigns.

### Overview metrics:

| Metric | Description |
|---|---|
| Story mentions | Total stories mentioning the business (with and without approved recommendation) |
| Publisher count | Total publishers who have mentioned or recommended the business |
| Recommendation count | Total approved recommendations live in Village |
| Total clicks | Aggregate clicks from all partner links |
| Total conversions | Aggregate conversions across all programs |
| Traffic trend | Month-over-month click growth |

### Breakdown charts:

**By Publisher:**
- Which publishers generate the most traffic
- Which publishers generate the most conversions
- Publisher relationship health

**By Story:**
- Which stories generate the most traffic
- Top-performing stories by conversions

**By Topic:**
- Which content topics drive the most relevant traffic

**By Country:**
- Where the traffic originates from

**By Campaign:**
- Campaign-by-campaign performance comparison

**By Program:**
- Program-by-program conversion rates and publisher counts

### Organic vs. Program Traffic:

Distinguish between traffic from organically placed recommendations (personal-recommendation disclosure) and commercially structured recommendations (affiliate, referral, sponsored).

This distinction helps the business understand their genuine organic presence separate from paid/incentivised results.

---

## Section 9 — Opportunities

Publisher matches and Village opportunities the Partner Engine surfaces for this business.

### Sub-sections:

**Suggested Publishers:**
Publishers whose content and audience closely match this business's topics and industry, who have not yet recommended the business.

For each suggested publisher:
- Name and avatar
- Topics they publish about
- Why matched: "Writes frequently about sustainable living, which overlaps with your product range"
- Story count
- Audience location
- CTA: "Invite to program" or "Invite to campaign"

**Suggested Communities:**
Village communities or topic clusters where this business's products/services are relevant. Future integration.

**Village Events:**
Upcoming events in the Village calendar where the business could be featured. Future integration.

**Partnership Opportunities:**
Other Village Pro Businesses with complementary (non-competing) products — potential cross-referral or co-campaign opportunities. Future integration.

---

## Section 10 — Settings

Business-controlled preferences for Village Pro.

### Discoverability:

| Setting | Description |
|---|---|
| Partner Engine matching | On / Off — receive publisher recommendation suggestions |
| Partner Directory listing | Whether to appear in searchable directory |
| Auto-suggest to publishers | Whether business appears in publisher Opportunities without an explicit invite |

### Notification Preferences:

| Notification | Channel | Default |
|---|---|---|
| New publisher recommendation | In-app + email | On |
| Campaign application received | In-app + email | On |
| Traffic milestone | In-app + email | On — at 100, 500, 1000 clicks |
| Conversion reported | In-app + email | On |
| Publisher withdrew recommendation | Email | On |
| Program issue (broken link etc.) | Email | On |

### API & Integrations (future):

| Integration | Description |
|---|---|
| Affiliate network connection | Connect Impact, ShareASale, PartnerStack etc. for automated conversion reporting |
| CRM connection | Sync publisher contacts to business CRM |
| Stripe | Revenue reconciliation and payout tracking |
| Webhook | Receive conversion events in real time |

---

## Trust Principles — Business Obligations

When a business enables Village Pro, they agree to:

1. Not directly approach publishers to pressure them into recommendations outside the Partner Engine.
2. Honour all program terms as published to publishers.
3. Report conversions accurately and promptly.
4. Not create misleading program descriptions.
5. Not create campaigns whose real objective is different from what is stated.
6. Accept that CULO may remove their Village Pro status if they violate publisher trust.

These obligations are defined formally in document 10 (Legal & Compliance).

---

## Future AI Assistance

The following AI features are planned but not in Phase 2:

| Feature | Description |
|---|---|
| Suggested Publishers | AI suggests which specific publishers to invite based on content and audience match |
| Suggested Campaigns | AI drafts a campaign brief based on business profile and past Village content |
| Suggested Keywords | AI recommends which entity aliases to register for better entity detection |
| Topic Gap Analysis | AI identifies which topics relevant to the business have low publisher coverage in the Village |
| Publisher Quality Score | AI signal helping business distinguish casual mentioners from consistent advocates |
| Collaboration Opportunities | AI suggests potential business-to-business collaboration based on audience overlap |

---

## Engine Connections

The Village Pro Business Centre reads from and writes to:

| Engine | Connection |
|---|---|
| **Publishing Engine** | Reads stories and brand mentions. |
| **Knowledge Engine** | Entity detection powers story scanning. Business can register entity aliases here. |
| **Partner Engine** | Primary source — all partner profiles, programs, recommendations, campaigns, earnings. |
| **Analytics Engine** | Receives all click, conversion and program events. |
| **Automation Engine** | Fires notifications on publisher activity, campaign applications, traffic milestones. |
| **Identity Engine** | Reads CULO Creatives membership status to gate Village Pro access. |
| **SEO Engine** | Business profile and Village Pro status contribute to business page SEO. |
| **GEO Engine** | Business entity added to knowledge graph with program and topic relationships. |
| **Search Engine** | Business appears in Village Partner Directory search. |
| **Distribution Engine** | Business profile updated when new recommendations are published. |

---

*This document defines the complete Village Pro Business Centre before any development begins. No UI components are created until the Implementation Sprint (document 12).*
