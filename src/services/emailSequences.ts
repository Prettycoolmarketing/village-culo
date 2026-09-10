import { readCache, writeEntity, pullVisibleRows, type WriteResult } from '../lib/entityStore'

const SEQ_KEY = 'email_sequences'
const SEQ_TABLE = 'email_sequences'
const ENROLL_KEY = 'email_sequence_enrollments'
const ENROLL_TABLE = 'email_sequence_enrollments'

export interface EmailSequenceStep {
  day: number
  subject: string
  bodyHtml: string
}

export interface EmailSequence {
  id: string
  name: string
  steps: EmailSequenceStep[]
}

export interface EmailSequenceEnrollment {
  id: string
  sequenceId: string
  email: string
  name?: string
  source?: string
  startedAt: string
  sentDays: number[]
  status: 'active' | 'completed' | 'stopped'
}

export const emailSequencesService = {
  getAll(): EmailSequence[] {
    return [...readCache<EmailSequence>(SEQ_KEY)].sort((a, b) => a.id.localeCompare(b.id))
  },

  async refresh(): Promise<void> {
    await pullVisibleRows<EmailSequence>(SEQ_TABLE, SEQ_KEY)
  },

  save(sequence: EmailSequence): Promise<WriteResult> {
    return writeEntity<EmailSequence>({
      cacheKey: SEQ_KEY,
      item: sequence,
      table: SEQ_TABLE,
      toRow: s => ({ id: s.id, data: s }),
    })
  },
}

export const emailSequenceEnrollmentsService = {
  getAll(): EmailSequenceEnrollment[] {
    return [...readCache<EmailSequenceEnrollment>(ENROLL_KEY)].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  },

  async refresh(): Promise<void> {
    await pullVisibleRows<EmailSequenceEnrollment>(ENROLL_TABLE, ENROLL_KEY)
  },

  stop(enrollment: EmailSequenceEnrollment): Promise<WriteResult> {
    return writeEntity<EmailSequenceEnrollment>({
      cacheKey: ENROLL_KEY,
      item: { ...enrollment, status: 'stopped' },
      table: ENROLL_TABLE,
      toRow: e => ({ id: e.id, sequence_id: e.sequenceId, email: e.email, data: e }),
    })
  },
}
