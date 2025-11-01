<template>
  <div class="min-h-screen bg-slate-900">
    <!-- Header -->
    <Header />

    <!-- Main Feed -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Sidebar - User Info -->
        <aside class="hidden lg:block">
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6 sticky top-24">
            <div class="text-center mb-6">
              <img
                v-if="user?.profile?.avatar_url"
                :src="user.profile.avatar_url"
                :alt="user.profile.full_name"
                class="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-blue-500"
              />
              <div v-else class="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-500">
                {{ user?.profile?.full_name?.charAt(0) || 'U' }}
              </div>
              <h3 class="text-lg font-bold text-white">{{ user?.profile?.full_name }}</h3>
              <p class="text-sm text-slate-400">@{{ user?.username }}</p>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-700">
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-500">{{ userStats.followers }}</p>
                <p class="text-xs text-slate-400">Followers</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-500">{{ userStats.following }}</p>
                <p class="text-xs text-slate-400">Following</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-500">{{ userStats.posts }}</p>
                <p class="text-xs text-slate-400">Posts</p>
              </div>
            </div>

            <!-- Quick Links -->
            <div class="space-y-2">
              <NuxtLink
                to="/profile"
                class="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-center"
              >
                View Profile
              </NuxtLink>
              <NuxtLink
                to="/settings"
                class="block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors text-center"
              >
                Settings
              </NuxtLink>
            </div>
          </div>
        </aside>

        <!-- Center - Feed -->
        <section class="lg:col-span-1">
          <!-- Create Post -->
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
            <div class="flex gap-4">
              <img
                v-if="user?.profile?.avatar_url"
                :src="user.profile.avatar_url"
                :alt="user.profile.full_name"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div v-else class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {{ user?.profile?.full_name?.charAt(0) || 'U' }}
              </div>
              <input
                type="text"
                placeholder="What's on your mind?"
                @click="showCreatePost = true"
                class="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 cursor-pointer"
              />
            </div>
          </div>

          <!-- Posts Feed -->
          <div v-if="loading" class="text-center py-12">
            <div class="inline-block">
              <svg class="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>

          <div v-else-if="posts.length === 0" class="text-center py-12 text-slate-400">
            <p>No posts yet. Start following people to see their posts!</p>
          </div>

          <div v-else class="space-y-6">
            <PostCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
              @delete="handlePostDelete"
              @like="handlePostLike"
            />
          </div>
        </section>

        <!-- Right Sidebar - Trending & Suggestions -->
        <aside class="hidden lg:block">
          <!-- Trending -->
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6 sticky top-24">
            <h3 class="text-lg font-bold text-white mb-4">🔥 Trending</h3>
            <div class="space-y-4">
              <div
                v-for="trend in trending"
                :key="trend.id"
                class="p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <p class="text-sm font-semibold text-blue-400">#{{ trend.tag }}</p>
                <p class="text-xs text-slate-400">{{ trend.count }} posts</p>
              </div>
            </div>
          </div>

          <!-- Suggestions -->
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6 sticky top-96">
            <h3 class="text-lg font-bold text-white mb-4">👥 Suggestions</h3>
            <div class="space-y-4">
              <div
                v-for="suggestion in suggestions"
                :key="suggestion.id"
                class="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
              >
                <div class="flex items-center gap-2">
                  <img
                    v-if="suggestion.avatar_url"
                    :src="suggestion.avatar_url"
                    :alt="suggestion.full_name"
                    class="w-8 h-8 rounded-full object-cover"
                  />
                  <div v-else class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {{ suggestion.full_name?.charAt(0) || 'U' }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white">{{ suggestion.full_name }}</p>
                    <p class="text-xs text-slate-400">@{{ suggestion.username }}</p>
                  </div>
                </div>
                <button
                  @click="handleFollowUser(suggestion.id)"
                  class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Follow
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <!-- Create Post Modal -->
    <CreatePostModal v-if="showCreatePost" @close="showCreatePost = false" @post-created="handlePostCreated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  middleware: 'auth-guard'
})

const authStore = useAuthStore()
const { fetchFeed, fetchTrending, fetchSuggestions } = usePostFeed()

const loading = ref(true)
const showCreatePost = ref(false)
const posts = ref<any[]>([])
const trending = ref<any[]>([])
const suggestions = ref<any[]>([])
const userStats = ref({
  followers: 0,
  following: 0,
  posts: 0
})

const user = computed(() => authStore.user)

const handlePostCreated = (newPost: any) => {
  posts.value.unshift(newPost)
  showCreatePost.value = false
}

const handlePostDelete = (postId: string) => {
  posts.value = posts.value.filter(p => p.id !== postId)
}

const handlePostLike = (postId: string) => {
  const post = posts.value.find(p => p.id === postId)
  if (post) {
    post.liked = !post.liked
    post.likes_count += post.liked ? 1 : -1
  }
}

const handleFollowUser = (userId: string) => {
  // Implement follow logic
  console.log('Following user:', userId)
}

onMounted(async () => {
  try {
    loading.value = true
    const [feedData, trendingData, suggestionsData] = await Promise.all([
      fetchFeed(),
      fetchTrending(),
      fetchSuggestions()
    ])

    posts.value = feedData
    trending.value = trendingData
    suggestions.value = suggestionsData
  } catch (error) {
    console.error('Error loading feed:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* Minimal scoped styles - rely on Tailwind */
</style>
