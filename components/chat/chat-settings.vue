<!-- components/chat/chat-settings.vue -->
<template>
  <div class="settings-overlay" @click="handleOverlayClick">
    <div class="settings-panel" @click.stop>
      <div class="settings-header">
        <button v-if="currentSection !== 'main'" class="back-btn" @click="goBack">
          <Icon name="arrow-left" />
        </button>
        <h3>{{ sectionTitles[currentSection] }}</h3>
        <button class="close-btn" @click="$emit('close')">
          <Icon name="x" />
        </button>
      </div>

      <div class="settings-content">
        <p v-if="error" class="settings-error">{{ error }}</p>

        <!-- Main Settings Menu -->
        <div v-if="currentSection === 'main'" class="main-menu">
          <div class="settings-section">
            <div class="section-title">Account</div>
            <settings-item
              icon="shield"
              title="Security Notice"
              subtitle="How your chats are protected"
              @click="currentSection = 'security'"
            />
            <settings-item
              icon="mail"
              title="Email Address"
              :subtitle="userEmail"
              :badge="emailVerified ? 'Verified' : 'Unverified'"
              @click="currentSection = 'email'"
            />
            <settings-item
              icon="lock"
              title="App Lock"
              :subtitle="appLockLabel"
              @click="currentSection = 'appLock'"
            />
            <settings-item
              icon="info"
              title="Request Account Info"
              subtitle="Download your chat history"
              @click="downloadChatHistory"
            />
            <settings-item
              icon="trash-2"
              title="Delete Account"
              subtitle="Permanently delete your account"
              danger
              @click="goToDeleteAccount"
            />
          </div>

          <div class="settings-section">
            <div class="section-title">Privacy</div>
            <settings-item
              icon="eye"
              title="Status"
              :subtitle="visibilityLabel(settings.privacy.status)"
              @click="currentSection = 'statusPrivacy'"
            />
            <settings-item
              icon="check-check"
              title="Read Receipts"
              :subtitle="settings.privacy.readReceipts ? 'On' : 'Off'"
              @click="update('privacy', { readReceipts: !settings.privacy.readReceipts })"
            />
            <settings-item
              icon="clock"
              title="Disappearing Messages"
              :subtitle="disappearingLabel"
              @click="currentSection = 'disappearingMessages'"
            />
            <settings-item
              icon="users"
              title="Groups"
              :subtitle="visibilityLabel(settings.privacy.groups)"
              @click="currentSection = 'groupPrivacy'"
            />
            <settings-item
              icon="phone-off"
              title="Silence Unknown Callers"
              :subtitle="settings.privacy.silenceUnknownCallers ? 'On' : 'Off'"
              @click="update('privacy', { silenceUnknownCallers: !settings.privacy.silenceUnknownCallers })"
            />
            <settings-item
              icon="user-x"
              title="Blocked Contacts"
              :subtitle="`${blocked.length} blocked`"
              @click="openBlockedContacts"
            />
            <settings-item
              icon="refresh-cw"
              title="Contact Sync"
              :subtitle="settings.privacy.contactSyncEnabled ? 'On' : 'Off'"
              @click="update('privacy', { contactSyncEnabled: !settings.privacy.contactSyncEnabled })"
            />
          </div>

          <div class="settings-section">
            <div class="section-title">Notifications</div>
            <settings-item
              icon="volume-2"
              title="Conversation Tones"
              :subtitle="settings.notifications.conversationTones ? 'On' : 'Off'"
              @click="update('notifications', { conversationTones: !settings.notifications.conversationTones })"
            />
            <settings-item
              icon="bell"
              title="Push Notifications"
              :subtitle="settings.notifications.pushEnabled ? 'On' : 'Off'"
              @click="update('notifications', { pushEnabled: !settings.notifications.pushEnabled })"
            />
            <settings-item
              icon="message-square"
              title="Message Preview"
              :subtitle="settings.notifications.messagePreview ? 'On' : 'Off'"
              @click="update('notifications', { messagePreview: !settings.notifications.messagePreview })"
            />
            <settings-item
              icon="clock"
              title="Reminders"
              :subtitle="settings.notifications.reminders ? 'On' : 'Off'"
              @click="update('notifications', { reminders: !settings.notifications.reminders })"
            />
            <settings-item
              icon="mail"
              title="Email Digest"
              :subtitle="settings.notifications.emailDigest ? 'On' : 'Off'"
              @click="update('notifications', { emailDigest: !settings.notifications.emailDigest })"
            />
          </div>

          <div class="settings-section">
            <div class="section-title">Storage and Data</div>
            <settings-item
              icon="hard-drive"
              title="Manage Storage"
              subtitle="View and clear your chat data"
              @click="openStorage"
            />
            <settings-item
              icon="wifi"
              title="Auto-Download"
              :subtitle="autoDownloadLabel"
              @click="currentSection = 'networkUsage'"
            />
            <settings-item
              icon="image"
              title="Media Upload Quality"
              :subtitle="settings.storage_data.mediaUploadQuality === 'hd' ? 'HD' : 'Standard'"
              @click="currentSection = 'mediaQuality'"
            />
            <settings-item
              icon="zap"
              title="Data Saver"
              :subtitle="settings.storage_data.dataSaver ? 'On' : 'Off'"
              @click="update('storage_data', { dataSaver: !settings.storage_data.dataSaver })"
            />
          </div>

          <div class="settings-section">
            <div class="section-title">General</div>
            <settings-item
              icon="globe"
              title="App Language"
              :subtitle="languageLabel"
              @click="currentSection = 'language'"
            />
            <settings-item
              icon="palette"
              title="Theme"
              :subtitle="themeLabel"
              @click="currentSection = 'chatTheme'"
            />
            <settings-item
              icon="corner-down-left"
              title="Enter Sends Message"
              :subtitle="settings.general.enterToSend ? 'On' : 'Off'"
              @click="update('general', { enterToSend: !settings.general.enterToSend })"
            />
            <settings-item
              icon="log-out"
              title="Auto Logout"
              :subtitle="`${settings.general.idleLogoutMinutes} minutes idle`"
              @click="currentSection = 'idleLogout'"
            />
            <settings-item
              icon="help-circle"
              title="Help"
              subtitle="Contact support agent"
              @click="contactSupport"
            />
            <settings-item
              icon="file-text"
              title="Terms & Conditions"
              subtitle="View T&Cs"
              @click="openTerms"
            />
            <settings-item
              icon="share"
              title="Invite a Friend"
              subtitle="Share via SMS"
              @click="openInvite"
            />
          </div>
        </div>

        <!-- Security Notice -->
        <div v-else-if="currentSection === 'security'" class="notice-block">
          <p>
            Direct and group chats are delivered over an authenticated connection and are
            only readable by the members of the conversation and you on your devices.
          </p>
          <p>
            Viorp never sells your messages, contacts or profile data. Contact sync only
            uploads irreversible hashes of phone numbers, never the numbers themselves.
          </p>
        </div>

        <!-- Email -->
        <div v-else-if="currentSection === 'email'" class="notice-block">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">{{ userEmail }}</div>
              <div class="setting-description">
                {{ emailVerified ? 'Verified address' : 'Not verified yet' }}
              </div>
            </div>
            <NuxtLink v-if="!emailVerified" class="setting-action" to="/verify-email">
              Verify
            </NuxtLink>
          </div>
        </div>

        <!-- Status Privacy -->
        <div v-else-if="currentSection === 'statusPrivacy'" class="status-privacy">
          <div class="option-list">
            <div
              v-for="option in visibilityOptions"
              :key="option.value"
              class="option-item"
              :class="{ active: settings.privacy.status === option.value }"
              @click="update('privacy', { status: option.value })"
            >
              <div class="option-info">
                <div class="option-title">{{ option.label }}</div>
                <div class="option-description">{{ option.description }}</div>
              </div>
              <div class="option-radio">
                <div v-if="settings.privacy.status === option.value" class="radio-dot" />
              </div>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">Private Account</div>
              <div class="setting-description">Only approved PALs can see your posts</div>
            </div>
            <ToggleSwitch
              :model-value="settings.privacy.isPrivateAccount"
              @update:model-value="update('privacy', { isPrivateAccount: $event })"
            />
          </div>
        </div>

        <!-- Group Privacy -->
        <div v-else-if="currentSection === 'groupPrivacy'" class="option-list">
          <div
            v-for="option in visibilityOptions"
            :key="option.value"
            class="option-item"
            :class="{ active: settings.privacy.groups === option.value }"
            @click="update('privacy', { groups: option.value })"
          >
            <div class="option-info">
              <div class="option-title">{{ option.label }}</div>
              <div class="option-description">Who can add you to groups</div>
            </div>
            <div class="option-radio">
              <div v-if="settings.privacy.groups === option.value" class="radio-dot" />
            </div>
          </div>
        </div>

        <!-- Disappearing Messages -->
        <div v-else-if="currentSection === 'disappearingMessages'" class="option-list">
          <div
            v-for="option in disappearingOptions"
            :key="option.value"
            class="option-item"
            :class="{ active: settings.privacy.disappearingMessages === option.value }"
            @click="update('privacy', { disappearingMessages: option.value })"
          >
            <div class="option-info">
              <div class="option-title">{{ option.label }}</div>
              <div class="option-description">{{ option.description }}</div>
            </div>
            <div class="option-radio">
              <div v-if="settings.privacy.disappearingMessages === option.value" class="radio-dot" />
            </div>
          </div>
        </div>

        <!-- Blocked Contacts -->
        <div v-else-if="currentSection === 'blockedContacts'" class="contacts-list">
          <p v-if="!blocked.length" class="empty-note">You have not blocked anyone.</p>
          <div v-for="person in blocked" :key="person.id" class="contact-item">
            <div class="contact-info">
              <div class="contact-name">{{ person.name }}</div>
              <div class="contact-phone">@{{ person.username || 'user' }}</div>
            </div>
            <button class="invite-btn" @click="unblock(person.id)">Unblock</button>
          </div>
        </div>

        <!-- App Lock -->
        <div v-else-if="currentSection === 'appLock'" class="option-list">
          <div
            v-for="option in lockOptions"
            :key="option.value"
            class="option-item"
            :class="{ active: settings.account.appLockType === option.value }"
            @click="update('account', { appLockType: option.value })"
          >
            <Icon :name="option.icon" />
            <div class="option-info">
              <div class="option-title">{{ option.label }}</div>
            </div>
            <div class="option-radio">
              <div v-if="settings.account.appLockType === option.value" class="radio-dot" />
            </div>
          </div>
        </div>

        <!-- Auto-download / network usage -->
        <div v-else-if="currentSection === 'networkUsage'" class="option-list">
          <div v-for="group in autoDownloadGroups" :key="group.key" class="setting-item">
            <div class="setting-info">
              <div class="setting-title">{{ group.label }}</div>
              <div class="setting-description">When to download automatically</div>
            </div>
            <select
              class="setting-select"
              :value="settings.storage_data[group.key]"
              @change="update('storage_data', { [group.key]: ($event.target as HTMLSelectElement).value })"
            >
              <option value="never">Never</option>
              <option value="wifi">Wi-Fi only</option>
              <option value="always">Wi-Fi and mobile data</option>
            </select>
          </div>
        </div>

        <!-- Media quality -->
        <div v-else-if="currentSection === 'mediaQuality'" class="option-list">
          <div
            v-for="option in mediaQualityOptions"
            :key="option.value"
            class="option-item"
            :class="{ active: settings.storage_data.mediaUploadQuality === option.value }"
            @click="update('storage_data', { mediaUploadQuality: option.value })"
          >
            <div class="option-info">
              <div class="option-title">{{ option.label }}</div>
              <div class="option-description">{{ option.description }}</div>
            </div>
            <div class="option-radio">
              <div v-if="settings.storage_data.mediaUploadQuality === option.value" class="radio-dot" />
            </div>
          </div>
        </div>

        <!-- Theme -->
        <div v-else-if="currentSection === 'chatTheme'" class="option-list">
          <div
            v-for="option in themeOptions"
            :key="option.value"
            class="option-item"
            :class="{ active: settings.general.theme === option.value }"
            @click="update('general', { theme: option.value })"
          >
            <div class="option-info">
              <div class="option-title">{{ option.label }}</div>
            </div>
            <div class="option-radio">
              <div v-if="settings.general.theme === option.value" class="radio-dot" />
            </div>
          </div>
        </div>

        <!-- Language -->
        <div v-else-if="currentSection === 'language'" class="option-list">
          <div
            v-for="option in languageOptions"
            :key="option.value"
            class="option-item"
            :class="{ active: settings.general.language === option.value }"
            @click="update('general', { language: option.value })"
          >
            <div class="option-info">
              <div class="option-title">{{ option.label }}</div>
            </div>
            <div class="option-radio">
              <div v-if="settings.general.language === option.value" class="radio-dot" />
            </div>
          </div>
        </div>

        <!-- Idle logout -->
        <div v-else-if="currentSection === 'idleLogout'" class="option-list">
          <div
            v-for="minutes in idleLogoutOptions"
            :key="minutes"
            class="option-item"
            :class="{ active: settings.general.idleLogoutMinutes === minutes }"
            @click="update('general', { idleLogoutMinutes: minutes })"
          >
            <div class="option-info">
              <div class="option-title">{{ minutes }} minutes</div>
              <div class="option-description">Sign out after this much inactivity</div>
            </div>
            <div class="option-radio">
              <div v-if="settings.general.idleLogoutMinutes === minutes" class="radio-dot" />
            </div>
          </div>
        </div>

        <!-- Storage Management -->
        <div v-else-if="currentSection === 'storage'" class="storage-management">
          <div class="storage-overview">
            <div class="storage-item">
              <Icon name="message-circle" />
              <div class="storage-info">
                <div class="storage-label">Messages ({{ storage.messageCount }})</div>
                <div class="storage-size">{{ formatSize(storage.messages) }}</div>
              </div>
            </div>
            <div class="storage-item">
              <Icon name="image" />
              <div class="storage-info">
                <div class="storage-label">Media attachments</div>
                <div class="storage-size">{{ storage.mediaCount }} files</div>
              </div>
            </div>
            <div class="storage-item">
              <Icon name="circle" />
              <div class="storage-info">
                <div class="storage-label">Statuses</div>
                <div class="storage-size">{{ storage.statusCount }} posted</div>
              </div>
            </div>
          </div>

          <div class="storage-actions">
            <button class="action-btn" @click="downloadChatHistory">
              <Icon name="download" />
              Download Chat History
            </button>
            <button class="action-btn danger" @click="clearChatHistory">
              <Icon name="trash-2" />
              Delete My Messages
            </button>
          </div>
        </div>

        <!-- Invite Friend -->
        <div v-else-if="currentSection === 'inviteFriend'" class="invite-friend">
          <div class="invite-message">
            <textarea
              v-model="inviteMessage"
              placeholder="Hey! Join me on Viorp..."
              class="invite-textarea"
              rows="3"
            />
          </div>

          <div class="contacts-list">
            <p v-if="!invitable.length" class="empty-note">
              No contacts to invite yet. Sync your contacts from the chat list first.
            </p>
            <div v-for="contact in invitable" :key="contact.name + contact.phone" class="contact-item">
              <div class="contact-info">
                <div class="contact-name">{{ contact.name }}</div>
                <div class="contact-phone">{{ contact.phone }}</div>
              </div>
              <button class="invite-btn" @click="sendInvite(contact)">Invite</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import Icon from '@/components/ui/icon.vue'
