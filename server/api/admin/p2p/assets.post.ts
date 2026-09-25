import { serverSupabaseClient } from '#supabase/server'
import { requireRole } from '~/server/utils/rbac'
import type { Database } from '~/types/database.types'

interface AssetBody {
  code?: string
  kind?: Database['public']['Enums']['p2p_asset_kind']
  displayName?: string
  network?: string
  decimals?: number
  referenceRate?: number
  minDeposit?: number
  maxDeposit?: number
  isEnabled?: boolean
  sortOrder?: number
}

/**
 * Upsert a deposit asset. The 20-enabled-crypto cap is enforced by a database
 * trigger, so a race between two admins cannot exceed it.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'admin')
  const body = await readBody<AssetBody>(event)
  const supabase = await serverSupabaseClient<Database>(event)

  if (!body.code || !body.kind) {
    throw createError({ statusCode: 400, statusMessage: 'code and kind are required' })
  }
  if (body.referenceRate !== undefined && body.referenceRate <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'referenceRate must be positive' })
  }

  const patch: Database['public']['Tables']['supported_assets']['Insert'] = {
    code: body.code.toUpperCase(),
    kind: body.kind,
    display_name: body.displayName ?? body.code.toUpperCase(),
    updated_at: new Date().toISOString()
  }
  if (body.network !== undefined) patch.network = body.network
  if (body.decimals !== undefined) patch.decimals = body.decimals
  if (body.minDeposit !== undefined) patch.min_deposit = body.minDeposit
  if (body.maxDeposit !== undefined) patch.max_deposit = body.maxDeposit
  if (body.isEnabled !== undefined) patch.is_enabled = body.isEnabled
  if (body.sortOrder !== undefined) patch.sort_order = body.sortOrder
  if (body.referenceRate !== undefined) {
    patch.reference_rate = body.referenceRate
    patch.rate_updated_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('supported_assets')
    .upsert(patch, { onConflict: 'code' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 400, statusMessage: error.message })
  return { asset: data }
})
