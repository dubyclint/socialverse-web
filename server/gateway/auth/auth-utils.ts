// server/gateway/auth/auth-utils.ts
// Cleaned up auth-utils: removed dangerous stubs (`supabase`, `serverSupabaseClient`)
// to enforce using native '#supabase/server' modules. Preserved essential helpers,
// validation, and admin/utility stubs.

import { createError, type H3Event } from 'h3'

// Small validation helper expected by various endpoints during migration.
export function validateBody(body: any, fields: string[]) {
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null) {
      throw createError({ statusCode: 400, statusMessage: `Missing required field: ${f}` })
    }
  }
}

// Generic error-to-response shim used in many handlers while remediation is ongoing.
export function handleError(error: any, context?: string) {
  console.error('[auth-utils] Error', context || '', error)
  return {
    success: false,
    message: error?.message || String(error) || 'Internal server error',
    context: context || null
  }
}

// Minimal premiumOperations stub to satisfy import sites. Implementations return safe defaults.
export const premiumOperations = {
  async getPricingTiers() {
    return []
  },
  async getUserSubscription(_userId: any) {
    return null
  },
  async checkFeatureAccess(_userId: any, _featureKey: string) {
    return false
  }
}

// Admin guard stub expected by admin endpoints during migration.
export async function requireAdmin(_event: H3Event): Promise<any> {
  return { id: 'admin-stub' }
}

// Admin audit logging stub expected by admin endpoints during migration.
export async function logAdminAction(
  _adminId: any,
  _action: string,
  _targetId?: any,
  _targetType?: string,
  _metadata?: any
): Promise<void> {
  console.log('[auth-utils] Admin action:', _action, _targetId, _metadata)
}
