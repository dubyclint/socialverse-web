// server/utils/auth.ts
import { createClient } from '@supabase/supabase-js'

export const requireAuth = async (event: any) => {
  try {
    // Get token from Authorization header
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Missing authorization header'
      })
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid authorization header'
      })
    }

    // Verify token with Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.error('[Auth] Token verification failed:', error)
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    console.log('[Auth] ✅ User authenticated:', user.id)
    return user

  } catch (error: any) {
    console.error('[Auth] Error:', error)
    throw createError({
      statusCode: error.statusCode || 401,
      statusMessage: error.statusMessage || 'Unauthorized'
    })
  }
}
