// server/models/media-file.ts
// Media File Management Model
// Handles image, video, audio, and document uploads with metadata tracking

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type FileType = 'image' | 'video' | 'audio' | 'document'

export interface MediaFile {
  id: string
  user_id: string
  filename: string
  original_name: string
  file_type: FileType
  file_size: number
  mime_type: string
  storage_path: string
  public_url: string
  thumbnail_url?: string
  alt_text?: string
  width?: number
  height?: number
  duration?: number
  metadata?: Record<string, any>
  is_processed: boolean
  created_at: string
  updated_at: string
}

export interface CreateMediaInput {
  userId: string
  filename: string
  originalName: string
  fileType: FileType
  fileSize: number
  mimeType: string
  storagePath: string
  publicUrl: string
  thumbnailUrl?: string
  altText?: string
  width?: number
  height?: number
  duration?: number
  metadata?: Record<string, any>
}

export interface UpdateMediaInput {
  altText?: string
  thumbnailUrl?: string
  metadata?: Record<string, any>
}

export interface MediaStats {
  totalFiles: number
  totalSize: number
  byType: Record<FileType, number>
}

export interface MediaSearchResult {
  files: MediaFile[]
  total: number
  limit: number
  offset: number
}

// ============================================================================
// MEDIA MODEL
// ============================================================================

export class MediaModel {
  /**
   * Create a new media file record
   * @param input - Media file creation input
   * @returns Created media file
   */
  static async create(input: CreateMediaInput): Promise<MediaFile> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .insert({
          user_id: input.userId,
          filename: input.filename,
          original_name: input.originalName,
          file_type: input.fileType,
          file_size: input.fileSize,
          mime_type: input.mimeType,
          storage_path: input.storagePath,
          public_url: input.publicUrl,
          thumbnail_url: input.thumbnailUrl,
          alt_text: input.altText,
          width: input.width,
          height: input.height,
          duration: input.duration,
          metadata: input.metadata || {},
          is_processed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as MediaFile
    } catch (error) {
      console.error('[MediaModel] Create error:', error)
      throw error
    }
  }

