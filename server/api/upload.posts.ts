// server/api/upload.post.ts
// ============================================================================
// UPLOAD API ENDPOINT - Handle file uploads with validation and optimization
// ============================================================================

import {
  uploadFile,
  optimizeImage,
  generateThumbnail,
  validateFile,
  trackUpload,
  STORAGE_CONFIG
} from '~/server/utils/storage'
import { serverSupabaseClient } from '#supabase/server'

interface UploadRequest {
  bucket: string
  optimize?: boolean
  generateThumbnail?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    // ✅ Authenticate user
    const user = await requireAuth(event)
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // ✅ Parse multipart form data
    const form = await readMultipartFormData(event)
    if (!form) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file provided'
      })
    }

    // ✅ Extract file and metadata
    const fileField = form.find(f => f.name === 'file')
    if (!fileField) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File field is required'
      })
    }

    const bucketField = form.find(f => f.name === 'bucket')
    const bucket = bucketField?.data?.toString() || 'posts'

    const optimizeField = form.find(f => f.name === 'optimize')
    const optimize = optimizeField?.data?.toString() === 'true'

    const thumbnailField = form.find(f => f.name === 'generateThumbnail')
    const generateThumbnail = thumbnailField?.data?.toString() === 'true'

    // ✅ Validate bucket
    if (!STORAGE_CONFIG.buckets[bucket as keyof typeof STORAGE_CONFIG.buckets]) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid bucket: ${bucket}`
      })
    }

    // ✅ Get file info
    const filename = fileField.filename || `file-${Date.now()}`
    const mimeType = fileField.type || 'application/octet-stream'
    let fileBuffer = fileField.data

    console.log(`[Upload] User: ${user.id}, Bucket: ${bucket}, File: ${filename}, Size: ${fileBuffer.length}`)

    // ✅ Validate file
    const validation = validateFile(fileBuffer, filename, bucket, mimeType)
    if (!validation.valid) {
      throw createError({
        statusCode: 400,
        statusMessage: validation.error
      })
    }

    // ✅ Optimize image if requested
    if (optimize && mimeType.startsWith('image/')) {
      console.log('[Upload] Optimizing image...')
      fileBuffer = await optimizeImage(fileBuffer, {
        maxWidth: 2000,
        maxHeight: 2000,
        quality: 80,
        format: 'webp'
      })
    }

    // ✅ Generate unique file path
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const cleanFilename = filename
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .toLowerCase()
    const filePath = `${user.id}/${timestamp}-${randomStr}-${cleanFilename}`

    // ✅ Upload main file
    const uploadResult = await uploadFile({
      bucket,
      path: filePath,
      file: fileBuffer,
      contentType: optimize && mimeType.startsWith('image/') ? 'image/webp' : mimeType,
      metadata: {
        uploadedBy: user.id,
        originalName: filename,
        uploadedAt: new Date().toISOString()
      }
    })

    if (!uploadResult.success) {
      throw createError({
        statusCode: 500,
        statusMessage: uploadResult.error || 'Upload failed'
      })
    }

    // ✅ Generate and upload thumbnail if requested
    let thumbnailUrl: string | null = null
    if (generateThumbnail && mimeType.startsWith('image/')) {
      console.log('[Upload] Generating thumbnail...')
      try {
        const thumbnailBuffer = await generateThumbnail(fileBuffer, 200)
        const thumbnailPath = `${user.id}/${timestamp}-${randomStr}-thumb-${cleanFilename}`

        const thumbResult = await uploadFile({
          bucket,
          path: thumbnailPath,
          file: thumbnailBuffer,
          contentType: 'image/webp',
          metadata: {
            uploadedBy: user.id,
            originalName: `thumb-${filename}`,
            uploadedAt: new Date().toISOString()
          }
        })

        if (thumbResult.success) {
          thumbnailUrl = thumbResult.url
        }
      } catch (error) {
        console.error('[Upload] Thumbnail generation failed:', error)
        // Continue without thumbnail
      }
    }

    // ✅ Track upload in database
    await trackUpload(
      user.id,
      bucket,
      filePath,
      fileBuffer.length,
      optimize && mimeType.startsWith('image/') ? 'image/webp' : mimeType
    )

    // ✅ Return success response
    console.log(`[Upload] Success: ${uploadResult.url}`)
    return {
      success: true,
      data: {
        url: uploadResult.url,
        path: uploadResult.path,
        size: uploadResult.size,
        thumbnailUrl,
        bucket,
        filename: cleanFilename,
        mimeType: optimize && mimeType.startsWith('image/') ? 'image/webp' : mimeType,
        uploadedAt: new Date().toISOString()
      }
    }

  } catch (error: any) {
    console.error('[Upload] Error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Upload failed'
    })
  }
})
