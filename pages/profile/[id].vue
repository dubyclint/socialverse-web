<template>
  <div class="profile-page">
    <!-- ========================================================================
         HEADER - PROFILE HEADER WITH COVER & AVATAR
         ======================================================================== -->
    <header class="profile-header">
      <!-- Cover Image -->
      <div class="cover-image-wrapper">
        <img 
          v-if="profile?.cover_url" 
          :src="profile.cover_url" 
          :alt="profile.full_name" 
          class="cover-image"
        />
        <div v-else class="cover-image-placeholder"></div>
        
        <!-- Edit Cover Button (Own Profile Only) -->
        <button 
          v-if="isOwnProfile" 
          class="btn-edit-cover"
          @click="editCover"
          title="Edit cover photo"
        >
          <Icon name="camera" size="18" />
        </button>
      </div>

      <!-- Profile Info Section -->
      <div class="profile-info-section">
        <!-- Avatar & Basic Info -->
        <div class="profile-header-content">
          <div class="profile-avatar-wrapper">
            <img 
              :src="profile?.avatar_url || '/default-avatar.svg'" 
              :alt="profile?.full_name" 
              class="profile-avatar"
            />
            <span v-if="profile?.status" :class="['status-indicator', profile.status]"></span>
            
            <!-- Edit Avatar Button (Own Profile Only) -->
            <button 
              v-if="isOwnProfile" 
              class="btn-edit-avatar"
              @click="editAvatar"
              title="Edit profile photo"
            >
              <Icon name="camera" size="14" />
            </button>
          </div>

          <div class="profile-basic-info">
            <div class="profile-name-row">
              <h1 class="profile-name">{{ profile?.full_name }}</h1>
              <span v-if="profile?.verified" class="verified-badge" title="Verified">
                <Icon name="check-circle" size="18" />
              </span>
            </div>
            <p class="profile-username">@{{ profile?.username }}</p>
            <p v-if="profile?.bio" class="profile-bio">{{ profile.bio }}</p>
            
            <!-- Profile Meta Info -->
            <div class="profile-meta">
              <span v-if="profile?.location" class="meta-item">
                <Icon name="map-pin" size="14" />
                {{ profile.location }}
              </span>
              <span v-if="profile?.website" class="meta-item">
                <Icon name="link" size="14" />
                <a :href="profile.website" target="_blank" rel="noopener">
                  {{ profile.website }}
                </a>
              </span>
              <span class="meta-item">
                <Icon name="calendar" size="14" />
                Joined {{ formatDate(profile?.created_at) }}
              </span>
            </div>
          </div>

          <!-- Interests Section -->
     <div v-if="profile?.interests && profile.interests.length > 0" class="profile-interests">
    <h3 class="interests-title">Interests</h3>
    <div class="interests-tags">
      <span 
      v-for="interest in profile.interests" 
      :key="interest"
      class="interest-badge"
    >
      {{ interest }}
    </span>
  </div>
