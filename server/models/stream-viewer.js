// server/models/stream-viewer.js - Supabase PostgreSQL Stream Viewer Model
import { supabase } from '../utils/supabase.js';

export class StreamViewer {
  /**
   * Create or update viewer record
   */
  static async createOrUpdate(viewerData) {
    try {
      // Check if viewer already exists
      const { data: existing } = await supabase
        .from('stream_viewers')
        .select('id')
        .eq('stream_id', viewerData.streamId)
        .eq('user_id', viewerData.userId)
        .single();

      if (existing) {
        return this.update(existing.id, viewerData);
      }

      const { data, error } = await supabase
        .from('stream_viewers')
        .insert({
          stream_id: viewerData.streamId,
          user_id: viewerData.userId,
          join_time: new Date().toISOString(),
          is_active: true,
          total_watch_time: 0,
          device_type: viewerData.deviceType || 'desktop',
          user_agent: viewerData.userAgent || null,
          ip_address: viewerData.ipAddress || null,
          location: viewerData.location || {},
          quality: viewerData.quality || 'auto',
          interactions: {
            chat_messages: 0,
            pew_gifts_sent: 0,
            reactions: 0
          }
        })
        .select(`
          *,
          user:user_id(username, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating viewer record:', error);
      throw error;
    }
  }

  /**
   * Update viewer record
   */
  static async update(viewerId, updateData) {
    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .update(updateData)
        .eq('id', viewerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating viewer:', error);
      throw error;
    }
  }

  /**
   * Record viewer leave
   */
  static async recordLeave(viewerId) {
    try {
      const { data: viewer } = await supabase
        .from('stream_viewers')
        .select('join_time')
        .eq('id', viewerId)
        .single();

      if (!viewer) throw new Error('Viewer not found');

      const watchTime = Math.floor(
        (new Date() - new Date(viewer.join_time)) / 1000
      );

      const { data, error } = await supabase
        .from('stream_viewers')
        .update({
          leave_time: new Date().toISOString(),
          is_active: false,
          total_watch_time: watchTime
        })
        .eq('id', viewerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording viewer leave:', error);
      throw error;
    }
  }

  /**
   * Get active viewers for stream
   */
  static async getActiveViewers(streamId, limit = 100, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('stream_viewers')
        .select(`
          *,
          user:user_id(username, avatar_url)
        `, { count: 'exact' })
        .eq('stream_id', streamId)
        .eq('is_active', true)
        .order('join_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching active viewers:', error);
      throw error;
    }
  }

  /**
   * Get stream viewer statistics
   */
  static async getStreamStats(streamId) {
    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .select('total_watch_time, device_type, quality, is_active');

      if (error) throw error;

      const stats = {
        totalViewers: data.length,
        activeViewers: data.filter(v => v.is_active).length,
        totalWatchTime: data.reduce((sum, v) => sum + (v.total_watch_time || 0), 0),
        averageWatchTime: data.length > 0 
          ? Math.floor(data.reduce((sum, v) => sum + (v.total_watch_time || 0), 0) / data.length)
          : 0,
        deviceBreakdown: this.groupBy(data, 'device_type'),
        qualityPreferences: this.groupBy(data, 'quality')
      };

      return stats;
    } catch (error) {
      console.error('Error fetching stream stats:', error);
      throw error;
    }
  }

  /**
   * Get viewer history
   */
  static async getViewerHistory(userId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('stream_viewers')
        .select(`
          *,
          stream:stream_id(id, title)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('join_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching viewer history:', error);
      throw error;
    }
  }

  /**
   * Update viewer interactions
   */
  static async updateInteractions(viewerId, interactionType) {
    try {
      const { data: viewer } = await supabase
        .from('stream_viewers')
        .select('interactions')
        .eq('id', viewerId)
        .single();

      if (!viewer) throw new Error('Viewer not found');

      const interactions = viewer.interactions || {};
      const key = interactionType === 'chat' ? 'chat_messages' 
                : interactionType === 'gift' ? 'pew_gifts_sent'
                : 'reactions';

      interactions[key] = (interactions[key] || 0) + 1;

      const { data, error } = await supabase
        .from('stream_viewers')
        .update({ interactions })
        .eq('id', viewerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating interactions:', error);
      throw error;
    }
  }

  /**
   * Get top viewers by watch time
   */
  static async getTopViewers(streamId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('stream_viewers')
        .select(`
          *,
          user:user_id(username, avatar_url)
        `)
        .eq('stream_id', streamId)
        .order('total_watch_time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching top viewers:', error);
      throw error;
    }
  }

  /**
   * Delete viewer record
   */
  static async delete(viewerId) {
    try {
      const { error } = await supabase
        .from('stream_viewers')
        .delete()
        .eq('id', viewerId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting viewer:', error);
      throw error;
    }
  }

  /**
   * Helper: Group array by property
   */
  static groupBy(array, property) {
    return array.reduce((acc, obj) => {
      const key = obj[property] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }
    }
        
