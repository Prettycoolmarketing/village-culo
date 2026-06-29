export interface VillageSettings {
  villageName: string
  villageDescription: string
  defaultClaimText: string
  defaultEthicsText: string
  defaultCTA: string
  seoDefaultTitle: string
  seoDefaultDescription: string
  ogDefaultImage: string
  footerText: string
  createWithCuloDefaultText: string
  defaultFeaturedImage: string
}

export const DEFAULT_VILLAGE_SETTINGS: VillageSettings = {
  villageName: 'CULO Village',
  villageDescription: 'A curated directory of Australian founder stories, businesses, and content.',
  defaultClaimText: 'This profile was curated by CULO Village using publicly available information and links to the creator\'s original work.',
  defaultEthicsText: 'Village never claims ownership of founder content. All source links are preserved. Profiles show a visible claim banner until claimed by the founder.',
  defaultCTA: 'Create with CULO — transform your stories into carousels, reels and blogs.',
  seoDefaultTitle: 'CULO Village — Australian Founder Stories',
  seoDefaultDescription: 'Discover Australian founders, businesses and their stories. Curated knowledge from real people building real things.',
  ogDefaultImage: '/placeholders/village-cover.svg',
  footerText: '© CULO Village. Built with CULO.',
  createWithCuloDefaultText: 'Ready to turn your story into content? Create with CULO.',
  defaultFeaturedImage: '/placeholders/village-cover.svg',
}

// ─── Permission roles (architecture only — no auth required yet) ──────────────

export type VillageRole = 'admin' | 'editor' | 'moderator' | 'viewer'

export interface VillageRoleConfig {
  role: VillageRole
  canPublish: boolean
  canCurate: boolean
  canModerate: boolean
  canExport: boolean
  canManageSettings: boolean
  canDeleteContent: boolean
}

export const VILLAGE_ROLE_CONFIGS: Record<VillageRole, VillageRoleConfig> = {
  admin:     { role: 'admin',     canPublish: true,  canCurate: true,  canModerate: true,  canExport: true,  canManageSettings: true,  canDeleteContent: true  },
  editor:    { role: 'editor',    canPublish: true,  canCurate: true,  canModerate: false, canExport: true,  canManageSettings: false, canDeleteContent: false },
  moderator: { role: 'moderator', canPublish: false, canCurate: true,  canModerate: true,  canExport: false, canManageSettings: false, canDeleteContent: false },
  viewer:    { role: 'viewer',    canPublish: false, canCurate: false, canModerate: false, canExport: false, canManageSettings: false, canDeleteContent: false },
}
