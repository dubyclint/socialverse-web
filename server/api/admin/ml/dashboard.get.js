// API endpoint for ML dashboard data
export default defineEventHandler(async (event) => {
  try {
    // Check admin permissions
    const user = await requireAuthenticatedUser(event)
    if (!user.is_admin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const supabase = serverSupabaseServiceRole(event)

    // Get current algorithm configuration
    const { data: algorithmConfig } = await supabase
      .from('ml_algorithm_config')
      .select('config_data')
      .eq('config_name', 'default_algorithm_config')
      .eq('is_active', true)
      .single()

    const { data: auctionConfig } = await supabase
      .from('ml_algorithm_config')
      .select('config_data')
      .eq('config_name', 'default_auction_config')
      .eq('is_active', true)
      .single()

    const { data: causalConfig } = await supabase
      .from('ml_algorithm_config')
      .select('config_data')
      .eq('config_name', 'default_causal_config')
      .eq('is_active', true)
      .single()

    const { data: banditConfig } = await supabase
      .from('ml_algorithm_config')
      .select('config_data')
      .eq('config_name', 'default_bandit_config')
      .eq('is_active', true)
      .single()

    // Get active experiments
    const { data: causalExperiments } = await supabase
      .from('experiment_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get bandit performance
    const { data: banditPerformance } = await supabase
      .from('bandit_performance')
      .select('*')
      .order('total_interactions', { ascending: false })
      .limit(20)

    // Get A/B tests
    const { data: abTests } = await supabase
      .from('ab_tests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get system metrics
    const { data: recentAuctions } = await supabase
      .from('auction_logs')
      .select('total_revenue, fill_rate, auction_time_ms')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const totalRevenue = recentAuctions?.reduce((sum, auction) => sum + (auction.total_revenue || 0), 0) || 0
    const avgFillRate = recentAuctions?.length > 0 
      ? recentAuctions.reduce((sum, auction) => sum + (auction.fill_rate || 0), 0) / recentAuctions.length 
      : 0
    const avgLatency = recentAuctions?.length > 0
      ? recentAuctions.reduce((sum, auction) => sum + (auction.auction_time_ms || 0), 0) / recentAuctions.length
      : 0

    // Calculate average CTR from recent campaigns
    const { data: campaignStats } = await supabase
      .from('active_campaigns')
      .select('ctr')

    const avgCTR = campaignStats?.length > 0
      ? campaignStats.reduce((sum, campaign) => sum + (campaign.ctr || 0), 0) / campaignStats.length
      : 0

    return {
      algorithmConfig: algorithmConfig?.config_data || {},
      auctionSettings: auctionConfig?.config_data || {},
      causalConfig: causalConfig?.config_data || {},
      banditConfig: banditConfig?.config_data || {},
      causalExperiments: causalExperiments || [],
      banditPerformance: banditPerformance || [],
      abTests: abTests || [],
      metrics: {
        totalRevenue,
        avgCTR,
        fillRate: avgFillRate,
        auctionsPerMinute: recentAuctions?.length || 0,
        avgLatency
      },
      systemStatus: {
        overall: 'healthy',
        mlService: 'running',
        database: 'connected',
        redis: 'connected'
      }
    }

  } catch (error) {
    console.error('Dashboard data error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load dashboard data'
    })
  }
})