</div>

            <!-- Action Buttons -->
          <div class="profile-actions">
            <button 
              v-if="isOwnProfile" 
              class="btn-edit-profile"
              @click="goToEditProfile"
            >
              <Icon name="edit-2" size="16" />
              Edit Profile
            </button>
            <button 
              v-else-if="!isFollowing" 
              class="btn-follow"
              @click="followUser"
              :disabled="followLoading"
            >
              <Icon name="user-plus" size="16" />
              Follow
            </button>
            <button 
              v-else 
              class="btn-following"
              @click="unfollowUser"
              :disabled="followLoading"
            >
              <Icon name="user-check" size="16" />
              Following
            </button>
            
            <button class="btn-message" @click="sendMessage" title="Send message">
              <Icon name="message-circle" size="16" />
            </button>
            <button class="btn-more" @click="toggleMoreMenu" title="More options">
              <Icon name="more-vertical" size="16" />
            </button>

            <!-- More Menu -->
            <div v-if="showMoreMenu" class="more-menu">
              <button class="menu-item" @click="shareProfile">
                <Icon name="share-2" size="16" />
                Share Profile
              </button>
              <button v-if="!isOwnProfile" class="menu-item" @click="reportProfile">
                <Icon name="flag" size="16" />
                Report Profile
              </button>
              <button v-if="!isOwnProfile" class="menu-item" @click="blockUser">
                <Icon name="slash" size="16" />
                Block User
              </button>
            </div>
          </div>
        </div>

        <!-- Stats Row -->
        <div class="profile-stats-row">
          <div class="stat-item" @click="goToFollowers">
            <span class="stat-value">{{ profileStats.followers }}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat-item" @click="goToFollowing">
            <span class="stat-value">{{ profileStats.following }}</span>
            <span class="stat-label">Following</span>
          </div>
          <div class="stat-item" @click="goToPosts">
            <span class="stat-value">{{ profileStats.posts }}</span>
            <span class="stat-label">Posts</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ profileStats.likes }}</span>
            <span class="stat-label">Likes</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ========================================================================
         MAIN CONTENT - TABS & CONTENT
         ======================================================================== -->
    <main class="profile-main">
      <!-- Tabs Navigation -->
      <nav class="profile-tabs">
        <button 
          v-for="tab in profileTabs" 
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <Icon :name="tab.icon" size="18" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Posts Tab -->
        <section v-if="activeTab === 'posts'" class="tab-pane">
          <ClientOnly>
            <!-- Loading State -->
            <div v-if="postsLoading && profilePosts.length === 0" class="loading-state">
              <div class="spinner"></div>
              <p>Loading posts...</p>
            </div>

            <!-- Posts List -->
            <div v-else-if="profilePosts.length > 0" class="posts-list">
              <article 
                v-for="post in profilePosts" 
                :key="post.id" 
                class="profile-post"
              >
                <!-- Post Header -->
                <div class="post-header">
                  <img 
                    :src="post.author?.avatar_url || '/default-avatar.svg'" 
                    :alt="post.author?.full_name" 
                    class="post-avatar"
                    @click="goToUserProfile(post.author?.username)"
                  />
                  <div class="post-author-info">
                    <h4 class="post-author-name">{{ post.author?.full_name }}</h4>
                    <p class="post-author-username">@{{ post.author?.username }}</p>
                    <span class="post-timestamp">{{ formatTime(post.created_at) }}</span>
                  </div>
                  <button class="post-menu-btn" @click="togglePostMenu(post.id)">
                    <Icon name="more-vertical" size="20" />
                  </button>
                </div>

                <!-- Post Content -->
                <div class="post-content">
                  <p class="post-text">{{ post.content }}</p>
                  
                  <!-- Post Media -->
                  <div v-if="post.media && post.media.length > 0" class="post-media-gallery">
                    <img 
                      v-for="(media, index) in post.media" 
                      :key="index"
                      :src="media" 
                      :alt="`Post media ${index + 1}`" 
                      class="post-image"
                      @click="openMediaViewer(media)"
                    />
                  </div>
                </div>

                <!-- Post Stats -->
                <div class="post-stats">
                  <span class="stat">
                    <Icon name="heart" size="14" />
                    {{ post.likes_count || 0 }}
                  </span>
                  <span class="stat">
                    <Icon name="message-circle" size="14" />
                    {{ post.comments_count || 0 }}
                  </span>
                  <span class="stat">
                    <Icon name="share-2" size="14" />
                    {{ post.shares_count || 0 }}
                  </span>
                </div>

                <!-- Post Actions -->
                <div class="post-actions">
                  <button 
                    :class="['action-btn', { liked: post.liked_by_me }]" 
                    @click="likePost(post.id)"
                  >
                    <Icon :name="post.liked_by_me ? 'heart' : 'heart'" size="18" :fill="post.liked_by_me" />
                    <span>{{ post.liked_by_me ? 'Liked' : 'Like' }}</span>
                  </button>
                  <button class="action-btn" @click="commentPost(post.id)">
                    <Icon name="message-circle" size="18" />
                    <span>Comment</span>
                  </button>
                  <button class="action-btn" @click="sharePost(post.id)">
                    <Icon name="share-2" size="18" />
                    <span>Share</span>
                  </button>
                </div>
              </article>

              <!-- Load More -->
              <div v-if="hasMorePosts" class="load-more">
                <button 
                  v-if="!loadingMore"
                  @click="loadMorePosts" 
                  class="btn-load-more"
                >
                  Load More Posts
                </button>
                <div v-else class="loading-more">
                  <div class="spinner-small"></div>
                  <span>Loading...</span>
                </div>
              </div>
            </div>

            <!-- No Posts -->
            <div v-else class="no-content">
              <Icon name="inbox" size="48" />
              <h3>No posts yet</h3>
              <p>{{ isOwnProfile ? 'Create your first post!' : 'This user hasn\'t posted yet' }}</p>
            </div>
          </ClientOnly>
        </section>

        <!-- Followers Tab -->
        <section v-if="activeTab === 'followers'" class="tab-pane">
          <ClientOnly>
            <div v-if="followersLoading" class="loading-state">
              <div class="spinner"></div>
              <p>Loading followers...</p>
            </div>

            <div v-else-if="followers.length > 0" class="users-list">
              <div 
                v-for="user in followers" 
                :key="user.id" 
                class="user-item"
              >
                <img 
                  :src="user.avatar_url || '/default-avatar.svg'" 
                  :alt="user.full_name" 
                  class="user-avatar"
                  @click="goToUserProfile(user.username)"
                />
                <div class="user-info">
                  <h4 class="user-name">{{ user.full_name }}</h4>
                  <p class="user-username">@{{ user.username }}</p>
                </div>
                <button 
                  :class="['btn-follow-small', { following: user.following }]"
                  @click="toggleFollowUser(user.id)"
                >
                  {{ user.following ? 'Following' : 'Follow' }}
                </button>
              </div>
            </div>

            <div v-else class="no-content">
              <Icon name="users" size="48" />
              <h3>No followers yet</h3>
              <p>{{ isOwnProfile ? 'Share your profile to get followers!' : 'This user has no followers' }}</p>
            </div>
          </ClientOnly>
        </section>

        <!-- Following Tab -->
        <section v-if="activeTab === 'following'" class="tab-pane">
          <ClientOnly>
            <div v-if="followingLoading" class="loading-state">
              <div class="spinner"></div>
              <p>Loading following...</p>
            </div>

            <div v-else-if="following.length > 0" class="users-list">
              <div 
                v-for="user in following" 
                :key="user.id" 
                class="user-item"
              >
                <img 
                  :src="user.avatar_url || '/default-avatar.svg'" 
                  :alt="user.full_name" 
                  class="user-avatar"
                  @click="goToUserProfile(user.username)"
                />
                <div class="user-info">
                  <h4 class="user-name">{{ user.full_name }}</h4>
                  <p class="user-username">@{{ user.username }}</p>
                </div>
                <button 
                  :class="['btn-follow-small', { following: user.following }]"
                  @click="toggleFollowUser(user.id)"
                >
                  {{ user.following ? 'Following' : 'Follow' }}
                </button>
              </div>
            </div>

            <div v-else class="no-content">
              <Icon name="users" size="48" />
              <h3>Not following anyone yet</h3>
              <p>{{ isOwnProfile ? 'Start following people!' : 'This user isn\'t following anyone' }}</p>
            </div>
          </ClientOnly>
        </section>

        <!-- Likes Tab -->
        <section v-if="activeTab === 'likes'" class="tab-pane">
          <ClientOnly>
            <div v-if="likesLoading" class="loading-state">
              <div class="spinner"></div>
              <p>Loading liked posts...</p>
            </div>

            <div v-else-if="likedPosts.length > 0" class="posts-list">
              <article 
                v-for="post in likedPosts" 
                :key="post.id" 
                class="profile-post"
              >
                <!-- Similar post structure as posts tab -->
                <div class="post-header">
                  <img 
                    :src="post.author?.avatar_url || '/default-avatar.svg'" 
                    :alt="post.author?.full_name" 
                    class="post-avatar"
                  />
                  <div class="post-author-info">
                    <h4 class="post-author-name">{{ post.author?.full_name }}</h4>
                    <p class="post-author-username">@{{ post.author?.username }}</p>
                  </div>
                </div>
                <div class="post-content">
                  <p class="post-text">{{ post.content }}</p>
                </div>
              </article>
            </div>

            <div v-else class="no-content">
              <Icon name="heart" size="48" />
              <h3>No liked posts</h3>
              <p>{{ isOwnProfile ? 'Like posts to see them here!' : 'This user hasn\'t liked any posts' }}</p>
            </div>
          </ClientOnly>
        </section>
      </div>
    </main>

    <!-- ========================================================================
         ERROR STATE
         ======================================================================== -->
    <div v-if="error" class="error-state">
      <Icon name="alert-circle" size="48" />
      <h2>{{ error }}</h2>
      <button @click="retryLoad" class="btn-retry">
        <Icon name="refresh-cw" size="16" />
        Try Again
      </button>
    </div>

    <!-- ========================================================================
         LOADING STATE
         ======================================================================== -->
    <div v-if="loading" class="page-loading">
      <div class="spinner-large"></div>
      <p>Loading profile...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'
