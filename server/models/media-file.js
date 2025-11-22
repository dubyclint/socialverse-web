// server/models/media-file.js - Supabase PostgreSQL Media Files Model
import { supabase } from '../utils/supabase.js';

export class MediaFile {
  /**
   * Create a new media file record
   */
  static async create(fileData) {
    try {
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
          metadata: fileData.metadata || {},
          is_processed: false
        }])
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating media file:', error);
      throw error;
    }
  }

  /**
   * Get media file by ID
   */
  static async getById(fileId) {
    try {
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
    } catch (error) {
      console.error('Error fetching media file:', error);
      throw error;
    }
  }

  /**
   * Get user's media files
   */
  static async getUserFiles(userId, fileType = null, limit = 50, offset = 0) {
    try {
      let query = supabase
        .from('media_files')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (fileType) {
        query = query.eq('file_type', fileType);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching user files:', error);
      throw error;
    }
  }

  /**
   * Update file processing status
   */
  static async updateProcessingStatus(fileId, isProcessed, thumbnailUrl = null) {
    try {
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
    } catch (error) {
      console.error('Error updating processing status:', error);
      throw error;
    }
  }

  /**
   * Update file metadata
   */
  static async updateMetadata(fileId, metadata) {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .update({ metadata })
        .eq('id', fileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating metadata:', error);
      throw error;
    }
  }

  /**
   * Delete media file
   */
  static async deleteFile(fileId, userId) {
    try {
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get files by type
   */
  static async getFilesByType(fileType, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('media_files')
        .select(`
          *,
          profiles:user_id(username, avatar_url)
        `, { count: 'exact' })
        .eq('file_type', fileType)
        .eq('is_processed', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data, count };
    } catch (error) {
      console.error('Error fetching files by type:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics for user
   */
  static async getStorageStatistics(userId) {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('file_type, file_size')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        totalFiles: data.length,
        totalSize: data.reduce((sum, file) => sum + (file.file_size || 0), 0),
        byType: {}
      };

      data.forEach(file => {
        if (!stats.byType[file.file_type]) {
          stats.byType[file.file_type] = {
            count: 0,
            size: 0
          };
        }
        stats.byType[file.file_type].count++;
        stats.byType[file.file_type].size += file.file_size || 0;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching storage statistics:', error);
      throw error;
    }
  }

  /**
   * Search files
   */
  static async searchFiles(userId, query, fileType = null, limit = 20) {
    try {
      let searchQuery = supabase
        .from('media_files')
        .select('*')
        .eq('user_id', userId)
        .or(`filename.ilike.%${query}%,original_name.ilike.%${query}%,alt_text.ilike.%${query}%`);

      if (fileType) {
        searchQuery = searchQuery.eq('file_type', fileType);
      }

      const { data, error } = await searchQuery
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  /**
   * Get recent uploads
   */
  static async getRecentUploads(limit = 10) {
    try {
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
    } catch (error) {
      console.error('Error fetching recent uploads:', error);
      throw error;
    }
  }

  /**
   * Update file alt text
   */
  static async updateAltText(fileId, altText) {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .update({ alt_text: altText })
        .eq('id', fileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating alt text:', error);
      throw error;
    }
  }

  /**
   * Get unprocessed files
   */
  static async getUnprocessedFiles(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('is_processed', false)
        .order('created_at')
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching unprocessed files:', error);
      throw error;
    }
  }

  /**
   * Bulk delete files
   */
  static async bulkDelete(fileIds, userId) {
    try {
      const { error } = await supabase
        .from('media_files')
        .delete()
        .in('id', fileIds)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, deletedCount: fileIds.length };
    } catch (error) {
      console.error('Error bulk deleting files:', error);
      throw error;
    }
  }
}
