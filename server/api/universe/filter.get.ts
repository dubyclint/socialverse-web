// server/api/universe/filter.get.ts - FILTER UNIVERSE MESSAGES
// ==============================================================

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
    const { country, interest, language = 'en', limit = 50 } = query

    const supabase = await serverSupabaseClient(event)

    // Build filter query
    let q = supabase
      .from('universe_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string))

    if (country) q = q.eq('country', country)
    if (interest) q = q.eq('interest', interest)
    if (language) q = q.eq('language', language)

    const { data: messages, error } = await q

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to filter messages',
        data: error
      })
    }

    return {
      success: true,
      data: messages || [],
      filters: {
        country: country || null,
        interest: interest || null,
        language: language || 'en'
      }
    }

  } catch (error) {
    console.error('Filter universe messages error:', error)
    throw error
  }
})
