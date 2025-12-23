<template>
  <div class="feed-page">
    <!-- HEADER SECTION -->
    <header class="feed-header">
      <div class="header-top">
        <!-- Left Side - Menu & Logo -->
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
            <!-- ✅ FIXED: Wrap live badge in ClientOnly -->
            <ClientOnly>
              <span v-if="isLiveStreaming" class="notification-badge live">LIVE</span>
            </ClientOnly>
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

          <NuxtLink 
            to="/notifications" 
            class="nav-icon" 
            :class="{ active: route.path === '/notifications' }"
            aria-label="Notifications"
          >
            <Icon name="bell" size="24" />
            <span class="nav-label">Notify</span>
            <!-- ✅ FIXED: Wrap notification badge in ClientOnly -->
            <ClientOnly>
              <span v-if="unreadNotifications > 0" class="notification-badge">
                {{ unreadNotifications }}
              </span>
            </ClientOnly>
          </NuxtLink>
        </nav>

        <!-- Right Side - User Avatar -->
        <!-- ✅ FIXED: Wrap entire user section in ClientOnly -->
        <ClientOnly>
          <div class="header-right">
            <div class="user-avatar-wrapper">
              <img 
                :src="userAvatar || '/default-avatar.svg'" 
                :alt="userName" 
                class="user-avatar"
                @click="goToProfile"
              />
              <span class="status-indicator" :class="userStatus"></span>
            </div>
          </div>
        </ClientOnly>
      </div>
    </header>

    <!-- MAIN CONTENT -->
    <main class="feed-main">
      <!-- Left Sidebar - User Profile -->
      <ClientOnly>
        <aside class="feed-sidebar-left">
          <div class="profile-card">
            <div class="profile-header">
              <img 
                :src="userAvatar || '/default-avatar.svg'" 
                :alt="userName" 
                class="profile-avatar"
              />
              <div class="profile-info">
                <h3 class="profile-name">{{ userName }}</h3>
                <p class="profile-username">@{{ userUsername }}</p>
              </div>
            </div>
            <div class="profile-stats">
              <div class="stat">
                <span class="stat-value">{{ userFollowers }}</span>
                <span class="stat-label">Followers</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ userFollowing }}</span>
                <span class="stat-label">Following</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ userPosts }}</span>
                <span class="stat-label">Posts</span>
              </div>
            </div>
            <button class="btn-edit-profile" @click="goToProfile">
              Edit Profile
            </button>
          </div>
        </aside>
      </ClientOnly>

      <!-- Center Feed -->
      <section class="feed-content">
        <!-- Create Post Section -->
        <ClientOnly>
          <div class="create-post-section">
            <div class="create-post-header">
              <img 
                :src="userAvatar || '/default-avatar.svg'" 
                :alt="userName" 
                class="create-post-avatar"
              />
              <input 
                type="text" 
                placeholder="What's on your mind?" 
                class="create-post-input"
                @click="goToCreatePost"
              />
            </div>
            <div class="create-post-actions">
              <button class="action-btn">
                <Icon name="image" size="18" />
                Photo
              </button>
              <button class="action-btn">
                <Icon name="video" size="18" />
                Video
              </button>
              <button class="action-btn">
                <Icon name="smile" size="18" />
                Feeling
              </button>
            </div>
          </div>
        </ClientOnly>

        <!-- Posts Feed -->
        <ClientOnly>
          <div v-if="postsLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading posts...</p>
          </div>

          <div v-else-if="posts.length > 0" class="posts-list">
            <article 
              v-for="post in posts" 
              :key="post.id" 
              class="feed-post"
            >
              <div class="post-header">
                <img 
                  :src="post.author?.avatar || '/default-avatar.svg'" 
                  :alt="post.author?.name" 
                  class="post-avatar"
                />
                <div class="post-author-info">
                  <h4 class="post-author-name">{{ post.author?.name }}</h4>
                  <p class="post-author-username">@{{ post.author?.username }}</p>
                  <span class="post-timestamp">{{ formatTime(post.createdAt) }}</span>
                </div>
              </div>

              <div class="post-content">
                <p class="post-text">{{ post.content }}</p>
                <img 
                  v-if="post.image" 
                  :src="post.image" 
                  :alt="post.content" 
                  class="post-image"
                />
              </div>

              <div class="post-stats">
                <span class="stat">{{ post.likes }} Likes</span>
                <span class="stat">{{ post.comments }} Comments</span>
                <span class="stat">{{ post.shares }} Shares</span>
              </div>

              <div class="post-actions">
                <button class="action-btn" @click="likePost(post.id)">
                  <Icon name="heart" size="18" />
                  Like
                </button>
                <button class="action-btn" @click="commentPost(post.id)">
                  <Icon name="message-circle" size="18" />
                  Comment
                </button>
                <button class="action-btn" @click="sharePost(post.id)">
                  <Icon name="share-2" size="18" />
                  Share
                </button>
              </div>
            </article>

            <!-- Load More Button -->
            <div v-if="hasMorePosts" class="load-more">
              <button @click="loadMorePosts" class="btn-load-more">
                Load More Posts
              </button>
            </div>
          </div>

          <div v-else class="no-posts">
            <Icon name="inbox" size="48" />
            <h3>No posts yet</h3>
            <p>Start following people to see their posts!</p>
            <NuxtLink to="/explore" class="btn-explore">
              Explore People
            </NuxtLink>
          </div>
        </ClientOnly>
      </section>

      <!-- Right Sidebar - Recommendations -->
      <ClientOnly>
        <aside class="feed-sidebar-right">
          <div class="recommendations-card">
            <h3 class="card-title">Suggested For You</h3>
            <div class="recommendations-list">
              <div 
                v-for="user in suggestedUsers" 
                :key="user.id" 
                class="recommendation-item"
              >
                <img 
                  :src="user.avatar || '/default-avatar.svg'" 
                  :alt="user.name" 
                  class="rec-avatar"
                />
                <div class="rec-info">
                  <h4 class="rec-name">{{ user.name }}</h4>
                  <p class="rec-username">@{{ user.username }}</p>
                </div>
                <button class="btn-follow" @click="followUser(user.id)">
                  Follow
                </button>
              </div>
            </div>
          </div>

          <div class="trending-card">
            <h3 class="card-title">Trending</h3>
            <div class="trending-list">
              <div 
                v-for="trend in trendingTopics" 
                :key="trend.id" 
                class="trending-item"
              >
                <div class="trend-info">
                  <p class="trend-category">{{ trend.category }}</p>
                  <h4 class="trend-title">{{ trend.title }}</h4>
                  <p class="trend-count">{{ trend.count }} posts</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </ClientOnly>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// ============================================================================
