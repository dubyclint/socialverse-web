// models/userSettings.js - Supabase PostgreSQL User Settings Model
import { supabase } from '../utils/supabase.js';

export class UserSettings {
  static async getSettings(userId) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    // Return default settings if none exist
    if (!data) {
      return this.createDefaultSettings(userId);
    }
    
    return data;
  }

  static async createDefaultSettings(userId) {
    const { data, error } = await supabase
      .from('user_settings')
      .insert([{
        user_id: userId,
        theme: 'light',
        language: 'en',
        email_notifications: true,
        push_notifications: true,
        trading_notifications: true,
        marketing_emails: false,
        privacy_level: 'public',
        two_factor_enabled: false,
        show_online_status: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSettings(userId, settingsData) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...settingsData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTheme(userId, theme) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({ theme })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateLanguage(userId, language) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({ language })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateNotificationSettings(userId, notificationSettings) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        email_notifications: notificationSettings.email,
        push_notifications: notificationSettings.push,
        trading_notifications: notificationSettings.trading,
        marketing_emails: notificationSettings.marketing
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePrivacySettings(userId, privacySettings) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        privacy_level: privacySettings.level,
        show_online_status: privacySettings.showOnlineStatus
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async enableTwoFactor(userId) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({ two_factor_enabled: true })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async disableTwoFactor(userId) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({ two_factor_enabled: false })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTimezone(userId, timezone) {
    const { data, error } = await supabase
      .from('user_settings')
      .update({ timezone })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSettings(userId) {
    const { error } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  static async exportSettings(userId) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    
    // Remove internal fields
    const { id, user_id, created_at, updated_at, ...exportData } = data;
    return exportData;
  }

  static async importSettings(userId, settingsData) {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert([{
        user_id: userId,
        ...settingsData,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
