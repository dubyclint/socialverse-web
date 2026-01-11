<template>
  <div class="min-h-screen bg-slate-900">
    <!-- Header -->
    <Header />

    <!-- Profile Container -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <svg class="animate-spin h-12 w-12 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-500/20 border border-red-500 rounded-lg p-6 text-center">
        <p class="text-red-400 font-semibold">{{ error }}</p>
        <button @click="goBack" class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
          Go Back
        </button>
      </div>

      <!-- Profile Header -->
      <div v-else-if="profile" class="bg-slate-800 rounded-lg border border-slate-700 p-8 mb-8">
        <div class="flex flex-col md:flex-row gap-8">
          <!-- Avatar -->
          <div class="flex-shrink-0">
            <img
              v-if="profile.avatar_url"
              :src="profile.avatar_url"
              :alt="profile.full_name"
              class="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
              @error="handleAvatarError"
            />
            <div v-else class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold border-4 border-blue-500">
              {{ profile.full_name?.charAt(0) || 'U' }}
            </div>
          </div>

          <!-- Profile Info -->
          <div class="flex-1">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h1 class="text-3xl font-bold text-white">{{ profile.full_name || profile.username }}</h1>
                <p class="text-lg text-slate-400">@{{ profile.username }}</p>
              </div>
              <div v-if="isOwnProfile" class="flex gap-2">
                <NuxtLink
                  to="/profile/edit"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Edit Profile
                </NuxtLink>
              </div>
              <div v-else class="flex gap-2">
                <button
                  @click="handleFollowUser"
                  :class="[
                    'px-4 py-2 font-semibold rounded-lg transition-colors',
                    isFollowing
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  ]"
                >
                  {{ isFollowing ? 'Following' : 'Follow' }}
                </button>
                <button
                  @click="handleMessageUser"
                  class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Message
                </button>
              </div>
            </div>

            <!-- Bio -->
            <p v-if="profile.bio" class="text-slate-300 mb-4">{{ profile.bio }}</p>

            <!-- Stats -->
            <div class="grid grid-cols-4 gap-4">
              <div>
                <p class="text-2xl font-bold text-blue-500">{{ profileStats.posts }}</p>
                <p class="text-sm text-slate-400">Posts</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-blue-500">{{ profileStats.followers }}</p>
                <p class="text-sm text-slate-400">Followers</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-blue-500">{{ profileStats.following }}</p>
                <p class="text-sm text-slate-400">Following</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-yellow-500">{{ profileStats.rank }}</p>
                <p class="text-sm text-slate-400">Rank</p>
              </div>
            </div>

            <!-- Interests -->
            <div v-if="profile.interests && profile.interests.length > 0" class="mt-4">
              <p class="text-sm text-slate-400 mb-2">Interests:</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="interest in profile.interests"
                  :key="interest.id"
                  class="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                >
                  {{ interest.name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div v-if="profile" class="flex gap-4 mb-8 border-b border-slate-700">
        <button
          v-for="tab in profileTabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-4 py-3 font-semibold border-b-2 transition-colors',
            activeTab === tab.id
              ? 'text-blue-500 border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-300'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div v-if="profile" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2">
          <!-- Posts Tab -->
          <div v-if="activeTab === 'posts'" class="space-y-6">
            <div v-if="profilePosts.length === 0" class="text-center py-12 text-slate-400">
              <p>No posts yet</p>
            </div>
            <div v-else class="space-y-6">
              <article v-for="post in profilePosts" :key="post.id" class="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-3">
                    <img 
                      :src="profile.avatar_url || '/default-avatar.svg'" 
                      :alt="profile.username"
                      class="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h4 class="font-semibold text-white">{{ profile.full_name }}</h4>
                      <p class="text-sm text-slate-400">@{{ profile.username }}</p>
                    </div>
                  </div>
                  <span class="text-sm text-slate-400">{{ formatTime(post.created_at) }}</span>
                </div>
                <p class="text-slate-300 mb-4">{{ post.content }}</p>
              </article>
            </div>
          </div>

          <!-- About Tab -->
          <div v-if="activeTab === 'about'" class="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-6">
            <div>
              <h3 class="text-lg font-bold text-white mb-2">About</h3>
              <p class="text-slate-300">{{ profile.bio || 'No bio provided' }}</p>
            </div>

            <div v-if="profile.location" class="border-t border-slate-700 pt-6">
              <h3 class="text-lg font-bold text-white mb-2">📍 Location</h3>
              <p class="text-slate-300">{{ profile.location }}</p>
            </div>

            <div class="border-t border-slate-700 pt-6">
              <h3 class="text-lg font-bold text-white mb-2">📅 Joined</h3>
              <p class="text-slate-300">{{ formatDate(profile.created_at) }}</p>
            </div>

            <div v-if="profile.interests && profile.interests.length > 0" class="border-t border-slate-700 pt-6">
              <h3 class="text-lg font-bold text-white mb-2">🎯 Interests</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="interest in profile.interests"
                  :key="interest.id"
                  class="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                >
                  {{ interest.name }}
                </span>
              </div>
            </div>
          </div>

          <!-- Gallery Tab -->
          <div v-if="activeTab === 'gallery'" class="grid grid-cols-2 gap-4">
            <div v-if="profileGallery.length === 0" class="col-span-2 text-center py-12 text-slate-400">
              <p>No images yet</p>
            </div>
            <img
              v-for="image in profileGallery"
              :key="image.id"
              :src="image.url"
              :alt="image.title"
              class="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            />
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="hidden lg:block">
          <!-- Verified Badge -->
          <div v-if="profile.is_verified" class="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6">
            <p class="text-blue-400 font-semibold">✓ Verified User</p>
          </div>

          <!-- Rank Badge -->
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
            <p class="text-sm text-slate-400 mb-2">Current Rank</p>
            <p class="text-2xl font-bold text-yellow-500">{{ profileStats.rank || 'Bronze I' }}</p>
          </div>

          <!-- Followers -->
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <h3 class="text-lg font-bold text-white mb-4">Recent Followers</h3>
            <div class="space-y-3">
              <div v-if="recentFollowers.length === 0" class="text-center text-slate-400 py-4">
                <p>No followers yet</p>
              </div>
              <div
                v-for="follower in recentFollowers"
                :key="follower.id"
                class="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <img
                    v-if="follower.avatar_url"
                    :src="follower.avatar_url"
                    :alt="follower.full_name"
                    class="w-8 h-8 rounded-full object-cover"
                  />
                  <div v-else class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {{ follower.full_name?.charAt(0) || 'U' }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white">{{ follower.full_name }}</p>
                    <p class="text-xs text-slate-400">@{{ follower.username }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth', 'language-check', 'profile-completion', 'security-middleware'],
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Get identifier from route (could be user ID or username)
const identifier = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? id[0] : id
})

// State
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref('posts')
const isFollowing = ref(false)

const profile = ref<any>(null)
const profilePosts = ref<any[]>([])
const profileGallery = ref<any[]>([])
const recentFollowers = ref<any[]>([])

const profileStats = ref({
  posts: 0,
  followers: 0,
  following: 0,
  rank: 'Bronze I'
})

const profileTabs = [
  { id: 'posts', label: '📝 Posts' },
  { id: 'about', label: 'ℹ️ About' },
  { id: 'gallery', label: '🖼️ Gallery' }
]

// Computed
const currentUser = computed(() => authStore.user || null)

const isOwnProfile = computed(() => {
  if (!currentUser.value || !identifier.value) return false
  return identifier.value === currentUser.value.id || identifier.value === currentUser.value.username
})

// Methods
const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (err) {
    console.error('[Profile] Date formatting error:', err)
    return 'Unknown date'
  }
}

const formatTime = (date: string) => {
  try {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return d.toLocaleDateString()
  } catch (error) {
    return 'unknown'
  }
}

const handleAvatarError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = '/default-avatar.svg'
}

