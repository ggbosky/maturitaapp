import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import SubjectPage from './pages/SubjectPage'
import TopicPage from './pages/TopicPage'
import BookPage from './pages/BookPage'
import QuizPage from './pages/QuizPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="predmet/:subjectId" element={<SubjectPage />} />
        <Route path="predmet/:subjectId/:tab" element={<SubjectPage />} />
        <Route path="predmet/:subjectId/tema/:topicId" element={<TopicPage />} />
        <Route path="predmet/:subjectId/cetba/:bookId" element={<BookPage />} />
        <Route path="predmet/:subjectId/test/:quizId" element={<QuizPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
