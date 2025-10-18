// models/ProfilePrivacy.js - Profile Privacy Settings Model
import { supabase } from '../utils/supabase.js';

export class ProfilePrivacy {
  // Get privacy settings for user
  static async getPrivacySettings(userId) {
    const { data, error } = await supabase
      .from('profile_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    // Return default settings if none exist
    if (!data) {
      return this.createDefaultPrivacySettings(userId);
    }
    
    return data;
  }

  // Create default privacy settings
  static async createDefaultPrivacySettings(userId) {
    const { data, error } = await supabase
      .from('profile_privacy_settings')
      .insert([{
        user_id: userId,
        display_name_public: true,
        bio_public: true,
        occupation_public: true,
        education_public: true,
        school_public: true,
        phone_public: false, // Private by default
        email_public: false, // Private by default
        skills_public: true,
        interests_public: true,
        location_public: true,
        website_public: true,
        date_of_birth_public: false,
        gender_public: true,
        social_links_public: true,
        rank_hidden: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update privacy settings
  static async updatePrivacySettings(userId, settings) {
    const { data, error } = await supabase
      .from('profile_privacy_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Check if field is public for user
  static async isFieldPublic(userId, fieldName) {
    const { data, error } = await supabase
      .from('profile_privacy_settings')
      .select(`${fieldName}_public`)
      .eq('user_id', userId)
      .single();

    if (error) return true; // Default to public if no settings
    return data[`${fieldName}_public`];
  }
}
