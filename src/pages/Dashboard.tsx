import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Flame, Target } from 'lucide-react'
import { topicKey, useSubjects } from '../data'
import type { Subject } from '../types'
import { useSession } from '../license/license'
import { DAILY_GOAL, dayKey, resetProgress, setExamDate, streak, useProgress, type Progress } from '../lib/progress'
import { subjectStyle } from '../lib/subjectStyle'
import ProgressBar from '../components/ProgressBar'
import { plural } from '../lib/plural'


const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100))

/** Podíl přečtených témat a průměr nejlepších výsledků testů (nezkoušený test = 0). */
function subjectStats(progress: Progress, s: Subject) {
  const read = s.topics.filter((t) => progress.read[topicKey(s.id, t.id)]).length
  const quizSum = s.quizzes.reduce((sum, q) => {
    const r = progress.quizzes[q.id]
    return sum + (r ? r.best / r.total : 0)
  }, 0)
  return {
    read,
    topics: s.topics.length,
    topicsPct: pct(read, s.topics.length),
    quizzesDone: s.quizzes.filter((q) => progress.quizzes[q.id]).length,
    quizPct: s.quizzes.length === 0 ? null : Math.round((quizSum / s.quizzes.length) * 100),
  }
}

function Ring({ value }: { value: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 128 128" className="size-32 shrink-0" role="img" aria-label={`Připravenost ${value} %`}>
      <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10" className="stroke-ink-100 dark:stroke-ink-800" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform="rotate(-90 64 64)"
        className="stroke-indigo-500 transition-[stroke-dashoffset] duration-500"
      />
      <text x="64" y="64" textAnchor="middle" dominantBaseline="central" className="fill-ink-800 text-[26px] font-bold dark:fill-ink-100">
        {value} %
      </text>
    </svg>
  )
}

