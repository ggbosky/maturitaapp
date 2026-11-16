import { useState } from 'react'
import { Link, Navigate, NavLink, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { getSubject, topicKey, useSubjects } from '../data'
import { BOOK_GROUPS, type Subject } from '../types'
import { fold } from '../lib/search'
import { useProgress } from '../lib/progress'
import { subjectStyle } from '../lib/subjectStyle'
import Flashcards from '../components/Flashcards'
import IrregularVerbs from '../components/IrregularVerbs'
import ProgressBar from '../components/ProgressBar'
import BookGames from '../components/games/BookGames'

function tabsFor(s: Subject) {
  return [
    { id: 'temata', label: s.id === 'tahaky' ? 'Taháky' : 'Přehledy', show: true },
    { id: 'cetba', label: 'Maturitní četba', show: !!s.books?.length },
    { id: 'slovesa', label: 'Nepravidelná slovesa', show: !!s.verbs?.length },
    { id: 'testy', label: s.id === 'matematika' ? 'Cvičení' : 'Testy', show: s.quizzes.length > 0 },
    { id: 'karticky', label: 'Kartičky', show: s.decks.length > 0 },
  ].filter((t) => t.show)
}

function Topics({ subject }: { subject: Subject }) {
  const progress = useProgress()
  const categories = [...new Set(subject.topics.map((t) => t.category))]
  if (subject.topics.length === 0) {
    return <p className="muted">V tomto předmětu zatím nejsou žádná témata. Přidá je učitel ve Správě školy.</p>
  }
  return (
    <div className="flex flex-col gap-8">
      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="muted mb-3 text-xs font-semibold tracking-wider uppercase">{cat}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {subject.topics
              .filter((t) => t.category === cat)
              .map((t) => (
                <Link
                  key={t.id}
                  to={`/predmet/${subject.id}/tema/${t.id}`}
                  className="card group flex items-start gap-3 p-4 transition-colors hover:border-indigo-400"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 font-semibold">
                      {t.title}
                      {t.custom && <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">škola</span>}
                      {progress.read[topicKey(subject.id, t.id)] && (
                        <CheckCircle2 size={16} className="shrink-0 text-emerald-500" aria-label="Přečteno" />
                      )}
                    </div>
                    <p className="muted mt-1 text-sm">{t.summary}</p>
                  </div>
                  <ChevronRight size={18} className="muted mt-0.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Books({ subject }: { subject: Subject }) {
  const [query, setQuery] = useState('')
  const [druh, setDruh] = useState('')
  const books = subject.books!
  const druhy = ['Próza', 'Poezie', 'Drama'].filter((f) => books.some((b) => (b.forma ?? '') === f))
  const q = fold(query.trim())
  const shown = books.filter(
    (b) => (!druh || b.forma === druh) && (!q || fold(`${b.title} ${b.author} ${b.zanr} ${b.period}`).includes(q)),
  )
  const chip = (active: boolean) =>
    `cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ${
      active
        ? 'border-indigo-600 bg-indigo-600 text-white'
        : 'border-ink-200 hover:border-indigo-400 dark:border-ink-700'
    }`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          id="book-filter"
          type="search"
          className="input max-w-xs"
          placeholder="Hledat dílo nebo autora…"
          aria-label="Hledat v četbě"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Literární forma">
          <button type="button" className={chip(druh === '')} aria-pressed={druh === ''} onClick={() => setDruh('')}>
            Vše
          </button>
          {druhy.map((d) => (
            <button key={d} type="button" className={chip(druh === d)} aria-pressed={druh === d} onClick={() => setDruh(d)}>
              {d}
            </button>
          ))}
        </div>
        <span className="muted ml-auto text-sm tabular-nums">
          {shown.length} z {books.length} {books.length === 1 ? 'díla' : 'děl'}
        </span>
      </div>

      <BookGames books={books} />

      {shown.length === 0 && <p className="muted">Žádné dílo neodpovídá filtru.</p>}

      {([1, 2, 3, 4] as const).map((g) => {
        const group = shown.filter((b) => b.skupina === g)
        if (group.length === 0) return null
        return (
          <section key={g}>
            <h2 className="muted mb-3 text-xs font-semibold tracking-wider uppercase">
              {BOOK_GROUPS[g]} · {group.length}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((b) => (
                <Link
                  key={b.id}
                  to={`/predmet/${subject.id}/cetba/${b.id}`}
                  className="card flex flex-col gap-2 p-4 transition-colors hover:border-indigo-400"
                >
                  <div>
                    <div className="leading-tight font-semibold">{b.title}</div>
                    <div className="muted text-sm">
                      {b.author} · {b.year}
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1.5 text-xs">
                    {[b.forma ?? b.druh, b.zanr].map((tag) => (
                      <span key={tag} className="rounded-md bg-ink-100 px-2 py-0.5 dark:bg-ink-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Quizzes({ subject }: { subject: Subject }) {
  const progress = useProgress()
  return (
    <div className="flex flex-col gap-3">
      {subject.quizzes.map((q) => {
        const r = progress.quizzes[q.id]
        return (
          <Link
            key={q.id}
            to={`/predmet/${subject.id}/test/${q.id}`}
            className="card flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-indigo-400"
          >
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{q.title}</div>
              <p className="muted text-sm">
                {q.description} Počet otázek: {q.questions.length}.
              </p>
            </div>
            {r ? (
              <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-sm font-medium text-emerald-800 tabular-nums dark:bg-emerald-500/15 dark:text-emerald-300">
                Nejlépe {r.best} / {r.total}
              </span>
            ) : (
              <span className="muted text-sm">Ještě nezkoušeno</span>
            )}
            <span className="btn btn-primary">{r ? 'Zkusit znovu' : 'Spustit'}</span>
          </Link>
        )
      })}
    </div>
  )
}

export default function SubjectPage() {
  const { subjectId, tab } = useParams()
  const progress = useProgress()
  const subjects = useSubjects()
  const subject = getSubject(subjects, subjectId)
  if (!subject) return <Navigate to="/" replace />

  const tabs = tabsFor(subject)
  const current = tabs.find((t) => t.id === tab) ?? tabs[0]
  if (tab && current.id !== tab) return <Navigate to={`/predmet/${subject.id}`} replace />

  const style = subjectStyle(subject.id)
  const Icon = style.icon
  const read = subject.topics.filter((t) => progress.read[topicKey(subject.id, t.id)]).length
  const quizzesDone = subject.quizzes.filter((q) => progress.quizzes[q.id]).length

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${style.badge}`}>
            <Icon size={24} />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{subject.name}</h1>
            <p className="muted">{subject.tagline}</p>
          </div>
        </div>
        <div className="flex w-56 flex-col gap-1.5">
          <div className="muted flex justify-between text-xs tabular-nums">
            <span>Přečtená témata</span>
            <span>
              {read} / {subject.topics.length}
            </span>
          </div>
          <ProgressBar value={read} max={subject.topics.length} />
          {subject.quizzes.length > 0 && (
            <div className="muted text-xs tabular-nums">
              Hotové testy: {quizzesDone} / {subject.quizzes.length}
            </div>
          )}
        </div>
      </header>

      <nav aria-label="Části předmětu" className="flex gap-1 overflow-x-auto border-b border-ink-200 dark:border-ink-800">
        {tabs.map((t, i) => (
          <NavLink
            key={t.id}
            to={i === 0 ? `/predmet/${subject.id}` : `/predmet/${subject.id}/${t.id}`}
            end
            aria-current={t.id === current.id ? 'page' : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              t.id === current.id
                ? 'border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300'
                : 'muted border-transparent hover:text-ink-800 dark:hover:text-ink-100'
            }`}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      {current.id === 'temata' && <Topics subject={subject} />}
      {current.id === 'cetba' && <Books subject={subject} />}
      {current.id === 'slovesa' && <IrregularVerbs verbs={subject.verbs!} />}
      {current.id === 'testy' && <Quizzes subject={subject} />}
      {current.id === 'karticky' && (
        <div className="flex max-w-2xl flex-col gap-10">
          {subject.decks.map((d) => (
            <section key={d.id} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">{d.title}</h2>
              <Flashcards deck={d} />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
