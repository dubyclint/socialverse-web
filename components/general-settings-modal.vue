<!-- components/GeneralSettingsModal.vue -->
<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>General Settings</h2>
        <button @click="$emit('close')" class="close-btn">
          <Icon name="x" size="20" />
        </button>
      </div>
      
      <div class="settings-container">
        <!-- Settings Navigation -->
        <div class="settings-nav">
          <button
            v-for="category in settingsCategories"
            :key="category.key"
            @click="activeCategory = category.key"
            class="nav-item"
            :class="{ active: activeCategory === category.key }"
          >
            <Icon :name="category.icon" size="16" />
            <span>{{ category.label }}</span>
            <Icon name="chevron-right" size="14" class="nav-arrow" />
          </button>
        </div>
        
        <!-- Settings Content -->
        <div class="settings-content">
          <!-- Profile Settings -->
          <div v-if="activeCategory === 'profile'" class="settings-section">
            <h3 class="section-title">Profile Settings</h3>
            <p class="section-description">Customize your profile appearance and preferences</p>
            
            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Theme</h4>
                  <p>Choose your preferred color theme</p>
                </div>
                <select v-model="settings.profile.theme" class="setting-select">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Language</h4>
                  <p>Select your preferred language</p>
                </div>
                <select v-model="settings.profile.language" class="setting-select">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="zh">中文</option>
                </select>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Timezone</h4>
                  <p>Set your timezone for accurate timestamps</p>
                </div>
                <select v-model="settings.profile.timezone" class="setting-select">
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="CST">Central Time</option>
                  <option value="MST">Mountain Time</option>
                  <option value="PST">Pacific Time</option>
                </select>
              </div>
            </div>
            
            <div class="section-actions">
              <button @click="openProfileSettings" class="btn btn-primary">
                <Icon name="user" size="16" />
                Edit Profile
              </button>
              <button @click="openVerificationApplication" class="btn btn-secondary">
                <Icon name="check-circle" size="16" />
                Apply for Verification
              </button>
            </div>
          </div>
          
          <!-- Chat Settings -->
          <div v-if="activeCategory === 'chat'" class="settings-section">
            <h3 class="section-title">Chat Settings</h3>
            <p class="section-description">Manage your chat notifications and preferences</p>
            
            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Notifications</h4>
                  <p>Receive notifications for new messages</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.chat.notifications"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Sound Enabled</h4>
                  <p>Play sound for incoming messages</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.chat.soundEnabled"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Read Receipts</h4>
                  <p>Let others know when you've read their messages</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.chat.readReceipts"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Online Status</h4>
                  <p>Show when you're online</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.chat.onlineStatus"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Group Notifications</h4>
                  <p>Get notified about group messages</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.chat.groupNotifications"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div class="section-actions">
              <button @click="openChatSettings" class="btn btn-primary">
                <Icon name="message-circle" size="16" />
                Advanced Chat Settings
              </button>
            </div>
          </div>
          
          <!-- Post Settings -->
          <div v-if="activeCategory === 'post'" class="settings-section">
            <h3 class="section-title">Post Settings</h3>
            <p class="section-description">Control your post privacy and interaction settings</p>
            
            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Default Privacy</h4>
                  <p>Set the default privacy level for your posts</p>
                </div>
                <select v-model="settings.post.privacyDefault" class="setting-select">
                  <option value="public">🌐 Public</option>
                  <option value="friends">👥 Friends Only</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Allow Comments</h4>
                  <p>Let others comment on your posts by default</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.post.commentsEnabled"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Show Like Count</h4>
                  <p>Display the number of likes on your posts</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.post.likesVisible"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Allow Sharing</h4>
                  <p>Let others share your posts</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.post.shareEnabled"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div class="section-actions">
              <button @click="openPostSettings" class="btn btn-primary">
                <Icon name="file-text" size="16" />
                Advanced Post Settings
              </button>
            </div>
          </div>
          
          <!-- Wallet Settings -->
          <div v-if="activeCategory === 'wallet'" class="settings-section">
            <h3 class="section-title">Wallet Settings</h3>
            <p class="section-description">Manage your wallet, PEW, escrow, and P2P trading settings</p>
            
            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Wallet Notifications</h4>
                  <p>Get notified about wallet activities</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.wallet.notifications"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Transaction Alerts</h4>
                  <p>Receive alerts for all transactions</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.wallet.transactionAlerts"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>PEW Notifications</h4>
                  <p>Get notified about PEW activities and gifts</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.wallet.pewNotifications"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Escrow Notifications</h4>
                  <p>Receive updates on escrow transactions</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.wallet.escrowNotifications"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>P2P Trading Notifications</h4>
                  <p>Get alerts for P2P trading activities</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.wallet.p2pNotifications"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div class="section-actions">
              <button @click="openWalletSettings" class="btn btn-primary">
                <Icon name="wallet" size="16" />
                Wallet Management
              </button>
              <button @click="openPewSettings" class="btn btn-secondary">
                <Icon name="zap" size="16" />
                PEW Settings
              </button>
              <button @click="openEscrowSettings" class="btn btn-secondary">
                <Icon name="shield" size="16" />
                Escrow Settings
              </button>
              <button @click="openP2PSettings" class="btn btn-secondary">
                <Icon name="users" size="16" />
                P2P Settings
              </button>
            </div>
          </div>
          
          <!-- Ad Centre Settings -->
          <div v-if="activeCategory === 'ad'" class="settings-section">
            <h3 class="section-title">Ad Centre Settings</h3>
            <p class="section-description">Control your advertising preferences and experience</p>
            
            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Personalized Ads</h4>
                  <p>Show ads based on your interests and activity</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.ad.personalization"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Ad Frequency</h4>
                  <p>How often you want to see ads</p>
                </div>
                <select v-model="settings.ad.frequency" class="setting-select">
                  <option value="low">Low - Fewer ads</option>
                  <option value="normal">Normal - Balanced</option>
                  <option value="high">High - More ads</option>
                </select>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Blocked Categories</h4>
                  <p>Choose ad categories you don't want to see</p>
                </div>
                <div class="blocked-categories">
                  <label
                    v-for="category in adCategories"
                    :key="category"
                    class="category-checkbox"
                  >
                    <input
                      v-model="settings.ad.blockedCategories"
                      :value="category"
                      type="checkbox"
                    />
                    <span>{{ category }}</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div class="section-actions">
              <button @click="openAdSettings" class="btn btn-primary">
                <Icon name="target" size="16" />
                Advanced Ad Settings
              </button>
            </div>
          </div>
          
          <!-- Rank Settings -->
          <div v-if="activeCategory === 'rank'" class="settings-section">
            <h3 class="section-title">Rank Settings</h3>
            <p class="section-description">Manage your ranking and achievement preferences</p>
            
            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Display Rank</h4>
                  <p>Show your rank on your profile</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.rank.displayEnabled"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Public Progress</h4>
                  <p>Let others see your ranking progress</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.rank.progressPublic"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div class="section-actions">
              <button @click="openRankSettings" class="btn btn-primary">
                <Icon name="star" size="16" />
                View Rank Details
              </button>
            </div>
          </div>
          
          <!-- Universe Settings -->
          <div v-if="activeCategory === 'universe'" class="settings-section">
            <h3 class="section-title">Universe Settings</h3>
            <p class="section-description">Configure your universe and community preferences</p>
            
            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Universe Notifications</h4>
                  <p>Get notified about universe activities</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.universe.notifications"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Auto-join Universes</h4>
                  <p>Automatically join recommended universes</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.universe.autoJoin"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div class="section-actions">
              <button @click="openUniverseSettings" class="btn btn-primary">
                <Icon name="globe" size="16" />
                Universe Management
              </button>
            </div>
          </div>
          
          <!-- Other Settings -->
          <div v-if="activeCategory === 'other'" class="settings-section">
            <h3 class="section-title">Other Settings</h3>
            <p class="section-description">Additional settings and preferences</p>
            
            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Email Notifications</h4>
                  <p>Receive important updates via email</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.general.emailNotifications"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Push Notifications</h4>
                  <p>Receive push notifications on your device</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.general.pushNotifications"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Marketing Emails</h4>
                  <p>Receive promotional emails and updates</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.general.marketingEmails"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <label class="toggle-switch">
                  <input
                    v-model="settings.general.twoFactorEnabled"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div class="section-actions">
              <button @click="openSecuritySettings" class="btn btn-primary">
                <Icon name="lock" size="16" />
                Security Settings
              </button>
              <button @click="openDataSettings" class="btn btn-secondary">
                <Icon name="database" size="16" />
                Data & Privacy
              </button>
              <button @click="exportData" class="btn btn-secondary">
                <Icon name="download" size="16" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Save Actions -->
      <div class="modal-footer">
        <div class="save-status">
          <span v-if="saving" class="save-indicator">
            <Icon name="loader" size="16" class="spinning" />
            Saving...
          </span>
          <span v-else-if="saved" class="save-indicator success">
            <Icon name="check" size="16" />
            Saved
          </span>
        </div>
        <div class="footer-actions">
          <button @click="resetSettings" class="btn btn-secondary">
            Reset to Default
          </button>
          <button @click="saveAllSettings" :disabled="saving" class="btn btn-primary">
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { userSettings } from '~/models/userSettings'

