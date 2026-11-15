// Datové typy obsahu. JSON soubory v src/data/ musí odpovídat těmto tvarům.

export type SubjectId = 'cestina' | 'matematika' | 'anglictina' | 'tahaky'

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

export interface Topic {
  id: string
  title: string
  /** Skupina, pod kterou se téma řadí v přehledu (např. „Syntax“). */
  category: string
  summary: string
  sections: TopicSection[]
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
  tema: string
  motivy: string[]
  casoprostor: string
  kompozice: string
  postavy: { name: string; desc: string }[]
  jazyk: string
  kontext: string
  ukazka?: { text: string; note?: string }
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
  tagline: string
  topics: Topic[]
  quizzes: Quiz[]
  decks: Deck[]
  books?: Book[]
  verbs?: Verb[]
}
