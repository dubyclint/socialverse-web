import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { Request, Response, NextFunction } from 'express'

const publicKey = fs.readFileSync(path.resolve('keys/public.pem'))

export function verifyJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' })

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] })
    req.user = decoded
    next()
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' })
  }
}

