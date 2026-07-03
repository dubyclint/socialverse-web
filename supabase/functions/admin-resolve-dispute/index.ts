import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  // 1. Get the user from the incoming request (JWT verification is automatic)
  const authHeader = req.headers.get('Authorization')!
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await userClient.auth.getUser()

  // 2. Verify Admin Role (assuming you have a 'profiles' table with a 'role' column)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return new Response('Unauthorized: Admin access required', { status: 403 })
  }

  // 3. Admin logic: Call the stored procedure (RPC) securely
  const { transactionId, disputeId, action } = await req.json()
  
  const { error } = await supabaseAdmin.rpc('admin_resolve_dispute', {
    p_transaction_id: transactionId,
    p_dispute_id: disputeId,
    p_action: action,
    p_admin_id: user?.id
  })

  if (error) return new Response(error.message, { status: 500 })
  return new Response(JSON.stringify({ success: true }))
})
