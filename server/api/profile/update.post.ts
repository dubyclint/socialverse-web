// FILE: /server/api/profile/update.post.ts
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~/server/utils/auth'
import { loadOwnProfile } from '~/server/utils/own-profile'
import { changeUsername, normaliseUsername, verifyPassword } from '~/server/utils/username-change'
import { MARITAL_STATUSES, sanitiseFieldVisibility } from '~/shared/profile-fields'

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
  hide_following?: boolean
  marital_status?: string | null
  university?: string | null
  work?: string | null
  religion?: string | null
  interest_tags?: string[]
  profile_locked?: boolean
  show_online?: boolean
  field_visibility?: Record<string, boolean>
}

const FULL_NAME_LOCK_DAYS = 120
const MAX_INTERESTS = 20
const MAX_FIELD_LENGTH = 120

const boundedText = (value: unknown, field: string): string | null => {
  const text = nullIfBlank(value)
  if (text && text.length > MAX_FIELD_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: `${field} must be at most ${MAX_FIELD_LENGTH} characters` })
  }
  return text
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
  if (typeof body.hide_following === 'boolean') updateData.hide_following = body.hide_following
  if (typeof body.profile_locked === 'boolean') updateData.profile_locked = body.profile_locked
  if (typeof body.show_online === 'boolean') updateData.show_online = body.show_online
  if (body.university !== undefined) updateData.university = boundedText(body.university, 'University')
  if (body.work !== undefined) updateData.work = boundedText(body.work, 'Work')
  if (body.religion !== undefined) updateData.religion = boundedText(body.religion, 'Religion')
  if (body.marital_status !== undefined) {
    const status = nullIfBlank(body.marital_status)
    if (status && !(MARITAL_STATUSES as readonly string[]).includes(status)) {
      throw createError({ statusCode: 400, statusMessage: 'Unknown marital status' })
    }
    updateData.marital_status = status
  }
  if (body.field_visibility !== undefined) updateData.field_visibility = sanitiseFieldVisibility(body.field_visibility)
  if (Array.isArray(body.interest_tags)) {
    const tags = [...new Set(body.interest_tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 40))]
    if (tags.length > MAX_INTERESTS) {
      throw createError({ statusCode: 400, statusMessage: `Choose at most ${MAX_INTERESTS} interests` })
    }
    updateData.interest_tags = tags
  }

  // The edit form calls it full_name; display_name is what the feed and
  // profile cards read, so keep the two in step.
  const name = body.full_name ?? body.display_name
  if (name !== undefined) {
    const trimmed = nullIfBlank(name)
    const { data: current } = await supabase
      .from('user')
      .select('display_name, full_name, full_name_changed_at')
      .eq('user_id', user.id)
      .maybeSingle()
    const currentName = current?.display_name || current?.full_name || null

    if (trimmed !== currentName) {
      if (!trimmed) throw createError({ statusCode: 400, statusMessage: 'Full name is required' })
      const lastChange = current?.full_name_changed_at ? new Date(current.full_name_changed_at) : null
      if (lastChange) {
        const nextAllowed = new Date(lastChange.getTime() + FULL_NAME_LOCK_DAYS * 86_400_000)
        if (nextAllowed > new Date()) {
          throw createError({
            statusCode: 429,
            statusMessage: `You can change your full name again on ${nextAllowed.toDateString()}`,
            data: { next_allowed_at: nextAllowed.toISOString() }
          })
        }
      }
      updateData.full_name = trimmed
      updateData.display_name = trimmed
    }
  }

  if (Object.keys(updateData).length) {
    updateData.updated_at = new Date().toISOString()
    const { error } = await supabase.from('user').update(updateData).eq('user_id', user.id)
    if (error) {
      console.error('Profile update error:', error)
      if (error.code === 'P0001') throw createError({ statusCode: 429, statusMessage: error.message })
      throw createError({ statusCode: 500, statusMessage: 'Failed to update profile: ' + error.message })
    }
  }

  return { success: true, profile: await loadOwnProfile(user.id) }
})
