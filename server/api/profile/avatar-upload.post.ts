// FILE: /server/api/profile/avatar-upload.post.ts - CREATE
// Upload avatar to Supabase Storage
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = event.context.user?.id

    // STEP 1: VERIFY AUTHENTICATION
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // STEP 2: GET FORM DATA
    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file provided'
      })
    }

    const file = formData.find(f => f.name === 'file')
    if (!file) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File is required'
      })
    }

    // STEP 3: VALIDATE FILE
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File size must be less than 5MB'
      })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type || '')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only JPEG, PNG, and WebP images are allowed'
      })
    }

    // STEP 4: GENERATE FILENAME
    const timestamp = Date.now()
    const ext = file.filename?.split('.').pop() || 'jpg'
    const filename = `${userId}-${timestamp}.${ext}`
    const path = `avatars/${userId}/${filename}`

    // STEP 5: UPLOAD TO STORAGE
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file.data, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('[AvatarUpload] Upload error:', uploadError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to upload avatar'
      })
    }

    // STEP 6: GET PUBLIC URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    const avatarUrl = publicUrlData.publicUrl

    // STEP 7: RETURN SUCCESS
    return {
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl
    }

  } catch (error) {
    console.error('[AvatarUpload] Error:', error)
    throw error
  }
})
