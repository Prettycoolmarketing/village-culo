export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function contentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    blog: 'Blog',
    reel: 'Reel',
    carousel: 'Carousel',
  }
  return labels[type] ?? type
}

export function noticeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    event: 'Event',
    collaboration: 'Collaboration',
    opportunity: 'Opportunity',
    request: 'Request',
  }
  return labels[type] ?? type
}
