import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { getPageRole } from '~/server/utils/actor'
import type { BadgeType } from '~/utils/staff-permissions'
import { getVerificationFees, tierFor, type VerificationPlan } from '~/server/utils/verification-fees'

interface Body {
  pageId?: string | null
  category?: BadgeType
  reason?: string
  links?: string[]
  documents?: { name?: string, path?: string }[]
  plan?: VerificationPlan
  businessSize?: 'sme' | 'corp'
  acceptTerms?: boolean
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
    .filter(d => typeof d?.path === 'string' && d.path.startsWith(`${user.id}/`) && !d.path.includes('..'))
    .slice(0, 5)
    .map(d => ({ name: String(d.name ?? 'Document').slice(0, 120), path: d.path as string, uploadDate: new Date().toISOString() }))
  if (!links.length && !documents.length) {
    throw createError({ statusCode: 400, statusMessage: 'Add at least one https link or document as proof' })
  }

  if (body.acceptTerms !== true) throw createError({ statusCode: 400, statusMessage: 'Accept the Verified Badge terms and fees first' })
  const plan: VerificationPlan = body.plan === 'monthly' ? 'monthly' : 'yearly'

  const service = getServiceClient()
  const pageId = body.pageId || null
  const tier = tierFor(category, Boolean(pageId), body.businessSize)
  const fee = (await getVerificationFees())[`${tier}_${plan}`]
  if (fee === null) throw createError({ statusCode: 400, statusMessage: `The ${plan} plan isn't available for this badge` })
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

  const balance = pageId
    ? Number((await service.from('page_wallets').select('balance').eq('page_id', pageId).maybeSingle()).data?.balance ?? 0)
    : Number((await service.from('wallets').select('balance').eq('user_id', user.id).eq('currency', 'PEW').maybeSingle()).data?.balance ?? 0)
  if (balance < fee) {
    throw createError({ statusCode: 402, statusMessage: `This badge costs ${fee} PEW (${plan}). ${pageId ? 'The Page wallet' : 'Your wallet'} has ${balance} PEW — add funds first.` })
  }

  const { data, error } = await service.from('badge_requests').insert({
    user_id: user.id,
    page_id: pageId,
    category,
    reason,
    evidence: { links, documents },
    status: 'pending',
    plan,
    tier
  } as never).select('id, status, created_at').single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const { error: chargeError } = await service.rpc('verification_fee_charge' as never, { p_user: user.id, p_page: pageId, p_amount: fee, p_request: data.id } as never)
  if (chargeError) {
    await service.from('badge_requests').delete().eq('id', data.id)
    const insufficient = chargeError.code === '23514'
    throw createError({ statusCode: insufficient ? 402 : 500, statusMessage: insufficient ? 'Not enough PEW in the wallet for this badge' : chargeError.message })
  }
  return { ...data, fee, plan, tier }
})
