import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { getVeepSettings } from '~/server/utils/veep'

/** Creator progress: engaged views (standard 5s views excluded) on own posts in the rolling window. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const s = await getVeepSettings()
  const db = getServiceClient()
  const since = new Date(Date.now() - s.monetize_days * 86400_000).toISOString()
  const { data: posts } = await db.from('posts').select('id').eq('user_id', user.id).is('page_id', null).limit(5000)
  const ids = (posts ?? []).map(p => p.id)
  let engaged = 0; let standard = 0
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200)
    const [{ count: e }, { count: st }] = await Promise.all([
      db.from('veep_events' as never).select('id', { count: 'exact', head: true }).in('post_id', chunk).in('tier', ['engaged', 'high']).neq('user_id', user.id).gte('created_at', since),
      db.from('veep_events' as never).select('id', { count: 'exact', head: true }).in('post_id', chunk).eq('tier', 'standard').neq('user_id', user.id).gte('created_at', since)
    ])
    engaged += e ?? 0; standard += st ?? 0
  }
  return { engaged, standard, target: s.monetize_views, days: s.monetize_days, thresholds: { standard_s: s.standard_s, engaged_s: s.engaged_s, high_s: s.high_s }, progress: Math.min(100, Math.round(engaged / s.monetize_views * 1000) / 10) }
})
