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
