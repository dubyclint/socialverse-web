// server/api/universe/messages.get.ts - GET UNIVERSE MESSAGES
// ===========================================================

import { verifyAuth } from '../middleware/rbac'

export default defineEventHandler(async (event) => {
  try {
    const user = await verifyAuth(event, { requireAuth: true })
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const query = getQuery(event)
    const { country, interest, language = 'en', limit = 50, offset = 0 } = query

    const supabase = await serverSupabaseClient(event)

    // Build query
    let q = supabase
      .from('universe_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1)

    if (country) q = q.eq('country', country)
    if (interest) q = q.eq('interest', interest)
    if (language) q = q.eq('language', language)

    const { data: messages, error } = await q

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch messages',
        data: error
      })
    }

    return {
      success: true,
      data: messages || [],
      total: messages?.length || 0
    }

  } catch (error) {
    console.error('Get universe messages error:', error)
    throw error
  }
})
