import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import {
  cleanCode,
  formatCode,
  formatDate,
  issueSchoolLicense,
  newSchoolId,
  nextMaturityExpiry,
  parseSchoolLicense,
  todayKey,
  type SchoolCert,
} from '../license/license'
import CopyButton from '../components/CopyButton'

interface Issued extends Omit<SchoolCert, 'key'> {
  license: string
}

const SECRET = 'zt:admin-secret'
const ISSUED = 'zt:admin-schools'

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

/** Den po konci staré licence, aby prodloužení navázalo („do další maturity“ od té doby). */
function renewalExpiry(oldExpires: string): string {
  const from = new Date(`${oldExpires}T00:00:00`)
  from.setDate(from.getDate() + 1)
  const base = from > new Date() ? from : new Date()
  return nextMaturityExpiry(base)
}

/** Vydávání licencí školám. Bez soukromého klíče je stránka k ničemu, proto nemusí být skrytá. */
export default function AdminPage() {
  const [secret, setSecret] = useState(() => load(SECRET, ''))
  const [remember, setRemember] = useState(() => load(SECRET, '') !== '')
  const [school, setSchool] = useState('')
  const [device, setDevice] = useState('')
  const [expires, setExpires] = useState(nextMaturityExpiry())
  const [seats, setSeats] = useState(30)
  const [renewing, setRenewing] = useState<Issued | null>(null)
  const [issued, setIssued] = useState<Issued[]>(() => load(ISSUED, []))
  const [latest, setLatest] = useState<Issued | null>(null)
  const [error, setError] = useState('')

  const updateIssued = (next: Issued[]) => {
    setIssued(next)
    save(ISSUED, next)
  }

  const startRenewal = (entry: Issued) => {
    setRenewing(entry)
    setSchool(entry.school)
    setDevice(formatCode(entry.device))
    setSeats(entry.seats)
    setExpires(renewalExpiry(entry.expires))
    setLatest(null)
    setError('')
    window.scrollTo(0, 0)
    document.getElementById('admin-school')?.focus()
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
        <header>
          <Link to="/" className="muted mb-4 inline-flex items-center gap-1 text-sm hover:text-indigo-600">
            <ArrowLeft size={14} /> Zpět do aplikace
          </Link>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <ShieldCheck className="text-indigo-500" /> Správa licencí škol
          </h1>
          <p className="muted mt-2 max-w-[70ch]">
            Škole vydáš jednu licenci. Funguje na počítači učitele, který ti poslal kód zařízení, a platí do konce další maturity.
            Učitel pak sám vydává klíče žákům, nejvýš tolik, kolik míst jsi škole přidělil. Soukromý klíč zůstává v tomto prohlížeči.
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
            const code = cleanCode(device)
            if (code.length !== 12) return setError('Kód zařízení má 12 znaků, například ABCD-1234-EFGH.')
            try {
              const old = renewing ? await parseSchoolLicense(renewing.license) : null
              if (renewing && !old) return setError('Původní licenci se nepodařilo načíst. Vydej škole novou licenci.')
              const cert = {
                schoolId: old?.cert.schoolId ?? newSchoolId(),
                school: school.trim(),
                device: code,
                expires,
                issued: todayKey(),
                seats,
              }
              const license = await issueSchoolLicense(cert, secret, old ? { publicKey: old.cert.key, privateKey: old.privateKey } : undefined)
              // Kontrola, že soukromý klíč patří k veřejnému klíči v aplikaci.
              if (!(await parseSchoolLicense(license))) return setError('Tento soukromý klíč nepatří k této aplikaci. Licence by nešla aktivovat.')
              const entry: Issued = { ...cert, license }
              setLatest(entry)
              updateIssued([entry, ...issued.filter((x) => x.schoolId !== entry.schoolId)])
              setRenewing(null)
            } catch (err) {
              setError(err instanceof Error && err.message.includes('ZTSK1') ? err.message : 'Soukromý klíč se nepodařilo načíst. Zkontroluj, že je vložený celý.')
            }
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">2. {renewing ? `Prodloužení licence: ${renewing.school}` : 'Nová licence školy'}</h2>
            {renewing && (
              <button type="button" className="muted text-sm underline underline-offset-4" onClick={() => setRenewing(null)}>
                Zrušit prodloužení
              </button>
            )}
          </div>
          {renewing && (
            <p className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-100">
              Prodloužená licence zachová klíče žáků. Učitel ji aktivuje u sebe a pošle žákům nový balíček, tím se prodlouží i jim.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="muted">Název školy</span>
              <input id="admin-school" required className="input" placeholder="Gymnázium Jana Nerudy, Praha" value={school} onChange={(e) => setSchool(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="muted">Kód zařízení učitele</span>
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
              <span className="muted">Počet žáků (míst)</span>
              <input id="admin-seats" type="number" min={1} max={2000} required className="input" value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="muted">Platnost do (výchozí: konec další maturity)</span>
              <input id="admin-expires" type="date" min={todayKey()} required className="input" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </label>
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </p>
          )}
          <div>
            <button type="submit" className="btn btn-primary" disabled={!secret.trim()}>
              {renewing ? 'Prodloužit licenci' : 'Vydat licenci škole'}
            </button>
          </div>

          {latest && (
            <div className="flex flex-col gap-3 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-500/10">
              <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Licence pro „{latest.school}“ platí do {formatDate(latest.expires)}. Pošli ji učiteli.
              </div>
              <code id="issued-key" className="max-h-40 overflow-y-auto font-mono text-xs break-all select-all">
                {latest.license}
              </code>
              <div>
                <CopyButton text={latest.license} label="Kopírovat licenci" />
              </div>
            </div>
          )}
        </form>

        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Školy ({issued.length})</h2>
          {issued.length === 0 ? (
            <p className="muted text-sm">Zatím žádné. Seznam se ukládá jen v tomto prohlížeči a slouží k prodlužování licencí.</p>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50 dark:border-ink-800 dark:bg-ink-800/50">
                    {['Škola', 'Zařízení učitele', 'Míst', 'Platí do', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issued.map((l) => {
                    const expired = l.expires < todayKey()
                    return (
                      <tr key={l.schoolId} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                        <td className="px-4 py-2 font-medium">{l.school}</td>
                        <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{formatCode(l.device)}</td>
                        <td className="px-4 py-2 tabular-nums">{l.seats}</td>
                        <td className={`px-4 py-2 whitespace-nowrap tabular-nums ${expired ? 'font-medium text-rose-600 dark:text-rose-400' : ''}`}>
                          {formatDate(l.expires)}
                          {expired && ' (prošlá)'}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-1">
                            <button type="button" className="btn btn-ghost px-2 py-1" onClick={() => startRenewal(l)}>
                              <RefreshCw size={14} /> Prodloužit
                            </button>
                            <CopyButton text={l.license} label="Licence" className="btn btn-ghost px-2 py-1" />
                            <button
                              type="button"
                              className="btn btn-ghost px-2 py-1"
                              aria-label={`Odebrat ${l.school} z evidence`}
                              title="Odebrat z evidence (licence tím nepřestane platit)"
                              onClick={() => updateIssued(issued.filter((x) => x.schoolId !== l.schoolId))}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
