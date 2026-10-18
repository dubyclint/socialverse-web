import { getQuery } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { requireStaff } from '~/server/utils/staff'

interface RequestRow {
  id: string
  user_id: string
  page_id: string | null
  category: string | null
  reason: string | null
  evidence: unknown
  status: string
  review_note: string | null
  created_at: string
  updated_at: string
}

/** Verification requests (users and Pages) plus currently verified accounts. */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'verification')
  const status = String(getQuery(event).status ?? 'pending')
  const service = getServiceClient()

  let query = service.from('badge_requests')
    .select('id, user_id, page_id, category, reason, evidence, status, review_note, created_at, updated_at')
    .order('created_at', { ascending: status === 'pending' })
    .limit(200)
  if (status !== 'all') query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const rows = (data ?? []) as RequestRow[]

  const userIds = [...new Set(rows.map(r => r.user_id))]
  const pageIds = [...new Set(rows.map(r => r.page_id).filter((id): id is string => !!id))]
  const [{ data: users }, { data: pages }, { data: verifiedUsers }, { data: verifiedPages }] = await Promise.all([
    userIds.length
      ? service.from('user').select('user_id, username, display_name, full_name, email, avatar_url, is_verified, verified_type, followers_count, posts_count, created_at').in('user_id', userIds)
      : Promise.resolve({ data: [] }),
    pageIds.length
      ? service.from('pages').select('id, name, handle, avatar_url, category, followers_count, is_verified, verified_type').in('id', pageIds)
      : Promise.resolve({ data: [] }),
    service.from('user').select('user_id, username, display_name, avatar_url, verified_type, verified_at').eq('is_verified', true).order('verified_at', { ascending: false }).limit(200),
    service.from('pages').select('id, name, handle, avatar_url, verified_type, verified_at').eq('is_verified', true).order('verified_at', { ascending: false }).limit(200)
  ])
  const userMap = new Map((users ?? []).map(u => [u.user_id, u]))
  const pageMap = new Map((pages ?? []).map(p => [p.id, p]))

  const signed = await Promise.all(rows.map(async (r) => {
    const evidence = (r.evidence ?? {}) as { links?: string[], documents?: { name?: string, path?: string, url?: string }[] }
    const documents = await Promise.all((evidence.documents ?? []).map(async (d) => {
      if (!d.path) return { name: d.name ?? 'Document', url: d.url ?? null }
      const { data } = await service.storage.from('verification').createSignedUrl(d.path, 3600)
      return { name: d.name ?? 'Document', url: data?.signedUrl ?? null }
    }))
    return { links: evidence.links ?? [], documents }
  }))

  return {
    requests: rows.map((r, i) => ({
      ...r,
      evidence: signed[i],
      user: userMap.get(r.user_id) ?? null,
      page: r.page_id ? pageMap.get(r.page_id) ?? null : null
    })),
    verified: [
      ...(verifiedUsers ?? []).map(u => ({ kind: 'user' as const, id: u.user_id, name: u.display_name || u.username, handle: u.username, avatar_url: u.avatar_url, type: u.verified_type, verified_at: u.verified_at })),
      ...(verifiedPages ?? []).map(p => ({ kind: 'page' as const, id: p.id, name: p.name, handle: p.handle, avatar_url: p.avatar_url, type: p.verified_type, verified_at: p.verified_at }))
    ]
  }
})
