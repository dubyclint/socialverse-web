import { createError } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { broadcastToStream, liveUserCard } from '~/server/utils/stream-hub'

export type GuestRole = 'guest' | 'cohost'
export type GuestStatus = 'requested' | 'invited' | 'active' | 'left' | 'removed' | 'declined'
/** Seats on screen besides the host: 8 viewer guests, or 3 co-host creators (4 people incl. host). */
export const GUEST_LIMITS: Record<GuestRole, number> = { guest: 8, cohost: 3 }

const db = () => getServiceClient() as unknown as SupabaseClient

export const listGuests = async (streamId: string) => {
  const { data } = await db().from('stream_guests').select('user_id, role, status, updated_at')
    .eq('stream_id', streamId).in('status', ['requested', 'invited', 'active']).order('updated_at', { ascending: true })
  const rows = (data ?? []) as { user_id: string, role: GuestRole, status: GuestStatus, updated_at: string }[]
  return Promise.all(rows.map(async r => ({ ...(await liveUserCard(r.user_id)), role: r.role, status: r.status })))
}

export const pushGuests = async (streamId: string) => {
  broadcastToStream(streamId, { type: 'guests', guests: await listGuests(streamId) })
}

export const loadStreamOwner = async (streamId: string) => {
  const { data } = await db().from('streams').select('creator_id, broadcast_status').eq('id', streamId).maybeSingle()
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Stream not found' })
  return data as { creator_id: string, broadcast_status: string }
}

export const activeCount = async (streamId: string, role: GuestRole) => {
  const { count } = await db().from('stream_guests').select('user_id', { count: 'exact', head: true })
    .eq('stream_id', streamId).eq('role', role).eq('status', 'active')
  return count ?? 0
}

export const setGuest = async (streamId: string, userId: string, role: GuestRole, status: GuestStatus) => {
  const { error } = await db().from('stream_guests').upsert({ stream_id: streamId, user_id: userId, role, status, updated_at: new Date().toISOString() })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
}

export const getGuest = async (streamId: string, userId: string) => {
  const { data } = await db().from('stream_guests').select('role, status').eq('stream_id', streamId).eq('user_id', userId).maybeSingle()
  return data as { role: GuestRole, status: GuestStatus } | null
}

export const endAllGuests = async (streamId: string) => {
  await db().from('stream_guests').update({ status: 'left', updated_at: new Date().toISOString() }).eq('stream_id', streamId).in('status', ['requested', 'invited', 'active'])
}
