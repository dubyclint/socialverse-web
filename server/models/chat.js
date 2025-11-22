// server/models/chat.js - Supabase PostgreSQL Chat Model
import { supabase } from '../utils/supabase.js';

export class Chat {
  /**
   * Create a new chat
   */
  static async create(chatData) {
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          type: chatData.type || 'direct',
          name: chatData.name || null,
          description: chatData.description || null,
          avatar: chatData.avatar || null,
          created_by: chatData.createdBy,
          last_message_at: new Date().toISOString(),
          is_active: true,
          settings: {
            allow_invites: chatData.settings?.allowInvites ?? true,
            only_admins_can_message: chatData.settings?.onlyAdminsCanMessage ?? false,
            disappearing_messages: chatData.settings?.disappearingMessages ?? 'off',
            read_receipts: chatData.settings?.readReceipts ?? true
          }
        })
        .select(`
          *,
          creator:created_by(username, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Get chat by ID
   */
  static async getById(chatId) {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          creator:created_by(username, avatar_url),
          participants:chat_participants(count),
          last_message:chat_messages(id, content, created_at, sender:sender_id(username, avatar_url))
        `)
        .eq('id', chatId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching chat:', error);
      throw error;
    }
  }

  /**
   * Get user chats
   */
  static async getUserChats(userId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('chat_participants')
        .select(`
          chat:chat_id(
            *,
            creator:created_by(username, avatar_url),
            last_message:chat_messages(id, content, created_at, sender:sender_id(username))
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('chat.last_message_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Extract chats from participants
      const chats = data.map(p => p.chat).filter(Boolean);
      return { data: chats, count };
    } catch (error) {
      console.error('Error fetching user chats:', error);
      throw error;
    }
  }

  /**
   * Get direct chat between two users
   */
  static async getDirectChat(userId1, userId2) {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          participants:chat_participants(user_id)
        `)
        .eq('type', 'direct')
        .eq('is_active', true);

      if (error) throw error;

      // Find chat with both users
      const directChat = data.find(chat => {
        const userIds = chat.participants.map(p => p.user_id);
        return userIds.includes(userId1) && userIds.includes(userId2);
      });

      return directChat || null;
    } catch (error) {
      console.error('Error fetching direct chat:', error);
      throw error;
    }
  }

  /**
   * Update chat
   */
  static async update(chatId, updateData) {
    try {
      const { data, error } = await supabase
        .from('chats')
        .update({
          name: updateData.name,
          description: updateData.description,
          avatar: updateData.avatar,
          settings: updateData.settings,
          last_message_at: new Date().toISOString()
        })
        .eq('id', chatId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating chat:', error);
      throw error;
    }
  }

  /**
   * Update last message timestamp
   */
  static async updateLastMessage(chatId) {
    try {
      const { data, error } = await supabase
        .from('chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating last message:', error);
      throw error;
    }
  }

  /**
   * Archive chat
   */
  static async archive(chatId) {
    try {
      const { data, error } = await supabase
        .from('chats')
        .update({ is_active: false })
        .eq('id', chatId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error archiving chat:', error);
      throw error;
    }
  }

  /**
   * Delete chat
   */
  static async delete(chatId) {
    try {
      // Delete all messages
      await supabase
        .from('chat_messages')
        .delete()
        .eq('chat_id', chatId);

      // Delete all participants
      await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId);

      // Delete chat
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  /**
   * Search chats
   */
  static async search(userId, query, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          chat:chat_id(
            *,
            creator:created_by(username, avatar_url)
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      // Filter chats by name or description
      const chats = data
        .map(p => p.chat)
        .filter(chat => 
          chat.name?.toLowerCase().includes(query.toLowerCase()) ||
          chat.description?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);

      return chats;
    } catch (error) {
      console.error('Error searching chats:', error);
      throw error;
    }
  }

  /**
   * Get chat statistics
   */
  static async getStats(chatId) {
    try {
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('chat_id', chatId);

      const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('chat_id', chatId)
        .eq('is_active', true);

      if (messagesError || participantsError) throw messagesError || participantsError;

      return {
        totalMessages: messages?.length || 0,
        totalParticipants: participants?.length || 0
      };
    } catch (error) {
      console.error('Error fetching chat stats:', error);
      throw error;
    }
  }
}
