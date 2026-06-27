// FILE: /server/models/media-file.ts
// REFACTORED: Lazy-loaded Supabase

// ============================================================================
// LAZY-LOADED SUPABASE CLIENT
// ============================================================================
let supabaseInstance: any = null

async function getSupabase() {
  if (!supabaseInstance) {
    const { createClient } = await import('@supabase/supabase-js')
    supabaseInstance = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// ============================================================================
// INTERFACES
// ============================================================================
export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other'

export interface MediaFile {
  id: string
  userId: string
  filename: string
  originalName: string
  mimeType: string
  mediaType: MediaType
  size: number
  url: string
  thumbnailUrl?: string
  duration?: number
  width?: number
  height?: number
  metadata?: Record<string, any>
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// MODEL CLASS
// ============================================================================
export class MediaFileModel {
  static async createMediaFile(file: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaFile> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('media_files')
        .insert({
          ...file,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data as MediaFile
    } catch (error) {
      console.error('[MediaFileModel] Error creating media file:', error)
      throw error
    }
  }

  static async getMediaFile(id: string): Promise<MediaFile | null> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.warn('[MediaFileModel] Media file not found')
        return null
      }

      return data as MediaFile
    } catch (error) {
      console.error('[MediaFileModel] Error fetching media file:', error)
      throw error
    }
  }

  static async getUserMediaFiles(userId: string, limit = 50, offset = 0): Promise<MediaFile[]> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return (data || []) as MediaFile[]
    } catch (error) {
      console.error('[MediaFileModel] Error fetching user media files:', error)
      throw error
    }
  }

  static async deleteMediaFile(id: string): Promise<void> {
    try {
      const supabase = await getSupabase()
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('[MediaFileModel] Error deleting media file:', error)
      throw error
    }
  }

  static async updateMediaFile(id: string, updates: Partial<MediaFile>): Promise<MediaFile> {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('media_files')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MediaFile
    } catch (error) {
      console.error('[MediaFileModel] Error updating media file:', error)
      throw error
    }
  }
}