/** Sloupcový graf aktivit za posledních 14 dní s čárou denního cíle. */
function ActivityChart({ activity }: { activity: Record<string, number> }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return { date: d, count: activity[dayKey(d)] ?? 0 }
  })
  const max = Math.max(DAILY_GOAL + 1, ...days.map((d) => d.count))
  const total = days.reduce((n, d) => n + d.count, 0)

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex h-32 items-end gap-0.5">
        <div aria-hidden="true" className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-ink-300 dark:border-ink-600" style={{ bottom: `${(DAILY_GOAL / max) * 100}%` }} />
        {days.map(({ date, count }, i) => {
          const label = `${date.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'numeric' })}: ${plural(count, 'aktivita', 'aktivity', 'aktivit')}`
          return (
            <div key={i} tabIndex={0} aria-label={label} className="group relative flex h-full flex-1 items-end rounded-sm outline-offset-0">
              <div
                className={`w-full rounded-t ${count > 0 ? 'bg-indigo-500 group-hover:bg-indigo-400' : 'bg-ink-200 dark:bg-ink-700'}`}
                style={{ height: count > 0 ? `${(count / max) * 100}%` : '2px' }}
              />
              <div
                role="tooltip"
                className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-md bg-ink-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg group-hover:block group-focus:block dark:bg-ink-100 dark:text-ink-900 ${
                  i < 3 ? 'left-0' : i > 10 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                }`}
              >
                {label}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-0.5 border-t border-ink-200 pt-1 dark:border-ink-700" aria-hidden="true">
        {days.map(({ date }, i) => (
          <div key={i} className={`flex-1 text-center text-[11px] ${i === 13 ? 'font-semibold' : 'muted'}`}>
            {date.toLocaleDateString('cs-CZ', { weekday: 'narrow' })}
          </div>
        ))}
      </div>
      <p className="muted text-sm">{total === 0 ? 'Zatím žádná aktivita. Přečti téma nebo si dej test a graf se začne plnit.' : `Za 14 dní: ${plural(total, 'aktivita', 'aktivity', 'aktivit')}.`} Čárkovaná čára značí denní cíl {DAILY_GOAL} aktivity.</p>
    </div>
  )
}

function Countdown({ examDate }: { examDate: string | null }) {
  const days = examDate ? Math.ceil((new Date(`${examDate}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000) : null
  return (
    <section className="card flex flex-col gap-2 p-5">
      <h2 className="muted flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
        <CalendarDays size={14} /> Do maturity
      </h2>
      {days === null ? (
        <p className="text-sm">Nastav si datum zkoušky a uvidíš, kolik dní zbývá.</p>
      ) : (
        <div>
          <div className="text-4xl font-bold tracking-tight tabular-nums">{days > 0 ? days : days === 0 ? 'Dnes' : '—'}</div>
          <div className="muted text-sm">{days > 0 ? plural(days, 'den', 'dny', 'dní').replace(/^\d+ /, '') + ' zbývá' : days === 0 ? 'Hodně štěstí!' : 'Termín už proběhl'}</div>
        </div>
      )}
      <label className="muted mt-auto flex flex-col gap-1 text-xs">
        Datum zkoušky
        <input id="exam-date" type="date" className="input" value={examDate ?? ''} onChange={(e) => setExamDate(e.target.value || null)} />
      </label>
    </section>
  )
}

export default function Dashboard() {
  const progress = useProgress()
  const session = useSession()
  const subjects = useSubjects()
  const isTeacher = session.status === 'active' && session.role === 'teacher'
  const name = session.status !== 'active' ? '' : session.role === 'student' ? session.student.name : session.cert.school

  const stats = subjects.map((s) => ({ s, ...subjectStats(progress, s) }))
  const allTopics = subjects.flatMap((s) => s.topics.map((t) => ({ s, t })))
  const allQuizzes = subjects.flatMap((s) => s.quizzes.map((q) => ({ s, q })))
  const readCount = stats.reduce((n, x) => n + x.read, 0)
  const topicsPct = pct(readCount, allTopics.length)
  const quizPct = Math.round(
    (allQuizzes.reduce((sum, { q }) => sum + (progress.quizzes[q.id] ? progress.quizzes[q.id].best / progress.quizzes[q.id].total : 0), 0) / Math.max(1, allQuizzes.length)) * 100,
  )
  const readiness = Math.round((topicsPct + quizPct) / 2)

  const today = progress.activity[dayKey()] ?? 0
  const days = streak(progress.activity)
  const nextTopic = allTopics.find(({ s, t }) => !progress.read[topicKey(s.id, t.id)])
  const nextQuiz = allQuizzes.find(({ q }) => !progress.quizzes[q.id])
  const started = readCount > 0 || Object.keys(progress.quizzes).length > 0

  // Testy seřazené od nejslabšího výsledku; nezkoušené až za ně.
  const weak = allQuizzes
    .map(({ s, q }) => ({ s, q, r: progress.quizzes[q.id] }))
    .filter((x) => !x.r || x.r.best / x.r.total < 0.8)
    .sort((a, b) => (a.r ? a.r.best / a.r.total : 2) - (b.r ? b.r.best / b.r.total : 2))
    .slice(0, 4)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="muted text-sm">{new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="text-3xl font-bold tracking-tight">{isTeacher ? name : `Ahoj, ${name.split(' ')[0]}`}</h1>
        <p className="muted mt-1">
          {today >= DAILY_GOAL ? 'Dnešní cíl máš splněný.' : started ? `Do dnešního cíle zbývá ${plural(DAILY_GOAL - today, 'aktivita', 'aktivity', 'aktivit')}.` : 'Začni prvním tématem. Pokrok se ukládá v tomto zařízení.'}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <section className="card flex items-center gap-5 p-5">
          <Ring value={readiness} />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <h2 className="muted text-xs font-semibold tracking-wider uppercase">Připravenost</h2>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>Přečtená témata</span>
                <span className="tabular-nums">
                  {readCount} / {allTopics.length}
                </span>
              </div>
              <ProgressBar value={topicsPct} max={100} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>Úspěšnost v testech</span>
                <span className="tabular-nums">{quizPct} %</span>
              </div>
              <ProgressBar value={quizPct} max={100} />
            </div>
          </div>
        </section>

        <section className="card flex flex-col gap-3 p-5">
          <h2 className="muted flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
            <Target size={14} /> Dnešní cíl
          </h2>
          <div>
            <div className="text-4xl font-bold tracking-tight tabular-nums">
              {Math.min(today, DAILY_GOAL)} / {DAILY_GOAL}
            </div>
            <div className="muted text-sm">dokončené aktivity</div>
          </div>
          <ProgressBar value={Math.min(today, DAILY_GOAL)} max={DAILY_GOAL} />
          <div className="mt-auto flex items-center gap-2 text-sm">
            <Flame size={16} className={days > 0 ? 'text-orange-500' : 'muted'} />
            {days > 0 ? `${plural(days, 'den', 'dny', 'dní')} v řadě` : 'Dnes začíná nová série'}
          </div>
        </section>

        <Countdown examDate={progress.examDate} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card flex flex-col gap-4 p-5">
          <h2 className="font-semibold">Aktivita za 14 dní</h2>
          <ActivityChart activity={progress.activity} />
        </section>

        <section className="flex flex-col gap-4">
          {nextTopic ? (
            <Link
              to={`/predmet/${nextTopic.s.id}/tema/${nextTopic.t.id}`}
              className="group flex flex-1 flex-col justify-center rounded-xl bg-indigo-600 p-5 text-white transition-colors hover:bg-indigo-500"
            >
              <div className="text-xs font-semibold tracking-wider text-indigo-200 uppercase">Další téma · {nextTopic.s.name}</div>
              <div className="mt-1 flex items-center justify-between gap-3 text-lg font-semibold">
                {nextTopic.t.title}
                <ArrowRight size={18} className="shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-1 text-sm text-indigo-100">{nextTopic.t.summary}</p>
            </Link>
          ) : (
            <div className="flex flex-1 flex-col justify-center rounded-xl bg-indigo-600 p-5 text-white">
              <div className="text-lg font-semibold">Všechna témata máš přečtená.</div>
              <p className="text-sm text-indigo-100">Teď je čas na testy a kartičky.</p>
            </div>
          )}
          {nextQuiz && (
            <Link to={`/predmet/${nextQuiz.s.id}/test/${nextQuiz.q.id}`} className="card group flex flex-1 flex-col justify-center p-5 transition-colors hover:border-indigo-400">
              <div className="muted text-xs font-semibold tracking-wider uppercase">Vyzkoušej se · {nextQuiz.s.name}</div>
              <div className="mt-1 flex items-center justify-between gap-3 text-lg font-semibold">
                {nextQuiz.q.title}
                <ArrowRight size={18} className="shrink-0 text-indigo-500 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="muted mt-1 text-sm">{plural(nextQuiz.q.questions.length, 'otázka', 'otázky', 'otázek')}</p>
            </Link>
          )}
        </section>
      </div>

      <section className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
          <h2 className="font-semibold">Pokrok podle předmětů</h2>
          {isTeacher && (
            <Link to="/ucitel" className="text-sm text-indigo-600 hover:underline dark:text-indigo-300">
              Přidat vlastní předmět nebo téma
            </Link>
          )}
        </div>
        <ul className="divide-y divide-ink-100 dark:divide-ink-800">
          {stats.map(({ s, read, topics, topicsPct, quizPct, quizzesDone }) => {
            const style = subjectStyle(s.id)
            const Icon = style.icon
            return (
              <li key={s.id}>
                <Link to={`/predmet/${s.id}`} className="group grid items-center gap-x-6 gap-y-3 px-5 py-4 transition-colors hover:bg-ink-50 sm:grid-cols-[14rem_1fr_1fr_auto] dark:hover:bg-ink-800/40">
                  <div className="flex items-center gap-3">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${style.badge}`}>
                      <Icon size={20} />
                    </span>
                    <span className="font-semibold">{s.name}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="muted flex justify-between text-xs tabular-nums">
                      <span>Témata</span>
                      <span>
                        {read} / {topics}
                      </span>
                    </div>
                    <ProgressBar value={topicsPct} max={100} />
                  </div>
                  {quizPct === null ? (
                    <div className="muted text-xs">Bez testů</div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="muted flex justify-between text-xs tabular-nums">
                        <span>
                          Testy ({quizzesDone} / {s.quizzes.length})
                        </span>
                        <span>{quizPct} %</span>
                      </div>
                      <ProgressBar value={quizPct} max={100} />
                    </div>
                  )}
                  <ArrowRight size={16} className="muted hidden transition-transform group-hover:translate-x-1 sm:block" />
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card flex flex-col gap-3 p-5">
          <h2 className="font-semibold">Co si zopakovat</h2>
          {weak.length === 0 ? (
            <p className="muted text-sm">Ve všech testech máš aspoň 80 %. Skvělá práce.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {weak.map(({ s, q, r }) => (
                <li key={q.id}>
                  <Link to={`/predmet/${s.id}/test/${q.id}`} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-800/50">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{q.title}</div>
                      <div className="muted text-xs">{s.name}</div>
                    </div>
                    {r ? (
                      <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 tabular-nums dark:bg-amber-500/15 dark:text-amber-200">
                        nejlépe {pct(r.best, r.total)} %
                      </span>
                    ) : (
                      <span className="muted shrink-0 text-xs">nezkoušeno</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card flex flex-col gap-3 p-5">
          <h2 className="font-semibold">Poslední aktivita</h2>
          {progress.log.length === 0 ? (
            <p className="muted text-sm">Tady uvidíš, co jsi naposledy dělal.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {progress.log.slice(0, 5).map((e) => (
                <li key={e.at}>
                  <Link to={e.to} className="flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-800/50">
                    <span className="min-w-0 truncate text-sm">{e.label}</span>
                    <time className="muted shrink-0 text-xs tabular-nums" dateTime={e.at}>
                      {new Date(e.at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}{' '}
                      {new Date(e.at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

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
