// FILE: /server/api/profile/[id].get.ts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)

    // 1. Authenticate caller
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // 2. Validate route parameter
    const userId = getRouterParam(event, 'id')

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      })
    }

    // 3. Fetch user profile record
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
    // Re-throw if already a Nuxt H3 error; otherwise wrap as 500
    if (error.statusCode) {
      throw error
    }

    console.error('Profile API unexpected error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
