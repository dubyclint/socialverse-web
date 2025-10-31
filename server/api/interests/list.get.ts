// /server/api/interests/list.get.ts - NEW
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const { category } = getQuery(event)

    let query = supabase
      .from('interests')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name')

    if (category) {
      query = query.eq('category', category as string)
    }

    const { data: interests, error } = await query

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
    console.error('[Get Interests] Error:', error)
    throw error
  }
})
