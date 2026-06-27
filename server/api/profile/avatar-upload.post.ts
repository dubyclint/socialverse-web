import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { ProfileModel } from '~/server/models/profile'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // 1. Initialize Supabase Client early to safely perform token verification
    const supabase = await serverSupabaseClient(event)

    // 2. Strong Auth Fallback Pipeline (Prevents undefined context crashes turning into 500s)
    let authUserId: string | null = null

    // Fallback A: Check H3 Event Context
    if (event.context.user?.id || event.context.user?.user_id) {
      authUserId = event.context.user.id || event.context.user.user_id
    }

    // Fallback B: Fallback directly to Supabase Auth token verification if context is empty
    if (!authUserId) {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (!authError && authData?.user?.id) {
          authUserId = authData.user.id
        }
      } catch (authCatchError) {
        console.error('[POST /api/profile/avatar-upload] Supabase getUser fallback crashed:', authCatchError)
      }
    }

    // 3. Cleanly intercept unauthenticated traffic with an explicit 401
    if (!authUserId) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // 4. Extract and Validate Multipart Form Stream
    const files = await readMultipartFormData(event)
    if (!files?.length || !files[0]?.data) {
      throw createError({ statusCode: 400, statusMessage: 'No file provided' })
    }

    const file = files[0]
    const mime = file.type || 'application/octet-stream'
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(mime)) {
      throw createError({ statusCode: 415, statusMessage: 'Only JPEG, PNG, GIF, and WebP are allowed' })
    }

    const maxSize = 5 * 1024 * 1024 // 5MB limit
    if (file.data.length > maxSize) {
      throw createError({ statusCode: 413, statusMessage: 'File size must be <= 5MB' })
    }

    // 5. Compute Path Metrics and Object Resolution Properties
    const extFromName = file.filename?.split('.').pop()?.toLowerCase()
    const ext = extFromName && extFromName.length <= 5 ? extFromName : (mime.split('/')[1] || 'jpg')
    const objectPath = `avatars/${authUserId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // Keep storage bucket option customizable via environment
    const bucket = process.env.SUPABASE_AVATAR_BUCKET || 'profiles'

    // 6. Execute binary streams upload to Supabase Storage Bucket
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file.data, {
        contentType: mime,
        upsert: false
      })

    if (uploadError) {
      console.error('[POST /api/profile/avatar-upload] storage upload error:', uploadError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to upload avatar asset' })
    }

    // 7. Resolve the public asset access URL path
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(objectPath)
    const avatarUrl = publicUrlData?.publicUrl
    if (!avatarUrl) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to resolve avatar URL destination' })
    }

    // 8. ✅ RECONCILED: Delegate base table update transaction to ProfileModel mapping engine
    try {
      await ProfileModel.updateProfile(authUserId, {
        avatar_url: avatarUrl
      })
    } catch (modelError: any) {
      console.error('[POST /api/profile/avatar-upload] ProfileModel engine update error:', modelError.message)
      throw createError({ 
        statusCode: 500, 
        statusMessage: `Avatar uploaded but profile mapping failed: ${modelError.message}` 
      })
    }

    // 9. Readback production-ready schema values cleanly via public query view
    const { data: profile, error: readError } = await supabase
      .from('profiles')
      .select('id,user_id,username,full_name,avatar_url,bio,created_at,updated_at,location,is_verified')
      .eq('user_id', authUserId)
      .maybeSingle()

    if (readError) {
      console.error('[POST /api/profile/avatar-upload] readback view exception mapping:', readError.message, readError.details)
      throw createError({ 
        statusCode: 500, 
        statusMessage: `Avatar asset registered, but loading updated profile view properties failed: ${readError.message}` 
      })
    }

    return {
      success: true,
      data: profile,
      message: 'Avatar uploaded successfully'
    }

  } catch (error: any) {
    // Check for explicit intercept errors and let them pass out untouched
    if (error?.statusCode) throw error
    
    console.error('[POST /api/profile/avatar-upload] unhandled system runtime failure:', error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: error?.message || 'Internal Server Error' 
    })
  }
})
