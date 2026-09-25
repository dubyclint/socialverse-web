import { serverSupabaseClient } from '#supabase/server'
import { requireAdmin } from '~/server/gateway/auth/auth-utils'
import { getMethod, readBody, createError } from 'h3'
import type { Database } from '~/types/database.types'

export interface RankConfigRow {
  rank: string
  points: number
  level: number
  userCount: number
}

interface RankBody {
  action?: 'add' | 'remove' | 'update'
  rank?: string
  points?: number
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)
  const method = getMethod(event)

  if (method === 'GET') {
    const [{ data: ranks, error }, { data: users, error: userError }] = await Promise.all([
      client.from('rank_config').select('rank, points').order('points', { ascending: true }),
      client.from('user').select('rank')
    ])

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    if (userError) throw createError({ statusCode: 500, statusMessage: userError.message })

    const counts = new Map<string, number>()
    for (const row of users ?? []) {
      if (!row.rank) continue
      counts.set(row.rank, (counts.get(row.rank) ?? 0) + 1)
    }

    const rows: RankConfigRow[] = (ranks ?? []).map((row, index) => ({
      rank: row.rank,
      points: row.points,
      level: index + 1,
      userCount: counts.get(row.rank) ?? 0
    }))

    return rows
  }

  if (method === 'POST') {
    await requireAdmin(event)
    const { action, rank, points } = await readBody<RankBody>(event)

    if (!action) throw createError({ statusCode: 400, statusMessage: 'Action is required' })
    if (!rank) throw createError({ statusCode: 400, statusMessage: 'Rank name is required' })

    if (action === 'add' || action === 'update') {
      if (points === undefined || points < 0) {
        throw createError({ statusCode: 400, statusMessage: 'Points threshold is required' })
      }
    }

    if (action === 'add') {
      const { error } = await client.from('rank_config').insert({ rank, points: points as number })
      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    } else if (action === 'update') {
      const { error } = await client.from('rank_config').update({ points: points as number }).eq('rank', rank)
      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    } else if (action === 'remove') {
      const { error } = await client.from('rank_config').delete().eq('rank', rank)
      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Invalid action. Must be add, remove, or update' })
    }

    return { success: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
