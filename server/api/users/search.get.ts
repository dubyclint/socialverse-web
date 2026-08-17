import { defineEventHandler, getQuery, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

const LIMIT = 20

/** Directory search used to start conversations and find people to follow. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const term = String(getQuery(event).q ?? '').trim()
  if (term.length < 2) return { success: true, data: [] }

  const client = await serverSupabaseClient<Database>(event)
  const pattern = `%${term.replace(/[%_]/g, '')}%`

  const { data, error } = await client
    .from('user')
    .select('user_id, username, display_name, avatar_url, is_verified')
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .neq('user_id', user.id)
    .limit(LIMIT)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, data: data ?? [] }
})
