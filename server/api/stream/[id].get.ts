// server/api/stream/[id].get.ts
import { StreamModel } from '~/server/models/stream'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { liveUserCard } from '~/server/utils/stream-hub'
import { getServiceClient } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Stream id required' })

  // Optional auth: allow anonymous viewers
  try { await requireAuth(event) } catch (e) { /* ignore */ }

  let result = await StreamModel.getStream(id)
  const deadline = (result as { trial_deadline?: string | null } | null)?.trial_deadline
  if (result?.broadcast_status === 'LIVE' && deadline && new Date(deadline).getTime() <= Date.now()) {
    result = await StreamModel.endStream(id)
  }

    const { data: rules } = await getServiceClient().from('live_access_rules' as never).select('viewer_gift_host_pct').eq('id', true).maybeSingle()
    const hostPct = Number((rules as { viewer_gift_host_pct?: number } | null)?.viewer_gift_host_pct ?? 80)
    return { success: true, data: result ? { ...result, creator: await liveUserCard(result.creator_id), viewer_gift_host_pct: hostPct } : null }
  } catch (error: any) {
    console.error('[Stream Get] Error:', error)
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message || 'Failed to get stream' })
  }
});
