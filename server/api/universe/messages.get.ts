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

---

// server/api/universe/send.post.ts - SEND UNIVERSE MESSAGE
// ==========================================================

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

    const body = await readBody(event)
    const { content, country, interest, language = 'en' } = body

    if (!content) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Message content is required'
      })
    }

    const supabase = await serverSupabaseClient(event)
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Insert message
    const { error } = await supabase
      .from('universe_messages')
      .insert({
        id: messageId,
        user_id: user.id,
        content,
        country: country || null,
        interest: interest || null,
        language: language || 'en',
        created_at: new Date().toISOString()
      })

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to send message',
        data: error
      })
    }

    return {
      success: true,
      data: {
        id: messageId,
        userId: user.id,
        content,
        country,
        interest,
        language,
        timestamp: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('Send universe message error:', error)
    throw error
  }
})

---

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
