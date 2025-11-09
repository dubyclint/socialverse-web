// server/models/SocialLinks.js - User Social Media Links Model
import { supabase } from '../utils/supabase.js';

export class SocialLinks {
  // Get user's social links
  static async getUserSocialLinks(userId, includePrivate = false) {
    let query = supabase
      .from('user_social_links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!includePrivate) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Add or update social link
  static async upsertSocialLink(userId, linkData) {
    const { data, error } = await supabase
      .from('user_social_links')
      .upsert([{
        user_id: userId,
        platform: linkData.platform,
        username: linkData.username,
        url: linkData.url,
        is_public: linkData.isPublic !== false, // Default to public
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete social link
  static async deleteSocialLink(userId, platform) {
    const { error } = await supabase
      .from('user_social_links')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) throw error;
    return true;
  }

  // Get supported platforms
  static getSupportedPlatforms() {
    return [
      { key: 'twitter', name: 'Twitter/X', icon: 'twitter', baseUrl: 'https://twitter.com/' },
      { key: 'instagram', name: 'Instagram', icon: 'instagram', baseUrl: 'https://instagram.com/' },
      { key: 'linkedin', name: 'LinkedIn', icon: 'linkedin', baseUrl: 'https://linkedin.com/in/' },
      { key: 'facebook', name: 'Facebook', icon: 'facebook', baseUrl: 'https://facebook.com/' },
      { key: 'github', name: 'GitHub', icon: 'github', baseUrl: 'https://github.com/' },
      { key: 'youtube', name: 'YouTube', icon: 'youtube', baseUrl: 'https://youtube.com/@' },
      { key: 'tiktok', name: 'TikTok', icon: 'tiktok', baseUrl: 'https://tiktok.com/@' },
      { key: 'discord', name: 'Discord', icon: 'discord', baseUrl: '' },
      { key: 'telegram', name: 'Telegram', icon: 'telegram', baseUrl: 'https://t.me/' },
      { key: 'website', name: 'Website', icon: 'globe', baseUrl: '' }
    ];
  }
}

