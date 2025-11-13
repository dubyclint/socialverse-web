<!-- components/chat/settings.vue -->
<template>
  <div class="settings-overlay" @click="handleOverlayClick">
    <div class="settings-panel" @click.stop>
      <div class="settings-header">
        <button class="back-btn" @click="goBack" v-if="currentSection !== 'main'">
          <Icon name="arrow-left" />
        </button>
        <h3>{{ sectionTitles[currentSection] }}</h3>
        <button class="close-btn" @click="$emit('close')">
          <Icon name="x" />
        </button>
      </div>

      <div class="settings-content">
        <!-- Main Settings Menu -->
        <div v-if="currentSection === 'main'" class="main-menu">
          <div class="settings-section">
            <div class="section-title">Account</div>
            <settings-item
              icon="shield"
              title="Security Notice"
              subtitle="Our app is a private chat messenger"
              @click="currentSection = 'security'"
            />
            <settings-item
              icon="mail"
              title="Email Address"
              :subtitle="userEmail"
              badge="Verified"
              @click="currentSection = 'email'"
            />
            <settings-item
              icon="info"
              title="Request Account Info"
              subtitle="Contact support"
              @click="contactSupport"
            />
            <settings-item
              icon="trash-2"
              title="Delete Account"
              subtitle="Permanently delete your account"
              danger
              @click="currentSection = 'deleteAccount'"
            />
          </div>

          <div class="settings-section">
            <div class="section-title">Privacy</div>
            <settings-item
              icon="eye"
              title="Status"
              subtitle="Manage status privacy"
              @click="currentSection = 'statusPrivacy'"
            />
            <settings-item
              icon="check-check"
              title="Read Receipts"
              :subtitle="settings.readReceipts ? 'On' : 'Off'"
              @click="toggleReadReceipts"
            />
            <settings-item
              icon="clock"
              title="Disappearing Messages"
              :subtitle="getDisappearingMessagesText()"
              @click="currentSection = 'disappearingMessages'"
            />
            <settings-item
              icon="users"
              title="Groups"
              subtitle="Who can add you to groups"
              @click="currentSection = 'groupPrivacy'"
            />
            <settings-item
              icon="phone-off"
              title="Silence Unknown Callers"
              :subtitle="settings.silenceUnknownCallers ? 'On' : 'Off'"
              @click="toggleSilenceUnknownCallers"
            />
            <settings-item
              icon="user-x"
              title="Blocked Contacts"
              subtitle="Manage blocked users"
              @click="currentSection = 'blockedContacts'"
            />
            <settings-item
              icon="lock"
              title="App Lock"
              subtitle="Pattern lock or fingerprint"
              @click="currentSection = 'appLock'"
            />
            <settings-item
              icon="palette"
              title="Chat Theme"
              subtitle="Customize appearance"
              @click="currentSection = 'chatTheme'"
            />
          </div>

          <div class="settings-section">
            <div class="section-title">Notifications</div>
            <settings-item
              icon="volume-2"
              title="Conversation Tones"
              :subtitle="settings.conversationTones ? 'On' : 'Off'"
              @click="toggleConversationTones"
            />
            <settings-item
              icon="bell"
              title="Reminders"
              :subtitle="settings.reminders ? 'On' : 'Off'"
              @click="toggleReminders"
            />
            <settings-item
              icon="smartphone"
              title="Device Tones"
              subtitle="Use device default tones"
              @click="currentSection = 'deviceTones'"
            />
          </div>

          <div class="settings-section">
            <div class="section-title">Storage and Data</div>
            <settings-item
              icon="hard-drive"
              title="Manage Storage"
              subtitle="View and manage data usage"
              @click="currentSection = 'storage'"
            />
            <settings-item
              icon="wifi"
              title="Network Usage"
              subtitle="Monitor data consumption"
              @click="currentSection = 'networkUsage'"
            />
            <settings-item
              icon="image"
              title="Media Quality"
              :subtitle="settings.mediaQuality || 'Auto'"
              @click="currentSection = 'mediaQuality'"
            />
          </div>

          <div class="settings-section">
            <div class="section-title">General</div>
            <settings-item
              icon="globe"
              title="App Language"
              :subtitle="settings.language || 'Device Default'"
              @click="currentSection = 'language'"
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
              @click="currentSection = 'inviteFriend'"
            />
          </div>
        </div>

        <!-- Status Privacy Settings -->
        <div v-if="currentSection === 'statusPrivacy'" class="status-privacy">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">Allow people to share your status</div>
              <div class="setting-description">Let others share your status updates</div>
            </div>
            <ToggleSwitch v-model="settings.allowStatusSharing" />
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">Who cannot see your status</div>
              <div class="setting-description">Select contacts to hide status from</div>
            </div>
            <button class="setting-action" @click="selectHiddenContacts">
              {{ hiddenContactsCount }} contacts
              <Icon name="chevron-right" />
            </button>
          </div>
        </div>

        <!-- Disappearing Messages Settings -->
        <div v-if="currentSection === 'disappearingMessages'" class="disappearing-messages">
          <div class="option-list">
            <div 
              v-for="option in disappearingOptions"
              :key="option.value"
              class="option-item"
              :class="{ active: settings.disappearingMessages === option.value }"
              @click="setDisappearingMessages(option.value)"
            >
              <div class="option-info">
                <div class="option-title">{{ option.label }}</div>
                <div class="option-description">{{ option.description }}</div>
              </div>
              <div class="option-radio">
                <div class="radio-dot" v-if="settings.disappearingMessages === option.value"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- App Lock Settings -->
        <div v-if="currentSection === 'appLock'" class="app-lock">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">Enable App Lock</div>
              <div class="setting-description">Require authentication to open chat</div>
            </div>
            <ToggleSwitch v-model="settings.appLockEnabled" />
          </div>

          <div v-if="settings.appLockEnabled" class="lock-options">
            <div class="option-list">
              <div 
                v-for="option in lockOptions"
                :key="option.value"
                class="option-item"
                :class="{ active: settings.lockType === option.value }"
                @click="setLockType(option.value)"
              >
                <Icon :name="option.icon" />
                <div class="option-info">
                  <div class="option-title">{{ option.label }}</div>
                </div>
                <div class="option-radio">
                  <div class="radio-dot" v-if="settings.lockType === option.value"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Storage Management -->
        <div v-if="currentSection === 'storage'" class="storage-management">
          <div class="storage-overview">
            <div class="storage-item">
              <Icon name="message-circle" />
              <div class="storage-info">
                <div class="storage-label">Messages</div>
                <div class="storage-size">{{ formatSize(storageData.messages) }}</div>
              </div>
            </div>
            <div class="storage-item">
              <Icon name="image" />
              <div class="storage-info">
                <div class="storage-label">Media</div>
                <div class="storage-size">{{ formatSize(storageData.media) }}</div>
              </div>
            </div>
            <div class="storage-item">
              <Icon name="circle" />
              <div class="storage-info">
                <div class="storage-label">Status</div>
                <div class="storage-size">{{ formatSize(storageData.status) }}</div>
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
              Clear Chat History
            </button>
          </div>
        </div>

        <!-- Invite Friend -->
        <div v-if="currentSection === 'inviteFriend'" class="invite-friend">
          <div class="invite-message">
            <textarea
              v-model="inviteMessage"
              placeholder="Hey! Join me on SocialVerse..."
              class="invite-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="contacts-list">
            <div class="contact-item" v-for="contact in deviceContacts" :key="contact.id">
              <div class="contact-info">
                <div class="contact-name">{{ contact.name }}</div>
                <div class="contact-phone">{{ contact.phone }}</div>
              </div>
              <button class="invite-btn" @click="sendInvite(contact)">
                Invite
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import Icon from '@/components/ui/Icon.vue'
import SettingsItem from './settings-item.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'

