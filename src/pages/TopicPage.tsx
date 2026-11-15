import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { getSubject, topicKey } from '../data'
import { setRead, useProgress } from '../lib/progress'
import Breadcrumbs from '../components/Breadcrumbs'
import TopicContent from '../components/TopicContent'

export default function TopicPage() {
  const { subjectId, topicId } = useParams()
  const progress = useProgress()
  const subject = getSubject(subjectId)
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
        <h1 className="text-3xl font-bold tracking-tight text-balance">{topic.title}</h1>
        <p className="muted mt-2 max-w-[70ch] text-lg">{topic.summary}</p>
      </header>

      <TopicContent sections={topic.sections} />

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
