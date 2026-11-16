import type { Subject } from '../types'

export interface SearchHit {
  title: string
  /** Kde se výsledek nachází, např. „Český jazyk · Téma“. */
  where: string
  to: string
}

export interface Entry extends SearchHit {
  haystack: string
}

/** Bez diakritiky a malými písmeny, aby „cetba“ našla „četba“. */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function buildIndex(subjects: Subject[]): Entry[] {
  const out: Entry[] = []
  for (const s of subjects) {
    for (const t of s.topics) {
      const body = t.sections.map((x) => [x.heading, x.text, ...(x.bullets ?? [])].join(' ')).join(' ')
      out.push({
        title: t.title,
        where: `${s.name} · ${t.category}`,
        to: `/predmet/${s.id}/tema/${t.id}`,
        haystack: fold(`${t.title} ${t.summary} ${t.category} ${body}`),
      })
    }
    for (const b of s.books ?? []) {
      out.push({
        title: `${b.title} – ${b.author}`,
        where: `${s.name} · Četba`,
        to: `/predmet/${s.id}/cetba/${b.id}`,
        haystack: fold(`četba kniha rozbor ${b.title} ${b.author} ${b.period} ${b.zanr} ${(b.motivy ?? []).join(' ')} ${(b.postavy ?? []).map((p) => p.name).join(' ')}`),
      })
    }
    for (const q of s.quizzes) {
      out.push({
        title: q.title,
        where: `${s.name} · Test`,
        to: `/predmet/${s.id}/test/${q.id}`,
        haystack: fold(`${q.title} ${q.description} test kvíz`),
      })
    }
    for (const d of s.decks) {
      out.push({
        title: d.title,
        where: `${s.name} · Kartičky`,
        to: `/predmet/${s.id}/karticky`,
        haystack: fold(`${d.title} ${d.cards.map((c) => c.front).join(' ')} kartičky`),
      })
    }
    for (const v of s.verbs ?? []) {
      out.push({
        title: `${v.base} – ${v.past} – ${v.participle}`,
        where: `${s.name} · Nepravidelná slovesa (${v.cs})`,
        to: `/predmet/${s.id}/slovesa?q=${encodeURIComponent(v.base)}`,
        haystack: fold(`${v.base} ${v.past} ${v.participle} ${v.cs}`),
      })
    }
  }
  return out
}

export function search(index: Entry[], query: string, limit = 8): SearchHit[] {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  return index
    .map((e) => {
      if (!words.every((w) => e.haystack.includes(w))) return null
      // Shoda v názvu má přednost před shodou v textu.
      const title = fold(e.title)
      const rank = words.reduce((r, w) => r + (title.startsWith(w) ? 0 : title.includes(w) ? 1 : 3), 0)
      return { e, rank }
    })
    .filter((x) => x !== null)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(({ e }) => ({ title: e.title, where: e.where, to: e.to }))
}
