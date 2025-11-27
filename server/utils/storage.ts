// server/utils/storage.ts - LAZY LOADED SUPABASE
// ============================================================================
// STORAGE UTILITY - File upload, download, and management
// Supabase is now lazy-loaded to prevent bundling issues
// ============================================================================

import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'

let supabaseInstance: any = null

/**
 * Lazy load Supabase client
 */
async function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey)
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
  bucket: string,
  path: string,
  file: Buffer | Blob,
  contentType?: string
) {
  try {
    const supabase = await getSupabaseClient()
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
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
export async function downloadFile(bucket: string, filePath: string) {
  try {
    const supabase = await getSupabaseClient()
    
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
export async function deleteFile(bucket: string, filePath: string) {
  try {
    const supabase = await getSupabaseClient()
    
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
export async function getPublicUrl(bucket: string, filePath: string) {
  try {
    const supabase = await getSupabaseClient()
    
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
export async function listFiles(bucket: string, prefix?: string) {
  try {
    const supabase = await getSupabaseClient()
    
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
