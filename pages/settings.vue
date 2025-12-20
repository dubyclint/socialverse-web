<!-- FILE: /pages/settings.vue - FIXED FOR SSR HYDRATION -->
<!-- ============================================================================
     SETTINGS PAGE - FIXED: All user-specific data wrapped in ClientOnly
     ✅ FIXED: User data wrapped
     ✅ FIXED: Form inputs wrapped
     ============================================================================ -->

<template>
  <div class="min-h-screen bg-slate">
    <!-- Header -->
    <Header />

    <!-- ✅ FIXED: Wrap entire settings content in ClientOnly -->
    <ClientOnly>
      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:pxpy-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Settings</h1>
          <p class="text-slate">Manage your account preferences and security</p>
        </div>

        <!-- Settings Tabs -->
        <div class="flex gap mb-8 border-b border-slate-700 overflow-x-auto">
          <button
            v-for="tab in settingsTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px py-3 font-semibold border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'text-blue border-blue-500'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="space-y-6">
          <!-- Account Settings Tab -->
          <div v-if="activeTab === 'account'" class="space-y-6">
            <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 class="text-xl font-bold text-white mb-4">Account Information</h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate- mb-2">Email</label>
                  <input
                    type="email"
                    :value="user?.email"
                    disabled
                    class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate cursor-not-allowed"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <input
                    type="text"
                    :value="user?.username"
                    disabled
                    class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Profile Settings Tab -->
          <div v-if="activeTab === 'profile'" class="space-y-6">
            <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 class="text-xl font-bold text-white mb-4">Profile Information</h2>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
                  <input
                    v-model="profileData.displayName"
                    type="text"
                    class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Your display name"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                  <textarea
                    v-model="profileData.bio"
                    rows="4"
                    class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Tell us about yourself"
                  ></textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Location</label>
                  <input
                    v-model="profileData.location"
                    type="text"
                    class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Your location"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Website</label>
                  <input
                    v-model="profileData.website"
                    type="url"
                    class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <button
                @click="saveProfileSettings"
                class="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>

          <!-- Privacy Settings Tab -->
          <div v-if="activeTab === 'privacy'" class="space-y-6">
            <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 class="text-xl font-bold text-white mb-4">Privacy Settings</h2>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-white font-medium">Private Account</h3>
                    <p class="text-sm text-slate-400">Only approved followers can see your posts</p>
                  </div>
                  <input type="checkbox" v-model="privacySettings.privateAccount" class="toggle" />
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-white font-medium">Show Online Status</h3>
                    <p class="text-sm text-slate-400">Let others see when you're online</p>
                  </div>
                  <input type="checkbox" v-model="privacySettings.showOnlineStatus" class="toggle" />
                </div>
              </div>
            </div>
          </div>

          <!-- Security Settings Tab -->
          <div v-if="activeTab === 'security'" class="space-y-6">
            <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 class="text-xl font-bold text-white mb-4">Security Settings</h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                  <input
                    v-model="securityData.currentPassword"
                    type="password"
                    class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                  <input
                    v-model="securityData.newPassword"
                    type="password"
                    class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                  <input
                    v-model="securityData.confirmPassword"
                    type="password"
                    class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                @click="changePassword"
                class="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </main>
    </ClientOnly>

    <!-- Fallback for SSR -->
    <template #fallback>
      <div class="flex items-center justify-center min-h-screen">
        <div class="spinner"></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

const authStore = useAuthStore()

// State
const activeTab = ref('account')
const profileData = ref({
  displayName: '',
  bio: '',
  location: '',
  website: ''
})
const privacySettings = ref({
  privateAccount: false,
  showOnlineStatus: true
})
const securityData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Computed
const user = computed(() => authStore.user)

// Tabs
const settingsTabs = [
  { id: 'account', label: 'Account' },
  { id: 'profile', label: 'Profile' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'security', label: 'Security' }
]

// Methods
const saveProfileSettings = async () => {
  try {
    // Save profile settings
    console.log('Saving profile settings:', profileData.value)
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

const changePassword = async () => {
  try {
    // Change password logic
    console.log('Changing password')
  } catch (error) {
    console.error('Error changing password:', error)
  }
}
</script>

<style scoped>
.toggle {
  appearance: none;
  width: px;
  height: 24px;
  background: #569;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  transition: background s;
}

.toggle:checked {
  background: #3b82f6;
}

.toggle::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: left 0.3s;
}

.toggle:checked::after {
  left: 26px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
