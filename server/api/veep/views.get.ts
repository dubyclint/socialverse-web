import { getQuery } from 'h3'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadCreatorRevenueConfig } from '~/server/utils/creator-revenue'

const UUID = /^[0-9a-f-]{36}$/i

/** Public view counters (standard + engaged) for up to 60 posts. */
export default defineEventHandler(async (event) => {
  const ids = String(getQuery(event).ids ?? '').split(',').filter(id => UUID.test(id)).slice(0, 60)
  if (!ids.length) return { views: {} }
  const [{ data }, cfg] = await Promise.all([getServiceClient().from('posts').select('id, views_count, engaged_views_count' as never).in('id', ids), loadCreatorRevenueConfig()])
  // Admin padding affects only the public counter; ad-revenue ledger and engaged counts are untouched.
  const pad = Math.max(0, Math.floor(cfg.view_padding || 0))
  const views: Record<string, { views: number, engaged: number }> = {}
  for (const r of (data ?? []) as unknown as { id: string, views_count: number, engaged_views_count: number }[]) views[r.id] = { views: (r.views_count ?? 0) + pad, engaged: r.engaged_views_count }
  return { views }
})
