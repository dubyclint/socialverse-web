// server/utils/auth-utils.ts - CORRECTED VERSION (NO DUPLICATES)
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

// ============ AUTHENTICATION ============

/**
 * Authenticate user by email and password
 */
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

/**
 * Get user profile by ID
 */
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

/**
 * Check if email exists
 */
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

/**
 * Check if username exists
 */
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

/**
 * Update user profile
 */
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

/**
 * Generate JWT token
 */
export const generateToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256'
  })
}

/**
 * Verify JWT token
 */
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

/**
 * Require admin authentication
 */
export const requireAdmin = async (event: any) => {
  try {
    const user = await requireAuth(event)
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // Check if user is admin
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

/**
 * Log admin actions
 */
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

/**
 * Validate request body
 */
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

/**
 * Handle errors
 */
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

/**
 * Premium subscription and feature management
 */
export const premiumOperations = {
  /**
   * Get all available pricing tiers
   */
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

  /**
   * Get user's current subscription
   */
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

  /**
   * Check if user has access to a specific feature
   */
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
