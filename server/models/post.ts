// FILE: /server/models/post.ts
// Post Model for Supabase
// REFACTORED: Lazy-loaded Supabase with Exported Wrapper Functions

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null

async function getSupabase() {
  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
export interface PostData {
  id?: string
  user_id: string
  content: string
  title?: string
  media_url?: string
  media_type?: 'image' | 'video' | 'text'
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  is_deleted?: boolean
  likes_count?: number
  comments_count?: number
  shares_count?: number
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class Post {
  /**
   * Get all non-deleted posts
   */
  static async getAllPosts(page = 1, limit = 12) {
    try {
      const offset = (page - 1) * limit
      const supabase = await getSupabase()

      const { data, error, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .is('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        success: true,
        posts: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (page * limit) < (count || 0)
      }
    } catch (error) {
      console.error('[Post] Error fetching all posts:', error)
      throw error
    }
  }

  /**
   * Get posts by user
   */
  static async getPostsByUser(userId: string, page = 1, limit = 12) {
    try {
      const offset = (page - 1) * limit
      const supabase = await getSupabase()

      const { data, error, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        success: true,
        posts: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (page * limit) < (count || 0)
      }
    } catch (error) {
      console.error('[Post] Error fetching user posts:', error)
      throw error
    }
  }

  /**
   * Get post by ID
   */
  static async getPost(id: string): Promise<PostData | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .is('is_deleted', false)
        .single()

      if (error) {
        console.warn('[Post] Post not found')
        return null
      }

      return data as PostData
    } catch (error) {
      console.error('[Post] Error fetching post:', error)
      throw error
    }
  }

  /**
   * Create post
   */
  static async createPost(
    userId: string,
    content: string,
    title?: string,
    mediaUrl?: string,
    mediaType?: string,
    location?: string,
    tags?: string[],
    visibility?: string,
    isPromoted?: boolean
  ): Promise<PostData> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content,
          title,
          media_url: mediaUrl,
          media_type: mediaType || 'text',
          location,
          tags,
          visibility: visibility || 'public',
          is_promoted: isPromoted || false,
          is_deleted: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as PostData
    } catch (error) {
      console.error('[Post] Error creating post:', error)
      throw error
    }
  }

  /**
   * Update post
   */
  static async updatePost(id: string, updates: Partial<PostData>): Promise<PostData> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as PostData
    } catch (error) {
      console.error('[Post] Error updating post:', error)
      throw error
    }
  }

  /**
   * Delete post (soft delete)
   */
  static async deletePost(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('posts')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[Post] Error deleting post:', error)
      throw error
    }
  }
}

// ============================================================================
// EXPORTED WRAPPER FUNCTIONS FOR CONTROLLERS
// ============================================================================
// These functions provide a clean API for controllers to use
// They wrap the class methods with names expected by the refactored controllers

/**
 * Create a new post
 * ✅ Lazy-loaded: Supabase only loads when this function is called
 */
export async function create(data: {
  user_id: string
  content: string
  media_files?: string[]
  post_type?: string
  location?: string
  tags?: string[]
  visibility?: string
  is_promoted?: boolean
  title?: string
  media_url?: string
}): Promise<PostData> {
  return Post.createPost(
    data.user_id,
    data.content,
    data.title,
    data.media_url,
    data.post_type,
    data.location,
    data.tags,
    data.visibility,
    data.is_promoted
  )
}

/**
 * Find post by ID
 */
export async function findById(id: string): Promise<PostData | null> {
  return Post.getPost(id)
}

/**
 * Find posts by user ID
 */
export async function findByUserId(
  userId: string,
  limit = 20,
  offset = 0
): Promise<PostData[]> {
  const page = Math.ceil(offset / limit) + 1
  const result = await Post.getPostsByUser(userId, page, limit)
  return result.posts
}

/**
 * Update post
 */
export async function update(
  id: string,
  updates: Partial<PostData>
): Promise<PostData> {
  return Post.updatePost(id, updates)
}

/**
 * Delete post
 */
export async function delete_(id: string): Promise<void> {
  return Post.deletePost(id)
}

/**
 * Get all posts
 */
export async function getAll(page = 1, limit = 12): Promise<PostData[]> {
  const result = await Post.getAllPosts(page, limit)
  return result.posts
}
