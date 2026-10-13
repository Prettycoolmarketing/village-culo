import { getFounder, updateFounder } from '../services/founders'
import type { Founder } from '../types'

// SHA-256 of the raw file — cheap (no unzipping/parsing needed) and
// unique enough to recognise "this is the exact same export I already
// processed" before spending any time re-checking its contents.
export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function findPriorImport(
  founder: Founder | undefined,
  platform: 'instagram' | 'snapchat',
  hash: string,
): { importedAt: string } | undefined {
  return founder?.importedArchiveHashes?.find(h => h.platform === platform && h.hash === hash)
}

export async function recordImportHash(
  founderId: string,
  platform: 'instagram' | 'snapchat',
  hash: string,
): Promise<void> {
  const founder = getFounder(founderId)
  if (!founder) return
  // Already recorded (re-processing a file on purpose after the warning) —
  // don't pile up duplicate fingerprint entries for the same file.
  if (findPriorImport(founder, platform, hash)) return
  const next = {
    ...founder,
    importedArchiveHashes: [
      ...(founder.importedArchiveHashes ?? []),
      { platform, hash, importedAt: new Date().toISOString() },
    ],
  }
  await updateFounder(next)
}
