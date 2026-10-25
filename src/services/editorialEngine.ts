import type { EvidenceLedger, EvidenceClaim } from '../types/editorialEngine'

// The Risk Gate — deterministic application logic, not a model call. This
// is the one thing later prompts can never override: no writer or auditor
// prompt gets a vote on whether a piece is allowed to auto-publish, this
// function decides it from Stage 1's own structured output alone.
//
// Auto-publish never actually happens in the first version regardless
// (PASS routes to "ready for CAPO approval," not live) — this exists so
// that distinction is real and checkable now, before anyone is tempted to
// wire PASS straight to publish once the pipeline feels trustworthy.
export function passesRiskGate(ledger: EvidenceLedger): boolean {
  if (ledger.reputational_risk === 'high') return false
  if (ledger.health_science_risk) return false
  if (ledger.legal_risk) return false
  if (ledger.financial_risk) return false
  if (ledger.claims.some(claimIsBlocking)) return false
  if (ledger.source_assessments.some(s => s.identity_confidence === 'low')) return false
  return true
}

// Same gate, scoped to one specific source — for an article written about
// just that source, not the founder's whole ledger. Confirmed real, live
// bug this fixes: passesRiskGate blocked every single one of Jon Evans's
// 8 well-sourced, high-confidence Marketing Week/podcast articles because
// ONE unrelated claim elsewhere in his ledger (a sensitive detail about
// being fired, and a minor conflicting download-count figure) tripped
// claimIsBlocking — neither of which that writing even cited. A single
// unrelated flagged claim anywhere in a large, well-researched ledger
// should never silently block every other, unconnected piece from ever
// auto-publishing. Identity confidence and claim-blocking now only look
// at this source and the claims actually drawn from it; the ledger-wide
// risk flags (reputational/health/legal/financial) still apply globally,
// since those are about the subject as a whole, not one piece of writing.
export function passesRiskGateForSource(
  ledger: EvidenceLedger,
  source: EvidenceLedger['source_assessments'][number],
): boolean {
  if (ledger.reputational_risk === 'high') return false
  if (ledger.health_science_risk) return false
  if (ledger.legal_risk) return false
  if (ledger.financial_risk) return false
  if (source.identity_confidence === 'low') return false
  const claimsFromThisSource = ledger.claims.filter(c => c.sources.some(s => s.url === source.url))
  if (claimsFromThisSource.some(claimIsBlocking)) return false
  return true
}

// "Genuinely thin" — essentially no verifiable identity to build a profile
// from at all. Distinct from just "blocked by the Risk Gate," which can
// also mean plenty of real, high-confidence research sitting alongside one
// unrelated sensitive/conflicting claim (confirmed real: Jon Evans — 3
// high-confidence sources, 8 well-sourced articles, blocked only because
// of one claim about being fired years earlier that had nothing to do
// with any of it). Only this narrower case — no source research could
// actually confirm belongs to this person — is worth telling staff "invite
// them to join and self-publish instead," not every Risk Gate block.
export function isThinResearch(ledger: EvidenceLedger): boolean {
  const validSources = ledger.source_assessments.filter(s => s.source_valid)
  if (validSources.length === 0) return true
  return validSources.every(s => s.identity_confidence === 'low')
}

function claimIsBlocking(claim: EvidenceClaim): boolean {
  // A CAPO staff member has already looked at this specific claim and
  // confirmed it — the one override the Risk Gate accepts, since it's a
  // human decision recorded on the claim itself, not a model talking its
  // way past the gate.
  if (claim.human_review === 'confirmed') return false
  if (claim.sensitive) return true
  // A claim asserted as plain fact but only ever confirmed by the subject's
  // own material — no independent source — needs a human's eyes before it
  // reads as an established truth on the page.
  if (claim.claim_type === 'fact' && claim.first_party_only && claim.confidence !== 'high') return true
  if (claim.claim_type === 'conflicting') return true
  return false
}

// A short, human-readable reason list for why a ledger didn't pass — shown
// in the review queue next to the item, not just a bare boolean.
export function riskGateReasons(ledger: EvidenceLedger): string[] {
  const reasons: string[] = []
  if (ledger.reputational_risk === 'high') reasons.push('High reputational risk flagged by research.')
  if (ledger.health_science_risk) reasons.push('Contains health/science claims requiring heightened verification.')
  if (ledger.legal_risk) reasons.push('Contains legal claims requiring heightened verification.')
  if (ledger.financial_risk) reasons.push('Contains financial claims requiring heightened verification.')
  for (const c of ledger.claims) {
    if (claimIsBlocking(c)) reasons.push(`Blocking claim: "${c.claim}"`)
  }
  for (const s of ledger.source_assessments) {
    if (s.identity_confidence === 'low') reasons.push(`Low identity confidence on source: ${s.url}`)
  }
  return reasons
}
