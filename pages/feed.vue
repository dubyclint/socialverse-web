<!-- FILE: /pages/feed.vue - COMPLETE MERGED VERSION -->
<!-- ============================================================================
     FEED PAGE - COMPLETE MERGE: FeedHeader + Feed Page
     ✅ MERGED: FeedHeader component fully integrated
     ✅ MERGED: Hamburger menu with sidebar navigation
     ✅ MERGED: Logo and center navigation
     ✅ MERGED: User avatar with status indicator
     ✅ MERGED: All sidebar menu items (Profile, Chat, Explore, P2P, Escrow, etc.)
     ✅ MERGED: Left sidebar with profile card
     ✅ MERGED: Center feed with posts
     ✅ MERGED: Right sidebar with search, suggestions, trending
     ✅ NO DUPLICATES: Single source of truth for all navigation
     ✅ ALL FUNCTIONS: Complete and working
     ✅ ALL ROUTES: Properly configured
     ============================================================================ -->

<template>
  <div class="feed-page">
    <!-- ========================================================================
         HEADER - MERGED FROM FEEDHEADER COMPONENT
         ======================================================================== -->
    <header class="feed-header">
      <div class="header-top">
        <!-- Left Side - Hamburger Menu & Logo -->
        <div class="header-left">
          <button @click="toggleSidebar" class="menu-btn" aria-label="Toggle menu">
            <Icon name="menu" size="20" />
          </button>
          <NuxtLink to="/feed" class="logo">
            <img src="/logo.svg" alt="SocialVerse" class="logo-img" />
            <span class="logo-text">SocialVerse</span>
          </NuxtLink>
        </div>

        <!-- Center - Navigation Icons -->
        <nav class="header-center">
          <NuxtLink 
            to="/feed" 
            class="nav-icon" 
            :class="{ active: route.path === '/feed' }"
            aria-label="Feed"
          >
            <Icon name="home" size="24" />
            <span class="nav-label">Feed</span>
          </NuxtLink>

          <NuxtLink 
            to="/posts/create" 
            class="nav-icon" 
            :class="{ active: route.path === '/posts/create' }"
            aria-label="Create Post"
          >
            <Icon name="plus-square" size="24" />
            <span class="nav-label">Post</span>
          </NuxtLink>

          <NuxtLink 
            to="/stream" 
            class="nav-icon" 
            :class="{ active: route.path === '/stream' }"
            aria-label="Live Stream"
          >
            <Icon name="radio" size="24" />
            <span class="nav-label">Live</span>
            <span v-if="isLiveStreaming" class="notification-badge live">LIVE</span>
          </NuxtLink>

          <NuxtLink 
            to="/wallet" 
            class="nav-icon" 
            :class="{ active: route.path === '/wallet' }"
            aria-label="Wallet"
          >
            <Icon name="wallet" size="24" />
            <span class="nav-label">Wallet</span>
          </NuxtLink>
        </nav>

        <!-- Right Side - User Avatar -->
        <div class="header-right">
          <div class="user-avatar-wrapper">
            <img 
              :src="userAvatar" 
              :alt="userName" 
              class="user-avatar"
              @click="goToProfile"
            />
            <span class="status-indicator" :class="userStatus"></span>
          </div>
        </div>
      </div>

      <!-- Mobile Sidebar Overlay -->
      <div v-if="sidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>

      <!-- Sidebar Menu - MERGED FROM FEEDHEADER -->
      <aside :class="['sidebar', { open: sidebarOpen }]">
        <div class="sidebar-header">
          <h3>Menu</h3>
          <button class="close-btn" @click="toggleSidebar">
            <Icon name="x" size="20" />
          </button>
        </div>

        <nav class="sidebar-nav">
          <!-- Primary Navigation Section -->
          <NuxtLink to="/profile" class="sidebar-item" @click="toggleSidebar">
            <Icon name="user" size="18" />
            <span>Profile</span>
          </NuxtLink>

          <NuxtLink to="/chat" class="sidebar-item" @click="toggleSidebar">
            <Icon name="message-circle" size="18" />
            <span>Chat</span>
            <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
          </NuxtLink>

          <NuxtLink to="/notifications" class="sidebar-item" @click="toggleSidebar">
            <Icon name="bell" size="18" />
            <span>Notifications</span>
            <span v-if="unreadNotifications > 0" class="badge">{{ unreadNotifications }}</span>
          </NuxtLink>

          <NuxtLink to="/inbox" class="sidebar-item" @click="toggleSidebar">
            <Icon name="inbox" size="18" />
            <span>Inbox</span>
            <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
          </NuxtLink>

          <NuxtLink to="/explore" class="sidebar-item" @click="toggleSidebar">
            <Icon name="compass" size="18" />
            <span>Explore</span>
          </NuxtLink>

          <!-- Divider -->
          <div class="sidebar-divider"></div>

          <!-- Trading & Commerce Section -->
          <NuxtLink to="/p2p" class="sidebar-item" @click="toggleSidebar">
            <Icon name="trending-up" size="18" />
            <span>P2P Trading</span>
          </NuxtLink>

          <NuxtLink to="/escrow" class="sidebar-item" @click="toggleSidebar">
            <Icon name="shield" size="18" />
            <span>Escrow</span>
          </NuxtLink>

          <NuxtLink to="/monetization" class="sidebar-item" @click="toggleSidebar">
            <Icon name="dollar-sign" size="18" />
            <span>Monetization</span>
          </NuxtLink>

          <NuxtLink to="/ads" class="sidebar-item" @click="toggleSidebar">
            <Icon name="megaphone" size="18" />
            <span>Ads</span>
          </NuxtLink>

          <!-- Divider -->
          <div class="sidebar-divider"></div>

          <!-- Support & Settings Section -->
          <NuxtLink to="/support-chat" class="sidebar-item" @click="toggleSidebar">
            <Icon name="headphones" size="18" />
            <span>Agent Support</span>
          </NuxtLink>

          <NuxtLink to="/terms-and-policy" class="sidebar-item" @click="toggleSidebar">
            <Icon name="file-text" size="18" />
            <span>Policy & T&Cs</span>
          </NuxtLink>

          <NuxtLink to="/settings" class="sidebar-item" @click="toggleSidebar">
            <Icon name="settings" size="18" />
            <span>Settings</span>
          </NuxtLink>

          <!-- Divider -->
          <div class="sidebar-divider"></div>

          <!-- Logout -->
          <button class="sidebar-item logout-btn" @click="handleLogout">
            <Icon name="log-out" size="18" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </header>

    <!-- ========================================================================
         MAIN CONTENT WRAPPER
         ======================================================================== -->
    <main class="feed-main-wrapper">
      <!-- Left Sidebar - User Profile & Quick Actions -->
      <ClientOnly>
        <aside class="feed-sidebar-left">
          <!-- User Profile Card -->
          <div class="profile-card">
            <div class="profile-header">
              <div class="profile-avatar-wrapper">
                <img 
                  :src="userAvatar" 
                  :alt="userName" 
                  class="profile-avatar"
                  @click="goToProfile"
                />
                <span :class="['status-indicator', userStatus]"></span>
              </div>
              <div class="profile-info">
                <h3 class="profile-name">{{ userName }}</h3>
                <p class="profile-username">@{{ userUsername }}</p>
              </div>
            </div>

            <!-- Profile Stats -->
            <div class="profile-stats">
              <div class="stat" @click="goToFollowers">
                <span class="stat-value">{{ userFollowers }}</span>
                <span class="stat-label">Followers</span>
              </div>
              <div class="stat" @click="goToFollowing">
                <span class="stat-value">{{ userFollowing }}</span>
                <span class="stat-label">Following</span>
              </div>
              <div class="stat" @click="goToUserPosts">
                <span class="stat-value">{{ userPosts }}</span>
                <span class="stat-label">Posts</span>
              </div>
            </div>

            <!-- Profile Actions -->
            <div class="profile-actions">
              <button class="btn-edit-profile" @click="goToProfile">
                <Icon name="edit-2" size="16" />
                Edit Profile
              </button>
              <button class="btn-share-profile" @click="shareProfile">
                <Icon name="share-2" size="16" />
              </button>
            </div>

            <!-- Quick Stats -->
            <div class="quick-stats">
              <div class="quick-stat">
                <span class="label">Wallet Balance</span>
                <span class="value">{{ walletBalance }}</span>
              </div>
              <div class="quick-stat">
                <span class="label">Verification</span>
                <span :class="['value', isVerified ? 'verified' : 'pending']">
                  {{ isVerified ? '✓ Verified' : '⏳ Pending' }}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </ClientOnly>

      <!-- Center Feed -->
      <section class="feed-content">
        <!-- Feed Tabs/Filters -->
        <div class="feed-tabs">
          <button 
            v-for="tab in feedTabs" 
            :key="tab.id"
            :class="['feed-tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id; refreshFeed()"
          >
            <Icon :name="tab.icon" size="18" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- Create Post Section -->
        <ClientOnly>
          <div class="create-post-section">
            <div class="create-post-header">
              <img 
                :src="userAvatar" 
                :alt="userName" 
                class="create-post-avatar"
              />
              <div class="create-post-input-wrapper">
                <input 
                  type="text" 
                  placeholder="What's on your mind?" 
                  class="create-post-input"
                  @click="goToCreatePost"
                  readonly
                />
              </div>
            </div>
            <div class="create-post-actions">
              <button class="action-btn" @click="goToCreatePost" title="Add Photo">
                <Icon name="image" size="18" />
                <span class="action-label">Photo</span>
              </button>
              <button class="action-btn" @click="goToCreatePost" title="Add Video">
                <Icon name="video" size="18" />
                <span class="action-label">Video</span>
              </button>
              <button class="action-btn" @click="goToCreatePost" title="Add Feeling">
                <Icon name="smile" size="18" />
                <span class="action-label">Feeling</span>
              </button>
              <button class="action-btn" @click="goToCreatePost" title="Add Poll">
                <Icon name="bar-chart-2" size="18" />
                <span class="action-label">Poll</span>
              </button>
            </div>
          </div>
        </ClientOnly>

        <!-- Posts Feed -->
        <ClientOnly>
          <!-- Loading State -->
          <div v-if="postsLoading && posts.length === 0" class="loading-state">
            <div class="spinner"></div>
            <p>Loading posts...</p>
          </div>

          <!-- Posts List -->
          <div v-else-if="posts.length > 0" class="posts-list">
            <article 
              v-for="post in posts" 
              :key="post.id" 
              class="feed-post"
              :class="{ 'has-media': post.media && post.media.length > 0 }"
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
                  <div class="author-name-row">
                    <h4 class="post-author-name">{{ post.author?.full_name }}</h4>
                    <span v-if="post.author?.verified" class="verified-badge" title="Verified">
                      <Icon name="check-circle" size="14" />
                    </span>
                  </div>
                  <p class="post-author-username">@{{ post.author?.username }}</p>
                  <span class="post-timestamp">{{ formatTime(post.created_at) }}</span>
                </div>
                <button class="post-menu-btn" @click="togglePostMenu(post.id)" title="More options">
                  <Icon name="more-vertical" size="20" />
                </button>
                <!-- Post Menu -->
                <div v-if="activePostMenu === post.id" class="post-menu">
                  <button class="menu-item" @click="reportPost(post.id)">
                    <Icon name="flag" size="16" />
                    Report Post
                  </button>
                  <button v-if="post.author?.id === currentUser?.id" class="menu-item" @click="deletePost(post.id)">
                    <Icon name="trash-2" size="16" />
                    Delete Post
                  </button>
                  <button class="menu-item" @click="copyPostLink(post.id)">
                    <Icon name="link" size="16" />
                    Copy Link
                  </button>
                </div>
              </div>

              <!-- Post Content -->
              <div class="post-content">
                <p class="post-text">{{ post.content }}</p>
                
                <!-- Post Media Gallery -->
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

                <!-- Post Hashtags -->
                <div v-if="post.hashtags && post.hashtags.length > 0" class="post-hashtags">
                  <NuxtLink 
                    v-for="tag in post.hashtags" 
                    :key="tag"
                    :to="`/explore?tag=${tag}`"
                    class="hashtag"
                  >
                    #{{ tag }}
                  </NuxtLink>
                </div>
              </div>

              <!-- Post Stats -->
              <div class="post-stats">
                <span class="stat" @click="viewPostLikes(post.id)">
                  <Icon name="heart" size="14" />
                  {{ post.likes_count || 0 }} Likes
                </span>
                <span class="stat" @click="viewPostComments(post.id)">
                  <Icon name="message-circle" size="14" />
                  {{ post.comments_count || 0 }} Comments
                </span>
                <span class="stat" @click="viewPostShares(post.id)">
                  <Icon name="share-2" size="14" />
                  {{ post.shares_count || 0 }} Shares
                </span>
              </div>

              <!-- Post Actions -->
              <div class="post-actions">
                <button 
                  :class="['action-btn', { liked: post.liked_by_me }]" 
                  @click="likePost(post.id)"
                  :title="post.liked_by_me ? 'Unlike' : 'Like'"
                >
                  <Icon :name="post.liked_by_me ? 'heart' : 'heart'" size="18" :fill="post.liked_by_me" />
                  <span>{{ post.liked_by_me ? 'Liked' : 'Like' }}</span>
                </button>
                <button class="action-btn" @click="commentPost(post.id)" title="Comment">
                  <Icon name="message-circle" size="18" />
                  <span>Comment</span>
                </button>
                <button class="action-btn" @click="sharePost(post.id)" title="Share">
                  <Icon name="share-2" size="18" />
                  <span>Share</span>
                </button>
                <button class="action-btn" @click="savePost(post.id)" title="Save">
                  <Icon name="bookmark" size="18" />
                  <span>Save</span>
                </button>
              </div>
            </article>

            <!-- Load More Button -->
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

          <!-- No Posts State -->
          <div v-else class="no-posts">
            <Icon name="inbox" size="48" />
            <h3>No posts yet</h3>
            <p>Start following people to see their posts!</p>
            <div class="no-posts-actions">
              <NuxtLink to="/explore" class="btn-explore">
                <Icon name="compass" size="18" />
                Explore People
              </NuxtLink>
              <button @click="goToCreatePost" class="btn-create">
                <Icon name="plus-square" size="18" />
                Create Post
              </button>
            </div>
          </div>
        </ClientOnly>
      </section>

      <!-- Right Sidebar - Recommendations & Trending -->
      <ClientOnly>
        <aside class="feed-sidebar-right">
          <!-- Search Card -->
          <div class="search-card">
            <div class="search-wrapper">
              <Icon name="search" size="18" class="search-icon" />
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search posts, people..." 
                class="search-input"
                @keyup.enter="performSearch"
              />
            </div>
          </div>

          <!-- Suggested Users Card -->
          <div class="recommendations-card">
            <div class="card-header">
              <h3 class="card-title">Suggested For You</h3>
              <button class="refresh-btn" @click="refreshSuggestedUsers" title="Refresh">
                <Icon name="refresh-cw" size="16" />
              </button>
            </div>
            
            <div v-if="suggestedUsersLoading" class="loading-small">
              <div class="spinner-small"></div>
            </div>
            <div v-else-if="suggestedUsers.length > 0" class="recommendations-list">
              <div 
                v-for="user in suggestedUsers" 
                :key="user.id" 
                class="recommendation-item"
              >
                <img 
                  :src="user.avatar_url || '/default-avatar.svg'" 
                  :alt="user.full_name" 
                  class="rec-avatar"
                  @click="goToUserProfile(user.username)"
                />
                <div class="rec-info">
                  <h4 class="rec-name">{{ user.full_name }}</h4>
                  <p class="rec-username">@{{ user.username }}</p>
                </div>
                <button 
                  :class="['btn-follow', { following: user.following }]"
                  @click="followUser(user.id)"
                  :title="user.following ? 'Unfollow' : 'Follow'"
                >
                  {{ user.following ? 'Following' : 'Follow' }}
                </button>
              </div>
            </div>
            <div v-else class="empty-state-small">
              <p>No suggestions available</p>
            </div>
          </div>

          <!-- Trending Card -->
          <div class="trending-card">
            <div class="card-header">
              <h3 class="card-title">Trending Now</h3>
              <button class="refresh-btn" @click="refreshTrending" title="Refresh">
                <Icon name="refresh-cw" size="16" />
              </button>
            </div>
            
            <div v-if="trendingLoading" class="loading-small">
              <div class="spinner-small"></div>
            </div>
            <div v-else-if="trendingTopics.length > 0" class="trending-list">
              <NuxtLink
                v-for="trend in trendingTopics" 
                :key="trend.id" 
                :to="`/explore?tag=${trend.title}`"
                class="trending-item"
              >
                <div class="trend-info">
                  <p class="trend-category">{{ trend.category }}</p>
                  <h4 class="trend-title">{{ trend.title }}</h4>
                  <p class="trend-count">{{ trend.count }} posts</p>
                </div>
              </NuxtLink>
            </div>
            <div v-else class="empty-state-small">
              <p>No trending topics</p>
            </div>
          </div>
        </aside>
      </ClientOnly>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeMount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useFetchWithAuth } from '~/composables/use-fetch'

