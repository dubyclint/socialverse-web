// FILE: /server/api/storage/index.get.ts - FIXED
// ============================================================================
// STORAGE MANAGEMENT API - Get storage stats and usage
// ✅ FIXED: Get user storage usage
// ✅ FIXED: Get admin storage statistics
// ✅ FIXED: Comprehensive error handling
// ============================================================================

import {
  getUserStorageUsage,
  getStorageStats,
  STORAGE_CONFIG
} from '~/server/utils/storage'
import { serverSupabaseClient } from '#supabase/server'

interface StorageResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<StorageResponse> => {
  try {
    console.log('[Storage API] Fetching storage information...')

    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Storage API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    console.log('[Storage API] User ID:', userId)

    // ============================================================================
    // STEP 2: Get user storage usage
    // ============================================================================
    console.log('[Storage API] Getting user storage usage...')

    const userUsage = await getUserStorageUsage(userId)

    // ============================================================================
    // STEP 3: Get admin statistics (if user is admin)
    // ============================================================================
    let stats = null
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()

      if (profile?.is_admin) {
        console.log('[Storage API] User is admin, fetching statistics...')
        stats = await getStorageStats()
      }
    } catch (err: any) {
      console.warn('[Storage API] ⚠️ Could not check admin status:', err.message)
    }

    console.log('[Storage API] ✅ Storage information retrieved')

    // ============================================================================
    // STEP 4: Return response
    // ============================================================================
    return {
      success: true,
      data: {
        userUsage,
        stats,
        limits: {
          maxStoragePerUser: STORAGE_CONFIG.maxStoragePerUser,
          maxFileSize: STORAGE_CONFIG.maxFileSize,
          allowedImageTypes: STORAGE_CONFIG.allowedImageTypes,
          allowedVideoTypes: STORAGE_CONFIG.allowedVideoTypes,
          allowedAudioTypes: STORAGE_CONFIG.allowedAudioTypes,
          allowedDocumentTypes: STORAGE_CONFIG.allowedDocumentTypes
        }
      },
      message: 'Storage information retrieved successfully'
    }

  } catch (err: any) {
    console.error('[Storage API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while fetching storage information',
      data: { details: err.message }
    })
  }
})
