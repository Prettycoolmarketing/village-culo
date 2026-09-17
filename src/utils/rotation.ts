// Deterministic "pick N of the pool, changing once a day" — same result for
// every visitor and for the bot-prerendering middleware within a given day
// (so a crawler and a live visitor never see mismatched content), but
// cycling through the whole pool over time instead of freezing on
// whichever items happen to sort first. Used anywhere on the site that
// promises rotation ("Founder of the Day," "Featured Founders" on the
// homepage) but was previously just slicing the same fixed items forever.
export function dailyRotatingSlice<T>(items: readonly T[], count: number): T[] {
  if (items.length === 0) return []
  if (items.length <= count) return [...items]
  const dayIndex = Math.floor(Date.now() / 86_400_000)
  const start = (dayIndex * count) % items.length
  const out: T[] = []
  for (let i = 0; i < count; i++) out.push(items[(start + i) % items.length]!)
  return out
}

export function dailyRotatingPick<T>(items: readonly T[]): T | undefined {
  return dailyRotatingSlice(items, 1)[0]
}
