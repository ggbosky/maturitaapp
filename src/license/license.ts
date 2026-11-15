// Licence bez serveru.
//
// Každé zařízení si vygeneruje vlastní kód. Správce k němu vydá klíč podepsaný soukromým
// klíčem (ECDSA P-256); aplikace podpis ověří veřejným klíčem. Kód zařízení je součástí
// podepsaných dat, takže klíč vydaný pro jedno zařízení na jiném neprojde.
//
// Je to ochrana na straně klienta: brání běžnému sdílení klíčů, ale technicky zdatný
// uživatel ji obejít umí. Neobejitelná kontrola by vyžadovala server.
import { useSyncExternalStore } from 'react'
import { PUBLIC_KEY } from './publicKey'

export type Role = 'student' | 'skola'

export interface License {
  role: Role
  /** Jméno studenta nebo název školy. */
  name: string
  /** Kód zařízení, pro které klíč platí (12 znaků bez pomlček). */
  device: string
  /** Poslední den platnosti (RRRR-MM-DD), nebo null pro neomezenou licenci. */
  expires: string | null
  issued: string
}

export type CheckResult =
  | { ok: true; license: License }
  | { ok: false; reason: 'format' | 'signature' | 'device' | 'expired' | 'role' | 'unsupported'; license?: License }

const PREFIX = 'ZT1-'
const SECRET_PREFIX = 'ZTSK1-'
const ALGO = { name: 'ECDSA', namedCurve: 'P-256' }
const SIGN = { name: 'ECDSA', hash: 'SHA-256' }
// Bez znaků, které se pletou (I, L, O, U).
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

// --- kódování ---

function toB64Url(bytes: Uint8Array): string {
  let s = ''
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64(text: string): Uint8Array<ArrayBuffer> {
  const s = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

// --- kód zařízení ---

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

// --- vydání a ověření klíče ---

/** Vydá licenční klíč. Používá jen správce; soukromý klíč se nikam neodesílá. */
export async function signLicense(license: License, privateKey: string): Promise<string> {
  const secret = privateKey.replace(/\s+/g, '')
  if (!secret.startsWith(SECRET_PREFIX)) throw new Error('Soukromý klíč má začínat „ZTSK1-“.')
  const key = await crypto.subtle.importKey('pkcs8', fromB64(secret.slice(SECRET_PREFIX.length)), ALGO, false, ['sign'])
  const payload = new TextEncoder().encode(
    JSON.stringify({ r: license.role, n: license.name, d: license.device, e: license.expires, i: license.issued }),
  )
  const signature = new Uint8Array(await crypto.subtle.sign(SIGN, key, payload))
  return `${PREFIX}${toB64Url(payload)}.${toB64Url(signature)}`
}

/** Ověří podpis a vrátí obsah licence. Zařízení ani platnost nekontroluje. */
export async function readKey(licenseKey: string, publicKey = PUBLIC_KEY): Promise<License | null> {
  const text = licenseKey.replace(/\s+/g, '')
  if (!text.startsWith(PREFIX)) return null
  const [payloadPart, sigPart, extra] = text.slice(PREFIX.length).split('.')
  if (!payloadPart || !sigPart || extra !== undefined) return null
  try {
    const payload = fromB64(payloadPart)
    const key = await crypto.subtle.importKey('spki', fromB64(publicKey), ALGO, false, ['verify'])
    if (!(await crypto.subtle.verify(SIGN, key, fromB64(sigPart), payload))) return null
    const p = JSON.parse(new TextDecoder().decode(payload))
    if ((p.r !== 'student' && p.r !== 'skola') || typeof p.n !== 'string' || typeof p.d !== 'string') return null
    return { role: p.r, name: p.n, device: p.d, expires: p.e ?? null, issued: p.i ?? '' }
  } catch {
    return null
  }
}

/** Úplná kontrola: podpis, zařízení, platnost a volitelně typ účtu. */
export async function checkKey(
  licenseKey: string,
  device: string,
  opts: { role?: Role; today?: string; publicKey?: string } = {},
): Promise<CheckResult> {
  if (!globalThis.crypto?.subtle) return { ok: false, reason: 'unsupported' }
  if (!licenseKey.replace(/\s+/g, '').startsWith(PREFIX)) return { ok: false, reason: 'format' }
  const license = await readKey(licenseKey, opts.publicKey)
  if (!license) return { ok: false, reason: 'signature' }
  if (license.device !== cleanCode(device)) return { ok: false, reason: 'device', license }
  if (license.expires && license.expires < (opts.today ?? todayKey())) return { ok: false, reason: 'expired', license }
  if (opts.role && opts.role !== license.role) return { ok: false, reason: 'role', license }
  return { ok: true, license }
}

// --- stav přihlášení v aplikaci ---

export type Session =
  | { status: 'checking' }
  | { status: 'none'; reason?: 'expired' | 'invalid' }
  | { status: 'active'; license: License }

const KEY = 'zt:license'
let session: Session = { status: 'checking' }
const listeners = new Set<() => void>()

function set(next: Session) {
  session = next
  listeners.forEach((l) => l())
}

async function restore() {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(KEY)
  } catch {
    // bez úložiště se licence nezapamatuje
  }
  if (!saved) return set({ status: 'none' })
  const result = await checkKey(saved, getDeviceCode())
  if (result.ok) set({ status: 'active', license: result.license })
  else set({ status: 'none', reason: result.reason === 'expired' ? 'expired' : 'invalid' })
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

export async function activate(licenseKey: string, role: Role): Promise<CheckResult> {
  const result = await checkKey(licenseKey, getDeviceCode(), { role })
  if (result.ok) {
    try {
      localStorage.setItem(KEY, licenseKey.replace(/\s+/g, ''))
    } catch {
      // licence platí jen do zavření aplikace
    }
    set({ status: 'active', license: result.license })
  }
  return result
}

export function signOut() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nic k odstranění
  }
  set({ status: 'none' })
}

export const roleLabel: Record<Role, string> = { student: 'Student', skola: 'Škola' }
