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
import type { Business, Founder, Story, Topic } from '../types'

/** Topics whose name (or a significant word from it) appears in the given text — cheap keyword match against the real taxonomy, not the generic import-content bucket list. */
export function suggestTopicsFromText(text: string, candidates: Topic[]): Topic[] {
  const lower = text.toLowerCase()
  return candidates.filter(topic => {
    const words = topic.name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    return lower.includes(topic.name.toLowerCase()) || words.some(w => lower.includes(w))
  })
}

function firstSentence(text: string): string | undefined {
  return text.split(/(?<=[.!?])\s+/).find(s => s.trim().length > 10)
}

// Bio/story text often carries double spaces, tabs or line breaks typed by
// the founder — fine in a textarea, but reads as broken once pulled into a
// short FAQ answer, so every suggested pair is normalized before it's shown.
function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/**
 * Real Q&A pairs pulled from real profile data — never a fabricated answer.
 * Leads with entity-grounded questions built straight from the founder's own
 * businesses and bio (a real person asking "who is X" or "what businesses has
 * X founded" gets a real, specific, answerable question — not a generic
 * template like "What challenge did they face?" with no context), then adds
 * whatever real Q&A the founder's own written text (Bio + published Blogs)
 * actually supports.
 */
export function suggestFaqsFromFounder(founder: Founder, stories: Story[], businesses: Business[] = []): BlogQaPair[] {
  const pairs: BlogQaPair[] = []

  const bioLead = firstSentence(founder.bio) ?? founder.bio
  if (bioLead) pairs.push({ question: `Who is ${founder.name}?`, answer: bioLead })

  if (businesses.length > 0) {
    pairs.push({
      question: `How many businesses has ${founder.name} founded?`,
      answer: businesses.length === 1
        ? `${founder.name} founded ${businesses[0]!.name}.`
        : `${founder.name} has founded ${businesses.length} businesses: ${businesses.map(b => b.name).join(', ')}.`,
    })
    for (const biz of businesses) {
      const bizAnswer = biz.tagline || firstSentence(biz.description) || biz.description
      if (bizAnswer) pairs.push({ question: `What is ${biz.name}?`, answer: bizAnswer })
    }
  }

  const storyText = stories.map(s => s.blog).filter(Boolean).join(' ')
  const combined = [founder.bio, storyText].filter(Boolean).join(' ')
  if (combined.trim()) {
    const blogPairs = extractQaFromBlog(founder.name, combined)
      .filter(p => !pairs.some(existing => existing.question === p.question))
    pairs.push(...blogPairs)
  }

  return pairs.map(p => ({ question: clean(p.question), answer: clean(p.answer) }))
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
