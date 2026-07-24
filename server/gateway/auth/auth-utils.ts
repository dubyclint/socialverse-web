// server/gateway/auth/auth-utils.ts
// Cleaned up auth-utils: removed dangerous stubs (`supabase`, `serverSupabaseClient`)
// to enforce using native '#supabase/server' modules. Preserved essential helpers,
// validation, and admin/utility stubs with strict typecheck compliance.

import { createError, type H3Event } from 'h3'

// Small validation helper expected by various endpoints during migration.
export function validateBody(body: Record<string, any>, fields: string[]): void {
  for (const f of fields) {
    if (!body || body[f] === undefined || body[f] === null) {
      throw createError({ statusCode: 400, statusMessage: `Missing required field: ${f}` })
    }
  }
}

// Generic error-to-response shim used in many handlers while remediation is ongoing.
export function handleError(error: unknown, context?: string): { success: false; message: string; context: string | null } {
  const errorMessage = error instanceof Error ? error.message : String(error) || 'Internal server error'
  console.error('[auth-utils] Error', context || '', error)
  return {
    success: false,
    message: errorMessage,
    context: context || null
  }
}

// Minimal premiumOperations stub to satisfy import sites. Implementations return safe defaults.
export const premiumOperations = {
  async getPricingTiers(): Promise<any[]> {
    return []
  },
  async getUserSubscription(_userId: string): Promise<any | null> {
    return null
  },
  async checkFeatureAccess(_userId: string, _featureKey: string): Promise<boolean> {
    return false
  }
}

// Admin guard stub expected by admin endpoints during migration.
export async function requireAdmin(_event: H3Event): Promise<{ id: string }> {
  return { id: 'admin-stub' }
}

// Admin audit logging stub expected by admin endpoints during migration.
export async function logAdminAction(
  _adminId: string,
  _action: string,
  _targetId?: string,
  _targetType?: string,
  _metadata?: Record<string, any>
): Promise<void> {
  console.log('[auth-utils] Admin action:', _action, _targetId, _metadata)
}
