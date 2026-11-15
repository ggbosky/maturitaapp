import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Trash2 } from 'lucide-react'
import { cleanCode, formatCode, readKey, roleLabel, signLicense, todayKey, type License, type Role } from '../license/license'
import CopyButton from '../components/CopyButton'

interface Issued extends License {
  key: string
}

const SECRET = 'zt:admin-secret'
const ISSUED = 'zt:admin-issued'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // bez úložiště se nic nezapamatuje
  }
}

/** Vydávání licencí. Bez soukromého klíče je stránka k ničemu, proto nemusí být skrytá. */
export default function AdminPage() {
  const [secret, setSecret] = useState(() => load(SECRET, ''))
  const [remember, setRemember] = useState(() => load(SECRET, '') !== '')
  const [role, setRole] = useState<Role>('student')
  const [name, setName] = useState('')
  const [device, setDevice] = useState('')
  const [expires, setExpires] = useState('')
  const [issued, setIssued] = useState<Issued[]>(() => load(ISSUED, []))
  const [latest, setLatest] = useState<Issued | null>(null)
  const [error, setError] = useState('')

  const code = cleanCode(device)

  const updateIssued = (next: Issued[]) => {
    setIssued(next)
    save(ISSUED, next)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        <header>
          <Link to="/" className="muted mb-4 inline-flex items-center gap-1 text-sm hover:text-indigo-600">
            <ArrowLeft size={14} /> Zpět do aplikace
          </Link>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <ShieldCheck className="text-indigo-500" /> Správa licencí
          </h1>
          <p className="muted mt-2 max-w-[65ch]">
            Student nebo škola ti pošle kód zařízení z přihlašovací obrazovky. Tady k němu vydáš klíč, který funguje jen na tom jednom zařízení.
            Soukromý klíč zůstává v tomto prohlížeči a nikam se neodesílá.
          </p>
        </header>

        <section className="card flex flex-col gap-3 p-5">
          <label htmlFor="admin-secret" className="font-semibold">
            1. Tvůj soukromý klíč
          </label>
          <input
            id="admin-secret"
            type="password"
            autoComplete="off"
            placeholder="ZTSK1-…"
            className="input font-mono"
            value={secret}
            onChange={(e) => {
              setSecret(e.target.value)
              if (remember) save(SECRET, e.target.value)
            }}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-indigo-600"
              checked={remember}
              onChange={(e) => {
                setRemember(e.target.checked)
                save(SECRET, e.target.checked ? secret : null)
              }}
            />
            Zapamatovat v tomto prohlížeči (jen na vlastním počítači)
          </label>
        </section>

        <form
          className="card flex flex-col gap-4 p-5"
          onSubmit={async (e) => {
            e.preventDefault()
            setError('')
            setLatest(null)
            if (code.length !== 12) return setError('Kód zařízení má 12 znaků, například ABCD-1234-EFGH.')
            const license: License = { role, name: name.trim(), device: code, expires: expires || null, issued: todayKey() }
            try {
              const key = await signLicense(license, secret)
              // Kontrola, že soukromý klíč patří k veřejnému klíči v aplikaci.
              if (!(await readKey(key))) return setError('Tento soukromý klíč nepatří k této aplikaci. Vydaný klíč by nešel aktivovat.')
              const entry = { ...license, key }
              setLatest(entry)
              updateIssued([entry, ...issued])
            } catch (err) {
              setError(err instanceof Error && err.message.includes('ZTSK1') ? err.message : 'Soukromý klíč se nepodařilo načíst. Zkontroluj, že je vložený celý.')
            }
          }}
        >
          <h2 className="font-semibold">2. Nová licence</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="muted">Typ účtu</span>
              <select id="admin-role" className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="student">Student</option>
                <option value="skola">Škola</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="muted">{role === 'student' ? 'Jméno studenta' : 'Název školy (a případně učebna)'}</span>
              <input id="admin-name" required className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="muted">Kód zařízení</span>
              <input
                id="admin-device"
                required
                autoComplete="off"
                placeholder="ABCD-1234-EFGH"
                className="input font-mono uppercase"
                value={device}
                onChange={(e) => setDevice(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="muted">Platnost do (prázdné = bez omezení)</span>
              <input id="admin-expires" type="date" min={todayKey()} className="input" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </label>
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </p>
          )}
          <div>
            <button type="submit" className="btn btn-primary" disabled={!secret.trim()}>
              Vydat klíč
            </button>
          </div>

          {latest && (
            <div className="flex flex-col gap-3 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-500/10">
              <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Klíč pro „{latest.name}“ je hotový. Pošli ho držiteli licence.
              </div>
              <code id="issued-key" className="font-mono text-xs break-all select-all">
                {latest.key}
              </code>
              <div>
                <CopyButton text={latest.key} label="Kopírovat klíč" />
              </div>
            </div>
          )}
        </form>

        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Vydané licence ({issued.length})</h2>
          {issued.length === 0 ? (
            <p className="muted text-sm">Zatím žádné. Seznam se ukládá jen v tomto prohlížeči, slouží jako tvoje evidence.</p>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50 dark:border-ink-800 dark:bg-ink-800/50">
                    {['Držitel', 'Typ', 'Zařízení', 'Vydáno', 'Platí do', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issued.map((l) => (
                    <tr key={l.key} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                      <td className="px-4 py-2 font-medium">{l.name}</td>
                      <td className="px-4 py-2">{roleLabel[l.role]}</td>
                      <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{formatCode(l.device)}</td>
                      <td className="px-4 py-2 whitespace-nowrap tabular-nums">{l.issued}</td>
                      <td className="px-4 py-2 whitespace-nowrap tabular-nums">{l.expires ?? 'bez omezení'}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          <CopyButton text={l.key} label="Klíč" className="btn btn-ghost px-2 py-1" />
                          <button
                            type="button"
                            className="btn btn-ghost px-2 py-1"
                            aria-label={`Odebrat ${l.name} z evidence`}
                            title="Odebrat z evidence (klíč tím nepřestane platit)"
                            onClick={() => updateIssued(issued.filter((x) => x.key !== l.key))}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
