import { useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import type { Question } from '../types'
import type { Pair } from '../lib/practice'
import MatchGame from './games/MatchGame'
import SprintGame from './games/SprintGame'
import Flashcards from './Flashcards'
import Quiz from './Quiz'

type Mode = 'match' | 'sprint' | 'cards' | 'quiz'

/** Panel „Procvič si“: nabídne jen ty hry, pro které je dost podkladů. */
export default function Practice({ id, title, pairs, questions = [] }: { id: string; title: string; pairs: Pair[]; questions?: Question[] }) {
  const modes = [
    { id: 'match' as const, label: 'Přiřazování', show: pairs.length >= 4 },
    { id: 'sprint' as const, label: 'Rychlovka', show: pairs.length >= 4 },
    { id: 'quiz' as const, label: 'Kvíz', show: questions.length > 0 },
    { id: 'cards' as const, label: 'Kartičky', show: pairs.length >= 2 },
  ].filter((m) => m.show)
  const [mode, setMode] = useState<Mode | undefined>(modes[0]?.id)
  if (modes.length === 0) return null
  const current = modes.find((m) => m.id === mode) ?? modes[0]

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Gamepad2 size={22} className="text-indigo-500" /> Procvič si
        </h2>
        <div className="ml-auto flex flex-wrap gap-1" role="tablist" aria-label="Způsob procvičování">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={m.id === current.id}
              onClick={() => setMode(m.id)}
              className={`btn px-3 py-1.5 ${m.id === current.id ? 'btn-primary' : 'text-ink-600 hover:bg-white dark:text-ink-300 dark:hover:bg-ink-800'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {current.id === 'match' && <MatchGame pairs={pairs} title={title} />}
      {current.id === 'sprint' && <SprintGame pairs={pairs} id={id} title={title} />}
      {current.id === 'quiz' && <Quiz key={id} quiz={{ id: `tema:${id}`, title, description: '', questions }} />}
      {current.id === 'cards' && <Flashcards key={id} deck={{ id: `tema:${id}`, title, cards: pairs.map((p) => ({ front: p.a, back: p.b })) }} />}
    </section>
  )
}
