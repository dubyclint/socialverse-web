import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    
    const { data: interests, error } = await supabase
      .from('interests')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch interests',
        data: error
      })
    }
    
    return {
      success: true,
      data: interests
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: error
    })
  }
})
