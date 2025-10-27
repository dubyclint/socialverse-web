// server/api/storage/delete.post.ts
// ============================================================================
// DELETE FILE API - Remove files from storage
// ============================================================================

import { deleteFile } from '~/server/utils/storage'
import { serverSupabaseClient } from '#supabase/server'

interface DeleteRequest {
  bucket: string
  path: string
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const body = await readBody<DeleteRequest>(event)

    if (!body.bucket || !body.path) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bucket and path are required'
      })
    }

    // ✅ Verify user owns the file (check if path starts with user ID)
    if (!body.path.startsWith(user.id)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only delete your own files'
      })
    }

    // ✅ Delete file
    const deleted = await deleteFile(body.bucket, body.path)

    if (!deleted) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete file'
      })
    }

    // ✅ Mark as deleted in tracking table
    const supabase = await serverSupabaseClient(event)
    await supabase
      .from('storage_usage')
      .update({ deleted_at: new Date().toISOString() })
      .eq('file_path', body.path)
      .eq('bucket_id', body.bucket)

    return {
      success: true,
      message: 'File deleted successfully'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to delete file'
    })
  }
})
