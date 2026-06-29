# CULO Growth & Discovery Engine — Master Blueprint

**Version:** 1.0  
**Status:** Architectural Blueprint — Pre-Implementation  
**Engine:** Growth Engine (Phase 3+)  
**Depends on:** 00-engine-blueprint.md, Knowledge Graph Engine, Partner Engine  

---

## Philosophy

Publishing should naturally create opportunities.

Every Story should strengthen a Publisher's network. Every Business that joins should become easier to discover. Every Event should find its speakers. Every Community should find its members. Every Podcast should find its guests. Every Brand should find its creators. Every Founder should find their collaborators.

The Growth Engine exists to build relationships, not to build a marketplace.

The difference matters. A marketplace is transactional — someone has money, someone has supply, they meet in the middle. The Growth Engine is relational — people publishing their genuine expertise naturally attract aligned opportunities, and the engine exists to surface those opportunities at the right moment, not to manufacture them.

---

## What the Growth Engine is Not

It is not:

- A jobs board
- A marketplace
- A talent agency
- A matchmaking tool that forces connections
- A recommendation engine for commercial gain

It is a discovery layer — a system that reads what people publish, understands their interests, capabilities and community, and surfaces relevant opportunities that already exist in the ecosystem.

---

## Participants

The Growth Engine serves every type of person and organisation inside CULO.

### Publishers / Founders
People who create content on CULO. They grow by discovering:
- Businesses to partner with
- Events to speak at
- Communities to join
- Brands to recommend
- Podcasts to appear on
- Collaborators to work with
- Opportunities relevant to their expertise

### Businesses
Companies using CULO to build Village presence. They grow by discovering:
- Publishers who talk about their industry
- Events to sponsor or attend
- Communities to participate in
- Agencies and freelancers to work with
- Complementary businesses to partner with

### Communities
Groups organised around shared interests or industries. They grow by discovering:
- Founders and Publishers who should be members
- Businesses relevant to their members
- Events their members should attend
- Topics they haven't covered but should

### Events and Festivals
Single or recurring gatherings. They grow by discovering:
- Speakers in relevant topics
- Sponsors aligned to the audience
- Media partners (publishers who will cover the event)
- Workshops and educators

### Podcasts and Media
Content creators seeking collaborators. They grow by discovering:
- Guests with relevant expertise
- Publishers who could cross-promote
- Businesses seeking media exposure

### Agencies
Service providers. They grow by discovering:
- Founders who match their client profile
- Businesses that need their services
- Publishers who talk about their area of work

### Investors and Accelerators (future)
Capital allocators and growth programs. They grow by discovering:
- Founders in relevant stages and sectors
- Businesses in their investment thesis

### Mentors and Coaches
Experience-holders. They grow by discovering:
- Founders at the stage where their experience applies
- Communities where they can contribute

---

## Opportunity Types

Every opportunity the Growth Engine can generate.

| Category | Opportunity Types |
|---|---|
| **Publishing** | Cross-promotion · Joint editorial · Co-authored content · Guest posts |
| **Appearing** | Podcast guest · Speaking at event · Workshop facilitator · Panel participant · Webinar co-host |
| **Commercial** | Affiliate opportunity · Referral program · Sponsorship · Ambassador program · Campaign participation |
| **Collaboration** | Joint venture · Business collaboration · Product collaboration · Service bundle |
| **Community** | Community invitation · Community leadership · Community sponsorship |
| **Capital** | Investment introduction · Accelerator invitation · Grant opportunity (future) |
| **Employment** | Contract work · Consulting opportunity · Advisory role |
| **Learning** | Mentorship · Coaching · Course recommendation · Peer learning |
| **Media** | Press opportunity · Interview request · Directory listing · Award nomination |
| **Partnership** | Cross-referral · Affiliate partnership · Agency partnership · Integration partnership |
| **Events** | Event attendance · Event sponsorship · Event partnership · Event speaking |
| **Future** | Any opportunity type should be addable without architecture changes |

---

## Discovery Signals

Every signal the Growth Engine reads to determine opportunity relevance.

**Content signals:**
Topics published · Industries covered · Formats used · Publishing frequency · Story recency · Vocabulary and terminology used · Problems addressed · Solutions offered · Outcomes described

**Profile signals:**
Location (city, country, region) · Industries · Business type · Products and services offered · Business age and stage · Audience described · Skills listed · Experience level stated

**Relationship signals:**
Existing recommendations approved · Past campaigns participated in · Communities mentioned · Events attended · Businesses mentioned · Collaborators mentioned · Books and courses referenced

**Activity signals:**
Publishing consistency · Content volume · Engagement rate (future) · Partner Centre activity · Comment activity (future)