const emit = defineEmits(['close'])
const authStore = useAuthStore()

// UI State
const activeCategory = ref('profile')
const saving = ref(false)
const saved = ref(false)

// Settings data
const settings = reactive({
  profile: {
    theme: 'light',
    language: 'en',
    timezone: 'UTC'
  },
  chat: {
    notifications: true,
    soundEnabled: true,
    readReceipts: true,
    onlineStatus: true,
    groupNotifications: true
  },
  post: {
    privacyDefault: 'public',
    commentsEnabled: true,
    likesVisible: true,
    shareEnabled: true
  },
  wallet: {
    notifications: true,
    transactionAlerts: true,
    pewNotifications: true,
    escrowNotifications: true,
    p2pNotifications: true
  },
  ad: {
    personalization: true,
    frequency: 'normal',
    blockedCategories: []
  },
  rank: {
    displayEnabled: true,
    progressPublic: true
  },
  universe: {
    notifications: true,
    autoJoin: false
  },
  general: {
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    twoFactorEnabled: false
  }
})

// Settings categories
const settingsCategories = [
  { key: 'profile', label: 'Profile Settings', icon: 'user' },
  { key: 'chat', label: 'Chat Settings', icon: 'message-circle' },
  { key: 'post', label: 'Post Settings', icon: 'file-text' },
  { key: 'wallet', label: 'Wallet Settings', icon: 'wallet' },
  { key: 'ad', label: 'Ad Centre Settings', icon: 'target' },
  { key: 'rank', label: 'Rank Settings', icon: 'star' },
  { key: 'universe', label: 'Universe Settings', icon: 'globe' },
  { key: 'other', label: 'Other Settings', icon: 'settings' }
]

