export type Visibility = 'everyone' | 'contacts' | 'nobody'

export interface AccountSettings {
  [key: string]: string | number | boolean
  twoFactorEnabled: boolean
  appLockType: 'none' | 'pin' | 'pattern' | 'fingerprint'
}

export interface PrivacySettings {
  [key: string]: string | number | boolean
  lastSeen: Visibility
  profilePhoto: Visibility
  about: Visibility
  status: Visibility
  readReceipts: boolean
  groups: Visibility
  silenceUnknownCallers: boolean
  contactSyncEnabled: boolean
  disappearingMessages: 'off' | '24h' | '7d' | '60d'
  isPrivateAccount: boolean
}

export interface NotificationSettings {
  [key: string]: string | number | boolean
  conversationTones: boolean
  reminders: boolean
  messagePreview: boolean
  pushEnabled: boolean
  emailDigest: boolean
}

export interface StorageDataSettings {
  [key: string]: string | number | boolean
  autoDownloadPhotos: 'never' | 'wifi' | 'always'
  autoDownloadVideos: 'never' | 'wifi' | 'always'
  autoDownloadDocuments: 'never' | 'wifi' | 'always'
  mediaUploadQuality: 'standard' | 'hd'
  dataSaver: boolean
}

export interface GeneralSettings {
  [key: string]: string | number | boolean
  language: string
  theme: 'system' | 'dark' | 'light'
  chatWallpaper: string
  enterToSend: boolean
  idleLogoutMinutes: number
}

export interface UserSettings {
  account: AccountSettings
  privacy: PrivacySettings
  notifications: NotificationSettings
  storage_data: StorageDataSettings
  general: GeneralSettings
}

export const SETTINGS_SECTIONS = [
  'account',
  'privacy',
  'notifications',
  'storage_data',
  'general'
] as const

export type SettingsSection = typeof SETTINGS_SECTIONS[number]

export const DEFAULT_USER_SETTINGS: UserSettings = {
  account: {
    twoFactorEnabled: false,
    appLockType: 'none'
  },
  privacy: {
    lastSeen: 'contacts',
    profilePhoto: 'everyone',
    about: 'contacts',
    status: 'contacts',
    readReceipts: true,
    groups: 'contacts',
    silenceUnknownCallers: false,
    contactSyncEnabled: false,
    disappearingMessages: 'off',
    isPrivateAccount: false
  },
  notifications: {
    conversationTones: true,
    reminders: false,
    messagePreview: true,
    pushEnabled: true,
    emailDigest: false
  },
  storage_data: {
    autoDownloadPhotos: 'wifi',
    autoDownloadVideos: 'never',
    autoDownloadDocuments: 'never',
    mediaUploadQuality: 'standard',
    dataSaver: false
  },
  general: {
    language: 'en',
    theme: 'system',
    chatWallpaper: 'default',
    enterToSend: true,
    idleLogoutMinutes: 30
  }
}

type StoredSettings = Partial<Record<SettingsSection, unknown>>

/** Stored values win over defaults, unknown keys are dropped. */
export const mergeSettings = (stored: StoredSettings): UserSettings => {
  const merged = { ...DEFAULT_USER_SETTINGS }

  for (const section of SETTINGS_SECTIONS) {
    const value = stored[section]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const defaults = DEFAULT_USER_SETTINGS[section] as Record<string, unknown>
      const incoming = value as Record<string, unknown>
      const next: Record<string, unknown> = { ...defaults }
      for (const key of Object.keys(defaults)) {
        if (key in incoming && typeof incoming[key] === typeof defaults[key]) {
          next[key] = incoming[key]
        }
      }
      Object.assign(merged, { [section]: next })
    }
  }

  return merged
}
