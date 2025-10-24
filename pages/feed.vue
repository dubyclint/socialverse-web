<template>
  <div class="feed-container">
    <!-- Header -->
    <Header />

    <!-- Main Feed Content -->
    <main class="feed-main">
      <div class="feed-wrapper">
        <!-- Left Sidebar (Optional - for future features) -->
        <aside class="feed-sidebar-left">
          <!-- Placeholder for future widgets -->
        </aside>

        <!-- Center Feed -->
        <section class="feed-center">
          <!-- Welcome Section -->
          <div class="welcome-section">
            <div class="welcome-header">
              <h1>Welcome back, {{ userDisplayName }}! 👋</h1>
              <p class="welcome-subtitle">Your personalized feed is ready</p>
            </div>
          </div>

          <!-- Create Post Section -->
          <div class="create-post-section">
            <CreatePost @post-created="onPostCreated" />
          </div>

          <!-- Feed Posts Section -->
          <section class="posts-section">
            <!-- Loading State -->
            <div v-if="loading && posts.length === 0" class="loading-state">
              <div class="spinner"></div>
              <p>Loading your feed...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="error-state">
              <div class="error-icon">⚠️</div>
              <p>{{ error }}</p>
              <button @click="retryLoadPosts" class="retry-btn">Retry</button>
            </div>

            <!-- Empty State -->
            <div v-else-if="posts.length === 0 && !loading" class="empty-state">
              <div class="empty-icon">📭</div>
              <h3>No posts yet</h3>
              <p>Follow users or create your first post to get started!</p>
              <NuxtLink to="/explore" class="explore-btn">Explore Users</NuxtLink>
            </div>

            <!-- Posts List -->
            <div v-else class="posts-list">
              <article 
                v-for="post in posts" 
                :key="post.id" 
                class="post-card"
                :class="{ 'post-loading': post.isLoading }"
              >
                <!-- Post Header -->
                <div class="post-header">
                  <div class="author-section">
                    <img 
                      :src="post.author_avatar || '/default-avatar.png'" 
                      :alt="post.author || 'Anonymous'"
                      class="author-avatar"
                      @error="handleImageError"
                    />
                    <div class="author-info">
                      <div class="author-name-row">
                        <span class="post-author">{{ post.author || 'Anonymous' }}</span>
                        <span v-if="post.is_verified" class="verified-badge" title="Verified">✓</span>
                      </div>
                      <span class="post-date">{{ formatDate(post.created_at) }}</span>
                    </div>
                  </div>
                  <div class="post-menu">
                    <button class="menu-btn" @click="togglePostMenu(post.id)">⋯</button>
                    <div v-if="activePostMenu === post.id" class="post-menu-dropdown">
                      <button @click="reportPost(post.id)">Report</button>
                      <button v-if="isPostOwner(post)" @click="deletePost(post.id)">Delete</button>
                    </div>
                  </div>
                </div>

                <!-- Post Content -->
                <div class="post-content">
                  <p v-html="renderPost(post.content)" class="post-text"></p>
                </div>

                <!-- Post Media -->
                <div v-if="post.media && post.media.length > 0" class="post-media">
                  <img 
                    v-for="(media, index) in post.media" 
                    :key="index"
                    :src="media.url" 
                    :alt="`Post media ${index + 1}`"
                    class="post-image"
                    @error="handleImageError"
                  />
                </div>

                <!-- Post Stats -->
                <div class="post-stats">
                  <span class="stat">
                    <Icon name="heart" size="16" />
                    {{ post.likes_count || 0 }} Likes
                  </span>
                  <span class="stat">
                    <Icon name="message-circle" size="16" />
                    {{ post.comments_count || 0 }} Comments
                  </span>
                  <span class="stat">
                    <Icon name="share-2" size="16" />
                    {{ post.shares_count || 0 }} Shares
                  </span>
                </div>

                <!-- Post Actions -->
                <div class="post-actions">
                  <button 
                    class="action-btn"
                    :class="{ 'liked': post.liked_by_user }"
                    @click="toggleLike(post.id)"
                    :disabled="post.isLiking"
                  >
                    <Icon name="heart" size="18" />
                    <span>{{ post.liked_by_user ? 'Liked' : 'Like' }}</span>
                  </button>
                  <button 
                    class="action-btn"
                    @click="navigateToPost(post.id)"
                  >
                    <Icon name="message-circle" size="18" />
                    <span>Comment</span>
                  </button>
                  <button 
                    class="action-btn"
                    @click="sharePost(post.id)"
                    :disabled="post.isSharing"
                  >
                    <Icon name="share-2" size="18" />
                    <span>Share</span>
                  </button>
                </div>
              </article>

              <!-- Load More Button -->
              <div v-if="hasMore && !loading" class="load-more">
                <button @click="loadMorePosts" class="load-more-btn">
                  Load More Posts
                </button>
              </div>

              <!-- End of Feed -->
              <div v-if="!hasMore && posts.length > 0" class="end-of-feed">
                <p>You've reached the end of your feed</p>
              </div>
            </div>
          </section>
        </section>

        <!-- Right Sidebar (Trending/Suggestions) -->
        <aside class="feed-sidebar-right">
          <!-- Trending Section -->
          <div class="trending-widget">
            <h3>Trending Now</h3>
            <div class="trending-list">
              <div 
                v-for="(trend, index) in trendingTopics" 
                :key="index"
                class="trending-item"
                @click="navigateToTrend(trend)"
              >
                <span class="trend-rank">#{{ index + 1 }}</span>
                <div class="trend-info">
                  <p class="trend-name">{{ trend.name }}</p>
                  <p class="trend-count">{{ trend.count }} posts</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Suggestions Section -->
          <div class="suggestions-widget">
            <h3>Suggested Users</h3>
            <div class="suggestions-list">
              <div 
                v-for="user in suggestedUsers" 
                :key="user.id"
                class="suggestion-item"
              >
                <img 
                  :src="user.avatar_url || '/default-avatar.png'" 
                  :alt="user.username"
                  class="suggestion-avatar"
                />
                <div class="suggestion-info">
                  <p class="suggestion-name">{{ user.username }}</p>
                  <p class="suggestion-bio">{{ user.bio || 'No bio' }}</p>
                </div>
                <button 
                  class="follow-btn"
                  @click="followUser(user.id)"
                  :disabled="user.isFollowing"
                >
                  {{ user.isFollowing ? 'Following' : 'Follow' }}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'

