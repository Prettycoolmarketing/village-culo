import { readCache, writeEntity, pullVisibleRows, type WriteResult } from '../lib/entityStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

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
    // A row whose `data` blob is missing its own id (it happened once from
    // a raw SQL seed that set name/steps but not id inside the JSON) used
    // to crash this sort outright — Cannot read properties of undefined
    // (reading 'localeCompare') — which took the whole page blank with it,
    // no error boundary catching it. Falling back to '' keeps a genuinely
    // malformed row from taking down everything else.
    return [...readCache<EmailSequence>(SEQ_KEY)].sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''))
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

  // Manually runs the same send-sequence-emails the daily cron calls —
  // every active enrollment across every sequence, not just one. Testing a
  // sequence edit used to mean waiting for the next 9pm UTC run (or longer,
  // if the step's day hadn't technically arrived yet); this lets staff see
  // the real send happen the same day.
  async sendNow(): Promise<{ success: boolean; sent?: number; error?: string }> {
    if (!isSupabaseConfigured || !supabase) return { success: false, error: 'Not available in this environment.' }
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; sent?: number; error?: string }>('send-sequence-emails', { body: {} })
    if (error) return { success: false, error: error.message }
    if (data?.error) return { success: false, error: data.error }
    return { success: true, sent: data?.sent ?? 0 }
  },
}

export const emailSequenceEnrollmentsService = {
  getAll(): EmailSequenceEnrollment[] {
    return [...readCache<EmailSequenceEnrollment>(ENROLL_KEY)].sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))
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
