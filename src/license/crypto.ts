// Nízkoúrovňové pomocníky pro podepisování (ECDSA P-256 přes Web Crypto).

export const ALGO = { name: 'ECDSA', namedCurve: 'P-256' }
const SIGN = { name: 'ECDSA', hash: 'SHA-256' }

export function toB64Url(bytes: Uint8Array): string {
  let s = ''
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromB64(text: string): Uint8Array<ArrayBuffer> {
  const s = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

export const encodeJson = (value: unknown) => toB64Url(new TextEncoder().encode(JSON.stringify(value)))
export const decodeJson = (b64: string) => JSON.parse(new TextDecoder().decode(fromB64(b64)))

export async function sign(privatePkcs8: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('pkcs8', fromB64(privatePkcs8), ALGO, false, ['sign'])
  return toB64Url(new Uint8Array(await crypto.subtle.sign(SIGN, key, new TextEncoder().encode(data))))
}

export async function verify(publicSpki: string, data: string, signature: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey('spki', fromB64(publicSpki), ALGO, false, ['verify'])
    return await crypto.subtle.verify(SIGN, key, fromB64(signature), new TextEncoder().encode(data))
  } catch {
    return false
  }
}

export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const pair = await crypto.subtle.generateKey(ALGO, true, ['sign', 'verify'])
  return {
    publicKey: toB64Url(new Uint8Array(await crypto.subtle.exportKey('spki', pair.publicKey))),
    privateKey: toB64Url(new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey))),
  }
}
