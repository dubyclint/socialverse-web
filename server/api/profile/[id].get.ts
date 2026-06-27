// FILE: /server/api/profile/[id].get.ts
// CORRECTED VERSION

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = getRouterParam(event, 'id')

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // ✅ FIXED: Changed from 'profiles' to 'user'
    const { data: profile, error } = await supabase
      .from('user')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    return profile

  } catch (error: any) {
    console.error('Profile API error:', error)
    throw error
  }
})
