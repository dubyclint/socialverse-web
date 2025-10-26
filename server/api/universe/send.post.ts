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

    if (!content || !content.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Message content is required'
      })
    }

    const supabase = await serverSupabaseClient(event)
    const messageId = crypto.randomUUID()

    // Insert message
    const { data, error } = await supabase
      .from('universe_messages')
      .insert({
        id: messageId,
        user_id: user.id,
        content: content.trim(),
        country: country || null,
        interest: interest || null,
        language: language || 'en',
        likes: 0,
        replies: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

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
        user_id: user.id,
        content,
        country: country || null,
        interest: interest || null,
        language: language || 'en',
        likes: 0,
        replies: 0,
        created_at: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('Send universe message error:', error)
    throw error
  }
})
