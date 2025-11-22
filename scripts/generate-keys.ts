import { generateKeyPairSync } from 'crypto'
import fs from 'fs'
import path from 'path'

const keyDir = path.resolve('keys')
if (!fs.existsSync(keyDir)) fs.mkdirSync(keyDir)

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
})

fs.writeFileSync(path.join(keyDir, 'private.pem'), privateKey)
fs.writeFileSync(path.join(keyDir, 'public.pem'), publicKey)

console.log('✅ RSA keys generated and saved to /keys')
