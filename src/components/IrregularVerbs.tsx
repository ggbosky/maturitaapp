import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Verb } from '../types'
import { fold } from '../lib/search'
import { normalize } from '../lib/quiz'

/** Tvar typu „was/were“ uzná kteroukoli variantu i obě dohromady. */
function formMatches(expected: string, given: string): boolean {
  const g = normalize(given).replace(/\s*\/\s*/g, '/')
  return g !== '' && (g === expected || expected.split('/').includes(g))
}

function pick(verbs: Verb[], not?: Verb): Verb {
  let v = verbs[Math.floor(Math.random() * verbs.length)]
  while (verbs.length > 1 && v === not) v = verbs[Math.floor(Math.random() * verbs.length)]
  return v
}

function Table({ verbs }: { verbs: Verb[] }) {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const rows = useMemo(() => {
    const q = fold(query.trim())
    return q ? verbs.filter((v) => fold(`${v.base} ${v.past} ${v.participle} ${v.cs}`).includes(q)) : verbs
  }, [verbs, query])

  return (
    <div className="flex flex-col gap-4">
      <input
        id="verb-filter"
        type="search"
        className="input max-w-sm"
        placeholder="Filtrovat anglicky nebo česky…"
        aria-label="Filtrovat slovesa"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50 dark:border-ink-800 dark:bg-ink-800/50">
              {['Infinitiv', 'Minulý čas', 'Příčestí minulé', 'Česky'].map((h) => (
                <th key={h} className="px-4 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.base} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                <td className="px-4 py-2 font-semibold text-indigo-700 dark:text-indigo-300">{v.base}</td>
                <td className="px-4 py-2">{v.past}</td>
                <td className="px-4 py-2">{v.participle}</td>
                <td className="muted px-4 py-2">{v.cs}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="muted px-4 py-6 text-center">
                  Žádné sloveso neodpovídá filtru.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="muted text-sm tabular-nums">
        Zobrazeno {rows.length} z {verbs.length} sloves.
      </p>
    </div>
  )
}

function Drill({ verbs }: { verbs: Verb[] }) {
  const [verb, setVerb] = useState(() => pick(verbs))
  const [past, setPast] = useState('')
  const [participle, setParticiple] = useState('')
  const [checked, setChecked] = useState(false)
  const [stats, setStats] = useState({ ok: 0, all: 0 })

  const pastOk = formMatches(verb.past, past)
  const partOk = formMatches(verb.participle, participle)

  const field = (ok: boolean) => `input ${checked ? (ok ? 'border-emerald-500!' : 'border-rose-500!') : ''}`

  return (
    <form
      className="card flex max-w-xl flex-col gap-5 p-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (!checked) {
          setChecked(true)
          setStats((s) => ({ ok: s.ok + (pastOk && partOk ? 1 : 0), all: s.all + 1 }))
        } else {
          setVerb(pick(verbs, verb))
          setPast('')
          setParticiple('')
          setChecked(false)
        }
      }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-300">{verb.base}</div>
          <div className="muted">{verb.cs}</div>
        </div>
        <div className="muted text-sm tabular-nums">
          Správně {stats.ok} z {stats.all}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="muted">Minulý čas</span>
          <input
            key={verb.base}
            id="drill-past"
            autoFocus
            autoComplete="off"
            className={field(pastOk)}
            value={past}
            readOnly={checked}
            onChange={(e) => setPast(e.target.value)}
          />
          {checked && !pastOk && <span className="text-emerald-700 dark:text-emerald-400">Správně: {verb.past}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="muted">Příčestí minulé</span>
          <input
            id="drill-participle"
            autoComplete="off"
            className={field(partOk)}
            value={participle}
            readOnly={checked}
            onChange={(e) => setParticiple(e.target.value)}
          />
          {checked && !partOk && <span className="text-emerald-700 dark:text-emerald-400">Správně: {verb.participle}</span>}
        </label>
      </div>

      <div>
        <button type="submit" className="btn btn-primary">
          {checked ? 'Další sloveso' : 'Zkontrolovat'}
        </button>
      </div>
    </form>
  )
}

export default function IrregularVerbs({ verbs }: { verbs: Verb[] }) {
  const [mode, setMode] = useState<'table' | 'drill'>('table')
  const seg = (m: typeof mode) =>
    `btn ${mode === m ? 'btn-primary' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'}`

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex w-fit gap-1 p-1">
        <button type="button" className={seg('table')} aria-pressed={mode === 'table'} onClick={() => setMode('table')}>
          Tabulka
        </button>
        <button type="button" className={seg('drill')} aria-pressed={mode === 'drill'} onClick={() => setMode('drill')}>
          Zkoušení
        </button>
      </div>
      {mode === 'table' ? <Table verbs={verbs} /> : <Drill verbs={verbs} />}
    </div>
  )
}
