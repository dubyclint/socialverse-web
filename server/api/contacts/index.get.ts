import { createError, defineEventHandler } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'

export interface ContactEntry {
  id: string | null
  username: string | null
  name: string
  avatar_url: string | null
  is_verified: boolean
  registered: boolean
  pal_status: 'none' | 'pending_out' | 'pending_in' | 'accepted' | 'blocked'
}

/**
 * The signed-in user's synced address book, split into contacts who already
 * have an account and those who can only be invited.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const service = getServiceClient()

  const { data: contacts, error } = await service
    .from('user_contacts')
    .select('contact_id, display_name, is_registered, synced_at')
    .eq('user_id', user.id)
    .order('is_registered', { ascending: false })
    .order('display_name', { ascending: true })

  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load contacts' })

  const ids = (contacts ?? []).map(row => row.contact_id).filter((id): id is string => Boolean(id))

  const [{ data: profiles }, { data: pals }] = await Promise.all([
    ids.length
      ? service
          .from('user')
          .select('user_id, username, display_name, full_name, avatar_url, is_verified')
          .in('user_id', ids)
      : Promise.resolve({ data: [] as never[] }),
    service
      .from('pals')
      .select('user_id, pal_id, status')
      .or(`user_id.eq.${user.id},pal_id.eq.${user.id}`)
  ])

  const profileById = new Map((profiles ?? []).map(p => [p.user_id, p]))

  const palStatusFor = (otherId: string): ContactEntry['pal_status'] => {
    const row = (pals ?? []).find(p =>
      (p.user_id === user.id && p.pal_id === otherId)
      || (p.pal_id === user.id && p.user_id === otherId))
    if (!row) return 'none'
    if (row.status === 'accepted') return 'accepted'
    if (row.status === 'blocked') return 'blocked'
    if (row.status === 'pending') return row.user_id === user.id ? 'pending_out' : 'pending_in'
    return 'none'
  }

  const entries: ContactEntry[] = (contacts ?? []).map((contact) => {
    const profile = contact.contact_id ? profileById.get(contact.contact_id) : undefined
    return {
      id: contact.contact_id,
      username: profile?.username ?? null,
      name: profile?.display_name || profile?.full_name || contact.display_name || profile?.username || 'Unknown',
      avatar_url: profile?.avatar_url ?? null,
      is_verified: profile?.is_verified ?? false,
      registered: Boolean(profile),
      pal_status: contact.contact_id ? palStatusFor(contact.contact_id) : 'none'
    }
  })

  return {
    success: true,
    onApp: entries.filter(entry => entry.registered),
    invitable: entries.filter(entry => !entry.registered),
    lastSyncedAt: contacts?.[0]?.synced_at ?? null
  }
})
