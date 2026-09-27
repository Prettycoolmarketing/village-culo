-- Culo Editorial Engine — Sprint 1: schema only (Researcher stage first).
--
-- Founders gain a real evidence ledger (structured claims, each traceable
-- to a real source) instead of the deterministic template's flat Key
-- Facts string — this is what every later stage (Profile Writer, Source
-- Journalist, Auditor) reads from and checks against, and what the Risk
-- Gate below evaluates before anything can auto-publish.
--
-- editorial_items is deliberately per-item (one bio + one row per source
-- article), not per-founder — a bad claim in one article must never
-- quarantine the whole profile. Every item carries its own editorial
-- status, so the review queue works against real, individually
-- actionable rows, not a founder-level flag.

alter table founders add column if not exists evidence_ledger jsonb;
alter table founders add column if not exists research_status text
  check (research_status in ('queued', 'researching', 'done', 'failed'));
alter table founders add column if not exists research_requested_at timestamptz;
alter table founders add column if not exists research_completed_at timestamptz;

comment on column founders.evidence_ledger is
  'Stage 1 (Researcher) output: array of {claim, claim_type, verification_status, confidence, subject, speaker, sensitive, first_party_only, sources: [{url, source_type, publisher, source_date}]}. Never a source of prose — Stage 2 reads from this, never invents beyond it.';

create table if not exists editorial_items (
  id                uuid primary key default gen_random_uuid(),
  founder_id        text not null references founders(id) on delete cascade,
  -- Only set for type = 'source_article' — which real source (article/
  -- YouTube/podcast/product link) this item covers. Null for the one
  -- profile_bio row a founder has.
  imported_content_id text references imported_content(id) on delete cascade,
  type              text not null check (type in ('profile_bio', 'source_article')),
  draft_content     jsonb,
  editorial_version integer not null default 1,
  research_version  integer not null default 1,
  -- Stage 3 (Auditor)'s verdict on this specific item, not the founder as
  -- a whole. 'pending' until the Auditor has actually run on this draft.
  editorial_status  text not null default 'pending'
                       check (editorial_status in ('pending', 'pass', 'review', 'reject')),
  auditor_notes     jsonb,
  -- Set by application code from Stage 1's research output — deterministic
  -- boolean logic (sensitive claim, reputational/health/legal/financial
  -- risk, low identity-match confidence), never a model's own opinion, so
  -- no later prompt can talk its way past it. See src/services/editorialEngine.ts.
  auto_publish_allowed boolean not null default false,
  last_verified_at  timestamptz,
  -- Once a founder claims their profile and corrects something, the
  -- original curated/researched version is kept, not overwritten — see
  -- correction_status.
  correction_status text check (correction_status in ('original', 'founder_corrected')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists editorial_items_founder_id_idx on editorial_items(founder_id);
create index if not exists editorial_items_status_idx on editorial_items(editorial_status);

alter table editorial_items enable row level security;

drop policy if exists "editorial_items_admin_read" on editorial_items;
create policy "editorial_items_admin_read" on editorial_items
  for select using (is_village_admin());

drop policy if exists "editorial_items_admin_write" on editorial_items;
create policy "editorial_items_admin_write" on editorial_items
  for all using (is_village_admin()) with check (is_village_admin());

-- Source snapshots — what Stage 1 actually found, at the time it found it.
-- Web content changes/disappears; this is the audit trail for "why did
-- Culo write this sentence on this date." Extracted structured facts only,
-- never the full source text (copyright — see the legal discussion this
-- was built from): a short quote is fine, a scraped article is not.
create table if not exists source_snapshots (
  id                uuid primary key default gen_random_uuid(),
  founder_id        text not null references founders(id) on delete cascade,
  imported_content_id text references imported_content(id) on delete cascade,
  source_url        text not null,
  source_title      text,
  publisher         text,
  source_date       date,
  retrieved_at      timestamptz not null default now(),
  extracted_evidence jsonb,
  source_valid      boolean,
  source_valid_reason text,
  created_at        timestamptz not null default now()
);

create index if not exists source_snapshots_founder_id_idx on source_snapshots(founder_id);

alter table source_snapshots enable row level security;

drop policy if exists "source_snapshots_admin_read" on source_snapshots;
create policy "source_snapshots_admin_read" on source_snapshots
  for select using (is_village_admin());

drop policy if exists "source_snapshots_admin_write" on source_snapshots;
create policy "source_snapshots_admin_write" on source_snapshots
  for all using (is_village_admin()) with check (is_village_admin());
