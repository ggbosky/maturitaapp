import type { Question } from '../types'

/** Sjednotí zápis odpovědi: velikost písmen, mezery, typy apostrofů a minusů, desetinnou čárku. */
export function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[−–]/g, '-')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/, '')
}

/** U výběru z možností je odpovědí index, u doplňovačky text. */
export function isCorrect(q: Question, given: number | string | undefined): boolean {
  if (given === undefined) return false
  if (q.type === 'choice') return given === q.answer
  if (typeof given !== 'string') return false
  const g = normalize(given)
  return g !== '' && q.answers.some((a) => normalize(a) === g)
}

export function score(questions: Question[], given: (number | string | undefined)[]): number {
  return questions.reduce((n, q, i) => n + (isCorrect(q, given[i]) ? 1 : 0), 0)
}

/** Slovní hodnocení podle procent. */
export function verdict(percent: number): string {
  if (percent >= 90) return 'Výborně, tohle umíš.'
  if (percent >= 70) return 'Dobrá práce, zbývá doladit pár detailů.'
  if (percent >= 45) return 'Základ máš. Projdi si vysvětlení a zkus to znovu.'
  return 'Tohle téma si ještě zopakuj v přehledech.'
}
