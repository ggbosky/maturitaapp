import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { useSession } from './license/license'
import Dashboard from './pages/Dashboard'
import SubjectPage from './pages/SubjectPage'
import TopicPage from './pages/TopicPage'
import BookPage from './pages/BookPage'
import QuizPage from './pages/QuizPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  const session = useSession()

  // Než se ověří uložená licence, nevykreslovat nic (trvá to zlomek sekundy).
  if (session.status === 'checking') return null

  return (
    <Routes>
      <Route path="sprava-licenci" element={<AdminPage />} />
      {session.status === 'active' ? (
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="predmet/:subjectId" element={<SubjectPage />} />
          <Route path="predmet/:subjectId/:tab" element={<SubjectPage />} />
          <Route path="predmet/:subjectId/tema/:topicId" element={<TopicPage />} />
          <Route path="predmet/:subjectId/cetba/:bookId" element={<BookPage />} />
          <Route path="predmet/:subjectId/test/:quizId" element={<QuizPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        // Bez platné licence vede každá adresa na přihlášení.
        <Route path="*" element={<LoginPage notice={session.reason} />} />
      )}
    </Routes>
  )
}
