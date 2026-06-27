// server/api/admin/interests/index.post.ts
// ============================================================================
// ADMIN INTERESTS MANAGEMENT - CONSOLIDATED
// ============================================================================

import { serverSupabaseClient } from '#supabase/server'
import type { H3Event } from 'h3'

export interface InterestRequest {
  action: 'create' | 'update' | 'delete'
  interest?: {
    id?: string
    name: string
    description?: string
    category?: string
    icon?: string
    isActive?: boolean
  }
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const supabase = await serverSupabaseClient(event)
    const body = (await readBody(event)) as InterestRequest
    const { action, interest } = body

    // Verify admin role
    const user = await supabase.auth.getUser()
    if (!user.data.user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const { data: adminUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.data.user.id)
      .single()

    if (adminUser?.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }

    switch (action) {
      case 'create':
        return await createInterest(supabase, interest)
      case 'update':
        return await updateInterest(supabase, interest)
      case 'delete':
        return await deleteInterest(supabase, interest?.id)
      default:
        throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
    }
  } catch (error: any) {
    console.error('Error managing interests:', error)
    throw error
  }
})

async function createInterest(supabase: any, interest: any) {
  const { data, error } = await supabase
    .from('interests')
    .insert({
      name: interest.name,
      description: interest.description,
      category: interest.category,
      icon: interest.icon,
      is_active: interest.isActive !== false
    })
    .select()
    .single()

  if (error) throw error
  return { success: true, data }
}

async function updateInterest(supabase: any, interest: any) {
  const { data, error } = await supabase
    .from('interests')
    .update({
      name: interest.name,
      description: interest.description,
      category: interest.category,
      icon: interest.icon,
      is_active: interest.isActive
    })
    .eq('id', interest.id)
    .select()
    .single()

  if (error) throw error
  return { success: true, data }
}

async function deleteInterest(supabase: any, interestId: string) {
  const { error } = await supabase
    .from('interests')
    .delete()
    .eq('id', interestId)

  if (error) throw error
  return { success: true, message: 'Interest deleted' }
}
