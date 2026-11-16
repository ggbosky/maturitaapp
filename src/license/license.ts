// Licence bez serveru, ve dvou úrovních.
//
// 1. Správce vydá ŠKOLE licenci (certifikát) podepsanou svým soukromým klíčem. Licence je vázaná
//    na zařízení učitele, platí do konce další maturity a nese veřejný klíč školy. Soukromý klíč
//    školy je přiložený k licenci, aby jím učitel mohl vydávat klíče žákům.
// 2. Učitel vydá ŽÁKOVI klíč podepsaný klíčem školy a vázaný na žákovo zařízení. Žákův klíč
//    obsahuje i certifikát školy, takže aplikace ověří celý řetězec jen s veřejným klíčem správce.
//
// Platnost žáků se řídí platností školy. Po prodloužení školní licence dostanou žáci nový
// certifikát v balíčku od učitele (viz schoolPack.ts), klíče se jim měnit nemusí.
//
// Je to ochrana na straně klienta: brání běžnému sdílení klíčů, ale technicky zdatný
// uživatel ji obejít umí. Neobejitelná kontrola by vyžadovala server.
import { useSyncExternalStore } from 'react'
import { PUBLIC_KEY } from './publicKey'
import { decodeJson, encodeJson, generateKeyPair, sign, verify } from './crypto'

export type Role = 'teacher' | 'student'

/** Certifikát školy, podepsaný správcem. */
export interface SchoolCert {
  schoolId: string
  school: string
  /** Kód zařízení učitele. */
  device: string
  /** Poslední den platnosti (RRRR-MM-DD). */
  expires: string
  issued: string
  /** Kolik žákovských klíčů smí škola vydat. */
  seats: number
  /** Veřejný klíč školy (SPKI, base64url). */
  key: string
}

export interface StudentInfo {
  schoolId: string
  name: string
  device: string
  issued: string
}

export type Session =
  | { status: 'checking' }
  | { status: 'none'; reason?: 'expired' | 'invalid'; school?: string }
  | { status: 'active'; role: 'teacher'; cert: SchoolCert; schoolKey: string; raw: string }
  | { status: 'active'; role: 'student'; cert: SchoolCert; student: StudentInfo; raw: string }

export type CheckResult =
  | { ok: true; session: Extract<Session, { status: 'active' }> }
  | { ok: false; reason: 'format' | 'signature' | 'device' | 'expired' | 'role' | 'unsupported'; cert?: SchoolCert }

const SCHOOL_PREFIX = 'ZTS2-'
const STUDENT_PREFIX = 'ZTZ2-'
const ADMIN_PREFIX = 'ZTSK1-'
// Bez znaků, které se pletou (I, L, O, U).
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

// --- kód zařízení a data ---

export function randomDeviceCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => ALPHABET[b % 32]).join('')
}

/** Kód tohoto zařízení. Vznikne při prvním spuštění a zůstává uložený v zařízení. */
export function getDeviceCode(): string {
  try {
    const saved = localStorage.getItem('zt:device')
    if (saved && cleanCode(saved).length === 12) return cleanCode(saved)
    const code = randomDeviceCode()
    localStorage.setItem('zt:device', code)
    return code
  } catch {
    return randomDeviceCode()
  }
}

/** Sjednotí ručně opsaný kód: velká písmena, bez pomlček a mezer, zaměnitelné znaky. */
export function cleanCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')
    .replace(/[^0-9A-Z]/g, '')
}

export function formatCode(code: string): string {
  return code.match(/.{1,4}/g)?.join('-') ?? code
}

export function todayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Konec platnosti „do další maturity“: 30. června letošního roku, po něm příštího roku. */
export function nextMaturityExpiry(today = new Date()): string {
  const year = today.getMonth() > 5 ? today.getFullYear() + 1 : today.getFullYear()
  return `${year}-06-30`
}

