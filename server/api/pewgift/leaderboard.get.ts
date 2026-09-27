import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

/** Top gift receivers, aggregated from recorded gift transactions. */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  const sinceDays = Math.min(parseInt(query.days as string) || 30, 365)
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString()

  const supabase = await serverSupabaseClient<Database>(event)

  const { data: rows, error } = await supabase
    .from('gift_transactions')
    .select('recipient_id, credit_value')
    .gte('created_at', since)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const totals = new Map<string, { total: number, gifts: number }>()
  for (const row of rows || []) {
    const entry = totals.get(row.recipient_id) || { total: 0, gifts: 0 }
    entry.total += Number(row.credit_value)
    entry.gifts += 1
    totals.set(row.recipient_id, entry)
  }

  const ranked = [...totals.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)

  const { data: profiles } = ranked.length
    ? await supabase.from('user').select('user_id, username, avatar_url').in('user_id', ranked.map(([id]) => id))
    : { data: [] }

  const profileById = new Map((profiles || []).map(profile => [profile.user_id, profile]))

  return {
    success: true,
    data: ranked.map(([userId, entry], index) => ({
      rank: index + 1,
      userId,
      username: profileById.get(userId)?.username ?? 'unknown',
      avatarUrl: profileById.get(userId)?.avatar_url ?? null,
      totalCredits: entry.total,
      giftCount: entry.gifts
    }))
  }
})