  /**
   * Get media file by ID
   * @param mediaId - Media file ID
   * @returns Media file or null if not found
   */
  static async getById(mediaId: string): Promise<MediaFile | null> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('id', mediaId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as MediaFile) || null
    } catch (error) {
      console.error('[MediaModel] Get by ID error:', error)
      throw error
    }
  }

  /**
   * Get all media files for a user
   * @param userId - User ID
   * @param limit - Maximum number of files to return
   * @returns Array of media files
   */
  static async getUserMedia(userId: string, limit: number = 50): Promise<MediaFile[]> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as MediaFile[]) || []
    } catch (error) {
      console.error('[MediaModel] Get user media error:', error)
      throw error
    }
  }

  /**
   * Get paginated media files for a user
   * @param userId - User ID
   * @param limit - Items per page
   * @param offset - Pagination offset
   * @returns Paginated media files
   */
  static async getUserMediaPaginated(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<MediaSearchResult> {
    try {
      const { data, error, count } = await supabase
        .from('media_files')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        files: (data as MediaFile[]) || [],
        total: count || 0,
        limit,
        offset
      }
    } catch (error) {
      console.error('[MediaModel] Get user media paginated error:', error)
      throw error
    }
  }

  /**
   * Update media file metadata
   * @param mediaId - Media file ID
   * @param userId - User ID (for authorization)
   * @param updates - Partial updates
   * @returns Updated media file
   */
  static async update(
    mediaId: string,
    userId: string,
    updates: UpdateMediaInput
  ): Promise<MediaFile> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', mediaId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      return data as MediaFile
    } catch (error) {
      console.error('[MediaModel] Update error:', error)
      throw error
    }
  }

  /**
   * Mark media as processed (after thumbnail/metadata extraction)
   * @param mediaId - Media file ID
   * @param metadata - Processing metadata
   * @returns Updated media file
   */
  static async markProcessed(
    mediaId: string,
    metadata?: Record<string, any>
  ): Promise<MediaFile> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .update({
          is_processed: true,
          metadata: metadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', mediaId)
        .select()
        .single()

      if (error) throw error
      return data as MediaFile
    } catch (error) {
      console.error('[MediaModel] Mark processed error:', error)
      throw error
    }
  }

  /**
   * Delete media file
   * @param mediaId - Media file ID
   * @param userId - User ID (for authorization)
   * @returns Success status
   */
  static async delete(mediaId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', mediaId)
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[MediaModel] Delete error:', error)
      throw error
    }
  }

  /**
   * Get media by storage path
   * @param storagePath - Storage path
   * @returns Media file or null
   */
  static async getByStoragePath(storagePath: string): Promise<MediaFile | null> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('storage_path', storagePath)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as MediaFile) || null
    } catch (error) {
      console.error('[MediaModel] Get by storage path error:', error)
      throw error
    }
  }

  /**
   * Search media files by name or alt text
   * @param userId - User ID
   * @param query - Search query
   * @param limit - Maximum results
   * @returns Search results
   */
  static async search(
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<MediaFile[]> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('user_id', userId)
        .or(`original_name.ilike.%${query}%,alt_text.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as MediaFile[]) || []
    } catch (error) {
      console.error('[MediaModel] Search error:', error)
      throw error
    }
  }

  /**
   * Get media files by type
   * @param userId - User ID
   * @param fileType - File type filter
   * @param limit - Maximum results
   * @returns Media files of specified type
   */
  static async getByType(
    userId: string,
    fileType: FileType,
    limit: number = 50
  ): Promise<MediaFile[]> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('user_id', userId)
        .eq('file_type', fileType)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as MediaFile[]) || []
    } catch (error) {
      console.error('[MediaModel] Get by type error:', error)
      throw error
    }
  }

  /**
   * Get media statistics for user
   * @param userId - User ID
   * @returns Media statistics
   */
  static async getUserStats(userId: string): Promise<MediaStats> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('file_type, file_size')
        .eq('user_id', userId)

      if (error) throw error

      const files = data as Array<{ file_type: FileType; file_size: number }>
      const byType: Record<FileType, number> = {
        image: 0,
        video: 0,
        audio: 0,
        document: 0
      }
      let totalSize = 0

      files.forEach((file) => {
        byType[file.file_type] = (byType[file.file_type] || 0) + 1
        totalSize += file.file_size
      })

      return {
        totalFiles: files.length,
        totalSize,
        byType
      }
    } catch (error) {
      console.error('[MediaModel] Get stats error:', error)
      throw error
    }
  }

  /**
   * Get unprocessed media files
   * @param limit - Maximum results
   * @returns Unprocessed media files
   */
  static async getUnprocessed(limit: number = 50): Promise<MediaFile[]> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('is_processed', false)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) throw error
      return (data as MediaFile[]) || []
    } catch (error) {
      console.error('[MediaModel] Get unprocessed error:', error)
      throw error
    }
  }

  /**
   * Delete old media files (cleanup)
   * @param daysOld - Delete files older than this many days
   * @returns Number of deleted files
   */
  static async deleteOldFiles(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { data: filesToDelete, error: fetchError } = await supabase
        .from('media_files')
        .select('id')
        .lt('created_at', cutoffDate.toISOString())

      if (fetchError) throw fetchError

      if (!filesToDelete || filesToDelete.length === 0) {
        return 0
      }

      const { error: deleteError } = await supabase
        .from('media_files')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (deleteError) throw deleteError

      console.log(`[MediaModel] Deleted ${filesToDelete.length} old media files`)
      return filesToDelete.length
    } catch (error) {
      console.error('[MediaModel] Delete old files error:', error)
      throw error
    }
  }

  /**
   * Get media files used in posts
   * @param postIds - Array of post IDs
   * @returns Media files associated with posts
   */
  static async getMediaByPosts(postIds: string[]): Promise<MediaFile[]> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .in('id', postIds)

      if (error) throw error
      return (data as MediaFile[]) || []
    } catch (error) {
      console.error('[MediaModel] Get media by posts error:', error)
      throw error
    }
  }

  /**
   * Bulk update media metadata
   * @param mediaIds - Array of media IDs
   * @param updates - Updates to apply
   * @returns Number of updated files
   */
  static async bulkUpdate(
    mediaIds: string[],
    updates: UpdateMediaInput
  ): Promise<number> {
    try {
      const { error } = await supabase
        .from('media_files')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', mediaIds)

      if (error) throw error

      console.log(`[MediaModel] Bulk updated ${mediaIds.length} media files`)
      return mediaIds.length
    } catch (error) {
      console.error('[MediaModel] Bulk update error:', error)
      throw error
    }
  }

  /**
   * Get media file count for user
   * @param userId - User ID
   * @returns Total media file count
   */
  static async getUserMediaCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('media_files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('[MediaModel] Get user media count error:', error)
      throw error
    }
  }

  /**
   * Get total storage used by user
   * @param userId - User ID
   * @returns Total storage in bytes
   */
  static async getUserStorageUsed(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('file_size')
        .eq('user_id', userId)

      if (error) throw error

      const files = data as Array<{ file_size: number }>
      return files.reduce((total, file) => total + file.file_size, 0)
    } catch (error) {
      console.error('[MediaModel] Get user storage used error:', error)
      throw error
    }
  }
}

export default MediaModel
