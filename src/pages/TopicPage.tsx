import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Pencil } from 'lucide-react'
import { useSession } from '../license/license'
import { topicPairs } from '../lib/practice'
import Practice from '../components/Practice'
import { getSubject, topicKey, useSubjects } from '../data'
import { setRead, useProgress } from '../lib/progress'
import Breadcrumbs from '../components/Breadcrumbs'
import TopicContent from '../components/TopicContent'

export default function TopicPage() {
  const { subjectId, topicId } = useParams()
  const progress = useProgress()
  const session = useSession()
  const subjects = useSubjects()
  const subject = getSubject(subjects, subjectId)
  const index = subject?.topics.findIndex((t) => t.id === topicId) ?? -1
  if (!subject || index < 0) return <Navigate to="/" replace />

  const topic = subject.topics[index]
  const prev = subject.topics[index - 1]
  const next = subject.topics[index + 1]
  const key = topicKey(subject.id, topic.id)
  const read = !!progress.read[key]

  return (
    <article className="flex flex-col gap-8">
      <header>
        <Breadcrumbs items={[{ label: subject.name, to: `/predmet/${subject.id}` }, { label: topic.category }, { label: topic.title }]} />
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="min-w-0 flex-1 text-3xl font-bold tracking-tight text-balance">{topic.title}</h1>
          {topic.custom && session.status === 'active' && session.role === 'teacher' && (
            <Link to={`/ucitel/tema/${topic.id}?predmet=${subject.id}`} className="btn btn-ghost">
              <Pencil size={16} /> Upravit
            </Link>
          )}
        </div>
        {topic.custom && <p className="mt-1 text-sm text-violet-700 dark:text-violet-300">Téma od tvé školy</p>}
        <p className="muted mt-2 max-w-[70ch] text-lg">{topic.summary}</p>
      </header>

      <TopicContent sections={topic.sections} />

      <Practice key={key} id={key} title={topic.title} pairs={topicPairs(topic)} questions={topic.practice?.questions} />

      <footer className="flex flex-col gap-6 border-t border-ink-200 pt-6 dark:border-ink-800">
        <div>
          <button type="button" className={`btn ${read ? 'btn-ghost' : 'btn-primary'}`} aria-pressed={read} onClick={() => setRead(key, !read, topic.title, `/predmet/${subject.id}/tema/${topic.id}`)}>
            {read ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />}
            {read ? 'Přečteno' : 'Označit jako přečtené'}
          </button>
        </div>
        <div className="flex justify-between gap-4">
          {prev ? (
            <Link to={`/predmet/${subject.id}/tema/${prev.id}`} className="btn btn-ghost">
              <ArrowLeft size={16} /> {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={`/predmet/${subject.id}/tema/${next.id}`} className="btn btn-ghost">
              {next.title} <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </footer>
    </article>
  )
}
