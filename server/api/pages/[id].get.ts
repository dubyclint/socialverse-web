import { getOptionalUser } from '~/server/utils/auth'
import { getPageRole } from '~/server/utils/actor'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadPage } from '~/server/utils/pages'

export default defineEventHandler(async (event) => {
  const page = await loadPage(getRouterParam(event, 'id') ?? '')
  const viewer = await getOptionalUser(event)
  const ownerQuery = getServiceClient().from('user').select('user_id, username, display_name, full_name, avatar_url, is_verified, verified_type').eq('user_id', page.created_by_user_id).maybeSingle()
  let viewerRole = null
  let isFollowing = false
  if (viewer) {
    const [role, { data: follow }] = await Promise.all([
      getPageRole(page.id, viewer.id),
      getServiceClient().from('page_follows').select('page_id').eq('page_id', page.id).eq('user_id', viewer.id).maybeSingle()
    ])
    viewerRole = role
    isFollowing = Boolean(follow)
  }
  const { data: owner } = await ownerQuery
  return { ...page, owner, viewer_role: viewerRole, is_following: isFollowing }
})
