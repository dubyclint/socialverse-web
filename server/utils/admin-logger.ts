// Minimal admin action logger shim. Writes to console and optionally to Supabase RPC later.
export async function logAdminAction(adminId: string, action: string, targetId?: string, targetType?: string, meta?: any) {
  try {
    console.log(`[AdminLog] admin=${adminId} action=${action} target=${targetType}:${targetId}`, meta || '')
  } catch (err) {
    // swallow to avoid blocking admin flows
    console.warn('[AdminLog] failed to log action', err)
  }
}

export default logAdminAction
