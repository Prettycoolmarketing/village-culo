# CULO Partner Engine — Part 1: Complete Blueprint

**Version:** 1.0  
**Status:** Architectural Blueprint — Pre-Implementation  
**Engine:** Partner Engine (Phase 2)  
**Depends on:** Identity Engine, Publishing Engine, Knowledge Engine  

---

## Purpose

The Partner Engine connects Publishers, Businesses, Brands, Products, Services and Recommendations into one trusted ecosystem.

Its purpose is **not** affiliate marketing.

Its purpose is to create a **Recommendation Economy** — a system where the things people already recommend are recognised, structured and made valuable for everyone involved: publishers, businesses, readers and the Village itself.

Affiliate programs are one possible outcome. They are not the point.

---

## Philosophy

People already recommend products.  
People already recommend services.  
People already recommend software.  
People already recommend businesses.  
People already recommend communities.

They do it in conversation. In blog posts. In captions. In newsletters. In podcasts.

CULO simply **recognises** those recommendations and creates structured opportunities around them.

**The recommendation always comes before monetisation.**

Trust is the product. Revenue is the outcome.

A recommendation that loses reader trust is worth nothing — not to the publisher, not to the business, not to CULO.

---

## What the Partner Engine is Not

It is not:

- An ad network
- A sponsored content platform
- A pay-to-play directory
- An automated affiliate injector
- A marketplace for buying placement

A business cannot buy a recommendation. A business can become discoverable, eligible and trusted. The publisher decides if a recommendation is made.

---

## Participants

### Visitor

A person browsing the Village without an account.

**Can:** Read published content, view founder profiles, view business profiles, click CTAs.  
**Cannot:** Participate in the Partner Engine, earn, recommend, create content.  
**Sees:** Published recommendations with disclosure applied.

---

### Publisher

A founder with a CULO account who creates and publishes content.

**Can:** Publish content, receive recommendation suggestions, approve or decline recommendations, build a recommendation history, earn from approved recommendations.  
**Cannot:** Be forced into a recommendation, have recommendations published without approval, have recommendations altered after approval.  
**Controls:** Every recommendation that appears under their name. Always.

A Publisher without Village Pro membership can still participate in the Partner Engine — they receive recommendations, approve them, and earn from them. Village Pro unlocks additional capabilities.

---

### CULO Creatives Member (Village Pro Publisher)

A Publisher who is also a CULO Creatives member.

**Receives — in addition to standard publisher capabilities:**

- Partner Centre access
- Business Discovery dashboard
- Proactive recommendation suggestions (not just reactive)
- Advanced recommendation analytics
- Priority matching for partner campaigns
- Future: Canva publishing integration
- Future: Website widget suite
- Future: Priority SEO and GEO features

Village Pro is not a paywall for recommendations. It is a layer of capability for publishers who want to go deeper.

---

### Village Pro Business

A business that has enabled discoverability inside the Partner Engine.

A Village Pro Business is not necessarily a paying advertiser. It is a business that has:

1. Created a CULO Business Profile
2. Opted into the Partner Network
3. Defined what kind of partnerships they want

Village Pro Businesses may offer:

- Affiliate programs (tracked links, commission on sales)
- Referral programs (tracked referrals, flat reward)
- Creator programs (gifting, long-term collaboration)
- Ambassador programs (ongoing relationship)
- Sponsorship opportunities (paid content partnerships)
- Lead generation (introductions to relevant publishers)
- Community access (give publishers access to their community)
- Events (invite publishers to relevant events)
- Products (send products for honest review)
- Services (offer services at partner rates)

They choose which they offer. Publishers choose which they accept. CULO facilitates.

---

## Core Concepts

These are conceptual definitions — not database fields, not UI labels. These are the ideas the Partner Engine is built on.

### Partner

Any organisation — brand, business, SaaS tool, community, agency, creator — that participates in the Partner Network. Partners are distinct from CULO Businesses (though a CULO Business may also be a Partner). Partners may not have a presence in the Village at all — they are external entities that publishers already recommend.

### Partner Program

The commercial structure a Partner offers. One Partner may offer multiple programs (e.g., a public affiliate program for all publishers + a private ambassador program for selected publishers).

### Recommendation

A single instance of a publisher recommending something inside the CULO ecosystem. A Recommendation is:

- Tied to a specific story
- Tied to a specific publisher
- Tied to a specific entity (product, service, business, person, place)
- Given an approval status by the publisher
- Given a disclosure label for readers
- Tracked for performance (clicks, conversions, earnings)

