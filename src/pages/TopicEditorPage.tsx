import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useSubjects } from '../data'
import { useSession } from '../license/license'
import { newId, saveTopic, useSchoolContent } from '../lib/school'
import type { Question, Topic, TopicSection } from '../types'
import Breadcrumbs from '../components/Breadcrumbs'

interface SectionDraft {
  key: string
  heading: string
  text: string
  bullets: string
  example: string
  tip: string
}

interface QuestionDraft {
  key: string
  question: string
  options: string[]
  answer: number
  explanation: string
}

const blankSection = (): SectionDraft => ({ key: newId(), heading: '', text: '', bullets: '', example: '', tip: '' })
const blankQuestion = (): QuestionDraft => ({ key: newId(), question: '', options: ['', '', '', ''], answer: 0, explanation: '' })

const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

function toDrafts(topic?: Topic) {
  return {
    sections: topic?.sections.map((s) => ({
      key: newId(),
      heading: s.heading,
      text: s.text ?? '',
      bullets: (s.bullets ?? []).join('\n'),
      example: s.example ?? '',
      tip: s.tip ?? '',
    })) ?? [blankSection()],
    pairs: (topic?.practice?.pairs ?? []).map((p) => `${p.a} = ${p.b}`).join('\n'),
    questions: (topic?.practice?.questions ?? [])
      .filter((q): q is Extract<Question, { type: 'choice' }> => q.type === 'choice')
      .map((q) => ({ key: newId(), question: q.question, options: [...q.options, '', '', '', ''].slice(0, 4), answer: q.answer, explanation: q.explanation ?? '' })),
  }
}

/** Při přechodu na jiné téma začít s čistým formulářem. */
export default function TopicEditorRoute() {
  const location = useLocation()
  return <TopicEditorPage key={location.pathname + location.search} />
}

