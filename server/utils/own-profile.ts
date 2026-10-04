import { createError } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'

const OWN_PROFILE_COLUMNS =
  'user_id,username,email,display_name,full_name,bio,avatar_url,cover_url,website,location,birth_date,gender,phone,phone_country,phone_verified,phone_verified_at,profile_completed,is_verified,is_private,role,rank,rank_points,rank_level,followers_count,following_count,posts_count,created_at,updated_at,last_seen'

/**
 * The caller's own row including private columns (email, phone) that other
 * users cannot read. Only call this with an authenticated user's id.
 */
export const loadOwnProfile = async (userId: string) => {
  const service = getServiceClient()
  const [{ data, error }, { data: pending }] = await Promise.all([
    service.from('user').select(OWN_PROFILE_COLUMNS).eq('user_id', userId).maybeSingle(),
    service.from('phone_verifications').select('phone').eq('user_id', userId).maybeSingle()
  ])
  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to fetch profile' })
  if (!data) return null
  return {
    ...data,
    id: data.user_id,
    full_name: data.display_name,
    pending_phone: pending?.phone ?? null
  }
}
