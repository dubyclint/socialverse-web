import { defineEventHandler, readBody, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

interface AdSubmission {
  title?: string
  description?: string
  ctaText?: string
  destinationUrl?: string
  mediaUrl?: string
  budget?: string | number
  bidAmount?: string | number
  biddingStrategy?: string
  budgetType?: string
  startDate?: string
  endDate?: string
  targetLocations?: string[]
  ageRange?: { min?: string | number, max?: string | number }
  interests?: string[]
  deviceTargets?: string[]
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<AdSubmission>(event)
  const title = body.title?.trim()
  if (!title) throw createError({ statusCode: 400, statusMessage: 'Title is required' })

  const creativeUrl = body.mediaUrl?.trim()
  const destinationUrl = body.destinationUrl?.trim()
  if (!creativeUrl || !destinationUrl) {
    throw createError({ statusCode: 400, statusMessage: 'Creative and destination URLs are required' })
  }
  if (!body.startDate || !body.endDate) {
    throw createError({ statusCode: 400, statusMessage: 'Start and end dates are required' })
  }

  const budget = Number(body.budget ?? 0)
  const bid = Number(body.bidAmount ?? 0)
  if (!Number.isFinite(budget) || budget <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'A positive budget is required' })
  }

  const supabase = await serverSupabaseClient<Database>(event)

  const { data, error } = await supabase
    .from('ads_campaigns')
    .insert({
      advertiser_id: user.id,
      title,
      ad_creative_url: creativeUrl,
      target_destination_url: destinationUrl,
      billing_model: body.budgetType === 'total' ? 'CPM' : 'CPC',
      bid_per_unit: Number.isFinite(bid) && bid > 0 ? bid : 0,
      total_budget: budget,
      remaining_budget: budget,
      status: 'PENDING_REVIEW',
      targeting_demographics: {
        locations: body.targetLocations ?? [],
        ageRange: body.ageRange ?? {},
        interests: body.interests ?? [],
        devices: body.deviceTargets ?? [],
        cta: body.ctaText ?? null,
        description: body.description ?? null,
        biddingStrategy: body.biddingStrategy ?? 'automatic'
      },
      starts_at: new Date(body.startDate).toISOString(),
      ends_at: new Date(body.endDate).toISOString()
    })
    .select('id')
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Failed to submit ad: ${error.message}` })
  }

  return { success: true, campaignId: data.id }
})
