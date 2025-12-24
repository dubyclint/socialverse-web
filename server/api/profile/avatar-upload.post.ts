// FILE: /server/api/profile/avatar-upload.post.ts - FIXED
// ============================================================================
// Upload avatar and update profile - FIXED: Links avatar to profile
// ✅ FIXED: Uploads file to storage
// ✅ FIXED: Updates profile.avatar_url
// ✅ FIXED: Comprehensive error handling
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface AvatarUploadResponse {
  success: boolean
  data?: any
  url?: string
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<AvatarUploadResponse> => {
  try {
    console.log('[Avatar Upload API] Processing avatar upload...')

    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    const supabase = await serverSupabaseClient(event)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('[Avatar Upload API] ❌ Unauthorized')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = session.user.id
    console.log('[Avatar Upload API] User ID:', userId)

    // ============================================================================
    // STEP 2: Read multipart form data
    // ============================================================================
    console.log('[Avatar Upload API] Reading form data...')

    const formData = await readMultipartFormData(event)
    
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data provided'
      })
    }

    const file = formData.find(part => part.name === 'file')

    if (!file || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file provided'
      })
    }

    console.log('[Avatar Upload API] File received:', {
      filename: file.filename,
      size: file.data.length,
      type: file.type
    })

    // ============================================================================
    // STEP 3: Validate file
    // ============================================================================
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type || '')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'
      })
    }

    if (file.data.length > maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File size exceeds 5MB limit'
      })
    }

    console.log('[Avatar Upload API] ✅ File validation passed')

    // ============================================================================
    // STEP 4: Upload to Supabase storage
    // ============================================================================
    console.log('[Avatar Upload API] Uploading to storage...')

    const filename = `${userId}/${Date.now()}-${file.filename}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filename, file.data, { upsert: true })

    if (uploadError) {
      console.error('[Avatar Upload API] ❌ Upload error:', uploadError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to upload file: ' + uploadError.message
      })
    }

    console.log('[Avatar Upload API] ✅ File uploaded successfully')

    // ============================================================================
    // STEP 5: Get public URL
    // ============================================================================
    console.log('[Avatar Upload API] Getting public URL...')

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename)

    console.log('[Avatar Upload API] ✅ Public URL generated:', publicUrl)

    // ============================================================================
    // STEP 6: Update profile with avatar URL
    // ============================================================================
    console.log('[Avatar Upload API] Updating profile...')

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[Avatar Upload API] ❌ Profile update error:', updateError.message)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile: ' + updateError.message
      })
    }

    console.log('[Avatar Upload API] ✅ Profile updated with avatar URL')

    // ============================================================================
    // STEP 7: Return success response
    // ============================================================================
    return {
      success: true,
      data: profile,
      url: publicUrl,
      message: 'Avatar uploaded successfully'
    }

  } catch (err: any) {
    console.error('[Avatar Upload API] ❌ Error:', err.message)
    
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred while uploading avatar',
      data: { details: err.message }
    })
  }
})
