import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { getPageRole } from '~/server/utils/actor'
import type { BadgeType } from '~/utils/staff-permissions'

interface Body {
  pageId?: string | null
  category?: BadgeType
  reason?: string
  links?: string[]
  documents?: { name?: string, url?: string }[]
}

const CATEGORIES: BadgeType[] = ['personal', 'business', 'government']

/** Apply for a verification badge for yourself or a Page you own. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<Body>(event)
  const category = body?.category
  if (!category || !CATEGORIES.includes(category)) {
    throw createError({ statusCode: 400, statusMessage: 'Choose individual, business or government' })
  }
  const reason = String(body.reason ?? '').trim().slice(0, 1000)
  if (reason.length < 20) throw createError({ statusCode: 400, statusMessage: 'Tell us why you should be verified (at least 20 characters)' })

  const links = (Array.isArray(body.links) ? body.links : [])
    .map(l => String(l).trim()).filter(l => /^https:\/\/\S+$/i.test(l)).slice(0, 5)
  const documents = (Array.isArray(body.documents) ? body.documents : [])
    .filter(d => typeof d?.url === 'string' && /^https:\/\//i.test(d.url))
    .slice(0, 5)
    .map(d => ({ name: String(d.name ?? 'Document').slice(0, 120), url: d.url as string, type: 'file', uploadDate: new Date().toISOString() }))
  if (!links.length && !documents.length) {
    throw createError({ statusCode: 400, statusMessage: 'Add at least one https link or document as proof' })
  }

  const service = getServiceClient()
  const pageId = body.pageId || null
  if (pageId) {
    if (await getPageRole(pageId, user.id) !== 'OWNER') {
      throw createError({ statusCode: 403, statusMessage: 'Only the Page owner can request verification' })
    }
    const { data: page } = await service.from('pages').select('is_verified').eq('id', pageId).maybeSingle()
    if (page?.is_verified) throw createError({ statusCode: 409, statusMessage: 'This Page is already verified' })
  } else {
    const { data: me } = await service.from('user').select('is_verified').eq('user_id', user.id).maybeSingle()
    if (me?.is_verified) throw createError({ statusCode: 409, statusMessage: 'You are already verified' })
  }

  let pending = service.from('badge_requests').select('id').eq('status', 'pending')
  pending = pageId ? pending.eq('page_id', pageId) : pending.eq('user_id', user.id).is('page_id', null)
  const { data: existing } = await pending.maybeSingle()
  if (existing) throw createError({ statusCode: 409, statusMessage: 'A verification request is already under review' })

  const { data, error } = await service.from('badge_requests').insert({
    user_id: user.id,
    page_id: pageId,
    category,
    reason,
    evidence: { links, documents },
    status: 'pending'
  } as never).select('id, status, created_at').single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
