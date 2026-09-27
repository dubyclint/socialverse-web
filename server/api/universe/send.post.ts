import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{
    content?: string
    country?: string
    interest?: string
    language?: string
  }>(event)

  const content = (body?.content ?? '').trim()
  if (!content) throw createError({ statusCode: 400, statusMessage: 'Message content is required' })
  if (content.length > 2000) throw createError({ statusCode: 400, statusMessage: 'Message too long' })

  const supabase = await serverSupabaseClient<Database>(event)

  const { data, error } = await supabase
    .from('universe_messages')
    .insert({
      user_id: user.id,
      content,
      country: body.country || null,
      interest: body.interest || null,
      language: body.language || 'en'
    })
    .select('id, user_id, content, country, interest, language, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, data }
})