import settingsItem from './settings-item.vue'
import ToggleSwitch from '@/components/ui/toggle-switch.vue'
import { useUserSettings } from '~/composables/use-user-settings'
import { usePals } from '~/composables/use-pals'
import type { Visibility } from '~/shared/user-settings'

interface StorageUsage {
  messages: number
  messageCount: number
  mediaCount: number
  statusCount: number
}

interface InvitableContact {
  name: string
  phone: string
}

const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const userStore = useUserStore()
const { settings, error, load, update } = useUserSettings()
const { blocked, loadAll, setBlocked } = usePals()

const currentSection = ref<string>('main')
const inviteMessage = ref('Hey! Join me on Viorp - a private social platform. Download: https://viorp.com/download')
const invitable = ref<InvitableContact[]>([])
const storage = ref<StorageUsage>({ messages: 0, messageCount: 0, mediaCount: 0, statusCount: 0 })

const userEmail = computed(() => userStore.user?.email || 'Not set')
const emailVerified = computed(() => Boolean(userStore.user?.email_confirmed_at))

const sectionTitles: Record<string, string> = {
  main: 'Settings',
  security: 'Security Notice',
  email: 'Email Address',
  statusPrivacy: 'Status Privacy',
  disappearingMessages: 'Disappearing Messages',
  groupPrivacy: 'Group Privacy',
  blockedContacts: 'Blocked Contacts',
  appLock: 'App Lock',
  chatTheme: 'Theme',
  storage: 'Storage Management',
  networkUsage: 'Auto-Download',
  mediaQuality: 'Media Upload Quality',
  language: 'App Language',
  idleLogout: 'Auto Logout',
  inviteFriend: 'Invite a Friend'
}

