import type { H3Event } from 'h3'
import { requireUser } from '~/server/utils/auth'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { AD_COLUMNS } from '~/server/utils/ads'
import type { AdRow } from '~/server/utils/ads'

/** Loads a campaign the signed-in user owns, or 404. */
export const loadOwnCampaign = async (event: H3Event): Promise<AdRow> => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  const { data } = await getServiceClient()
    .from('ads_campaigns')
    .select(AD_COLUMNS)
    .eq('id', id ?? '')
    .eq('advertiser_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })
  return data as unknown as AdRow
}
