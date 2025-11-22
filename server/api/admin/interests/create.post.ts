// /server/api/admin/interests/create.post.ts - NEW
import { serverSupabaseClient } from '#supabase/server'

interface CreateInterestRequest {
  name: string
  category: string
  description?: string
  iconUrl?: string
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
        statusMessage: 'Only admins can create interests'
      })
    }

    const body = await readBody<CreateInterestRequest>(event)

    if (!body.name || !body.category) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name and category are required'
      })
    }

    const { data: interest, error } = await supabase
      .from('interests')
      .insert({
        name: body.name,
        category: body.category,
        description: body.description || null,
        icon_url: body.iconUrl || null,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to create interest'
      })
    }

    return {
      success: true,
      message: 'Interest created successfully',
      interest
    }
  } catch (error) {
    console.error('[Create Interest] Error:', error)
    throw error
  }
})
