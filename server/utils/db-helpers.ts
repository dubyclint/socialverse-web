// FILE: /server/utils/db-helpers.ts
// ============================================================================
// DATABASE HELPER FUNCTIONS - Use these in API routes
// These functions get the client from H3 event context
// ============================================================================

import type { H3Event } from 'h3'

/**
 * Get Supabase client from event context
 * Use this in your API route handlers
 */
export async function getDB(event: H3Event) {
  const client = event.context.supabase
  
  if (!client) {
    throw new Error('Supabase client not initialized in context')
  }
  
  return client
}

/**
 * Get Supabase admin client from event context
 * Use this in your API route handlers that need admin access
 */
export async function getDBAdmin(event: H3Event) {
  const client = event.context.supabaseAdmin
  
  if (!client) {
    throw new Error('Supabase admin client not initialized in context')
  }
  
  return client
}

/**
 * Execute a query with the client from context
 */
export async function query(event: H3Event, table: string) {
  const client = await getDB(event)
  return client.from(table)
}

/**
 * Execute an admin query with the admin client from context
 */
export async function queryAdmin(event: H3Event, table: string) {
  const client = await getDBAdmin(event)
  return client.from(table)
}

/**
 * Execute an RPC function
 */
export async function rpc(event: H3Event, functionName: string, params?: Record<string, any>) {
  const client = await getDBAdmin(event)
  return client.rpc(functionName, params)
}
