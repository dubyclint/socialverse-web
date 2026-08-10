import { serverSupabaseClient } from '#supabase/server'
import { requireRole } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

/** Four-month escrow volume and mean time-to-release, from the P2P trade book. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'moderator')
  const supabase = await serverSupabaseClient<Database>(event)

  const now = new Date()
  const months: string[] = []
  const volume: number[] = []
  const releaseTime: number[] = []

  for (let i = 3; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

    const { data: trades, error } = await supabase
      .from('p2p_trades')
      .select('amount, created_at, released_at, status')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })

    const rows = trades ?? []
    const totalVolume = rows.reduce((sum, trade) => sum + Number(trade.amount), 0)
    const hoursToRelease = rows
      .filter(trade => trade.status === 'released' && trade.released_at)
      .map(trade => (new Date(trade.released_at as string).getTime() - new Date(trade.created_at).getTime()) / 3600000)

    months.push(start.toLocaleString('default', { month: 'short' }))
    volume.push(Math.round(totalVolume))
    releaseTime.push(
      hoursToRelease.length
        ? Number((hoursToRelease.reduce((a, b) => a + b, 0) / hoursToRelease.length).toFixed(2))
        : 0
    )
  }

  return { months, volume, releaseTime }
})