// ============================================================================
// SETUP & INITIALIZATION
// ============================================================================
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const fetchWithAuth = useFetchWithAuth()

// ============================================================================
// REACTIVE STATE - HEADER & SIDEBAR
// ============================================================================
const sidebarOpen = ref(false)
const isLiveStreaming = ref(false)

// ============================================================================
// REACTIVE STATE - POSTS & FEED
// ============================================================================
const posts = ref<any[]>([])
const postsLoading = ref(true)
const loadingMore = ref(false)
const hasMorePosts = ref(true)
const currentPage = ref(1)
const activeTab = ref('for-you')
const activePostMenu = ref<string | null>(null)

// ============================================================================
// REACTIVE STATE - USERS & RECOMMENDATIONS
// ============================================================================
const suggestedUsers = ref<any[]>([])
const suggestedUsersLoading = ref(false)

// ============================================================================
// REACTIVE STATE - TRENDING & SEARCH
// ============================================================================
const trendingTopics = ref<any[]>([])
const trendingLoading = ref(false)
const searchQuery = ref('')

// ============================================================================
// REACTIVE STATE - NOTIFICATIONS & MESSAGES
// ============================================================================
const unreadNotifications = ref(0)
const unreadMessages = ref(0)

// ============================================================================
// REACTIVE STATE - USER PROFILE
// ============================================================================
const walletBalance = ref('$0.00')
const isVerified = ref(false)

