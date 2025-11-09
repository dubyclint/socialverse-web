// server/models/user-settings.js - Enhanced User Settings with Categories
import { supabase } from '../utils/supabase.js';

export class UserSettings {
  // Get all user settings
  static async getAllSettings(userId) {
    const { data, error } = await supabase
      .from('user_settings_categories')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      return this.createDefaultSettings(userId);
    }
    
    return data;
  }

  // Create default settings for new user
  static async createDefaultSettings(userId) {
    const { data, error } = await supabase
      .from('user_settings_categories')
      .insert([{
        user_id: userId
        // All other fields will use their default values from the schema
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update specific settings category
  static async updateSettings(userId, category, settings) {
    const updateData = {};
    
    // Map category settings to database columns
    switch (category) {
      case 'profile':
        updateData.profile_theme = settings.theme;
        updateData.profile_language = settings.language;
        updateData.profile_timezone = settings.timezone;
        break;
      case 'chat':
        updateData.chat_notifications = settings.notifications;
        updateData.chat_sound_enabled = settings.soundEnabled;
        updateData.chat_read_receipts = settings.readReceipts;
        updateData.chat_online_status = settings.onlineStatus;
        updateData.group_message_notifications = settings.groupNotifications;
        break;
      case 'post':
        updateData.post_privacy_default = settings.privacyDefault;
        updateData.post_comments_enabled = settings.commentsEnabled;
        updateData.post_likes_visible = settings.likesVisible;
        updateData.post_share_enabled = settings.shareEnabled;
        break;
      case 'wallet':
        updateData.wallet_notifications = settings.notifications;
        updateData.wallet_transaction_alerts = settings.transactionAlerts;
        updateData.pew_notifications = settings.pewNotifications;
        updateData.escrow_notifications = settings.escrowNotifications;
        updateData.p2p_notifications = settings.p2pNotifications;
        break;
      case 'ad':
        updateData.ad_personalization = settings.personalization;
        updateData.ad_frequency = settings.frequency;
        updateData.ad_categories_blocked = settings.blockedCategories;
        break;
      case 'rank':
        updateData.rank_display_enabled = settings.displayEnabled;
        updateData.rank_progress_public = settings.progressPublic;
        break;
      case 'universe':
        updateData.universe_notifications = settings.notifications;
        updateData.universe_auto_join = settings.autoJoin;
        break;
      case 'general':
        updateData.email_notifications = settings.emailNotifications;
        updateData.push_notifications = settings.pushNotifications;
        updateData.marketing_emails = settings.marketingEmails;
        updateData.two_factor_enabled = settings.twoFactorEnabled;
        break;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('user_settings_categories')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get settings by category
  static async getSettingsByCategory(userId, category) {
    const allSettings = await this.getAllSettings(userId);
    
    switch (category) {
      case 'profile':
        return {
          theme: allSettings.profile_theme,
          language: allSettings.profile_language,
          timezone: allSettings.profile_timezone
        };
      case 'chat':
        return {
          notifications: allSettings.chat_notifications,
          soundEnabled: allSettings.chat_sound_enabled,
          readReceipts: allSettings.chat_read_receipts,
          onlineStatus: allSettings.chat_online_status,
          groupNotifications: allSettings.group_message_notifications
        };
      case 'post':
        return {
          privacyDefault: allSettings.post_privacy_default,
          commentsEnabled: allSettings.post_comments_enabled,
          likesVisible: allSettings.post_likes_visible,
          shareEnabled: allSettings.post_share_enabled
        };
      case 'wallet':
        return {
          notifications: allSettings.wallet_notifications,
          transactionAlerts: allSettings.wallet_transaction_alerts,
          pewNotifications: allSettings.pew_notifications,
          escrowNotifications: allSettings.escrow_notifications,
          p2pNotifications: allSettings.p2p_notifications
        };
      case 'ad':
        return {
          personalization: allSettings.ad_personalization,
          frequency: allSettings.ad_frequency,
          blockedCategories: allSettings.ad_categories_blocked
        };
      case 'rank':
        return {
          displayEnabled: allSettings.rank_display_enabled,
          progressPublic: allSettings.rank_progress_public
        };
      case 'universe':
        return {
          notifications: allSettings.universe_notifications,
          autoJoin: allSettings.universe_auto_join
        };
      case 'general':
        return {
          emailNotifications: allSettings.email_notifications,
          pushNotifications: allSettings.push_notifications,
          marketingEmails: allSettings.marketing_emails,
          twoFactorEnabled: allSettings.two_factor_enabled
        };
      default:
        return allSettings;
    }
  }
}
