import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { CheckCircle2, Upload } from 'lucide-react'
import { daysLeft, formatDate, useSession } from '../license/license'
import { importPack, topicCount, useSchoolContent, type ImportResult } from '../lib/school'
import { plural } from '../lib/plural'

function resultText(r: ImportResult): string {
  if (!r.ok) {
    if (r.reason === 'school') return 'Tento balíček je od jiné školy.'
    if (r.reason === 'signature') return 'Balíček je poškozený nebo upravený. Požádej učitele o nový.'
    return 'Tohle není balíček aplikace Zvládni to. Vyber soubor .json od učitele.'
  }
  return `Načteno: ${plural(r.topics, 'téma', 'témata', 'témat')}${r.subjects ? ` a ${plural(r.subjects, 'vlastní předmět', 'vlastní předměty', 'vlastních předmětů')}` : ''}.${r.renewed ? ' Licence školy je prodloužená.' : ''}`
}

/** Žák: informace o škole a načtení balíčku od učitele. */
export default function SchoolPage() {
  const session = useSession()
  const content = useSchoolContent()
  const [result, setResult] = useState<ImportResult | null>(null)
  if (session.status !== 'active' || session.role !== 'student') return <Navigate to="/" replace />
  const { cert, student } = session
  const left = daysLeft(cert.expires)

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header>
        <p className="muted text-sm">Moje škola</p>
        <h1 className="text-3xl font-bold tracking-tight">{cert.school}</h1>
        <p className="muted mt-1">
          Přihlášen jako {student.name}. Licence školy platí do {formatDate(cert.expires)}
          {left <= 30 && `, zbývá ${plural(left, 'den', 'dny', 'dní')}`}.
        </p>
      </header>

      <section className="card flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-lg font-semibold">Balíček od učitele</h2>
          <p className="muted text-sm">
            Učitel přidává vlastní témata a předměty a posílá je jako soubor. Načti ho tady. Balíček také prodlužuje přístup, když škola prodlouží licenci.
          </p>
        </div>
        <p className="text-sm">
          {content.updated
            ? `Máš obsah od učitele ze dne ${new Date(content.updated).toLocaleDateString('cs-CZ')}: ${plural(topicCount(content), 'téma', 'témata', 'témat')}${content.subjects.length ? `, ${plural(content.subjects.length, 'vlastní předmět', 'vlastní předměty', 'vlastních předmětů')}` : ''}.`
            : 'Zatím jsi žádný balíček nenačetl.'}
        </p>
        <label className="btn btn-primary w-fit">
          <Upload size={16} /> Načíst balíček
          <input
            id="pack-file"
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              setResult(await importPack(await file.text(), session))
            }}
          />
        </label>
        {result && (
          <p
            role="status"
            className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
              result.ok
                ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
                : 'bg-rose-50 text-rose-900 dark:bg-rose-500/10 dark:text-rose-200'
            }`}
          >
            {result.ok && <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
            {resultText(result)}
          </p>
        )}
      </section>
    </div>
  )
}
