// server/utils/auth-utils.ts - COMPREHENSIVE VERSION WITH ALL OPERATIONS & REQUIREMANAGER
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ CRITICAL ERROR: Supabase credentials not configured!')
  console.error('Missing environment variables:')
  if (!supabaseUrl) console.error('  - SUPABASE_URL')
  if (!supabaseKey) console.error('  - SUPABASE_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// ============ RATE LIMITING ============

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

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
          statusMessage: 'Too many requests'
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

// ============ AUTHENTICATION ============

export const authenticateUser = async (email: string, password: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', email)
      .single()

    if (error || !profile) {
      throw new Error('User not found')
    }

    return profile
  } catch (error) {
    console.error('[Auth] Authentication error:', error)
    throw error
  }
}

export const getUserProfile = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      throw new Error('Profile not found')
    }

    return profile
  } catch (error) {
    console.error('[Auth] Get profile error:', error)
    throw error
  }
}

export const emailExists = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .single()

    return !!data && !error
  } catch (error) {
    return false
  }
}

export const usernameExists = async (username: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .single()

    return !!data && !error
  } catch (error) {
    return false
  }
}

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[Auth] Update profile error:', error)
    throw error
  }
}

// ============ JWT ============

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export const generateToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256'
  })
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    })
  } catch (error) {
    console.error('[Auth] Token verification error:', error)
    throw error
  }
}

// ============ ADMIN UTILITIES ============

export const requireAdmin = async (event: any) => {
  try {
    const user = await requireAuth(event)
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Admin access required'
      })
    }

    return user
  } catch (error) {
    console.error('[Admin] Authorization error:', error)
    throw error
  }
}

export const requireManager = async (event: any) => {
  try {
    const user = await requireAuth(event)
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'manager' && profile?.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Manager access required'
      })
    }

    return user
  } catch (error) {
    console.error('[Manager] Authorization error:', error)
    throw error
  }
}

export const logAdminAction = async (adminId: string, action: string, details: any) => {
  try {
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminId,
        action,
        details,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('[Admin] Log error:', error)
    }
  } catch (error) {
    console.error('[Admin] Logging error:', error)
  }
}

export const validateBody = (body: any, requiredFields: string[]) => {
  for (const field of requiredFields) {
    if (!body[field]) {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required field: ${field}`
      })
    }
  }
}

export const handleError = (error: any) => {
  console.error('[Error]', error)
  
  if (error.statusCode) {
    return error
  }

  return createError({
    statusCode: 500,
    statusMessage: error.message || 'Internal server error'
  })
}

// ============ PREMIUM OPERATIONS ============

export const premiumOperations = {
  getPricingTiers: async () => {
    try {
      const { data: tiers, error } = await supabase
        .from('premium_tiers')
        .select('*')
        .order('price', { ascending: true })

      if (error) throw error
      return tiers || []
    } catch (error) {
      console.error('[Premium] Get pricing tiers error:', error)
      throw error
    }
  },

  getUserSubscription: async (userId: string) => {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return subscription || null
    } catch (error) {
      console.error('[Premium] Get subscription error:', error)
      throw error
    }
  },

  checkFeatureAccess: async (userId: string, featureKey: string) => {
    try {
      const subscription = await premiumOperations.getUserSubscription(userId)
      
      if (!subscription) {
        return false
      }

      const { data: tier, error } = await supabase
        .from('premium_tiers')
        .select('features')
        .eq('id', subscription.tier_id)
        .single()

      if (error) throw error
      
      const features = tier?.features || []
      return features.includes(featureKey)
    } catch (error) {
      console.error('[Premium] Check feature access error:', error)
      throw error
    }
  }
}

// ============ STATUS OPERATIONS ============

export const statusOperations = {
  createStatus: async (userId: string, data: any) => {
    try {
      const { data: status, error } = await supabase
        .from('statuses')
        .insert({
          user_id: userId,
          content: data.content,
          files: data.files || [],
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return status
    } catch (error) {
      console.error('[Status] Create status error:', error)
      throw error
    }
  },

  deleteStatus: async (statusId: string) => {
    try {
      const { error } = await supabase
        .from('statuses')
        .delete()
        .eq('id', statusId)

      if (error) throw error
      return { success: true, message: 'Status deleted successfully' }
    } catch (error) {
      console.error('[Status] Delete status error:', error)
      throw error
    }
  },

  getUserStatuses: async (userId: string) => {
    try {
      const { data: statuses, error } = await supabase
        .from('statuses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return statuses || []
    } catch (error) {
      console.error('[Status] Get user statuses error:', error)
      throw error
    }
  }
}

// ============ STREAM OPERATIONS ============

export const streamOperations = {
  getStream: async (streamId: string) => {
    try {
      const { data: stream, error } = await supabase
        .from('streams')
        .select('*')
        .eq('id', streamId)
        .single()

      if (error) throw error
      return stream
    } catch (error) {
      console.error('[Stream] Get stream error:', error)
      throw error
    }
  },

  createStream: async (userId: string, data: any) => {
    try {
      const { data: stream, error } = await supabase
        .from('streams')
        .insert({
          user_id: userId,
          title: data.title,
          description: data.description,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return stream
    } catch (error) {
      console.error('[Stream] Create stream error:', error)
      throw error
    }
  },

  updateStream: async (streamId: string, data: any) => {
    try {
      const { data: stream, error } = await supabase
        .from('streams')
        .update(data)
        .eq('id', streamId)
        .select()
        .single()

      if (error) throw error
      return stream
    } catch (error) {
      console.error('[Stream] Update stream error:', error)
      throw error
    }
  },

  deleteStream: async (streamId: string) => {
    try {
      const { error } = await supabase
        .from('streams')
        .delete()
        .eq('id', streamId)

      if (error) throw error
      return { success: true, message: 'Stream deleted successfully' }
    } catch (error) {
      console.error('[Stream] Delete stream error:', error)
      throw error
    }
  },

  getUserStreams: async (userId: string) => {
    try {
      const { data: streams, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return streams || []
    } catch (error) {
      console.error('[Stream] Get user streams error:', error)
      throw error
    }
  }
}

// ============ WALLET OPERATIONS ============

export const walletOperations = {
  lockWallet: async (userId: string, data: any) => {
    try {
      const { data: lock, error } = await supabase
        .from('wallet_locks')
        .insert({
          user_id: userId,
          amount: data.amount,
          reason: data.reason || null,
          locked_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return lock
    } catch (error) {
      console.error('[Wallet] Lock wallet error:', error)
      throw error
    }
  },

  unlockWallet: async (lockId: string) => {
    try {
      const { error } = await supabase
        .from('wallet_locks')
        .update({ unlocked_at: new Date().toISOString() })
        .eq('id', lockId)

      if (error) throw error
      return { success: true, message: 'Wallet unlocked successfully' }
    } catch (error) {
      console.error('[Wallet] Unlock wallet error:', error)
      throw error
    }
  },

  getWalletLocks: async (userId: string) => {
    try {
      const { data: locks, error } = await supabase
        .from('wallet_locks')
        .select('*')
        .eq('user_id', userId)
        .order('locked_at', { ascending: false })

      if (error) throw error
      return locks || []
    } catch (error) {
      console.error('[Wallet] Get wallet locks error:', error)
      throw error
    }
  }
}
