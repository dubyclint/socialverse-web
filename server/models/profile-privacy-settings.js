// server/models/profile-privacy-settings.js - Profile Privacy Settings Model
import { supabase } from '../utils/supabase.js';

export class ProfilePrivacySettings {
  
  /**
   * Get user's privacy settings
   */
  static async getSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('profile_privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no settings exist, create default ones
      if (!data) {
        return await this.createDefaultSettings(userId);
      }

      return data;
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      throw error;
    }
  }

  /**
   * Create default privacy settings
   */
  static async createDefaultSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('profile_privacy_settings')
        .insert({
          user_id: userId,
          show_profile_views: true,
          show_viewer_list: true,
          show_analytics: true,
          anonymous_viewing_enabled: false,
          block_anonymous_views: false,
          view_notification_enabled: true,
          analytics_retention_days: 365
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating default privacy settings:', error);
      throw error;
    }
  }

  /**
   * Update privacy settings
   */
  static async updateSettings(userId, settings) {
    try {
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
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  /**
   * Check if user allows profile views
   */
  static async allowsProfileViews(userId) {
    try {
      const settings = await this.getSettings(userId);
      return settings.show_profile_views;
    } catch (error) {
      console.error('Error checking profile views permission:', error);
      return true; // Default to allowing views
    }
  }

  /**
   * Check if user allows viewer list
   */
  static async allowsViewerList(userId) {
    try {
      const settings = await this.getSettings(userId);
      return settings.show_viewer_list;
    } catch (error) {
      console.error('Error checking viewer list permission:', error);
      return true; // Default to allowing viewer list
    }
  }

  /**
   * Check if user allows analytics
   */
  static async allowsAnalytics(userId) {
    try {
      const settings = await this.getSettings(userId);
      return settings.show_analytics;
    } catch (error) {
      console.error('Error checking analytics permission:', error);
      return true; // Default to allowing analytics
    }
  }

  /**
   * Check if anonymous viewing is enabled
   */
  static async allowsAnonymousViewing(userId) {
    try {
      const settings = await this.getSettings(userId);
      return settings.anonymous_viewing_enabled;
    } catch (error) {
      console.error('Error checking anonymous viewing permission:', error);
      return false; // Default to not allowing anonymous viewing
    }
  }

  /**
   * Check if anonymous views are blocked
   */
  static async blocksAnonymousViews(userId) {
    try {
      const settings = await this.getSettings(userId);
      return settings.block_anonymous_views;
    } catch (error) {
      console.error('Error checking anonymous view blocking:', error);
      return false; // Default to not blocking anonymous views
    }
  }

  /**
   * Get analytics retention period
   */
  static async getRetentionPeriod(userId) {
    try {
      const settings = await this.getSettings(userId);
      return settings.analytics_retention_days || 365;
    } catch (error) {
      console.error('Error getting retention period:', error);
      return 365; // Default to 1 year
    }
  }

  /**
   * Toggle specific privacy setting
   */
  static async toggleSetting(userId, settingName) {
    try {
      const currentSettings = await this.getSettings(userId);
      const newValue = !currentSettings[settingName];
      
      return await this.updateSettings(userId, {
        [settingName]: newValue
      });
    } catch (error) {
      console.error('Error toggling privacy setting:', error);
      throw error;
    }
  }

  /**
   * Get privacy settings summary
   */
  static async getSettingsSummary(userId) {
    try {
      const settings = await this.getSettings(userId);
      
      return {
        privacy_level: this.calculatePrivacyLevel(settings),
        settings_count: Object.keys(settings).length,
        last_updated: settings.updated_at,
        retention_days: settings.analytics_retention_days,
        notifications_enabled: settings.view_notification_enabled,
        public_analytics: settings.show_analytics,
        anonymous_protection: settings.block_anonymous_views
      };
    } catch (error) {
      console.error('Error getting settings summary:', error);
      throw error;
    }
  }

  /**
   * Calculate privacy level
   */
  static calculatePrivacyLevel(settings) {
    let privacyScore = 0;
    
    if (!settings.show_profile_views) privacyScore += 20;
    if (!settings.show_viewer_list) privacyScore += 20;
    if (!settings.show_analytics) privacyScore += 20;
    if (settings.block_anonymous_views) privacyScore += 20;
    if (!settings.anonymous_viewing_enabled) privacyScore += 10;
    if (!settings.view_notification_enabled) privacyScore += 10;

    if (privacyScore >= 80) return 'HIGH';
    if (privacyScore >= 50) return 'MEDIUM';
    if (privacyScore >= 20) return 'LOW';
    return 'PUBLIC';
  }

  /**
   * Export privacy settings
   */
  static async exportSettings(userId) {
    try {
      const settings = await this.getSettings(userId);
      
      return {
        user_id: userId,
        exported_at: new Date().toISOString(),
        privacy_settings: settings,
        privacy_level: this.calculatePrivacyLevel(settings)
      };
    } catch (error) {
      console.error('Error exporting privacy settings:', error);
      throw error;
    }
  }

  /**
   * Import privacy settings
   */
  static async importSettings(userId, importedSettings) {
    try {
      // Validate imported settings
      const validSettings = this.validateSettings(importedSettings);
      
      return await this.updateSettings(userId, validSettings);
    } catch (error) {
      console.error('Error importing privacy settings:', error);
      throw error;
    }
  }

  /**
   * Validate settings object
   */
  static validateSettings(settings) {
    const validKeys = [
      'show_profile_views',
      'show_viewer_list', 
      'show_analytics',
      'anonymous_viewing_enabled',
      'block_anonymous_views',
      'view_notification_enabled',
      'analytics_retention_days'
    ];

    const validatedSettings = {};
    
    validKeys.forEach(key => {
      if (settings.hasOwnProperty(key)) {
        if (key === 'analytics_retention_days') {
          const days = parseInt(settings[key]);
          validatedSettings[key] = days >= 1 && days <= 3650 ? days : 365;
        } else {
          validatedSettings[key] = Boolean(settings[key]);
        }
      }
    });

    return validatedSettings;
  }
}
