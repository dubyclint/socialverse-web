// FILE: /server/utils/storage.ts
// ============================================================================
// STORAGE UTILITY - Updated to use lazy loading
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
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: contentType || 'application/octet-stream',
        upsert: true
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

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
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath)

    if (error) {
      throw new Error(`Download failed: ${error.message}`)
    }

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
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }

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
  } = {}
) {
  try {
    const { width = 1920, height = 1080, quality = 80 } = options

    let transform = sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })

    if (buffer.toString('utf8', 0, 3) === '\xFF\xD8\xFF') {
      // JPEG
      transform = transform.jpeg({ quality })
    } else if (buffer.toString('utf8', 0, 4) === '\x89PNG') {
      // PNG
      transform = transform.png({ quality })
    }

    return await transform.toBuffer()
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
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix)

    if (error) {
      throw new Error(`List failed: ${error.message}`)
    }

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
    
    const cutoffDate = new Date(Date.now() - ageInDays * 24 * 60 * 60 * 1000)
    
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list('temp')

    if (listError) throw listError

    const filesToDelete = (files || [])
      .filter((file: any) => new Date(file.created_at) < cutoffDate)
      .map((file: any) => `temp/${file.name}`)

    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove(filesToDelete)

      if (deleteError) throw deleteError
    }

    return filesToDelete.length
  } catch (error) {
    console.error('[Storage] Cleanup error:', error)
    throw error
  }
}
