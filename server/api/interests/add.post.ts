// FILE: /server/api/interests/add.post.ts - UPDATE
// Add interest to user profile
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'

interface AddInterestRequest {
  interestId: string
}

export default defineEventHandler(async (event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const userId = event.context.user?.id

    // STEP 1: VERIFY AUTHENTICATION
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const body = await readBody<AddInterestRequest>(event)

    // STEP 2: VALIDATE INPUT
    if (!body.interestId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Interest ID is required'
      })
    }

    // STEP 3: CHECK IF INTEREST EXISTS
    const { data: interest, error: interestError } = await supabase
      .from('interests')
      .select('id')
      .eq('id', body.interestId)
      .single()

    if (interestError || !interest) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Interest not found'
      })
    }

    // STEP 4: ADD INTEREST TO USER
    const { error: addError } = await supabase
      .from('user_interests')
      .insert({
        user_id: userId,
        interest_id: body.interestId
      })

    if (addError) {
      if (addError.code === '23505') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Interest already added'
        })
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to add interest'
      })
    }

    // STEP 5: RETURN SUCCESS
    return {
      success: true,
      message: 'Interest added successfully'
    }

  } catch (error) {
    console.error('[AddInterest] Error:', error)
    throw error
  }
})