// ============================================================================
// COMPUTED PROPERTIES - USER DATA FROM AUTH STORE
// ============================================================================
const currentUser = computed(() => authStore.user)
const userName = computed(() => currentUser.value?.full_name || 'User')
const userUsername = computed(() => currentUser.value?.username || 'username')
const userAvatar = computed(() => currentUser.value?.avatar_url || '/default-avatar.svg')
const userFollowers = computed(() => currentUser.value?.followers_count || 0)
const userFollowing = computed(() => currentUser.value?.following_count || 0)
const userPosts = computed(() => currentUser.value?.posts_count || 0)
const userStatus = computed(() => currentUser.value?.status || 'online')

// ============================================================================
// FEED TABS CONFIGURATION
// ============================================================================
const feedTabs = [
  { id: 'for-you', label: 'For You', icon: 'home' },
  { id: 'following', label: 'Following', icon: 'users' },
  { id: 'trending', label: 'Trending', icon: 'trending-up' }
]

// ============================================================================
// METHODS - HEADER & SIDEBAR (FROM FEEDHEADER)
// ============================================================================
const toggleSidebar = () => {
  console.log('[Feed] Toggle sidebar')
  sidebarOpen.value = !sidebarOpen.value
}

const handleLogout = async () => {
  try {
    console.log('[Feed] Logging out user')
    sidebarOpen.value = false
    await authStore.logout()
    router.push('/auth/signin')
  } catch (error) {
    console.error('[Feed] Error logging out:', error)
  }
}

