// server/api/storage/cleanup.post.ts
// ============================================================================
// CLEANUP API - Remove old temporary files (admin only)
// ============================================================================

import { cleanupOldTempFiles } from '~/server/utils/storage'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    // ✅ Check if user is admin
    const supabase = await serverSupabaseClient(event)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only admins can cleanup storage'
      })
    }

    // ✅ Cleanup old temp files (older than 48 hours)
    const deleted = await cleanupOldTempFiles(48)

    return {
      success: true,
      data: {
        filesDeleted: deleted,
        message: `Cleaned up ${deleted} old temporary files`
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Cleanup failed'
    })
  }
})
