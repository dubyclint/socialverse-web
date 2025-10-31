// /server/api/admin/interests/update.post.ts - NEW
import { serverSupabaseClient } from '#supabase/server'

interface UpdateInterestRequest {
  id: string
  name?: string
  category?: string
  description?: string
  iconUrl?: string
  isActive?: boolean
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
        statusMessage: 'Only admins can update interests'
      })
    }

    const body = await readBody<UpdateInterestRequest>(event)

    if (!body.id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Interest ID is required'
      })
    }

    const updateData: any = {}
    if (body.name) updateData.name = body.name
    if (body.category) updateData.category = body.category
    if (body.description !== undefined) updateData.description = body.description
    if (body.iconUrl !== undefined) updateData.icon_url = body.iconUrl
    if (body.isActive !== undefined) updateData.is_active = body.isActive

    const { error } = await supabase
      .from('interests')
      .update(updateData)
      .eq('id', body.id)

    if (error) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to update interest'
      })
    }

    return {
      success: true,
      message: 'Interest updated successfully'
    }
  } catch (error) {
    console.error('[Update Interest] Error:', error)
    throw error
  }
})
