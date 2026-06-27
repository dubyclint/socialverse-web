// server/api/middleware/rbac.ts
// Role-Based Access Control Middleware

export interface AuthenticatedUser {
  id: string
  email: string
  username: string
  role: string
  iat?: number
  exp?: number
}

export interface RBACOptions {
  allowedRoles?: string[]
  requireAuth?: boolean
}

/**
 * RBAC Middleware to verify user authentication and role
 * Usage: await verifyAuth(event, { allowedRoles: ['admin', 'moderator'] })
 */
export async function verifyAuth(event: any, options: RBACOptions = {}) {
  const { allowedRoles = [], requireAuth = true } = options

  try {
    // Get authorization header
    const authHeader = getHeader(event, 'authorization')
    
    if (!authHeader) {
      if (requireAuth) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Missing authorization header'
        })
      }
      return null
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '')
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid authorization header format'
      })
    }

    // Verify JWT token
    const user = await verifyJWT(token)

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired token'
      })
    }

    // Check role-based access
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      })
    }

    return user

  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication failed'
    })
  }
}

/**
 * Verify JWT token
 */
async function verifyJWT(token: string): Promise<AuthenticatedUser | null> {
  try {
    // Import your JWT verification logic
    // This is a placeholder - implement with your JWT library
    
    // Example using jsonwebtoken:
    // const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] })
    // return decoded as AuthenticatedUser

    // For now, basic validation
    if (!token || token.length < 10) {
      return null
    }

    // Parse token (this is simplified - use proper JWT verification)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode payload (base64)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload as AuthenticatedUser

  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

/**
 * Get user from session (alternative method)
 */
export async function getUserFromSession(event: any) {
  try {
    const supabase = await serverSupabaseClient(event)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return null
    }

    // Fetch full profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    return {
      id: session.user.id,
      email: session.user.email,
      ...profile
    }

  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}
