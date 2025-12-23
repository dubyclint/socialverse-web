import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const query = getQuery(event)
    const limit = Math.min(parseInt(query.limit as string) || 5, 20)
    const supabase = await serverSupabaseClient(event)

    const { data, error } = await supabase.rpc('get_suggested_users', {
      user_id_param: user.id,
      limit_param: limit
    })

    if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to fetch suggested users' })

    return { success: true, data: data || [], total: data?.length || 0 }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch suggested users' })
  }
})
