import { Navigate, useParams } from 'react-router-dom'
import { getSubject, useSubjects } from '../data'
import Breadcrumbs from '../components/Breadcrumbs'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-ink-100 py-4 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-6 dark:border-ink-800">
      <dt className="muted text-sm font-medium">{label}</dt>
      <dd className="max-w-[70ch] leading-relaxed">{children}</dd>
    </div>
  )
}

export default function BookPage() {
  const { subjectId, bookId } = useParams()
  const subjects = useSubjects()
  const subject = getSubject(subjects, subjectId)
  const book = subject?.books?.find((b) => b.id === bookId)
  if (!subject || !book) return <Navigate to="/" replace />

  return (
    <article className="flex flex-col gap-6">
      <header>
        <Breadcrumbs
          items={[
            { label: subject.name, to: `/predmet/${subject.id}` },
            { label: 'Maturitní četba', to: `/predmet/${subject.id}/cetba` },
            { label: book.title },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
        <p className="muted mt-1 text-lg">
          {book.author} · {book.year}
        </p>
      </header>

      {book.overit && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          U tohoto díla máme zatím jen základní údaje a je potřeba je ověřit. Než se podle nich budeš učit, porovnej je s knihou nebo s učebnicí.
        </p>
      )}

      <dl className="card px-5">
        <Field label="Literární směr a období">{book.period}</Field>
        <Field label="Forma a druh">{[book.forma, book.druh].filter(Boolean).join(' · ')}</Field>
        <Field label="Žánr">{book.zanr}</Field>
        <Field label="Téma">{book.tema}</Field>
        {book.motivy && (
        <Field label="Motivy">
          <span className="flex flex-wrap gap-1.5">
            {book.motivy.map((m) => (
              <span key={m} className="rounded-md bg-indigo-50 px-2 py-0.5 text-sm text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200">
                {m}
              </span>
            ))}
          </span>
        </Field>
        )}
        {book.casoprostor && <Field label="Časoprostor">{book.casoprostor}</Field>}
        {book.kompozice && <Field label="Kompozice">{book.kompozice}</Field>}
        {book.postavy && (
        <Field label="Postavy">
          <ul className="flex flex-col gap-2">
            {book.postavy.map((p) => (
              <li key={p.name}>
                <span className="font-semibold">{p.name}</span>
                {p.desc && ` – ${p.desc}`}
              </li>
            ))}
          </ul>
        </Field>
        )}
        {book.jazyk && <Field label="Jazyk a styl">{book.jazyk}</Field>}
        {book.kontext && <Field label="Kontext">{book.kontext}</Field>}
      </dl>

      {book.ukazka && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Ukázka</h2>
          <blockquote className="max-w-[70ch] border-l-2 border-indigo-500 py-1 pl-5 font-serif text-lg leading-relaxed whitespace-pre-line italic">
            {book.ukazka.text}
          </blockquote>
          {book.ukazka.note && <p className="muted max-w-[70ch] text-sm">{book.ukazka.note}</p>}
        </section>
      )}
    </article>
  )
}
