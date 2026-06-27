// FILE: /server/api/storage/delete.post.ts - FIXED
// ============================================================================
// DELETE FILE API - Delete file and update storage usage
// ✅ FIXED: Delete file from storage
// ✅ FIXED: Remove file tracking
// ✅ FIXED: Update storage usage
// ✅ FIXED: Comprehensive error handling
// ============================================================================

import { deleteFile } from '~/server/utils/storage'
import { serverSupabaseClient } from '#supabase/server'

interface DeleteFileRequest {
  bucket: string
  path: string
}

interface DeleteFileResponse {
  success: boolean
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<DeleteFileResponse> => {
  try {
    console.log('[Delete File API] Processing file deletion...')

    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Delete File API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    console.log('[Delete File API] User ID:', userId)

    // ============================================================================
    // STEP 2: Read request body
    // ============================================================================
    const body = await readBody<DeleteFileRequest>(event)
    
    if (!body.bucket || !body.path) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bucket and path are required'
      })
    }

    console.log('[Delete File API] Delete request:', {
      bucket: body.bucket,
      path: body.path
    })

    // ============================================================================
    // STEP 3: Delete file
    // ============================================================================
    console.log('[Delete File API] Deleting file...')

    const result = await deleteFile(userId, body.bucket, body.path)

    console.log('[Delete File API] ✅ File deleted successfully')

    // ============================================================================
    // STEP 4: Return response
    // ============================================================================
    return {
      success: true,
      message: 'File deleted successfully'
    }

  } catch (err: any) {
    console.error('[Delete File API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while deleting file',
      data: { details: err.message }
    })
  }
})
