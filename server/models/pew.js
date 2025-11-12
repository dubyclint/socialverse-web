// server/models/pew.js - Supabase PostgreSQL Model
import { supabase } from '../utils/supabase.js';

export class pew {
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
        visibility: pewData.visibility || 'public'
      }])
      .select()
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
        likes:likes!target_id(count),
        comments:comments!target_id(count)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }

  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('pews')
      .select(`
        *,
        profiles:user_id(username, avatar_url),
        likes:likes!target_id(count),
        comments:comments!target_id(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  }

  static async updateRankingScore(id, score) {
    const { data, error } = await supabase
      .from('pews')
      .update({ ranking_score: score, engagement_score: score })
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
        likes:likes!target_id(count),
        comments:comments!target_id(count)
      `)
      .eq('visibility', 'public')
      .order('ranking_score', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data;
  }
}
