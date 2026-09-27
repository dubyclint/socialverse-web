import { ref } from 'vue'
import { useDevicePlatform } from '~/composables/use-device-platform'

export interface DeviceContact {
  name: string
  phone: string
}

export interface ContactEntry {
  id: string | null
  username: string | null
  name: string
  avatar_url: string | null
  is_verified: boolean
  registered: boolean
  pal_status: 'none' | 'pending_out' | 'pending_in' | 'accepted' | 'blocked'
}

interface ContactsResponse {
  success: boolean
  onApp: ContactEntry[]
  invitable: ContactEntry[]
  lastSyncedAt: string | null
}

interface SyncResponse {
  success: boolean
  saved: number
  matched: number
  contacts: Array<{ id: string, username: string | null, name: string, avatar_url: string | null }>
}

interface WebContact {
  name?: string[]
  tel?: string[]
}

interface ContactsManager {
  select: (properties: string[], options?: { multiple?: boolean }) => Promise<WebContact[]>
  getProperties: () => Promise<string[]>
}

/**
 * Address-book access. Native builds use the Capacitor Contacts plugin, Chrome
 * on Android uses the Contact Picker API, and anywhere else the user can paste
 * numbers manually — no platform silently pretends to have synced.
 */
export const useContacts = () => {
  const { isNative, isPluginAvailable } = useDevicePlatform()

  const onApp = ref<ContactEntry[]>([])
  const invitable = ref<ContactEntry[]>([])
  const lastSyncedAt = ref<string | null>(null)
  const loading = ref(false)
  const syncing = ref(false)
  const error = ref('')

  const pickerAvailable = (): boolean =>
    (isNative.value && isPluginAvailable('Contacts'))
    || (import.meta.client && 'contacts' in navigator && 'ContactsManager' in window)

  const readDeviceContacts = async (): Promise<DeviceContact[]> => {
    if (isNative.value && isPluginAvailable('Contacts')) {
      const { Contacts } = await import('@capacitor-community/contacts')
      const permission = await Contacts.requestPermissions()
      if (permission.contacts !== 'granted') {
        throw new Error('Contacts permission denied')
      }
      const result = await Contacts.getContacts({ projection: { name: true, phones: true } })
      return result.contacts.flatMap(contact =>
        (contact.phones ?? [])
          .map(phone => phone.number?.trim())
          .filter((number): number is string => Boolean(number))
          .map(number => ({ name: contact.name?.display ?? '', phone: number })))
    }

    const manager = (navigator as Navigator & { contacts?: ContactsManager }).contacts
    if (manager) {
      const selection = await manager.select(['name', 'tel'], { multiple: true })
      return selection.flatMap(contact =>
        (contact.tel ?? []).map(number => ({ name: contact.name?.[0] ?? '', phone: number })))
    }

    throw new Error('Contact access is not available on this device')
  }

  const load = async (): Promise<void> => {
    loading.value = true
    error.value = ''
    try {
      const response = await $fetch<ContactsResponse>('/api/contacts')
      onApp.value = response.onApp
      invitable.value = response.invitable
      lastSyncedAt.value = response.lastSyncedAt
    } catch {
      error.value = 'Could not load your contacts'
    } finally {
      loading.value = false
    }
  }

  const deviceCountry = (): string | undefined => {
    if (!import.meta.client) return undefined
    const locale = navigator.language || ''
    const region = locale.split('-')[1]
    return region ? region.toUpperCase() : undefined
  }

  /** Uploads normalised numbers; returns how many matched real accounts. */
  const sync = async (contacts: DeviceContact[]): Promise<SyncResponse> => {
    syncing.value = true
    error.value = ''
    try {
      const response = await $fetch<SyncResponse>('/api/contacts/sync', {
        method: 'POST',
        body: { contacts, defaultCountry: deviceCountry() }
      })
      await load()
      return response
    } finally {
      syncing.value = false
    }
  }

  const syncFromDevice = async (): Promise<SyncResponse> => {
    const contacts = await readDeviceContacts()
    if (!contacts.length) throw new Error('No phone numbers found in your contacts')
    return sync(contacts)
  }

  /** Accepts pasted text, one number (optionally `Name, +234…`) per line. */
  const syncFromText = async (input: string): Promise<SyncResponse> => {
    const contacts = input
      .split(/[\n;]/)
      .map((line) => {
        const parts = line.split(',')
        const phone = (parts[parts.length - 1] ?? '').trim()
        const name = parts.length > 1 ? parts.slice(0, -1).join(',').trim() : ''
        return { name, phone }
      })
      .filter(entry => entry.phone.replace(/\D/g, '').length >= 7)

    if (!contacts.length) throw new Error('No usable phone numbers found')
    return sync(contacts)
  }

  return {
    onApp,
    invitable,
    lastSyncedAt,
    loading,
    syncing,
    error,
    pickerAvailable,
    load,
    sync,
    syncFromDevice,
    syncFromText
  }
}
