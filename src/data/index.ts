// Datová vrstva: vestavěný obsah z JSON souborů + obsah, který přidal učitel školy.
// Nový vestavěný obsah stačí přidat do příslušného JSON souboru – komponenty se o něj postarají samy.
import { useMemo } from 'react'
import type { Book, Deck, Quiz, Subject, SubjectId, Topic, Verb } from '../types'
import { useSchoolContent, type SchoolContent } from '../lib/school'

import cjTopics from './cestina/topics.json'
import cjBooks from './cestina/books.json'
import cjQuizzes from './cestina/quizzes.json'
import cjDecks from './cestina/flashcards.json'
import maTopics from './matematika/topics.json'
import maQuizzes from './matematika/quizzes.json'
import maDecks from './matematika/flashcards.json'
import ajTopics from './anglictina/topics.json'
import ajQuizzes from './anglictina/quizzes.json'
import ajDecks from './anglictina/flashcards.json'
import ajVerbs from './anglictina/irregular-verbs.json'
import thTopics from './tahaky/topics.json'
import thDecks from './tahaky/flashcards.json'

export const builtinSubjects: Subject[] = [
  {
    id: 'cestina',
    name: 'Český jazyk',
    tagline: 'Jazyk, teorie literatury a rozbory četby',
    topics: cjTopics as Topic[],
    books: cjBooks as Book[],
    quizzes: cjQuizzes as Quiz[],
    decks: cjDecks as Deck[],
  },
  {
    id: 'matematika',
    name: 'Matematika',
    tagline: 'Přehledy podle okruhů didaktického testu a cvičení s kontrolou',
    topics: maTopics as Topic[],
    quizzes: maQuizzes as Quiz[],
    decks: maDecks as Deck[],
  },
  {
    id: 'anglictina',
    name: 'Angličtina',
    tagline: 'Gramatika, nepravidelná slovesa a fráze k ústní zkoušce',
    topics: ajTopics as Topic[],
    quizzes: ajQuizzes as Quiz[],
    decks: ajDecks as Deck[],
    verbs: ajVerbs as Verb[],
  },
  {
    id: 'tahaky',
    name: 'Tahánky a lifehacky',
    tagline: 'Sloh, ústní zkouška a jak se učit',
    topics: thTopics as Topic[],
    quizzes: [],
    decks: thDecks as Deck[],
  },
]

export const BUILTIN_IDS = builtinSubjects.map((s) => s.id)

/** Spojí vestavěné předměty s obsahem školy. */
export function mergeSubjects(content: SchoolContent): Subject[] {
  const extra = (id: string) => (content.topics[id] ?? []).map((t) => ({ ...t, custom: true }))
  return [
    ...builtinSubjects.map((s) => (content.topics[s.id]?.length ? { ...s, topics: [...s.topics, ...extra(s.id)] } : s)),
    ...content.subjects.map((s) => ({ id: s.id, name: s.name, tagline: s.tagline, custom: true, topics: extra(s.id), quizzes: [], decks: [] })),
  ]
}

export function useSubjects(): Subject[] {
  const content = useSchoolContent()
  return useMemo(() => mergeSubjects(content), [content])
}

export function getSubject(subjects: Subject[], id: string | undefined): Subject | undefined {
  return subjects.find((s) => s.id === id)
}

export const topicKey = (subject: SubjectId, topicId: string) => `${subject}/${topicId}`