A Recommendation is not a review. It is not an endorsement manufactured by CULO. It is a structured recognition of something the publisher already said.

### Partner Opportunity

An invitation from a Partner to eligible publishers. "We are looking for publishers in the sustainability space to share our product with their audience."

Opportunities are not ads. Publishers opt in. Publishers can ignore them.

### Recommendation Approval

The event in which a publisher reviews a suggested recommendation and decides:

- Approve — the recommendation is disclosed and tracked
- Decline — the recommendation is not made
- Modify — the publisher adjusts the context before approval

Approval is always explicit. Nothing is ever silently added to a publisher's content.

### Disclosure

The label that appears on any approved recommendation inside published content. Disclosure is non-negotiable. It exists regardless of whether the recommendation is paid or unpaid.

Disclosure types:

- `affiliate` — publisher earns a commission if a reader purchases
- `referral` — publisher earns a reward if a reader signs up
- `gifted` — publisher received the product or service for free
- `sponsored` — publisher was paid for the mention
- `community-partner` — publisher is affiliated but not compensated
- `personal-recommendation` — publisher recommends without any commercial arrangement

Every disclosure type has a plain-English explanation that appears to readers on hover or click.

### Revenue Share

The distribution of earnings between Publisher, CULO and (where applicable) the referring party.

The Revenue Share model is not defined in this document — it belongs to the Revenue Engine document within the Partner Engine series.

---

## Recommendation Lifecycle

This is the full journey of a recommendation from creation to revenue.

```
Publisher writes Story
        │
        ▼
Publishing Engine saves Story
        │
        ▼
Knowledge Engine analyses content
(entities: brands, products, places, people, software)
        │
        ▼
Partner Engine checks entity against Partner database
        │
        ├── No match found → No action
        │
        └── Match found
                │
                ▼
        Opportunity eligibility check
        (is publisher eligible for this partner's program?)
                │
                ├── Not eligible → Logged, no notification
                │
                └── Eligible
                        │
                        ▼
                Recommendation suggestion created
                        │
                        ▼
                Publisher notified
                (in-app + email)
                        │
                        ▼
                Publisher reviews suggestion
                        │
                        ├── Declined → Logged, no action
                        │
                        └── Approved
                                │
                                ▼
                        Disclosure type selected
                                │
                                ▼
                        Affiliate / referral link generated
                        (if program is commercial)
                                │
                                ▼
                        Story updated with disclosure
                                │
                                ▼
                        Distribution Engine publishes updated story
                                │
                                ▼
                        Analytics begins tracking
                        (clicks, conversions, earnings)
```

The Publisher remains in control at every stage. The engine suggests. The publisher decides.

---

## Recommendation Types

The Partner Engine must support every category of thing a publisher might recommend.

**Digital:**
Software and SaaS tools · Mobile apps · Online courses · Digital products · eBooks · Prompt packs · Templates · Communities · Newsletters · Podcasts · YouTube channels · Online events · Webinars

**Physical:**
Products · Books · Clothing · Equipment · Food · Supplements · Homewares · Art

**Services:**
Consultants · Agencies · Freelancers · Coaches · Photographers · Videographers · Designers · Developers

**Local Business:**
Restaurants · Cafes · Accommodation · Retailers · Studios · Gyms · Clinics · Markets

**Experiences:**
Events · Festivals · Travel destinations · Retreats · Workshops · Tours

**People:**
Creators · Speakers · Authors · Artists · Fellow founders

**Future:**
Any category should plug in without architecture changes. The entity type is flexible. The recommendation structure remains the same.

---

## Village Pro Business — Complete Journey

```
Business joins CULO
        │
        ▼
Creates Business Profile
(name, description, logo, industry, location, website)
        │
        ▼
Enables Village Pro
(opts into Partner Network)
        │
        ▼
Sets discovery preferences
(which publisher types, topics, locations are relevant)
        │
        ▼
Creates one or more Partner Programs
(affiliate / referral / creator / sponsorship / gifting)
        │
        ▼
Sets program terms
(reward type, reward value, approval type, restrictions)
        │
        ▼
Becomes discoverable in Partner Engine
        │
        ▼
Matched to relevant publishers
(based on topic overlap, location, audience alignment)
        │
        ▼
Appears in publisher recommendation suggestions
        │
        ▼
Publisher approves recommendation
        │
        ▼
Business receives:
  - Disclosed recommendation in published story
  - Click and conversion analytics
  - Publisher relationship
        │
        ▼
Business renews or expands program
```

