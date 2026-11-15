import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ClipboardCheck, Layers } from 'lucide-react'
import { subjects, topicKey } from '../data'
import { resetProgress, useProgress } from '../lib/progress'
import { subjectStyle } from '../lib/subjectStyle'
import ProgressBar from '../components/ProgressBar'

/** České skloňování po číslovce: 1 téma, 2–4 témata, 5+ témat. */
function plural(n: number, one: string, few: string, many: string) {
  return `${n} ${n === 1 ? one : n >= 2 && n <= 4 ? few : many}`
}

export default function Dashboard() {
  const progress = useProgress()

  const allTopics = subjects.flatMap((s) => s.topics.map((t) => ({ s, t })))
  const allQuizzes = subjects.flatMap((s) => s.quizzes.map((q) => ({ s, q })))
  const readCount = allTopics.filter(({ s, t }) => progress.read[topicKey(s.id, t.id)]).length
  const doneQuizzes = allQuizzes.filter(({ q }) => progress.quizzes[q.id])
  const avg =
    doneQuizzes.length === 0
      ? null
      : Math.round(
          (doneQuizzes.reduce((sum, { q }) => sum + progress.quizzes[q.id].best / progress.quizzes[q.id].total, 0) /
            doneQuizzes.length) *
            100,
        )

  const nextTopic = allTopics.find(({ s, t }) => !progress.read[topicKey(s.id, t.id)])
  const nextQuiz = allQuizzes.find(({ q }) => !progress.quizzes[q.id])
  const started = readCount > 0 || doneQuizzes.length > 0

  const stats = [
    { icon: CheckCircle2, label: 'Přečtená témata', value: `${readCount} / ${allTopics.length}` },
    { icon: ClipboardCheck, label: 'Hotové testy', value: `${doneQuizzes.length} / ${allQuizzes.length}` },
    { icon: Layers, label: 'Průměr nejlepších výsledků', value: avg === null ? '—' : `${avg} %` },
  ]

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{started ? 'Pokračuj, kde jsi skončil' : 'Začni s přípravou na maturitu'}</h1>
        <p className="muted mt-1">Přehledy, testy a taháky z češtiny, matematiky a angličtiny na jednom místě.</p>
      </header>

      <section aria-label="Tvůj pokrok" className="card grid divide-ink-200 sm:grid-cols-3 sm:divide-x dark:divide-ink-800">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 p-5">
            <Icon size={22} className="text-indigo-500" />
            <div>
              <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
              <div className="muted text-sm">{label}</div>
            </div>
          </div>
        ))}
      </section>

      {(nextTopic || nextQuiz) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {nextTopic && (
            <Link
              to={`/predmet/${nextTopic.s.id}/tema/${nextTopic.t.id}`}
              className="group rounded-xl bg-indigo-600 p-5 text-white transition-colors hover:bg-indigo-500"
            >
              <div className="text-xs font-semibold tracking-wider text-indigo-200 uppercase">Další téma · {nextTopic.s.name}</div>
              <div className="mt-1 flex items-center justify-between gap-3 text-lg font-semibold">
                {nextTopic.t.title}
                <ArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          )}
          {nextQuiz && (
            <Link to={`/predmet/${nextQuiz.s.id}/test/${nextQuiz.q.id}`} className="card group p-5 transition-colors hover:border-indigo-400">
              <div className="muted text-xs font-semibold tracking-wider uppercase">Vyzkoušej se · {nextQuiz.s.name}</div>
              <div className="mt-1 flex items-center justify-between gap-3 text-lg font-semibold">
                {nextQuiz.q.title}
                <ArrowRight size={18} className="shrink-0 text-indigo-500 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Předměty</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map((s) => {
            const style = subjectStyle[s.id]
            const Icon = style.icon
            const read = s.topics.filter((t) => progress.read[topicKey(s.id, t.id)]).length
            const counts = [
              plural(s.topics.length, 'téma', 'témata', 'témat'),
              s.books && plural(s.books.length, 'dílo', 'díla', 'děl'),
              s.verbs && plural(s.verbs.length, 'sloveso', 'slovesa', 'sloves'),
              s.quizzes.length > 0 && plural(s.quizzes.length, 'test', 'testy', 'testů'),
            ].filter(Boolean)
            return (
              <Link key={s.id} to={`/predmet/${s.id}`} className="card flex flex-col gap-4 p-5 transition-colors hover:border-indigo-400">
                <div className="flex items-start gap-4">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${style.badge}`}>
                    <Icon size={22} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-lg font-semibold">{s.name}</div>
                    <div className="muted text-sm">{s.tagline}</div>
                  </div>
                </div>
                <div className="mt-auto flex flex-col gap-2">
                  <div className="muted flex justify-between text-xs tabular-nums">
                    <span>{counts.join(' · ')}</span>
                    <span>
                      přečteno {read} / {s.topics.length}
                    </span>
                  </div>
                  <ProgressBar value={read} max={s.topics.length} barClass={style.bar} />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {started && (
        <div>
          <button
            type="button"
            className="muted cursor-pointer text-sm underline-offset-4 hover:underline"
            onClick={(e) => {
              // Potvrzení druhým kliknutím, bez systémového dialogu.
              const b = e.currentTarget
              if (b.dataset.armed) resetProgress()
              else {
                b.dataset.armed = '1'
                b.textContent = 'Opravdu smazat všechen pokrok? Klikni znovu.'
              }
            }}
          >
            Vymazat pokrok
          </button>
        </div>
      )}
    </div>
  )
}
