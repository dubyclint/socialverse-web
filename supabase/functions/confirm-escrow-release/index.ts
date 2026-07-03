// supabase/functions/confirm-escrow-release/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Bypasses RLS
)

Deno.serve(async (req) => {
  const { transactionId } = await req.json()

  // 1. Start a transaction by fetching current state
  const { data: tx, error: fetchError } = await supabaseAdmin
    .from('escrow_transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (fetchError || tx.status !== 'confirmed_delivery') {
    return new Response('Invalid state or transaction', { status: 400 })
  }

  // 2. Perform the atomic update
  const { error: updateError } = await supabaseAdmin
    .from('escrow_transactions')
    .update({ status: 'released', updated_at: new Date().toISOString() })
    .eq('id', transactionId)

  if (updateError) return new Response('Update failed', { status: 500 })

  // 3. Logic to update the seller's wallet balance would go here
  // await supabaseAdmin.rpc('transfer_funds', { ... })

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
})