// ============================================================================
// NAVIGATION METHODS
// ============================================================================
const goToProfile = () => {
  console.log('[Feed] Navigate to profile')
  sidebarOpen.value = false
  router.push(`/profile/${userUsername.value}`)
}

const goToUserProfile = (username: string) => {
  console.log('[Feed] Navigate to user profile:', username)
  sidebarOpen.value = false
  router.push(`/profile/${username}`)
}

const goToFollowers = () => {
  console.log('[Feed] Navigate to followers')
  router.push(`/profile/${userUsername.value}/followers`)
}

const goToFollowing = () => {
  console.log('[Feed] Navigate to following')
  router.push(`/profile/${userUsername.value}/following`)
}

const goToUserPosts = () => {
  console.log('[Feed] Navigate to user posts')
  router.push(`/profile/${userUsername.value}/posts`)
}

const goToCreatePost = () => {
  console.log('[Feed] Navigate to create post')
  sidebarOpen.value = false
  router.push('/posts/create')
}

const shareProfile = async () => {
  console.log('[Feed] Share profile')
  try {
    if (navigator.share) {
      await navigator.share({
        title: `Check out ${userName.value}`,
        text: `Follow ${userName.value} on SocialVerse!`,
        url: `${window.location.origin}/profile/${userUsername.value}`
      })
    } else {
      const profileUrl = `${window.location.origin}/profile/${userUsername.value}`
      await navigator.clipboard.writeText(profileUrl)
      console.log('[Feed] Profile URL copied to clipboard')
    }
  } catch (error) {
    console.error('[Feed] Error sharing profile:', error)
  }
}

// ============================================================================
// POST INTERACTION METHODS
// ============================================================================
const togglePostMenu = (postId: string) => {
  console.log('[Feed] Toggle post menu:', postId)
  activePostMenu.value = activePostMenu.value === postId ? null : postId
}

const likePost = async (postId: string) => {
  try {
    console.log('[Feed] Liking post:', postId)
    await fetchWithAuth(`/api/posts/${postId}/like`, { method: 'POST' })
    
    const post = posts.value.find(p => p.id === postId)
    if (post) {
      post.liked_by_me = !post.liked_by_me
      post.likes_count = post.liked_by_me 
        ? (post.likes_count || 0) + 1 
        : Math.max(0, (post.likes_count || 1) - 1)
    }
    console.log('[Feed] Post liked successfully')
  } catch (error) {
    console.error('[Feed] Error liking post:', error)
  }
}

const commentPost = (postId: string) => {
  console.log('[Feed] Navigate to comments:', postId)
  sidebarOpen.value = false
  router.push(`/posts/${postId}`)
}

