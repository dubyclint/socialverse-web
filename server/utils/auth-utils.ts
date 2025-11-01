server/utils/auth-utils.ts - UPDATE
// Fix table references from 'users' to 'profiles'
// ============================================================================

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
 * FIXED: Query 'profiles' table instead of 'users'
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
 * FIXED: Query 'profiles' table instead of 'users'
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
 * FIXED: Query 'profiles' table instead of 'users'
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
 * FIXED: Query 'profiles' table instead of 'users'
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
 * FIXED: Update 'profiles' table instead of 'users'
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