import { useFetchWithAuth } from '~/composables/use-fetch'

// ============================================================================
// SETUP & INITIALIZATION
// ============================================================================
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const fetchWithAuth = useFetchWithAuth()

// ============================================================================
// REACTIVE STATE
// ============================================================================
const loading = ref(true)
const error = ref<string | null>(null)
const profile = ref<any>(null)
const profileStats = ref({
  followers: 0,
  following: 0,
  posts: 0,
  likes: 0
})

// Posts
const profilePosts = ref<any[]>([])
const postsLoading = ref(false)
const loadingMore = ref(false)
const hasMorePosts = ref(true)
const currentPostPage = ref(1)

// Followers & Following
const followers = ref<any[]>([])
const followersLoading = ref(false)
const following = ref<any[]>([])
const followingLoading = ref(false)

// Liked Posts
const likedPosts = ref<any[]>([])
const likesLoading = ref(false)

// UI State
const activeTab = ref('posts')
const showMoreMenu = ref(false)
const isFollowing = ref(false)
const followLoading = ref(false)

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================
const identifier = computed(() => route.params.id as string)

const isOwnProfile = computed(() => {
  return authStore.user?.id === profile.value?.id || 
         authStore.user?.username === profile.value?.username
})

const profileTabs = [
  { id: 'posts', label: 'Posts', icon: 'file-text' },
  { id: 'followers', label: 'Followers', icon: 'users' },
  { id: 'following', label: 'Following', icon: 'user-plus' },
  { id: 'likes', label: 'Likes', icon: 'heart' }
]

