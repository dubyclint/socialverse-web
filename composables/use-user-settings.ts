import { ref } from 'vue'
import type { SettingsSection, UserSettings } from '~/shared/user-settings'
import { DEFAULT_USER_SETTINGS } from '~/shared/user-settings'

export type { UserSettings, SettingsSection } from '~/shared/user-settings'

/**
 * Private per-user settings (account, privacy, notifications, storage & data,
 * general). Shared across the app so chat, profile and the settings page all
 * read and write the same persisted record.
 */
export const useUserSettings = () => {
  const settings = useState<UserSettings>('user-settings', () => ({ ...DEFAULT_USER_SETTINGS }))
  const loaded = useState<boolean>('user-settings-loaded', () => false)
  const saving = ref(false)
  const error = ref('')

  const load = async (force = false): Promise<void> => {
    if (loaded.value && !force) return
    try {
      const response = await $fetch<{ settings: UserSettings }>('/api/settings/me')
      settings.value = response.settings
      loaded.value = true
    } catch {
      error.value = 'Could not load your settings'
    }
  }

  const update = async <S extends SettingsSection>(
    section: S,
    patch: Partial<UserSettings[S]>
  ): Promise<void> => {
    const previous = settings.value
    settings.value = {
      ...previous,
      [section]: { ...previous[section], ...patch }
    }
    saving.value = true
    error.value = ''
    try {
      const response = await $fetch<{ settings: UserSettings }>('/api/settings/me', {
        method: 'PATCH',
        body: { [section]: patch }
      })
      settings.value = response.settings
      loaded.value = true
    } catch {
      settings.value = previous
      error.value = 'Could not save that setting'
    } finally {
      saving.value = false
    }
  }

  return { settings, loaded, saving, error, load, update }
}
