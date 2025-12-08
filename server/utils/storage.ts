// ============================================================================
// FILE: /server/utils/storage.ts - COMPLETE WITH ALL EXPORTS
// ============================================================================

import type { H3Event } from 'h3'
import { promises as fs } from 'fs'
import path from 'path'
import { getDBAdmin } from './db-helpers'

let supabaseInstance: any = null
let sharp: any = null

// Lazy load sharp only when needed
async function getSharp() {
  if (!sharp) {
    sharp = (await import('sharp')).default
  }
  return sharp
}

/**
 * Storage configuration
 */
export const STORAGE_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  allowedAudioTypes: ['audio/mp', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  allowedDocumentTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  thumbnailSize: { width: 200, height: 200 },
  imageQuality: 80,
  buckets: {
    uploads: 'uploads',
    avatars: 'avatars',
    media: 'media',
    temp: 'temp',
    documents: 'documents'
  }
}

/**
 * Lazy load Supabase client
 */
async function getSupabaseClient(event: H3Event) {
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    supabaseInstance = await getDBAdmin(event)
    console.log('[Storage] Supabase client loaded')
    return supabaseInstance
  } catch (error) {
    console.error('[Storage] Failed to load Supabase client:', error)
    throw error
  }
}

/**
 * Validate file
 */