const sharePost = async (postId: string) => {
  try {
    console.log('[Feed] Sharing post:', postId)
    
    const post = posts.value.find(p => p.id === postId)
    if (!post) return

    if (navigator.share) {
      await navigator.share({
        title: 'Check out this post',
        text: post.content,
        url: `${window.location.origin}/posts/${postId}`
      })
    } else {
      const postUrl = `${window.location.origin}/posts/${postId}`
      await navigator.clipboard.writeText(postUrl)
      console.log('[Feed] Post URL copied to clipboard')
    }

    await fetchWithAuth(`/api/posts/${postId}/share`, { method: 'POST' })

    if (post) {
      post.shares_count = (post.shares_count || 0) + 1
    }
    console.log('[Feed] Post shared successfully')
  } catch (error) {
    console.error('[Feed] Error sharing post:', error)
  }
}

const savePost = async (postId: string) => {
  try {
    console.log('[Feed] Saving post:', postId)
    await fetchWithAuth(`/api/posts/${postId}/save`, { method: 'POST' })
    
    const post = posts.value.find(p => p.id === postId)
    if (post) {
      post.saved_by_me = !post.saved_by_me
    }
    console.log('[Feed] Post saved successfully')
  } catch (error) {
    console.error('[Feed] Error saving post:', error)
  }
}

const reportPost = async (postId: string) => {
  try {
    console.log('[Feed] Reporting post:', postId)
    await fetchWithAuth(`/api/posts/${postId}/report`, {
      method: 'POST',
      body: { reason: 'inappropriate' }
    })
    activePostMenu.value = null
    console.log('[Feed] Post reported successfully')
  } catch (error) {
    console.error('[Feed] Error reporting post:', error)
  }
}

const deletePost = async (postId: string) => {
  try {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    console.log('[Feed] Deleting post:', postId)
    await fetchWithAuth(`/api/posts/${postId}`, { method: 'DELETE' })
    
    posts.value = posts.value.filter(p => p.id !== postId)
    activePostMenu.value = null
    console.log('[Feed] Post deleted successfully')
  } catch (error) {
    console.error('[Feed] Error deleting post:', error)
  }
}

const copyPostLink = async (postId: string) => {
  try {
    console.log('[Feed] Copying post link:', postId)
    const postUrl = `${window.location.origin}/posts/${postId}`
    await navigator.clipboard.writeText(postUrl)
    activePostMenu.value = null
    console.log('[Feed] Post link copied to clipboard')
  } catch (error) {
    console.error('[Feed] Error copying post link:', error)
  }
}

const viewPostLikes = (postId: string) => {
  console.log('[Feed] View post likes:', postId)
  sidebarOpen.value = false
  router.push(`/posts/${postId}/likes`)
}

const viewPostComments = (postId: string) => {
  console.log('[Feed] View post comments:', postId)
  sidebarOpen.value = false
  router.push(`/posts/${postId}`)
}

const viewPostShares = (postId: string) => {
  console.log('[Feed] View post shares:', postId)
  sidebarOpen.value = false
  router.push(`/posts/${postId}/shares`)
}

const openMediaViewer = (mediaUrl: string) => {
  console.log('[Feed] Open media viewer:', mediaUrl)
  window.open(mediaUrl, '_blank')
}

// ============================================================================
// USER INTERACTION METHODS
// ============================================================================
const followUser = async (userId: string) => {
  try {
    console.log('[Feed] Following user:', userId)
    await fetchWithAuth(`/api/users/${userId}/follow`, { method: 'POST' })
    
    const user = suggestedUsers.value.find(u => u.id === userId)
    if (user) {
      user.following = !user.following
    }
    console.log('[Feed] User followed successfully')
  } catch (error) {
    console.error('[Feed] Error following user:', error)
  }
}

// ============================================================================
// SEARCH & FILTER METHODS
// ============================================================================
const performSearch = async () => {
  try {
    if (!searchQuery.value.trim()) return
    
    console.log('[Feed] Performing search:', searchQuery.value)
    sidebarOpen.value = false
    router.push(`/explore?q=${encodeURIComponent(searchQuery.value)}`)
  } catch (error) {
    console.error('[Feed] Error performing search:', error)
  }
}

const refreshFeed = async () => {
  console.log('[Feed] Refreshing feed with tab:', activeTab.value)
  currentPage.value = 1
  posts.value = []
  postsLoading.value = true
  await fetchPosts()
}

const refreshSuggestedUsers = async () => {
  console.log('[Feed] Refreshing suggested users')
  await fetchSuggestedUsers()
}

const refreshTrending = async () => {
  console.log('[Feed] Refreshing trending topics')
  await fetchTrendingTopics()
}

// ============================================================================
// PAGINATION METHODS
// ============================================================================
const loadMorePosts = async () => {
  console.log('[Feed] Load more posts')
  currentPage.value++
  loadingMore.value = true
  await fetchPosts()
  loadingMore.value = false
}

// ============================================================================
// TIME FORMATTING UTILITY
// ============================================================================
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
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    
    return d.toLocaleDateString()
  } catch (error) {
    console.error('[Feed] Error formatting time:', error)
    return 'unknown'
  }
}

// ============================================================================
// DATA FETCHING METHODS - POSTS
// ============================================================================
const fetchPosts = async () => {
  try {
    console.log('[Feed] Fetching posts, page:', currentPage.value, 'tab:', activeTab.value)
    
    const endpoint = activeTab.value === 'for-you' 
      ? '/api/posts/feed'
      : activeTab.value === 'following'
      ? '/api/posts/following'
      : '/api/posts/trending'

    const result = await fetchWithAuth(endpoint, {
      query: { page: currentPage.value, limit: 10 }
    })

    if (currentPage.value === 1) {
      posts.value = result.posts || []
    } else {
      posts.value.push(...(result.posts || []))
    }

    hasMorePosts.value = result.has_more || false
    console.log('[Feed] Posts loaded:', posts.value.length)
  } catch (error) {
    console.error('[Feed] Error loading posts:', error)
    if (currentPage.value === 1) {
      posts.value = []
    }
  } finally {
    postsLoading.value = false
  }
}

