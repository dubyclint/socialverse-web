// FILE: /server/api/profile/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { countFollowGraph, loadRelationships } from '~/server/utils/social-graph'
import { checkPresence } from '~/server/utils/presence'
import { PRIVATE_PROFILE_FIELDS, isFieldPublic } from '~/shared/profile-fields'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Email and phone are private to their owner and never part of a public profile.
const PUBLIC_PROFILE_COLUMNS =
  'user_id,username,display_name,full_name,avatar_url,cover_url,bio,website,location,gender,is_verified,verified_at,phone_verified,is_private,hide_following,role,rank,rank_points,rank_level,hide_rank,posts_count,interest_tags,is_banned,created_at,updated_at,last_seen,birth_date,marital_status,university,work,religion,profile_locked,show_online,field_visibility'

/**
 * Profiles are addressed by username in the UI (/profile/:username) and by
 * uuid everywhere the id is already known, so accept both. The response carries
 * live follow/PAL counts and the viewer's relationship with the profile owner.
 */
export default defineEventHandler(async (event) => {
  const viewer = await requireUser(event)
  const identifier = getRouterParam(event, 'id')
  if (!identifier) throw createError({ statusCode: 400, statusMessage: 'User ID is required' })

  // Service client: privacy columns are not readable by end users directly;
  // per-field visibility is applied below.
  const service = getServiceClient()
  const query = service.from('user').select(PUBLIC_PROFILE_COLUMNS)
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

  const [counts, relationships] = await Promise.all([
    countFollowGraph(service, profile.user_id),
    loadRelationships(service, viewer.id, [profile.user_id])
  ])
  const relationship = relationships.get(profile.user_id)!

  const isSelf = relationship.is_self
  // A locked profile shows only basic info to anyone who is not a PAL.
  const locked = profile.profile_locked && !isSelf && relationship.pal_status !== 'friends'
  const presenceVisible = isSelf || profile.show_online
  const isOnline = presenceVisible ? await checkPresence(profile.user_id) : false

  const fieldValues: Record<string, unknown> = {
    gender: profile.gender,
    birth_date: profile.birth_date,
    location: profile.location,
    website: profile.website,
    marital_status: profile.marital_status,
    university: profile.university,
    work: profile.work,
    religion: profile.religion,
    interests: profile.interest_tags ?? []
  }
  const details: Record<string, unknown> = {}
  for (const field of PRIVATE_PROFILE_FIELDS) {
    const visible = isSelf || (!locked && isFieldPublic(profile.field_visibility, field))
    details[field] = visible ? fieldValues[field] : (field === 'interests' ? [] : null)
  }

  return {
    user_id: profile.user_id,
    id: profile.user_id,
    username: profile.username,
    display_name: profile.display_name,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    cover_url: profile.cover_url,
    bio: profile.bio,
    is_verified: profile.is_verified,
    verified_at: profile.verified_at,
    role: profile.role,
    rank: profile.hide_rank && !isSelf ? null : profile.rank,
    posts_count: profile.posts_count,
    created_at: profile.created_at,
    is_banned: profile.is_banned,
    ...details,
    interest_tags: details.interests,
    field_visibility: isSelf ? profile.field_visibility : undefined,
    profile_locked: profile.profile_locked,
    locked,
    show_online: profile.show_online,
    is_online: isOnline,
    last_seen: presenceVisible ? profile.last_seen : null,
    ...counts,
    relationship,
    following_hidden: profile.hide_following && !isSelf
  }
})
