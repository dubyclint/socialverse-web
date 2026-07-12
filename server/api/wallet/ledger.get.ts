// server/api/wallet/ledger.get.ts
import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const client = await serverSupabaseClient(event)
  
  // Get query params for pagination
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = 20
  const offset = (page - 1) * limit

  // Fetch the ledger entries for the user
  const { data, error } = await client
    .from('wallet_ledger')
    .select('*')
    .eq('wallet_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
    
  if (error) throw createError({ statusCode: 500, message: error.message })
  
  return data
})
