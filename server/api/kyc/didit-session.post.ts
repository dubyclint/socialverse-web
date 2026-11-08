import { readBody, getRequestURL } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { getKyc, getKycSettings } from '~/server/utils/kyc'

const WORKFLOW_ID = process.env.DIDIT_WORKFLOW_ID || 'd95c68c8-b199-46a7-843a-8004c6cfe7c4'

/** Starts a Didit hosted KYC session for the caller. The fee is charged when Didit approves. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const apiKey = process.env.DIDIT_API_KEY
  if (!apiKey) throw createError({ statusCode: 503, statusMessage: 'Fast verification is not available yet. Use manual verification.' })
  const body = await readBody<{ fullName?: string, payLater?: boolean, acceptTerms?: boolean }>(event)
  if (body?.acceptTerms !== true) throw createError({ statusCode: 400, statusMessage: 'Accept the KYC terms first' })
  const fullName = String(body?.fullName ?? '').trim().replace(/\s+/g, ' ').slice(0, 120)
  if (fullName.split(' ').length < 2) throw createError({ statusCode: 400, statusMessage: 'Enter your full legal name' })

  if ((await getKyc(user.id)).status === 'verified') throw createError({ statusCode: 409, statusMessage: 'You are already KYC verified' })
  const db = getServiceClient()
  const settings = await getKycSettings()
  const { data: wallet } = await db.from('wallets').select('balance').eq('user_id', user.id).eq('currency', 'PEW').maybeSingle()
  if (Number(wallet?.balance ?? 0) < settings.fee_pew && body?.payLater !== true) {
    throw createError({ statusCode: 402, statusMessage: `KYC costs ${settings.fee_pew} PEW. Choose "pay later" or use manual verification.` })
  }

  const origin = getRequestURL(event).origin
  const res = await fetch('https://verification.didit.me/v3/session/', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow_id: WORKFLOW_ID, vendor_data: user.id, callback: `${origin}/profile/${user.id}?kyc=done` })
  })
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300)
    console.error('[didit] session create failed', res.status, detail)
    const reason = res.status === 401 || res.status === 403
      ? 'the verification service rejected the API key (check DIDIT_API_KEY)'
      : res.status === 400 || res.status === 404
        ? 'the verification workflow is not set up (check DIDIT_WORKFLOW_ID)'
        : 'the verification service is unavailable'
    throw createError({ statusCode: 502, statusMessage: `Could not start verification: ${reason}. Try again or use manual verification.` })
  }
  const session = await res.json() as { session_id: string, url: string }
  await db.from('kyc_requests' as never).insert({
    user_id: user.id, method: 'didit', status: 'pending', full_name: fullName, didit_session_id: session.session_id,
    fee_pew: settings.fee_pew, pay_later: body?.payLater === true
  } as never)
  return { url: session.url, session_id: session.session_id }
})
