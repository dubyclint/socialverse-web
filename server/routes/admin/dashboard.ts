import { getSupabaseClient } from '~/server/utils/database'
import { AuditLogModel } from '~/server/models/audit-log'

interface DashboardStats {
  totalUsers: number
  totalTrades: number
  totalEscrowValue: number
  pendingEscrows: number
  recentAuditLogs: any[]
  userStats: {
    verified: number
    unverified: number
  }
  tradeStats: {
    pending: number
    completed: number
    failed: number
  }
}

export default defineEventHandler(async (event): Promise<DashboardStats> => {
  try {
    const supabase = await getSupabaseClient();

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get total trades
    const { count: totalTrades } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })

    // Get total escrow value
    const { data: escrowData } = await supabase
      .from('escrow_trades')
      .select('amount')
      .eq('is_released', false)
      .eq('is_refunded', false)

    const totalEscrowValue = escrowData?.reduce((sum, trade) => sum + (trade.amount || 0), 0) || 0

    // Get pending escrows count
    const { count: pendingEscrows } = await supabase
      .from('escrow_trades')
      .select('*', { count: 'exact', head: true })
      .eq('is_released', false)
      .eq('is_refunded', false)

    // Get verified vs unverified users
    const { count: verifiedUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('verified', true)

    const unverifiedUsers = (totalUsers || 0) - (verifiedUsers || 0)

    // Get trade stats
    const { count: pendingTrades } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: completedTrades } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    const { count: failedTrades } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')

    // Get recent audit logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10)

    return {
      totalUsers: totalUsers || 0,
      totalTrades: totalTrades || 0,
      totalEscrowValue,
      pendingEscrows: pendingEscrows || 0,
      recentAuditLogs: auditLogs || [],
      userStats: {
        verified: verifiedUsers || 0,
        unverified: unverifiedUsers
      },
      tradeStats: {
        pending: pendingTrades || 0,
        completed: completedTrades || 0,
        failed: failedTrades || 0
      }
    }
  } catch (error: any) {
    console.error('Dashboard error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch dashboard data'
    })
  }
})

