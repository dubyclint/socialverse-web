// server/models/chat-message.js - Supabase PostgreSQL Chat Message Model
import { supabase } from '../utils/supabase.js';

export class ChatMessage {
  /**
   * Create a new message
   */
  static async create(messageData) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: messageData.chatId,
          sender_id: messageData.senderId,
          content: messageData.content || null,
          message_type: messageData.messageType || 'text',
          media_url: messageData.mediaUrl || null,
          media_metadata: messageData.mediaMetadata || null,
          reply_to_id: messageData.replyToId || null,
          quoted_message: messageData.quotedMessage || null,
          is_edited: false,
          is_deleted: false,
          gun_id: messageData.gunId || null
        })
        .select(`*,
          sender:sender_id(username, avatar_url),
          reply_to:reply_to_id(id, content, sender:sender_id(username))
        `)
        .single();

      if (error) throw error;

      // Update chat's last message timestamp
      await supabase
        .from('chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', messageData.chatId);

      return data;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  /**
   * Get messages by chat
   */
  static async getByChatId(chatId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id(username, avatar_url),
          reply_to:reply_to_id(id, content, sender:sender_id(username))
        `, { count: 'exact' })
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data.reverse(), count };
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Get message by ID
   */
  static async getById(messageId) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id(username, avatar_url),
          reply_to:reply_to_id(id, content, sender:sender_id(username))
        `)
        .eq('id', messageId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching message:', error);
      throw error;
    }
  }

  /**
   * Update message content
   */
  static async update(messageId, senderId, newContent) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', senderId)
        .select(`
          *,
          sender:sender_id(username, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }

  /**
   * Mark message as delivered
   */
  static async markDelivered(messageId) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking message as delivered:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  static async markRead(messageId) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Mark all messages in chat as read
   */
  static async markChatAsRead(chatId, userId) {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking chat as read:', error);
      throw error;
    }
  }

  /**
   * Delete message (soft delete)
   */
  static async delete(messageId, senderId) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          content: null
        })
        .eq('id', messageId)
        .eq('sender_id', senderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Get message replies
   */
  static async getReplies(messageId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id(username, avatar_url)
        `)
        .eq('reply_to_id', messageId)
        .eq('is_deleted', false)
        .order('created_at')
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching replies:', error);
      throw error;
    }
  }

  /**
   * Search messages in chat
   */
  static async search(chatId, query, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id(username, avatar_url)
        `)
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount(chatId, userId) {
    try {
      const { data, error, count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact' })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  /**
   * Get messages by sender
   */
  static async getBySenderId(senderId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          chat:chat_id(id, name, type)
        `)
        .eq('sender_id', senderId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching sender messages:', error);
      throw error;
    }
  }

  /**
   * Get media messages in chat
   */
  static async getMediaMessages(chatId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id(username, avatar_url)
        `)
        .eq('chat_id', chatId)
        .neq('message_type', 'text')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching media messages:', error);
      throw error;
    }
  }

  /**
   * Get message statistics
   */
  static async getStats(chatId) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('message_type, sender_id');

      if (error) throw error;

      const stats = {
        totalMessages: data.length,
        messagesByType: {},
        messagesBySender: {}
      };

      data.forEach(msg => {
        stats.messagesByType[msg.message_type] = (stats.messagesByType[msg.message_type] || 0) + 1;
        stats.messagesBySender[msg.sender_id] = (stats.messagesBySender[msg.sender_id] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching message stats:', error);
      throw error;
    }
  }
}

