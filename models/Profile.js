// models/Profile.js - Enhanced Profile Model with comprehensive bio and privacy
import { supabase } from '../utils/supabase.js';

export class Profile {
  // Get complete profile with privacy settings
  static async getProfile(userId, viewerId = null) {
    const isOwnProfile = userId === viewerId;
    
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
      .single();

    const { data: profile, error } = await query;
    if (error) throw error;

    // If not own profile, filter based on privacy settings
    if (!isOwnProfile && profile.profile_privacy_settings) {
      const privacy = profile.profile_privacy_settings;
      
      return {
        ...profile,
        // Apply privacy filters
        display_name: privacy.display_name_public ? profile.display_name : null,
        bio: privacy.bio_public ? profile.bio : null,
        occupation: privacy.occupation_public ? profile.occupation : null,
        highest_education: privacy.education_public ? profile.highest_education : null,
        school: privacy.school_public ? profile.school : null,
        phone_number: privacy.phone_public ? profile.phone_number : null,
        email: privacy.email_public ? profile.email : null,
        skills: privacy.skills_public ? profile.skills : null,
        interests: privacy.interests_public ? profile.interests : null,
        location: privacy.location_public ? profile.location : null,
        website_url: privacy.website_public ? profile.website_url : null,
        date_of_birth: privacy.date_of_birth_public ? profile.date_of_birth : null,
        gender: privacy.gender_public ? profile.gender : null,
        rank: privacy.rank_hidden ? null : profile.rank,
        // Filter social links
        user_social_links: privacy.social_links_public ? 
          profile.user_social_links.filter(link => link.is_public) : [],
        // Filter verification badges
        user_verification_badges: profile.user_verification_badges.filter(
          badge => badge.is_public && badge.is_active
        )
      };
    }

    return profile;
  }

  // Update profile information
  static async updateProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: profileData.displayName,
        bio: profileData.bio,
        occupation: profileData.occupation,
        highest_education: profileData.highestEducation,
        school: profileData.school,
        phone_number: profileData.phoneNumber,
        skills: profileData.skills,
        interests: profileData.interests,
        location: profileData.location,
        website_url: profileData.websiteUrl,
        date_of_birth: profileData.dateOfBirth,
        gender: profileData.gender,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get user posts with pagination
  static async getUserPosts(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(username, avatar_url, display_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  // Get profile stats
  static async getProfileStats(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('posts_count, followers_count, following_count')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Check if user has premium subscription
  static async isPremiumUser(userId) {
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .select('is_active, plan_type')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    return !error && data;
  }
}
