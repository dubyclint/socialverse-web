// /server/api/admin/interests/delete.post.ts - NEW
import { serverSupabaseClient } from '#supabase/server'

interface DeleteInterestRequest {
  id: string
}

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
        statusMessage: 'Only admins can delete interests'
      })
    }

    const body = await readBody<DeleteInterestRequest>(event)

    if (!body.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Interest ID is required'
      })
    }

    const { error } = await supabase
      .from('interests')
      .delete()
      .eq('id', body.id)

    if (error) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to delete interest'
      })
    }

    return {
      success: true,
      message: 'Interest deleted successfully'
    }
  } catch (error) {
    console.error('[Delete Interest] Error:', error)
    throw error
  }
})
