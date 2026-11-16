import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { RotateCcw, Timer } from 'lucide-react'
import { logActivity } from '../../lib/progress'
import { pickRound, shuffle, type Pair } from '../../lib/practice'

/** Přiřazování: klikni na pojem vlevo a na jeho protějšek vpravo. */
export default function MatchGame({ pairs, title, size = 6, leftLabel = 'Pojem', rightLabel = 'Význam' }: { pairs: Pair[]; title: string; size?: number; leftLabel?: string; rightLabel?: string }) {
  const [round, setRound] = useState(0)
  const items = useMemo(() => pickRound(pairs, size), [pairs, size, round])
  const right = useMemo(() => shuffle(items.map((p) => p.b)), [items])
  const [left, setLeft] = useState<string | null>(null)
  const [solved, setSolved] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [start, setStart] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const { pathname } = useLocation()
  const done = solved.size === items.length && items.length > 0

  useEffect(() => {
    if (done) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [done])

  const restart = () => {
    setRound((r) => r + 1)
    setLeft(null)
    setSolved(new Set())
    setMistakes(0)
    setStart(Date.now())
    setNow(Date.now())
  }

  const pickRight = (b: string) => {
    if (!left) return
    const pair = items.find((p) => p.a === left)
    if (pair?.b === b) {
      const next = new Set(solved).add(left)
      setSolved(next)
      setLeft(null)
      if (next.size === items.length) {
        setNow(Date.now())
        logActivity(`Přiřazování: ${title}`, pathname)
      }
    } else {
      setMistakes((m) => m + 1)
      setWrong(b)
      setTimeout(() => setWrong(null), 500)
    }
  }

  const seconds = Math.round((now - start) / 1000)
  const solvedB = new Set(items.filter((p) => solved.has(p.a)).map((p) => p.b))
  const cell = 'w-full cursor-pointer rounded-lg border px-3 py-2.5 text-left text-sm transition-colors disabled:cursor-default'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="muted">Vyber {leftLabel.toLowerCase()} vlevo a pak k němu {rightLabel.toLowerCase()} vpravo.</span>
        <span className="ml-auto flex items-center gap-1 tabular-nums">
          <Timer size={14} /> {seconds} s
        </span>
        <span className="tabular-nums">Chyby: {mistakes}</span>
      </div>

      {done ? (
        <div className="card flex flex-wrap items-center gap-4 p-5">
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold">
              Hotovo za {seconds} s{mistakes === 0 ? ' a bez chyby!' : `, chyby: ${mistakes}.`}
            </div>
            <p className="muted text-sm">Každé kolo vybere jiné dvojice{pairs.length > size ? ` z ${pairs.length}` : ''}.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={restart}>
            <RotateCcw size={16} /> Další kolo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <div className="muted text-xs font-semibold tracking-wider uppercase">{leftLabel}</div>
            {items.map((p) => (
              <button
                key={p.a}
                type="button"
                disabled={solved.has(p.a)}
                aria-pressed={left === p.a}
                onClick={() => setLeft(p.a)}
                className={`${cell} ${
                  solved.has(p.a)
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900 opacity-60 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : left === p.a
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15'
                      : 'border-ink-200 bg-white hover:border-indigo-300 dark:border-ink-700 dark:bg-ink-900'
                }`}
              >
                {p.a}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <div className="muted text-xs font-semibold tracking-wider uppercase">{rightLabel}</div>
            {right.map((b) => (
              <button
                key={b}
                type="button"
                disabled={solvedB.has(b) || !left}
                onClick={() => pickRight(b)}
                className={`${cell} ${
                  solvedB.has(b)
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900 opacity-60 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : wrong === b
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/15'
                      : 'border-ink-200 bg-white hover:border-indigo-300 dark:border-ink-700 dark:bg-ink-900'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
