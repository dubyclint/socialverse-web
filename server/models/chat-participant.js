// server/models/chat-participant.js - Supabase PostgreSQL Chat Participant Model
import { supabase } from '../utils/supabase.js';

export class ChatParticipant {
  /**
   * Add participant to chat
   */
  static async create(participantData) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: participantData.chatId,
          user_id: participantData.userId,
          role: participantData.role || 'member',
          joined_at: new Date().toISOString(),
          last_read_at: new Date().toISOString(),
          is_active: true,
          is_muted: false,
          muted_until: null,
          custom_name: participantData.customName || null
        })
        .select(`
          *,
          user:user_id(username, avatar_url),
          chat:chat_id(id, name, type)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }

  /**
   * Get chat participants
   */
  static async getByChatId(chatId, limit = 100, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('chat_participants')
        .select(`
          *,
          user:user_id(username, avatar_url, is_verified)
        `, { count: 'exact' })
        .eq('chat_id', chatId)
        .eq('is_active', true)
        .order('joined_at')
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching chat participants:', error);
      throw error;
    }
  }

  /**
   * Get user's chats
   */
  static async getUserChats(userId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('chat_participants')
        .select(`
          *,
          chat:chat_id(
            *,
            creator:created_by(username, avatar_url)
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_read_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const chats = data.map(p => p.chat).filter(Boolean);
      return { data: chats, count };
    } catch (error) {
      console.error('Error fetching user chats:', error);
      throw error;
    }
  }

  /**
   * Get participant by ID
   */
  static async getById(participantId) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          *,
          user:user_id(username, avatar_url),
          chat:chat_id(id, name, type)
        `)
        .eq('id', participantId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching participant:', error);
      throw error;
    }
  }

  /**
   * Check if user is participant
   */
  static async isParticipant(chatId, userId) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking participant:', error);
      throw error;
    }
  }

  /**
   * Update participant role
   */
  static async updateRole(participantId, newRole) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .update({ role: newRole })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating participant role:', error);
      throw error;
    }
  }

  /**
   * Update last read timestamp
   */
  static async updateLastRead(participantId) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating last read:', error);
      throw error;
    }
  }

  /**
   * Mute participant notifications
   */
  static async mute(participantId, muteUntil = null) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .update({
          is_muted: true,
          muted_until: muteUntil || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error muting participant:', error);
      throw error;
    }
  }

  /**
   * Unmute participant notifications
   */
  static async unmute(participantId) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .update({
          is_muted: false,
          muted_until: null
        })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error unmuting participant:', error);
      throw error;
    }
  }

  /**
   * Set custom name for chat
   */
  static async setCustomName(participantId, customName) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .update({ custom_name: customName })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting custom name:', error);
      throw error;
    }
  }

  /**
   * Remove participant from chat
   */
  static async remove(participantId) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .update({ is_active: false })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }

  /**
   * Get chat admins
   */
  static async getAdmins(chatId) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          *,
          user:user_id(username, avatar_url)
        `)
        .eq('chat_id', chatId)
        .in('role', ['admin', 'owner'])
        .eq('is_active', true);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }
  }

  /**
   * Get chat owner
   */
  static async getOwner(chatId) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          *,
          user:user_id(username, avatar_url)
        `)
        .eq('chat_id', chatId)
        .eq('role', 'owner')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching owner:', error);
      throw error;
    }
  }

  /**
   * Get participant statistics
   */
  static async getStats(chatId) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select('role, is_muted');

      if (error) throw error;

      const stats = {
        totalParticipants: data.length,
        activeParticipants: data.filter(p => p.is_active).length,
        admins: data.filter(p => p.role === 'admin').length,
        owners: data.filter(p => p.role === 'owner').length,
        mutedParticipants: data.filter(p => p.is_muted).length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching participant stats:', error);
      throw error;
    }
  }

  /**
   * Bulk add participants
   */
  static async bulkCreate(chatId, userIds, role = 'member') {
    try {
      const participants = userIds.map(userId => ({
        chat_id: chatId,
        user_id: userId,
        role: role,
        joined_at: new Date().toISOString(),
        last_read_at: new Date().toISOString(),
        is_active: true,
        is_muted: false
      }));

      const { data, error } = await supabase
        .from('chat_participants')
        .insert(participants)
        .select(`
          *,
          user:user_id(username, avatar_url)
        `);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error bulk adding participants:', error);
      throw error;
    }
  }
}
