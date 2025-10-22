import { supabase } from '~/server/db'
import { AuditLogModel } from '~/server/models/AuditLog'

interface UniverseMessageCreate {
  content: string
}

export default defineEventHandler(async (event) => {
  try {
    const method = event.node.req.method

    if (method === 'GET') {
      return await handleGetMessages(event)
    } else if (method === 'POST') {
      return await handleCreateMessage(event)
    } else {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      })
    }
  } catch (error: any) {
    console.error('Universe messages error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error'
    })
  }
})

async function handleGetMessages(event: any) {
  const query = getQuery(event)
  const { limit = 50, offset = 0 } = query

  try {
    const { data: messages, error, count } = await supabase
      .from('universe_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (error) {
      throw error
    }

    return {
      success: true,
      messages: messages || [],
      total: count || 0,
      limit: Number(limit),
      offset: Number(offset)
    }
  } catch (error: any) {
    console.error('Get messages error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch messages'
    })
  }
}

async function handleCreateMessage(event: any) {
  const body = await readBody<UniverseMessageCreate>(event)

  if (!body.content || !body.content.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Message content is required'
    })
  }

  if (body.content.length > 5000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Message is too long (max 5000 characters)'
    })
  }

  try {
    // Get current user from session (you'll need to implement this based on your auth)
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      })
    }

    const { data: message, error } = await supabase
      .from('universe_messages')
      .insert([
        {
          user_id: user.id,
          username: user.user_metadata?.username || user.email,
          avatar: user.user_metadata?.avatar,
          content: body.content,
          created_at: new Date().toISOString(),
          likes: 0,
          replies: 0
        }
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log audit trail
    await AuditLogModel.create({
      type: 'UNIVERSE_MESSAGE_POSTED',
      userId: user.id,
      feature: 'universe',
      result: 'ALLOWED',
      context: {
        messageId: message.id,
        contentLength: body.content.length
      },
      policies: []
    })

    return {
      success: true,
      message,
      messageId: message.id
    }
  } catch (error: any) {
    console.error('Create message error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to create message'
    })
  }
}
