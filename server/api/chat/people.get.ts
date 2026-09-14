import { defineEventHandler, getQuery, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

const LIMIT = 20

/**
 * People search for starting a DM. Deliberately scoped to the caller's own
 * network — follows, synced contacts and existing conversation partners — so
 * private messaging never exposes the global user directory. Global discovery
 * lives in Find Friends / group invites (`/api/users/search`).
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const term = String(getQuery(event).q ?? '').trim()
  const client = await serverSupabaseClient<Database>(event)

  const [following, followers, contacts, memberships] = await Promise.all([
    client.from('follows').select('following_id').eq('follower_id', user.id),
    client.from('follows').select('follower_id').eq('following_id', user.id),
    client.from('user_contacts').select('contact_id').eq('user_id', user.id).not('contact_id', 'is', null),
    client.from('chat_room_members').select('room_id').eq('user_id', user.id)
  ])

  const roomIds = (memberships.data ?? []).map(m => m.room_id)
  const { data: partners } = roomIds.length
    ? await client
        .from('chat_room_members')
        .select('user_id')
        .in('room_id', roomIds)
        .neq('user_id', user.id)
    : { data: [] as { user_id: string }[] }

  const scope = new Set<string>()
  ;(following.data ?? []).forEach(f => scope.add(f.following_id))
  ;(followers.data ?? []).forEach(f => scope.add(f.follower_id))
  ;(contacts.data ?? []).forEach(c => c.contact_id && scope.add(c.contact_id))
  ;(partners ?? []).forEach(p => scope.add(p.user_id))
  scope.delete(user.id)

  if (scope.size === 0) return { success: true, data: [], scope: 'network' as const }

  let query = client
    .from('user')
    .select('user_id, username, display_name, avatar_url, is_verified')
    .in('user_id', [...scope])
    .limit(LIMIT)

  if (term.length >= 2) {
    const pattern = `%${term.replace(/%/g, '')}%`
    query = query.or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
  }

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true, data: data ?? [], scope: 'network' as const }
})
