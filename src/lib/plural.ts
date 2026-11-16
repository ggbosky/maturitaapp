/** České skloňování po číslovce: 1 téma, 2–4 témata, 5+ témat (a 0 témat). */
export function plural(n: number, one: string, few: string, many: string): string {
  return `${n} ${n === 1 ? one : n >= 2 && n <= 4 ? few : many}`
}