/** Počet dní do konce platnosti (0 = poslední den). */
export function daysLeft(expires: string, today = todayKey()): number {
  return Math.round((Date.parse(`${expires}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
}

export const formatDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('cs-CZ')

// --- certifikát školy ---

function packCert(c: SchoolCert): string {
  return encodeJson({ s: c.schoolId, n: c.school, d: c.device, e: c.expires, i: c.issued, m: c.seats, k: c.key })
}

function unpackCert(b64: string): SchoolCert | null {
  try {
    const p = decodeJson(b64)
    if (typeof p.s !== 'string' || typeof p.n !== 'string' || typeof p.d !== 'string' || typeof p.e !== 'string' || typeof p.k !== 'string') return null
    return { schoolId: p.s, school: p.n, device: p.d, expires: p.e, issued: p.i ?? '', seats: Number(p.m) || 0, key: p.k }
  } catch {
    return null
  }
}

/** Ověří certifikát školy podpisem správce. Formát: „<certifikát>.<podpis>“. */
export async function readCert(signedCert: string, publicKey = PUBLIC_KEY): Promise<SchoolCert | null> {
  const [payload, sig, extra] = signedCert.split('.')
  if (!payload || !sig || extra !== undefined) return null
  if (!(await verify(publicKey, payload, sig))) return null
  return unpackCert(payload)
}

// --- vydání (správce a učitel) ---

function adminSecret(privateKey: string): string {
  const secret = privateKey.replace(/\s+/g, '')
  if (!secret.startsWith(ADMIN_PREFIX)) throw new Error('Soukromý klíč má začínat „ZTSK1-“.')
  // Starší klíče byly v base64 se znaky + a /; dekodér zvládne obojí.
  return secret.slice(ADMIN_PREFIX.length)
}

export function newSchoolId(): string {
  return 'S' + randomDeviceCode().slice(0, 8)
}

/**
 * Vydá licenci škole. Bez `schoolKey` vytvoří nový pár klíčů školy;
 * při prodloužení se předává stávající pár, aby dál platily klíče žáků.
 */
export async function issueSchoolLicense(
  cert: Omit<SchoolCert, 'key'>,
  adminPrivateKey: string,
  schoolKey?: { publicKey: string; privateKey: string },
): Promise<string> {
  const keys = schoolKey ?? (await generateKeyPair())
  const payload = packCert({ ...cert, device: cleanCode(cert.device), key: keys.publicKey })
  const sig = await sign(adminSecret(adminPrivateKey), payload)
  return `${SCHOOL_PREFIX}${payload}.${sig}.${keys.privateKey}`
}

/** Rozloží licenci školy (pro prodloužení ve správě licencí). Ověřuje podpis správce. */
export async function parseSchoolLicense(
  text: string,
  publicKey = PUBLIC_KEY,
): Promise<{ cert: SchoolCert; signedCert: string; privateKey: string } | null> {
  const t = text.replace(/\s+/g, '')
  if (!t.startsWith(SCHOOL_PREFIX)) return null
  const [payload, sig, priv, extra] = t.slice(SCHOOL_PREFIX.length).split('.')
  if (!payload || !sig || !priv || extra !== undefined) return null
  const cert = await readCert(`${payload}.${sig}`, publicKey)
  return cert ? { cert, signedCert: `${payload}.${sig}`, privateKey: priv } : null
}

/** Učitel vydá klíč žákovi. */
export async function issueStudentKey(
  signedCert: string,
  schoolPrivateKey: string,
  student: { name: string; device: string; issued?: string },
  schoolId: string,
): Promise<string> {
  const payload = encodeJson({ s: schoolId, n: student.name, d: cleanCode(student.device), i: student.issued ?? todayKey() })
  const sig = await sign(schoolPrivateKey, payload)
  return `${STUDENT_PREFIX}${signedCert}.${payload}.${sig}`
}

// --- ověření při přihlášení ---

interface CheckOptions {
  role?: Role
  today?: string
  publicKey?: string
  /** Novější certifikát školy (z balíčku od učitele), pokud ho žák má. */
  newerCert?: string
}

export async function checkKey(text: string, device: string, opts: CheckOptions = {}): Promise<CheckResult> {
  if (!globalThis.crypto?.subtle) return { ok: false, reason: 'unsupported' }
  const raw = text.replace(/\s+/g, '')
  const today = opts.today ?? todayKey()
  const me = cleanCode(device)

  if (raw.startsWith(SCHOOL_PREFIX)) {
    const parsed = await parseSchoolLicense(raw, opts.publicKey)
    if (!parsed) return { ok: false, reason: 'signature' }
    const { cert, privateKey } = parsed
    if (opts.role && opts.role !== 'teacher') return { ok: false, reason: 'role', cert }
    if (cert.device !== me) return { ok: false, reason: 'device', cert }
    if (cert.expires < today) return { ok: false, reason: 'expired', cert }
    return { ok: true, session: { status: 'active', role: 'teacher', cert, schoolKey: privateKey, raw } }
  }

  if (raw.startsWith(STUDENT_PREFIX)) {
    const [certPayload, certSig, payload, sig, extra] = raw.slice(STUDENT_PREFIX.length).split('.')
    if (!certPayload || !certSig || !payload || !sig || extra !== undefined) return { ok: false, reason: 'format' }
    let cert = await readCert(`${certPayload}.${certSig}`, opts.publicKey)
    if (!cert || !(await verify(cert.key, payload, sig))) return { ok: false, reason: 'signature' }
    let student: StudentInfo
    try {
      const p = decodeJson(payload)
      student = { schoolId: p.s, name: p.n, device: p.d, issued: p.i ?? '' }
    } catch {
      return { ok: false, reason: 'signature' }
    }
    if (student.schoolId !== cert.schoolId) return { ok: false, reason: 'signature' }
    // Novější certifikát téže školy (stejný klíč) prodlužuje platnost.
    if (opts.newerCert) {
      const newer = await readCert(opts.newerCert, opts.publicKey)
      if (newer && newer.schoolId === cert.schoolId && newer.key === cert.key && newer.expires > cert.expires) cert = newer
    }
    if (opts.role && opts.role !== 'student') return { ok: false, reason: 'role', cert }
    if (student.device !== me) return { ok: false, reason: 'device', cert }
    if (cert.expires < today) return { ok: false, reason: 'expired', cert }
    return { ok: true, session: { status: 'active', role: 'student', cert, student, raw } }
  }

  return { ok: false, reason: 'format' }
}

// --- stav přihlášení v aplikaci ---

const KEY = 'zt:license'
const CERT_KEY = 'zt:school-cert'
let session: Session = { status: 'checking' }
const listeners = new Set<() => void>()

function set(next: Session) {
  session = next
  listeners.forEach((l) => l())
}

function read(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // bez úložiště platí přihlášení jen do zavření aplikace
  }
}

async function restore() {
  const saved = read(KEY)
  if (!saved) return set({ status: 'none' })
  const result = await checkKey(saved, getDeviceCode(), { newerCert: read(CERT_KEY) })
  if (result.ok) set(result.session)
  else set({ status: 'none', reason: result.reason === 'expired' ? 'expired' : 'invalid', school: result.cert?.school })
}

let started = false

export function useSession(): Session {
  if (!started) {
    started = true
    void restore()
  }
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => session,
  )
}

export function currentSession(): Session {
  return session
}

export async function activate(text: string, role: Role): Promise<CheckResult> {
  const result = await checkKey(text, getDeviceCode(), { role, newerCert: read(CERT_KEY) })
  if (result.ok) {
    write(KEY, result.session.raw)
    set(result.session)
  }
  return result
}

/** Uloží novější certifikát školy (z balíčku od učitele) a znovu ověří přihlášení. */
export async function updateCert(signedCert: string): Promise<boolean> {
  const s = session
  if (s.status !== 'active' || s.role !== 'student') return false
  const result = await checkKey(s.raw, getDeviceCode(), { newerCert: signedCert })
  if (!result.ok || result.session.cert.expires <= s.cert.expires) return false
  write(CERT_KEY, signedCert)
  set(result.session)
  return true
}

export function signOut() {
  write(KEY, null)
  set({ status: 'none' })
}

export const roleLabel: Record<Role, string> = { teacher: 'Učitel', student: 'Žák' }
