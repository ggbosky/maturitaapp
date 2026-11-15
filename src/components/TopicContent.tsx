import { ExternalLink, Lightbulb } from 'lucide-react'
import type { TopicSection } from '../types'

/** Vykreslí bloky výkladu jednoho tématu podle toho, která pole sekce obsahuje. */
export default function TopicContent({ sections }: { sections: TopicSection[] }) {
  return (
    <div className="flex flex-col gap-10">
      {sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold tracking-tight">{s.heading}</h2>

          {s.text && <p className="max-w-[70ch] leading-relaxed">{s.text}</p>}

          {s.bullets && (
            <ul className="flex max-w-[75ch] flex-col gap-2">
              {s.bullets.map((b) => (
                <li key={b} className="flex gap-3 leading-relaxed">
                  {/* Číslované kroky mají číslo přímo v textu, odrážku dostanou jen ostatní. */}
                  {!/^\d+\./.test(b) && <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-indigo-500" />}
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {s.formulas && (
            <dl className="grid gap-2 sm:grid-cols-2">
              {s.formulas.map((f) => (
                <div key={f.label} className="card px-4 py-3">
                  <dt className="muted text-xs">{f.label}</dt>
                  <dd className="mt-1 font-mono text-[15px] text-indigo-700 dark:text-indigo-300">{f.formula}</dd>
                </div>
              ))}
            </dl>
          )}

          {s.table && (
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-50 dark:border-ink-800 dark:bg-ink-800/50">
                    {s.table.head.map((h, i) => (
                      <th key={i} className="px-4 py-2.5 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((row, r) => (
                    <tr key={r} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                      {row.map((cell, c) => (
                        <td key={c} className={`px-4 py-2.5 align-top ${c === 0 ? 'font-medium whitespace-nowrap' : ''}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {s.example && (
            <pre className="overflow-x-auto rounded-xl bg-ink-100 px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap dark:bg-ink-800/60">
              {s.example}
            </pre>
          )}

          {s.tip && (
            <div className="flex max-w-[75ch] gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm leading-relaxed text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-100">
              <Lightbulb size={18} className="mt-0.5 shrink-0 text-indigo-500" />
              <span>{s.tip}</span>
            </div>
          )}

          {s.link && (
            <a href={s.link.url} target="_blank" rel="noreferrer" className="btn btn-ghost w-fit">
              <ExternalLink size={16} /> {s.link.label}
            </a>
          )}
        </section>
      ))}
    </div>
  )
}
