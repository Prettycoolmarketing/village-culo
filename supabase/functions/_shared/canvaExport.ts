// Shared by canva-export-images and canva-export-text — the Canva export
// job create/poll cycle and the size-capped fetch helper. Split out of what
// used to be a single canva-import-design function: doing both the PPTX
// text extraction (JSZip) and the JPG image re-upload loop inside one
// invocation kept exceeding the Edge Function's memory ceiling
// (WORKER_RESOURCE_LIMIT) on photo-heavy designs even with per-file size
// caps — splitting into two invocations halves peak memory per call
// instead of trying to guess ever-smaller byte thresholds.

export async function createExportJob(accessToken: string, designId: string, format: Record<string, unknown>): Promise<string> {
  const res = await fetch('https://api.canva.com/rest/v1/exports', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ design_id: designId, format }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.message ?? 'Canva export failed to start.')
  return body.job.id as string
}

export async function waitForExportJob(accessToken: string, jobId: string): Promise<string[]> {
  for (let attempt = 0; attempt < 45; attempt++) {
    const res = await fetch(`https://api.canva.com/rest/v1/exports/${jobId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.message ?? 'Canva export failed.')
    const job = body.job
    if (job.status === 'success') return (job.urls ?? []) as string[]
    if (job.status === 'failed') throw new Error(job.error?.message ?? 'Canva export failed.')
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('Canva export took too long — try again.')
}

/** Every download in either function goes through here so an oversized file degrades gracefully (skipped, not fatal) instead of crashing the invocation. */
export async function fetchWithLimit(url: string, maxBytes: number): Promise<ArrayBuffer | null> {
  const res = await fetch(url)
  if (!res.ok) return null
  const lengthHeader = res.headers.get('content-length')
  if (lengthHeader && Number(lengthHeader) > maxBytes) { void res.body?.cancel(); return null }

  const reader = res.body?.getReader()
  if (!reader) {
    const buf = await res.arrayBuffer()
    return buf.byteLength > maxBytes ? null : buf
  }
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) { void reader.cancel(); return null }
    chunks.push(value)
  }
  const combined = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.byteLength }
  return combined.buffer
}

export async function fetchDesignTitle(accessToken: string, designId: string): Promise<string> {
  const res = await fetch(`https://api.canva.com/rest/v1/designs/${designId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.message ?? 'Could not load that Canva design.')
  return body.design?.title || 'Untitled design'
}
