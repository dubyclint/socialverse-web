// server/api/wallet/balance.get.ts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const client = await serverSupabaseClient(event)
  
  const { data, error } = await client
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()
    
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
