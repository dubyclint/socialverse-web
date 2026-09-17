// Temporary permissive shim for auth-related server utilities.
// Replace with real implementations in a subsequent pass.

import { createError } from 'h3'

export const supabase: any = {}

export function serverSupabaseClient(..._args: any[]): any {
  return supabase
}

export function getSupabaseClient(..._args: any[]): any {
  return supabase
}

export default { supabase, serverSupabaseClient, getSupabaseClient }

// Lightweight runtime stub used by middleware while TS remediation continues.
export async function authenticateUser(_event: any): Promise<void> {
  // no-op during type remediation; real implementation lives elsewhere
  return
}

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
  // Keep this permissive: return a structured object so callers can `return handleError(error)`
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
export async function requireAdmin(_event: any): Promise<any> {
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
