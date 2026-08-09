import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

type GiftTier = Database['public']['Enums']['gift_tier_level']

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tier = query.tier as GiftTier | undefined

  const supabase = await serverSupabaseClient<Database>(event)

  let builder = supabase
    .from('gift_catalog')
    .select('id, name, cost_credits, tier, icon_url')
    .eq('is_active', true)

  if (tier) builder = builder.eq('tier', tier)

  const { data: gifts, error } = await builder.order('cost_credits', { ascending: true })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return {
    success: true,
    // < 5 PEW plays a light animation; >= 5 PEW plays the full-screen tier effect.
    data: (gifts || []).map(gift => ({
      ...gift,
      animation: Number(gift.cost_credits) >= 5 ? 'fullscreen' : 'light'
    }))
  }
})
