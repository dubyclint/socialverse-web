// server/api/notifications.post.ts
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // 1. Authenticate the request
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  // 2. Read body
  const body = await readBody(event)
  const client = await serverSupabaseClient(event)

  // 3. Insert into database
  // Note: We use the authenticated user ID as the 'notifier_id' 
  // if not provided, for security/audit purposes.
  const { data, error } = await client
    .from('notifications')
    .insert({
      recipient_id: body.recipient_id,
      notifier_id: user.id, 
      event_type: body.event_type,
      message_text: body.message_text,
      source_id: body.source_id || null,
      is_read: false
    })
    .select()

  if (error) throw createError({ statusCode: 500, message: error.message })
  
  return { success: true, data }
})
