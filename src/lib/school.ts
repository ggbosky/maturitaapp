// Obsah, který do aplikace přidává učitel školy, a balíček, kterým ho předává žákům.
//
// Učitel obsah upravuje u sebe. Žákům ho pošle jako soubor (balíček) podepsaný klíčem školy,
// žák ho načte. Balíček zároveň nese aktuální certifikát školy, takže po prodloužení
// licence prodlouží i přístup žáků.
import { useSyncExternalStore } from 'react'
import type { Topic } from '../types'
import { readCert, updateCert, type Session } from '../license/license'
import { sign, verify } from '../license/crypto'

export interface CustomSubject {
  id: string
  name: string
  tagline: string
}

export interface SchoolContent {
  /** Kdy učitel obsah naposledy změnil (ISO). */
  updated: string | null
  subjects: CustomSubject[]
  /** Id předmětu → témata přidaná školou. */
  topics: Record<string, Topic[]>
}

const KEY = 'zt:school-content'
const empty: SchoolContent = { updated: null, subjects: [], topics: {} }

function load(): SchoolContent {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

let state = load()
const listeners = new Set<() => void>()

function update(next: SchoolContent, touch = true) {
  state = touch ? { ...next, updated: new Date().toISOString() } : next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // úložiště není dostupné
  }
  listeners.forEach((l) => l())
}

export function useSchoolContent(): SchoolContent {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

export const newId = () => 'u-' + Math.random().toString(36).slice(2, 10)

// --- úpravy (učitel) ---

export function saveSubject(subject: CustomSubject) {
  const exists = state.subjects.some((s) => s.id === subject.id)
  update({ ...state, subjects: exists ? state.subjects.map((s) => (s.id === subject.id ? subject : s)) : [...state.subjects, subject] })
}

export function deleteSubject(id: string) {
  const topics = { ...state.topics }
  delete topics[id]
  update({ ...state, subjects: state.subjects.filter((s) => s.id !== id), topics })
}

export function saveTopic(subjectId: string, topic: Topic, previousSubjectId?: string) {
  const topics = { ...state.topics }
  if (previousSubjectId && previousSubjectId !== subjectId) {
    topics[previousSubjectId] = (topics[previousSubjectId] ?? []).filter((t) => t.id !== topic.id)
  }
  const list = topics[subjectId] ?? []
  const clean = { ...topic }
  delete clean.custom
  topics[subjectId] = list.some((t) => t.id === topic.id) ? list.map((t) => (t.id === topic.id ? clean : t)) : [...list, clean]
  update({ ...state, topics })
}

export function deleteTopic(subjectId: string, topicId: string) {
  update({ ...state, topics: { ...state.topics, [subjectId]: (state.topics[subjectId] ?? []).filter((t) => t.id !== topicId) } })
}

export function topicCount(content: SchoolContent): number {
  return Object.values(content.topics).reduce((n, list) => n + list.length, 0)
}

// --- balíček pro žáky ---

const FORMAT = 'zvladni-to-balicek'

interface Pack {
  format: typeof FORMAT
  version: 1
  /** Certifikát školy podepsaný správcem. */
  cert: string
  /** Obsah jako JSON text, aby podpis seděl bajt po bajtu. */
  content: string
  /** Podpis obsahu klíčem školy. */
  sig: string
}

/** Certifikát školy z učitelovy licence (bez soukromého klíče). */
export function signedCertOf(session: Extract<Session, { status: 'active' }>): string {
  const body = session.raw.slice(session.raw.indexOf('-') + 1).split('.')
  return `${body[0]}.${body[1]}`
}

export async function exportPack(session: Extract<Session, { role: 'teacher' }>): Promise<string> {
  const content = JSON.stringify({ ...state, school: session.cert.school })
  const pack: Pack = { format: FORMAT, version: 1, cert: signedCertOf(session), content, sig: await sign(session.schoolKey, content) }
  return JSON.stringify(pack)
}

export type ImportResult =
  | { ok: true; topics: number; subjects: number; renewed: boolean }
  | { ok: false; reason: 'format' | 'school' | 'signature' }

export async function importPack(text: string, session: Extract<Session, { role: 'student' }>): Promise<ImportResult> {
  let pack: Pack
  try {
    pack = JSON.parse(text)
    if (pack.format !== FORMAT || typeof pack.content !== 'string') return { ok: false, reason: 'format' }
  } catch {
    return { ok: false, reason: 'format' }
  }
  const cert = await readCert(pack.cert)
  if (!cert) return { ok: false, reason: 'signature' }
  if (cert.schoolId !== session.cert.schoolId || cert.key !== session.cert.key) return { ok: false, reason: 'school' }
  if (!(await verify(cert.key, pack.content, pack.sig))) return { ok: false, reason: 'signature' }

  const content = JSON.parse(pack.content) as SchoolContent
  update({ updated: content.updated, subjects: content.subjects ?? [], topics: content.topics ?? {} }, false)
  const renewed = await updateCert(pack.cert)
  return { ok: true, topics: topicCount(content), subjects: content.subjects?.length ?? 0, renewed }
}
