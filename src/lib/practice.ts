import type { Topic } from '../types'

export interface Pair {
  a: string
  b: string
}

export function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const MAX = 110

/**
 * Dvojice pro hry k tématu: ručně zadané dvojice, vzorce (popisek → vzorec)
 * a tabulky (první sloupec → druhý sloupec). Díky tomu má hry skoro každé téma bez práce navíc.
 */
export function topicPairs(topic: Topic): Pair[] {
  const out: Pair[] = [...(topic.practice?.pairs ?? [])]
  for (const s of topic.sections) {
    for (const f of s.formulas ?? []) out.push({ a: f.label, b: f.formula })
    const t = s.table
    if (t && t.rows.length >= 3 && t.head.length >= 2) {
      for (const row of t.rows) if (row[0] && row[1]) out.push({ a: row[0], b: row[1] })
    }
  }
  const seenA = new Set<string>()
  const seenB = new Set<string>()
  return out.filter((p) => {
    const a = p.a.trim()
    const b = p.b.trim()
    if (!a || !b || a === '—' || b === '—' || a.length > MAX || b.length > MAX || seenA.has(a) || seenB.has(b)) return false
    seenA.add(a)
    seenB.add(b)
    return true
  })
}

/** Náhodné kolo dvojic, ve kterém se neopakuje žádná levá ani pravá strana. */
export function pickRound(pairs: Pair[], size: number): Pair[] {
  const out: Pair[] = []
  const a = new Set<string>()
  const b = new Set<string>()
  for (const p of shuffle(pairs)) {
    if (a.has(p.a) || b.has(p.b)) continue
    out.push(p)
    a.add(p.a)
    b.add(p.b)
    if (out.length === size) break
  }
  return out
}
