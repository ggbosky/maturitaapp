import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Drobečková navigace" className="muted mb-4 flex flex-wrap items-center gap-1 text-sm">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} />}
          {it.to ? (
            <Link to={it.to} className="hover:text-indigo-600 dark:hover:text-indigo-300">
              {it.label}
            </Link>
          ) : (
            <span className="text-ink-700 dark:text-ink-200">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