// COMPOSABLES & STORES
// ============================================================================
const route = useRoute()
const router = useRouter()
const { $auth } = useNuxtApp()

// ============================================================================
// REACTIVE STATE
// ============================================================================
const posts = ref([])
const postsLoading = ref(true)
const hasMorePosts = ref(true)
const currentPage = ref(1)

const suggestedUsers = ref([])
const trendingTopics = ref([])

const unreadNotifications = ref(0)
const isLiveStreaming = ref(false)

// ============================================================================
// COMPUTED PROPERTIES - USER DATA
// ============================================================================
const currentUser = computed(() => $auth.user)
const userName = computed(() => currentUser.value?.name || 'User')
const userUsername = computed(() => currentUser.value?.username || 'username')
const userAvatar = computed(() => currentUser.value?.avatar || '/default-avatar.svg')
const userStatus = computed(() => currentUser.value?.status || 'offline')
const userFollowers = computed(() => currentUser.value?.followers || 0)
const userFollowing = computed(() => currentUser.value?.following || 0)
const userPosts = computed(() => currentUser.value?.posts || 0)

// ============================================================================
// METHODS
// ============================================================================
const toggleSidebar = () => {
  console.log('[Feed] Toggle sidebar')
}

const goToProfile = () => {
  console.log('[Feed] Go to profile')
  router.push(`/profile/${userUsername.value}`)
}

const goToCreatePost = () => {
  console.log('[Feed] Go to create post')
  router.push('/posts/create')
}

const likePost = (postId: string) => {
  console.log('[Feed] Like post:', postId)
}

const commentPost = (postId: string) => {
  console.log('[Feed] Comment on post:', postId)
}

const sharePost = (postId: string) => {
  console.log('[Feed] Share post:', postId)
}

const followUser = (userId: string) => {
  console.log('[Feed] Follow user:', userId)
}

const loadMorePosts = async () => {
  console.log('[Feed] Load more posts')
  currentPage.value++
  await fetchPosts()
}