// Props
const props = defineProps({
  settings: { type: Object, default: () => ({}) }
})

// Emits
const emit = defineEmits(['close', 'updated'])

// Stores
const userStore = useUserStore()

// Reactive data
const currentSection = ref('main')
const inviteMessage = ref('Hey! Join me on SocialVerse - a private social platform. Download: [APP_LINK]')
const hiddenContactsCount = ref(0)
const deviceContacts = ref([])
const storageData = ref({
  messages: 125000000,
  media: 890000000,
  status: 45000000
})

// Computed properties
const userEmail = computed(() => userStore.user?.email || 'Not set')

const sectionTitles = computed(() => ({
  main: 'Settings',
  security: 'Security Notice',
  email: 'Email Address',
  deleteAccount: 'Delete Account',
  statusPrivacy: 'Status Privacy',
  disappearingMessages: 'Disappearing Messages',
  groupPrivacy: 'Group Privacy',
  blockedContacts: 'Blocked Contacts',
  appLock: 'App Lock',
  chatTheme: 'Chat Theme',
  deviceTones: 'Device Tones',
  storage: 'Storage Management',
  networkUsage: 'Network Usage',
  mediaQuality: 'Media Quality',
  language: 'App Language',
  inviteFriend: 'Invite a Friend'
}))

