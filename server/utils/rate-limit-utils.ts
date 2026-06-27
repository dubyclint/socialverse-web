// server/utils/rate-limit-utils.ts
import { supabase } from './auth-utils'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (event: any) => {
    const userId = event.node.req.headers['x-user-id'] || 'anonymous'
    const key = `${userId}:${event.node.req.url}`
    
    const now = Date.now()
    const record = rateLimitStore.get(key)
    
    if (record && now < record.resetTime) {
      if (record.count >= maxRequests) {
        throw createError({
          statusCode: 429,
          statusMessage: 'Too many requests. Please try again later.'
        })
      }
      record.count++
    } else {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
    }
  }
}

export const checkRateLimit = async (userId: string, action: string, limit: number, windowMs: number) => {
  const key = `${userId}:${action}`
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (record && now < record.resetTime) {
    return record.count < limit
  }
  
  return true
}
