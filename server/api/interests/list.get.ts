// ============================================================================
// FILE 1: /server/api/interests/list.get.ts
// Get all available interests
// ============================================================================

export default defineEventHandler(async (event) => {
  try {
    const { getAdminClient } = await import('~/server/utils/supabase-server')
    const supabase = await getAdminClient()

    const { data: interests, error } = await supabase
      .from('interests')
      .select('*')
      .eq('is_active', true)
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
      data: interests || []
    }
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message
    })
  }
})
