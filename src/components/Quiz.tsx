import { useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import type { Question, Quiz as QuizData } from '../types'
import { isCorrect, score, verdict } from '../lib/quiz'
import { recordQuiz } from '../lib/progress'
import ProgressBar from './ProgressBar'

type Answer = number | string | undefined

function correctText(q: Question): string {
  return q.type === 'choice' ? q.options[q.answer] : q.answers[0]
}

function givenText(q: Question, a: Answer): string {
  if (a === undefined || a === '') return '(bez odpovědi)'
  return q.type === 'choice' ? q.options[a as number] : String(a)
}

/** Test po jedné otázce s okamžitou kontrolou a závěrečným vyhodnocením. */
export default function Quiz({ quiz }: { quiz: QuizData }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(false)

  const total = quiz.questions.length
  const q = quiz.questions[index]
  const answer = answers[index]
  const hasAnswer = q.type === 'choice' ? answer !== undefined : typeof answer === 'string' && answer.trim() !== ''
  const ok = isCorrect(q, answer)

  const setAnswer = (a: Answer) => setAnswers((prev) => Object.assign([...prev], { [index]: a }))

  const next = () => {
    if (index + 1 < total) {
      setIndex(index + 1)
      setChecked(false)
    } else {
      recordQuiz(quiz.id, score(quiz.questions, answers), total)
      setDone(true)
    }
  }

  const restart = () => {
    setIndex(0)
    setAnswers([])
    setChecked(false)
    setDone(false)
  }

  if (done) {
    const correct = score(quiz.questions, answers)
    const pct = Math.round((correct / total) * 100)
    return (
      <div className="flex flex-col gap-6">
        <div className="card flex flex-wrap items-center gap-6 p-6">
          <div className="text-5xl font-bold tracking-tight text-indigo-600 tabular-nums dark:text-indigo-300">{pct} %</div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold">
              {correct} z {total} správně
            </div>
            <p className="muted">{verdict(pct)}</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={restart}>
            <RotateCcw size={16} /> Zkusit znovu
          </button>
        </div>

        <ol className="flex flex-col gap-3">
          {quiz.questions.map((item, i) => {
            const good = isCorrect(item, answers[i])
            return (
              <li key={i} className="card flex gap-3 p-4">
                <span
                  className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-white ${good ? 'bg-emerald-500' : 'bg-rose-500'}`}
                >
                  {good ? <Check size={14} /> : <X size={14} />}
                </span>
                <div className="min-w-0 text-sm">
                  <div className="font-medium">{item.question}</div>
                  {!good && <div className="text-rose-600 dark:text-rose-400">Tvoje odpověď: {givenText(item, answers[i])}</div>}
                  <div className="text-emerald-700 dark:text-emerald-400">Správně: {correctText(item)}</div>
                  {item.explanation && <div className="muted mt-1">{item.explanation}</div>}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (checked) next()
        else if (hasAnswer) setChecked(true)
      }}
    >
      <div className="flex items-center gap-4">
        <span className="muted shrink-0 text-sm tabular-nums">
          Otázka {index + 1} / {total}
        </span>
        <ProgressBar value={index + (checked ? 1 : 0)} max={total} />
      </div>

      <div className="card flex flex-col gap-5 p-6">
        <h2 className="text-lg leading-snug font-semibold">{q.question}</h2>

        {q.type === 'choice' ? (
          <div className="flex flex-col gap-2">
            {q.options.map((opt, i) => {
              const selected = answer === i
              let state = selected
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15'
                : 'border-ink-200 hover:border-indigo-300 dark:border-ink-700 dark:hover:border-indigo-500/60'
              if (checked && i === q.answer) state = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15'
              else if (checked && selected) state = 'border-rose-500 bg-rose-50 dark:bg-rose-500/15'
              return (
                <label key={i} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${checked ? '' : 'cursor-pointer'} ${state}`}>
                  <input
                    type="radio"
                    name={`q-${index}`}
                    className="accent-indigo-600"
                    checked={selected}
                    disabled={checked}
                    onChange={() => setAnswer(i)}
                  />
                  <span>{opt}</span>
                </label>
              )
            })}
          </div>
        ) : (
          <input
            // key: nové pole pro každou otázku, aby se fokus přesunul
            key={index}
            id="quiz-answer"
            autoFocus
            autoComplete="off"
            aria-label="Tvoje odpověď"
            placeholder="Napiš odpověď"
            className={`input max-w-sm text-base ${checked ? (ok ? 'border-emerald-500!' : 'border-rose-500!') : ''}`}
            value={typeof answer === 'string' ? answer : ''}
            readOnly={checked}
            onChange={(e) => setAnswer(e.target.value)}
          />
        )}

        {checked && (
          <div
            role="status"
            className={`rounded-lg px-4 py-3 text-sm ${
              ok
                ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200'
                : 'bg-rose-50 text-rose-900 dark:bg-rose-500/10 dark:text-rose-200'
            }`}
          >
            <div className="font-semibold">{ok ? 'Správně' : `Špatně. Správná odpověď: ${correctText(q)}`}</div>
            {q.explanation && <div className="mt-1">{q.explanation}</div>}
          </div>
        )}
      </div>

      <div>
        <button type="submit" className="btn btn-primary" disabled={!checked && !hasAnswer} autoFocus={checked} key={String(checked)}>
          {!checked ? 'Zkontrolovat' : index + 1 < total ? 'Další otázka' : 'Vyhodnotit test'}
        </button>
      </div>
    </form>
  )
}
