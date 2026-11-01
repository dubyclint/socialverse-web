import type { H3Event } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { sendNotification } from '~/server/utils/send-notification'

export interface DiditRequestRef { id: string, user_id: string, status: string }

/** Apply a Didit decision (from the signed webhook or a server-side decision fetch) to a KYC request. */
export const applyDiditDecision = async (event: H3Event, r: DiditRequestRef, status: string, decision: Record<string, any> | null) => {
  const db = getServiceClient()
  const now = new Date().toISOString()
  const setReq = (patch: Record<string, unknown>) => db.from('kyc_requests' as never).update({ ...patch, decision, updated_at: now } as never).eq('id', r.id)
  const setKyc = (s: string) => db.from('user_kyc' as never).upsert({ user_id: r.user_id, status: s, updated_at: now } as never, { onConflict: 'user_id' })

  switch (status) {
    case 'Approved': {
      if (r.status === 'approved') return
      const ocr = decision?.id_verifications?.[0] ?? decision?.id_verification
      const legal = [ocr?.first_name, ocr?.last_name].filter(Boolean).join(' ').trim()
      if (legal) await setReq({ full_name: legal })
      const { error } = await db.rpc('kyc_approve' as never, { p_request: r.id, p_reviewer: null, p_waive: false } as never)
      if (error) {
        await setReq({ status: 'in_review', review_note: error.message })
        await setKyc('pending')
      } else {
        await sendNotification(event, r.user_id, 'system', 'Your identity (KYC) is verified.', r.user_id)
      }
      break
    }
    case 'Declined':
      if (r.status === 'rejected') return
      await setReq({ status: 'rejected', review_note: 'Declined by automated verification' }); await setKyc('rejected')
      await sendNotification(event, r.user_id, 'system', 'Your KYC was not approved. You can try again or use manual verification.', r.user_id)
      break
    case 'In Review':
    case 'Resubmitted':
      await setReq({ status: 'in_review' }); await setKyc('pending'); break
    case 'Abandoned':
    case 'Expired':
      await setReq({ status: 'abandoned' }); break
    case 'Kyc Expired':
      await setKyc('revoked')
      await sendNotification(event, r.user_id, 'system', 'Your KYC has expired. Please verify again.', r.user_id)
      break
    default: break
  }
}

/** Webhook-free fallback: ask Didit for the session decision with the server API key. */
export const pollDiditDecision = async (event: H3Event, r: DiditRequestRef & { didit_session_id: string | null }) => {
  const apiKey = process.env.DIDIT_API_KEY
  if (!apiKey || !r.didit_session_id) return
  const res = await fetch(`https://verification.didit.me/v3/session/${encodeURIComponent(r.didit_session_id)}/decision/`, {
    headers: { 'x-api-key': apiKey, Accept: 'application/json' }
  }).catch(() => null)
  if (!res?.ok) return
  const d = await res.json().catch(() => null) as Record<string, any> | null
  if (!d || String(d.vendor_data ?? r.user_id) !== r.user_id) return
  const status = String(d.status ?? '')
  if (!status || status === 'Not Started' || status === 'In Progress') return
  await applyDiditDecision(event, r, status, d)
}
