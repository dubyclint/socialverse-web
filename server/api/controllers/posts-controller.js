// FILE: /server/api/controllers/posts-controller.js
// REFACTORED: Using lazy-loaded models

import * as Post from '~/server/models/post'

export class PostController {
  /**
   * Create new post
   * ✅ Lazy-loaded: Supabase only loads when this method is called
   */
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
      } = req.body

      const post = await Post.create({
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

      return res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: post
      })
    } catch (error) {
      console.error('Error creating post:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create post'
      })
    }
  }

  /**
   * Get post by ID
   */
  static async getPost(req, res) {
    try {
      const { post_id } = req.params

      const post = await Post.findById(post_id)

      if (!post) {
        return res.status(404).json({ error: 'Post not found' })
      }

      return res.status(200).json({
        success: true,
        data: post
      })
    } catch (error) {
      console.error('Error fetching post:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch post'
      })
    }
  }

  /**
   * Get user posts
   */
  static async getUserPosts(req, res) {
    try {
      const { user_id } = req.params
      const { limit = 20, offset = 0 } = req.query

      const posts = await Post.findByUserId(
        user_id,
        parseInt(limit),
        parseInt(offset)
      )

      return res.status(200).json({
        success: true,
        data: posts
      })
    } catch (error) {
      console.error('Error fetching user posts:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch user posts'
      })
    }
  }

  /**
   * Update post
   */
  static async updatePost(req, res) {
    try {
      const { post_id } = req.params
      const updates = req.body

      const post = await Post.update(post_id, updates)

      return res.status(200).json({
        success: true,
        message: 'Post updated successfully',
        data: post
      })
    } catch (error) {
      console.error('Error updating post:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update post'
      })
    }
  }

  /**
   * Delete post
   */
  static async deletePost(req, res) {
    try {
      const { post_id } = req.params

      await Post.delete_(post_id)

      return res.status(200).json({
        success: true,
        message: 'Post deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting post:', error)
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete post'
      })
    }
  }
}
