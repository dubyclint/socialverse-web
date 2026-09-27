import { defineEventHandler, getQuery, createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'

const LIMIT = 20

/** Directory search used to start conversations and find people to follow. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const term = String(getQuery(event).q ?? '').trim()
  if (term.length < 2) return { success: true, data: [] }

  const client = await serverSupabaseClient<Database>(event)
  // Only `%` is stripped: underscores are legal in usernames, and as a LIKE
  // wildcard they merely widen the match instead of dropping the character.
  const pattern = `%${term.replace(/%/g, '')}%`

  const { data, error } = await client
    .from('user')
    .select('user_id, username, display_name, avatar_url, is_verified')
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .neq('user_id', user.id)
    .limit(LIMIT)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, data: data ?? [] }
})