// ============================================================================
// METHODS - DATA FETCHING
// ============================================================================
const fetchProfileData = async () => {
  console.log('[Profile] Fetching profile for:', identifier.value)
  
  try {
    loading.value = true
    error.value = null

    if (!identifier.value) {
      throw new Error('No profile identifier provided')
    }

    const profileResponse = await fetchWithAuth(`/api/profile/${identifier.value}`, {
      method: 'GET'
    })

    if (!profileResponse) {
      throw new Error('Profile not found')
    }

    profile.value = profileResponse
    profileStore.setProfile(profileResponse)

    // Fetch stats
    const userId = profileResponse.id || profileResponse.user_id
    if (userId) {
      await Promise.all([
        fetchProfileStats(userId),
        fetchProfilePosts(userId),
        checkFollowStatus(userId)
      ])
    }

    console.log('[Profile] Profile loaded successfully')
  } catch (err: any) {
    console.error('[Profile] Error loading profile:', err)
    error.value = err?.message || 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

const fetchProfileStats = async (userId: string) => {
  try {
    const stats = await fetchWithAuth(`/api/users/${userId}/stats`, {
      method: 'GET'
    })

    profileStats.value = {
      followers: stats.followers_count || 0,
      following: stats.following_count || 0,
      posts: stats.posts_count || 0,
      likes: stats.likes_count || 0
    }
  } catch (err) {
    console.error('[Profile] Error fetching stats:', err)
  }
}

const fetchProfilePosts = async (userId: string) => {
  try {
    postsLoading.value = true
    const response = await fetchWithAuth(`/api/posts/user/${userId}`, {
      method: 'GET',
      query: { page: currentPostPage.value, limit: 10 }
    })

    profilePosts.value = response.posts || []
    hasMorePosts.value = response.has_more || false
  } catch (err) {
    console.error('[Profile] Error fetching posts:', err)
    profilePosts.value = []
  } finally {
    postsLoading.value = false
  }
}

const fetchFollowers = async () => {
  try {
    followersLoading.value = true
    const response = await fetchWithAuth(`/api/follows/${profile.value.id}/followers`, {
      method: 'GET'
    })

    followers.value = response || []
  } catch (err) {
    console.error('[Profile] Error fetching followers:', err)
    followers.value = []
  } finally {
    followersLoading.value = false
  }
}

const fetchFollowing = async () => {
  try {
    followingLoading.value = true
    const response = await fetchWithAuth(`/api/follows/${profile.value.id}/following`, {
      method: 'GET'
    })

    following.value = response || []
  } catch (err) {
    console.error('[Profile] Error fetching following:', err)
    following.value = []
  } finally {
    followingLoading.value = false
  }
}

const fetchLikedPosts = async () => {
  try {
    likesLoading.value = true
    const response = await fetchWithAuth(`/api/posts/user/${profile.value.id}/likes`, {
      method: 'GET'
    })

    likedPosts.value = response || []
  } catch (err) {
    console.error('[Profile] Error fetching liked posts:', err)
    likedPosts.value = []
  } finally {
    likesLoading.value = false
  }
}

// ============================================================================
// METHODS - USER INTERACTIONS
// ============================================================================
const followUser = async () => {
  try {
    followLoading.value = true
    await fetchWithAuth(`/api/users/${profile.value.id}/follow`, {
      method: 'POST'
    })

    isFollowing.value = true
    profileStats.value.followers++
  } catch (err) {
    console.error('[Profile] Error following user:', err)
  } finally {
    followLoading.value = false
  }
}

const unfollowUser = async () => {
  try {
    followLoading.value = true
    await fetchWithAuth(`/api/users/${profile.value.id}/unfollow`, {
      method: 'POST'
    })

    isFollowing.value = false
    profileStats.value.followers--
  } catch (err) {
    console.error('[Profile] Error unfollowing user:', err)
  } finally {
    followLoading.value = false
  }
}

const toggleFollowUser = async (userId: string) => {
  try {
    const user = followers.value.find(u => u.id === userId) || following.value.find(u => u.id === userId)
    if (!user) return

    if (user.following) {
      await fetchWithAuth(`/api/users/${userId}/unfollow`, { method: 'POST' })
    } else {
      await fetchWithAuth(`/api/users/${userId}/follow`, { method: 'POST' })
    }

    user.following = !user.following
  } catch (err) {
    console.error('[Profile] Error toggling follow:', err)
  }
}

const likePost = async (postId: string) => {
  try {
    await fetchWithAuth(`/api/posts/${postId}/like`, { method: 'POST' })
    const post = profilePosts.value.find(p => p.id === postId)
    if (post) {
      post.liked_by_me = !post.liked_by_me
      post.likes_count = post.liked_by_me ? (post.likes_count || 0) + 1 : Math.max(0, (post.likes_count || 1) - 1)
    }
  } catch (err) {
    console.error('[Profile] Error liking post:', err)
  }
}

const commentPost = (postId: string) => {
  router.push(`/posts/${postId}`)
}

const sharePost = async (postId: string) => {
  try {
    const post = profilePosts.value.find(p => p.id === postId)
    if (!post) return

    const postUrl = `${window.location.origin}/posts/${postId}`
    
    if (navigator.share) {
      await navigator.share({
        title: 'Check out this post',
        text: post.content,
        url: postUrl
      })
    } else {
      await navigator.clipboard.writeText(postUrl)
    }

    await fetchWithAuth(`/api/posts/${postId}/share`, { method: 'POST' })
    post.shares_count = (post.shares_count || 0) + 1
  } catch (err) {
    console.error('[Profile] Error sharing post:', err)
  }
}

const sendMessage = () => {
  router.push(`/chat/${profile.value.id}`)
}

const shareProfile = async () => {
  try {
    const profileUrl = `${window.location.origin}/profile/${profile.value.username}`
    
    if (navigator.share) {
      await navigator.share({
        title: `Check out ${profile.value.full_name}`,
        text: `Follow ${profile.value.full_name} on SocialVerse!`,
        url: profileUrl
      })
    } else {
      await navigator.clipboard.writeText(profileUrl)
    }
  } catch (err) {
    console.error('[Profile] Error sharing profile:', err)
  }
}

const reportProfile = async () => {
  try {
    await fetchWithAuth(`/api/users/${profile.value.id}/report`, {
      method: 'POST',
      body: { reason: 'inappropriate' }
    })
    showMoreMenu.value = false
  } catch (err) {
    console.error('[Profile] Error reporting profile:', err)
  }
}

const blockUser = async () => {
  try {
    await fetchWithAuth(`/api/users/${profile.value.id}/block`, { method: 'POST' })
    showMoreMenu.value = false
    router.push('/feed')
  } catch (err) {
    console.error('[Profile] Error blocking user:', err)
  }
}

// ============================================================================
// METHODS - NAVIGATION
// ============================================================================
const goToEditProfile = () => {  
  router.push('/profile/edit')  
}  

const goToFollowers = () => {
  activeTab.value = 'followers'
  if (followers.value.length === 0) {
    fetchFollowers()
  }
}

const goToFollowing = () => {
  activeTab.value = 'following'
  if (following.value.length === 0) {
    fetchFollowing()
  }
}

const goToPosts = () => {
  activeTab.value = 'posts'
}

const goToUserProfile = (username: string) => {
  if (username && username !== profile.value.username) {
    router.push(`/profile/${username}`)
  }
}

const editCover = () => {
  // Implement cover upload
  console.log('[Profile] Edit cover')
}

const editAvatar = () => {
  // Implement avatar upload
  console.log('[Profile] Edit avatar')
}

const togglePostMenu = (postId: string) => {
  // Implement post menu
  console.log('[Profile] Toggle post menu:', postId)
}

const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value
}

const loadMorePosts = async () => {
  currentPostPage.value++
  loadingMore.value = true
  try {
    const response = await fetchWithAuth(`/api/posts/user/${profile.value.id}`, {
      method: 'GET',
      query: { page: currentPostPage.value, limit: 10 }
    })

    profilePosts.value.push(...(response.posts || []))
    hasMorePosts.value = response.has_more || false
  } catch (err) {
    console.error('[Profile] Error loading more posts:', err)
  } finally {
    loadingMore.value = false
  }
}

const retryLoad = () => {
  fetchProfileData()
}

// ============================================================================
// UTILITY METHODS
// ============================================================================
const formatDate = (date: string | Date) => {
  try {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
  } catch {
    return 'Unknown'
  }
}

const formatTime = (date: string | Date) => {
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
  } catch {
    return 'unknown'
  }
}

