import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import type { Request, Response, NextFunction } from 'express'

// Extend Express Request to include `user` (minimal, permissive)
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

const publicKey = fs.readFileSync(path.resolve('keys/public.pem'))

export function verifyJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' })

  const token = (authHeader.split(' ')[1] as string | undefined)

  if (!token) return res.status(401).json({ error: 'Malformed Authorization header' })

  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] })
    req.user = decoded
    return next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

