import { describe, expect, it } from 'vitest'
import { webcrypto } from 'node:crypto'
import { checkKey, cleanCode, daysLeft, formatCode, issueSchoolLicense, issueStudentKey, nextMaturityExpiry, parseSchoolLicense } from './license'

async function adminKeys() {
  const pair = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const b64 = (b: ArrayBuffer) => Buffer.from(b).toString('base64')
  return {
    publicKey: b64(await webcrypto.subtle.exportKey('spki', pair.publicKey)),
    privateKey: 'ZTSK1-' + b64(await webcrypto.subtle.exportKey('pkcs8', pair.privateKey)),
  }
}

const TEACHER = 'TTTT1111TTTT'
const PUPIL = 'PPPP2222PPPP'
const base = { schoolId: 'SABC12345', school: 'Gymnázium Test', device: TEACHER, expires: '2027-06-30', issued: '2026-11-16', seats: 2 }

async function setup() {
  const admin = await adminKeys()
  const schoolLicense = await issueSchoolLicense(base, admin.privateKey)
  const parsed = (await parseSchoolLicense(schoolLicense, admin.publicKey))!
  const studentKey = await issueStudentKey(parsed.signedCert, parsed.privateKey, { name: 'Jana', device: PUPIL }, base.schoolId)
  return { admin, schoolLicense, parsed, studentKey }
}

describe('licence školy', () => {
  it('učitel se přihlásí jen na svém zařízení a jen jako učitel', async () => {
    const { admin, schoolLicense } = await setup()
    const opts = { publicKey: admin.publicKey, today: '2026-12-01' }
    expect(await checkKey(schoolLicense, 'tttt-1111-tttt', opts)).toMatchObject({ ok: true, session: { role: 'teacher', cert: { school: 'Gymnázium Test' } } })
    expect(await checkKey(schoolLicense, PUPIL, opts)).toMatchObject({ reason: 'device' })
    expect(await checkKey(schoolLicense, TEACHER, { ...opts, role: 'student' })).toMatchObject({ reason: 'role' })
    expect(await checkKey(schoolLicense, TEACHER, { ...opts, today: '2027-07-01' })).toMatchObject({ reason: 'expired' })
  })

  it('žákův klíč platí jen na jeho zařízení a do konce licence školy', async () => {
    const { admin, studentKey } = await setup()
    const opts = { publicKey: admin.publicKey, today: '2026-12-01' }
    expect(await checkKey(studentKey, PUPIL, opts)).toMatchObject({ ok: true, session: { role: 'student', student: { name: 'Jana' } } })
    expect(await checkKey(studentKey, TEACHER, opts)).toMatchObject({ reason: 'device' })
    expect(await checkKey(studentKey, PUPIL, { ...opts, today: '2027-07-01' })).toMatchObject({ reason: 'expired' })
  })

  it('prodloužená licence školy prodlouží i žáky', async () => {
    const { admin, parsed, studentKey } = await setup()
    const renewed = await issueSchoolLicense({ ...base, expires: '2028-06-30' }, admin.privateKey, {
      publicKey: parsed.cert.key,
      privateKey: parsed.privateKey,
    })
    const newer = (await parseSchoolLicense(renewed, admin.publicKey))!.signedCert
    expect(await checkKey(studentKey, PUPIL, { publicKey: admin.publicKey, today: '2027-09-01', newerCert: newer })).toMatchObject({ ok: true })
  })

  it('odmítne cizí školu, podvržený podpis a nesmysl', async () => {
    const { admin, parsed, studentKey } = await setup()
    const other = await setup()
    // Žákovský klíč podepsaný klíčem jiné školy, ale s certifikátem první školy.
    const forged = await issueStudentKey(parsed.signedCert, other.parsed.privateKey, { name: 'X', device: PUPIL }, base.schoolId)
    expect(await checkKey(forged, PUPIL, { publicKey: admin.publicKey })).toMatchObject({ reason: 'signature' })
    expect(await checkKey(studentKey, PUPIL, { publicKey: other.admin.publicKey })).toMatchObject({ reason: 'signature' })
    expect(await checkKey('nesmysl', PUPIL, { publicKey: admin.publicKey })).toMatchObject({ reason: 'format' })
  })
})

describe('pomocné funkce', () => {
  it('platnost do další maturity', () => {
    expect(nextMaturityExpiry(new Date(2026, 10, 16))).toBe('2027-06-30')
    expect(nextMaturityExpiry(new Date(2027, 4, 10))).toBe('2027-06-30')
    expect(nextMaturityExpiry(new Date(2027, 6, 1))).toBe('2028-06-30')
    expect(daysLeft('2027-06-30', '2027-06-20')).toBe(10)
  })
  it('sjednotí ručně opsaný kód zařízení', () => {
    expect(cleanCode('abcd-12o4 efgl')).toBe('ABCD1204EFG1')
    expect(formatCode('ABCD1234EFGH')).toBe('ABCD-1234-EFGH')
  })
})
