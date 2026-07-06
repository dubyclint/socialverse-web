// server/utils/auth.ts
export { requireAuth } from './token-validator'

/**
 * Enhanced permission guard for restricted features
 * Usage: const user = await requirePermission(event, 'verified')
 */
export const requirePermission = async (event: any, level: 'verified' | 'premium') => {
  const user = await requireAuth(event)
  
  // Logic: Verify the user against the database record 
  // (Assuming 'user' object from requireAuth contains these flags)
  if (level === 'verified' && !user.is_verified) {
    throw createError({ 
      statusCode: 403, 
      message: 'Access Denied: Verification required.' 
    })
  }

  if (level === 'premium' && !user.is_premium) {
    throw createError({ 
      statusCode: 403, 
      message: 'Access Denied: Premium subscription required.' 
    })
  }

  return user
}
