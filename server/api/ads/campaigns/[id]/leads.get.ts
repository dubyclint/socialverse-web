import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadOwnCampaign } from '~/server/utils/ad-owner'

/** Instant-form leads as CSV for the advertiser. */
export default defineEventHandler(async (event) => {
  const campaign = await loadOwnCampaign(event)
  const { data } = await getServiceClient().from('ad_leads').select('answers, created_at').eq('campaign_id', campaign.id).order('created_at')
  const rows = (data ?? []) as { answers: Record<string, string>, created_at: string }[]
  const headers = [...new Set(rows.flatMap(r => Object.keys(r.answers ?? {})))]
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [['submitted_at', ...headers].map(esc).join(','), ...rows.map(r => [r.created_at, ...headers.map(h => r.answers?.[h])].map(esc).join(','))].join('\n')
  setHeader(event, 'content-type', 'text/csv; charset=utf-8')
  setHeader(event, 'content-disposition', `attachment; filename="leads-${campaign.id}.csv"`)
  return csv
})
