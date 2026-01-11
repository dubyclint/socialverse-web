// ============================================================================
// FILE: /server/api/profile/avatar-upload.post.ts - FIXED VERSION
// ============================================================================
// ✅ FIXED: Uses admin client with service role key for proper permissions
// ✅ FIXED: Correct table 'user' and column 'user_id'
// ✅ FIXED: Proper error handling and validation
// ============================================================================

interface AvatarUploadResponse {
  success: boolean
  data?: any
  url?: string
  message?: string
  error?: string
}

export default defineEventHandler(async (event): Promise<AvatarUploadResponse> => {
  try {
    console.log('[Avatar Upload API] ============ START ============')

    // ============================================================================
    // STEP 1: Authentication - Get user from middleware context
    // ============================================================================
    console.log('[Avatar Upload API] STEP 1: Authenticating user...')
    
    const user = event.context.user
    
    if (!user || !user.id) {
      console.error('[Avatar Upload API] ❌ Unauthorized - No user in context')
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please log in'
      })
    }

    const userId = user.id
    console.log('[Avatar Upload API] ✅ User authenticated:', userId)

    // ============================================================================
    // STEP 2: Read multipart form data
    // ============================================================================
    console.log('[Avatar Upload API] STEP 2: Reading form data...')

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

    console.log('[Avatar Upload API] ✅ File received:', {
      filename: file.filename,
      size: file.data.length,
      type: file.type
    })

    // ============================================================================
    // STEP 3: Validate file
    // ============================================================================
    console.log('[Avatar Upload API] STEP 3: Validating file...')

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type || '')) {
      console.error('[Avatar Upload API] ❌ Invalid file type:', file.type)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'
      })
    }

    if (file.data.length > maxSize) {
      console.error('[Avatar Upload API] ❌ File size exceeds limit:', file.data.length)
      throw createError({
        statusCode: 400,
        statusMessage: 'File size exceeds 5MB limit'
      })
    }

    console.log('[Avatar Upload API] ✅ File validation passed')

    // ============================================================================
    // STEP 4: Upload to Supabase storage using ADMIN CLIENT
    // ============================================================================
    console.log('[Avatar Upload API] STEP 4: Uploading to storage with admin privileges...')

    // ✅ FIXED: Import and use admin client instead of user client
    const { getAdminClient } = await import('~/server/utils/supabase-server')
    const supabase = await getAdminClient()

    console.log('[Avatar Upload API] ✅ Admin client obtained')

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
    console.log('[Avatar Upload API] STEP 5: Getting public URL...')

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename)

    console.log('[Avatar Upload API] ✅ Public URL generated:', publicUrl)

    // ============================================================================
    // STEP 6: Update user profile with avatar URL using ADMIN CLIENT
    // ============================================================================
    console.log('[Avatar Upload API] STEP 6: Updating user profile with admin privileges...')

    // ✅ CORRECT: Table 'user', column 'user_id', using admin client
    const { data: profile, error: updateError } = await supabase
      .from('user')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[Avatar Upload API] ❌ Profile update error:', updateError.message)
      console.error('[Avatar Upload API] Error details:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile: ' + updateError.message
      })
    }

    if (!profile) {
      console.error('[Avatar Upload API] ❌ Profile not found after update')
      throw createError({
        statusCode: 500,
        statusMessage: 'Profile update failed - no data returned'
      })
    }

    console.log('[Avatar Upload API] ✅ Profile updated with avatar URL')

    // ============================================================================
    // STEP 7: Return success response
    // ============================================================================
    console.log('[Avatar Upload API] ✅ Avatar upload completed successfully')
    console.log('[Avatar Upload API] ============ END ============')

    return {
      success: true,
      data: profile,
      url: publicUrl,
      message: 'Avatar uploaded successfully'
    }

  } catch (err: any) {
    console.error('[Avatar Upload API] ============ ERROR ============')
    console.error('[Avatar Upload API] Error type:', err?.constructor?.name)
    console.error('[Avatar Upload API] Error message:', err?.message)
    console.error('[Avatar Upload API] Error details:', err?.data || 'N/A')
    console.error('[Avatar Upload API] ============ END ERROR ============')
    
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
