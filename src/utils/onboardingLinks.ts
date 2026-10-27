// Shared by JoinSetupPage (first-time signup) and ResumeResearchBanner
// (retry, whether a founder hit "Unable to locate you" or staff are
// running research by hand from Founder Management) — both ask for the
// same real links, the same way, for the same reason: a founder with
// several real, verifiable public profiles used to be able to submit only
// ONE of them, and if that one didn't resolve, research came back with
// nothing even when another link she had would have worked.
//
// `prefill` marks the two platforms that actually have a bulk-capture
// connector on Import (YouTubeConnectForm / website's connect form in
// DashboardImportContentPage) — what's typed here gets handed to that
// connector via setConnectPrefill, ready in one click instead of making a
// founder go find and retype the same link there. Instagram and LinkedIn
// have no bulk-capture connector in this app; they're real research
// signal (verifying who this founder is) but nothing imports from them
// automatically — the hint text says so plainly rather than leaving that
// difference to guesswork.
export const ONBOARDING_LINK_FIELDS = [
  { key: 'website' as const, label: 'Website', placeholder: 'yourbusiness.com', prefill: 'website' as const,
    hint: 'Helps us verify you — and if it\'s a blog, your posts will be ready to import as articles.' },
  { key: 'instagram' as const, label: 'Instagram', placeholder: '@yourusername', prefill: undefined,
    hint: 'Helps us verify who you are. We don\'t pull your posts in automatically yet.' },
  { key: 'linkedin' as const, label: 'LinkedIn', placeholder: 'linkedin.com/in/yourname', prefill: undefined,
    hint: 'Helps us verify who you are and write a stronger first bio.' },
  { key: 'youtube' as const, label: 'YouTube', placeholder: '@yourchannel', prefill: 'youtube' as const,
    hint: 'Helps us verify you — and your channel will be ready to import as articles.' },
]

export type OnboardingLinkKey = typeof ONBOARDING_LINK_FIELDS[number]['key']

// Auto-prepend https:// rather than making a founder notice and fix a
// scheme-less link themselves (confirmed real friction). A bare "@handle"
// is left as-is — founder.instagram etc. don't require a full URL, and
// runOnboardingResearch/runFounderResearch both already treat a plain
// handle as a real research lead, not just a link.
export function normalizeOnboardingLink(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed || trimmed.startsWith('@')) return trimmed
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).toString()
  } catch {
    return trimmed
  }
}
