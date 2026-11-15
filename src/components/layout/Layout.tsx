import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import SearchBox from '../SearchBox'

export default function Layout() {
  const { pathname } = useLocation()
  const main = useRef<HTMLElement>(null)

  // Po přechodu na jinou stránku začít nahoře.
  useEffect(() => {
    main.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-ink-200 bg-white/80 px-6 py-3 backdrop-blur dark:border-ink-800 dark:bg-ink-900/80">
          <SearchBox />
        </header>
        <main ref={main} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
