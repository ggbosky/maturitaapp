import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { Building2, GraduationCap, LayoutDashboard, LogOut, Moon, Sun, User } from 'lucide-react'
import { roleLabel, signOut, useSession } from '../../license/license'
import { subjects } from '../../data'
import { subjectStyle } from '../../lib/subjectStyle'
import { useTheme } from '../../lib/theme'

const link = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
  }`

export default function Sidebar() {
  const { dark, toggle } = useTheme()
  const session = useSession()
  const [confirming, setConfirming] = useState(false)
  const license = session.status === 'active' ? session.license : null

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <div className="mb-8 flex items-center gap-3 px-2">
        <span className="grid size-9 place-items-center rounded-lg bg-indigo-600 text-white">
          <GraduationCap size={20} />
        </span>
        <div>
          <div className="text-base leading-tight font-bold tracking-tight">Zvládni to</div>
          <div className="muted text-xs">Příprava na maturitu</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <NavLink to="/" end className={link}>
          <LayoutDashboard size={18} />
          Přehled
        </NavLink>
        <div className="muted mt-5 mb-1 px-3 text-xs font-semibold tracking-wider uppercase">Předměty</div>
        {subjects.map((s) => {
          const Icon = subjectStyle[s.id].icon
          return (
            <NavLink key={s.id} to={`/predmet/${s.id}`} className={link}>
              <Icon size={18} />
              {s.name}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        {license && (
          <div className="rounded-lg bg-ink-50 p-3 dark:bg-ink-800/60">
            <div className="flex items-center gap-2">
              {license.role === 'skola' ? <Building2 size={16} className="shrink-0 text-indigo-500" /> : <User size={16} className="shrink-0 text-indigo-500" />}
              <span className="truncate text-sm font-semibold" title={license.name}>
                {license.name}
              </span>
            </div>
            <div className="muted mt-1 text-xs">
              {roleLabel[license.role]} · {license.expires ? `platí do ${new Date(license.expires).toLocaleDateString('cs-CZ')}` : 'bez omezení'}
            </div>
            <button
              type="button"
              className="muted mt-2 flex cursor-pointer items-center gap-1.5 text-xs hover:text-rose-600"
              onClick={() => (confirming ? signOut() : setConfirming(true))}
              onBlur={() => setConfirming(false)}
            >
              <LogOut size={12} /> {confirming ? 'Opravdu odhlásit? Klikni znovu' : 'Odhlásit toto zařízení'}
            </button>
          </div>
        )}
        <button type="button" onClick={toggle} className="btn btn-ghost justify-start">
          {dark ? <Sun size={16} /> : <Moon size={16} />}
          {dark ? 'Světlý režim' : 'Tmavý režim'}
        </button>
      </div>
    </aside>
  )
}
