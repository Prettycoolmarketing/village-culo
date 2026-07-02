// Real, deterministic Flesch Reading Ease approximation — not ML, not
// fabricated. Syllable counting is a vowel-group heuristic (no dictionary),
// which is the standard approach when a full phonetic dictionary isn't
// available; it's accurate enough to move meaningfully with real edits,
// which is what the Story Builder needs it for.

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length === 0) return 0
  const matches = w.match(/[aeiouy]+/g)
  let count = matches ? matches.length : 1
  if (w.endsWith('e') && count > 1) count--
  return Math.max(1, count)
}

export interface ReadabilityResult {
  score: number
  label: 'Very Easy' | 'Easy' | 'Moderate' | 'Difficult' | 'Very Difficult'
  wordCount: number
  avgWordsPerSentence: number
}

export function computeReadability(text: string): ReadabilityResult {
  const clean = text.trim()
  if (!clean) return { score: 0, label: 'Very Difficult', wordCount: 0, avgWordsPerSentence: 0 }

  const words = clean.split(/\s+/).filter(Boolean)
  const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const wordCount = words.length
  const sentenceCount = Math.max(1, sentences.length)
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0)

  const avgWordsPerSentence = wordCount / sentenceCount
  const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0

  // Standard Flesch Reading Ease formula.
  const raw = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
  const score = Math.max(0, Math.min(100, Math.round(raw)))

  const label: ReadabilityResult['label'] =
    score >= 80 ? 'Very Easy' :
    score >= 60 ? 'Easy' :
    score >= 40 ? 'Moderate' :
    score >= 20 ? 'Difficult' : 'Very Difficult'

  return { score, label, wordCount, avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10 }
}