/** Učitel vytváří a upravuje vlastní téma. */
function TopicEditorPage() {
  const session = useSession()
  const subjects = useSubjects()
  const content = useSchoolContent()
  const navigate = useNavigate()
  const { topicId } = useParams()
  const [params] = useSearchParams()
  const originalSubject = params.get('predmet') ?? subjects[0].id
  const existing = topicId && topicId !== 'nove' ? content.topics[originalSubject]?.find((t) => t.id === topicId) : undefined
  const initial = toDrafts(existing)

  const [subjectId, setSubjectId] = useState(originalSubject)
  const [title, setTitle] = useState(existing?.title ?? '')
  const [category, setCategory] = useState(existing?.category ?? '')
  const [summary, setSummary] = useState(existing?.summary ?? '')
  const [sections, setSections] = useState<SectionDraft[]>(initial.sections)
  const [pairs, setPairs] = useState(initial.pairs)
  const [questions, setQuestions] = useState<QuestionDraft[]>(initial.questions)
  const [error, setError] = useState('')

  if (session.status !== 'active' || session.role !== 'teacher') return <Navigate to="/" replace />
  if (topicId !== 'nove' && !existing) return <Navigate to="/ucitel" replace />

  const subject = subjects.find((s) => s.id === subjectId)
  const categories = [...new Set(subject?.topics.map((t) => t.category) ?? [])]

  const patchSection = (key: string, patch: Partial<SectionDraft>) => setSections((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)))
  const moveSection = (i: number, dir: -1 | 1) =>
    setSections((list) => {
      const next = [...list]
      ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
      return next
    })
  const patchQuestion = (key: string, patch: Partial<QuestionDraft>) => setQuestions((list) => list.map((q) => (q.key === key ? { ...q, ...patch } : q)))

  const parsedPairs = lines(pairs)
    .map((l) => {
      const at = l.indexOf('=')
      return at > 0 ? { a: l.slice(0, at).trim(), b: l.slice(at + 1).trim() } : null
    })
    .filter((p): p is { a: string; b: string } => !!p && !!p.a && !!p.b)
  const badPairs = lines(pairs).length - parsedPairs.length

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        setError('')
        const outSections: TopicSection[] = sections
          .filter((s) => s.heading.trim() || s.text.trim() || s.bullets.trim())
          .map((s) => ({
            heading: s.heading.trim() || 'Bez nadpisu',
            ...(s.text.trim() && { text: s.text.trim() }),
            ...(lines(s.bullets).length && { bullets: lines(s.bullets) }),
            ...(s.example.trim() && { example: s.example.trim() }),
            ...(s.tip.trim() && { tip: s.tip.trim() }),
          }))
        if (outSections.length === 0) return setError('Téma potřebuje aspoň jednu část s nadpisem nebo textem.')
        const outQuestions: Question[] = []
        for (const q of questions) {
          if (!q.question.trim()) continue
          const options = q.options.map((o) => o.trim())
          if (!options[q.answer]) return setError(`U otázky „${q.question}“ chybí text správné odpovědi.`)
          const kept = options.filter(Boolean)
          if (kept.length < 2) return setError(`Otázka „${q.question}“ potřebuje aspoň dvě možnosti.`)
          outQuestions.push({
            type: 'choice',
            question: q.question.trim(),
            options: kept,
            answer: kept.indexOf(options[q.answer]),
            ...(q.explanation.trim() && { explanation: q.explanation.trim() }),
          })
        }
        const topic: Topic = {
          id: existing?.id ?? newId(),
          title: title.trim(),
          category: category.trim() || 'Témata školy',
          summary: summary.trim(),
          sections: outSections,
          ...((parsedPairs.length || outQuestions.length) && {
            practice: { ...(parsedPairs.length && { pairs: parsedPairs }), ...(outQuestions.length && { questions: outQuestions }) },
          }),
        }
        saveTopic(subjectId, topic, existing ? originalSubject : undefined)
        navigate(`/predmet/${subjectId}/tema/${topic.id}`)
      }}
    >
      <header>
        <Breadcrumbs items={[{ label: 'Správa školy', to: '/ucitel' }, { label: existing ? 'Upravit téma' : 'Nové téma' }]} />
        <h1 className="text-3xl font-bold tracking-tight">{existing ? `Upravit: ${existing.title}` : 'Nové téma'}</h1>
        <p className="muted mt-1">Vyplň výklad, pak dvojice pojmů pro hry a otázky do kvízu. Hry se z dvojic vytvoří samy.</p>
      </header>

      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="muted">Předmět</span>
          <select id="topic-subject" className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="muted">Okruh (skupina témat)</span>
          <input id="topic-category" list="topic-categories" className="input" placeholder="Např. Účetnictví" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="topic-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="muted">Název tématu</span>
          <input id="topic-title" required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="muted">Krátké shrnutí (zobrazí se v přehledu)</span>
          <input id="topic-summary" required className="input" value={summary} onChange={(e) => setSummary(e.target.value)} />
        </label>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Výklad</h2>
        {sections.map((s, i) => (
          <div key={s.key} className="card flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2">
              <span className="muted text-sm font-semibold tabular-nums">Část {i + 1}</span>
              <div className="ml-auto flex gap-1">
                <button type="button" className="btn btn-ghost px-2 py-1" disabled={i === 0} onClick={() => moveSection(i, -1)} aria-label="Posunout nahoru">
                  <ArrowUp size={14} />
                </button>
                <button type="button" className="btn btn-ghost px-2 py-1" disabled={i === sections.length - 1} onClick={() => moveSection(i, 1)} aria-label="Posunout dolů">
                  <ArrowDown size={14} />
                </button>
                <button type="button" className="btn btn-ghost px-2 py-1" disabled={sections.length === 1} onClick={() => setSections((l) => l.filter((x) => x.key !== s.key))} aria-label="Odebrat část">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <input className="input font-semibold" placeholder="Nadpis části" aria-label="Nadpis části" value={s.heading} onChange={(e) => patchSection(s.key, { heading: e.target.value })} />
            <textarea className="input" rows={3} placeholder="Text výkladu" aria-label="Text výkladu" value={s.text} onChange={(e) => patchSection(s.key, { text: e.target.value })} />
            <textarea className="input" rows={3} placeholder="Odrážky – každá na nový řádek" aria-label="Odrážky" value={s.bullets} onChange={(e) => patchSection(s.key, { bullets: e.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <textarea className="input font-mono text-sm" rows={2} placeholder="Příklad (nepovinné)" aria-label="Příklad" value={s.example} onChange={(e) => patchSection(s.key, { example: e.target.value })} />
              <textarea className="input" rows={2} placeholder="Tip (nepovinné)" aria-label="Tip" value={s.tip} onChange={(e) => patchSection(s.key, { tip: e.target.value })} />
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-ghost w-fit" onClick={() => setSections((l) => [...l, blankSection()])}>
          <Plus size={16} /> Přidat část
        </button>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <div>
          <h2 className="text-lg font-semibold">Dvojice pro hry</h2>
          <p className="muted text-sm">Každá dvojice na nový řádek ve tvaru „pojem = vysvětlení“. Z nich vznikne přiřazování, rychlovka a kartičky. Hodí se aspoň 4 dvojice.</p>
        </div>
        <textarea
          id="topic-pairs"
          className="input font-mono text-sm"
          rows={6}
          placeholder={'Aktiva = majetek podniku\nPasiva = zdroje financování majetku'}
          value={pairs}
          onChange={(e) => setPairs(e.target.value)}
        />
        <p className="muted text-xs tabular-nums">
          Rozpoznané dvojice: {parsedPairs.length}
          {badPairs > 0 && ` · ${badPairs} řádků bez znaku „=“ se nepoužije`}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Otázky do kvízu</h2>
        {questions.length === 0 && <p className="muted text-sm">Zatím žádné. Kvíz u tématu se ukáže, až přidáš aspoň jednu otázku.</p>}
        {questions.map((q, i) => (
          <fieldset key={q.key} className="card flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2">
              <legend className="muted text-sm font-semibold tabular-nums">Otázka {i + 1}</legend>
              <button type="button" className="btn btn-ghost ml-auto px-2 py-1" onClick={() => setQuestions((l) => l.filter((x) => x.key !== q.key))} aria-label="Odebrat otázku">
                <Trash2 size={14} />
              </button>
            </div>
            <input className="input" placeholder="Znění otázky" aria-label="Znění otázky" value={q.question} onChange={(e) => patchQuestion(q.key, { question: e.target.value })} />
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, j) => (
                <label key={j} className="flex items-center gap-2">
                  <input type="radio" name={`answer-${q.key}`} className="accent-emerald-600" checked={q.answer === j} onChange={() => patchQuestion(q.key, { answer: j })} aria-label={`Možnost ${j + 1} je správně`} />
                  <input
                    className={`input ${q.answer === j ? 'border-emerald-500!' : ''}`}
                    placeholder={`Možnost ${j + 1}${j > 1 ? ' (nepovinné)' : ''}`}
                    aria-label={`Možnost ${j + 1}`}
                    value={o}
                    onChange={(e) => patchQuestion(q.key, { options: q.options.map((x, k) => (k === j ? e.target.value : x)) })}
                  />
                </label>
              ))}
            </div>
            <p className="muted text-xs">Kolečkem označ správnou odpověď.</p>
            <input className="input" placeholder="Vysvětlení po odpovědi (nepovinné)" aria-label="Vysvětlení" value={q.explanation} onChange={(e) => patchQuestion(q.key, { explanation: e.target.value })} />
          </fieldset>
        ))}
        <button type="button" className="btn btn-ghost w-fit" onClick={() => setQuestions((l) => [...l, blankQuestion()])}>
          <Plus size={16} /> Přidat otázku
        </button>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-6 flex gap-2 border-t border-ink-200 bg-ink-50/90 px-6 py-3 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90">
        <button type="submit" className="btn btn-primary">
          Uložit téma
        </button>
        <Link to="/ucitel" className="btn btn-ghost">
          Zrušit
        </Link>
      </div>
    </form>
  )
}
