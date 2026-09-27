import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import type { Database } from '~/types/database.types'

const INTERACTION_TYPES = ['view', 'dwell', 'like', 'comment', 'share', 'profile_open', 'hide'] as const
const ITEM_TYPES = ['post', 'user', 'stream', 'ad'] as const

type InteractionType = (typeof INTERACTION_TYPES)[number]
type ItemType = (typeof ITEM_TYPES)[number]

interface TrackBody {
  items?: Array<{ itemId: string, itemType?: string, interactionType?: string }>
  itemId?: string
  itemType?: string
  interactionType?: string
}

const isInteraction = (value: unknown): value is InteractionType =>
  INTERACTION_TYPES.includes(value as InteractionType)

const isItemType = (value: unknown): value is ItemType =>
  ITEM_TYPES.includes(value as ItemType)

/**
 * Behaviour signal for the ranker. The feed batches impressions and sends
 * explicit actions as they happen; `rankPosts` reads these rows to boost
 * authors the viewer engages with and to damp posts already seen.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const client = await serverSupabaseClient<Database>(event)
  const body = await readBody<TrackBody>(event)

  const raw = body.items?.length
    ? body.items
    : body.itemId
      ? [{ itemId: body.itemId, itemType: body.itemType, interactionType: body.interactionType }]
      : []

  const rows = raw
    .filter(item => typeof item.itemId === 'string' && item.itemId.length > 0)
    .map(item => ({
      user_id: user.id,
      item_id: item.itemId,
      item_type: isItemType(item.itemType) ? item.itemType : 'post',
      interaction_type: isInteraction(item.interactionType) ? item.interactionType : 'view'
    }))
    .slice(0, 100)

  if (!rows.length) return { success: true, tracked: 0 }

  const { error } = await client.from('user_interactions').insert(rows)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, tracked: rows.length }
})
