// FILE: /server/api/profile/update.post.ts
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'
import { loadOwnProfile } from '~/server/utils/own-profile'
import { changeUsername, normaliseUsername, verifyPassword } from '~/server/utils/username-change'

type UserUpdate = Database['public']['Tables']['user']['Update']

interface UpdateBody {
  username?: string
  current_password?: string
  full_name?: string
  display_name?: string
  bio?: string
  avatar_url?: string | null
  cover_url?: string | null
  website?: string | null
  location?: string | null
  birth_date?: string | null
  gender?: string | null
  is_private?: boolean
}

// Postgres rejects '' for date/uuid columns; the edit form sends it for cleared fields.
const nullIfBlank = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

/**
 * Profile fields the owner may edit freely. The username goes through
 * change_username (re-authentication, rate limit, history) and the phone
 * number through /api/profile/phone.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = (await readBody<UpdateBody>(event)) ?? {}
  const supabase = await serverSupabaseClient<Database>(event)

  if (body.username !== undefined && body.username !== null) {
    const next = normaliseUsername(body.username)
    const current = await loadOwnProfile(user.id)
    if (current && next !== current.username) {
      await verifyPassword(user.email, body.current_password)
      await changeUsername(user.id, next)
    }
  }

  const updateData: UserUpdate = {}
  if (body.bio !== undefined) updateData.bio = body.bio
  if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url
  if (body.cover_url !== undefined) updateData.cover_url = body.cover_url
  if (body.website !== undefined) updateData.website = body.website
  if (body.location !== undefined) updateData.location = body.location
  if (body.birth_date !== undefined) updateData.birth_date = nullIfBlank(body.birth_date)
  if (body.gender !== undefined) updateData.gender = nullIfBlank(body.gender)
  if (body.is_private !== undefined) updateData.is_private = body.is_private

  // The edit form calls it full_name; display_name is what the feed and
  // profile cards read, so keep the two in step.
  const name = body.full_name ?? body.display_name
  if (name !== undefined) {
    const trimmed = nullIfBlank(name)
    updateData.full_name = trimmed
    updateData.display_name = trimmed
  }

  if (Object.keys(updateData).length) {
    updateData.updated_at = new Date().toISOString()
    const { error } = await supabase.from('user').update(updateData).eq('user_id', user.id)
    if (error) {
      console.error('Profile update error:', error)
      throw createError({ statusCode: 500, statusMessage: 'Failed to update profile: ' + error.message })
    }
  }

  return { success: true, profile: await loadOwnProfile(user.id) }
})
