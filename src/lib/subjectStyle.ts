import { BookOpen, Briefcase, Calculator, Languages, Lightbulb, type LucideIcon } from 'lucide-react'
import type { SubjectId } from '../types'

// Každý předmět má vlastní odstín modré. Třídy jsou vypsané celé, aby je Tailwind našel.
type Style = { icon: LucideIcon; badge: string; bar: string; text: string }

const styles: Record<string, Style> = {
  cestina: {
    icon: BookOpen,
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
    bar: 'bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-300',
  },
  matematika: {
    icon: Calculator,
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    bar: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-300',
  },
  anglictina: {
    icon: Languages,
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    bar: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-300',
  },
  tahaky: {
    icon: Lightbulb,
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
    bar: 'bg-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-300',
  },
}

/** Předměty přidané školou (odborné předměty) mají společný styl. */
const customStyle: Style = {
  icon: Briefcase,
  badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  bar: 'bg-violet-500',
  text: 'text-violet-600 dark:text-violet-300',
}

export function subjectStyle(id: SubjectId): Style {
  return styles[id] ?? customStyle
}
