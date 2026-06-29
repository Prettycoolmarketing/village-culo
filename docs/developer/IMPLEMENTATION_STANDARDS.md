# CULO Operating System — Implementation Standards

**Version:** 1.0  
**Status:** Mandatory — Read before every sprint  
**Scope:** Every implementation decision in CULO  
**References:** All documents in `docs/core/`, `docs/engines/`, `docs/ARCHITECTURE_INDEX.md`

---

## Development Philosophy

Always extend. Never duplicate.

Prefer composition over replacement. Prefer configuration over hardcoding. Prefer reusable systems over one-off features.

Every feature must strengthen the existing Operating System. Nothing in CULO should be isolated functionality.

If a feature is not connected to an engine, it should not be built. If a feature duplicates an existing capability, it should be removed and the existing capability extended instead.

---

## Before Building Any Feature

Before writing a single line of code, answer these questions. If any cannot be answered, pause implementation and return to architecture.

1. Which Engine owns this feature?
2. Which Entity changes?
3. Which lifecycle state changes?
4. Which Events fire?
5. Which Permissions change?
6. Which Metadata fields change?
7. Which Relationships change?
8. Which Dashboards change?
9. Which Widgets change?
10. Which AI Agents consume it?
11. Which Automations trigger?
12. Which APIs are affected?

These are not optional questions. They exist because CULO is an Operating System. A feature that does not connect to the OS is not a feature — it is technical debt.

---

## Build Order

Implement in this order. Never skip layers. Never build UI before services. Never build automations before permissions.

```
1. Architecture decision
       ↓
2. Data model (Entity, fields, lifecycle states)
       ↓
3. Service layer (queries, mutations, validation)
       ↓
4. Permissions (who can do what)
       ↓
5. Dashboard (the interface publishers use)
       ↓
6. Public pages (the experience visitors see)
       ↓
7. Widgets (embeddable outputs)
       ↓
8. Automation (hooks, scheduled tasks, triggers)
       ↓
9. AI (agents, suggestions, metadata enrichment)
       ↓
10. Testing (unit, integration, type checking)
       ↓
11. Documentation (update all affected blueprints)
```

---

## Folder Structure

```
src/
  components/
    ui/           → Reusable primitives (buttons, inputs, cards)
    shared/       → Shared layout components (header, nav, panels)
    [feature]/    → Feature-specific components (named after the feature)
  pages/
    dashboard/    → Publisher dashboard pages
    public/       → Public-facing pages
    admin/        → Admin dashboard pages
  services/
    [entity]/     → One service file per entity type
  hooks/
    use[Entity]   → One hook file per entity type
  types/
    [entity].ts   → TypeScript types per entity
  utils/
    [concern].ts  → Utility functions grouped by concern
  constants/
    [domain].ts   → Constants grouped by domain
  providers/
    [context].tsx → React context providers
  context/
    [name].tsx    → Context definitions
```

---

## Naming Conventions

**Files:** kebab-case. `partner-profile.tsx`, `use-recommendation.ts`  
**Components:** PascalCase. `PartnerProfile`, `RecommendationCard`  
**Hooks:** camelCase prefixed with `use`. `usePartnerProfile`, `useRecommendation`  
**Services:** camelCase. `partnerService`, `recommendationService`  
**Types:** PascalCase. `PartnerProfile`, `Recommendation`  
**Constants:** SCREAMING_SNAKE_CASE. `RECOMMENDATION_STATUSES`, `PARTNER_TYPES`  
**Events:** PascalCase, past tense. `StoryPublished`, `RecommendationApproved`  
**Database tables:** snake_case, plural. `partner_programs`, `recommendations`  
**Database columns:** snake_case. `created_at`, `owner_id`, `is_public`

---

## Reuse Requirements

Before creating a new component, service or hook — search for an existing one.

**Components to reuse before creating new ones:**

- Save/cancel buttons → existing form footer component
- Entity status badge → existing status badge component
- Health score display → existing health card component
- Relationship panel → existing relationship display component
- AI suggestion card → existing suggestion panel component
- Empty state → existing empty state component
- Loading state → existing skeleton component
- Toast notifications → existing notification system
- Media picker → existing media upload component
- Dashboard layout → existing dashboard shell component

If a reusable component does not perfectly fit, extend it — do not create a duplicate. If it cannot be extended without breaking existing uses, refactor it first.