// Ad categories
const adCategories = [
  'Technology', 'Fashion', 'Food & Drink', 'Travel', 'Sports',
  'Entertainment', 'Health & Fitness', 'Finance', 'Education',
  'Gaming', 'Automotive', 'Real Estate'
]

// Methods
const loadSettings = async () => {
  try {
    const userSettings = await UserSettings.getAllSettings(authStore.user.id)
    
    // Map database settings to reactive settings
    Object.assign(settings.profile, {
      theme: userSettings.profile_theme,
      language: userSettings.profile_language,
      timezone: userSettings.profile_timezone
    })
    
    Object.assign(settings.chat, {
      notifications: userSettings.chat_notifications,
      soundEnabled: userSettings.chat_sound_enabled,
      readReceipts: userSettings.chat_read_receipts,
      onlineStatus: userSettings.chat_online_status,
      groupNotifications: userSettings.group_message_notifications
    })
    
    Object.assign(settings.post, {
      privacyDefault: userSettings.post_privacy_default,
      commentsEnabled: userSettings.post_comments_enabled,
      likesVisible: userSettings.post_likes_visible,
      shareEnabled: userSettings.post_share_enabled
    })
    
    Object.assign(settings.wallet, {
      notifications: userSettings.wallet_notifications,
      transactionAlerts: userSettings.wallet_transaction_alerts,
      pewNotifications: userSettings.pew_notifications,
      escrowNotifications: userSettings.escrow_notifications,
      p2pNotifications: userSettings.p2p_notifications
    })
    
    Object.assign(settings.ad, {
      personalization: userSettings.ad_personalization,
      frequency: userSettings.ad_frequency,
      blockedCategories: userSettings.ad_categories_blocked || []
    })
    
    Object.assign(settings.rank, {
      displayEnabled: userSettings.rank_display_enabled,
      progressPublic: userSettings.rank_progress_public
    })
    
    Object.assign(settings.universe, {
      notifications: userSettings.universe_notifications,
      autoJoin: userSettings.universe_auto_join
    })
    
    Object.assign(settings.general, {
      emailNotifications: userSettings.email_notifications,
      pushNotifications: userSettings.push_notifications,
      marketingEmails: userSettings.marketing_emails,
      twoFactorEnabled: userSettings.two_factor_enabled
    })
    
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

const saveAllSettings = async () => {
  try {
    saving.value = true
    saved.value = false
    
    // Save each category
    for (const category of Object.keys(settings)) {
      await UserSettings.updateSettings(authStore.user.id, category, settings[category])
    }
    
    saved.value = true
    setTimeout(() => {
      saved.value = false
    }, 3000)
    
  } catch (error) {
    console.error('Error saving settings:', error)
    alert('Failed to save settings. Please try again.')
  } finally {
    saving.value = false
  }
}

const resetSettings = async () => {
  if (confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
    try {
      // Reset to default values
      await loadSettings()
    } catch (error) {
      console.error('Error resetting settings:', error)
    }
  }
}

// Navigation methods
const openProfileSettings = () => {
  // Navigate to profile edit
  emit('close')
  // Emit event to parent to open profile edit modal
}

const openVerificationApplication = () => {
  // Navigate to verification
  emit('close')
  // Emit event to parent to open verification modal
}

const openChatSettings = () => {
  // Navigate to chat settings page
  window.location.href = '/chat/settings'
}

const openPostSettings = () => {
  // Navigate to post settings
  // Implementation depends on your routing structure
}

const openWalletSettings = () => {
  window.location.href = '/wallet/settings'
}

const openPewSettings = () => {
  window.location.href = '/pew/settings'
}

const openEscrowSettings = () => {
  window.location.href = '/escrow/settings'
}

const openP2PSettings = () => {
  window.location.href = '/p2p/settings'
}

const openAdSettings = () => {
  window.location.href = '/ads/settings'
}

const openRankSettings = () => {
  window.location.href = '/rank'
}

const openUniverseSettings = () => {
  window.location.href = '/universe/settings'
}

const openSecuritySettings = () => {
  window.location.href = '/security'
}

const openDataSettings = () => {
  window.location.href = '/privacy'
}

const exportData = () => {
  // Implement data export functionality
  alert('Data export feature coming soon!')
}

const closeModal = () => {
  emit('close')
}

// Auto-save on changes
watch(settings, () => {
  // Debounced auto-save could be implemented here
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.settings-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.settings-nav {
  width: 280px;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  font-weight: 500;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-item.active {
  background: #4f46e5;
  color: white;
}

.nav-arrow {
  margin-left: auto;
  transition: transform 0.2s;
}

.nav-item.active .nav-arrow {
  transform: rotate(90deg);
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.settings-section {
  max-width: 600px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.section-description {
  color: #6b7280;
  margin-bottom: 2rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.setting-info {
  flex: 1;
}

.setting-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.setting-info p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.setting-select {
  min-width: 180px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: 0.2s;
  border-radius: 28px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

.toggle-input:checked + .toggle-slider {
  background-color: #4f46e5;
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.blocked-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
  max-width: 400px;
}

.category-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.section-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.save-status {
  display: flex;
  align-items: center;
}

.save-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.save-indicator.success {
  color: #059669;
}

.footer-actions {
  display: flex;
  gap: 1rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    margin: 0;
    border-radius: 0;
    height: 100vh;
    max-height: 100vh;
  }
  
  .settings-container {
    flex-direction: column;
  }
  
  .settings-nav {
    width: 100%;
    max-height: 200px;
    overflow-x: auto;
    display: flex;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .nav-item {
    white-space: nowrap;
    min-width: 200px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .section-actions {
    flex-direction: column;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .footer-actions {
    justify-content: stretch;
  }
  
  .footer-actions .btn {
    flex: 1;
  }
}
</style>
