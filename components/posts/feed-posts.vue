<!-- components/posts/feed-posts.vue -->
<!-- ============================================================================
     MERGED POST FEED COMPONENT - Display posts with full engagement features
     Combines feed-posts.vue and posts-feed.vue functionality
     ============================================================================ -->

<template>
  <div class="feed-posts">
    <!-- Feed Header with Refresh -->
    <div class="feed-header">
      <h2>Latest Posts</h2>
      <button @click="refreshFeed" class="refresh-btn" :disabled="loading">
        <Icon name="refresh-cw" size="20" />
      </button>
    </div>

    <!-- Create Post Component -->
    <create-post @post-created="onPostCreated" />

    <!-- Loading State -->
    <div v-if="loading && posts.length === 0" class="loading">
      Loading posts...
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <!-- Posts List -->
    <ul v-else class="posts-list">
      <li v-for="post in posts" :key="post.id" class="post-item">
        <!-- Post Header -->
        <div class="post-header">
          <div class="post-author">
            <img 
              :src="post.author_avatar || post.avatar_url || '/default-avatar.png'" 
              :alt="post.author || post.username || 'Anonymous'"
              class="author-avatar" 
            />
            <div class="author-info">
              <div class="author-name">
                {{ post.author || post.username || 'Anonymous' }}
                <span v-if="post.is_verified || post.verified" class="verified-badge">✓</span>
              </div>
              <div class="post-time">{{ formatTime(post.created_at || post.published_at) }}</div>
            </div>
          </div>
          <button class="post-menu-btn" @click="togglePostMenu(post.id)">
            <Icon name="more-vertical" size="20" />
          </button>
        </div>

        <!-- Post Content -->
        <div class="post-content">
          <div v-html="renderPost(post.content)" class="post-text"></div>

          <!-- Post Media -->
          <div v-if="post.media_urls && post.media_urls.length > 0" class="post-media">
            <div
              v-for="(media, index) in post.media_urls"
              :key="index"
              class="media-item"
            >
              <img 
                v-if="typeof media === 'string'"
                :src="media" 
                :alt="`Post media ${index + 1}`"
                class="media-image"
              />
              <img 
                v-else-if="media.type === 'image'"
                :src="media.url"
                :alt="media.alt_text"
                class="media-image"
              />
              <video
                v-else-if="media.type === 'video'"
                :src="media.url"
                class="media-video"
                controls
              ></video>
            </div>
          </div>

          <!-- Post Tags -->
          <div v-if="post.tags && post.tags.length > 0" class="post-tags">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="tag"
            >
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- Post Stats -->
        <div class="post-stats">
          <div class="stat">
            <span class="stat-count">{{ formatCount(post.likes_count || 0) }}</span>
            <span class="stat-label">Likes</span>
          </div>
          <div class="stat">
            <span class="stat-count">{{ formatCount(post.comments_count || 0) }}</span>
            <span class="stat-label">Comments</span>
          </div>
          <div class="stat">
            <span class="stat-count">{{ formatCount(post.shares_count || 0) }}</span>
            <span class="stat-label">Shares</span>
          </div>
        </div>

        <!-- Post Gift Display -->
        <post-gift-display :post-id="post.id" />

        <!-- Post Actions -->
        <div class="interaction-bar">
          <!-- Like Button -->
          <button 
            @click="toggleLike(post)"
            :class="['interaction-btn', 'like-btn', { 'liked': post.user_liked }]"
            :disabled="post.liking"
          >
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span class="count">{{ formatCount(post.likes_count || 0) }}</span>
          </button>

          <!-- Comment Button -->
          <button 
            @click="toggleComments(post)"
            class="interaction-btn comment-btn"
          >
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M21,6H3A1,1 0 0,0 2,7V17A1,1 0 0,0 3,18H8.5L12,21.5L15.5,18H21A1,1 0 0,0 22,17V7A1,1 0 0,0 21,6M13,14H11V12H13V14M13,10H11V8H13V10Z"/>
            </svg>
            <span class="count">{{ formatCount(post.comments_count || 0) }}</span>
          </button>

          <!-- Share Button -->
          <button 
            @click="sharePost(post)"
            class="interaction-btn share-btn"
          >
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19C20.92,17.39 19.61,16.08 18,16.08Z"/>
            </svg>
            <span class="count">{{ formatCount(post.shares_count || 0) }}</span>
          </button>
        </div>

        <!-- Comments Section -->
        <div v-if="post.showComments" class="comments-section">
          <posts-comment 
            v-for="comment in post.comments"
            :key="comment.id"
            :comment="comment"
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePostFeed } from '~/composables/usePostFeed'
import createpost from '@/components/posts/create-post.vue'
import postgiftdisplay from '@/components/gift-summary.vue'
import postscomment from '@/components/posts-comment.vue'

