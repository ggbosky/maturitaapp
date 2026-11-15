// Vygeneruje nový pár klíčů pro licence.
// Veřejný klíč zapíše do src/license/publicKey.ts (ten se commituje),
// soukromý klíč uloží do license-private-key.txt (ten NIKDY necommituj, je v .gitignore).
// Pozor: po výměně klíčů přestanou platit všechny dříve vydané licence.
import { webcrypto as crypto } from 'node:crypto'
import { writeFileSync } from 'node:fs'

const out = process.argv[2] ?? 'license-private-key.txt'
const b64 = (buf) => Buffer.from(buf).toString('base64')

const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
const pub = b64(await crypto.subtle.exportKey('spki', pair.publicKey))
const priv = 'ZTSK1-' + b64(await crypto.subtle.exportKey('pkcs8', pair.privateKey))

writeFileSync(
  'src/license/publicKey.ts',
  `// Veřejný klíč pro ověřování licencí. Vygenerováno skriptem scripts/license-keygen.mjs.\nexport const PUBLIC_KEY = '${pub}'\n`,
)
writeFileSync(out, priv + '\n', { mode: 0o600 })
console.log(`Veřejný klíč zapsán do src/license/publicKey.ts\nSoukromý klíč uložen do ${out}`)
