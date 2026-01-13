<template>
  <div class="min-h-screen bg-slate-900">
    <!-- Header -->
    <Header />

    <!-- ✅ NEW: Navigation Bar with Back to Feed Button -->
    <div class="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="goToFeed"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Feed</span>
          </button>
          
          <!-- Profile Title -->
          <h1 class="text-xl font-bold text-white">
            {{ profile?.full_name || 'Profile' }}
          </h1>
        </div>

        <!-- Edit Profile Button (only for own profile) -->
        <button
          v-if="isOwnProfile"
          @click="goToEditProfile"
          class="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Edit Profile</span>
        </button>
      </div>
    </div>

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
                <h1 class="text-3xl font-bold text-white">{{ profile.full_name }}</h1>
                <p class="text-lg text-slate-400">@{{ profile.username }}</p>
              </div>
              <div v-if="!isOwnProfile" class="flex gap-2">
                <button
                  @click="toggleFollow"
                  :class="[
                    'px-6 py-2 rounded-lg font-medium transition-colors',
                    isFollowing
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  ]"
                >
                  {{ isFollowing ? 'Following' : 'Follow' }}
                </button>
              </div>
            </div>

            <!-- Bio -->
            <p v-if="profile.bio" class="text-slate-300 mb-4">{{ profile.bio }}</p>

            <!-- Location & Website -->
            <div class="flex gap-4 mb-4 text-slate-400">
              <span v-if="profile.location" class="flex items-center gap-1">
                📍 {{ profile.location }}
              </span>
              <a v-if="profile.website" :href="profile.website" target="_blank" class="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                🔗 Website
              </a>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-4 gap-4 mb-4">
              <div class="bg-slate-700/50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-white">{{ profileStats.posts }}</div>
                <div class="text-sm text-slate-400">Posts</div>
              </div>
              <div class="bg-slate-700/50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-white">{{ profileStats.followers }}</div>
                <div class="text-sm text-slate-400">Followers</div>
              </div>
              <div class="bg-slate-700/50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-white">{{ profileStats.following }}</div>
                <div class="text-sm text-slate-400">Following</div>
              </div>
              <div class="bg-slate-700/50 rounded-lg p-4 text-center">
                <div class="text-2xl font-bold text-yellow-500">{{ profileStats.rank }}</div>
                <div class="text-sm text-slate-400">Rank</div>
              </div>
            </div>

            <!-- Verification Badge -->
            <div v-if="profile.is_verified" class="flex items-center gap-2 text-blue-400">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>Verified</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div v-if="profile" class="border-b border-slate-700 mb-8">
        <div class="flex gap-8">
          <button
            v-for="tab in profileTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'pb-4 font-medium transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'border-b-2 border-transparent text-slate-400 hover:text-slate-300'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div v-if="profile" class="grid grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="col-span-2">
          <!-- Posts Tab -->
          <div v-if="activeTab === 'posts'" class="space-y-6">
            <div v-if="profilePosts.length === 0" class="text-center py-12 text-slate-400">
              <p>No posts yet</p>
            </div>
            <div v-for="post in profilePosts" :key="post.id" class="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <div class="flex gap-4 mb-4">
                <img :src="profile.avatar_url || '/default-avatar.png'" :alt="profile.full_name" class="w-10 h-10 rounded-full" />
                <div class="flex-1">
                  <p class="font-semibold text-white">{{ profile.full_name }}</p>
                  <p class="text-sm text-slate-400">@{{ profile.username }}</p>
                </div>
              </div>
              <p class="text-slate-300 mb-4">{{ post.content }}</p>
              <div class="flex gap-4 text-slate-400 text-sm">
                <span>❤️ {{ post.likes || 0 }}</span>
                <span>💬 {{ post.comments || 0 }}</span>
                <span>🔄 {{ post.shares || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- About Tab -->
          <div v-if="activeTab === 'about'" class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold text-white mb-2">Bio</h3>
                <p class="text-slate-300">{{ profile.bio || 'No bio provided' }}</p>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white mb-2">Location</h3>
                <p class="text-slate-300">{{ profile.location || 'Not specified' }}</p>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white mb-2">Website</h3>
                <a v-if="profile.website" :href="profile.website" target="_blank" class="text-blue-400 hover:text-blue-300">
                  {{ profile.website }}
                </a>
                <p v-else class="text-slate-300">Not specified</p>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white mb-2">Joined</h3>
                <p class="text-slate-300">{{ formatDate(profile.created_at) }}</p>
              </div>
            </div>
          </div>

          <!-- Gallery Tab -->
          <div v-if="activeTab === 'gallery'" class="grid grid-cols-2 gap-4">
            <div v-if="profileGallery.length === 0" class="col-span-2 text-center py-12 text-slate-400">
              <p>No gallery items yet</p>
            </div>
            <div v-for="item in profileGallery" :key="item.id" class="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 h-48">
              <img :src="item.url" :alt="item.title" class="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer" />
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="col-span-1">
          <!-- Recent Followers -->
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
            <h3 class="text-lg font-semibold text-white mb-4">Recent Followers</h3>
            <div v-if="recentFollowers.length === 0" class="text-slate-400 text-sm">
              No followers yet
            </div>
            <div v-for="follower in recentFollowers" :key="follower.id" class="flex items-center gap-3 mb-3 pb-3 border-b border-slate-700 last:border-b-0">
              <img :src="follower.avatar_url" :alt="follower.full_name" class="w-8 h-8 rounded-full" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ follower.full_name }}</p>
                <p class="text-xs text-slate-400">@{{ follower.username }}</p>
              </div>
            </div>
          </div>

          <!-- Interests -->
          <div v-if="profile.interests && profile.interests.length > 0" class="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <h3 class="text-lg font-semibold text-white mb-4">Interests</h3>
            <div class="flex flex-wrap gap-2">
              <span v-for="interest in profile.interests" :key="interest" class="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                {{ interest }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'
