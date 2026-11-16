import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Download, FilePlus2, FolderPlus, Pencil, Trash2, UserPlus } from 'lucide-react'
import { useSubjects } from '../data'
import { cleanCode, daysLeft, formatCode, formatDate, issueStudentKey, todayKey, useSession } from '../license/license'
import { deleteSubject, deleteTopic, exportPack, newId, saveSubject, signedCertOf, topicCount, useSchoolContent } from '../lib/school'
import { downloadText, slug } from '../lib/download'
import { subjectStyle } from '../lib/subjectStyle'
import CopyButton from '../components/CopyButton'
import ProgressBar from '../components/ProgressBar'
import { plural } from '../lib/plural'

interface Pupil {
  name: string
  device: string
  key: string
  issued: string
}

const PUPILS = 'zt:students'

function loadPupils(): Pupil[] {
  try {
    return JSON.parse(localStorage.getItem(PUPILS) ?? '[]')
  } catch {
    return []
  }
}

/** Tlačítko, které akci provede až na druhé kliknutí. */
function ConfirmButton({ label, confirmLabel, onConfirm }: { label: string; confirmLabel: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false)
  return (
    <button
      type="button"
      className={`btn px-2 py-1 ${armed ? 'bg-rose-600 text-white hover:bg-rose-500' : 'btn-ghost'}`}
      aria-label={label}
      title={label}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      onBlur={() => setArmed(false)}
    >
      <Trash2 size={14} />
      {armed && confirmLabel}
    </button>
  )
}

