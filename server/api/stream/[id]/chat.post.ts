// server/api/stream/[id]/chat.post.ts
import { serverSupabaseClient } from '#supabase/server'

interface ChatMessage {
  content: string
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const { id: streamId } = event.context.params
    const body = await readBody<ChatMessage>(event)

    if (!body.content || body.content.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Message content is required'
      })
    }

    const supabase = await serverSupabaseClient(event)

    // Save chat message
    const { data: message, error } = await supabase
      .from('stream_chat')
      .insert({
        stream_id: streamId,
        user_id: user.id,
        username: user.user_metadata?.name || 'Anonymous',
        avatar_url: user.user_metadata?.avatar_url,
        content: body.content,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Broadcast to WebSocket clients
    await broadcastToStream(streamId, {
      type: 'chat-message',
      message: message
    })

    return {
      success: true,
      data: message
    }
  } catch (error: any) {
    throw error
  }
})

async function broadcastToStream(streamId: string, data: any) {
  // Implement WebSocket broadcast logic
  // This would typically use a pub/sub system like Redis
  console.log(`Broadcasting to stream ${streamId}:`, data)
}