import { useProfileSync } from '~/composables/useProfileSync'

definePageMeta({
  middleware: ['auth', 'language-check', 'profile-completion', 'security-middleware'],
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const { subscribeToProfileUpdates, unsubscribeFromProfileUpdates } = useProfileSync()

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
    return formatDate(date)
  } catch (err) {
    console.error('[Profile] Time formatting error:', err)
    return 'Unknown time'
  }
}

const handleAvatarError = (event: Event) => {
  console.error('[Profile] Avatar load error')
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// ✅ NEW: Navigation methods
const goToFeed = () => {
  console.log('[Profile] Navigating to feed')
  router.push('/feed')
}

const goToEditProfile = () => {
  console.log('[Profile] Navigating to edit profile')
  router.push('/profile/edit')
}

const goBack = () => {
  console.log('[Profile] Going back')
  router.back()
}

const toggleFollow = async () => {
  try {
    console.log('[Profile] Toggling follow status')
    isFollowing.value = !isFollowing.value
    // TODO: Implement follow/unfollow API call
  } catch (err) {
    console.error('[Profile] Error toggling follow:', err)
    isFollowing.value = !isFollowing.value
  }
}

const fetchProfileData = async () => {
  console.log('[Profile] ============ FETCH PROFILE DATA START ============')
  console.log('[Profile] Fetching profile for identifier:', identifier.value)

  loading.value = true
  error.value = null

  try {
    if (!identifier.value) {
      throw new Error('No profile identifier provided')
    }

    // Fetch profile data
    const profileResponse = await $fetch(`/api/profile/${identifier.value}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    console.log('[Profile] ✅ Profile data received:', profileResponse)

    if (!profileResponse) {
      throw new Error('Profile not found')
    }

    profile.value = profileResponse

    // Update profile store if it's the current user
    if (isOwnProfile.value) {
      profileStore.setProfile(profileResponse)
    }

    // Fetch profile posts
    try {
      const postsResponse = await $fetch(`/api/posts/user/${profileResponse.id}`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })
      profilePosts.value = postsResponse || []
      profileStats.value.posts = profilePosts.value.length
    } catch (err) {
      console.warn('[Profile] Error fetching posts:', err)
      profilePosts.value = []
    }

    // Fetch followers
    try {
      const followersResponse = await $fetch(`/api/follows/${profileResponse.id}`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })
      recentFollowers.value = followersResponse?.slice(0, 5) || []
      profileStats.value.followers = followersResponse?.length || 0
    } catch (err) {
      console.warn('[Profile] Error fetching followers:', err)
      recentFollowers.value = []
    }

    console.log('[Profile] ✅ Profile data loaded successfully')
    console.log('[Profile] ============ FETCH PROFILE DATA END ============')

  } catch (err: any) {
    console.error('[Profile] ============ FETCH PROFILE DATA ERROR ============')
    console.error('[Profile] ❌ Error fetching profile:', err)
    
    const errorMessage = err?.data?.message || err?.message || 'Failed to load profile'
    error.value = errorMessage
    
    console.error('[Profile] ============ FETCH PROFILE DATA ERROR END ============')
  } finally {
    loading.value = false
  }
}

// ✅ NEW: Subscribe to profile updates when component mounts
onMounted(async () => {
  console.log('[Profile] Component mounted')
  
  // Fetch initial profile data
  await fetchProfileData()

  // Subscribe to real-time profile updates
  if (currentUser.value?.id && isOwnProfile.value) {
    console.log('[Profile] Subscribing to profile updates')
    subscribeToProfileUpdates(currentUser.value.id, (updatedProfile) => {
      console.log('[Profile] Profile updated via sync:', updatedProfile)
      profile.value = updatedProfile
      profileStore.setProfile(updatedProfile)
    })
  }
})

// ✅ NEW: Cleanup subscriptions when component unmounts
onBeforeUnmount(() => {
  console.log('[Profile] Component unmounting, cleaning up subscriptions')
  unsubscribeFromProfileUpdates()
})

// ✅ NEW: Watch for profile changes and sync across app
watch(() => profile.value, (newProfile) => {
  if (newProfile && isOwnProfile.value) {
    console.log('[Profile] Profile changed, updating store')
    profileStore.setProfile(newProfile)
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: newProfile }))
  }
}, { deep: true })

// Watch for route changes to reload profile
watch(() => route.params.id, async () => {
  console.log('[Profile] Route changed, reloading profile')
  await fetchProfileData()
})
</script>

<style scoped>
/* ============================================================================
   PROFILE PAGE STYLES
   ============================================================================ */

.min-h-screen {
  min-height: 100vh;
}

.bg-slate-900 {
  background-color: #0f172a;
}

.max-w-6xl {
  max-width: 72rem;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.sm\:px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.lg\:px-8 {
  padding-left: 2rem;
  padding-right: 2rem;
}

.py-8 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.text-center {
  text-align: center;
}

.py-12 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
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

.border-b {
  border-bottom-width: 1px;
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

.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.space-y-6 {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.col-span-2 {
  grid-column: span 2 / span 2;
}

.col-span-1 {
  grid-column: span 1 / span 1;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.h-48 {
  height: 12rem;
}

.overflow-hidden {
  overflow: hidden;
}

.hover\:opacity-80:hover {
  opacity: 0.8;
}

.transition-opacity {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.cursor-pointer {
  cursor: pointer;
}

.pb-3 {
  padding-bottom: 0.75rem;
}

.last\:border-b-0:last-child {
  border-bottom-width: 0;
}

.min-w-0 {
  min-width: 0;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}

.fill-current {
  fill: currentColor;
}

.font-medium {
  font-weight: 500;
}

.bg-purple-600 {
  background-color: #9333ea;
}

.hover\:bg-purple-700:hover {
  background-color: #7e22ce;
}

.bg-slate-700\/50 {
  background-color: rgba(51, 65, 85, 0.5);
}

.sticky {
  position: sticky;
}

.top-0 {
  top: 0;
}

.z-40 {
  z-index: 40;
}

.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

.w-10 {
  width: 2.5rem;
}

.h-10 {
  height: 2.5rem;
}

.w-8 {
  width: 2rem;
}

.h-8 {
  height: 2rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.p-4 {
  padding: 1rem;
}

.text-xl {
  font-size: 1.25rem;
  line-height: 1.75rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .md\:flex-row {
    flex-direction: column;
  }

  .gap-8 {
    gap: 1rem;
  }

  .grid-cols-3 {
    grid-template-columns: 1fr;
  }

  .col-span-2 {
    grid-column: auto;
  }

  .col-span-1 {
    grid-column: auto;
  }

  .grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grid-cols-2 {
    grid-template-columns: 1fr;
  }

  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