const openMediaViewer = (mediaUrl: string) => {
  window.open(mediaUrl, '_blank')
}

const checkFollowStatus = async (userId: string) => {
  try {
    const response = await fetchWithAuth(`/api/users/${userId}/follow-status`, {
      method: 'GET'
    })
    isFollowing.value = response.following || false
  } catch (err) {
    console.error('[Profile] Error checking follow status:', err)
  }
}

// ============================================================================
// WATCHERS
// ============================================================================
watch(() => activeTab.value, (newTab) => {
  if (newTab === 'followers' && followers.value.length === 0) {
    fetchFollowers()
  } else if (newTab === 'following' && following.value.length === 0) {
    fetchFollowing()
  } else if (newTab === 'likes' && likedPosts.value.length === 0) {
    fetchLikedPosts()
  }
})

watch(() => route.params.id, () => {
  fetchProfileData()
})

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================
onMounted(() => {
  console.log('[Profile] Component mounted')
  fetchProfileData()
})
</script>

<style scoped>
/* ============================================================================
   GLOBAL STYLES
   ============================================================================ */
.profile-page {
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
}

/* ============================================================================
   HEADER SECTION
   ============================================================================ */
.profile-header {
  background: #1e293b;
  border-bottom: 1px solid #334155;
  overflow: hidden;
}

