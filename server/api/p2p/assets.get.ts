import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

/** Public catalogue of deposit assets a buyer may pick from. */
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const { kind } = getQuery(event) as { kind?: string }

  let query = supabase
    .from('supported_assets')
    .select('code, kind, display_name, network, decimals, min_deposit, max_deposit, reference_rate')
    .eq('is_enabled', true)
    .order('sort_order')
    .order('code')

  if (kind === 'FIAT' || kind === 'CRYPTO') query = query.eq('kind', kind)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return {
    notice: 'For all bank local currency deposits or crypto',
    assets: data ?? []
  }
})