const handleFollowUser = async () => {
  try {
    isFollowing.value = !isFollowing.value
    console.log('[Profile] Follow/unfollow user:', identifier.value)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[Profile] Follow error:', error.message)
    isFollowing.value = !isFollowing.value
  }
}

const handleMessageUser = () => {
  try {
    router.push(`/inbox?user=${identifier.value}`)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[Profile] Message navigation error:', error.message)
  }
}

const goBack = () => {
  router.back()
}

// Check if identifier is username or user ID
const isUsernameParam = (): boolean => {
  if (!identifier.value) return false
  // If it looks like a UUID (contains hyphens and is 36 chars), it's a user ID
  return !(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier.value))
}

// Load profile
const loadProfile = async () => {
  try {
    loading.value = true
    error.value = null

    if (!identifier.value) {
      error.value = 'User identifier not found'
      return
    }

    console.log('[Profile] Loading profile for identifier:', identifier.value)

    // Fetch profile from API
    const response = await fetch(`/api/profile/${encodeURIComponent(identifier.value)}`)

    if (!response.ok) {
      if (response.status === 404) {
        error.value = 'User not found'
      } else {
        error.value = `Failed to load profile (${response.status})`
      }
      return
    }

    const data = await response.json()

    if (!data.success || !data.data) {
      error.value = 'Invalid profile data'
      return
    }

    profile.value = data.data

    // Update stats
    profileStats.value.posts = profile.value.posts_count || 0
    profileStats.value.followers = profile.value.followers_count || 0
    profileStats.value.following = profile.value.following_count || 0
    profileStats.value.rank = profile.value.rank || 'Bronze I'

    console.log('[Profile] ✅ Profile loaded successfully')
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to load profile'
    console.error('[Profile] Load error:', errorMsg)
    error.value = errorMsg
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  console.log('[Profile] Component mounted, loading profile for identifier:', identifier.value)
  loadProfile()
})
</script>

