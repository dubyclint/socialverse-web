// ============================================================================
// FILE 5: /server/utils/storage.ts - COMPLETE FIXED VERSION
// ============================================================================
// STORAGE UTILITY - Supabase Storage Integration
// FIXED: sharp package is now properly imported
// ============================================================================

import type { H3Event } from 'h3'
import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { getDBAdmin } from './db-helpers'

let supabaseInstance: any = null

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
 * Upload file to Supabase storage
 */
export async function uploadFile(
  event: H3Event,
  bucket: string,
  filePath: string,
  file: Buffer | Blob,
  contentType?: string
) {
  try {
    const supabase = await getSupabaseClient(event)
    
    console.log(`[Storage] Uploading file to ${bucket}/${filePath}`)

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: contentType || 'application/octet-stream',
        upsert: true
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    console.log(`[Storage] File uploaded successfully: ${filePath}`)
    return data
  } catch (error) {
    console.error('[Storage] Upload error:', error)
    throw error
  }
}

/**
 * Download file from Supabase storage
 */
export async function downloadFile(event: H3Event, bucket: string, filePath: string) {
  try {
    const supabase = await getSupabaseClient(event)
    
    console.log(`[Storage] Downloading file from ${bucket}/${filePath}`)

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath)

    if (error) {
      throw new Error(`Download failed: ${error.message}`)
    }

    console.log(`[Storage] File downloaded successfully: ${filePath}`)
    return data
  } catch (error) {
    console.error('[Storage] Download error:', error)
    throw error
  }
}

/**
 * Delete file from Supabase storage
 */
export async function deleteFile(event: H3Event, bucket: string, filePath: string) {
  try {
    const supabase = await getSupabaseClient(event)
    
    console.log(`[Storage] Deleting file from ${bucket}/${filePath}`)

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }

    console.log(`[Storage] File deleted successfully: ${filePath}`)
    return true
  } catch (error) {
    console.error('[Storage] Delete error:', error)
    throw error
  }
}

/**
 * Get public URL for file
 */
export async function getPublicUrl(event: H3Event, bucket: string, filePath: string) {
  try {
    const supabase = await getSupabaseClient(event)
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    console.log(`[Storage] Public URL generated: ${data.publicUrl}`)
    return data.publicUrl
  } catch (error) {
    console.error('[Storage] Get public URL error:', error)
    throw error
  }
}

/**
 * Compress image using sharp
 */
export async function compressImage(
  buffer: Buffer,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  } = {}
) {
  try {
    const { width = 1920, height = 1080, quality = 80, format = 'jpeg' } = options

    console.log(`[Storage] Compressing image: ${width}x${height}, quality: ${quality}`)

    let transform = sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })

    // Apply format-specific compression
    if (format === 'jpeg') {
      transform = transform.jpeg({ quality, progressive: true })
    } else if (format === 'png') {
      transform = transform.png({ quality })
    } else if (format === 'webp') {
      transform = transform.webp({ quality })
    }

    const compressed = await transform.toBuffer()
    console.log(`[Storage] Image compressed: ${buffer.length} -> ${compressed.length} bytes`)
    
    return compressed
  } catch (error) {
    console.error('[Storage] Image compression error:', error)
    throw error
  }
}

/**
 * List files in bucket
 */
export async function listFiles(event: H3Event, bucket: string, prefix?: string) {
  try {
    const supabase = await getSupabaseClient(event)
    
    console.log(`[Storage] Listing files in ${bucket}${prefix ? `/${prefix}` : ''}`)

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix)

    if (error) {
      throw new Error(`List failed: ${error.message}`)
    }

    console.log(`[Storage] Found ${data?.length || 0} files`)
    return data
  } catch (error) {
    console.error('[Storage] List error:', error)
    throw error
  }
}

/**
 * Track upload for analytics
 */
export async function trackUpload(
  event: H3Event,
  userId: string,
  fileName: string,
  fileSize: number
) {
  try {
    const supabase = await getSupabaseClient(event)
    
    const { error } = await supabase
      .from('upload_logs')
      .insert({
        user_id: userId,
        file_name: fileName,
        file_size: fileSize,
        uploaded_at: new Date().toISOString()
      })

    if (error) throw error
    console.log(`[Storage] Upload tracked: ${fileName} (${fileSize} bytes)`)
  } catch (error) {
    console.error('[Storage] Track upload error:', error)
    // Don't throw - tracking failure shouldn't block upload
  }
}

/**
 * Cleanup old temporary files
 */
export async function cleanupOldTempFiles(event: H3Event, bucket: string, ageInDays: number = 7) {
  try {
    const supabase = await getSupabaseClient(event)
    
    console.log(`[Storage] Cleaning up files older than ${ageInDays} days`)

    const cutoffDate = new Date(Date.now() - ageInDays * 24 * 60 * 60 * 1000)
    
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list('temp')

    if (listError) throw listError

    const filesToDelete = (files || [])
      .filter((file: any) => new Date(file.created_at) < cutoffDate)
      .map((file: any) => `temp/${file.name}`)

    if (filesToDelete.length === 0) {
      console.log('[Storage] No old files to cleanup')
      return { deleted: 0 }
    }

    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove(filesToDelete)

    if (deleteError) throw deleteError

    console.log(`[Storage] Cleaned up ${filesToDelete.length} old files`)
    return { deleted: filesToDelete.length }
  } catch (error) {
    console.error('[Storage] Cleanup error:', error)
    throw error
  }
}

/**
 * Get file size
 */
export async function getFileSize(event: H3Event, bucket: string, filePath: string): Promise<number> {
  try {
    const supabase = await getSupabaseClient(event)
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.dirname(filePath))

    if (error) throw error

    const file = data?.find((f: any) => f.name === path.basename(filePath))
    return file?.metadata?.size || 0
  } catch (error) {
    console.error('[Storage] Get file size error:', error)
    throw error
  }
}

/**
 * Copy file within storage
 */
export async function copyFile(
  event: H3Event,
  bucket: string,
  sourcePath: string,
  destinationPath: string
) {
  try {
    const supabase = await getSupabaseClient(event)
    
    console.log(`[Storage] Copying ${sourcePath} to ${destinationPath}`)

    // Download source file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(sourcePath)

    if (downloadError) throw downloadError

    // Upload to destination
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(destinationPath, fileData, { upsert: true })

    if (uploadError) throw uploadError

    console.log(`[Storage] File copied successfully`)
    return true
  } catch (error) {
    console.error('[Storage] Copy file error:', error)
    throw error
  }
}
