import { createError, defineEventHandler } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'
import { DEFAULT_USER_SETTINGS, mergeSettings } from '~/shared/user-settings'

/** Private per-user settings, merged over the documented defaults. */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const service = getServiceClient()
  const { data, error } = await service
    .from('user_settings')
    .select('account, privacy, notifications, storage_data, general')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not load settings' })

  return {
    success: true,
    settings: data ? mergeSettings(data) : DEFAULT_USER_SETTINGS
  }
})
