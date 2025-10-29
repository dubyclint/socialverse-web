// models/Profile.js - Enhanced Profile Model with comprehensive bio and privacy
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
        display_name: privacy.show_name ? profile.display_name : 'Anonymous',
        bio: privacy.show_bio ? profile.bio : '',
        location: privacy.show_location ? profile.location : '',
        social_links: privacy.show_social_links ? profile.user_social_links : [],
        verification_badges: privacy.show_badges ? profile.user_verification_badges : []
      }
    }

    return profile
  }

  // Update profile
  static async updateProfile(userId, updates) {
    // Validate username if being updated
    if (updates.username) {
      const validation = await this.validateUsername(updates.username, userId)
      if (!validation.valid) {
        throw new Error(validation.error)
      }
      updates.username = validation.username
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
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Invalid username' }
    }

    const trimmed = username.trim().toLowerCase()

    // Length validation
    if (trimmed.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters' }
    }

    if (trimmed.length > 30) {
      return { valid: false, error: 'Username must be less than 30 characters' }
    }

    // Format validation
    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(trimmed)) {
      return { 
        valid: false, 
        error: 'Username can only contain letters, numbers, underscores, and hyphens' 
      }
    }

    // Reserved usernames
    const reservedUsernames = [
      'admin',
      'root',
      'system',
      'support',
      'help',
      'api',
      'www',
      'mail',
      'ftp',
      'localhost',
      'test',
      'demo',
      'guest',
      'socialverse',
      'app',
      'web'
    ]

    if (reservedUsernames.includes(trimmed)) {
      return { valid: false, error: 'This username is reserved' }
    }

    // Check database for duplicates
    try {
      let query = supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('username', trimmed)

      // If updating existing user, exclude their own ID
      if (excludeUserId) {
        query = query.neq('id', excludeUserId)
      }

      const { data, error, count } = await query

      if (error) {
        return { valid: false, error: 'Database error checking username' }
      }

      if (count !== null && count > 0) {
        return { valid: false, error: 'Username already taken' }
      }

      return { valid: true, username: trimmed }
    } catch (err) {
      console.error('Error validating username:', err)
      return { valid: false, error: 'Error validating username' }
    }
  }

  // Check if username is available
  static async isUsernameAvailable(username, excludeUserId = null) {
    const validation = await this.validateUsername(username, excludeUserId)
    return validation.valid
  }

  // Create new profile
  static async createProfile(userId, profileData) {
    // Validate username
    const usernameValidation = await this.validateUsername(profileData.username)
    if (!usernameValidation.valid) {
      throw new Error(usernameValidation.error)
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: usernameValidation.username,
        email: profileData.email?.toLowerCase().trim(),
        full_name: profileData.fullName,
        phone_number: profileData.phone,
        bio: profileData.bio || '',
        location: profileData.location || '',
        avatar_url: null,
        role: 'user',
        status: 'active',
        is_verified: false,
        rank: 'bronze',
        rank_points: 0,
        email_verified: false,
        preferences: {
          location: profileData.location || '',
          emailNotifications: true,
          profilePrivate: false
        },
        metadata: {}
      })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error('Username already taken')
      }
      throw error
    }

    return data
  }

  // Get profile by username
  static async getProfileByUsername(username) {
    const trimmed = username.trim().toLowerCase()

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', trimmed)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }

    return data
  }

  // Search profiles by username
  static async searchProfiles(query, limit = 10) {
    if (!query || query.length < 2) {
      return []
    }

    const searchTerm = query.trim().toLowerCase()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .ilike('username', `%${searchTerm}%`)
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // Update username
  static async updateUsername(userId, newUsername) {
    // Validate new username
    const validation = await this.validateUsername(newUsername, userId)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ username: validation.username })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error('Username already taken')
      }
      throw error
    }

    return data
  }

  // Delete profile
  static async deleteProfile(userId) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) throw error
    return true
  }

  // Get profile statistics
  static async getProfileStats(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        rank,
        rank_points,
        is_verified,
        created_at,
        posts(count),
        followers(count),
        following(count)
      `)
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  // Batch validate usernames
  static async validateUsernamesBatch(usernames) {
    const results = {}

    for (const username of usernames) {
      results[username] = await this.validateUsername(username)
    }

    return results
  }

  // Get available username suggestions
  static async getSuggestedUsernames(baseUsername) {
    const trimmed = baseUsername.trim().toLowerCase()
    const suggestions = []

    // Generate variations
    const variations = [
      trimmed,
      `${trimmed}_`,
      `${trimmed}1`,
      `${trimmed}_1`,
      `${trimmed}_official`,
      `${trimmed}_real`,
      `real_${trimmed}`,
      `official_${trimmed}`
    ]

    for (const variation of variations) {
      const validation = await this.validateUsername(variation)
      if (validation.valid) {
        suggestions.push(variation)
      }
    }

    return suggestions
  }

  // Check username history (for audit purposes)
  static async getUsernameHistory(userId) {
    const { data, error } = await supabase
      .from('username_history')
      .select('*')
      .eq('user_id', userId)
      .order('changed_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}
