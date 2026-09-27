-- Culo Editorial Engine — adds a human approval state distinct from the
-- Auditor's own verdict. The agreed design is explicit: an Auditor "pass"
-- routes to "ready for CAPO approval," never straight to publish — this
-- is the column that records that a human actually looked and signed off,
-- separate from editorial_status (which is the Auditor's machine verdict).

alter table editorial_items drop constraint if exists editorial_items_editorial_status_check;
alter table editorial_items add constraint editorial_items_editorial_status_check
  check (editorial_status in ('pending', 'pass', 'review', 'reject', 'approved'));

comment on column editorial_items.editorial_status is
  'pending/pass/review/reject are the Auditor''s own machine verdict (Stage 3). approved is set only by a human in the CAPO Review Queue, after reading a pass (or a review it decided was fine) — never set automatically.';
