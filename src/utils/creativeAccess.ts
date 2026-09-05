// Shared by DashboardLayout (nav label), DashboardWelcomePage (Canva
// button gating) and DashboardCreativesPage (upgrade banner) — one
// definition of "can this founder use Creatives right now" instead of
// three copies that could drift apart.
export function hasCreativeAccess(sub: { status: string; trialEnd?: string } | undefined): boolean {
  if (!sub) return true
  if (sub.status === 'active') return true
  if (sub.status === 'trial') return !sub.trialEnd || new Date(sub.trialEnd) > new Date()
  return false
}
