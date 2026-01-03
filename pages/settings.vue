// ============================================================================
// FIX FOR /pages/settings.vue - SYNTAX ERROR
// ============================================================================
// ISSUE: File starts with comments that are being parsed as code
// SOLUTION: Remove the comment header and provide clean file

// COMPLETE CORRECTED FILE:

<template>
  <div class="settings-container">
    <Header />

    <ClientOnly>
      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Settings</h1>
          <p class="text-slate-400">Manage your account preferences and security</p>
        </div>

        <div class="flex gap-4 mb-8 border-b border-slate-700 overflow-x-auto">
          <button
            v-for="tab in settingsTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['px-4 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap', activeTab === tab.id ? 'text-blue-500 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-300']"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="space-y-6">
          <!-- Account Settings Tab -->
          <div v-if="activeTab === 'account'" class="space-y-6">
            <div class="bg-slate-800 rounded-lg p-6">
              <h2 class="text-xl font-bold text-white mb-4">Account Information</h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input 
                    type="email" 
                    :value="authStore.userEmail" 
                    disabled 
                    class="w-full px-4 py-2 bg-slate-700 text-slate-300 rounded-lg border border-slate-600"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <input 
                    type="text" 
                    :value="authStore.username" 
                    disabled 
                    class="w-full px-4 py-2 bg-slate-700 text-slate-300 rounded-lg border border-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Security Settings Tab -->
          <div v-if="activeTab === 'security'" class="space-y-6">
            <div class="bg-slate-800 rounded-lg p-6">
              <h2 class="text-xl font-bold text-white mb-4">Security Settings</h2>
              <button 
                @click="changePassword"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>

          <!-- Privacy Settings Tab -->
          <div v-if="activeTab === 'privacy'" class="space-y-6">
            <div class="bg-slate-800 rounded-lg p-6">
              <h2 class="text-xl font-bold text-white mb-4">Privacy Settings</h2>
              <div class="space-y-4">
                <label class="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    v-model="privacySettings.profilePublic"
                    class="w-4 h-4 rounded"
                  />
                  <span class="text-slate-300">Make profile public</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Notifications Settings Tab -->
          <div v-if="activeTab === 'notifications'" class="space-y-6">
            <div class="bg-slate-800 rounded-lg p-6">
              <h2 class="text-xl font-bold text-white mb-4">Notification Preferences</h2>
              <div class="space-y-4">
                <label class="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    v-model="notificationSettings.emailNotifications"
                    class="w-4 h-4 rounded"
                  />
                  <span class="text-slate-300">Email notifications</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Logout Button -->
        <div class="mt-8 pt-8 border-t border-slate-700">
          <button 
            @click="logout"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </main>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// ============================================================================
// PAGE META - MIDDLEWARE & LAYOUT
// ============================================================================
definePageMeta({
  middleware: ['auth', 'profile-completion'],
  layout: 'default'
})

// ============================================================================
// IMPORTS
// ============================================================================
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/use-auth'

// ============================================================================
// SETUP
// ============================================================================
const authStore = useAuthStore()
const { logout } = useAuth()

const activeTab = ref('account')

const settingsTabs = [
  { id: 'account', label: 'Account' },
  { id: 'security', label: 'Security' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'notifications', label: 'Notifications' }
]

const privacySettings = ref({
  profilePublic: true
})

const notificationSettings = ref({
  emailNotifications: true
})

// ============================================================================
// METHODS
// ============================================================================
const changePassword = () => {
  console.log('Change password clicked')
  // Implement password change logic
}

// ============================================================================
// SEO
// ============================================================================
useHead({
  title: 'Settings - SocialVerse',
  meta: [
    { name: 'description', content: 'Manage your account settings and preferences' }
  ]
})
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: #0f172a;
}
</style>
