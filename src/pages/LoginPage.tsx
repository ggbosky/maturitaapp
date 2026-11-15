import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, GraduationCap, KeyRound, MonitorSmartphone, User } from 'lucide-react'
import { activate, formatCode, getDeviceCode, roleLabel, type CheckResult, type Role } from '../license/license'
import CopyButton from '../components/CopyButton'

function errorText(result: Extract<CheckResult, { ok: false }>): string {
  switch (result.reason) {
    case 'format':
      return 'Tohle nevypadá jako licenční klíč. Klíč začíná „ZT1-“, zkopíruj ho celý.'
    case 'signature':
      return 'Klíč není platný. Zkontroluj, že je zkopírovaný celý a beze změn.'
    case 'device':
      return 'Tento klíč byl vydán pro jiné zařízení. Pošli správci kód tohoto zařízení a požádej o nový klíč.'
    case 'expired':
      return `Platnost licence skončila ${result.license?.expires ?? ''}. Požádej správce o prodloužení.`
    case 'role':
      return `Tento klíč je vydán pro účet „${result.license ? roleLabel[result.license.role] : ''}“. Přepni typ přihlášení nahoře.`
    case 'unsupported':
      return 'Tento prohlížeč neumí licenci ověřit. Otevři aplikaci přes https nebo v desktopové verzi.'
  }
}

export default function LoginPage({ notice }: { notice?: 'expired' | 'invalid' }) {
  const [role, setRole] = useState<Role>('student')
  const [key, setKey] = useState('')
  const [error, setError] = useState(
    notice === 'expired'
      ? 'Platnost tvé licence skončila. Zadej nový klíč.'
      : notice === 'invalid'
        ? 'Uložená licence na tomto zařízení neplatí. Zadej klíč znovu.'
        : '',
  )
  const [busy, setBusy] = useState(false)
  const device = formatCode(getDeviceCode())

  const tab = (r: Role) =>
    `btn flex-1 ${role === r ? 'btn-primary' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'}`

  return (
    <div className="grid h-full overflow-y-auto lg:grid-cols-[5fr_6fr]">
      <aside className="hidden flex-col justify-between bg-indigo-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-white/15">
            <GraduationCap size={22} />
          </span>
          <span className="text-lg font-bold tracking-tight">Zvládni to</span>
        </div>
        <div>
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-balance">Maturita z češtiny, matematiky a angličtiny na jednom místě.</h1>
          <ul className="mt-8 flex flex-col gap-3 text-indigo-100">
            <li>Přehledy a vzorce podle maturitních okruhů</li>
            <li>Testy a cvičení s okamžitou kontrolou</li>
            <li>Rozbory četby, kartičky a taháky ke slohu i ústní zkoušce</li>
          </ul>
        </div>
        <p className="text-sm text-indigo-200">Jedna licence platí pro jedno zařízení.</p>
      </aside>

      <main className="flex items-center justify-center p-6">
        <form
          className="flex w-full max-w-md flex-col gap-6"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setError('')
            const result = await activate(key, role)
            setBusy(false)
            if (!result.ok) setError(errorText(result))
          }}
        >
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Přihlášení licencí</h2>
            <p className="muted mt-1">Vyber typ účtu a zadej klíč, který jsi dostal od správce.</p>
          </div>

          <div className="card flex gap-1 p-1" role="group" aria-label="Typ účtu">
            <button type="button" className={tab('student')} aria-pressed={role === 'student'} onClick={() => setRole('student')}>
              <User size={16} /> Student
            </button>
            <button type="button" className={tab('skola')} aria-pressed={role === 'skola'} onClick={() => setRole('skola')}>
              <Building2 size={16} /> Škola
            </button>
          </div>

          <div className="card flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MonitorSmartphone size={16} className="text-indigo-500" /> Kód tohoto zařízení
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <code className="text-xl font-semibold tracking-widest tabular-nums select-all">{device}</code>
              <CopyButton text={device} />
            </div>
            <p className="muted text-sm">
              {role === 'student'
                ? 'Ještě nemáš klíč? Pošli tento kód správci. Vydá ti klíč, který funguje jen na tomto zařízení.'
                : 'Každý školní počítač má vlastní kód. Pošlete správci kódy všech zařízení a ke každému dostanete klíč.'}
            </p>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium">
            <span className="flex items-center gap-2">
              <KeyRound size={16} className="text-indigo-500" /> Licenční klíč
            </span>
            <textarea
              id="license-key"
              required
              rows={4}
              spellCheck={false}
              autoComplete="off"
              placeholder="ZT1-…"
              className="input resize-none font-mono text-xs break-all"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary py-2.5" disabled={busy || key.trim() === ''}>
            {busy ? 'Ověřuji…' : `Aktivovat jako ${role === 'student' ? 'student' : 'škola'}`}
          </button>

          <p className="muted text-center text-xs">
            Vydáváš licence?{' '}
            <Link to="/sprava-licenci" className="underline underline-offset-4 hover:text-indigo-600">
              Správa licencí
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}
