import { createError, defineEventHandler, getQuery } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { loadBlockedIds, loadFriendIds, loadProfiles } from '~/server/utils/pals'

interface Candidate {
  score: number
  reasons: string[]
  mutuals: number
  fromContacts: boolean
}

const CONTACT_WEIGHT = 100
const MUTUAL_WEIGHT = 12
const INTEREST_WEIGHT = 5

/**
 * PAL suggestions, strongest signal first: people already in the user's
 * address book, then friends-of-friends, then shared interests.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const limit = Math.min(Number(getQuery(event).limit ?? 20) || 20, 50)
  const service = getServiceClient()

  const [friendIds, blockedIds, { data: pending }, { data: contacts }, { data: myInterests }] =
    await Promise.all([
      loadFriendIds(service, user.id),
      loadBlockedIds(service, user.id),
      service
        .from('pals')
        .select('user_id, pal_id')
        .eq('status', 'pending')
        .or(`user_id.eq.${user.id},pal_id.eq.${user.id}`),
      service
        .from('user_contacts')
        .select('contact_id')
        .eq('user_id', user.id)
        .eq('is_registered', true),
      service.from('user_interests').select('interest_id').eq('user_id', user.id)
    ])

  const excluded = new Set<string>([user.id, ...friendIds, ...blockedIds])
  for (const row of pending ?? []) {
    excluded.add(row.user_id === user.id ? row.pal_id : row.user_id)
  }

  const candidates = new Map<string, Candidate>()
  const bump = (id: string, score: number, reason: string, extra?: Partial<Candidate>) => {
    if (!id || excluded.has(id)) return
    const current = candidates.get(id) ?? { score: 0, reasons: [], mutuals: 0, fromContacts: false }
    current.score += score
    if (!current.reasons.includes(reason)) current.reasons.push(reason)
    Object.assign(current, extra ?? {})
    candidates.set(id, current)
  }

  for (const row of contacts ?? []) {
    if (row.contact_id) bump(row.contact_id, CONTACT_WEIGHT, 'In your contacts', { fromContacts: true })
  }

  // Friends of friends.
  if (friendIds.length) {
    const { data: secondDegree } = await service
      .from('pals')
      .select('user_id, pal_id')
      .eq('status', 'accepted')
      .or(`user_id.in.(${friendIds.join(',')}),pal_id.in.(${friendIds.join(',')})`)

    const mutualCount = new Map<string, number>()
    for (const row of secondDegree ?? []) {
      for (const id of [row.user_id, row.pal_id]) {
        if (excluded.has(id)) continue
        mutualCount.set(id, (mutualCount.get(id) ?? 0) + 1)
      }
    }
    for (const [id, count] of mutualCount) {
      bump(id, MUTUAL_WEIGHT * count, `${count} mutual PAL${count > 1 ? 's' : ''}`, { mutuals: count })
    }
  }

  const interestIds = (myInterests ?? []).map(row => row.interest_id).filter(Boolean)
  if (interestIds.length) {
    const { data: sharedInterest } = await service
      .from('user_interests')
      .select('user_id')
      .in('interest_id', interestIds)
      .neq('user_id', user.id)
      .limit(500)

    const counts = new Map<string, number>()
    for (const row of sharedInterest ?? []) {
      if (!row.user_id || excluded.has(row.user_id)) continue
      counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1)
    }
    for (const [id, count] of counts) {
      bump(id, INTEREST_WEIGHT * count, 'Shares your interests')
    }
  }

  const ranked = [...candidates.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)

  const profiles = await loadProfiles(service, ranked.map(([id]) => id))

  return {
    success: true,
    suggestions: ranked
      .map(([id, meta]) => {
        const profile = profiles.get(id)
        return profile
          ? { ...profile, reasons: meta.reasons, mutuals: meta.mutuals, fromContacts: meta.fromContacts }
          : null
      })
      .filter(Boolean)
  }
})