const formatTime = (date: string | Date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

// ============================================================================
// FETCH DATA
// ============================================================================
const fetchPosts = async () => {
  try {
    console.log('[Feed] Fetching posts, page:', currentPage.value)
    
    const response = await $fetch('/api/posts/feed', {
      query: {
        page: currentPage.value,
        limit: 10
      }
    })

    if (currentPage.value === 1) {
      posts.value = response.data || []
    } else {
      posts.value.push(...(response.data || []))
    }

    hasMorePosts.value = response.hasMore || false
    console.log('[Feed] Posts loaded:', posts.value.length)
  } catch (error) {
    console.error('[Feed] Error loading posts:', error)
    posts.value = []
  } finally {
    postsLoading.value = false
  }
}

const fetchSuggestedUsers = async () => {
  try {
    console.log('[Feed] Fetching suggested users')
    
    const response = await $fetch('/api/users/suggested', {
      query: { limit: 5 }
    })

    suggestedUsers.value = response.data || []
    console.log('[Feed] Suggested users loaded:', suggestedUsers.value.length)
  } catch (error) {
    console.error('[Feed] Error loading suggested users:', error)
    suggestedUsers.value = []
  }
}

const fetchTrendingTopics = async () => {
  try {
    console.log('[Feed] Fetching trending topics')
    
    const response = await $fetch('/api/trending', {
      query: { limit: 5 }
    })

    trendingTopics.value = response.data || []
    console.log('[Feed] Trending topics loaded:', trendingTopics.value.length)
  } catch (error) {
    console.error('[Feed] Error loading trending topics:', error)
    trendingTopics.value = []
  }
}

const fetchNotifications = async () => {
  try {
    console.log('[Feed] Fetching notifications')
    
    const response = await $fetch('/api/user/notifications', {
      query: { limit: 1 }
    })

    unreadNotifications.value = response.total || 0
    console.log('[Feed] Unread notifications:', unreadNotifications.value)
  } catch (error) {
    console.error('[Feed] Error loading notifications:', error)
    unreadNotifications.value = 0
  }
}

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================
onMounted(async () => {
  console.log('[Feed] Component mounted')
  
  // Only load data on client-side
  if (process.client) {
    console.log('[Feed] Loading data on client-side')
    
    // Load all data in parallel
    await Promise.all([
      fetchPosts(),
      fetchSuggestedUsers(),
      fetchTrendingTopics(),
      fetchNotifications()
    ])

    console.log('[Feed] All data loaded')
  }
})

// ============================================================================
// ROUTE GUARD
// ============================================================================
onBeforeMount(() => {
  console.log('[Feed] Before mount - checking auth')
  
  if (!currentUser.value) {
    console.warn('[Feed] User not authenticated, redirecting to signin')
    router.push('/auth/signin')
  }
})
</script>

<style scoped lang="scss">
.feed-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #0f172a;
  color: #e2e8f0;
}

.feed-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  padding: 1rem 2rem;

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;

    .menu-btn {
      background: none;
      border: none;
      color: #e2e8f0;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: background-color 0.2s;

      &:hover {
        background-color: rgba(148, 163, 184, 0.1);
      }
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: #e2e8f0;
      font-weight: 600;

      .logo-img {
        width: 32px;
        height: 32px;
      }

      .logo-text {
        font-size: 1.25rem;
      }
    }
  }

  .header-center {
    display: flex;
    gap: 2rem;
    flex: 1;
    justify-content: center;

    .nav-icon {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      text-decoration: none;
      color: #94a3b8;
      transition: color 0.2s;
      position: relative;

      &:hover,
      &.active {
        color: #667eea;
      }

      .nav-label {
        font-size: 0.75rem;
      }

      .notification-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background-color: #ef4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;

        &.live {
          background-color: #f97316;
          animation: pulse 2s infinite;
        }
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;

    .user-avatar-wrapper {
      position: relative;
      cursor: pointer;

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid #667eea;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.05);
        }
      }

      .status-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid #0f172a;

        &.online {
          background-color: #22c55e;
        }

        &.offline {
          background-color: #94a3b8;
        }

        &.away {
          background-color: #f59e0b;
        }
      }
    }
  }
}

.feed-main {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.feed-sidebar-left,
.feed-sidebar-right {
  @media (max-width: 1024px) {
    display: none;
  }
}

.profile-card,
.recommendations-card,
.trending-card {
  background-color: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  backdrop-filter: blur(10px);

  .card-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #e2e8f0;
  }
}

