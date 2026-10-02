// A plain, honest progress signal across the real screens a new signup
// actually passes through (confirm email -> set password, tell us who you
// are, building your profile) — walking through the funnel surfaced that
// there was zero sense of how many steps were left at any point, which
// reads as "is this ever going to end" on a flow that already includes an
// email round-trip and an open-ended research wait.
const STEPS = ['Confirm & set password', 'Tell us about you', 'Building your profile']

export function JoinProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
      </div>
      <p className="font-body text-xs font-semibold text-muted uppercase tracking-wide">
        Step {step} of {STEPS.length} — {STEPS[step - 1]}
      </p>
    </div>
  )
}
