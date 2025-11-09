// Pew.js - Supabase PostgreSQL Model
import { supabase } from './utils/supabase.js';

export class Pew {
  static async create(pewData) {
    const { data, error } = await supabase
      .from('pews')
      .insert([{
        user_id: pewData.userId,
        title: pewData.title,
        content: pewData.content,
        media_urls: pewData.mediaUrl ? [pewData.mediaUrl] : [],
        hashtags: pewData.tags || [],
        content_type: pewData.contentType || 'text',
        trading_related: pewData.tradingRelated || false,
        visibility: pewData.visibility || 'public',
        ranking_score: 0,
        engagement_score: 0
      }])
      .select(`
        *,
        profiles:user_id(username, avatar_url),
        likes_count:likes!target_id(count),
        comments_count:comments!target_id(count)
      `)
      .single();
      
    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('pews')
      .select(`
        *,
        profiles:user_id(username, avatar_url),
        likes_count:likes!target_id(count),
        comments_count:comments!target_id(count)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }

  static async find(filters = {}) {
    let query = supabase
      .from('pews')
      .select(`
        *,
        profiles:user_id(username, avatar_url),
        likes_count:likes!target_id(count),
        comments_count:comments!target_id(count)
      `);

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.visibility) {
      query = query.eq('visibility', filters.visibility);
    }
    if (filters.tradingRelated !== undefined) {
      query = query.eq('trading_related', filters.tradingRelated);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async save(pewData) {
    if (pewData.id) {
      // Update existing
      const { data, error } = await supabase
        .from('pews')
        .update({
          title: pewData.title,
          content: pewData.content,
          media_urls: pewData.mediaUrl ? [pewData.mediaUrl] : pewData.media_urls,
          hashtags: pewData.tags || pewData.hashtags,
          ranking_score: pewData.rankScore || pewData.ranking_score,
          updated_at: new Date().toISOString()
        })
        .eq('id', pewData.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Create new
      return await this.create(pewData);
    }
  }

  static async updateRankingScore(id, score) {
    const { data, error } = await supabase
      .from('pews')
      .update({ 
        ranking_score: score,
        engagement_score: score,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  static async getTopRanked(limit = 10) {
    const { data, error } = await supabase
      .from('pews')
      .select(`
        *,
        profiles:user_id(username, avatar_url),
        likes_count:likes!target_id(count),
        comments_count:comments!target_id(count)
      `)
      .eq('visibility', 'public')
      .order('ranking_score', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data;
  }

  static async addLike(pewId, userId) {
    const { data, error } = await supabase
      .from('likes')
      .insert([{
        user_id: userId,
        target_type: 'pew',
        target_id: pewId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async addComment(pewId, userId, comment) {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        user_id: userId,
        target_type: 'pew',
        target_id: pewId,
        content: comment
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
