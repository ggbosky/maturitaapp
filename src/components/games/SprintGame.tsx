import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Check, Play, X, Zap } from 'lucide-react'
import { logActivity } from '../../lib/progress'
import type { Pair } from '../../lib/practice'
import { plural } from '../../lib/plural'

const DURATION = 45

interface Statement {
  a: string
  b: string
  truth: boolean
}

function makeStatement(pairs: Pair[]): Statement {
  const p = pairs[Math.floor(Math.random() * pairs.length)]
  const others = pairs.filter((x) => x.b !== p.b)
  if (others.length === 0 || Math.random() < 0.5) return { a: p.a, b: p.b, truth: true }
  return { a: p.a, b: others[Math.floor(Math.random() * others.length)].b, truth: false }
}

function loadBest(id: string): number {
  try {
    return Number(localStorage.getItem(`zt:sprint:${id}`)) || 0
  } catch {
    return 0
  }
}

/** Rychlovka: 45 sekund rozhodování, jestli k sobě dvojice patří. Šipkami ← → nebo tlačítky. */
export default function SprintGame({ pairs, id, title, question = 'Patří k sobě?' }: { pairs: Pair[]; id: string; title: string; question?: string }) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const [statement, setStatement] = useState<Statement>(() => makeStatement(pairs))
  const [left, setLeft] = useState(DURATION)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [streak, setStreak] = useState(0)
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const [best, setBest] = useState(() => loadBest(id))
  const { pathname } = useLocation()

  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'play' || left > 0) return
    setPhase('over')
    logActivity(`Rychlovka: ${title} (${plural(score, 'bod', 'body', 'bodů')})`, pathname)
    if (score > best) {
      setBest(score)
      try {
        localStorage.setItem(`zt:sprint:${id}`, String(score))
      } catch {
        // rekord se nezapamatuje
      }
    }
  }, [left, phase, score, best, id, title, pathname])

  const answer = useCallback(
    (yes: boolean) => {
      if (phase !== 'play') return
      const ok = yes === statement.truth
      setAnswered((n) => n + 1)
      setScore((s) => s + (ok ? 1 : 0))
      setStreak((s) => (ok ? s + 1 : 0))
      setFlash(ok ? 'ok' : 'bad')
      setTimeout(() => setFlash(null), 250)
      setStatement(makeStatement(pairs))
    },
    [phase, statement, pairs],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowLeft') answer(true)
      else if (e.key === 'ArrowRight') answer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer])

  const begin = () => {
    setScore(0)
    setAnswered(0)
    setStreak(0)
    setLeft(DURATION)
    setStatement(makeStatement(pairs))
    setPhase('play')
  }

  if (phase !== 'play') {
    return (
      <div className="card flex flex-wrap items-center gap-4 p-5">
        <Zap size={28} className="text-amber-500" />
        <div className="min-w-0 flex-1">
          {phase === 'over' ? (
            <>
              <div className="text-lg font-semibold tabular-nums">
                {plural(score, 'bod', 'body', 'bodů')} z {plural(answered, 'odpovědi', 'odpovědí', 'odpovědí')}
              </div>
              <p className="muted text-sm tabular-nums">{score >= best && score > 0 ? 'Nový rekord!' : `Tvůj rekord: ${plural(best, 'bod', 'body', 'bodů')}`}</p>
            </>
          ) : (
            <>
              <div className="text-lg font-semibold">Rychlovka na {DURATION} sekund</div>
              <p className="muted text-sm">
                Rozhodni, jestli k sobě dvojice patří. Šipka ← znamená ano, šipka → ne.{best > 0 && ` Rekord: ${plural(best, 'bod', 'body', 'bodů')}.`}
              </p>
            </>
          )}
        </div>
        <button type="button" className="btn btn-primary" onClick={begin}>
          <Play size={16} /> {phase === 'over' ? 'Hrát znovu' : 'Start'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 text-sm tabular-nums">
        <span className="font-semibold">{plural(score, 'bod', 'body', 'bodů')}</span>
        {streak >= 3 && <span className="text-amber-600 dark:text-amber-300">série {streak}</span>}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
          <div className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${left <= 10 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${(left / DURATION) * 100}%` }} />
        </div>
        <span>{left} s</span>
      </div>
      <div
        className={`card flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center transition-colors ${
          flash === 'ok' ? 'border-emerald-500!' : flash === 'bad' ? 'border-rose-500!' : ''
        }`}
      >
        <div className="muted text-xs font-semibold tracking-wider uppercase">{question}</div>
        <div className="text-xl font-semibold text-balance">{statement.a}</div>
        <div className="text-lg text-indigo-700 text-balance dark:text-indigo-300">{statement.b}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn bg-emerald-600 py-3 text-white hover:bg-emerald-500" onClick={() => answer(true)}>
          <Check size={18} /> Ano ←
        </button>
        <button type="button" className="btn bg-rose-600 py-3 text-white hover:bg-rose-500" onClick={() => answer(false)}>
          <X size={18} /> Ne →
        </button>
      </div>
    </div>
  )
}
