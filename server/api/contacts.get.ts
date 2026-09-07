import { defineEventHandler, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

/** Saved contacts of the signed-in user, resolved to their live profiles. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const client = await serverSupabaseClient<Database>(event)

  const { data: contacts, error } = await client
    .from('user_contacts')
    .select('contact_id, display_name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const contactIds = (contacts ?? []).map(row => row.contact_id).filter(Boolean) as string[]
  const { data: profiles } = contactIds.length
    ? await client
        .from('user')
        .select('user_id, username, display_name, avatar_url, is_verified')
        .in('user_id', contactIds)
    : { data: [] }

  const profileById = new Map((profiles ?? []).map(profile => [profile.user_id, profile]))

  return {
    success: true,
    data: (contacts ?? []).map(contact => {
      const profile = contact.contact_id ? profileById.get(contact.contact_id) : undefined
      return {
        id: contact.contact_id,
        username: profile?.username ?? null,
        name: contact.display_name || profile?.display_name || profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url ?? null,
        is_verified: profile?.is_verified ?? false,
        registered: Boolean(profile)
      }
    })
  }
})
