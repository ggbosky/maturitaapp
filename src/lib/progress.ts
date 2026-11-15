// Pokrok studenta uložený v localStorage. Jeden malý store, na který se komponenty přihlašují.
import { useSyncExternalStore } from 'react'

export interface QuizResult {
  best: number
  total: number
  attempts: number
}

export interface Progress {
  /** Klíč „předmět/téma“ → přečteno. */
  read: Record<string, boolean>
  /** Id testu → nejlepší výsledek. */
  quizzes: Record<string, QuizResult>
}

const KEY = 'zt:progress'
const empty: Progress = { read: {}, quizzes: {} }

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    const p = JSON.parse(raw)
    return { read: p.read ?? {}, quizzes: p.quizzes ?? {} }
  } catch {
    return empty
  }
}

let state = load()
const listeners = new Set<() => void>()

function update(next: Progress) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Úložiště není dostupné: pokrok platí jen do zavření aplikace.
  }
  listeners.forEach((l) => l())
}

export function setRead(key: string, read: boolean) {
  if (!!state.read[key] === read) return
  const next = { ...state.read }
  if (read) next[key] = true
  else delete next[key]
  update({ ...state, read: next })
}

export function recordQuiz(id: string, correct: number, total: number) {
  const prev = state.quizzes[id]
  update({
    ...state,
    quizzes: {
      ...state.quizzes,
      [id]: { best: Math.max(prev?.best ?? 0, correct), total, attempts: (prev?.attempts ?? 0) + 1 },
    },
  })
}

export function resetProgress() {
  update(empty)
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}