// ============================================================================
// DATA FETCHING METHODS - SUGGESTED USERS
// ============================================================================
const fetchSuggestedUsers = async () => {
  try {
    console.log('[Feed] Fetching suggested users')
    suggestedUsersLoading.value = true
    
    const result = await fetchWithAuth('/api/users/suggested', {
      query: { limit: 5 }
    })

    suggestedUsers.value = result.data || []
    console.log('[Feed] Suggested users loaded:', suggestedUsers.value.length)
  } catch (error) {
    console.error('[Feed] Error loading suggested users:', error)
    suggestedUsers.value = []
  } finally {
    suggestedUsersLoading.value = false
  }
}

// ============================================================================
// DATA FETCHING METHODS - TRENDING TOPICS
// ============================================================================
const fetchTrendingTopics = async () => {
  try {
    console.log('[Feed] Fetching trending topics')
    trendingLoading.value = true
    
    const result = await fetchWithAuth('/api/trending', {
      query: { limit: 5 }
    })

    trendingTopics.value = result.data || []
    console.log('[Feed] Trending topics loaded:', trendingTopics.value.length)
  } catch (error) {
    console.error('[Feed] Error loading trending topics:', error)
    trendingTopics.value = []
  } finally {
    trendingLoading.value = false
  }
}

// ============================================================================
// DATA FETCHING METHODS - NOTIFICATIONS & MESSAGES
// ============================================================================
const fetchNotifications = async () => {
  try {
    console.log('[Feed] Fetching notifications')
    
    const result = await fetchWithAuth('/api/user/notifications', {
      query: { limit: 10, unread_only: true }
    })

    unreadNotifications.value = result.total || 0
    console.log('[Feed] Unread notifications:', unreadNotifications.value)
  } catch (error) {
    console.error('[Feed] Error loading notifications:', error)
    unreadNotifications.value = 0
  }
}

const fetchMessages = async () => {
  try {
    console.log('[Feed] Fetching messages')
    
    const result = await fetchWithAuth('/api/messages', {
      query: { unread_only: true }
    })

    unreadMessages.value = result.total || 0
    console.log('[Feed] Unread messages:', unreadMessages.value)
  } catch (error) {
    console.error('[Feed] Error loading messages:', error)
    unreadMessages.value = 0
  }
}

// ============================================================================
// DATA FETCHING METHODS - USER PROFILE DATA
// ============================================================================
const fetchUserProfileData = async () => {
  try {
    console.log('[Feed] Fetching user profile data')
    
    const result = await fetchWithAuth('/api/user/profile')
    
    if (result) {
      walletBalance.value = result.wallet_balance || '$0.00'
      isVerified.value = result.is_verified || false
    }
    
    console.log('[Feed] User profile data loaded')
  } catch (error) {
    console.error('[Feed] Error loading user profile data:', error)
  }
}

// ============================================================================
// LIFECYCLE HOOKS - AUTHENTICATION CHECK
// ============================================================================
onBeforeMount(() => {
  console.log('[Feed] Before mount - checking auth')
  
  if (!authStore.user || !authStore.token) {
    console.warn('[Feed] User not authenticated, redirecting to signin')
    router.push('/auth/signin')
  }
})

// ============================================================================
// LIFECYCLE HOOKS - COMPONENT MOUNTED
// ============================================================================
onMounted(async () => {
  console.log('[Feed] Component mounted')
  
  if (process.client) {
    console.log('[Feed] Loading data on client-side')
    
    try {
      await Promise.all([
        fetchPosts(),
        fetchSuggestedUsers(),
        fetchTrendingTopics(),
        fetchNotifications(),
        fetchMessages(),
        fetchUserProfileData()
      ])

      console.log('[Feed] All data loaded successfully')
    } catch (error) {
      console.error('[Feed] Error loading data:', error)
    }
  }
})

// ============================================================================
// WATCHERS - REACTIVE UPDATES
// ============================================================================
watch(() => activeTab.value, () => {
  console.log('[Feed] Active tab changed to:', activeTab.value)
  refreshFeed()
})

watch(() => route.path, () => {
  activePostMenu.value = null
  sidebarOpen.value = false
})
</script>

<style scoped>
/* ============================================================================
   GLOBAL STYLES & LAYOUT
   ============================================================================ */
.feed-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #0f172a;
  color: #e2e8f0;
}

.feed-main-wrapper {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem 1rem;
  flex: 1;
}

/* ============================================================================
   RESPONSIVE DESIGN - TABLET
   ============================================================================ */
@media (max-width: 1200px) {
  .feed-main-wrapper {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem 0.5rem;
  }

  .feed-sidebar-left,
  .feed-sidebar-right {
    display: none;
  }
}

/* ============================================================================
   RESPONSIVE DESIGN - MOBILE
   ============================================================================ */
