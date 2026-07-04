// server/api/posts.ts
import { requireAuth } from '~/server/utils/token-validator'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    // 1. Use the new unified auth guard
    await requireAuth(event)
    
    // 2. Initialize client using the event-aware helper
    const client = await serverSupabaseClient(event)
    
    // 3. Fetch data
    const { data, error } = await client
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    return {
      success: true,
      data: data
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch posts'
    })
  }
})
