import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { daysLeft, formatDate, useSession } from '../../license/license'
import { plural } from '../../lib/plural'
import Sidebar from './Sidebar'
import SearchBox from '../SearchBox'

export default function Layout() {
  const { pathname } = useLocation()
  const main = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(0)
  const session = useSession()
  const left = session.status === 'active' ? daysLeft(session.cert.expires) : Infinity
  // Ukazatel čtení má smysl jen u dlouhých stránek s výkladem.
  const isReading = /\/(tema|cetba)\/[^/]+$/.test(pathname)

  // Po přechodu na jinou stránku začít nahoře.
  useEffect(() => {
    main.current?.scrollTo(0, 0)
    setScrolled(0)
  }, [pathname])

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex items-center gap-4 border-b border-ink-200 bg-white/80 px-6 py-3 backdrop-blur dark:border-ink-800 dark:bg-ink-900/80">
          <SearchBox />
          {isReading && (
            <div
              role="progressbar"
              aria-label="Přečtená část stránky"
              aria-valuenow={Math.round(scrolled * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="absolute right-0 -bottom-px left-0 h-0.5"
            >
              <div className="h-full bg-indigo-500" style={{ width: `${scrolled * 100}%` }} />
            </div>
          )}
        </header>
        <main
          ref={main}
          className="flex-1 overflow-y-auto"
          onScroll={(e) => {
            const el = e.currentTarget
            const max = el.scrollHeight - el.clientHeight
            setScrolled(max > 0 ? el.scrollTop / max : 0)
          }}
        >
          {left <= 30 && session.status === 'active' && (
            <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-amber-50 px-6 py-2.5 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              <CalendarClock size={16} className="shrink-0" />
              <span>
                Licence školy končí {formatDate(session.cert.expires)} ({left === 0 ? 'dnes' : `za ${plural(left, 'den', 'dny', 'dní')}`}).{' '}
                {session.role === 'teacher'
                  ? 'Požádej správce o prodloužení a pak pošli žákům nový balíček.'
                  : 'Až škola licenci prodlouží, načti nový balíček od učitele.'}
              </span>
              {session.role === 'student' && (
                <Link to="/skola" className="font-medium underline underline-offset-4">
                  Načíst balíček
                </Link>
              )}
            </div>
          )}
          <div className="mx-auto max-w-5xl px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