function Pupils({ signedCert, schoolKey, schoolId, seats }: { signedCert: string; schoolKey: string; schoolId: string; seats: number }) {
  const [pupils, setPupils] = useState<Pupil[]>(loadPupils)
  const [name, setName] = useState('')
  const [device, setDevice] = useState('')
  const [latest, setLatest] = useState<Pupil | null>(null)
  const [error, setError] = useState('')
  const full = pupils.length >= seats

  const store = (next: Pupil[]) => {
    setPupils(next)
    try {
      localStorage.setItem(PUPILS, JSON.stringify(next))
    } catch {
      // seznam platí jen do zavření aplikace
    }
  }

  return (
    <section className="card flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Žáci</h2>
          <p className="muted text-sm">Žák ti pošle kód zařízení z přihlašovací obrazovky. Vydaný klíč funguje jen na tom zařízení.</p>
        </div>
        <div className="flex w-48 flex-col gap-1">
          <div className="muted flex justify-between text-xs tabular-nums">
            <span>Využitá místa</span>
            <span>
              {pupils.length} / {seats}
            </span>
          </div>
          <ProgressBar value={pupils.length} max={seats} barClass={full ? 'bg-amber-500' : 'bg-indigo-500'} />
        </div>
      </div>

      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault()
          setError('')
          setLatest(null)
          const code = cleanCode(device)
          if (code.length !== 12) return setError('Kód zařízení má 12 znaků, například ABCD-1234-EFGH.')
          const existing = pupils.find((p) => p.device === code)
          if (!existing && full) return setError(`Licence školy má ${plural(seats, 'místo', 'místa', 'míst')} a všechna jsou obsazená. Odeber žáka, který aplikaci nepoužívá, nebo požádej správce o víc míst.`)
          const key = await issueStudentKey(signedCert, schoolKey, { name: name.trim(), device: code }, schoolId)
          const pupil = { name: name.trim(), device: code, key, issued: todayKey() }
          // Stejné zařízení = stejné místo (např. nový klíč po změně jména).
          store([pupil, ...pupils.filter((p) => p.device !== code)])
          setLatest(pupil)
          setName('')
          setDevice('')
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="muted">Jméno žáka</span>
          <input id="pupil-name" required className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="muted">Kód zařízení žáka</span>
          <input
            id="pupil-device"
            required
            autoComplete="off"
            placeholder="ABCD-1234-EFGH"
            className="input font-mono uppercase"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary">
          <UserPlus size={16} /> Vydat klíč
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      )}

      {latest && (
        <div className="flex flex-col gap-3 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-500/10">
          <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Klíč pro žáka „{latest.name}“ je hotový. Pošli mu ho.</div>
          <code id="pupil-key" className="max-h-32 overflow-y-auto font-mono text-xs break-all select-all">
            {latest.key}
          </code>
          <div>
            <CopyButton text={latest.key} label="Kopírovat klíč" />
          </div>
        </div>
      )}

      {pupils.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-ink-200 dark:border-ink-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50 dark:border-ink-800 dark:bg-ink-800/50">
                {['Žák', 'Zařízení', 'Vydáno', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pupils.map((p) => (
                <tr key={p.device} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{formatCode(p.device)}</td>
                  <td className="px-4 py-2 whitespace-nowrap tabular-nums">{formatDate(p.issued)}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <CopyButton text={p.key} label="Klíč" className="btn btn-ghost px-2 py-1" />
                      <ConfirmButton label={`Odebrat žáka ${p.name}`} confirmLabel="Odebrat" onConfirm={() => store(pupils.filter((x) => x.device !== p.device))} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted text-xs">
        Odebráním uvolníš místo, ale už vydaný klíč na žákově zařízení platí dál až do konce licence školy. Klíče nejde na dálku zrušit.
      </p>
    </section>
  )
}

function Content() {
  const subjects = useSubjects()
  const content = useSchoolContent()
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')

  return (
    <section className="card flex flex-col gap-5 p-5">
      <div>
        <h2 className="text-lg font-semibold">Obsah školy</h2>
        <p className="muted text-sm">
          Přidej vlastní témata do běžných předmětů nebo založ odborný předmět. Žáci obsah uvidí, až jim pošleš balíček.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {subjects.map((s) => {
          const own = content.topics[s.id] ?? []
          const style = subjectStyle(s.id)
          const Icon = style.icon
          return (
            <li key={s.id} className="rounded-lg border border-ink-200 p-4 dark:border-ink-800">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${style.badge}`}>
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {s.name}
                    {s.custom && <span className="muted ml-2 text-xs font-normal">vlastní předmět</span>}
                  </div>
                  <div className="muted text-xs">
                    {own.length === 0 ? 'Zatím bez vlastních témat' : `Vlastní témata: ${own.length}`}
                  </div>
                </div>
                <Link to={`/ucitel/tema/nove?predmet=${s.id}`} className="btn btn-ghost px-3 py-1.5">
                  <FilePlus2 size={16} /> Přidat téma
                </Link>
                {s.custom && (
                  <ConfirmButton label={`Smazat předmět ${s.name}`} confirmLabel="Smazat i s tématy" onConfirm={() => deleteSubject(s.id)} />
                )}
              </div>
              {own.length > 0 && (
                <ul className="mt-3 flex flex-col divide-y divide-ink-100 border-t border-ink-100 dark:divide-ink-800 dark:border-ink-800">
                  {own.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 py-2">
                      <Link to={`/predmet/${s.id}/tema/${t.id}`} className="min-w-0 flex-1 truncate text-sm hover:text-indigo-600">
                        {t.title}
                        <span className="muted ml-2 text-xs">{t.category}</span>
                      </Link>
                      <Link to={`/ucitel/tema/${t.id}?predmet=${s.id}`} className="btn btn-ghost px-2 py-1" aria-label={`Upravit ${t.title}`}>
                        <Pencil size={14} />
                      </Link>
                      <ConfirmButton label={`Smazat téma ${t.title}`} confirmLabel="Smazat" onConfirm={() => deleteTopic(s.id, t.id)} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      <form
        className="grid gap-3 rounded-lg bg-ink-50 p-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end dark:bg-ink-800/40"
        onSubmit={(e) => {
          e.preventDefault()
          saveSubject({ id: newId(), name: name.trim(), tagline: tagline.trim() || 'Odborný předmět školy' })
          setName('')
          setTagline('')
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="muted">Nový předmět</span>
          <input id="subject-name" required className="input" placeholder="Např. Ekonomika" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="muted">Krátký popis</span>
          <input id="subject-tagline" className="input" placeholder="Např. Profilová zkouška, obchodní akademie" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary">
          <FolderPlus size={16} /> Přidat předmět
        </button>
      </form>
    </section>
  )
}

export default function TeacherPage() {
  const session = useSession()
  const content = useSchoolContent()
  const [exported, setExported] = useState(false)
  if (session.status !== 'active' || session.role !== 'teacher') return <Navigate to="/" replace />
  const { cert } = session
  const left = daysLeft(cert.expires)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="muted text-sm">Správa školy</p>
        <h1 className="text-3xl font-bold tracking-tight">{cert.school}</h1>
        <p className={`mt-1 ${left <= 30 ? 'font-medium text-amber-700 dark:text-amber-300' : 'muted'}`}>
          Licence platí do {formatDate(cert.expires)}
          {left <= 30 && ` – zbývá ${plural(left, 'den', 'dny', 'dní')}`}. Po skončení je potřeba ji prodloužit nebo koupit novou.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-4 rounded-xl bg-indigo-600 p-5 text-white">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Balíček pro žáky</h2>
          <p className="text-sm text-indigo-100">
            Obsahuje vlastní předměty a témata ({plural(topicCount(content), 'téma', 'témata', 'témat')}
            {content.updated ? `, poslední změna ${new Date(content.updated).toLocaleString('cs-CZ')}` : ''}) a aktuální platnost licence.
            Nahraj ho žákům třeba do Teams nebo Bakalářů, oni ho načtou v sekci Moje škola. Po každé změně obsahu nebo prodloužení licence pošli nový.
          </p>
          {exported && <p className="mt-2 text-sm font-medium">Balíček je stažený. Najdeš ho ve složce se staženými soubory.</p>}
        </div>
        <button
          type="button"
          className="btn bg-white text-indigo-700 hover:bg-indigo-50"
          onClick={async () => {
            downloadText(`zvladni-to-${slug(cert.school)}-${todayKey()}.json`, await exportPack(session))
            setExported(true)
          }}
        >
          <Download size={16} /> Stáhnout balíček
        </button>
      </section>

      <Pupils signedCert={signedCertOf(session)} schoolKey={session.schoolKey} schoolId={cert.schoolId} seats={cert.seats} />
      <Content />
    </div>
  )
}
