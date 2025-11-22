// server/utils/storage.ts
// ============================================================================
// STORAGE UTILITY - File upload, download, and management
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

// ============================================================================
// TYPES
// ============================================================================

export interface UploadOptions {
  bucket: string
  path: string
  file: Buffer
  contentType: string
  metadata?: Record<string, any>
  upsert?: boolean
}

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  size?: number
  error?: string
}

export interface FileValidation {
  valid: boolean
  error?: string
  mimeType?: string
  size?: number
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const STORAGE_CONFIG = {
  buckets: {
    avatars: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    },
    posts: {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov']
    },
    'chat-media': {
      maxSize: 25 * 1024 * 1024, // 25MB
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/webp',
        'video/mp4', 'video/webm',
        'application/pdf', 'application/msword'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.pdf', '.doc', '.docx']
    },
    streams: {
      maxSize: 100 * 1024 * 1024, // 100MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'video/mp4', 'video/webm'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.mp4', '.webm']
    },
    gifts: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/png', 'image/gif', 'image/webp', 'video/mp4'],
      allowedExtensions: ['.png', '.gif', '.webp', '.mp4']
    },
    ads: {
      maxSize: 20 * 1024 * 1024, // 20MB
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/webp',
        'video/mp4', 'video/webm'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm']
    },
    moderation: {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/webp',
        'video/mp4', 'video/webm',
        'application/pdf'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.pdf']
    },
    'temp-uploads': {
      maxSize: 100 * 1024 * 1024, // 100MB
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/webp',
        'video/mp4', 'video/webm',
        'application/pdf', 'application/msword'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.pdf', '.doc', '.docx']
    }
  }
}

// ============================================================================
// FILE VALIDATION
// ============================================================================

export function validateFile(
  file: Buffer,
  filename: string,
  bucket: string,
  mimeType: string
): FileValidation {
  const config = STORAGE_CONFIG.buckets[bucket as keyof typeof STORAGE_CONFIG.buckets]

  if (!config) {
    return { valid: false, error: `Unknown bucket: ${bucket}` }
  }

  // Check file size
  if (file.length > config.maxSize) {
    return {
      valid: false,
      error: `File size exceeds limit of ${config.maxSize / 1024 / 1024}MB`
    }
  }

  // Check MIME type
  if (!config.allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} not allowed for this bucket`
    }
  }

  // Check file extension
  const ext = path.extname(filename).toLowerCase()
  if (!config.allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File extension ${ext} not allowed`
    }
  }

  return {
    valid: true,
    mimeType,
    size: file.length
  }
}

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

export async function optimizeImage(
  buffer: Buffer,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  } = {}
): Promise<Buffer> {
  const {
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 80,
    format = 'webp'
  } = options

  try {
    let transform = sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })

    if (format === 'jpeg') {
      transform = transform.jpeg({ quality, progressive: true })
    } else if (format === 'png') {
      transform = transform.png({ compressionLevel: 9 })
    } else {
      transform = transform.webp({ quality })
    }

    return await transform.toBuffer()
  } catch (error) {
    console.error('Image optimization error:', error)
    return buffer // Return original if optimization fails
  }
}

// ============================================================================
// THUMBNAIL GENERATION
// ============================================================================

export async function generateThumbnail(
  buffer: Buffer,
  size: number = 200
): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toBuffer()
  } catch (error) {
    console.error('Thumbnail generation error:', error)
    return buffer
  }
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  try {
    const { bucket, path: filePath, file, contentType, metadata, upsert = false } = options

    // Validate file
    const validation = validateFile(file, filePath, bucket, contentType)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType,
        upsert,
        metadata
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
      size: file.length
    }
  } catch (error) {
    console.error('Upload exception:', error)
    return { success: false, error: (error as any).message }
  }
}

// ============================================================================
// FILE DELETION
// ============================================================================

export async function deleteFile(bucket: string, filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete exception:', error)
    return false
  }
}

// ============================================================================
// BATCH DELETE
// ============================================================================