<style scoped>
/* ============================================================================
   PAGE LAYOUT
   ============================================================================ */
.min-h-screen {
  min-height: 100vh;
}

.bg-slate-900 {
  background-color: #0f172a;
}

/* ============================================================================
   CONTAINER & SPACING
   ============================================================================ */
.max-w-6xl {
  max-width: 64rem;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.py-12 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.py-6 {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

.px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.lg\:px-8 {
  padding-left: 2rem;
  padding-right: 2rem;
}

.sm\:px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

/* ============================================================================
   LOADING STATE
   ============================================================================ */
.text-center {
  text-align: center;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.h-12 {
  height: 3rem;
}

.w-12 {
  width: 3rem;
}

.text-blue-500 {
  color: #3b82f6;
}

/* ============================================================================
   ERROR STATE
   ============================================================================ */
.bg-red-500\/20 {
  background-color: rgba(239, 68, 68, 0.2);
}

.border {
  border-width: 1px;
}

.border-red-500 {
  border-color: #ef4444;
}

.rounded-lg {
  border-radius: 0.5rem;
}

.p-6 {
  padding: 1.5rem;
}

.text-red-400 {
  color: #f87171;
}

.font-semibold {
  font-weight: 600;
}

.mt-4 {
  margin-top: 1rem;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.bg-red-600 {
  background-color: #dc2626;
}

.hover\:bg-red-700:hover {
  background-color: #b91c1c;
}

.text-white {
  color: #ffffff;
}

.cursor-pointer {
  cursor: pointer;
}

.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* ============================================================================
   PROFILE HEADER
   ============================================================================ */
.bg-slate-800 {
  background-color: #1e293b;
}

.border-slate-700 {
  border-color: #334155;
}

.p-8 {
  padding: 2rem;
}

.mb-8 {
  margin-bottom: 2rem;
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.md\:flex-row {
  flex-direction: row;
}

.gap-8 {
  gap: 2rem;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.w-32 {
  width: 8rem;
}

.h-32 {
  height: 8rem;
}

.rounded-full {
  border-radius: 9999px;
}

.object-cover {
  object-fit: cover;
}

.border-4 {
  border-width: 4px;
}

.border-blue-500 {
  border-color: #3b82f6;
}

.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}

.from-blue-500 {
  --tw-gradient-from: #3b82f6;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(59, 130, 246, 0));
}

.to-purple-600 {
  --tw-gradient-to: #9333ea;
}

.flex-1 {
  flex: 1 1 0%;
}

.items-start {
  align-items: flex-start;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.mb-4 {
  margin-bottom: 1rem;
}

.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}

.font-bold {
  font-weight: 700;
}

.text-lg {
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.text-slate-400 {
  color: #94a3b8;
}

.gap-2 {
  gap: 0.5rem;
}

.bg-blue-600 {
  background-color: #2563eb;
}

.hover\:bg-blue-700:hover {
  background-color: #1d4ed8;
}

.rounded {
  border-radius: 0.25rem;
}

.text-slate-300 {
  color: #cbd5e1;
}

.grid {
  display: grid;
}

.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.gap-4 {
  gap: 1rem;
}

.text-2xl {
  font-size: 1.5rem;
  line-height: 2rem;
}

.text-yellow-500 {
  color: #eab308;
}

.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.mt-4 {
  margin-top: 1rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.flex-wrap {
  flex-wrap: wrap;
}

.bg-blue-500\/20 {
  background-color: rgba(59, 130, 246, 0.2);
}

.text-blue-400 {
  color: #60a5fa;
}

.px-3 {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

.py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}

/* ============================================================================
   TABS
   ============================================================================ */
.border-b {
  border-bottom-width: 1px;
}

.border-slate-700 {
  border-color: #334155;
}

.mb-8 {
  margin-bottom: 2rem;
}

.border-b-2 {
  border-bottom-width: 2px;
}

.border-transparent {
  border-color: transparent;
}

.hover\:text-slate-300:hover {
  color: #cbd5e1;
}

/* ============================================================================
   TAB CONTENT
   ============================================================================ */
.lg\:col-span-2 {
  grid-column: span 2 / span 2;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.space-y-6 {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.text-slate-400 {
  color: #94a3b8;
}

.w-10 {
  width: 2.5rem;
}

.h-10 {
  height: 2.5rem;
}

.gap-3 {
  gap: 0.75rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.border-t {
  border-top-width: 1px;
}

.pt-6 {
  padding-top: 1.5rem;
}

.space-y-6 {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.col-span-2 {
  grid-column: span 2 / span 2;
}

.h-48 {
  height: 12rem;
}

.hover\:opacity-80:hover {
  opacity: 0.8;
}

.transition-opacity {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* ============================================================================
   SIDEBAR
   ============================================================================ */
.hidden {
  display: none;
}

.lg\:block {
  display: block;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.border-blue-500\/50 {
  border-color: rgba(59, 130, 246, 0.5);
}

.p-4 {
  padding: 1rem;
}

.text-blue-400 {
  color: #60a5fa;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.space-y-3 {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.p-2 {
  padding: 0.5rem;
}

.bg-slate-700\/50 {
  background-color: rgba(51, 65, 85, 0.5);
}

.w-8 {
  width: 2rem;
}

.h-8 {
  height: 2rem;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

/* ============================================================================
   RESPONSIVE DESIGN
   ============================================================================ */
@media (max-width: 1024px) {
  .lg\:col-span-2 {
    grid-column: auto;
  }

  .lg\:block {
    display: none;
  }
}

@media (max-width: 768px) {
  .md\:flex-row {
    flex-direction: column;
  }

  .gap-8 {
    gap: 1rem;
  }

  .grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .sm\:px-6 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

@media (max-width: 640px) {
  .text-3xl {
    font-size: 1.5rem;
    line-height: 2rem;
  }

  .w-32 {
    width: 6rem;
  }

  .h-32 {
    height: 6rem;
  }

  .p-8 {
    padding: 1rem;
  }

  .gap-8 {
    gap: 1rem;
  }

  .grid-cols-4 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  .px-4 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}

/* ============================================================================
   UTILITY CLASSES
   ============================================================================ */
.opacity-25 {
  opacity: 0.25;
}

.opacity-75 {
  opacity: 0.75;
}

.stroke-current {
  stroke: currentColor;
}

.fill-current {
  fill: currentColor;
}

.stroke-4 {
  stroke-width: 4;
}
</style>

