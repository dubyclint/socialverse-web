import type { H3Event } from 'h3'

// Minimal requireAdmin helper used by admin controllers. This is a permissive shim
// that checks for an 'is_admin' flag on the authenticated user. Replace with
// project-specific admin validation later.
export async function requireAdmin(event: H3Event): Promise<void> {
  // Attempt to reuse existing requireAuth if available
  try {
    // Lazy import to avoid circular deps
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireAuth } = await import('~/server/gateway/auth/auth-bouncer')
    const user = await requireAuth(event as any)
    if (!user || !user.is_admin) {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }
  } catch (err) {
    // If anything goes wrong, rethrow a generic forbidden error
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }
}

export default requireAdmin
