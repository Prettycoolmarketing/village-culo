// Cheap, deterministic (no API, no cost) suggestions for the fields that
// carry the most SEO/GEO weight on a Founder profile — Topics, FAQs, and
// Search Title/Description — generated from text the founder already wrote
// (Bio + their own published stories). Never invents anything: topics are
// matched keyword-style against the real taxonomy, FAQ answers are always a
// verbatim sentence pulled from the founder's own text (reuses the same
// extraction already proven out for imported content), and SEO fields are
// template-built from real profile data. Every suggestion is opt-in — the
// founder always confirms/edits before it's saved.

import { extractQaFromBlog, type BlogQaPair } from './importedContentEnrichment'
import type { Founder, Story, Topic } from '../types'

/** Topics whose name (or a significant word from it) appears in the given text — cheap keyword match against the real taxonomy, not the generic import-content bucket list. */
export function suggestTopicsFromText(text: string, candidates: Topic[]): Topic[] {
  const lower = text.toLowerCase()
  return candidates.filter(topic => {
    const words = topic.name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    return lower.includes(topic.name.toLowerCase()) || words.some(w => lower.includes(w))
  })
}

/** Real Q&A pairs pulled from the founder's Bio plus their own published stories' Blog text — same extraction as the import pipeline's "Shape these as Q&A." */
export function suggestFaqsFromFounder(founder: Founder, stories: Story[]): BlogQaPair[] {
  const storyText = stories.map(s => s.blog).filter(Boolean).join(' ')
  const combined = [founder.bio, storyText].filter(Boolean).join(' ')
  if (!combined.trim()) return []
  return extractQaFromBlog(founder.name, combined)
}

function truncateAtWord(text: string, max: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  const cut = trimmed.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()
}

/** Template-built Search Title/Description from real profile fields — no API, just the same data already on the page. */
export function suggestSeoFields(founder: Founder): { seoTitle: string; seoDescription: string } {
  const topTopics = founder.topics.slice(0, 2).map(t => t.name).join(' & ')
  const seoTitle = truncateAtWord(
    topTopics ? `${founder.name} — ${topTopics}` : `${founder.name} — ${founder.industry.name}`,
    60,
  )
  const bioSentence = founder.bio.split(/(?<=[.!?])\s+/).find(s => s.length > 20) ?? founder.bio
  const seoDescription = truncateAtWord(
    bioSentence || `${founder.name}, ${founder.industry.name} in ${founder.location.name}.`,
    160,
  )
  return { seoTitle, seoDescription }
}
