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
              <div v-if="isOwnProfile" class="flex gap-2">
                <button
                  @click="showEditModal = true"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
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
                <p class="text-2xl font-bold text-blue-500">{{ profileStats.rank }}</p>
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
            <PostCard
              v-for="post in profilePosts"
              :key="post.id"
              :post="post"
              @delete="handlePostDelete"
              @like="handlePostLike"
            />
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
          <div v-if="profile.verified" class="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6">
            <p class="text-blue-400 font-semibold">✓ Verified User</p>
          </div>

          <!-- Rank Badge -->
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
            <p class="text-sm text-slate-400 mb-2">Current Rank</p>
            <p class="text-2xl font-bold text-yellow-500">{{ profile.rank || 'Bronze I' }}</p>
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

    <!-- Edit Profile Modal -->
    <EditProfileModal v-if="showEditModal && isOwnProfile" @close="showEditModal = false" @updated="handleProfileUpdated" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check', 'security-middleware'],
  layout: 'default'
})

import { ref, computed, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const rankStore = useRankStore()  // ✅ ADDED: Import rank store
const { fetchProfile, fetchUserProfile, fetchUserPosts } = useProfile()

// ✅ FIXED: Get the correct parameter - could be either 'id' or 'username'
const userId = route.params.id as string
const username = route.params.username as string
const identifier = userId || username

const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref('posts')
const showEditModal = ref(false)
const isFollowing = ref(false)

const profile = ref<any>(null)
const profilePosts = ref<any[]>([])
const profileGallery = ref<any[]>([])
const recentFollowers = ref<any[]>([])

// ✅ FIXED: Initialize profileStats with proper structure
const profileStats = ref({
  posts: 0,
  followers: 0,
  following: 0,
  rank: 'Bronze I'  // Will be updated dynamically
})

const profileTabs = [
  { id: 'posts', label: '📝 Posts' },
  { id: 'about', label: 'ℹ️ About' },
  { id: 'gallery', label: '🖼️ Gallery' }
]

const currentUser = computed(() => authStore.user || null)
const isOwnProfile = computed(() => {
  if (!currentUser.value || !identifier) return false
  return identifier === currentUser.value.id || identifier === currentUser.value.username
})

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

const handleFollowUser = async () => {
  try {
    isFollowing.value = !isFollowing.value
    console.log('[Profile] Follow/unfollow user:', identifier)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[Profile] Follow error:', error.message)
    isFollowing.value = !isFollowing.value
  }
}

const handleMessageUser = () => {
  try {
    router.push(`/inbox?user=${identifier}`)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[Profile] Message navigation error:', error.message)
  }
}

const handlePostDelete = (postId: string) => {
  try {
    profilePosts.value = profilePosts.value.filter(post => post.id !== postId)
    profileStats.value.posts--
    console.log('[Profile] Post deleted:', postId)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[Profile] Delete error:', error.message)
  }
}

const handlePostLike = (postId: string) => {
  try {
    console.log('[Profile] Post liked:', postId)
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[Profile] Like error:', error.message)
  }
}

const handleProfileUpdated = () => {
  try {
    showEditModal.value = false
    loadProfile()
    console.log('[Profile] Profile updated')
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[Profile] Update error:', error.message)
  }
}

const goBack = () => {
  router.back()
}

// ✅ FIXED: Determine if parameter is username or user ID
const isUsernameParam = (): boolean => {
  // If it looks like a UUID (contains hyphens and is 36 chars), it's a user ID
  // Otherwise, it's a username
  return !(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier))
}

// ✅ FIXED: Load rank data separately
const loadRankData = async (userId: string) => {
  try {
    console.log('[Profile] Loading rank data for user:', userId)
    const rankData = await rankStore.fetchRank(userId)
    profileStats.value.rank = rankData.rank || 'Bronze I'
    console.log('[Profile] ✅ Rank loaded:', profileStats.value.rank)
  } catch (err) {
    console.error('[Profile] Error loading rank:', err)
    profileStats.value.rank = 'Bronze I'  // Fallback
  }
}

const loadProfile = async () => {
  try {
    loading.value = true
    error.value = null

    if (!identifier) {
      error.value = 'User identifier not found'
      return
    }

    console.log('[Profile] Loading profile for identifier:', identifier)
    
    let profileData = null

    // ✅ FIXED: Use correct function based on parameter type
    if (isUsernameParam()) {
      console.log('[Profile] Treating as username, calling fetchProfile()')
      profileData = await fetchProfile(identifier)
    } else {
      console.log('[Profile] Treating as user ID, calling fetchUserProfile()')
      profileData = await fetchUserProfile(identifier)
    }
    
    if (!profileData) {
      error.value = 'User not found'
      return
    }

    profile.value = profileData

    // ✅ FIXED: Update rank from profile data
    profileStats.value.rank = profileData.rank || 'Bronze I'
    console.log('[Profile] Rank from profile:', profileStats.value.rank)

    // ✅ FIXED: Also load rank data from rank store for additional info
    if (profileData.user_id) {
      await loadRankData(profileData.user_id)
    }

    // ✅ FIXED: Fetch posts using the user ID from profile
    const posts = await fetchUserPosts(profileData.user_id)
    profilePosts.value = posts || []
    profileStats.value.posts = profilePosts.value.length

    // ✅ FIXED: Update followers and following counts from profile
    profileStats.value.followers = profileData.followers_count || 0
    profileStats.value.following = profileData.following_count || 0

    console.log('[Profile] ✅ Profile loaded successfully')
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to load profile'
    console.error('[Profile] Load error:', errorMsg)
    error.value = errorMsg
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('[Profile] Component mounted, loading profile for identifier:', identifier)
  loadProfile()
})
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
