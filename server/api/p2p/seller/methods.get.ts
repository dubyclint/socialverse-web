import { serverSupabaseClient } from '#supabase/server'
import { requireSeller } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const seller = await requireSeller(event)
  const supabase = await serverSupabaseClient<Database>(event)

  const { data, error } = await supabase
    .from('seller_payment_methods')
    .select('*')
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { methods: data ?? [], maxMarginPct: seller.maxMarginPct }
})