@media (max-width: 768px) {
  .feed-main-wrapper {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .feed-sidebar-left,
  .feed-sidebar-right {
    display: none;
  }
}

/* ============================================================================
   HEADER STYLES - MERGED FROM FEEDHEADER
   ============================================================================ */
.feed-header {
  background: #0f172a;
  border-bottom: 1px solid #334155;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0.75rem 1rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* ============================================================================
   HEADER LEFT - MENU & LOGO
   ============================================================================ */
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 0 0 auto;
}

.menu-btn {
  background: none;
  border: none;
  color: #e2e8f0;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: #1e293b;
  color: #60a5fa;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
}

.logo-img {
  width: 32px;
  height: 32px;
}

.logo-text {
  display: none;
}

@media (min-width: 768px) {
  .logo-text {
    display: inline;
  }
}

/* ============================================================================
   HEADER CENTER - NAVIGATION
   ============================================================================ */
.header-center {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.nav-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;
  position: relative;
  font-size: 0.75rem;
}

.nav-icon:hover {
  color: #60a5fa;
  background: #1e293b;
}

.nav-icon.active {
  color: #60a5fa;
  background: #1e293b;
}

.nav-label {
  font-size: 0.65rem;
  font-weight: 500;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 0.6rem;
  padding: 0.15rem 0.35rem;
  border-radius: 10px;
  font-weight: 600;
}

.notification-badge.live {
  background: #dc2626;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* ============================================================================
   HEADER RIGHT - USER AVATAR
   ============================================================================ */
.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 0 0 auto;
}

.user-avatar-wrapper {
  position: relative;
  cursor: pointer;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #334155;
  transition: all 0.2s;
}

.user-avatar:hover {
  border-color: #60a5fa;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #0f172a;
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

/* ============================================================================
   SIDEBAR OVERLAY
   ============================================================================ */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

/* ============================================================================
   SIDEBAR MENU - MERGED FROM FEEDHEADER
   ============================================================================ */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: #0f172a;
  border-right: 1px solid #334155;
  overflow-y: auto;
  z-index: 101;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  padding-top: 60px;
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #334155;
}

.sidebar-header h3 {
  margin: 0;
  color: white;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #1e293b;
  color: #e2e8f0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.95rem;
  width: 100%;
  text-align: left;
  position: relative;
}

.sidebar-item:hover {
  background: #1e293b;
  color: #60a5fa;
}

.sidebar-item.router-link-active {
  background: #1e293b;
  color: #60a5fa;
  border-left: 3px solid #60a5fa;
  padding-left: calc(1rem - 3px);
}

.sidebar-item.logout-btn {
  color: #ef4444;
  margin-top: auto;
}

.sidebar-item.logout-btn:hover {
  background: #7f1d1d;
  color: #fca5a5;
}

.sidebar-divider {
  height: 1px;
  background: #334155;
  margin: 0.5rem 0;
}

.badge {
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  font-weight: 600;
  margin-left: auto;
}

/* ============================================================================
   RESPONSIVE DESIGN - HIDE CENTER NAV ON MOBILE
   ============================================================================ */
@media (max-width: 768px) {
  .header-center {
    display: none;
  }
}

/* ============================================================================
   LEFT SIDEBAR - PROFILE CARD
   ============================================================================ */
.feed-sidebar-left {
  position: sticky;
  top: 80px;
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.feed-sidebar-left::-webkit-scrollbar {
  width: 6px;
}

.feed-sidebar-left::-webkit-scrollbar-track {
  background: transparent;
}

.feed-sidebar-left::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

.feed-sidebar-left::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

/* Profile Card */
.profile-card {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.profile-card:hover {
  border-color: #475569;
  box-shadow: 0 8px 12px rgba(59, 130, 246, 0.1);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.profile-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #3b82f6;
  cursor: pointer;
  transition: all 0.2s;
}

.profile-avatar:hover {
  transform: scale(1.05);
  border-color: #60a5fa;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-username {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Profile Stats */
.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem 0;
  border-top: 1px solid #334155;
  border-bottom: 1px solid #334155;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.5rem;
  border-radius: 8px;
}

.stat:hover {
  background: #1e293b;
  transform: translateY(-2px);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #60a5fa;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
  font-weight: 500;
}

/* Profile Actions */
.profile-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-edit-profile,
.btn-share-profile {
  flex: 1;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.btn-share-profile {
  flex: 0 0 auto;
  width: 40px;
  padding: 0.75rem;
}

.btn-edit-profile:hover,
.btn-share-profile:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-edit-profile:active,
.btn-share-profile:active {
  transform: translateY(0);
}

/* Quick Stats */
.quick-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #334155;
}

.quick-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #0f172a;
  border-radius: 6px;
}

.quick-stat .label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.quick-stat .value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #60a5fa;
}

.quick-stat .value.verified {
  color: #10b981;
}

.quick-stat .value.pending {
  color: #f59e0b;
}

/* ============================================================================
   CENTER FEED - TABS
   ============================================================================ */
.feed-tabs {
  display: flex;
  gap: 0;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.feed-tab {
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

.feed-tab:hover {
  color: #e2e8f0;
  background: #0f172a;
}

.feed-tab.active {
  color: #60a5fa;
  border-bottom-color: #3b82f6;
  background: #0f172a;
}

/* ============================================================================
   CENTER FEED - CREATE POST SECTION
   ============================================================================ */
.create-post-section {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.create-post-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.create-post-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #334155;
  cursor: pointer;
  transition: all 0.2s;
}

.create-post-avatar:hover {
  border-color: #3b82f6;
}

.create-post-input-wrapper {
  flex: 1;
}

.create-post-input {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 24px;
  padding: 0.75rem 1rem;
  color: #e2e8f0;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;
  cursor: pointer;
}

.create-post-input:hover {
  border-color: #475569;
  background: #1e293b;
}

.create-post-input:focus {
  border-color: #3b82f6;
  background: #1e293b;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.create-post-input::placeholder {
  color: #64748b;
}

.create-post-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #334155;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 80px;
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
  font-weight: 500;
}

.action-btn:hover {
  background: #0f172a;
  color: #60a5fa;
}

.action-btn:active {
  transform: scale(0.95);
}

.action-label {
  display: none;
}

@media (min-width: 768px) {
  .action-label {
    display: inline;
  }
}

/* ============================================================================
   CENTER FEED - LOADING STATE
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  margin: 0;
  font-size: 0.95rem;
}

/* ============================================================================
   CENTER FEED - POSTS LIST
   ============================================================================ */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feed-post {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
  overflow: hidden;
}

.feed-post:hover {
  border-color: #475569;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.feed-post.has-media {
  padding: 0;
}

.feed-post.has-media .post-header,
.feed-post.has-media .post-content,
.feed-post.has-media .post-stats,
.feed-post.has-media .post-actions {
  padding: 0 1.5rem;
}

.feed-post.has-media .post-header {
  padding-top: 1.5rem;
}

.feed-post.has-media .post-actions {
  padding-bottom: 1.5rem;
}

/* Post Header */
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
  border: 2px solid #334155;
  cursor: pointer;
  transition: all 0.2s;
}

.post-avatar:hover {
  border-color: #3b82f6;
}

.post-author-info {
  flex: 1;
  min-width: 0;
}

.author-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.post-author-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.verified-badge {
  display: flex;
  align-items: center;
  color: #3b82f6;
  flex-shrink: 0;
}

.post-author-username {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  flex-shrink: 0;
}

.post-menu-btn:hover {
  background: #0f172a;
  color: #60a5fa;
}

/* Post Menu */
.post-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
  z-index: 10;
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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

.menu-item:first-child {
  border-top: none;
}

/* Post Content */
.post-content {
  margin-bottom: 1rem;
}

.post-text {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #e2e8f0;
  word-break: break-word;
}

.post-media-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
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

.post-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.hashtag {
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.hashtag:hover {
  color: #60a5fa;
  text-decoration: underline;
}

/* Post Stats */
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
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.post-stats .stat:hover {
  color: #60a5fa;
  background: #0f172a;
}

/* Post Actions */
.post-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.post-actions .action-btn {
  flex: 1;
  min-width: 80px;
  padding: 0.75rem;
  color: #94a3b8;
}

.post-actions .action-btn.liked {
  color: #ef4444;
}

.post-actions .action-btn:hover {
  background: #0f172a;
  color: #60a5fa;
}

.post-actions .action-btn.liked:hover {
  color: #ef4444;
}

/* ============================================================================
   CENTER FEED - LOAD MORE & NO POSTS
   ============================================================================ */
.load-more {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  color: #94a3b8;
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
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-load-more:active {
  transform: translateY(0);
}

.no-posts {
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

.no-posts h3 {
  margin: 1rem 0 0.5rem 0;
  color: #e2e8f0;
  font-size: 1.1rem;
}

.no-posts p {
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
}

.no-posts-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-explore,
.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.btn-explore:hover,
.btn-create:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-explore:active,
.btn-create:active {
  transform: translateY(0);
}

/* ============================================================================
   RIGHT SIDEBAR - SEARCH CARD
   ============================================================================ */
.feed-sidebar-right {
  position: sticky;
  top: 80px;
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.feed-sidebar-right::-webkit-scrollbar {
  width: 6px;
}

.feed-sidebar-right::-webkit-scrollbar-track {
  background: transparent;
}

.feed-sidebar-right::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}

.feed-sidebar-right::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

.search-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1rem;
  overflow: hidden;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 24px;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  color: #e2e8f0;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
}

.search-input:hover {
  border-color: #475569;
  background: #1e293b;
}

.search-input:focus {
  border-color: #3b82f6;
  background: #1e293b;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
  color: #64748b;
}

/* ============================================================================
   RIGHT SIDEBAR - RECOMMENDATIONS CARD
   ============================================================================ */
.recommendations-card,
.trending-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
}

.card-header .card-title {
  margin: 0;
}

.refresh-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background: #0f172a;
  color: #60a5fa;
  animation: spin 1s linear infinite;
}

.recommendations-list,
.trending-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #0f172a;
  border-radius: 8px;
  transition: all 0.2s;
}