// Stores
const userStore = useUserStore()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

// Reactive Data
const posts = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const hasMore = ref(true)
const currentPage = ref(1)
const activePostMenu = ref<string | null>(null)
const trendingTopics = ref<any[]>([])
const suggestedUsers = ref<any[]>([])

// Computed Properties
const userDisplayName = computed(() => {
  return user.value?.user_metadata?.full_name || 
         user.value?.email?.split('@')[0] || 
         'User'
})

// Methods
const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

const renderPost = (content: string): string => {
  if (!content) return ''
  
  // Escape HTML and convert URLs to links
  let rendered = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  
  // Convert URLs to clickable links
  rendered = rendered.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  )
  
  // Convert hashtags to clickable links
  rendered = rendered.replace(
    /#(\w+)/g,
    '<a href="/search?q=%23$1" class="hashtag">#$1</a>'
  )
  
  return rendered
}

const loadPosts = async (page: number = 1) => {
  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(username, avatar_url, is_verified),
        likes_count:post_likes(count),
        comments_count:post_comments(count)
      `)
      .order('created_at', { ascending: false })
      .range((page - 1) * 10, page * 10 - 1)

    if (fetchError) throw fetchError

    if (page === 1) {
      posts.value = data || []
    } else {
      posts.value = [...posts.value, ...(data || [])]
    }

    hasMore.value = (data?.length || 0) === 10
    currentPage.value = page
  } catch (err: any) {
    error.value = err.message || 'Failed to load posts'
    console.error('Error loading posts:', err)
  } finally {
    loading.value = false
  }
}

const loadMorePosts = async () => {
  await loadPosts(currentPage.value + 1)
}

const retryLoadPosts = async () => {
  await loadPosts(1)
}

const onPostCreated = async (newPost: any) => {
  posts.value.unshift(newPost)
}

const toggleLike = async (postId: string) => {
  try {
    const post = posts.value.find(p => p.id === postId)
    if (!post) return

    post.isLiking = true

    if (post.liked_by_user) {
      // Unlike
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.value?.id)

      post.liked_by_user = false
      post.likes_count = (post.likes_count || 1) - 1
    } else {
      // Like
      await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.value?.id
        })

      post.liked_by_user = true
      post.likes_count = (post.likes_count || 0) + 1
    }
  } catch (err: any) {
    error.value = 'Failed to update like'
    console.error('Error toggling like:', err)
  } finally {
    const post = posts.value.find(p => p.id === postId)
    if (post) post.isLiking = false
  }
}

const navigateToPost = (postId: string) => {
  router.push(`/post/${postId}`)
}

const sharePost = async (postId: string) => {
  try {
    const post = posts.value.find(p => p.id === postId)
    if (!post) return

    post.isSharing = true

    const shareUrl = `${window.location.origin}/post/${postId}`
    
    if (navigator.share) {
      await navigator.share({
        title: 'Check out this post on SocialVerse',
        url: shareUrl
      })
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    }

    post.shares_count = (post.shares_count || 0) + 1
  } catch (err: any) {
    console.error('Error sharing post:', err)
  } finally {
    const post = posts.value.find(p => p.id === postId)
    if (post) post.isSharing = false
  }
}

const togglePostMenu = (postId: string) => {
  activePostMenu.value = activePostMenu.value === postId ? null : postId
}

const isPostOwner = (post: any): boolean => {
  return post.user_id === user.value?.id
}

const deletePost = async (postId: string) => {
  if (!confirm('Are you sure you want to delete this post?')) return

  try {
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.value?.id)

    if (deleteError) throw deleteError

    posts.value = posts.value.filter(p => p.id !== postId)
    activePostMenu.value = null
  } catch (err: any) {
    error.value = 'Failed to delete post'
    console.error('Error deleting post:', err)
  }
}

const reportPost = async (postId: string) => {
  const reason = prompt('Please provide a reason for reporting this post:')
  if (!reason) return

  try {
    await supabase
      .from('post_reports')
      .insert({
        post_id: postId,
        user_id: user.value?.id,
        reason
      })

    alert('Post reported successfully')
    activePostMenu.value = null
  } catch (err: any) {
    error.value = 'Failed to report post'
    console.error('Error reporting post:', err)
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/default-avatar.png'
}

const loadTrendingTopics = async () => {
  try {
    // Fetch trending hashtags/topics
    const { data } = await supabase
      .from('trending_topics')
      .select('*')
      .order('count', { ascending: false })
      .limit(5)

    trendingTopics.value = data || []
  } catch (err) {
    console.error('Error loading trending topics:', err)
  }
}

const loadSuggestedUsers = async () => {
  try {
    // Fetch suggested users
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.value?.id)
      .limit(5)

    suggestedUsers.value = (data || []).map(user => ({
      ...user,
      isFollowing: false
    }))
  } catch (err) {
    console.error('Error loading suggested users:', err)
  }
}

const navigateToTrend = (trend: any) => {
  router.push(`/search?q=${encodeURIComponent(trend.name)}`)
}

const followUser = async (userId: string) => {
  try {
    const followUser = suggestedUsers.value.find(u => u.id === userId)
    if (!followUser) return

    await supabase
      .from('follows')
      .insert({
        follower_id: user.value?.id,
        following_id: userId
      })

    followUser.isFollowing = true
  } catch (err: any) {
    console.error('Error following user:', err)
  }
}

// Lifecycle Hooks
onMounted(async () => {
  await loadPosts(1)
  await loadTrendingTopics()
  await loadSuggestedUsers()
})

onUnmounted(() => {
  activePostMenu.value = null
})

// Page Meta
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

useHead({
  title: 'Feed - SocialVerse',
  meta: [
    { name: 'description', content: 'Your personalized social feed on SocialVerse' }
  ]
})
</script>

<style scoped>
.feed-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.feed-main {
  flex: 1;
  padding: 2rem 1rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.feed-wrapper {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .feed-wrapper {
    grid-template-columns: 1fr;
  }

  .feed-sidebar-left,
  .feed-sidebar-right {
    display: none;
  }
}

/* Welcome Section */
.welcome-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.welcome-header h1 {
  font-size: 1.8rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.welcome-subtitle {
  color: #666;
  margin: 0;
  font-size: 0.95rem;
}

/* Create Post Section */
.create-post-section {
  margin-bottom: 2rem;
}

/* Posts Section */
.posts-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #e74c3c;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.retry-btn:hover {
  background: #2980b9;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #666;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
}

.explore-btn {
  padding: 0.75rem 1.5rem;
  background: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.3s;
}

.explore-btn:hover {
  background: #2980b9;
}

/* Posts List */
.posts-list {
  display: flex;
  flex-direction: column;
}

/* Post Card */
.post-card {
  border-bottom: 1px solid #eee;
  padding: 1.5rem;
  transition: background 0.2s;
}

.post-card:hover {
  background: #f9f9f9;
}

.post-card:last-child {
  border-bottom: none;
}

.post-card.post-loading {
  opacity: 0.6;
  pointer-events: none;
}

/* Post Header */
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.author-section {
  display: flex;
  gap: 0.75rem;
  flex: 1;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
}

.author-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.author-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.post-author {
  font-weight: 600;
  color: #333;
}

.verified-badge {
  color: #3498db;
  font-size: 0.9rem;
}

.post-date {
  font-size: 0.85rem;
  color: #999;
}

/* Post Menu */
.post-menu {
  position: relative;
}

.menu-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.menu-btn:hover {
  background: #f0f0f0;
}

.post-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 150px;
}

.post-menu-dropdown button {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: #333;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.post-menu-dropdown button:hover {
  background: #f5f5f5;
}

/* Post Content */
.post-content {
  margin-bottom: 1rem;
}

.post-text {
  margin: 0;
  color: #333;
  line-height: 1.5;
  word-wrap: break-word;
}

.post-text a {
  color: #3498db;
  text-decoration: none;
}

.post-text a:hover {
  text-decoration: underline;
}

.post-text .hashtag {
  color: #3498db;
}

/* Post Media */
.post-media {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.post-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  background: #eee;
}

/* Post Stats */
.post-stats {
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: #666;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Post Actions */
.post-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  flex: 1;
  padding: 0.75rem;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f0f0f0;
  color: #333;
}

.action-btn.liked {
  color: #e74c3c;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Load More */
.load-more {
  padding: 1.5rem;
  text-align: center;
  border-top: 1px solid #eee;
}

.load-more-btn {
  padding: 0.75rem 2rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.load-more-btn:hover {
  background: #2980b9;
}

/* End of Feed */
.end-of-feed {
  padding: 2rem;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}

/* Sidebars */
.feed-sidebar-left,
.feed-sidebar-right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Trending Widget */
.trending-widget,
.suggestions-widget {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.trending-widget h3,
.suggestions-widget h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
}

.trending-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.trending-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.trending-item:hover {
  background: #f5f5f5;
}

.trend-rank {
  font-weight: 700;
  color: #3498db;
  font-size: 1.1rem;
  min-width: 30px;
}

.trend-info {
  flex: 1;
}

.trend-name {
  margin: 0;
  color: #333;
  font-weight: 600;
  font-size: 0.95rem;
}

.trend-count {
  margin: 0.25rem 0 0 0;
  color: #999;
  font-size: 0.85rem;
}

/* Suggestions List */
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.suggestion-item:hover {
  background: #f5f5f5;
}

.suggestion-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
}

.suggestion-info {
  flex: 1;
}

.suggestion-name {
  margin: 0;
  color: #333;
  font-weight: 600;
  font-size: 0.9rem;
}

.suggestion-bio {
  margin: 0.25rem 0 0 0;
  color: #999;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.follow-btn {
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: background 0.3s;
  white-space: nowrap;
}

.follow-btn:hover:not(:disabled) {
  background: #2980b9;
}

.follow-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .feed-main {
    padding: 1rem;
  }

  .welcome-section {
    padding: 1.5rem;
  }

  .welcome-header h1 {
    font-size: 1.4rem;
  }

  .post-card {
    padding: 1rem;
  }

  .author-avatar {
    width: 40px;
    height: 40px;
  }

  .post-stats {
    font-size: 0.85rem;
  }

  .action-btn {
    font-size: 0.8rem;
    padding: 0.5rem;
  }
}

@media (max-width: 480px) {
  .feed-main {
    padding: 0.5rem;
  }

  .welcome-header h1 {
    font-size: 1.2rem;
  }

  .post-card {
    padding: 0.75rem;
  }

  .post-media {
    grid-template-columns: 1fr;
  }

  .post-image {
    height: 200px;
  }

  .post-stats {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .action-btn {
    font-size: 0.75rem;
    padding: 0.4rem;
  }

  .action-btn span {
    display: none;
  }
}
</style>