export async function deleteFiles(bucket: string, filePaths: string[]): Promise<number> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(filePaths)

    if (error) {
      console.error('Batch delete error:', error)
      return 0
    }

    return filePaths.length
  } catch (error) {
    console.error('Batch delete exception:', error)
    return 0
  }
}

// ============================================================================
// GET PUBLIC URL
// ============================================================================

export function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return data.publicUrl
}

// ============================================================================
// GET SIGNED URL (for private files)
// ============================================================================

export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('Signed URL error:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Signed URL exception:', error)
    return null
  }
}

// ============================================================================
// LIST FILES
// ============================================================================

export async function listFiles(
  bucket: string,
  path: string = ''
): Promise<any[]> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path)

    if (error) {
      console.error('List error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('List exception:', error)
    return []
  }
}

// ============================================================================
// STORAGE USAGE TRACKING
// ============================================================================

export async function trackUpload(
  userId: string,
  bucket: string,
  filePath: string,
  fileSize: number,
  mimeType: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('storage_usage')
      .insert({
        user_id: userId,
        bucket_id: bucket,
        file_path: filePath,
        file_size: fileSize,
        mime_type: mimeType,
        file_type: mimeType.split('/')[0]
      })

    if (error) {
      console.error('Track upload error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Track upload exception:', error)
    return false
  }
}

// ============================================================================
// GET USER STORAGE USAGE
// ============================================================================

export async function getUserStorageUsage(userId: string): Promise<{
  totalSize: number
  fileCount: number
  byBucket: Record<string, { size: number; count: number }>
}> {
  try {
    const { data, error } = await supabase
      .from('storage_usage')
      .select('bucket_id, file_size')
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (error) {
      console.error('Get usage error:', error)
      return { totalSize: 0, fileCount: 0, byBucket: {} }
    }

    const byBucket: Record<string, { size: number; count: number }> = {}
    let totalSize = 0

    data?.forEach(item => {
      if (!byBucket[item.bucket_id]) {
        byBucket[item.bucket_id] = { size: 0, count: 0 }
      }
      byBucket[item.bucket_id].size += item.file_size
      byBucket[item.bucket_id].count += 1
      totalSize += item.file_size
    })

    return {
      totalSize,
      fileCount: data?.length || 0,
      byBucket
    }
  } catch (error) {
    console.error('Get usage exception:', error)
    return { totalSize: 0, fileCount: 0, byBucket: {} }
  }
}

// ============================================================================
// GET STORAGE STATS
// ============================================================================

export async function getStorageStats(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('storage_stats')
      .select('*')

    if (error) {
      console.error('Get stats error:', error)
      return {}
    }

    return data || {}
  } catch (error) {
    console.error('Get stats exception:', error)
    return {}
  }
}

// ============================================================================
// CLEANUP OLD TEMP FILES
// ============================================================================

export async function cleanupOldTempFiles(ageInHours: number = 48): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - ageInHours * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('storage_usage')
      .select('file_path')
      .eq('bucket_id', 'temp-uploads')
      .lt('uploaded_at', cutoffDate)
      .is('deleted_at', null)

    if (error) {
      console.error('Cleanup query error:', error)
      return 0
    }

    if (!data || data.length === 0) {
      return 0
    }

    const filePaths = data.map(item => item.file_path)
    const deleted = await deleteFiles('temp-uploads', filePaths)

    // Mark as deleted in tracking table
    await supabase
      .from('storage_usage')
      .update({ deleted_at: new Date().toISOString() })
      .eq('bucket_id', 'temp-uploads')
      .lt('uploaded_at', cutoffDate)

    return deleted
  } catch (error) {
    console.error('Cleanup exception:', error)
    return 0
  }
}

export default {
  validateFile,
  optimizeImage,
  generateThumbnail,
  uploadFile,
  deleteFile,
  deleteFiles,
  getPublicUrl,
  getSignedUrl,
  listFiles,
  trackUpload,
  getUserStorageUsage,
  getStorageStats,
  cleanupOldTempFiles,
  STORAGE_CONFIG
}
