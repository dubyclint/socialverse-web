// server/models/Profile.js - Enhanced Profile Model with comprehensive bio and privacy
import { supabase } from '../utils/supabase.js'

export class Profile {
  // Get complete profile with privacy settings
  static async getProfile(userId, viewerId = null) {
    const isOwnProfile = userId === viewerId
    
    let query = supabase
      .from('profiles')
      .select(`
        *,
        profile_privacy_settings(*),
        user_social_links(*),
        user_verification_badges(
          badge_type,
          badge_level,
          is_active,
          is_public,
          granted_at,
          expires_at
        )
      `)
      .eq('id', userId)
      .single()

    const { data: profile, error } = await query
    if (error) throw error

    // If not own profile, filter based on privacy settings
    if (!isOwnProfile && profile.profile_privacy_settings) {
      const privacy = profile.profile_privacy_settings
      
      return {
        ...profile,
        // Apply privacy filters
        display_name: privacy.show_name ? profile.full_name : 'Anonymous',
        bio: privacy.show_bio ? profile.bio : '',
        location: privacy.show_location ? profile.location : '',
        occupation: privacy.show_occupation ? profile.occupation : '',
        social_links: privacy.show_social_links ? profile.user_social_links : [],
        verification_badges: privacy.show_badges ? profile.user_verification_badges : [],
        email: privacy.show_email ? profile.email : '',
        phone: privacy.show_phone ? profile.phone : '',
        website: privacy.show_website ? profile.website : ''
      }
    }

    return profile
  }

  // Update profile - COMPLETE VERSION WITH ALL FIELDS
  static async updateProfile(userId, updates) {
    // Validate username if being updated
    if (updates.username) {
      const validation = await this.validateUsername(updates.username, userId)
      if (!validation.valid) {
        throw new Error(validation.error)
      }
      updates.username = validation.username
    }

    // Ensure arrays are properly formatted
    if (updates.skills && !Array.isArray(updates.skills)) {
      updates.skills = typeof updates.skills === 'string' ? JSON.parse(updates.skills) : []
    }
    if (updates.interests && !Array.isArray(updates.interests)) {
      updates.interests = typeof updates.interests === 'string' ? JSON.parse(updates.interests) : []
    }

    // Ensure social_links is an object
    if (updates.social_links && typeof updates.social_links !== 'object') {
      updates.social_links = typeof updates.social_links === 'string' ? JSON.parse(updates.social_links) : {}
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Validate username - comprehensive validation
  static async validateUsername(username, excludeUserId = null) {
    // Username rules: 3-30 chars, alphanumeric + underscore, starts with letter
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/
    
    if (!usernameRegex.test(username)) {
      return {
        valid: false,
        error: 'Username must be 3-30 characters, start with a letter, and contain only letters, numbers, and underscores'
      }
    }

    // Check if username is already taken
    let query = supabase
      .from('profiles')
      .select('id')
      .eq('username_lower', username.toLowerCase())

    if (excludeUserId) {
      query = query.neq('id', excludeUserId)
    }

    const { data, error } = await query.limit(1)
    
    if (error) throw error
    
    if (data && data.length > 0) {
      return {
        valid: false,
        error: 'Username is already taken'
      }
    }

    return {
      valid: true,
      username: username.toLowerCase()
    }
  }

  // Get profile by username
  static async getProfileByUsername(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username_lower', username.toLowerCase())
      .single()

    if (error) throw error
    return data
  }

  // Search profiles
  static async searchProfiles(query, limit = 10) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, bio, status')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .eq('status', 'active')
      .limit(limit)

    if (error) throw error
    return data
  }

  // Get user stats
  static async getUserStats(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (error) throw error

    // Get followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    // Get following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    // Get posts count
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return {
      followers: followersCount || 0,
      following: followingCount || 0,
      posts: postsCount || 0
    }
  }

  // Update last login
  static async updateLastLogin(userId) {
    const { error } = await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error
  }

  // Get profile completion percentage
  static async getProfileCompletionPercentage(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, bio, avatar_url, phone, location, occupation, website, date_of_birth, gender, skills, interests')
      .eq('id', userId)
      .single()

    if (error) throw error

    const fields = [
      data.full_name,
      data.bio,
      data.avatar_url,
      data.phone,
      data.location,
      data.occupation,
      data.website,
      data.date_of_birth,
      data.gender,
      data.skills && data.skills.length > 0,
      data.interests && data.interests.length > 0
    ]

    const filledFields = fields.filter(field => field).length
    const totalFields = fields.length

    return Math.round((filledFields / totalFields) * 100)
  }
}
