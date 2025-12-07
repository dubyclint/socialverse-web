// ============================================================================
// FILE: /server/utils/storage.ts - FIXED WITH LAZY LOADING
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
      .jpeg({ quality: options.quality || 80 })
      .toBuffer()
  } catch (error) {
    console.error('[Storage] Image optimization failed:', error)
    throw error
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
