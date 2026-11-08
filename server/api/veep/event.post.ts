import { readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { enforceRateLimit } from '~/server/utils/rate-limit'
import { getVeepSettings } from '~/server/utils/veep'

const UUID = /^[0-9a-f-]{36}$/i

/** Watch telemetry (tiered views) and library actions for Veep. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await enforceRateLimit(event, 'veep:event', { limit: 240, windowMs: 60_000 }, user.id)
  const b = await readBody<{ postId?: string, kind?: string, watchMs?: number, completed?: boolean, loops?: number }>(event)
  const postId = String(b?.postId ?? '')
  if (!UUID.test(postId)) throw createError({ statusCode: 400, statusMessage: 'postId required' })
  const db = getServiceClient()
  const kind = String(b?.kind ?? 'watch')

  if (kind === 'save' || kind === 'unsave' || kind === 'like' || kind === 'unlike' || kind === 'share') {
    const lib = kind.replace(/^un/, '') === 'save' ? 'saved' : kind.replace(/^un/, '') === 'like' ? 'liked' : 'shared'
    if (kind.startsWith('un')) await db.from('veep_library' as never).delete().eq('user_id', user.id).eq('post_id', postId).eq('kind', lib)
    else await db.from('veep_library' as never).upsert({ user_id: user.id, post_id: postId, kind: lib, created_at: new Date().toISOString() } as never)
    return { ok: true }
  }

  // Watching your own post (or a Page you run) never counts as a view.
  const { data: post } = await db.from('posts').select('user_id, page_id').eq('id', postId).maybeSingle()
  const row = post as { user_id: string | null, page_id: string | null } | null
  let own = row?.user_id === user.id
  if (!own && row?.page_id) {
    const { data: page } = await db.from('pages' as never).select('created_by_user_id').eq('id', row.page_id).maybeSingle()
    own = (page as { created_by_user_id?: string } | null)?.created_by_user_id === user.id
  }
  if (own) {
    await db.from('veep_library' as never).upsert({ user_id: user.id, post_id: postId, kind: 'watched', created_at: new Date().toISOString() } as never)
    return { ok: true, tier: 'own' }
  }

  const watchMs = Math.max(0, Math.min(Number(b?.watchMs) || 0, 6 * 3600_000))
  const completed = b?.completed === true
  const s = await getVeepSettings()
  const sec = watchMs / 1000
  const tier = sec >= s.high_s ? 'high' : (sec >= s.engaged_s || completed) ? 'engaged' : sec >= s.standard_s ? 'standard' : 'skip'
  await db.from('veep_events' as never).insert({ post_id: postId, user_id: user.id, watch_ms: Math.round(watchMs), completed, loops: Math.max(0, Math.min(Number(b?.loops) || 0, 100)), tier } as never)
  await db.from('veep_library' as never).upsert({ user_id: user.id, post_id: postId, kind: 'watched', created_at: new Date().toISOString() } as never)
  if (tier !== 'skip') await db.rpc('veep_count_view' as never, { p_post: postId, p_engaged: tier === 'engaged' || tier === 'high' } as never)
  return { ok: true, tier }
})
