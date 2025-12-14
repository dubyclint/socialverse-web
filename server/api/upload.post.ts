// FILE: /server/api/upload.post.ts
// ============================================================================
// FILE UPLOAD ENDPOINT - PRODUCTION READY
// ============================================================================
// This endpoint handles file uploads with:
// - User authentication
// - File validation (size, type)
// - Supabase storage integration
// - Public URL generation
// - Comprehensive error handling
// - Detailed logging
//
// Supported file types:
// - Images: JPEG, PNG, GIF, WebP
// - Videos: MP4
//
// Max file size: 10MB
//
// Features:
// - Unique filename generation (prevents overwrites)
// - Automatic bucket selection (avatars for images, uploads for videos)
// - Public URL generation for immediate access
// - Detailed error messages
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface UploadResponse {
  success: boolean
  url?: string
  path?: string
  filename?: string
  size?: number
  type?: string
  error?: string
}

// Configuration
const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4'],
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'],
  IMAGE_BUCKET: 'avatars',
  VIDEO_BUCKET: 'uploads'
}

export default defineEventHandler(async (event): Promise<UploadResponse> => {
  try {
    console.log('[Upload API] ========================================')
    console.log('[Upload API] File upload request received')
    console.log('[Upload API] ========================================')

    // ============================================================================
    // STEP 1: Initialize Supabase client
    // ============================================================================
    console.log('[Upload API] Step 1: Initializing Supabase client...')

    const supabase = await serverSupabaseClient(event)

    if (!supabase) {
      console.error('[Upload API] ❌ Supabase client not available')
      throw createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      })
    }

    console.log('[Upload API] ✅ Supabase client initialized')

    // ============================================================================
    // STEP 2: Authenticate user
    // ============================================================================
    console.log('[Upload API] Step 2: Authenticating user...')

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      console.error('[Upload API] ❌ Authentication failed:', authError?.message)
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please login first'
      })
    }

    console.log('[Upload API] ✅ User authenticated:', user.email)

    // ============================================================================
    // STEP 3: Parse multipart form data
    // ============================================================================
    console.log('[Upload API] Step 3: Parsing multipart form data...')

    const form = await readMultipartFormData(event)

    if (!form || form.length === 0) {
      console.error('[Upload API] ❌ No file provided in request')
      throw createError({
        statusCode: 400,
        statusMessage: 'No file provided'
      })
    }

    const file = form[0]

    console.log('[Upload API] ✅ Form data parsed')

    // ============================================================================
    // STEP 4: Validate file exists and has data
    // ============================================================================
    console.log('[Upload API] Step 4: Validating file object...')

    if (!file.filename || !file.data) {
      console.error('[Upload API] ❌ Invalid file object')
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file - missing filename or data'
      })
    }

    console.log('[Upload API] ✅ File object valid')
    console.log('[Upload API] Filename:', file.filename)
    console.log('[Upload API] File size:', file.data.length, 'bytes')
    console.log('[Upload API] File type:', file.type)

    // ============================================================================
    // STEP 5: Validate file size
    // ============================================================================
    console.log('[Upload API] Step 5: Validating file size...')

    if (file.data.length === 0) {
      console.error('[Upload API] ❌ File is empty')
      throw createError({
        statusCode: 400,
        statusMessage: 'File is empty'
      })
    }

    if (file.data.length > CONFIG.MAX_FILE_SIZE) {
      const maxSizeMB = CONFIG.MAX_FILE_SIZE / (1024 * 1024)
      const fileSizeMB = (file.data.length / (1024 * 1024)).toFixed(2)
      console.error('[Upload API] ❌ File too large:', fileSizeMB, 'MB (max:', maxSizeMB, 'MB)')
      throw createError({
        statusCode: 413,
        statusMessage: `File too large (${fileSizeMB}MB). Maximum size is ${maxSizeMB}MB`
      })
    }

    console.log('[Upload API] ✅ File size valid')

    // ============================================================================
    // STEP 6: Validate file type
    // ============================================================================
    console.log('[Upload API] Step 6: Validating file type...')

    const fileType = file.type || 'application/octet-stream'

    if (!CONFIG.ALLOWED_TYPES.includes(fileType)) {
      console.error('[Upload API] ❌ Invalid file type:', fileType)
      console.log('[Upload API] Allowed types:', CONFIG.ALLOWED_TYPES.join(', '))
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid file type: ${fileType}. Allowed: images (JPEG, PNG, GIF, WebP) and videos (MP4)`
      })
    }

    console.log('[Upload API] ✅ File type valid')

    // ============================================================================
    // STEP 7: Determine bucket and validate extension
    // ============================================================================
    console.log('[Upload API] Step 7: Determining storage bucket...')

    let bucket = CONFIG.VIDEO_BUCKET
    let isImage = false

    if (CONFIG.ALLOWED_IMAGE_TYPES.includes(fileType)) {
      bucket = CONFIG.IMAGE_BUCKET
      isImage = true
      console.log('[Upload API] ✅ Image file - using bucket:', bucket)
    } else if (CONFIG.ALLOWED_VIDEO_TYPES.includes(fileType)) {
      bucket = CONFIG.VIDEO_BUCKET
      console.log('[Upload API] ✅ Video file - using bucket:', bucket)
    }

    // ============================================================================
    // STEP 8: Extract and validate file extension
    // ============================================================================
    console.log('[Upload API] Step 8: Extracting file extension...')

    const originalFilename = file.filename
    const filenameParts = originalFilename.split('.')
    let ext = filenameParts[filenameParts.length - 1]?.toLowerCase() || 'bin'

    // Validate extension matches file type
    const validExtensions: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'video/mp4': ['mp4']
    }

    const allowedExts = validExtensions[fileType] || []

    if (!allowedExts.includes(ext)) {
      console.warn('[Upload API] ⚠️ Extension mismatch - file type:', fileType, 'extension:', ext)
      // Use first allowed extension
      ext = allowedExts[0] || ext
      console.log('[Upload API] Using extension:', ext)
    }

    console.log('[Upload API] ✅ File extension:', ext)

    // ============================================================================
    // STEP 9: Generate unique filename
    // ============================================================================
    console.log('[Upload API] Step 9: Generating unique filename...')

    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const uniqueFilename = `${user.id}/${timestamp}-${random}.${ext}`

    console.log('[Upload API] ✅ Unique filename generated:', uniqueFilename)

    // ============================================================================
    // STEP 10: Upload file to Supabase Storage
    // ============================================================================
    console.log('[Upload API] Step 10: Uploading file to Supabase Storage...')
    console.log('[Upload API] Bucket:', bucket)
    console.log('[Upload API] Path:', uniqueFilename)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(uniqueFilename, file.data, {
        contentType: fileType,
        upsert: false,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('[Upload API] ❌ Upload failed:', uploadError.message)
      
      // Check for specific errors
      if (uploadError.message.includes('Bucket not found')) {
        throw createError({
          statusCode: 500,
          statusMessage: `Storage bucket '${bucket}' not found. Please create it in Supabase.`
        })
      }

      if (uploadError.message.includes('Permission denied')) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Permission denied - cannot upload to this bucket'
        })
      }

      throw createError({
        statusCode: 500,
        statusMessage: `Upload failed: ${uploadError.message}`
      })
    }

    if (!uploadData?.path) {
      console.error('[Upload API] ❌ No path returned from upload')
      throw createError({
        statusCode: 500,
        statusMessage: 'Upload succeeded but no path returned'
      })
    }

    console.log('[Upload API] ✅ File uploaded successfully')
    console.log('[Upload API] Upload path:', uploadData.path)

    // ============================================================================
    // STEP 11: Get public URL
    // ============================================================================
    console.log('[Upload API] Step 11: Generating public URL...')

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueFilename)

    if (!publicUrl) {
      console.error('[Upload API] ❌ Could not generate public URL')
      throw createError({
        statusCode: 500,
        statusMessage: 'Could not generate public URL'
      })
    }

    console.log('[Upload API] ✅ Public URL generated:', publicUrl)

    // ============================================================================
    // STEP 12: Build and return response
    // ============================================================================
    console.log('[Upload API] Step 12: Building response...')

    const response: UploadResponse = {
      success: true,
      url: publicUrl,
      path: uniqueFilename,
      filename: originalFilename,
      size: file.data.length,
      type: fileType
    }

    console.log('[Upload API] ========================================')
    console.log('[Upload API] ✅ File uploaded successfully')
    console.log('[Upload API] URL:', publicUrl)
    console.log('[Upload API] ========================================')

    return response

  } catch (error: any) {
    console.error('[Upload API] ========================================')
    console.error('[Upload API] ❌ ERROR:', error.message)
    console.error('[Upload API] Status Code:', error.statusCode)
    console.error('[Upload API] ========================================')

    // If it's already a proper error, throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, wrap it
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'File upload failed'
    })
  }
})
