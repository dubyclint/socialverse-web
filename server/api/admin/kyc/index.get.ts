import { getQuery } from 'h3'
import { requireStaff } from '~/server/utils/staff'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { getKycSettings } from '~/server/utils/kyc'

/** KYC review queue with signed photo URLs (staff with verification permission). */
export default defineEventHandler(async (event) => {
  await requireStaff(event, 'verification')
  const status = String(getQuery(event).status ?? 'pending')
  const db = getServiceClient()
  let q = db.from('kyc_requests' as never).select('*').order('created_at', { ascending: status === 'pending' }).limit(100)
  q = status === 'pending' ? q.in('status', ['pending', 'in_review']) : q.eq('status', status)
  const { data, error } = await q
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const rows = (data ?? []) as { user_id: string, sentence_photo_path: string | null, id_photo_path?: string | null }[]
  const ids = [...new Set(rows.map(r => r.user_id))]
  const [{ data: users }, { data: wallets }] = await Promise.all([
    db.from('user').select('user_id, username, display_name, avatar_url').in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']),
    db.from('wallets').select('user_id, balance, pew_debt' as never).eq('currency', 'PEW').in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  ])
  const items = await Promise.all(rows.map(async r => ({
    ...r,
    user: users?.find(u => u.user_id === r.user_id) ?? null,
    balance: Number((wallets as { user_id: string, balance: number }[] | null)?.find(w => w.user_id === r.user_id)?.balance ?? 0),
    id_photo_url: r.id_photo_path
      ? (await db.storage.from('verification').createSignedUrl(r.id_photo_path, 600)).data?.signedUrl ?? null
      : null,
    photo_url: r.sentence_photo_path
      ? (await db.storage.from('verification').createSignedUrl(r.sentence_photo_path, 600)).data?.signedUrl ?? null
      : null
  })))
  return { items, settings: await getKycSettings() }
})
