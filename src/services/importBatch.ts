import { readCache, writeEntity, deleteEntity, type WriteResult } from '../lib/entityStore'
import { store } from '../lib/store'
import type { VIFSource } from '../types/villageImport'

const KEY = 'village_import_batches'
const TABLE = 'import_batches'

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

export const importBatchService = {
  getAll(): ImportBatch[] {
    return readCache<ImportBatch>(KEY).sort((a, b) => b.importedAt.localeCompare(a.importedAt))
  },

  // Village HQ admin tooling only — RLS requires is_village_admin() to write this table.
  async save(batch: Omit<ImportBatch, 'id' | 'importedAt'>): Promise<ImportBatch & { write: WriteResult }> {
    const record: ImportBatch = {
      ...batch,
      id: crypto.randomUUID(),
      importedAt: new Date().toISOString(),
    }
    const write = await writeEntity<ImportBatch>({
      cacheKey: KEY,
      item: record,
      table: TABLE,
      toRow: (b, userId) => ({
        id: b.id,
        created_by: userId,
        batch_name: b.batchName,
        founder_count: b.founderCount,
        imported_at: b.importedAt,
        data: b,
      }),
    })
    return { ...record, write }
  },

  delete(id: string): Promise<WriteResult> {
    return deleteEntity({ cacheKey: KEY, id, table: TABLE })
  },

  async clear(): Promise<void> {
    for (const batch of this.getAll()) await this.delete(batch.id)
    store.set(KEY, [])
  },
}
