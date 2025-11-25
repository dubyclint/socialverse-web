// FILE: /server/models/media.ts
// Media File Management
// Converted from: media-file.js

import { db } from '~/server/utils/database'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MediaFile {
  id: string
  user_id: string
  filename: string
  original_name: string
  file_type: 'image' | 'video' | 'audio' | 'document'
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
  fileType: 'image' | 'video' | 'audio' | 'document'
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

// ============================================================================
// MEDIA MODEL
// ============================================================================

export class MediaModel {
  /**
   * Create a new media file record
   */
  static async create(input: CreateMediaInput): Promise<MediaFile> {
    try {
      const { data, error } = await db
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
          is_processed: false
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
   */
  static async getById(mediaId: string): Promise<MediaFile | null> {
    try {
      const { data, error } = await db
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
   */
  static async getUserMedia(userId: string, limit: number = 50): Promise<MediaFile[]> {
    try {
      const { data, error } = await db
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
   * Update media file
   */
  static async update(mediaId: string, userId: string, updates: Partial<CreateMediaInput>): Promise<MediaFile> {
    try {
      const { data, error } = await db
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
   * Mark media as processed
   */
  static async markProcessed(mediaId: string, metadata?: Record<string, any>): Promise<MediaFile> {
    try {
      const { data, error } = await db
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
   */
  static async delete(mediaId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await db
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
   */
  static async getByStoragePath(storagePath: string): Promise<MediaFile | null> {
    try {
      const { data, error } = await db
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
   * Search media files
   */
  static async search(userId: string, query: string, limit: number = 20): Promise<MediaFile[]> {
    try {
      const { data, error } = await db
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
   * Get media statistics for user
   */
  static async getUserStats(userId: string): Promise<{
    totalFiles: number
    totalSize: number
    byType: Record<string, number>
  }> {
    try {
      const { data, error } = await db
        .from('media_files')
        .select('file_type, file_size')
        .eq('user_id', userId)

      if (error) throw error

      const files = data as Array<{ file_type: string; file_size: number }>
      const byType: Record<string, number> = {}
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
}
