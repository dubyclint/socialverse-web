import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

const privateKey = fs.readFileSync(path.resolve('keys/private.pem'))

const payload = {
  sub: 'user-id-123',
  iss: 'socialverse-web',
  role: 'user',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour
}

const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' })

console.log('✅ JWT:', token)

