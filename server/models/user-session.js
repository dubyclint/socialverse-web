// server/models/user-session.js - User Session Management Model
import { supabase } from '../utils/supabase.js';
import crypto from 'crypto';

export class UserSession {
  // Create new session
  static async createSession(userId, deviceInfo = {}) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const { data, error } = await supabase
      .from('user_sessions')
      .insert([{
        user_id: userId,
        session_token: sessionToken,
        device_info: deviceInfo,
        ip_address: deviceInfo.ipAddress,
        user_agent: deviceInfo.userAgent,
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get user sessions
  static async getUserSessions(userId) {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_activity', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Update session activity
  static async updateSessionActivity(sessionToken) {
    const { data, error } = await supabase
      .from('user_sessions')
      .update({
        last_activity: new Date().toISOString()
      })
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Logout specific session
  static async logoutSession(sessionToken) {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        is_active: false
      })
      .eq('session_token', sessionToken);

    if (error) throw error;
    return true;
  }

  // Logout all sessions for user
  static async logoutAllSessions(userId, exceptToken = null) {
    let query = supabase
      .from('user_sessions')
      .update({
        is_active: false
      })
      .eq('user_id', userId);

    if (exceptToken) {
      query = query.neq('session_token', exceptToken);
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  }

  // Validate session
  static async validateSession(sessionToken) {
    const { data, error } = await supabase
      .from('user_sessions')
      .select(`
        *,
        profiles:user_id(*)
      `)
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) return null;
    
    // Update last activity
    await this.updateSessionActivity(sessionToken);
    
    return data;
  }

  // Cleanup expired sessions
  static async cleanupExpiredSessions() {
    const { error } = await supabase
      .from('user_sessions')
      .update({
        is_active: false
      })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true);

    if (error) throw error;
    return true;
  }
}