---

## Service Layer

Every entity must have a dedicated service file.

Services handle: Supabase queries, data validation, state management, error handling, and caching.

Services never contain: UI logic, React hooks, component state, navigation.

```typescript
// Pattern — every service follows this shape
const entityService = {
  get: async (id: string): Promise<Entity | null> => {},
  list: async (filters: EntityFilters): Promise<Entity[]> => {},
  create: async (data: CreateEntityInput): Promise<Entity> => {},
  update: async (id: string, data: UpdateEntityInput): Promise<Entity> => {},
  delete: async (id: string): Promise<void> => {},
  // feature-specific methods below the CRUD baseline
}
```

Services must not duplicate query logic. If two features need the same data, the service exposes one method that both call.

---

## Hooks

Every entity must have a dedicated hook file.

Hooks wrap services and provide: loading state, error state, refetch capability, and optimistic updates.

```typescript
// Pattern — every hook follows this shape
const useEntity = (id: string) => {
  const [entity, setEntity] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // load, save, update, delete handlers

  return { entity, loading, error, save, update, delete }
}
```

Hooks never contain: direct Supabase calls, business logic, API calls. Those belong in services.

---

## Types

Every entity type is defined once in `src/types/`. All code imports from there.

Types should be complete — matching the full Entity Blueprint. Optional fields use `?`. Future fields use comments, not placeholders.

```typescript
// Types follow the Entity Blueprint
interface Entity {
  id: string
  slug: string
  entity_type: EntityType
  version: number
  created_at: string
  updated_at: string
  created_by: string | null
  status: EntityStatus
  visibility: EntityVisibility
  // ... all fields from the Entity Blueprint
}
```

Never define inline types inside components. If a type is needed, define it in the appropriate types file.

---

## Constants

Define constants for every enum-like value.

```typescript
// constants/partner.ts
export const PARTNER_TYPES = [
  'affiliate',
  'referral',
  'creator',
  'ambassador',
  'sponsor',
  'custom',
] as const

export type PartnerType = typeof PARTNER_TYPES[number]
```

Never use string literals for known-value fields in business logic. Always use constants.

---

## Validation

Validate at service boundaries. Never duplicate validation in components.

Use consistent error messages. "This field is required" is not a message. "Add a program name so publishers know what they're applying for" is a message.

---

## Error Handling

Every async operation must handle errors explicitly.

```typescript
try {
  const result = await service.action()
  // handle success
} catch (error) {
  // handle specific error types
  // log to monitoring
  // surface meaningful message to user
}
```

Never silence errors with empty catch blocks. Never show raw error messages to users.

---

## Performance

**Lazy load:** Dashboard tabs that are not visible should not fetch data.  
**Pagination:** Lists of more than 20 items must be paginated.  
**Optimistic updates:** Saves and status changes should update the UI before the server confirms.  
**Debounce:** Search inputs and auto-save must be debounced (300ms minimum).  
**Cache:** Frequently accessed, rarely changed data (partner programs, topic list) must be cached.  
**Images:** All images must use Next.js `<Image>` with explicit width/height. No raw `<img>` tags.

---

## Accessibility

Every interactive element must:

- Be reachable by keyboard
- Have a meaningful `aria-label` or visible text label
- Meet WCAG 2.1 AA contrast ratios
- Have visible focus states

Every image must have meaningful alt text. "Image" is not meaningful. The `alt_text` field from the Media entity should populate this automatically.

---

## Internationalisation

All user-facing strings must be extractable. Do not hardcode strings directly in component JSX if they will need translation in the future. Prefer string constants that can be moved to a translation layer.

---

## Dashboard Principles

Every publisher dashboard should behave identically in these areas:

**Layout:** Use the shared dashboard shell. All dashboards share the same sidebar, top navigation, and page structure. Never create a new layout from scratch.

**Save behaviour:** All changes are either auto-saved (with a visible indicator) or require explicit save action (with a save button that becomes active on change). Mixing these patterns on the same page is not permitted.

**Validation:** Validation runs on blur (when leaving a field), not on every keystroke. Show errors inline, adjacent to the field.

**Navigation:** Dashboard navigation uses the shared sidebar. No new navigation patterns.

**Permissions:** Every dashboard section checks permissions before rendering. A publisher must never see options they are not authorised to use.

