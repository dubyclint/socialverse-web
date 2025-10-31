// /server/api/admin/interests/list.get.ts - NEW
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = event.context.user?.id

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', userId)
      .single()

    if (user?.role_id !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only admins can view all interests'
      })
    }

    const { data: interests, error } = await supabase
      .from('interests')
      .select('*')
      .order('category')
      .order('name')

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch interests'
      })
    }

    return {
      success: true,
      interests
    }
  } catch (error) {
    console.error('[Admin List Interests] Error:', error)
    throw error
  }
})