const visibilityOptions = [
  { value: 'everyone' as Visibility, label: 'Everyone', description: 'Any Viorp user' },
  { value: 'contacts' as Visibility, label: 'My Contacts', description: 'Only synced contacts and PALs' },
  { value: 'nobody' as Visibility, label: 'Nobody', description: 'Hidden from everyone' }
]

const disappearingOptions = [
  { value: 'off' as const, label: 'Off', description: 'Messages will not disappear' },
  { value: '24h' as const, label: '24 hours', description: 'Messages disappear after 24 hours' },
  { value: '7d' as const, label: '7 days', description: 'Messages disappear after 7 days' },
  { value: '60d' as const, label: '60 days', description: 'Messages disappear after 60 days' }
]

const lockOptions = [
  { value: 'none' as const, label: 'Off', icon: 'unlock' },
  { value: 'pattern' as const, label: 'Pattern Lock', icon: 'grid-3x3' },
  { value: 'fingerprint' as const, label: 'Fingerprint', icon: 'fingerprint' },
  { value: 'pin' as const, label: 'PIN Code', icon: 'hash' }
]

const mediaQualityOptions = [
  { value: 'standard' as const, label: 'Standard', description: 'Smaller uploads, faster on mobile data' },
  { value: 'hd' as const, label: 'HD', description: 'Best quality, larger uploads' }
]

