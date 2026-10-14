import { getFounder, updateFounder } from '../services/founders'
import type { Founder } from '../types'

// Was a SHA-256 over the file's full byte content — correct, but "cheap"
// turned out false for a real Snapchat/Instagram export: reading a
// multi-hundred-MB-to-multi-GB zip into memory and hashing it in one
// crypto.subtle.digest call could sit there for a long time with zero
// progress feedback, which looked identical to a frozen tab. Confirmed
// live as "Checking file…" never moving. Name + size + lastModified is
// effectively unique for "is this the exact same export I already
// uploaded" (two genuinely different archive exports matching on all
// three is not a realistic collision) and is instant, no file reading
// required at all.
export async function hashFile(file: File): Promise<string> {
  const fingerprint = `${file.name}:${file.size}:${file.lastModified}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint))
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
