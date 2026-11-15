// Pokrok studenta uložený v localStorage. Jeden malý store, na který se komponenty přihlašují.
import { useSyncExternalStore } from 'react'

export interface QuizResult {
  best: number
  total: number
  attempts: number
}

export interface LogEntry {
  /** Čas události (ISO). */
  at: string
  label: string
  /** Kam v aplikaci událost vede. */
  to: string
}

export interface Progress {
  /** Klíč „předmět/téma“ → přečteno. */
  read: Record<string, boolean>
  /** Id testu → nejlepší výsledek. */
  quizzes: Record<string, QuizResult>
  /** Den (RRRR-MM-DD) → počet dokončených aktivit. */
  activity: Record<string, number>
  /** Posledních několik aktivit, nejnovější první. */
  log: LogEntry[]
  /** Datum maturity, které si student nastavil. */
  examDate: string | null
}

/** Kolik aktivit denně stačí ke splnění denního cíle. */
export const DAILY_GOAL = 3

const KEY = 'zt:progress'
const empty: Progress = { read: {}, quizzes: {}, activity: {}, log: [], examDate: null }

export function dayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
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

/** Připíše dnešku jednu aktivitu a zapíše ji do historie. */
function withActivity(p: Progress, label: string, to: string): Progress {
  const today = dayKey()
  return {
    ...p,
    activity: { ...p.activity, [today]: (p.activity[today] ?? 0) + 1 },
    log: [{ at: new Date().toISOString(), label, to }, ...p.log].slice(0, 12),
  }
}

export function logActivity(label: string, to: string) {
  update(withActivity(state, label, to))
}

export function setRead(key: string, read: boolean, label: string, to: string) {
  if (!!state.read[key] === read) return
  const next = { ...state.read }
  if (read) next[key] = true
  else delete next[key]
  const p = { ...state, read: next }
  update(read ? withActivity(p, `Přečteno: ${label}`, to) : p)
}

export function recordQuiz(id: string, correct: number, total: number, label: string, to: string) {
  const prev = state.quizzes[id]
  update(
    withActivity(
      {
        ...state,
        quizzes: {
          ...state.quizzes,
          [id]: { best: Math.max(prev?.best ?? 0, correct), total, attempts: (prev?.attempts ?? 0) + 1 },
        },
      },
      `Test: ${label} (${correct} / ${total})`,
      to,
    ),
  )
}

export function setExamDate(date: string | null) {
  update({ ...state, examDate: date })
}

export function resetProgress() {
  update({ ...empty, examDate: state.examDate })
}

/** Počet dní v řadě se splněnou aspoň jednou aktivitou. Dnešek bez aktivity řadu ještě nepřeruší. */
export function streak(activity: Record<string, number>, today = new Date()): number {
  const d = new Date(today)
  if (!activity[dayKey(d)]) d.setDate(d.getDate() - 1)
  let n = 0
  while (activity[dayKey(d)]) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
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