.cover-image-wrapper {
  position: relative;
  width: 100%;
  height: 300px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
}

.btn-edit-cover {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit-cover:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* Profile Info Section */
.profile-info-section {
  padding: 2rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-header-content {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  align-items: flex-start;
}

.profile-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #0f172a;
  cursor: pointer;
  transition: all 0.2s;
}

.profile-avatar:hover {
  transform: scale(1.05);
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid #0f172a;
}

.status-indicator.online {
  background: #10b981;
}

.status-indicator.away {
  background: #f59e0b;
}

.status-indicator.offline {
  background: #6b7280;
}

.btn-edit-avatar {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit-avatar:hover {
  background: #2563eb;
}

.profile-basic-info {
  flex: 1;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.profile-name {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #f1f5f9;
}

.verified-badge {
  display: flex;
  align-items: center;
  color: #3b82f6;
}

.profile-username {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #94a3b8;
}

.profile-bio {
  margin: 0.75rem 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #cbd5e1;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #94a3b8;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-item a {
  color: #3b82f6;
  text-decoration: none;
}

.meta-item a:hover {
  text-decoration: underline;
}

/* Profile Actions */
.profile-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.btn-edit-profile,
.btn-follow,
.btn-following,
.btn-message,
.btn-more {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-edit-profile:hover,
.btn-follow:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-following {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.btn-following:hover {
  background: #3b82f6;
  color: white;
}

.btn-message,
.btn-more {
  padding: 0.75rem;
  width: 40px;
  justify-content: center;
}

.btn-more {
  position: relative;
}

/* More Menu */
.more-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
  z-index: 10;
  min-width: 160px;
  margin-top: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  color: #e2e8f0;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  text-align: left;
}

.menu-item:hover {
  background: #1e293b;
  color: #60a5fa;
}

/* Profile Stats Row */
.profile-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #334155;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.stat-item:hover {
  background: #1e293b;
  transform: translateY(-2px);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #60a5fa;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
  font-weight: 500;
}

/* ============================================================================
   MAIN CONTENT
   ============================================================================ */
.profile-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Tabs Navigation */
.profile-tabs {
  display: flex;
  gap: 0;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: transparent;
  color: #94a3b8;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  font-size: 0.875rem;
}

.tab-btn:hover {
  color: #e2e8f0;
  background: #0f172a;
}

.tab-btn.active {
  color: #60a5fa;
  border-bottom-color: #3b82f6;
  background: #0f172a;
}

/* Tab Content */
.tab-content {
  min-height: 400px;
}

.tab-pane {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ============================================================================
   POSTS LIST
   ============================================================================ */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-post {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.profile-post:hover {
  border-color: #475569;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.post-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  position: relative;
}

.post-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.post-avatar:hover {
  transform: scale(1.05);
}

.post-author-info {
  flex: 1;
}

.post-author-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
}

.post-author-username {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #94a3b8;
}

.post-timestamp {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.post-menu-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.post-menu-btn:hover {
  background: #0f172a;
  color: #60a5fa;
}

.post-content {
  margin-bottom: 1rem;
}

.post-text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #e2e8f0;
}

.post-media-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.post-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  cursor: pointer;
  transition: all 0.2s;
}

.post-image:hover {
  transform: scale(1.02);
}

.post-stats {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 0;
  border-top: 1px solid #334155;
  border-bottom: 1px solid #334155;
  font-size: 0.875rem;
  color: #94a3b8;
}

.post-stats .stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.post-stats .stat:hover {
  color: #60a5fa;
}

.post-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: transparent;
  color: #94a3b8;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.action-btn:hover {
  background: #0f172a;
  color: #60a5fa;
}

.action-btn.liked {
  color: #ef4444;
}

/* ============================================================================
   USERS LIST
   ============================================================================ */
.users-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  transition: all 0.2s;
}

.user-item:hover {
  border-color: #475569;
  background: #0f172a;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.user-info {
  flex: 1;
}

.user-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
}