---

## Publisher — Partner Journey

```
Publisher joins CULO
        │
        ▼
Creates Founder Profile
        │
        ▼
Publishes first Story
        │
        ▼
Partner Engine begins matching
(passive — no action required from publisher)
        │
        ▼
First recommendation suggestion appears in Partner Centre
        │
        ▼
Publisher reviews suggestion
        │
        ▼
Publisher approves (or declines)
        │
        ▼
Approved recommendation appears on their story with disclosure
        │
        ▼
Clicks and conversions tracked
        │
        ▼
Earnings accumulate
        │
        ▼
Publisher builds recommendation reputation
(history of approved recommendations, categories, performance)
        │
        ▼
Higher reputation → better match quality → better programs available
```

---

## Trust Principles

These are non-negotiable. They apply to every part of the Partner Engine, in every future sprint.

1. **Recommendations are never automatic.** The Publisher must explicitly approve every recommendation before it appears.

2. **Disclosure is always present.** Every approved recommendation carries a disclosure label. There is no "undisclosed recommendation" status.

3. **Businesses cannot buy placement.** Village Pro increases discoverability. It does not guarantee recommendation. A publisher who has never mentioned a business will not be prompted to recommend it simply because the business is a Village Pro member.

4. **Publisher trust is the asset.** If a publisher's audience stops trusting their recommendations, the Partner Engine fails. Every design decision prioritises publisher credibility over short-term revenue.

5. **Readers deserve context.** Every disclosure is human-readable. "This publisher earns a commission if you purchase through this link" not "AD."

6. **The Publisher can withdraw.** After approving a recommendation, a publisher must be able to remove it from their story at any time, without explanation.

7. **Recommendation history belongs to the publisher.** Their history of recommendations — approved, declined, earned — is theirs. CULO does not sell it, share it, or use it against them.

8. **Quality over volume.** A publisher with three high-quality, trusted recommendations is more valuable to the Partner Engine than one with fifty unchecked approvals.

---

## Future Integrations

How the Partner Engine will eventually connect to every other engine:

| Engine | Integration |
|---|---|
| **Publishing Engine** | Scans new stories for entity mentions. Triggers recommendation matching. |
| **Knowledge Engine** | Entity detection identifies brands, products, services mentioned in content. Confidence scoring determines match quality. |
| **Distribution Engine** | Approved recommendations (with disclosure) are included in all distributed versions of the story. |
| **Analytics Engine** | Clicks, conversions, approvals, earnings, declines — all reported to Analytics Engine as events. |
| **Automation Engine** | Match found → publisher notification. Approval received → story updated. Earnings milestone → publisher notification. |
| **Search Engine** | Partner Directory is searchable. Publishers can discover Village Pro Businesses. |
| **SEO Engine** | Partner pages (business + recommendation history) are structured for search indexing. |
| **GEO Engine** | Partner entities are included in the CULO knowledge graph. Makes partner businesses discoverable by AI systems. |
| **Widget Engine** | Publisher websites can display approved recommendations with disclosure in embeddable widgets. |
| **Canva API** | Future: Canva-designed recommendation cards generated automatically on approval. |
| **Camera Roll AI** | Future: Photo of a product auto-detected as a potential recommendation. |
| **Website Import** | Future: Website content imported → existing mentions detected → retroactive recommendations suggested. |
| **Podcast Import** | Future: Podcast transcript → entity detection → recommendations suggested for audio content. |

---

## What Comes Next

The Partner Engine Blueprint is the first of twelve documents.

| Document | Title |
|---|---|
| 01 | Partner Engine Blueprint (this document) |
| 02 | Partner Data Model & Supabase Architecture |
| 03 | Partner Automations |
| 04 | Publisher Partner Centre (UI & experience) |
| 05 | Business Village Pro (UI & experience) |
| 06 | Recommendation Detection Engine |
| 07 | Partner Directory |
| 08 | Partner Analytics |
| 09 | Revenue Engine |
| 10 | Legal & Compliance |
| 11 | Admin Dashboard |
| 12 | Implementation Sprint |

No code is written until document 12.

---

*This document is the permanent philosophical and architectural reference for the CULO Partner Engine. Future sprints that extend the Partner Engine begin here.*