export function validateFile(file: { size: number; type: string }, fileType: 'image' | 'video' | 'audio' | 'document' = 'image') {
  const errors: string[] = []

  // Check file size
  if (file.size > STORAGE_CONFIG.maxFileSize) {
    errors.push(`File size exceeds maximum allowed size of ${STORAGE_CONFIG.maxFileSize / (1024 * 1024)}MB`)
  }

  // Check file type
  let allowedTypes: string[] = []
  switch (fileType) {
    case 'image':
      allowedTypes = STORAGE_CONFIG.allowedImageTypes
      break
    case 'video':
      allowedTypes = STORAGE_CONFIG.allowedVideoTypes
      break
    case 'audio':
      allowedTypes = STORAGE_CONFIG.allowedAudioTypes
      break
    case 'document':
      allowedTypes = STORAGE_CONFIG.allowedDocumentTypes
      break
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  event: H3Event,
  file: Buffer,
  fileName: string,
  bucket: string = 'uploads'
) {
  try {
    const supabase = await getSupabaseClient(event)
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: 'application/octet-stream',
        upsert: false
      })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl
    }
  } catch (error) {
    console.error('[Storage] Upload failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Optimize image using sharp (lazy loaded)
 */
export async function optimizeImage(
  buffer: Buffer,
  options: { width?: number; height?: number; quality?: number } = {}
) {
  try {
    const sharpInstance = await getSharp()
    
    let image = sharpInstance(buffer)

    if (options.width || options.height) {
      image = image.resize(options.width, options.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
    }

    return await image
      .jpeg({ quality: options.quality || STORAGE_CONFIG.imageQuality })
      .toBuffer()
  } catch (error) {
    console.error('[Storage] Image optimization failed:', error)
    throw error
  }
}

/**
 * Generate thumbnail
 */
export async function generateThumbnail(buffer: Buffer) {
  try {
    const sharpInstance = await getSharp()
    
    return await sharpInstance(buffer)
      .resize(STORAGE_CONFIG.thumbnailSize.width, STORAGE_CONFIG.thumbnailSize.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality:  })
      .toBuffer()
  } catch (error) {
    console.error('[Storage] Thumbnail generation failed:', error)
    throw error
  }
}

/**
 * Track upload
 */
export async function trackUpload(event: H3Event, uploadData: {
  userId: string
  fileName: string
  fileSize: number
  fileType: string
  bucket: string
}) {
  try {
    const supabase = await getSupabaseClient(event)
    
    // Store upload record in database
    const { data, error } = await supabase
      .from('file_uploads')
      .insert({
        user_id: uploadData.userId,
        file_name: uploadData.fileName,
        file_size: uploadData.fileSize,
        file_type: uploadData.fileType,
        bucket: uploadData.bucket,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.warn('[Storage] Failed to track upload:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Storage] Track upload failed:', error)
    return null
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(
  event: H3Event,
  fileName: string,
  bucket: string = 'uploads'
) {
  try {
    const supabase = await getSupabaseClient(event)
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName])

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('[Storage] Delete failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * Cleanup old temporary files
 */
export async function cleanupOldTempFiles(hoursOld: number = 48): Promise<number> {
  try {
    console.log(`[Storage] Cleaning up temp files older than ${hoursOld} hours`)
    
    // TODO: Implement actual cleanup logic with Supabase Storage API
    return// Return number of files deleted
  } catch (error) {
    console.error('[Storage] Cleanup failed:', error)
    throw error
  }
}

/**
 * Get user storage usage
 */
export async function getUserStorageUsage(event: H3Event, userId: string) {
  try {
    const supabase = await getSupabaseClient(event)
    
    // Get all files for the user across all buckets
    const buckets = ['uploads', 'avatars', 'media']
    let totalSize = 0
    let fileCount = 0
    
    for (const bucket of buckets) {
      try {
        const { data: files, error } = await supabase.storage
          .from(bucket)
          .list(userId)
        
        if (!error && files) {
          fileCount += files.length
          totalSize += files.reduce((sum: number, file: any) => sum + (file.metadata?.size || 0), 0)
        }
      } catch (err) {
        console.warn(`[Storage] Could not list files in bucket ${bucket}:`, err)
      }
    }
    
    return {
      success: true,
      usage: {
        totalSize,
        fileCount,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        buckets
      }
    }
  } catch (error) {
    console.error('[Storage] Get user storage usage failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get storage usage'
    }
  }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(event: H3Event) {
  try {
    const supabase = await getSupabaseClient(event)
    
    // Get overall storage statistics
    const buckets = ['uploads', 'avatars', 'media', 'temp']
    const stats: any = {
      buckets: {},
      totalFiles: 0,
      totalSize: 0
    }
    
    for (const bucket of buckets) {
      try {
        const { data: files, error } = await supabase.storage
          .from(bucket)
          .list()
        
        if (!error && files) {
          const bucketSize = files.reduce((sum: number, file: any) => sum + (file.metadata?.size || 0), 0)
          stats.buckets[bucket] = {
            fileCount: files.length,
            size: bucketSize,
            sizeMB: (bucketSize / (1024 * 1024)).toFixed(2)
          }
          stats.totalFiles += files.length
          stats.totalSize += bucketSize
        }
      } catch (err) {
        console.warn(`[Storage] Could not get stats for bucket ${bucket}:`, err)
        stats.buckets[bucket] = {
          fileCount: 0,
          size: 0,
          sizeMB: '0.00',
          error: 'Could not access bucket'
        }
      }
    }
    
    stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2)
    stats.totalSizeGB = (stats.totalSize / (1024 * 1024 * 1024)).toFixed(2)
    
    return {
      success: true,
      stats
    }
  } catch (error) {
    console.error('[Storage] Get storage stats failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get storage stats'
    }
  }
}

/**
 * List files in a bucket
 */
export async function listFiles(
  event: H3Event,
  bucket: string = 'uploads',
  folder: string = ''
) {
  try {
    const supabase = await getSupabaseClient(event)
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder)

    if (error) throw error

    return {
      success: true,
      files: data
    }
  } catch (error) {
    console.error('[Storage] List files failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'List failed'
    }
  }
}

/**
 * Get file URL
 */
export async function getFileUrl(
  event: H3Event,
  fileName: string,
  bucket: string = 'uploads'
): Promise<string | null> {
  try {
    const supabase = await getSupabaseClient(event)
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return data.publicUrl
  } catch (error) {
    console.error('[Storage] Get URL failed:', error)
    return null
  }
}
