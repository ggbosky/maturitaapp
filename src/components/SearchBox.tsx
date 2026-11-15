import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { search } from '../lib/search'

/** Rychlé hledání napříč tématy, četbou, testy, kartičkami a slovesy. Zkratka Ctrl+K. */
export default function SearchBox() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const hits = useMemo(() => search(query), [query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.current?.focus()
        input.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Po přechodu na výsledek hledání zavřít nabídku.
  useEffect(() => {
    setOpen(false)
    setQuery('')
  }, [location])

  const go = (to: string) => {
    input.current?.blur()
    navigate(to)
  }

  return (
    <div className="relative w-full max-w-xl">
      <Search size={16} className="muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
      <input
        ref={input}
        id="global-search"
        type="search"
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls="search-results"
        aria-label="Hledat v aplikaci"
        autoComplete="off"
        placeholder="Hledat téma, knihu, sloveso…"
        className="input pr-16 pl-9"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => Math.min(a + 1, hits.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, 0))
          } else if (e.key === 'Enter' && hits[active]) {
            go(hits[active].to)
          } else if (e.key === 'Escape') {
            input.current?.blur()
          }
        }}
      />
      <kbd className="muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-ink-200 px-1.5 text-[11px] dark:border-ink-700">
        Ctrl K
      </kbd>

      {open && query.trim() !== '' && (
        <ul
          id="search-results"
          role="listbox"
          className="card absolute top-full right-0 left-0 z-20 mt-2 max-h-96 overflow-y-auto p-1 shadow-xl"
        >
          {hits.length === 0 && <li className="muted px-3 py-3 text-sm">Nic jsme nenašli. Zkus jiné slovo.</li>}
          {hits.map((h, i) => (
            <li key={h.to} role="option" aria-selected={i === active}>
              <button
                type="button"
                // mousedown, aby kliknutí proběhlo dřív, než pole ztratí fokus
                onMouseDown={(e) => {
                  e.preventDefault()
                  go(h.to)
                }}
                onMouseEnter={() => setActive(i)}
                className={`block w-full cursor-pointer rounded-lg px-3 py-2 text-left ${
                  i === active ? 'bg-indigo-50 dark:bg-indigo-500/15' : ''
                }`}
              >
                <div className="text-sm font-medium">{h.title}</div>
                <div className="muted text-xs">{h.where}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
