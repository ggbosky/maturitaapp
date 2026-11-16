import { describe, expect, it } from 'vitest'
import type { Question } from '../types'
import { isCorrect, normalize, score } from './quiz'
import { builtinSubjects as subjects } from '../data'

const choice: Question = { type: 'choice', question: 'q', options: ['a', 'b'], answer: 1 }
const input: Question = { type: 'input', question: 'q', answers: ['is raining', "aren't you", '-3', '2.5'] }

describe('normalize', () => {
  it('ignoruje velikost písmen, mezery a koncovou interpunkci', () => {
    expect(normalize('  Is   Raining. ')).toBe('is raining')
  })
  it('sjednotí apostrofy, minus a desetinnou čárku', () => {
    expect(normalize('aren’t you?')).toBe("aren't you")
    expect(normalize('−3')).toBe('-3')
    expect(normalize('2,5')).toBe('2.5')
  })
})

describe('isCorrect', () => {
  it('vyhodnotí výběr z možností', () => {
    expect(isCorrect(choice, 1)).toBe(true)
    expect(isCorrect(choice, 0)).toBe(false)
    expect(isCorrect(choice, undefined)).toBe(false)
  })
  it('vyhodnotí doplňovačku', () => {
    expect(isCorrect(input, 'IS RAINING')).toBe(true)
    expect(isCorrect(input, '2,5')).toBe(true)
    expect(isCorrect(input, '')).toBe(false)
    expect(isCorrect(input, 'rains')).toBe(false)
  })
})

describe('score', () => {
  it('spočítá správné odpovědi', () => {
    expect(score([choice, input, choice], [1, '−3', 0])).toBe(2)
  })
})

describe('obsah v src/data', () => {
  it('má jedinečná id a platné odpovědi', () => {
    for (const s of subjects) {
      const ids = [...s.topics, ...s.quizzes, ...s.decks, ...(s.books ?? [])].map((x) => x.id)
      expect(new Set(ids).size, `duplicitní id v ${s.id}`).toBe(ids.length)
      const questions = [...s.quizzes.flatMap((x) => x.questions), ...s.topics.flatMap((t) => t.practice?.questions ?? [])]
      {
        for (const q of questions) {
          if (q.type === 'choice') expect(q.options[q.answer], q.question).toBeDefined()
          else expect(q.answers.length, q.question).toBeGreaterThan(0)
        }
      }
    }
  })
})
