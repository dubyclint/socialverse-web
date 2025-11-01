<template>
  <div class="min-h-screen bg-slate-900">
    <!-- Header -->
    <Header />

    <!-- Settings Container -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Settings</h1>
        <p class="text-slate-400">Manage your account preferences and security</p>
      </div>

      <!-- Settings Tabs -->
      <div class="flex gap-4 mb-8 border-b border-slate-700 overflow-x-auto">
        <button
          v-for="tab in settingsTabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap',
            activeTab === tab.id
              ? 'text-blue-500 border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-300'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="space-y-6">
        <!-- Account Settings -->
        <div v-if="activeTab === 'account'" class="space-y-6">
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 class="text-xl font-bold text-white mb-4">Account Information</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  :value="user?.email"
                  disabled
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
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
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Account Created</label>
                <input
                  type="text"
                  :value="formatDate(user?.created_at)"
                  disabled
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <!-- Change Password -->
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 class="text-xl font-bold text-white mb-4">Change Password</h2>
            <form @submit.prevent="handleChangePassword" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                <input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                <input
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="Enter new password"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                <input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                :disabled="passwordLoading"
                class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                {{ passwordLoading ? 'Updating...' : 'Update Password' }}
              </button>
            </form>
          </div>
        </div>

        <!-- Privacy Settings -->
        <div v-if="activeTab === 'privacy'" class="space-y-6">
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 class="text-xl font-bold text-white mb-4">Privacy Settings</h2>
            <div class="space-y-4">
              <label class="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  v-model="privacySettings.profileVisibility"
                  type="checkbox"
                  class="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p class="text-sm font-medium text-white">Public Profile</p>
                  <p class="text-xs text-slate-400">Allow others to view your profile</p>
                </div>
              </label>

              <label class="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  v-model="privacySettings.showOnlineStatus"
                  type="checkbox"
                  class="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p class="text-sm font-medium text-white">Show Online Status</p>
                  <p class="text-xs text-slate-400">Let others see when you're online</p>
                </div>
              </label>

              <label class="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  v-model="privacySettings.allowMessages"
                  type="checkbox"
                  class="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p class="text-sm font-medium text-white">Allow Direct Messages</p>
                  <p class="text-xs text-slate-400">Allow anyone to send you messages</p>
                </div>
              </label>

              <label class="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  v-model="privacySettings.allowFriendRequests"
                  type="checkbox"
                  class="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p class="text-sm font-medium text-white">Allow Friend Requests</p>
                  <p class="text-xs text-slate-400">Allow anyone to send you friend requests</p>
                </div>
              </label>

              <button
                @click="handleSavePrivacy"
                :disabled="privacyLoading"
                class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors mt-4"
              >
                {{ privacyLoading ? 'Saving...' : 'Save Privacy Settings' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Notification Settings -->
        <div v-if="activeTab === 'notifications'" class="space-y-6">
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 class="text-xl font-bold text-white mb-4">Notification Preferences</h2>
            <div class="space-y-4">
              <label class="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  v-model="notificationSettings.emailNotifications"
                  type="checkbox"
                  class="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p class="text-sm font-medium text-white">Email Notifications</p>
                  <p class="text-xs text-slate-400">Receive email updates about your account</p>
                </div>
              </label>

              <label class="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  v-model="notificationSettings.pushNotifications"
                  type="checkbox"
                  class="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p class="text-sm font-medium text-white">Push Notifications</p>
                  <p class="text-xs text-slate-400">Receive push notifications on your device</p>
                </div>
              </label>

              <label class="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  v-model="notificationSettings.likeNotifications"
                  type="checkbox"
                  class="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p class="text-sm font-medium text-white">Like Notifications</p>
                  <p class="text-xs text-slate-400">Get notified when someone likes your post</p>
                </div>
              </label>

              <label class="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  v-model="notificationSettings.commentNotifications"
                  type="checkbox"
                  class="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p class="text-sm font-medium text-white">Comment Notifications</p>
                  <p class="text-xs text-slate-400">Get notified when someone comments on your post</p>
                </div>
              </label>

              <button
                @click="handleSaveNotifications"
                :disabled="notificationLoading"
                class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors mt-4"
              >
                {{ notificationLoading ? 'Saving...' : 'Save Notification Settings' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div v-if="activeTab === 'account'" class="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
          <h2 class="text-xl font-bold text-red-400 mb-4">⚠️ Danger Zone</h2>
          <p class="text-sm text-slate-400 mb-4">
            These actions are irreversible. Please proceed with caution.
          </p>
          <button
            @click="handleDeleteAccount"
            :disabled="deleteLoading"
            class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {{ deleteLoading ? 'Deleting...' : 'Delete Account' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  middleware: 'auth-guard'
})

const authStore = useAuthStore()

const activeTab = ref('account')
const passwordLoading = ref(false)
const privacyLoading = ref(false)
const notificationLoading = ref(false)
const deleteLoading = ref(false)

const settingsTabs = [
  { id: 'account', label: '👤 Account' },
  { id: 'privacy', label: '🔒 Privacy' },
  { id: 'notifications', label: '🔔 Notifications' }
]

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const privacySettings = ref({
  profileVisibility: true,
  showOnlineStatus: true,
  allowMessages: true,
  allowFriendRequests: true
})

const notificationSettings = ref({
  emailNotifications: true,
  pushNotifications: true,
  likeNotifications: true,
  commentNotifications: true
})

const user = computed(() => authStore.user)

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handleChangePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('Passwords do not match')
    return
  }

  passwordLoading.value = true
  try {
    // Call API to change password
    console.log('Changing password...')
    alert('Password changed successfully!')
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    console.error('Error changing password:', error)
    alert('Failed to change password')
  } finally {
    passwordLoading.value = false
  }
}

const handleSavePrivacy = async () => {
  privacyLoading.value = true
  try {
    // Call API to save privacy settings
    console.log('Saving privacy settings...', privacySettings.value)
    alert('Privacy settings saved!')
  } catch (error) {
    console.error('Error saving privacy settings:', error)
    alert('Failed to save privacy settings')
  } finally {
    privacyLoading.value = false
  }
}

const handleSaveNotifications = async () => {
  notificationLoading.value = true
  try {
    // Call API to save notification settings
    console.log('Saving notification settings...', notificationSettings.value)
    alert('Notification settings saved!')
  } catch (error) {
    console.error('Error saving notification settings:', error)
    alert('Failed to save notification settings')
  } finally {
    notificationLoading.value = false
  }
}

const handleDeleteAccount = async () => {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    return
  }

  deleteLoading.value = true
  try {
    // Call API to delete account
    console.log('Deleting account...')
    alert('Account deleted successfully')
    // Redirect to home
    navigateTo('/')
  } catch (error) {
    console.error('Error deleting account:', error)
    alert('Failed to delete account')
  } finally {
    deleteLoading.value = false
  }
}
</script>

<style scoped>
/* Minimal scoped styles - rely on Tailwind */
</style>