.profile-card {
  .profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;

    .profile-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid #667eea;
    }

    .profile-info {
      text-align: center;

      .profile-name {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0;
      }

      .profile-username {
        color: #94a3b8;
        margin: 0.25rem 0 0 0;
      }
    }
  }

  .profile-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);

    .stat {
      text-align: center;

      .stat-value {
        display: block;
        font-size: 1.25rem;
        font-weight: 600;
        color: #667eea;
      }

      .stat-label {
        display: block;
        font-size: 0.875rem;
        color: #94a3b8;
      }
    }
  }

  .btn-edit-profile {
    width: 100%;
    padding: 0.75rem;
    background-color: #667eea;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #5568d3;
    }
  }
}

.feed-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.create-post-section {
  background-color: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  backdrop-filter: blur(10px);

  .create-post-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;

    .create-post-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid #667eea;
    }

    .create-post-input {
      flex: 1;
      background-color: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 2rem;
      padding: 0.75rem 1rem;
      color: #e2e8f0;
      font-size: 1rem;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: #667eea;
      }

      &::placeholder {
        color: #64748b;
      }
    }
  }

  .create-post-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      transition: color 0.2s, background-color 0.2s;

      &:hover {
        color: #667eea;
        background-color: rgba(102, 126, 234, 0.1);
      }
    }
  }
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feed-post {
  background-color: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  transition: border-color 0.2s;

  &:hover {
    border-color: rgba(102, 126, 234, 0.3);
  }

  .post-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;

    .post-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid #667eea;
    }

    .post-author-info {
      flex: 1;

      .post-author-name {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #e2e8f0;
      }

      .post-author-username {
        margin: 0.25rem 0 0 0;
        color: #94a3b8;
        font-size: 0.875rem;
      }

      .post-timestamp {
        display: block;
        color: #64748b;
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }
    }
  }

  .post-content {
    margin-bottom: 1rem;

    .post-text {
      margin: 0 0 1rem 0;
      line-height: 1.5;
      color: #e2e8f0;
    }

    .post-image {
      width: 100%;
      border-radius: 0.5rem;
      max-height: 400px;
      object-fit: cover;
    }
  }

  .post-stats {
    display: flex;
    gap: 1.5rem;
    padding: 1rem 0;
    border-top: 1px solid rgba(148, 163, 184, 0.1);
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #94a3b8;

    .stat {
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: #667eea;
      }
    }
  }

  .post-actions {
    display: flex;
    gap: 1rem;

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: color 0.2s, background-color 0.2s;

      &:hover {
        color: #667eea;
        background-color: rgba(102, 126, 234, 0.1);
      }
    }
  }
}

.no-posts {
  text-align: center;
  padding: 3rem 1.5rem;
  background-color: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1rem;
  backdrop-filter: blur(10px);

  h3 {
    margin: 1rem 0 0.5rem 0;
    font-size: 1.25rem;
    color: #e2e8f0;
  }

  p {
    margin: 0 0 1.5rem 0;
    color: #94a3b8;
  }

  .btn-explore {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #667eea;
    color: white;
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: background-color 0.2s;

    &:hover {
      background-color: #5568d3;
    }
  }
}

.loading-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background-color: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1rem;
  backdrop-filter: blur(10px);

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(102, 126, 234, 0.2);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  p {
    color: #94a3b8;
  }
}

.load-more {
  text-align: center;
  padding: 1.5rem;

  .btn-load-more {
    padding: 0.75rem 1.5rem;
    background-color: #667eea;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #5568d3;
    }
  }
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
  border-radius: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(102, 126, 234, 0.1);
  }

  .rec-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #667eea;
  }

  .rec-info {
    flex: 1;

    .rec-name {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #e2e8f0;
    }

    .rec-username {
      margin: 0.25rem 0 0 0;
      font-size: 0.75rem;
      color: #94a3b8;
    }
  }

  .btn-follow {
    padding: 0.5rem 1rem;
    background-color: #667eea;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #5568d3;
    }
  }
}

.trending-item {
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(102, 126, 234, 0.1);
  }

  .trend-info {
    .trend-category {
      margin: 0;
      font-size: 0.75rem;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .trend-title {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #e2e8f0;
    }

    .trend-count {
      margin: 0.25rem 0 0 0;
      font-size: 0.75rem;
      color: #64748b;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
