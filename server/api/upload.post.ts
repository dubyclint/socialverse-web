// FILE: /server/api/upload.post.ts - FIXED
// ============================================================================
// FILE UPLOAD ENDPOINT - PRODUCTION READY
// ✅ FIXED: File validation
// ✅ FIXED: Storage tracking
// ✅ FIXED: Quota enforcement
// ✅ FIXED: Comprehensive error handling
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import {
  STORAGE_CONFIG,
  validateFile,
  generateUniqueFilename,
  trackUpload,
  getUserStorageUsage,
  getFileTypeCategory
} from '~/server/utils/storage'

interface UploadResponse {
  success: boolean
  data?: any
  url?: string
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<UploadResponse> => {
  try {
    console.log('[Upload API] ========================================')
    console.log('[Upload API] File upload request received')
    console.log('[Upload API] ========================================')

    // ===========================================================================
    // STEP 1: Authentication
    // ============================================================================
    console.log('[Upload API] Step 1: Authenticating...')

    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Upload API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    console.log('[Upload API] ✅ User authenticated:', userId)

    // ============================================================================
    // STEP 2: Read multipart form data
    // ============================================================================
    console.log('[Upload API] Step 2: Reading form data...')

    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data provided'
      })
    }

    const file = formData.find(part => part.name === 'file')
    const bucketField = formData.find(part => part.name === 'bucket')
    const bucket = bucketField?.data?.toString() || STORAGE_CONFIG.buckets.uploads

    if (!file || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file provided'
      })
    }

    console.log('[Upload API] ✅ Form data read:', {
      filename: file.filename,
      size: file.data.length,
      type: file.type,
      bucket
    })

    // ============================================================================
    // STEP 3: Validate file
    // ============================================================================
    console.log('[Upload API] Step 3: Validating file...')

    const allowedTypes = [
      ...STORAGE_CONFIG.allowedImageTypes,
      ...STORAGE_CONFIG.allowedVideoTypes,
      ...STORAGE_CONFIG.allowedAudioTypes,
      ...STORAGE_CONFIG.allowedDocumentTypes
    ]

    const validation = validateFile(file, allowedTypes, STORAGE_CONFIG.maxFileSize)

    if (!validation.valid) {
      console.error('[Upload API] ❌ File validation failed:', validation.error)
      throw createError({
        statusCode: 400,
        statusMessage: validation.error || 'File validation failed'
      })
    }

    console.log('[Upload API] ✅ File validation passed')

    // ============================================================================
    // STEP 4: Check storage quota
    // ============================================================================
    console.log('[Upload API] Step 4: Checking storage quota...')

    const usage = await getUserStorageUsage(userId)

    if (usage.isAtLimit) {
      console.error('[Upload API] ❌ Storage quota exceeded')
      throw createError({
        statusCode: 413,
        statusMessage: 'Storage quota exceeded'
      })
    }

    if (usage.remaining < file.data.length) {
      console.error('[Upload API] ❌ Insufficient storage space')
      throw createError({
        statusCode: 413,
        statusMessage: `Insufficient storage space. Need ${(file.data.length / 1024 / 1024).toFixed(2)}MB but only ${(usage.remaining / 1024 / 1024).toFixed(2)}MB available`
      })
    }

    console.log('[Upload API] ✅ Storage quota check passed')

    // ============================================================================
    // STEP 5: Upload to Supabase storage
    // ============================================================================
    console.log('[Upload API] Step 5: Uploading to storage...')

    const filename = generateUniqueFilename(userId, file.filename || 'file')

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, file.data, { upsert: true })

    if (uploadError) {
      console.error('[Upload API] ❌ Upload error:', uploadError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to upload file: ' + uploadError.message
      })
    }

    console.log('[Upload API] ✅ File uploaded successfully')

    // ============================================================================
    // STEP 6: Get public URL
    // ============================================================================
    console.log('[Upload API] Step 6: Getting public URL...')

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename)

    console.log('[Upload API] ✅ Public URL generated:', publicUrl)

    // ============================================================================
    // STEP 7: Track upload
    // ============================================================================
    console.log('[Upload API] Step 7: Tracking upload...')

    const fileType = getFileTypeCategory(file.type || '')

    const tracked = await trackUpload(
      userId,
      filename,
      file.data.length,
      file.type || 'application/octet-stream',
      bucket,
      {
        originalFilename: file.filename,
        category: fileType
      }
    )

    console.log('[Upload API] ✅ Upload tracked')

    // ============================================================================
    // STEP 8: Return success response
    // ============================================================================
    console.log('[Upload API] ✅ Upload completed successfully')

    return {
      success: true,
      data: {
        id: tracked.id,
        filename: file.filename,
        size: file.data.length,
        type: file.type,
        bucket,
        url: publicUrl,
        uploadedAt: tracked.uploaded_at
      },
      url: publicUrl,
      message: 'File uploaded successfully'
    }

  } catch (err: any) {
    console.error('[Upload API] ❌ Unexpected error:', err)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred during upload',
      data: { details: err.message }
    })
  }
})
