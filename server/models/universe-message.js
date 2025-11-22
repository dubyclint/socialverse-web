// server/models/universe-message.js - Supabase PostgreSQL Universe Message Model
import { supabase } from '../utils/supabase.js';

export class UniverseMessage {
  static async create(messageData) {
    const { data, error } = await supabase
      .from('universe_messages')
      .insert([{
        user_id: messageData.userId,
        channel_type: messageData.channelType,
        channel_id: messageData.channelId,
        message: messageData.message,
        media_urls: messageData.mediaUrls || [],
        mentions: messageData.mentions || [],
        reply_to: messageData.replyTo
      }])
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified),
        reply_to_message:reply_to(id, message, profiles:user_id(username))
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getChannelMessages(channelType, channelId, limit = 50, before = null) {
    let query = supabase
      .from('universe_messages')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified),
        reply_to_message:reply_to(id, message, profiles:user_id(username))
      `)
      .eq('channel_type', channelType)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.reverse(); // Return in chronological order
  }

  static async getCountryChannels() {
    const { data, error } = await supabase
      .from('universe_messages')
      .select('channel_id, count(*)')
      .eq('channel_type', 'country')
      .group('channel_id')
      .order('count', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getInterestChannels() {
    const { data, error } = await supabase
      .from('universe_messages')
      .select('channel_id, count(*)')
      .eq('channel_type', 'interest')
      .group('channel_id')
      .order('count', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async pinMessage(messageId, userId) {
    // Only admins/moderators should be able to pin messages
    const { data, error } = await supabase
      .from('universe_messages')
      .update({ is_pinned: true })
      .eq('id', messageId)
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async unpinMessage(messageId, userId) {
    const { data, error } = await supabase
      .from('universe_messages')
      .update({ is_pinned: false })
      .eq('id', messageId)
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getPinnedMessages(channelType, channelId) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .eq('channel_type', channelType)
      .eq('channel_id', channelId)
      .eq('is_pinned', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async addReaction(messageId, userId, emoji) {
    // Get current reactions
    const { data: message } = await supabase
      .from('universe_messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    const reactions = message.reactions || {};
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    // Add user to reaction if not already there
    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId);
    }

    const { data, error } = await supabase
      .from('universe_messages')
      .update({ reactions })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeReaction(messageId, userId, emoji) {
    // Get current reactions
    const { data: message } = await supabase
      .from('universe_messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    const reactions = message.reactions || {};
    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter(id => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    }

    const { data, error } = await supabase
      .from('universe_messages')
      .update({ reactions })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getMessageReactions(messageId) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    if (error) throw error;
    return data.reactions || {};
  }

  static async searchMessages(query, channelType = null, channelId = null) {
    let searchQuery = supabase
      .from('universe_messages')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .textSearch('message', query);

    if (channelType) {
      searchQuery = searchQuery.eq('channel_type', channelType);
    }
    if (channelId) {
      searchQuery = searchQuery.eq('channel_id', channelId);
    }

    searchQuery = searchQuery
      .order('created_at', { ascending: false })
      .limit(20);

    const { data, error } = await searchQuery;
    if (error) throw error;
    return data;
  }

  static async getUserMentions(userId, limit = 10) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .contains('mentions', [userId])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async deleteMessage(messageId, userId) {
    const { error } = await supabase
      .from('universe_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  static async getActiveChannels(userId) {
    // Get channels where user has recently participated
    const { data, error } = await supabase
      .from('universe_messages')
      .select('channel_type, channel_id, max(created_at) as last_activity')
      .eq('user_id', userId)
      .group('channel_type, channel_id')
      .order('last_activity', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  }

  static async getUserMessages(userId, limit = 20) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getMessageById(messageId) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified),
        reply_to_message:reply_to(id, message, profiles:user_id(username))
      `)
      .eq('id', messageId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getChannelActivity(channelType, channelId, hours = 24) {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const { data, error } = await supabase
      .from('universe_messages')
      .select('id, created_at, user_id')
      .eq('channel_type', channelType)
      .eq('channel_id', channelId)
      .gte('created_at', startTime.toISOString());

    if (error) throw error;

    // Calculate activity metrics
    const totalMessages = data.length;
    const uniqueUsers = [...new Set(data.map(m => m.user_id))].length;
    const messagesPerHour = Math.round(totalMessages / hours);

    return {
      total_messages: totalMessages,
      unique_users: uniqueUsers,
      messages_per_hour: messagesPerHour,
      time_period: `${hours} hours`
    };
  }

  static async getPopularChannels(channelType, limit = 10) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select('channel_id, count(*)')
      .eq('channel_type', channelType)
      .group('channel_id')
      .order('count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async updateMessage(messageId, userId, newMessage) {
    const { data, error } = await supabase
      .from('universe_messages')
      .update({
        message: newMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('user_id', userId)
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getGlobalFeed(limit = 50) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .eq('channel_type', 'global')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getChannelStats(channelType, channelId) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select('id, user_id, created_at')
      .eq('channel_type', channelType)
      .eq('channel_id', channelId);

    if (error) throw error;

    const totalMessages = data.length;
    const uniqueUsers = [...new Set(data.map(m => m.user_id))].length;
    const firstMessage = data.length > 0 ? new Date(Math.min(...data.map(m => new Date(m.created_at)))) : null;
    const lastMessage = data.length > 0 ? new Date(Math.max(...data.map(m => new Date(m.created_at)))) : null;

    return {
      total_messages: totalMessages,
      unique_users: uniqueUsers,
      first_message_at: firstMessage,
      last_message_at: lastMessage,
      channel_type: channelType,
      channel_id: channelId
    };
  }

  static async moderateMessage(messageId, moderatorId, action, reason = null) {
    // This could be extended to handle different moderation actions
    // For now, we'll just delete inappropriate messages
    if (action === 'delete') {
      const { error } = await supabase
        .from('universe_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return { success: true, action: 'deleted', moderator: moderatorId, reason };
    }

    return { success: false, error: 'Invalid moderation action' };
  }
}

