<!-- FILE: /components/general-settings-modal.vue - FIXED FOR SSR HYDRATION -->
<!-- ============================================================================
     GENERAL SETTINGS MODAL - FIXED: All user settings wrapped in ClientOnly
     ✅ FIXED: User preferences wrapped
     ✅ FIXED: Settings data wrapped
     ============================================================================ -->

<template>
  <!-- ✅ FIXED: Wrap entire modal in ClientOnly -->
  <ClientOnly>
    <div class="modal-overlay" @click="$emit('close')">
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
            <!-- Privacy Settings -->
            <div v-if="activeCategory === 'privacy'" class="settings-section">
              <h3>Privacy Settings</h3>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Private Account</h4>
                  <p>Only approved followers can see your posts</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.privateAccount" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Show Online Status</h4>
                  <p>Let others see when you're active</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.showOnlineStatus" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Activity Status</h4>
                  <p>Show your activity status to connections</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.activityStatus" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- Notification Settings -->
            <div v-if="activeCategory === 'notifications'" class="settings-section">
              <h3>Notification Settings</h3>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Push Notifications</h4>
                  <p>Receive push notifications on your device</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.pushNotifications" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Email Notifications</h4>
                  <p>Receive email updates about your activity</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.emailNotifications" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Comment Notifications</h4>
                  <p>Get notified when someone comments on your posts</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.commentNotifications" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Like Notifications</h4>
                  <p>Get notified when someone likes your posts</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.likeNotifications" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- Security Settings -->
            <div v-if="activeCategory === 'security'" class="settings-section">
              <h3>Security Settings</h3>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <button class="btn-secondary">Enable 2FA</button>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Login Alerts</h4>
                  <p>Get notified of new logins to your account</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.loginAlerts" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Change Password</h4>
                  <p>Update your account password</p>
                </div>
                <button class="btn-secondary" @click="showChangePassword = true">Change</button>
              </div>
            </div>

            <!-- Display Settings -->
            <div v-if="activeCategory === 'display'" class="settings-section">
              <h3>Display Settings</h3>
              
              <div class="setting-item">
                <div class="setting-info">
                  <h4>Dark Mode</h4>
                  <p>Use dark theme across the app</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.darkMode" />
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Language</h4>
                  <p>Choose your preferred language</p>
                </div>
                <select v-model="settings.language" class="setting-select">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div class="setting-item">
                <div class="setting-info">
                  <h4>Auto-play Videos</h4>
                  <p>Automatically play videos in feed</p>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.autoplayVideos" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="modal-footer">
          <button @click="$emit('close')" class="btn-cancel">Cancel</button>
          <button @click="saveSettings" class="btn-save" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['close'])

// State
const activeCategory = ref('privacy')
const saving = ref(false)
const showChangePassword = ref(false)

// Settings Categories
const settingsCategories = [
  { key: 'privacy', label: 'Privacy', icon: 'shield' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
  { key: 'security', label: 'Security', icon: 'lock' },
  { key: 'display', label: 'Display', icon: 'monitor' }
]

// Settings Data
const settings = ref({
  privateAccount: false,
  showOnlineStatus: true,
  activityStatus: true,
  pushNotifications: true,
  emailNotifications: true,
  commentNotifications: true,
  likeNotifications: true,
  loginAlerts: true,
  darkMode: true,
  language: 'en',
  autoplayVideos: true
})

// Methods
const saveSettings = async () => {
  saving.value = true
  try {
    // Save settings logic
    console.log('Saving settings:', settings.value)
    await new Promise(resolve => setTimeout(resolve,000))
    emit('close')
  } catch (error) {
    console.error('Error saving settings:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, );
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: #eb;
  border-radius:px;
  width: 100%;
  max-width: px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: #a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #334155;
  color: white;
}

.settings-container {
  display: grid;
  grid-template-columns: px 1fr;
  flex: 1;
  overflow: hidden;
}

.settings-nav {
  border-right: 1px solid #334155;
  padding: 1rem 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.3s;
}

.nav-item:hover {
  background: #334155;
  color: white;
}

.nav-item.active {
  background: #3b82f6;
  color: white;
}

.nav-arrow {
  margin-left: auto;
}

.settings-content {
  padding: 1.5rem;
  overflow-y: auto;
}

.settings-section h3 {
  color: white;
  font-size: 1.25rem;
  margin: 0 1.5rem 0;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #0f172a;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.setting-info h4 {
  margin: 0 0 0.25rem 0;
  color: white;
  font-size: 0.875rem;
}

.setting-info p {
  margin: 0;
  color: #748b;
  font-size: 0.75rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #475569;
  transition: 0.4s;
  border-radius:px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: #334155;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: #475569;
}

.setting-select {
  padding: 0.5rem 1rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: white;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #334155;
}

.btn-cancel,
.btn-save {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-cancel {
  background: #334155;
  color: white;
}

.btn-cancel:hover {
  background: #475569;
}

.btn-save {
  background: #3b82f6;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #2563eb;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
