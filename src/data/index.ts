// Datová vrstva: jediné místo, kde se JSON soubory s obsahem skládají do předmětů.
// Nový obsah stačí přidat do příslušného JSON souboru – komponenty se o něj postarají samy.
import type { Book, Deck, Quiz, Subject, SubjectId, Topic, Verb } from '../types'

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

export const subjects: Subject[] = [
  {
    id: 'cestina',
    name: 'Český jazyk',
    tagline: 'Syntax, teorie literatury a rozbory četby',
    topics: cjTopics as Topic[],
    books: cjBooks as Book[],
    quizzes: cjQuizzes as Quiz[],
    decks: cjDecks as Deck[],
  },
  {
    id: 'matematika',
    name: 'Matematika',
    tagline: 'Vzorečky, přehledy a příklady s kontrolou',
    topics: maTopics as Topic[],
    quizzes: maQuizzes as Quiz[],
    decks: maDecks as Deck[],
  },
  {
    id: 'anglictina',
    name: 'Angličtina',
    tagline: 'Časy, kondicionály, otázky a nepravidelná slovesa',
    topics: ajTopics as Topic[],
    quizzes: ajQuizzes as Quiz[],
    decks: ajDecks as Deck[],
    verbs: ajVerbs as Verb[],
  },
  {
    id: 'tahaky',
    name: 'Tahánky a lifehacky',
    tagline: 'Sloh a ústní zkouška: jak to přežít',
    topics: thTopics as Topic[],
    quizzes: [],
    decks: thDecks as Deck[],
  },
]

export function getSubject(id: string | undefined): Subject | undefined {
  return subjects.find((s) => s.id === id)
}

export const topicKey = (subject: SubjectId, topicId: string) => `${subject}/${topicId}`
