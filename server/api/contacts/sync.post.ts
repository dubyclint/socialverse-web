import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { hashPhones, normaliseE164 } from '~/server/utils/phone'

interface SyncEntry {
  phone: string
  name?: string
}

interface SyncBody {
  contacts: SyncEntry[]
  defaultCountry?: string
}

const MAX_CONTACTS = 2000

/**
 * Address-book sync, WhatsApp/Snapchat style: the client sends normalised
 * numbers, the server keeps only peppered hashes and resolves the ones that
 * belong to registered accounts.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<SyncBody>(event)
  const entries = Array.isArray(body?.contacts) ? body.contacts.slice(0, MAX_CONTACTS) : []

  if (!entries.length) {
    throw createError({ statusCode: 400, statusMessage: 'No contacts supplied' })
  }

  // Normalise first so the same number saved in different formats collapses.
  const byNumber = new Map<string, string>()
  for (const entry of entries) {
    const e164 = normaliseE164(String(entry?.phone ?? ''), body?.defaultCountry)
    if (!e164) continue
    const name = (entry?.name ?? '').trim().slice(0, 120)
    if (!byNumber.has(e164) || (name && !byNumber.get(e164))) byNumber.set(e164, name)
  }

  const numbers = [...byNumber.keys()]
  if (!numbers.length) {
    return { success: true, saved: 0, matched: 0, contacts: [] }
  }

  const hashes = await hashPhones(numbers)
  const service = getServiceClient()

  // Which of those hashes belong to real accounts?
  const { data: matches, error: matchError } = await service
    .from('user')
    .select('user_id, username, display_name, full_name, avatar_url, is_verified, phone_hash')
    .in('phone_hash', hashes.filter(Boolean))
    .neq('user_id', user.id)

  if (matchError) {
    throw createError({ statusCode: 500, statusMessage: 'Contact matching failed' })
  }

  const accountByHash = new Map((matches ?? []).map(row => [row.phone_hash as string, row]))

  const rows = numbers.map((number, index) => {
    const hash = hashes[index]
    const account = hash ? accountByHash.get(hash) : undefined
    return {
      user_id: user.id,
      phone_hash: hash,
      display_name: byNumber.get(number) || null,
      contact_id: account?.user_id ?? null,
      is_registered: Boolean(account),
      synced_at: new Date().toISOString(),
      source: 'phonebook'
    }
  }).filter(row => Boolean(row.phone_hash))

  const { error: upsertError } = await service
    .from('user_contacts')
    .upsert(rows, { onConflict: 'user_id,phone_hash' })

  if (upsertError) {
    throw createError({ statusCode: 500, statusMessage: 'Could not save your contacts' })
  }

  return {
    success: true,
    saved: rows.length,
    matched: accountByHash.size,
    contacts: [...accountByHash.values()].map(account => ({
      id: account.user_id,
      username: account.username,
      name: account.display_name || account.full_name || account.username,
      avatar_url: account.avatar_url,
      is_verified: account.is_verified ?? false
    }))
  }
})
