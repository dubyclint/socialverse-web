// FILE: /server/utils/storage.ts - COMPLETE FIXED VERSION
// ============================================================================
// STORAGE UTILITIES - FIXED: Complete file management and tracking
// ✅ FIXED: Storage configuration
// ✅ FIXED: File upload tracking
// ✅ FIXED: Storage usage calculation
// ✅ FIXED: File deletion with cleanup
// ✅ FIXED: Comprehensive error handling
// ============================================================================

import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

/**
 * Storage configuration
 */
export const STORAGE_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxStoragePerUser: 5 * 1024 * 1024 * 1024, // 5GB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  allowedDocumentTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  buckets: {
    avatars: 'avatars',
    uploads: 'uploads',
    posts: 'posts'
  }
}

/**
 * Get user's current storage usage
 */
export async function getUserStorageUsage(userId: string) {
  try {
    console.log('[Storage] Getting storage usage for user:', userId)

    const supabase = await serverSupabaseClient()
    
    // Get total file size for user
    const { data, error } = await supabase
      .from('file_uploads')
      .select('file_size')
      .eq('user_id', userId)

    if (error && error.code !== 'PGRST116') {
      console.error('[Storage] Error getting usage:', error.message)
      throw error
    }

    const totalBytes = data?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0
    const limitBytes = STORAGE_CONFIG.maxStoragePerUser
    const percentageUsed = (totalBytes / limitBytes) * 100

    console.log('[Storage] ✅ Storage usage calculated:', {
      used: totalBytes,
      limit: limitBytes,
      percentage: percentageUsed.toFixed(2)
    })

    return {
      used: totalBytes,
      limit: limitBytes,
      percentage: percentageUsed,
      remaining: limitBytes - totalBytes,
      isNearLimit: percentageUsed > 80,
      isAtLimit: percentageUsed >= 100
    }
  } catch (error: any) {
    console.error('[Storage] Error calculating usage:', error.message)
    return {
      used: 0,
      limit: STORAGE_CONFIG.maxStoragePerUser,
      percentage: 0,
      remaining: STORAGE_CONFIG.maxStoragePerUser,
      isNearLimit: false,
      isAtLimit: false
    }
  }
}

/**
 * Get overall storage statistics (admin only)
 */
export async function getStorageStats() {
  try {
    console.log('[Storage] Getting storage statistics...')

    const supabase = await serverSupabaseClient()
    
    // Get total storage used across all users
    const { data, error } = await supabase
      .from('file_uploads')
      .select('file_size')

    if (error && error.code !== 'PGRST116') {
      console.error('[Storage] Error getting stats:', error.message)
      throw error
    }

    const totalUsed = data?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0
    const fileCount = data?.length || 0

    // Get unique users
    const { data: users, error: usersError } = await supabase
      .from('file_uploads')
      .select('user_id', { count: 'exact' })
      .distinct()

    const uniqueUsers = users?.length || 0

    console.log('[Storage] ✅ Storage statistics calculated:', {
      totalUsed,
      fileCount,
      uniqueUsers
    })

    return {
      totalUsed,
      fileCount,
      uniqueUsers,
      averagePerUser: uniqueUsers > 0 ? totalUsed / uniqueUsers : 0
    }
  } catch (error: any) {
    console.error('[Storage] Error getting statistics:', error.message)
    return {
      totalUsed: 0,
      fileCount: 0,
      uniqueUsers: 0,
      averagePerUser: 0
    }
  }
}

/**
 * Track file upload
 */
export async function trackUpload(
  userId: string,
  filename: string,
  fileSize: number,
  fileType: string,
  bucket: string,
  metadata?: any
) {
  try {
    console.log('[Storage] Tracking upload:', {
      userId,
      filename,
      fileSize,
      fileType,
      bucket
    })

    const supabase = await serverSupabaseClient()
    
    // Insert file record
    const { data, error } = await supabase
      .from('file_uploads')
      .insert({
        user_id: userId,
        filename,
        file_size: fileSize,
        file_type: fileType,
        bucket,
        metadata: metadata || {},
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[Storage] Error tracking upload:', error.message)
      throw error
    }

    console.log('[Storage] ✅ Upload tracked successfully')
    return data
  } catch (error: any) {
    console.error('[Storage] Error tracking upload:', error.message)
    throw error
  }
}

/**
 * Delete file and update usage
 */
export async function deleteFile(
  userId: string,
  bucket: string,
  path: string
) {
  try {
    console.log('[Storage] Deleting file:', {
      userId,
      bucket,
      path
    })

    const supabase = await serverSupabaseClient()
    
    // Get file info before deletion
    const { data: fileInfo, error: infoError } = await supabase
      .from('file_uploads')
      .select('file_size, id')
      .eq('user_id', userId)
      .eq('bucket', bucket)
      .eq('filename', path)
      .single()

    if (infoError && infoError.code !== 'PGRST116') {
      console.warn('[Storage] Warning getting file info:', infoError.message)
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (deleteError) {
      console.error('[Storage] Error deleting from storage:', deleteError.message)
      throw deleteError
    }

    console.log('[Storage] ✅ File deleted from storage')

    // Remove from tracking
    if (fileInfo?.id) {
      const { error: trackError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', fileInfo.id)

      if (trackError) {
        console.warn('[Storage] Warning removing tracking:', trackError.message)
      }
    }

    console.log('[Storage] ✅ File deleted successfully')
    return { success: true, fileSize: fileInfo?.file_size || 0 }
  } catch (error: any) {
    console.error('[Storage] Error deleting file:', error.message)
    throw error
  }
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: { data: Buffer; type?: string; filename?: string },
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } {
  try {
    console.log('[Storage] Validating file:', {
      size: file.data.length,
      type: file.type,
      filename: file.filename
    })

    // Check file type
    if (!allowedTypes.includes(file.type || '')) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      }
    }

    // Check file size
    if (file.data.length > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${(maxSize / 1024 / 1024).toFixed(2)}MB limit`
      }
    }

    console.log('[Storage] ✅ File validation passed')
    return { valid: true }
  } catch (error: any) {
    console.error('[Storage] Error validating file:', error.message)
    return {
      valid: false,
      error: 'File validation failed'
    }
  }
}

/**
 * Get file type category
 */
export function getFileTypeCategory(mimeType: string): string {
  if (STORAGE_CONFIG.allowedImageTypes.includes(mimeType)) return 'image'
  if (STORAGE_CONFIG.allowedVideoTypes.includes(mimeType)) return 'video'
  if (STORAGE_CONFIG.allowedAudioTypes.includes(mimeType)) return 'audio'
  if (STORAGE_CONFIG.allowedDocumentTypes.includes(mimeType)) return 'document'
  return 'other'
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(userId: string, originalFilename: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalFilename.split('.').pop() || ''
  return `${userId}/${timestamp}-${random}.${extension}`
}

/**
 * Get bucket public URL
 */
export function getBucketPublicUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}