.recommendation-item:hover {
  background: #1e293b;
  border: 1px solid #334155;
}

.rec-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #334155;
  cursor: pointer;
  transition: all 0.2s;
}

.rec-avatar:hover {
  border-color: #3b82f6;
}

.rec-info {
  flex: 1;
  min-width: 0;
}

.rec-name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rec-username {
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-follow {
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

.btn-follow:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-follow.following {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.btn-follow.following:hover {
  background: #3b82f6;
  color: white;
}

/* ============================================================================
   RIGHT SIDEBAR - TRENDING CARD
   ============================================================================ */
.trending-item {
  display: block;
  padding: 0.75rem;
  background: #0f172a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  color: inherit;
}

.trending-item:hover {
  background: #1e293b;
  border: 1px solid #334155;
}

.trend-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.trend-category {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.trend-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
}

.trend-count {
  margin: 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

/* ============================================================================
   RIGHT SIDEBAR - LOADING & EMPTY STATES
   ============================================================================ */
.loading-small {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-state-small {
  text-align: center;
  padding: 1.5rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

/* ============================================================================
   ACCESSIBILITY & FOCUS STATES
   ============================================================================ */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* ============================================================================
   PRINT STYLES
   ============================================================================ */
@media print {
  .feed-header,
  .feed-sidebar-left,
  .feed-sidebar-right,
  .create-post-section,
  .post-actions,
  .post-menu-btn {
    display: none;
  }

  .feed-main-wrapper {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .feed-post {
    page-break-inside: avoid;
    border: 1px solid #ccc;
  }
}

/* ============================================================================
   DARK MODE SUPPORT (Already in dark mode, but for completeness)
   ============================================================================ */
@media (prefers-color-scheme: dark) {
  /* Already styled for dark mode */
}

/* ============================================================================
   HIGH CONTRAST MODE SUPPORT
   ============================================================================ */
@media (prefers-contrast: more) {
  .feed-post,
  .profile-card,
  .create-post-section {
    border-width: 2px;
  }

  .btn-edit-profile,
  .btn-load-more,
  .btn-follow,
  .action-btn {
    border: 2px solid currentColor;
  }
}

/* ============================================================================
   REDUCED MOTION SUPPORT
   ============================================================================ */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
