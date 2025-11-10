// server/models/comment.js - Supabase PostgreSQL Comments Model
import { supabase } from '../utils/supabase.js';

export class Comment {
  static async create(commentData) {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        user_id: commentData.userId,
        target_type: commentData.targetType,
        target_id: commentData.targetId,
        parent_id: commentData.parentId || null,
        content: commentData.content,
        media_urls: commentData.mediaUrls || [],
        mentions: commentData.mentions || []
      }])
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified),
        parent:parent_id(id, content, profiles:user_id(username))
      `)
      .single();

    if (error) throw error;

    // Update replies count for parent comment
    if (commentData.parentId) {
      await this.updateRepliesCount(commentData.parentId);
    }

    return data;
  }

  static async getComments(targetType, targetId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified),
        likes:likes!target_id(count),
        replies:comments!parent_id(count)
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .is('parent_id', null) // Only top-level comments
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async getReplies(parentId, limit = 10) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified),
        likes:likes!target_id(count)
      `)
      .eq('parent_id', parentId)
      .order('created_at')
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async updateComment(commentId, userId, newContent) {
    const { data, error } = await supabase
      .from('comments')
      .update({
        content: newContent,
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteComment(commentId, userId) {
    // First, delete all replies
    await supabase
      .from('comments')
      .delete()
      .eq('parent_id', commentId);

    // Delete associated likes
    await supabase
      .from('likes')
      .delete()
      .eq('target_type', 'comment')
      .eq('target_id', commentId);

    // Delete the comment
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  static async updateRepliesCount(parentId) {
    const { data: replies } = await supabase
      .from('comments')
      .select('id', { count: 'exact' })
      .eq('parent_id', parentId);

    const { error } = await supabase
      .from('comments')
      .update({ replies_count: replies.length })
      .eq('id', parentId);

    if (error) throw error;
  }

  static async updateLikesCount(commentId) {
    const { data: likes } = await supabase
      .from('likes')
      .select('id', { count: 'exact' })
      .eq('target_type', 'comment')
      .eq('target_id', commentId);

    const { error } = await supabase
      .from('comments')
      .update({ likes_count: likes.length })
      .eq('id', commentId);

    if (error) throw error;
  }

  static async getUserComments(userId, limit = 20) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        likes:likes!target_id(count),
        replies:comments!parent_id(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getCommentById(commentId) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified),
        parent:parent_id(id, content, profiles:user_id(username)),
        likes:likes!target_id(count),
        replies:comments!parent_id(count)
      `)
      .eq('id', commentId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getCommentsWithReplies(targetType, targetId, limit = 10) {
    // Get top-level comments
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified),
        likes:likes!target_id(count)
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Get replies for each comment
    for (let comment of comments) {
      const replies = await this.getReplies(comment.id, 3); // Limit to 3 replies initially
      comment.replies = replies;
    }

    return comments;
  }

  static async searchComments(query, targetType = null, targetId = null) {
    let searchQuery = supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id(username, avatar_url, is_verified)
      `)
      .textSearch('content', query);

    if (targetType) {
      searchQuery = searchQuery.eq('target_type', targetType);
    }
    if (targetId) {
      searchQuery = searchQuery.eq('target_id', targetId);
    }

    searchQuery = searchQuery
      .order('created_at', { ascending: false })
      .limit(20);

    const { data, error } = await searchQuery;
    if (error) throw error;
    return data;
  }
}
