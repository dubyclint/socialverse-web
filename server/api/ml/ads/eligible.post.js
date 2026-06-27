// Get eligible ads for user (used by auction engine)
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuthenticatedUser(event)
    const body = await readBody(event)
    
    const supabase = serverSupabaseServiceRole(event)
    
    // Get user features for targeting
    const userFeatures = await getUserFeatures(user.id, supabase)
    
    // Get eligible campaigns based on targeting
    const { data: eligibleCampaigns } = await supabase
      .from('ad_campaigns')
      .select(`
        *,
        ads(*),
        targeting_rules,
        budget_info:budget_pacing_state(*)
      `)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .gt('remaining_budget', 0)
    
    // Filter by targeting rules
    const targetedCampaigns = eligibleCampaigns.filter(campaign => 
      matchesTargeting(campaign.targeting_rules, userFeatures, body.context)
    )
    
    // Check frequency caps
    const frequencyFilteredCampaigns = await filterByFrequencyCaps(
      targetedCampaigns, 
      user.id, 
      supabase
    )
    
    // Return eligible ads with metadata
    const eligibleAds = frequencyFilteredCampaigns.flatMap(campaign => 
      campaign.ads.map(ad => ({
        ...ad,
        campaignId: campaign.id,
        bidAmount: campaign.base_bid,
        qualityScore: campaign.quality_score,
        targetingScore: calculateTargetingScore(campaign.targeting_rules, userFeatures)
      }))
    )
    
    return {
      ads: eligibleAds,
      totalEligible: eligibleAds.length,
      userFeatures: sanitizeUserFeatures(userFeatures)
    }
    
  } catch (error) {
    console.error('Eligible ads error:', error)
    return { ads: [], error: error.message }
  }
})

async function getUserFeatures(userId, supabase) {
  const { data } = await supabase
    .from('user_features')
    .select('feature_data')
    .eq('user_id', userId)
    .single()
  
  return data?.feature_data || {}
}

function matchesTargeting(targetingRules, userFeatures, context) {
  if (!targetingRules) return true
  
  // Age targeting
  if (targetingRules.age_groups && 
      !targetingRules.age_groups.includes(userFeatures.age_group)) {
    return false
  }
  
  // Location targeting
  if (targetingRules.locations && context.location &&
      !targetingRules.locations.includes(context.location)) {
    return false
  }
  
  // Interest targeting
  if (targetingRules.interests && userFeatures.top_categories) {
    const hasMatchingInterest = targetingRules.interests.some(interest =>
      userFeatures.top_categories.includes(interest)
    )
    if (!hasMatchingInterest) return false
  }
  
  // Device targeting
  if (targetingRules.devices && 
      !targetingRules.devices.includes(context.deviceType)) {
    return false
  }
  
  return true
}

async function filterByFrequencyCaps(campaigns, userId, supabase) {
  const { data: userFrequency } = await supabase
    .from('user_ad_frequency')
    .select('*')
    .eq('user_id', userId)
  
  const frequencyMap = new Map(
    userFrequency?.map(f => [f.campaign_id, f]) || []
  )
  
  return campaigns.filter(campaign => {
    const frequency = frequencyMap.get(campaign.id)
    if (!frequency) return true
    
    // Check daily cap (simplified)
    const dailyCap = campaign.targeting_rules?.daily_frequency_cap || 5
    return frequency.impressions_today < dailyCap
  })
}

function calculateTargetingScore(targetingRules, userFeatures) {
  // Calculate how well user matches targeting criteria
  let score = 0
  let maxScore = 0
  
  if (targetingRules?.age_groups) {
    maxScore += 1
    if (targetingRules.age_groups.includes(userFeatures.age_group)) {
      score += 1
    }
  }
  
  if (targetingRules?.interests && userFeatures.top_categories) {
    maxScore += 2
    const matchingInterests = targetingRules.interests.filter(interest =>
      userFeatures.top_categories.includes(interest)
    ).length
    score += Math.min(matchingInterests / targetingRules.interests.length * 2, 2)
  }
  
  return maxScore > 0 ? score / maxScore : 0.5
}

function sanitizeUserFeatures(features) {
  // Remove sensitive data before sending to client
  const { interest_embedding, ...sanitized } = features
  return sanitized
}