**Graph signals (from Knowledge Engine):**
Relationship strength with existing nodes · Topic authority score · Industry expertise depth · Shared topics with opportunity source · Mutual connections with opportunity source

**Historical signals:**
Past opportunities accepted vs. declined · Types of opportunities that generated connections · Types of connections that led to outcomes

---

## Matching Engine

How an opportunity is matched to a participant:

```
New opportunity exists in ecosystem
(Story published / Business joins / Event created / Podcast seeks guests)
      │
      ▼
Growth Engine reads opportunity requirements
(topics, industries, location, audience, experience, stage)
      │
      ▼
Query Knowledge Graph for matching participants
      │
      ▼
For each candidate participant:
  Score = topic_overlap × 0.25
        + industry_match × 0.20
        + location_relevance × 0.15
        + relationship_strength × 0.20
        + activity_level × 0.10
        + historical_acceptance × 0.10
      │
      ▼
Candidates above threshold → ranked by score
      │
      ▼
Top N opportunities surfaced to each participant
(in their Growth Dashboard, Opportunities section)
      │
      ▼
Participant reviews opportunity
      │
      ├── Accepts / Applies → Connection created, Knowledge Graph updated
      │
      └── Ignores / Declines → Signal stored, reduces this type of suggestion
```

---

## Opportunity Confidence

| Level | Score | Meaning |
|---|---|---|
| Very High | 0.90+ | Near-perfect match on topics, industry, location and relationship history |
| High | 0.70 – 0.89 | Strong match on majority of criteria |
| Medium | 0.50 – 0.69 | Relevant but partial match — worth surfacing |
| Low | 0.30 – 0.49 | Possible relevance but low signal strength |
| Unknown | 0.00 – 0.29 | Insufficient data — not surfaced |

Confidence thresholds are tuned per opportunity type. Podcast guest matching may have a different threshold than business partnership matching.

---

## Growth Dashboard

The Growth Dashboard is the publisher-facing surface for all Growth Engine output.

### Dashboard Sections:

**Today's Opportunities**
New matches surfaced in the last 24 hours. Time-sensitive opportunities (events with deadlines, campaigns ending soon) prioritised.

**Businesses Looking for Publishers**
Village Pro Businesses that match this publisher's profile and have expressed interest in publisher relationships.

**Publishers You Should Meet**
Other publishers in CULO with complementary (non-competing) topics or shared industries. Collaboration, cross-promotion and community potential.

**Communities to Join**
Communities whose topic focus and membership profile align with this publisher's content.

**Events to Attend**
Events where this publisher's expertise is relevant — either as attendee or potential speaker.

**Podcasts Seeking Guests**
Podcasts whose topic, audience and format match this publisher's expertise and publishing voice.

**Speaking Opportunities**
Events, conferences, summits and panels seeking speakers in this publisher's topic area.

**Partnership Opportunities**
Commercial partnership opportunities from Partner Engine: affiliate, referral, ambassador, campaign.

**Recommended Businesses**
Businesses this publisher hasn't mentioned yet but whose products, services or industry strongly align with their content.

**Suggested Collaborators**
Publishers and founders in the Village whose work would complement this publisher's content.

**Nearby Founders**
Founders publishing from the same location — for local connection and event collaboration.

**International Opportunities**
Opportunities that transcend location — remote collaboration, global communities, international podcasts.

**Recently Viewed**
Opportunities this publisher has seen but not yet actioned.

**Saved Opportunities**
Opportunities the publisher has bookmarked to return to.

**Opportunity History**
Complete record of opportunities surfaced, actioned, accepted and declined.

---

## Business Discovery

Village Pro Businesses see a Growth view oriented around who can help them grow.

**Relevant Publishers:**
Publishers whose content, audience and topics align with the business's products/services.

**Relevant Stories:**
Existing Village stories that mention this business's industry, products or topic area — even if they don't mention the business by name.

**Relevant Communities:**
Communities where this business's audience participates.

**Relevant Events:**
Events where this business could sponsor, speak or exhibit.

**Relevant Partners:**
Other Village Pro Businesses whose products or services complement theirs — potential cross-referral or co-campaign partners.

**Relevant Agencies:**
Service providers who could help this business grow their Village presence.

**Potential Ambassadors:**
Publishers with high trust scores and topic alignment who could represent this business long-term.

**Potential Customers:**
Future: patterns in who consumes similar content that suggests potential customer alignment.

---

## Publisher Discovery

The Growth Engine helps publishers discover across every dimension:

| Discovery Category | Examples |
|---|---|
| Businesses | Village Pro Businesses in their topic area |
| Events | Startup summits, industry conferences, local markets |
| Communities | Facebook Groups, Slack communities, Discord servers listed in Village |
| Brands | Products they've never mentioned but their audience would value |
| Courses | Learning opportunities relevant to their publishing topics |
| Mentors | Experienced founders in similar industries |
| Accelerators | Programs aligned to their business stage |
| Investors | Future: capital aligned to their business |
| Workshops | Skill-building relevant to their content |
| Agencies | Service providers for their publishing needs |
| Collaborators | Joint content or business opportunities |
| Speaking | Events seeking their expertise |
| Podcasts | Media seeking their voice |
| Media | Press opportunities seeking their story |

---

## Community Discovery

Communities receive Growth Engine outputs that help them grow their membership and programming:

- **Relevant Founders** — whose publishing topics match the community's focus
- **Relevant Businesses** — whose products or services their members would value
- **Relevant Publishers** — who could contribute content or appear as guests
- **Relevant Workshops** — educational content to bring into the community
- **Relevant Resources** — Library items relevant to community members
- **Relevant Events** — What to recommend to community members
- **Relevant Partners** — Businesses or organisations to co-create programming with

---

## Event Discovery

Events receive Growth Engine outputs to help them fill their programme:

- **Suggested Speakers** — Founders and publishers with relevant expertise and speaking signals
- **Suggested Sponsors** — Village Pro Businesses whose audience aligns with the event's attendees
- **Suggested Workshops** — Publishers who offer educational content in relevant topics
- **Suggested Media Partners** — Publishers who cover the event's industry
- **Suggested Communities** — Communities whose members are the event's target audience
- **Suggested Partners** — Other events or organisations for co-promotion

---

## Automations

Growth Engine automations triggered by ecosystem events:

| Trigger | Automation |
|---|---|
| Story published | Growth opportunities recalculated for this publisher |
| New Business joins | Publisher match list updated for this business |
| Event created | Suggested speakers identified and surfaced |
| Community joins | Suggested member profiles generated |
| Recommendation approved | Relationship strength in Knowledge Graph increased |
| Partnership accepted | Knowledge Graph updated, new matches recalculated |
| New Publisher joins | Existing opportunities re-matched to include new participant |
| Publisher's topic expands | New opportunity set generated for new topic |
| Location updated | Location-based opportunities recalculated |

---

## AI Assistance (Future)

Future AI layer that reasons over Growth Engine data:

| Question the AI answers | Powered by |
|---|---|
| "Who should this Publisher collaborate with?" | Knowledge Graph + topic overlap |
| "Who should sponsor this Story?" | Audience + topic match + Partner Engine |
| "Which Event fits this Founder?" | Topic + location + speaking history |
| "Which Community should they join?" | Topic + relationship graph |
| "Which Podcast should interview them?" | Topic + publishing voice + audience |
| "Which Business should recommend them as an ambassador?" | Trust score + topic alignment + recommendation history |
| "Which Publisher should review this product?" | Category expertise + recommendation history + audience |
| "Which Businesses are missing from this topic in the Village?" | Knowledge gap detection |
| "What should this Publisher write about next?" | Knowledge Graph + audience patterns + topic gaps |
| "What is the best opportunity for this Publisher this week?" | Composite score across all opportunity types |

---

## Relationship to Knowledge Graph

The Growth Engine and the Knowledge Graph are deeply coupled.

The Knowledge Graph stores the state — what exists, how things are connected, how strong those connections are.

The Growth Engine reads the state — it queries the graph to find matches, calculates scores, and surfaces opportunities.

The Growth Engine also writes back to the graph — when a connection is accepted or a relationship is formed, the Knowledge Graph is updated.

This feedback loop is what makes the engine smarter over time. More connections → stronger graph → better matches → more connections.

---

## Engine Connections

| Engine | Connection |
|---|---|
| **Identity Engine** | Reads publisher and business profiles for matching data |
| **Publishing Engine** | Reads new content to extract growth signals |
| **Knowledge Engine** | Primary dependency — Growth Engine queries and updates the Knowledge Graph |
| **Partner Engine** | Commercial opportunity matching (affiliate, campaign, sponsorship) |
| **Distribution Engine** | Growth-matched content surfaces on relevant profile pages |
| **Automation Engine** | Fires notifications when new opportunities are matched |
| **Analytics Engine** | Tracks which opportunities are accepted, clicked, and completed |
| **Search Engine** | Growth opportunities appear in search results (events, communities, opportunities) |
| **SEO Engine** | Opportunity pages (events, communities, podcasts) are structured for search indexing |
| **GEO Engine** | Opportunity entities included in Knowledge Graph for AI discoverability |
| **Widget Engine** | Future: publisher websites can embed their opportunity history or achievements |
| **Future AI Agents** | AI agent layer reasons over Growth Engine data to provide proactive suggestions |

---

*This document defines the complete Growth & Discovery Engine architecture before any implementation begins. No code, database or UI is created until a dedicated implementation sprint is planned.*