const themeOptions = [
  { value: 'system' as const, label: 'System default' },
  { value: 'dark' as const, label: 'Aurora Night (dark)' },
  { value: 'light' as const, label: 'Light' }
]

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'ar', label: 'العربية' }
]

const idleLogoutOptions = [15, 30, 60, 120]

const autoDownloadGroups = [
  { key: 'autoDownloadPhotos' as const, label: 'Photos' },
  { key: 'autoDownloadVideos' as const, label: 'Videos' },
  { key: 'autoDownloadDocuments' as const, label: 'Documents' }
]

const visibilityLabel = (value: Visibility): string =>
  visibilityOptions.find(option => option.value === value)?.label ?? 'Everyone'

const disappearingLabel = computed(() =>
  disappearingOptions.find(option => option.value === settings.value.privacy.disappearingMessages)?.label ?? 'Off'
)

const appLockLabel = computed(() =>
  lockOptions.find(option => option.value === settings.value.account.appLockType)?.label ?? 'Off'
)

const languageLabel = computed(() =>
  languageOptions.find(option => option.value === settings.value.general.language)?.label ?? 'English'
)

const themeLabel = computed(() =>
  themeOptions.find(option => option.value === settings.value.general.theme)?.label ?? 'System default'
)

const autoDownloadLabel = computed(() => {
  const active = autoDownloadGroups
    .filter(group => settings.value.storage_data[group.key] !== 'never')
    .map(group => group.label)
  return active.length ? active.join(', ') : 'Off'
})

