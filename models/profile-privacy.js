// models/ProfilePrivacy.js - Profile Privacy Settings Model
import { supabase } from '../utils/supabase.js'

export class ProfilePrivacy {
  // Get privacy settings
  static async getPrivacySettings(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('privacy_settings')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data.privacy_settings || {}
  }

  // Update privacy settings
  static async updatePrivacySettings(userId, settings) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ privacy_settings: settings })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Check if field is visible to viewer
  static isFieldVisible(profile, fieldName, viewerId) {
    if (profile.id === viewerId) return true // Own profile

    const privacy = profile.privacy_settings || {}
    const fieldVisibilityKey = `${fieldName}_visibility`

    return privacy[fieldVisibilityKey] !== 'private'
  }

  // Get filtered profile based on privacy settings
  static filterProfileByPrivacy(profile, viewerId) {
    if (profile.id === viewerId) return profile

    const filtered = { ...profile }
    const privacy = profile.privacy_settings || {}

    if (privacy.profile_visibility === 'private') {
      return null // Profile is completely private
    }

    if (privacy.bio_visibility === 'private') {
      filtered.bio = ''
    }

    if (privacy.location_visibility === 'private') {
      filtered.location = ''
    }

    if (privacy.contact_visibility === 'private') {
      filtered.phone = ''
      filtered.email = ''
    }

    return filtered
  }
}