const disappearingOptions = computed(() => [
  { value: 'off', label: 'Off', description: 'Messages will not disappear' },
  { value: '24h', label: '24 hours', description: 'Messages disappear after 24 hours' },
  { value: '7d', label: '7 days', description: 'Messages disappear after 7 days' },
  { value: '60d', label: '60 days', description: 'Messages disappear after 60 days' }
])

const lockOptions = computed(() => [
  { value: 'pattern', label: 'Pattern Lock', icon: 'grid-3x3' },
  { value: 'fingerprint', label: 'Fingerprint', icon: 'fingerprint' },
  { value: 'pin', label: 'PIN Code', icon: 'hash' }
])

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const goBack = () => {
  currentSection.value = 'main'
}

const getDisappearingMessagesText = () => {
  const option = disappearingOptions.value.find(opt => opt.value === props.settings.disappearingMessages)
  return option ? option.label : 'Off'
}

const toggleReadReceipts = () => {
  updateSetting('readReceipts', !props.settings.readReceipts)
}

const toggleSilenceUnknownCallers = () => {
  updateSetting('silenceUnknownCallers', !props.settings.silenceUnknownCallers)
}

const toggleConversationTones = () => {
  updateSetting('conversationTones', !props.settings.conversationTones)
}

const toggleReminders = () => {
  updateSetting('reminders', !props.settings.reminders)
}

const setDisappearingMessages = (value) => {
  updateSetting('disappearingMessages', value)
}

const setLockType = (type) => {
  updateSetting('lockType', type)
}

const updateSetting = (key, value) => {
  const newSettings = { ...props.settings, [key]: value }
  emit('updated', newSettings)
}

const contactSupport = () => {
  window.open('https://support.socialverse.com', '_blank')
}

const openTerms = () => {
  window.open('https://socialverse.com/terms', '_blank')
}

const selectHiddenContacts = () => {
  console.log('Select hidden contacts')
}

const downloadChatHistory = () => {
  console.log('Download chat history')
}

const clearChatHistory = () => {
  if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
    console.log('Clear chat history')
  }
}

const sendInvite = (contact) => {
  const message = inviteMessage.value.replace('[APP_LINK]', 'https://socialverse.com/download')
  
  if (navigator.share) {
    navigator.share({
      text: message
    })
  } else {
    window.open(`sms:${contact.phone}?body=${encodeURIComponent(message)}`)
  }
}

const formatSize = (bytes) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// Lifecycle
onMounted(() => {
  deviceContacts.value = [
    { id: 1, name: 'John Doe', phone: '+1234567890' },
    { id: 2, name: 'Jane Smith', phone: '+1234567891' },
    { id: 3, name: 'Bob Johnson', phone: '+1234567892' }
  ]
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
