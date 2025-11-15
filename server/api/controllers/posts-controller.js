// server/api/controllers/postController.js
import { supabase } from '../../../utils/supabase.js';

export class PostController {
  // Create new post
  static async createPost(req, res) {
    try {
      const {
        user_id,
        content,
        media_files,
        post_type,
        location,
        tags,
        visibility,
        is_promoted
      } = req.body;

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id,
          content,
          media_files,
          post_type: post_type || 'text',
          location,
          tags,
          visibility: visibility || 'public',
          is_promoted: is_promoted || false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: post
      });
    } catch (error) {
      console.error('Error creating post:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all posts (feed)
  static async getPosts(req, res) {
    try {
      const { page = 1, limit = 10, filter = 'all' } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey(id, username, avatar_url, verified_badge),
          likes_count:likes(count),
          comments_count:comments(count)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filter === 'promoted') {
        query = query.eq('is_promoted', true);
      } else if (filter === 'media') {
        query = query.not('media_files', 'is', null);
      }

      const { data: posts, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user posts
  static async getUserPosts(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          likes_count:likes(count),
          comments_count:comments(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: posts
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get post by ID
  static async getPostById(req, res) {
    try {
      const { postId } = req.params;

      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey(id, username, avatar_url, verified_badge),
          likes:likes(*),
          comments:comments(
            *,
            users!comments_user_id_fkey(id, username, avatar_url)
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        data: post
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update post
  static async updatePost(req, res) {
    try {
      const { postId } = req.params;
      const { user_id, content, media_files, tags, visibility } = req.body;

      // Verify ownership
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      if (existingPost.user_id !== user_id) {
        return res.status(403).json({ error: 'Unauthorized to update this post' });
      }

      const { data: post, error } = await supabase
        .from('posts')
        .update({
          content,
          media_files,
          tags,
          visibility,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Post updated successfully',
        data: post
      });
    } catch (error) {
      console.error('Error updating post:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete post
  static async deletePost(req, res) {
    try {
      const { postId } = req.params;
      const { user_id } = req.body;

      // Verify ownership
      const { data: existingPost, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      if (existingPost.user_id !== user_id) {
        return res.status(403).json({ error: 'Unauthorized to delete this post' });
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Like/Unlike post
  static async toggleLike(req, res) {
    try {
      const { postId } = req.params;
      const { user_id } = req.body;

      // Check if like exists
      const { data: existingLike, error: fetchError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user_id)
        .single();

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user_id);

        if (deleteError) throw deleteError;

        return res.status(200).json({
          success: true,
          message: 'Post unliked successfully',
          liked: false
        });
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('likes')
          .insert({ 
            post_id: postId, 
            user_id,
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;

        return res.status(200).json({
          success: true,
          message: 'Post liked successfully',
          liked: true
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Add comment to post
  static async addComment(req, res) {
    try {
      const { postId } = req.params;
      const { user_id, content, parent_id } = req.body;

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id,
          content,
          parent_id,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          users!comments_user_id_fkey(id, username, avatar_url)
        `)
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Promote post (admin/paid feature)
  static async promotePost(req, res) {
    try {
      const { postId } = req.params;
      const { user_id, duration_hours = 24 } = req.body;

      const { data: post, error } = await supabase
        .from('posts')
        .update({
          is_promoted: true,
          promoted_until: new Date(Date.now() + duration_hours * 60 * 60 * 1000)
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Post promoted successfully',
        data: post
      });
    } catch (error) {
      console.error('Error promoting post:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
