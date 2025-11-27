// FILE: /server/plugins/database-context.ts
// ============================================================================
// DATABASE CONTEXT PLUGIN - Initializes Supabase clients in H3 context
// This plugin runs at startup and provides clients to all handlers
// ============================================================================

import { getSupabaseClient, getSupabaseAdminClient } from '~/server/utils/database'

export default defineNitroPlugin((nitroApp) => {
  console.log('[Database Context Plugin] Initializing...')

  // Initialize clients once at startup (lazy - only when first needed)
  let clientPromise: Promise<any> | null = null
  let adminClientPromise: Promise<any> | null = null
  let initialized = false

  // Hook into every request to provide context
  nitroApp.hooks.hook('request', async (context) => {
    try {
      // Lazy initialize clients on first request
      if (!initialized) {
        clientPromise = getSupabaseClient()
        adminClientPromise = getSupabaseAdminClient()
        initialized = true
      }

      // Wait for both to initialize
      const [client, adminClient] = await Promise.all([
        clientPromise,
        adminClientPromise
      ])

      // Attach to event context
      context.event.context.supabase = client
      context.event.context.supabaseAdmin = adminClient

      console.log('[Database Context] Clients attached to context')
    } catch (error) {
      console.error('[Database Context] Failed to initialize clients:', error)
      // Don't throw - let handlers deal with missing clients gracefully
    }
  })
})
