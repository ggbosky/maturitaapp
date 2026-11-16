import { Navigate, useParams } from 'react-router-dom'
import { getSubject, useSubjects } from '../data'
import Breadcrumbs from '../components/Breadcrumbs'
import Quiz from '../components/Quiz'

export default function QuizPage() {
  const { subjectId, quizId } = useParams()
  const subjects = useSubjects()
  const subject = getSubject(subjects, subjectId)
  const quiz = subject?.quizzes.find((q) => q.id === quizId)
  if (!subject || !quiz) return <Navigate to="/" replace />

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header>
        <Breadcrumbs
          items={[
            { label: subject.name, to: `/predmet/${subject.id}` },
            { label: 'Testy', to: `/predmet/${subject.id}/testy` },
            { label: quiz.title },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight">{quiz.title}</h1>
        <p className="muted mt-1">{quiz.description}</p>
      </header>
      {/* key: při přechodu na jiný test začít od první otázky */}
      <Quiz key={quiz.id} quiz={quiz} />
    </div>
  )
}
