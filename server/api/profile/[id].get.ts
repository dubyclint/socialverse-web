// FILE: /server/api/profile/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Profiles are addressed by username in the UI (/profile/:username) and by
 * uuid everywhere the id is already known, so accept both.
 */
export default defineEventHandler(async (event) => {
  const caller = await serverSupabaseUser(event)
  if (!caller) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const identifier = getRouterParam(event, 'id')
  if (!identifier) throw createError({ statusCode: 400, statusMessage: 'User ID is required' })

  const supabase = await serverSupabaseClient<Database>(event)

  const query = supabase.from('user').select('*')
  const { data: profile, error } = await (
    UUID_RE.test(identifier)
      ? query.eq('user_id', identifier)
      : query.ilike('username', identifier)
  ).maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  return profile
})
