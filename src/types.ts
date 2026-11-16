// Datové typy obsahu. JSON soubory v src/data/ musí odpovídat těmto tvarům.

/** Vestavěné předměty mají pevné id, předměty přidané učitelem začínají „u-“. */
export type SubjectId = string

/** Jeden blok výkladu uvnitř tématu. Všechna pole kromě nadpisu jsou volitelná. */
export interface TopicSection {
  heading: string
  text?: string
  bullets?: string[]
  /** Vzorečky: popisek + vzorec (zobrazí se neproporcionálním písmem). */
  formulas?: { label: string; formula: string }[]
  table?: { head: string[]; rows: string[][] }
  example?: string
  tip?: string
  /** Odkaz na externí zdroj (otevře se v prohlížeči). */
  link?: { label: string; url: string }
}

/** Podklady pro hry a procvičování u tématu. */
export interface Practice {
  /** Dvojice pojem – vysvětlení pro přiřazování, rychlovku a kartičky. */
  pairs?: { a: string; b: string }[]
  /** Otázky pro kvíz k tématu. */
  questions?: Question[]
}

export interface Topic {
  id: string
  title: string
  /** Skupina, pod kterou se téma řadí v přehledu (např. „Syntax“). */
  category: string
  summary: string
  sections: TopicSection[]
  practice?: Practice
  /** Téma přidal učitel školy. */
  custom?: boolean
}

export interface Book {
  id: string
  title: string
  author: string
  year: string
  /** Literární směr / období. */
  period: string
  druh: string
  zanr: string
  /** Literární forma ze seznamu četby: próza, poezie, drama. */
  forma?: 'Próza' | 'Poezie' | 'Drama'
  tema: string
  motivy?: string[]
  casoprostor?: string
  kompozice?: string
  postavy?: { name: string; desc: string }[]
  jazyk?: string
  kontext?: string
  ukazka?: { text: string; note?: string }
  /** Údaje o díle je potřeba ověřit (zobrazí se upozornění). */
  overit?: boolean
  /** Skupina maturitního seznamu četby (1–4), viz BOOK_GROUPS. */
  skupina: 1 | 2 | 3 | 4
}

export type Question =
  | { type: 'choice'; question: string; options: string[]; answer: number; explanation?: string }
  | { type: 'input'; question: string; answers: string[]; explanation?: string }

export interface Quiz {
  id: string
  title: string
  description: string
  questions: Question[]
}

export interface Deck {
  id: string
  title: string
  cards: { front: string; back: string }[]
}

export interface Verb {
  base: string
  past: string
  participle: string
  cs: string
}

export interface Subject {
  id: SubjectId
  name: string
  /** Předmět přidal učitel školy (např. odborný předmět). */
  custom?: boolean
  tagline: string
  topics: Topic[]
  quizzes: Quiz[]
  decks: Deck[]
  books?: Book[]
  verbs?: Verb[]
}

/** Čtyři skupiny, do kterých se dělí školní seznamy maturitní četby. */
export const BOOK_GROUPS: Record<Book['skupina'], string> = {
  1: 'Světová a česká literatura do konce 18. století',
  2: 'Světová a česká literatura 19. století',
  3: 'Světová literatura 20. a 21. století',
  4: 'Česká literatura 20. a 21. století',
}
