const PREFIX = 'culo_v1_'
const KEY    = 'village_import_batches'

import type { VIFSource } from '../types/villageImport'

export interface ImportBatch {
  id: string
  batchName: string
  source?: VIFSource
  importedAt: string
  founderCount: number
  created: number
  skipped: number
  errored: number
  businessesCreated: number
  contentCreated: number
  intelGenerated: number
}

function load(): ImportBatch[] {
  try {
    const raw = localStorage.getItem(PREFIX + KEY)
    return raw ? (JSON.parse(raw) as ImportBatch[]) : []
  } catch {
    return []
  }
}

function save(batches: ImportBatch[]): void {
  localStorage.setItem(PREFIX + KEY, JSON.stringify(batches))
}

export const importBatchService = {
  getAll(): ImportBatch[] {
    return load()
  },

  save(batch: Omit<ImportBatch, 'id' | 'importedAt'>): ImportBatch {
    const record: ImportBatch = {
      ...batch,
      id: crypto.randomUUID(),
      importedAt: new Date().toISOString(),
    }
    save([record, ...load()])
    return record
  },

  delete(id: string): void {
    save(load().filter(b => b.id !== id))
  },

  clear(): void {
    save([])
  },
}
