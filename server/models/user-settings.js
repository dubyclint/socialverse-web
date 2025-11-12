// server/models/user-settings.js - Enhanced User Settings with Categories
import { supabase } from '../utils/supabase.js';

export class usersettings {
  // Get all user settings
  static async getAllsettings(userId) {
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
  static async createDefaultsettings(userId) {
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
  static async updatesettings(userId, category, settings) {
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
  static async getsettingsByCategory(userId, category) {
    const allSettings = await this.getAllsettings(userId);
    
    switch (category) {
      case 'profile':
        return {
          theme: allsettings.profile_theme,
          language: allsettings.profile_language,
          timezone: allsettings.profile_timezone
        };
      case 'chat':
        return {
          notifications: allsettings.chat_notifications,
          soundEnabled: allsettings.chat_sound_enabled,
          readReceipts: allsettings.chat_read_receipts,
          onlineStatus: allsettings.chat_online_status,
          groupNotifications: allsettings.group_message_notifications
        };
      case 'post':
        return {
          privacyDefault: allsettings.post_privacy_default,
          commentsEnabled: allsettings.post_comments_enabled,
          likesVisible: allSettings.post_likes_visible,
          shareEnabled: allSettings.post_share_enabled
        };
      case 'wallet':
        return {
          notifications: allsettings.wallet_notifications,
          transactionAlerts: allsettings.wallet_transaction_alerts,
          pewNotifications: allsettings.pew_notifications,
          escrowNotifications: allsettings.escrow_notifications,
          p2pNotifications: allsettings.p2p_notifications
        };
      case 'ad':
        return {
          personalization: allsettings.ad_personalization,
          frequency: allsettings.ad_frequency,
          blockedCategories: allsettings.ad_categories_blocked
        };
      case 'rank':
        return {
          displayEnabled: allsettings.rank_display_enabled,
          progressPublic: allsettings.rank_progress_public
        };
      case 'universe':
        return {
          notifications: allsettings.universe_notifications,
          autoJoin: allsettings.universe_auto_join
        };
      case 'general':
        return {
          emailNotifications: allsettings.email_notifications,
          pushNotifications: allsettings.push_notifications,
          marketingEmails: allsettings.marketing_emails,
          twoFactorEnabled: allsettings.two_factor_enabled
        };
      default:
        return allsettings;
    }
  }
}
