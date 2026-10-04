// FILE: /server/api/profile/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Email and phone are private to their owner and never part of a public profile.
const PUBLIC_PROFILE_COLUMNS =
  'user_id,username,display_name,full_name,avatar_url,cover_url,bio,website,location,gender,is_verified,verified_at,phone_verified,is_private,role,rank,rank_points,rank_level,hide_rank,followers_count,following_count,posts_count,interest_tags,is_banned,created_at,updated_at,last_seen'

/**
 * Profiles are addressed by username in the UI (/profile/:username) and by
 * uuid everywhere the id is already known, so accept both.
 */
export default defineEventHandler(async (event) => {
  await requireUser(event)
  const identifier = getRouterParam(event, 'id')
  if (!identifier) throw createError({ statusCode: 400, statusMessage: 'User ID is required' })

  const supabase = await serverSupabaseClient<Database>(event)

  const query = supabase.from('user').select(PUBLIC_PROFILE_COLUMNS)
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
