//FILE 2: server/api/profile/get.ts
// ISSUE: Using user client which has RLS restrictions
// FIX: Use admin client to bypass RLS and fetch profile

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  console.log('[Profile API] ============ GET PROFILE START ============')

  try {
    const userId = getQuery(event).userId as string

    if (!userId) {
      console.error('[Profile API] ❌ No user ID provided')
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    console.log('[Profile API] Fetching profile for user:', userId)

    // Use admin client to bypass RLS
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Profile API] ❌ Missing Supabase credentials')
      throw createError({
        statusCode: 500,
        statusMessage: 'Server configuration error'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('[Profile API] ✅ Admin client created')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('[Profile API] ❌ Profile fetch error:', profileError.message)
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    if (!profile) {
      console.error('[Profile API] ❌ Profile not found for user:', userId)
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    console.log('[Profile API] ✅ Profile fetched successfully')
    console.log('[Profile API] ============ GET PROFILE END ============')

    return {
      success: true,
      data: profile
    }
  } catch (error: any) {
    console.error('[Profile API] ❌ Error:', error.message)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch profile'
    })
  }
})
