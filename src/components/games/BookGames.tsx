import { useMemo, useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import type { Book } from '../../types'
import MatchGame from './MatchGame'
import SprintGame from './SprintGame'

type Mode = 'authors' | 'sprint-author' | 'sprint-druh' | 'sprint-period'

/** Hry nad katalogem četby: kdo dílo napsal, literární druh, období. */
export default function BookGames({ books }: { books: Book[] }) {
  const [mode, setMode] = useState<Mode>('authors')
  const byAuthor = useMemo(() => books.map((b) => ({ a: b.title, b: b.author })), [books])
  const byDruh = useMemo(() => books.map((b) => ({ a: b.title, b: b.forma ?? b.druh })), [books])
  const byPeriod = useMemo(() => books.map((b) => ({ a: `${b.title} (${b.author})`, b: b.period })), [books])

  const modes: { id: Mode; label: string }[] = [
    { id: 'authors', label: 'Kdo to napsal?' },
    { id: 'sprint-author', label: 'Rychlovka: autor' },
    { id: 'sprint-druh', label: 'Rychlovka: forma' },
    { id: 'sprint-period', label: 'Rychlovka: období' },
  ]

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-500/30 dark:bg-indigo-500/5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Gamepad2 size={22} className="text-indigo-500" /> Procvič četbu
        </h2>
        <div className="ml-auto flex flex-wrap gap-1" role="tablist" aria-label="Hra">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={m.id === mode}
              onClick={() => setMode(m.id)}
              className={`btn px-3 py-1.5 ${m.id === mode ? 'btn-primary' : 'text-ink-600 hover:bg-white dark:text-ink-300 dark:hover:bg-ink-800'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {mode === 'authors' && <MatchGame pairs={byAuthor} title="Kdo to napsal?" leftLabel="Dílo" rightLabel="Autor" />}
      {mode === 'sprint-author' && <SprintGame key={mode} pairs={byAuthor} id="cetba-autor" title="Četba: autor" question="Napsal tohle dílo tento autor?" />}
      {mode === 'sprint-druh' && <SprintGame key={mode} pairs={byDruh} id="cetba-forma" title="Četba: forma" question="Je to próza, poezie, nebo drama?" />}
      {mode === 'sprint-period' && <SprintGame key={mode} pairs={byPeriod} id="cetba-obdobi" title="Četba: období" question="Patří dílo do tohoto období?" />}
    </section>
  )
}