const handleOverlayClick = () => emit('close')
const goBack = () => { currentSection.value = 'main' }

const openBlockedContacts = async () => {
  currentSection.value = 'blockedContacts'
  await loadAll()
}

const unblock = async (userId: string) => {
  await setBlocked(userId, false)
}

const openStorage = async () => {
  currentSection.value = 'storage'
  try {
    storage.value = await $fetch<StorageUsage>('/api/chat/storage-usage')
  } catch {
    error.value = 'Could not read your storage usage'
  }
}

const openInvite = async () => {
  currentSection.value = 'inviteFriend'
  try {
    const response = await $fetch<{ invitable: InvitableContact[] }>('/api/contacts')
    invitable.value = response.invitable ?? []
  } catch {
    invitable.value = []
  }
}

const goToDeleteAccount = () => {
  emit('close')
  router.push('/settings/delete-account')
}

const contactSupport = () => {
  emit('close')
  router.push('/support')
}

const openTerms = () => {
  emit('close')
  router.push('/terms')
}

const downloadChatHistory = async () => {
  try {
    const blob = await $fetch<Blob>('/api/chat/history/export', { responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'viorp-chat-history.json'
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    error.value = 'Could not export your chat history'
  }
}

const clearChatHistory = async () => {
  if (!confirm('Delete every message you have sent? This cannot be undone.')) return
  try {
    await $fetch('/api/chat/history/clear', { method: 'POST' })
    storage.value = await $fetch<StorageUsage>('/api/chat/storage-usage')
  } catch {
    error.value = 'Could not delete your messages'
  }
}

const sendInvite = (contact: InvitableContact) => {
  const message = inviteMessage.value
  if (navigator.share) {
    void navigator.share({ text: message })
    return
  }
  window.open(`sms:${contact.phone}?body=${encodeURIComponent(message)}`)
}

const formatSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (!bytes) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.settings-panel {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn,
.close-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: background-color 0.2s;
}

.back-btn:hover,
.close-btn:hover {
  background: #f5f5f5;
}

.settings-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.settings-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1976d2;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.setting-description {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.setting-action {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #1976d2;
}

.option-item.active {
  border-color: #1976d2;
  background: #e3f2fd;
}

.option-info {
  flex: 1;
}

.option-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.option-description {
  font-size: 13px;
  color: #666;
}

.option-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-item.active .option-radio {
  border-color: #1976d2;
}

.radio-dot {
  width: 10px;
  height: 10px;
  background: #1976d2;
  border-radius: 50%;
}

.storage-overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.storage-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.storage-info {
  flex: 1;
}

.storage-label {
  font-weight: 500;
  color: #333;
}

.storage-size {
  font-size: 13px;
  color: #666;
}

.storage-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
}

.action-btn.danger {
  color: #f44336;
  border-color: #f44336;
}

.action-btn.danger:hover {
  background: #ffebee;
}

.invite-message {
  margin-bottom: 20px;
}

.invite-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

.invite-textarea:focus {
  border-color: #1976d2;
}

.contacts-list {
  max-height: 300px;
  overflow-y: auto;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.contact-item:last-child {
  border-bottom: none;
}

.contact-info {
  flex: 1;
}

.contact-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.contact-phone {
  font-size: 13px;
  color: #666;
}

.invite-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.invite-btn:hover {
  background: #1565c0;
}

@media (max-width: 768px) {
  .settings-panel {
    max-width: 100%;
    max-height: 95vh;
  }
  
  .settings-content {
    padding: 16px;
  }
}
</style>

<style scoped>
.settings-error {
  margin: 0 0 12px;
  color: var(--color-error, #FF2E88);
  font-size: 13px;
}

.empty-note {
  padding: 16px;
  color: #6b7280;
  font-size: 14px;
}

.setting-select {
  background: transparent;
  border: 1px solid var(--color-dark-grey, #1F2937);
  border-radius: 8px;
  padding: 6px 8px;
  color: inherit;
}
</style>
