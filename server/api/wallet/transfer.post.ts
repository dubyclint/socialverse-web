// server/api/wallet/transfer.post.ts
import { serverSupabaseClient } from '#supabase/server'
import { requireAuth } from '~/server/gateway/auth/auth-bouncer'
import { readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event) // { counterpartId, amount, type }
  
  const client = await serverSupabaseClient(event)

  // Call the atomic SQL function we created
  const { data, error } = await client.rpc('atomic_transfer', {
    p_sender_id: user.id,
    p_receiver_id: body.counterpartId,
    p_amount: body.amount,
    p_type: body.type
  })

  if (error) {
    throw createError({ statusCode: 500, message: 'Transfer failed: ' + error.message })
  }

  return { success: true, transaction_id: data }
})
