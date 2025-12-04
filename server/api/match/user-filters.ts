// FILE: /server/api/match/user-filters.ts
// ============================================================================
// MATCH FILTER MANAGEMENT - Handle user filter creation and approval
// ============================================================================

import { getSupabaseClient } from '~/server/utils/database'
import { sendNotification } from '~/server/utils/send-notification'
import { sendPushAlert } from '~/server/utils/send-push-alert'
import { evaluateTrust } from '~/server/utils/evaluate-trust'

interface UserFilters {
  ageRange?: [number, number]
  location?: string
  interests?: string[]
  verified?: boolean
  premium?: boolean
}

interface FilterResponse {
  success: boolean
  status: 'approved' | 'pending'
  autoApproved?: boolean
  criteriaMet?: string[]
  priorityRatio?: number
  message?: string
}

export default defineEventHandler(async (event): Promise<FilterResponse> => {
  try {
    // Get Supabase client
    const supabase = await getSupabaseClient()
    
    // Get authenticated user
    const user = event.context.user
    if (!user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const userId = user.id
    const filters: UserFilters = await readBody(event)

    // Validate filters
    if (!filters || Object.keys(filters).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Filters cannot be empty'
      })
    }

    // Get user data from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) throw userError
    if (!userData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Evaluate trust score
    const trust = evaluateTrust(userData)

    // Auto-approve for trusted users
    if (trust.isTrusted) {
      // Update user filters in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ match_filters: filters })
        .eq('id', userId)

      if (updateError) throw updateError

      // Remove any pending filter requests
      await supabase
        .from('filter_requests')
        .delete()
        .eq('user_id', userId)

      // Send notifications to user
      await sendNotification(
        userId,
        'filter_approved',
        'Your match filters have been auto-approved.'
      )
      await sendPushAlert(
        userId,
        'Filters Activated',
        'Your trusted filters are now live.'
      )

      return {
        success: true,
        status: 'approved',
        autoApproved: true,
        criteriaMet: trust.criteriaMet,
        priorityRatio: trust.priorityRatio
      }
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('filter_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return {
        success: false,
        status: 'pending',
        message: 'You already have a pending filter request.'
      }
    }

    // Create new pending filter request
    const { error: insertError } = await supabase
      .from('filter_requests')
      .upsert({
        user_id: userId,
        filters,
        status: 'pending',
        approved_filters: [],
        rejected_filters: [],
        rejection_reason: '',
        submitted_at: new Date().toISOString()
      })

    if (insertError) throw insertError

    // Send admin notifications
    await sendNotification(
      'admin',
      'filter_request',
      `${userData.username} submitted a new match filter request.`
    )
    await sendPushAlert(
      'admin',
      'New Filter Request',
      `${userData.username} submitted filters for review.`
    )

    return {
      success: true,
      status: 'pending',
      message: 'Your filter request has been submitted for review.'
    }
  } catch (err: any) {
    console.error('[Match Filters] Error:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to process filter request'
    })
  }
})

