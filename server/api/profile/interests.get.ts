import { serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const { category } = getQuery(event)

    let q = supabase
      .from('interests')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (typeof category === 'string' && category.trim().length > 0) {
      q = q.eq('category', category.trim())
    }

    const { data, error } = await q
    if (error) {
      console.error('[GET /api/profile/interests] db error:', error)
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch interests' })
    }

    const interests = data ?? []
    const grouped = interests.reduce((acc: Record<string, any[]>, interest: any) => {
      const cat = interest?.category || 'Other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(interest)
      return acc
    }, {})

    return {
      success: true,
      data: {
        interests,
        grouped
      }
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('[GET /api/profile/interests] internal error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })
  }
})
