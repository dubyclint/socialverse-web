// Post.js - Supabase PostgreSQL Model  
import { supabase } from './utils/supabase.js';

export class Post {
  static async create(postData) {
    const { data, error } = await supabase
      .from('contents')
      .insert([{
        user_id: postData.userId || postData.author,
        content_type: postData.contentType || 'post',
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt,
        featured_image: postData.featuredImage,
        tags: postData.tags || [],
        category: postData.category,
        status: postData.status || 'published',
        is_featured: postData.isFeatured || false,
        published_at: new Date().toISOString()
      }])
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .single();
      
    if (error) throw error;
    return data;
  }

  static async find(filter = {}) {
    let query = supabase
      .from('contents')
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `);

    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }
    if (filter.author) {
      query = query.eq('user_id', filter.author);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.category) {
      query = query.eq('category', filter.category);
    }
    if (filter.contentType) {
      query = query.eq('content_type', filter.contentType);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('contents')
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    // Increment view count
    await this.incrementViewCount(id);
    
    return data;
  }

  static async findOne(filter) {
    let query = supabase
      .from('contents')
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `);

    if (filter.id) {
      query = query.eq('id', filter.id);
    }
    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }
    if (filter.title) {
      query = query.eq('title', filter.title);
    }

    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async save(postData) {
    if (postData.id) {
      // Update existing
      const { data, error } = await supabase
        .from('contents')
        .update({
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt,
          featured_image: postData.featuredImage,
          tags: postData.tags,
          category: postData.category,
          status: postData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', postData.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Create new
      return await this.create(postData);
    }
  }

  static async findByIdAndUpdate(id, updateData) {
    const { data, error } = await supabase
      .from('contents')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async incrementViewCount(id) {
    // Get current view count
    const { data: current } = await supabase
      .from('contents')
      .select('view_count')
      .eq('id', id)
      .single();

    const newCount = (current?.view_count || 0) + 1;

    const { error } = await supabase
      .from('contents')
      .update({ view_count: newCount })
      .eq('id', id);

    if (error) throw error;
  }

  static async getFeaturedPosts(limit = 5) {
    const { data, error } = await supabase
      .from('contents')
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .eq('is_featured', true)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getPopularPosts(limit = 10) {
    const { data, error } = await supabase
      .from('contents')
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async searchPosts(query, limit = 20) {
    const { data, error } = await supabase
      .from('contents')
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
