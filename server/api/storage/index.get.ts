// server/api/storage/index.get.ts
// ============================================================================
// STORAGE MANAGEMENT API - Get storage stats and usage
// ============================================================================

import {
  getUserStorageUsage,
  getStorageStats
} from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    // Get user's storage usage
    const userUsage = await getUserStorageUsage(user.id)

    // Get overall storage stats (admin only)
    let stats = null
    const supabase = await serverSupabaseClient(event)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      stats = await getStorageStats()
    }

    return {
      success: true,
      data: {
        userUsage,
        stats,
        limits: {
          maxStoragePerUser: 5 * 1024 * 1024 * 1024, // 5GB
          maxFileSize: 100 * 1024 * 1024, // 100MB
          maxFilesPerUser: 1000
        }
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get storage info'
    })
  }
})
