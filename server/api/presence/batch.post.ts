import { createError, defineEventHandler, readBody } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { checkPresence } from '~/server/utils/presence'
import { privacyGate } from '~/server/utils/privacy-visibility'

const MAX_IDS = 100

/** Online state for many users at once, honouring each user's "show when I'm online" setting. */
export default defineEventHandler(async (event) => {
  const viewer = await requireUser(event)
  const body = await readBody<{ ids?: unknown }>(event)
  const ids = Array.isArray(body?.ids)
    ? [...new Set(body.ids.filter((id): id is string => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id)))]
    : []
  if (ids.length > MAX_IDS) throw createError({ statusCode: 400, statusMessage: `At most ${MAX_IDS} ids` })
  if (!ids.length) return { online: {} as Record<string, boolean> }

  const service = getServiceClient()
  const canSee = await privacyGate(service, viewer.id, ids)
  const { data, error } = await service
    .from('user')
    .select('user_id, show_online')
    .in('user_id', ids)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const visible = (data ?? []).filter(row => row.user_id === viewer.id || (row.show_online !== false && canSee(row.user_id, 'lastSeen')))
  const states = await Promise.all(visible.map(async row => [row.user_id, await checkPresence(row.user_id)] as const))
  const online: Record<string, boolean> = Object.fromEntries(ids.map(id => [id, false]))
  for (const [id, isOnline] of states) online[id] = isOnline
  return { online }
})
