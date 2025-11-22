// UniverseMessage.js - Supabase PostgreSQL Model
import { supabase } from './utils/supabase.js';

export class UniverseMessage {
  static async create(messageData) {
    const { data, error } = await supabase
      .from('universe_messages')
      .insert([{
        sender_id: messageData.senderId,
        country: messageData.country,
        interest_tags: messageData.interestTags || [],
        message: messageData.message,
        is_anonymous: messageData.isAnonymous || false,
        room_id: messageData.roomId || 'global',
        message_type: messageData.messageType || 'text',
        media_url: messageData.mediaUrl || null,
        reply_to: messageData.replyTo || null,
        is_pinned: false,
        is_reported: false
      }])
      .select(`
        *,
        sender:sender_id(username, avatar_url, country),
        reply_message:reply_to(message, sender_id)
      `)
      .single();
      
    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select(`
        *,
        sender:sender_id(username, avatar_url, country),
        reply_message:reply_to(message, sender_id)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }

  static async find(filters = {}) {
    let query = supabase
      .from('universe_messages')
      .select(`
        *,
        sender:sender_id(username, avatar_url, country),
        reply_message:reply_to(message, sender_id)
      `);

    if (filters.senderId) {
      query = query.eq('sender_id', filters.senderId);
    }
    if (filters.country) {
      query = query.eq('country', filters.country);
    }
    if (filters.roomId) {
      query = query.eq('room_id', filters.roomId);
    }
    if (filters.interestTags && filters.interestTags.length > 0) {
      query = query.overlaps('interest_tags', filters.interestTags);
    }
    if (filters.messageType) {
      query = query.eq('message_type', filters.messageType);
    }
    if (filters.isReported !== undefined) {
      query = query.eq('is_reported', filters.isReported);
    }

    query = query.order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async getRecentMessages(roomId = 'global', limit = 50) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select(`
        *,
        sender:sender_id(username, avatar_url, country)
      `)
      .eq('room_id', roomId)
      .eq('is_reported', false)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data.reverse(); // Return in chronological order
  }

  static async getMessagesByCountry(country, limit = 30) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select(`
        *,
        sender:sender_id(username, avatar_url, country)
      `)
      .eq('country', country)
      .eq('is_reported', false)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data;
  }

  static async getMessagesByInterests(interestTags, limit = 30) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select(`
        *,
        sender:sender_id(username, avatar_url, country)
      `)
      .overlaps('interest_tags', interestTags)
      .eq('is_reported', false)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data;
  }

  static async updateMessage(id, updateData) {
    const { data, error } = await supabase
      .from('universe_messages')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  static async pinMessage(id, isPinned = true) {
    const { data, error } = await supabase
      .from('universe_messages')
      .update({ 
        is_pinned: isPinned,
        pinned_at: isPinned ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  static async reportMessage(id, reportedBy, reason = '') {
    const { data, error } = await supabase
      .from('universe_messages')
      .update({ 
        is_reported: true,
        reported_at: new Date().toISOString(),
        reported_by: reportedBy,
        report_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  static async getPinnedMessages(roomId = 'global') {
    const { data, error } = await supabase
      .from('universe_messages')
      .select(`
        *,
        sender:sender_id(username, avatar_url, country)
      `)
      .eq('room_id', roomId)
      .eq('is_pinned', true)
      .order('pinned_at', { ascending: false });
      
    if (error) throw error;
    return data;
  }

  static async deleteMessage(id) {
    const { data, error } = await supabase
      .from('universe_messages')
      .delete()
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  static async getActiveCountries() {
    const { data, error } = await supabase
      .from('universe_messages')
      .select('country')
      .not('country', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000);
      
    if (error) throw error;
    
    // Get unique countries
    const uniqueCountries = [...new Set(data.map(msg => msg.country))];
    return uniqueCountries;
  }

  static async getPopularTags(limit = 20) {
    const { data, error } = await supabase
      .from('universe_messages')
      .select('interest_tags')
      .not('interest_tags', 'is', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .limit(1000);
      
    if (error) throw error;
    
    // Flatten and count tags
    const tagCounts = {};
    data.forEach(msg => {
      if (msg.interest_tags && Array.isArray(msg.interest_tags)) {
        msg.interest_tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Sort by frequency and return top tags
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }

  static async searchMessages(searchTerm, filters = {}) {
    let query = supabase
      .from('universe_messages')
      .select(`
        *,
        sender:sender_id(username, avatar_url, country)
      `)
      .ilike('message', `%${searchTerm}%`)
      .eq('is_reported', false);

    if (filters.country) {
      query = query.eq('country', filters.country);
    }
    if (filters.roomId) {
      query = query.eq('room_id', filters.roomId);
    }

    query = query.order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