**Health:** Every dashboard that includes entity health uses the shared health component. Health scores are not custom-built per page.

**Metadata:** Every dashboard that displays entity metadata uses the shared metadata panel. Metadata display is not custom-built per page.

**Media picker:** All media upload and selection uses the shared media picker component.

**Relationship panels:** All relationship display uses the shared relationship panel component.

**History:** All version history uses the shared history panel component.

---

## Entity Rules

No feature may create a new data object unless the Entity Blueprint has been updated first and there is no way to extend an existing entity to meet the requirement.

Every new entity must:

- Inherit from the universal Entity base (id, slug, entity_type, version, created_at, updated_at, created_by, status, visibility)
- Have defined lifecycle states
- Have defined permissions
- Have defined relationships to at least one other entity
- Be added to the Entity Blueprint
- Be added to the Architecture Index
- Have health checks defined
- Have metadata categories assigned

---

## Automation Rules

Every automation must declare upfront:

| Declaration | What to specify |
|---|---|
| Trigger | The event or schedule that causes this automation to run |
| Owner | Which engine owns this automation |
| Permissions | What permission level the automation acts with |
| Events fired | Which events this automation fires |
| AI agents invoked | Which agents are called |
| Rollback | How to undo if the automation fails |
| Health effects | What health checks this automation affects |
| Analytics | What analytics events this automation records |

An automation that cannot answer all of these is not ready to be built.

---

## AI Rules

AI assists. AI does not replace.

Every AI agent interaction must follow:

| Requirement | Rule |
|---|---|
| Transparency | The publisher always knows when AI was involved |
| Approval | AI output never reaches public surfaces without publisher action |
| Voice protection | AI output does not overwrite the publisher's voice |
| Ownership | AI never claims ownership of content it generated |
| Explanation | AI always explains why it made a suggestion |
| Confidence | AI confidence scores are available internally |
| Uncertainty | Low-confidence AI output reduces automation, not increases it |
| Override | Publisher decision always overrides AI suggestion |

---

## Documentation Rules

Every completed sprint must update:

- `docs/ARCHITECTURE_INDEX.md` — add or update affected engines, objects, events
- The relevant engine blueprint — if the sprint adds to that engine's capabilities
- The core contracts — if the sprint introduces new entity fields, lifecycle states, events, permissions or relationships
- `docs/developer/IMPLEMENTATION_STANDARDS.md` — if the sprint reveals a new standard or exception

Nothing should become undocumented. If a feature exists in code but not in documentation, it is incomplete.

---

## Technical Debt Rules

Before starting a new sprint, identify and document:

| Debt type | Action |
|---|---|
| Duplicate code | Consolidate before adding more |
| Duplicate dashboard logic | Refactor to shared component |
| Duplicate service logic | Refactor to shared service method |
| Unused types | Delete |
| Unused services | Delete |
| Dead code paths | Delete |
| Hardcoded values | Move to constants |
| Placeholder logic | Document clearly as placeholder, not working code |
| Prototype-only behaviour | Flag and schedule for replacement |

Technical debt left undocumented accrues interest. Technical debt documented accrues knowledge.

---

## Future Expansion Requirements

Every feature must be built so it can support, without redesign:

| Future capability | What to prepare now |
|---|---|
| Enterprise teams | `owner_id` alone is never enough — leave room for `organisation_id` |
| Agencies | Business entities must support managed ownership |
| Plugins | API surfaces and data models must be composable |
| Marketplace | Entities that will be discoverable need `is_public`, `slug`, `visibility` |
| API access | Every service method should be callable without UI context |
| Canva integration | Content entities need `source`, `external_id` fields |
| Automation | Every entity needs lifecycle hook points |
| AI | Every entity needs `ai_excluded`, `ai_flags`, `ai_confidence_scores` |
| Stripe billing | Revenue entities need `stripe_id` placeholder |
| International | Language and country codes from day one |

---

## The Final Rule

CULO should always become:

- Simpler to use for publishers
- Smarter internally through AI and relationships
- More reusable through shared components and services
- More connected through the Knowledge Graph and Event system
- More maintainable through documentation and standards

Never more complicated. Never more fragmented. Never more isolated.

Every sprint should leave the codebase more coherent than it found it.

---

*This document is the permanent implementation contract for the CULO Operating System. Every sprint, every pull request, and every architectural decision is governed by these standards.*
