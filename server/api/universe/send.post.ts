// server/api/universe/send.post.ts - SEND UNIVERSE MESSAGE
// ==========================================================

import { verifyAuth } from '../middleware/rbac'

import { serverSupabaseClient } from '#supabase/server'

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

    // Insert message
    const { error } = await supabase
      .from('universe_messages')
      .insert({
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
