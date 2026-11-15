import { describe, expect, it } from 'vitest'
import { webcrypto } from 'node:crypto'
import { checkKey, cleanCode, formatCode, signLicense, type License } from './license'

async function keyPair() {
  const pair = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const b64 = (b: ArrayBuffer) => Buffer.from(b).toString('base64')
  return {
    publicKey: b64(await webcrypto.subtle.exportKey('spki', pair.publicKey)),
    privateKey: 'ZTSK1-' + b64(await webcrypto.subtle.exportKey('pkcs8', pair.privateKey)),
  }
}

const license: License = { role: 'student', name: 'Jana Nováková', device: 'ABCD1234EFGH', expires: '2027-06-30', issued: '2026-11-15' }

describe('licence', () => {
  it('platný klíč projde jen na zařízení, pro které byl vydán', async () => {
    const { publicKey, privateKey } = await keyPair()
    const key = await signLicense(license, privateKey)
    const opts = { publicKey, today: '2026-12-01' }

    expect(await checkKey(key, 'abcd-1234-efgh', opts)).toEqual({ ok: true, license })
    expect((await checkKey(key, 'ZZZZ1234EFGH', opts)).ok).toBe(false)
    expect(await checkKey(key, 'ZZZZ1234EFGH', opts)).toMatchObject({ reason: 'device' })
  })

  it('odmítne prošlý klíč, špatný typ účtu a cizí podpis', async () => {
    const { publicKey, privateKey } = await keyPair()
    const other = await keyPair()
    const key = await signLicense(license, privateKey)

    expect(await checkKey(key, license.device, { publicKey, today: '2027-06-30' })).toMatchObject({ ok: true })
    expect(await checkKey(key, license.device, { publicKey, today: '2027-07-01' })).toMatchObject({ reason: 'expired' })
    expect(await checkKey(key, license.device, { publicKey, today: '2026-12-01', role: 'skola' })).toMatchObject({ reason: 'role' })
    expect(await checkKey(key, license.device, { publicKey: other.publicKey })).toMatchObject({ reason: 'signature' })
  })

  it('odmítne pozměněný klíč', async () => {
    const { publicKey, privateKey } = await keyPair()
    const key = await signLicense(license, privateKey)
    const forged = await signLicense({ ...license, expires: null }, (await keyPair()).privateKey)
    // Cizí obsah s původním podpisem.
    const mixed = forged.split('.')[0] + '.' + key.split('.')[1]
    expect(await checkKey(mixed, license.device, { publicKey })).toMatchObject({ reason: 'signature' })
    expect(await checkKey('nesmysl', license.device, { publicKey })).toMatchObject({ reason: 'format' })
  })

  it('sjednotí ručně opsaný kód zařízení', () => {
    expect(cleanCode('abcd-12o4 efgl')).toBe('ABCD1204EFG1')
    expect(formatCode('ABCD1234EFGH')).toBe('ABCD-1234-EFGH')
  })
})
