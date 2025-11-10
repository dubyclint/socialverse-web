// server/models/media-file.js - Supabase PostgreSQL Media Files Model
import { supabase } from '../utils/supabase.js';

export class MediaFile {
  static async create(fileData) {
    const { data, error } = await supabase 
      .from('media_files')
      .insert([{
        user_id: fileData.userId,
        filename: fileData.filename,
        original_name: fileData.originalName,
        file_type: fileData.fileType,
        file_size: fileData.fileSize,
        mime_type: fileData.mimeType,
        storage_path: fileData.storagePath,
        public_url: fileData.publicUrl,
        thumbnail_url: fileData.thumbnailUrl,
        alt_text: fileData.altText,
        width: fileData.width,
        height: fileData.height,
        duration: fileData.duration,
        metadata: fileData.metadata || {}
      }])
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getById(fileId) {
    const { data, error } = await supabase
      .from('media_files')
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .eq('id', fileId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserFiles(userId, fileType = null, limit = 20) {
    let query = supabase
      .from('media_files')
      .select('*')
      .eq('user_id', userId);

    if (fileType) {
      query = query.eq('file_type', fileType);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async updateProcessingStatus(fileId, isProcessed, thumbnailUrl = null) {
    const updateData = { is_processed: isProcessed };
    if (thumbnailUrl) {
      updateData.thumbnail_url = thumbnailUrl;
    }

    const { data, error } = await supabase
      .from('media_files')
      .update(updateData)
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateMetadata(fileId, metadata) {
    const { data, error } = await supabase
      .from('media_files')
      .update({ metadata })
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteFile(fileId, userId) {
    const { error } = await supabase
      .from('media_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }

  static async getFilesByType(fileType, limit = 50) {
    const { data, error } = await supabase
      .from('media_files')
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .eq('file_type', fileType)
      .eq('is_processed', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getStorageStatistics(userId) {
    const { data, error } = await supabase
      .from('media_files')
      .select('file_type, file_size')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total_files: data.length,
      total_size: data.reduce((sum, file) => sum + file.file_size, 0),
      by_type: {}
    };

    data.forEach(file => {
      if (!stats.by_type[file.file_type]) {
        stats.by_type[file.file_type] = {
          count: 0,
          size: 0
        };
      }
      stats.by_type[file.file_type].count++;
      stats.by_type[file.file_type].size += file.file_size;
    });

    return stats;
  }

  static async searchFiles(userId, query, fileType = null) {
    let searchQuery = supabase
      .from('media_files')
      .select('*')
      .eq('user_id', userId)
      .or(`filename.ilike.%${query}%,original_name.ilike.%${query}%,alt_text.ilike.%${query}%`);

    if (fileType) {
      searchQuery = searchQuery.eq('file_type', fileType);
    }

    searchQuery = searchQuery
      .order('created_at', { ascending: false })
      .limit(20);

    const { data, error } = await searchQuery;
    if (error) throw error;
    return data;
  }

  static async getRecentUploads(limit = 10) {
    const { data, error } = await supabase
      .from('media_files')
      .select(`
        *,
        profiles:user_id(username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
