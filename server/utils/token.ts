import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRY = '7d'

/**
 * Generate JWT token for authenticated user
 */
export const generateJWT = (payload: {
  userId: string
  email: string
  username: string
  role: string
}) => {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
      algorithm: 'HS256'
    })
    return token
  } catch (error) {
    console.error('[Token] JWT generation error:', error)
    throw error
  }
}

/**
 * Verify JWT token
 */
export const verifyJWT = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    })
    return decoded
  } catch (error) {
    console.error('[Token] JWT verification error:', error)
    throw error
  }
}

/**
 * Generate email verification token (24 hour expiry)
 */
export const generateEmailVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  
  return {
    token,
    expiresAt
  }
}

/**
 * Generate password reset token (1 hour expiry)
 */
export const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  
  return {
    token,
    expiresAt
  }
}

/**
 * Check if token is expired
 */
export const isTokenExpired = (expiresAt: Date | string) => {
  const expiry = new Date(expiresAt)
  return new Date() > expiry
}
