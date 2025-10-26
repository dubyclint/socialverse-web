// server/api/profile/me.get.ts
// Example: Get current user profile (requires authentication)

import { verifyAuth } from '../middleware/rbac'

export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated
    const user = await verifyAuth(event, { requireAuth: true })

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    // Fetch full user profile
    const supabase = await serverSupabaseClient(event)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      })
    }

    return {
      success: true,
      data: profile
    }

  } catch (error) {
    console.error('Get profile error:', error)
    throw error
  }
})

---

// server/api/admin/users.get.ts
// Example: Get all users (admin only)

import { verifyAuth } from '../middleware/rbac'

export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated AND has admin role
    const user = await verifyAuth(event, { 
      requireAuth: true,
      allowedRoles: ['admin']
    })

    if (!user) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    // Fetch all users
    const supabase = await serverSupabaseClient(event)
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, username, email, full_name, phone_number, role, is_verified, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch users'
      })
    }

    return {
      success: true,
      data: users,
      total: users.length
    }

  } catch (error) {
    console.error('Get users error:', error)
    throw error
  }
})

---

// server/api/admin/users/[id]/role.patch.ts
// Example: Update user role (admin only)

import { verifyAuth } from '../../middleware/rbac'

export default defineEventHandler(async (event) => {
  try {
    // Verify admin access
    const admin = await verifyAuth(event, { 
      requireAuth: true,
      allowedRoles: ['admin']
    })

    const userId = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { role } = body

    if (!userId || !role) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID and role are required'
      })
    }

    // Validate role
    const validRoles = ['user', 'moderator', 'admin']
    if (!validRoles.includes(role)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      })
    }

    // Update user role
    const supabase = await serverSupabaseClient(event)
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update user role'
      })
    }

    return {
      success: true,
      message: `User role updated to ${role}`
    }

  } catch (error) {
    console.error('Update role error:', error)
    throw error
  }
})
