import { createError, defineEventHandler, readBody } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { getServiceClient } from '~/server/utils/supabase-admin'
import {
  DEFAULT_USER_SETTINGS,
  SETTINGS_SECTIONS,
  mergeSettings,
  type SettingsSection
} from '~/shared/user-settings'

/**
 * Partial update of one or more settings sections. Unknown sections and keys
 * are ignored so a stale client cannot write arbitrary preferences.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const body = await readBody<Partial<Record<SettingsSection, Record<string, unknown>>>>(event)
  const requested = SETTINGS_SECTIONS.filter(section => body?.[section] !== undefined)

  if (!requested.length) {
    throw createError({ statusCode: 400, statusMessage: 'No settings supplied' })
  }

  const service = getServiceClient()
  const { data: existing } = await service
    .from('user_settings')
    .select('account, privacy, notifications, storage_data, general')
    .eq('user_id', user.id)
    .maybeSingle()

  const current = existing ? mergeSettings(existing) : DEFAULT_USER_SETTINGS
  const next = mergeSettings({
    ...current,
    ...Object.fromEntries(requested.map(section => [
      section,
      { ...current[section], ...(body[section] ?? {}) }
    ]))
  })

  const { error } = await service
    .from('user_settings')
    .upsert({
      user_id: user.id,
      account: next.account,
      privacy: next.privacy,
      notifications: next.notifications,
      storage_data: next.storage_data,
      general: next.general,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) throw createError({ statusCode: 500, statusMessage: 'Could not save settings' })

  // Private-account visibility also lives on the profile row used by feeds.
  if (body.privacy && 'isPrivateAccount' in body.privacy) {
    await service
      .from('user')
      .update({ is_private: next.privacy.isPrivateAccount })
      .eq('user_id', user.id)
  }

  return { success: true, settings: next }
})