.user-username {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #94a3b8;
}

.btn-follow-small {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-follow-small:hover {
  background: #2563eb;
}

.btn-follow-small.following {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.btn-follow-small.following:hover {
  background: #3b82f6;
  color: white;
}

/* ============================================================================
   LOADING & EMPTY STATES
   ============================================================================ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #94a3b8;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-large {
  width: 64px;
  height: 64px;
  border: 4px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  margin: 0;
  font-size: 0.95rem;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  color: #94a3b8;
}

.no-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #94a3b8;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
}

.no-content h3 {
  margin: 1rem 0 0.5rem 0;
  color: #e2e8f0;
  font-size: 1.1rem;
}

.no-content p {
  margin: 0;
  font-size: 0.95rem;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.btn-load-more {
  padding: 0.75rem 2rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.btn-load-more:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

/* ============================================================================
   ERROR STATE
   ============================================================================ */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
  color: #ef4444;
}

.error-state h2 {
  margin: 1rem 0;
  font-size: 1.5rem;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
}

.btn-retry:hover {
  background: #dc2626;
  transform: translateY(-2px);
}

/* ============================================================================
   PAGE LOADING
   ============================================================================ */
.page-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: #94a3b8;
}

.page-loading p {
  margin-top: 1rem;
  font-size: 0.95rem;
}

/* ============================================================================
   RESPONSIVE DESIGN
   ============================================================================ */
@media (max-width: 768px) {
  .cover-image-wrapper {
    height: 200px;
  }

  .profile-info-section {
    padding: 1rem;
  }

  .profile-header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .profile-avatar {
    width: 100px;
    height: 100px;
  }

  .profile-name {
    font-size: 1.5rem;
  }

  .profile-stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .profile-main {
    padding: 1rem;
  }

  .profile-tabs {
    margin-bottom: 1rem;
  }

  .tab-btn {
    padding: 0.75rem 0.5rem;
    font-size: 0.75rem;
  }

  .profile-post {
    padding: 1rem;
  }

  .profile-actions {
    gap: 0.5rem;
  }

  .btn-edit-profile,
  .btn-follow,
  .btn-following {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .profile-name {
    font-size: 1.25rem;
  }

  .profile-stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .profile-tabs {
    gap: 0;
  }

  .tab-btn {
    padding: 0.5rem 0.25rem;
    font-size: 0.65rem;
  }
}
</style>