const posts = ref([])
const loading = ref(false)
const error = ref(null)

const { fetchFeed, fetchTrending, fetchSuggestions } = usePostFeed()

onMounted(async () => {
  await loadFeed()
})

const loadFeed = async () => {
  loading.value = true
  try {
    const data = await fetchFeed()
    posts.value = data.map(post => ({
      ...post,
      user_liked: false,
      liking: false,
      showComments: false,
      comments: []
    }))
  } catch (err) {
    error.value = err.message || 'Failed to load posts'
  } finally {
    loading.value = false
  }
}

const refreshFeed = async () => {
  await loadFeed()
}

const onPostCreated = (newPost) => {
  posts.value.unshift(newPost)
}

const toggleLike = async (post) => {
  post.liking = true
  try {
    post.user_liked = !post.user_liked
    post.likes_count = post.user_liked ? (post.likes_count || 0) + 1 : (post.likes_count || 0) - 1
  } finally {
    post.liking = false
  }
}

const toggleComments = (post) => {
  post.showComments = !post.showComments
}

const sharePost = (post) => {
  if (navigator.share) {
    navigator.share({
      title: 'Check out this post',
      text: post.content,
      url: window.location.href
    })
  }
}

const togglePostMenu = (postId) => {
  console.log('Post menu toggled for:', postId)
}

const formatTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString()
}

const formatCount = (count) => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
  return count.toString()
}

const renderPost = (content) => {
  if (!content) return ''
  // Basic HTML sanitization - render markdown-like content
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}
</script>

<style scoped>
.feed-posts {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 1rem;
}

.feed-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading,
.error {
  padding: 2rem;
  text-align: center;
  font-size: 1rem;
}

.error {
  color: #d32f2f;
  background-color: #ffebee;
  border-radius: 4px;
}

.posts-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.post-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
  background: white;
  transition: box-shadow 0.2s;
}

.post-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.post-author {
  display: flex;
  gap: 0.75rem;
  flex: 1;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.author-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.author-name {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.verified-badge {
  color: #1976d2;
  font-size: 0.875rem;
}

.post-time {
  font-size: 0.875rem;
  color: #666;
}

.post-menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.post-menu-btn:hover {
  background-color: #f0f0f0;
}

.post-content {
  padding: 1rem;
}

.post-text {
  margin: 0 0 1rem 0;
  line-height: 1.5;
  word-break: break-word;
}

.post-media {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.media-item {
  width: 100%;
  height: 300px;
  overflow: hidden;
  border-radius: 8px;
}

.media-image,
.media-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tag {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tag:hover {
  background-color: #bbdefb;
}

.post-stats {
  display: flex;
  justify-content: space-around;
  padding: 0.75rem 1rem;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.875rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-count {
  font-weight: 600;
}

.stat-label {
  color: #666;
}

.interaction-bar {
  display: flex;
  justify-content: space-around;
  padding: 0.75rem 1rem;
  gap: 0.5rem;
}

.interaction-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  color: #666;
  font-size: 0.875rem;
}

.interaction-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.interaction-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.interaction-btn.liked {
  color: #d32f2f;
}

.icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.count {
  font-size: 0.875rem;
}

.comments-section {
  padding: 1rem;
  background-color: #fafafa;
  border-top: 1px solid #f0f0f0;
}
</style>
