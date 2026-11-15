import { Link, Navigate, NavLink, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { getSubject, topicKey } from '../data'
import type { Subject } from '../types'
import { useProgress } from '../lib/progress'
import { subjectStyle } from '../lib/subjectStyle'
import Flashcards from '../components/Flashcards'
import IrregularVerbs from '../components/IrregularVerbs'
import ProgressBar from '../components/ProgressBar'

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
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {subject.books!.map((b) => (
        <Link key={b.id} to={`/predmet/${subject.id}/cetba/${b.id}`} className="card flex flex-col gap-2 p-4 transition-colors hover:border-indigo-400">
          <div>
            <div className="text-lg leading-tight font-semibold">{b.title}</div>
            <div className="muted text-sm">
              {b.author} · {b.year}
            </div>
          </div>
          <div className="mt-auto flex flex-wrap gap-1.5 text-xs">
            {[b.druh, b.zanr, b.period].map((tag) => (
              <span key={tag} className="rounded-md bg-ink-100 px-2 py-0.5 dark:bg-ink-800">
                {tag}
              </span>
            ))}
          </div>
        </Link>
      ))}
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
                {q.description} Otázek: {q.questions.length}.
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
  const subject = getSubject(subjectId)
  if (!subject) return <Navigate to="/" replace />

  const tabs = tabsFor(subject)
  const current = tabs.find((t) => t.id === tab) ?? tabs[0]
  if (tab && current.id !== tab) return <Navigate to={`/predmet/${subject.id}`} replace />

  const style = subjectStyle[subject.id]
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
