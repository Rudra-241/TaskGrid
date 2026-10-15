const BOUNDARY = /[\s\-_:/]/

function isBoundaryStart(text: string, index: number): boolean {
  return index === 0 || BOUNDARY.test(text[index - 1])
}

/**
 * Subsequence fuzzy matcher. Returns a score (higher is better) or -1 when the
 * query characters do not appear in order within the text. Ranking priorities:
 *   exact match  >  query starts a word  >  substring  >  scattered subsequence.
 */
export function fuzzyScore(text: string, query: string): number {
  if (!query) return 0
  const t = text.toLowerCase()
  const q = query.toLowerCase()

  if (t === q) return 1000

  const idx = t.indexOf(q)
  if (idx !== -1) {
    // Prefer matches that begin a word, then earlier positions.
    if (idx === 0) return 950 - t.length
    if (isBoundaryStart(t, idx)) return 880 - idx
    return 720 - idx
  }

  // Scattered subsequence match, rewarding consecutive and word-boundary hits.
  let ti = 0
  let score = 0
  let prevMatch = -2
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi]
    let found = -1
    for (; ti < t.length; ti++) {
      if (t[ti] === ch) {
        found = ti
        break
      }
    }
    if (found === -1) return -1
    const consecutive = found === prevMatch + 1
    score += 10 + (consecutive ? 6 : 0) + (isBoundaryStart(t, found) ? 8 : 0)
    prevMatch = found
    ti = found + 1
  }
  return score
}
