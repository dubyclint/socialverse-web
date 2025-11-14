<!-- components/posts/feed-posts.vue -->
<!-- ============================================================================
     POSTS FEED COMPONENT - Display posts with full engagement features
     ============================================================================ -->

<template>
  <div class="feed-posts">
    <!-- Feed Header with Controls -->
    <div class="feed-header">
      <div class="header-content">
        <h2>Feed</h2>
        <div class="filter-tabs">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            @click="setFilter({ type: tab.value })"
            class="filter-tab"
            :class="{ active: filter.type === tab.value }"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
      <button 
        @click="refreshFeed" 
        class="refresh-btn" 
        :disabled="refreshing"
        title="Refresh feed"
      >
        <span v-if="refreshing" class="spinner">⏳</span>
        <span v-else>🔄</span>
      </button>
    </div>

    <!-- Create Post Component -->
    <create-post @post-created="onPostCreated" />

    <!-- Error State -->
    <div v-if="error" class="error-banner">
      <span>{{ error }}</span>
      <button @click="clearError" class="btn-close">✕</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && posts.length === 0" class="loading-state">
      <div class="spinner-large">⏳</div>
      <p>Loading posts...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty" class="empty-state">
      <span class="empty-icon">📭</span>
      <p>No posts yet. Start following people to see their posts!</p>
    </div>

    <!-- Posts List -->
    <ul v-else class="posts-list">
      <li v-for="post in posts" :key="post.id" class="post-item">
        <!-- Post Header -->
        <div class="post-header">
          <div class="post-author">
            <img 
              :src="post.avatar_url || '/default-avatar.png'" 
              :alt="post.username"
              class="author-avatar" 
            />
            <div class="author-info">
              <div class="author-name">
                {{ post.username }}
                <span v-if="post.is_verified" class="verified-badge" title="Verified">✓</span>
              </div>
              <div class="post-time">{{ formatTime(post.published_at) }}</div>
            </div>
          </div>
          <div class="post-actions">
            <button 
              v-if="isOwnPost(post)"
              @click="togglePostMenu(post.id)" 
              class="post-menu-btn"
              title="Post options"
            >
              ⋮
            </button>
            <div v-if="activePostMenu === post.id" class="post-menu">
              <button @click="editPost(post)" class="menu-item">✏️ Edit</button>
              <button @click="deletePost(post.id)" class="menu-item delete">🗑️ Delete</button>
            </div>
          </div>
        </div>

        <!-- Post Content -->
        <div class="post-content">
          <div class="post-text" v-html="renderPost(post.content)"></div>

          <!-- Post Media -->
          <div v-if="post.media && post.media.length > 0" class="post-media">
            <div
              v-for="(media, index) in post.media"
              :key="index"
              class="media-item"
            >
              <img 
                v-if="media.type === 'image'"
                :src="media.url"
                :alt="media.name || `Post media ${index + 1}`"
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
            <a
              v-for="tag in post.tags"
              :key="tag"
              href="#"
              @click.prevent="searchByTag(tag)"
              class="tag"
            >
              #{{ tag }}
            </a>
          </div>
        </div>

        <!-- Post Stats -->
        <div class="post-stats">
          <div class="stat" @click="toggleLikesModal(post.id)">
            <span class="stat-count">{{ formatCount(post.likes_count) }}</span>
            <span class="stat-label">Likes</span>
          </div>
          <div class="stat">
            <span class="stat-count">{{ formatCount(post.comments_count) }}</span>
            <span class="stat-label">Comments</span>
          </div>
          <div class="stat">
            <span class="stat-count">{{ formatCount(post.shares_count) }}</span>
            <span class="stat-label">Shares</span>
          </div>
          <div v-if="post.gifts_count" class="stat">
            <span class="stat-count">{{ formatCount(post.gifts_count) }}</span>
            <span class="stat-label">Gifts</span>
          </div>
        </div>

        <!-- Post Interaction Bar -->
        <div class="interaction-bar">
          <!-- Like Button -->
          <button 
            @click="toggleLike(post)"
            :class="['interaction-btn', 'like-btn', { 'liked': post.is_liked }]"
            :disabled="post.liking"
            title="Like post"
          >
            <span class="icon">{{ post.is_liked ? '❤️' : '🤍' }}</span>
            <span class="label">Like</span>
          </button>

          <!-- Comment Button -->
          <button 
            @click="toggleComments(post)"
            class="interaction-btn comment-btn"
            title="Comment on post"
          >
            <span class="icon">💬</span>
            <span class="label">Comment</span>
          </button>

          <!-- Share Button -->
          <button 
            @click="toggleShareMenu(post.id)"
            class="interaction-btn share-btn"
            title="Share post"
          >
            <span class="icon">📤</span>
            <span class="label">Share</span>
          </button>

          <!-- Bookmark Button -->
          <button 
            @click="toggleBookmark(post)"
            :class="['interaction-btn', 'bookmark-btn', { 'bookmarked': post.is_bookmarked }]"
            title="Bookmark post"
          >
            <span class="icon">{{ post.is_bookmarked ? '🔖' : '🔗' }}</span>
            <span class="label">Save</span>
          </button>

          <!-- Gift Button -->
          <pew-gift-picker 
            :post-id="post.id"
            @gift-sent="onGiftSent"
          />
        </div>

        <!-- Share Menu -->
        <div v-if="activeShareMenu === post.id" class="share-menu">
          <button @click="sharePost(post, 'twitter')" class="share-option">
            𝕏 Twitter
          </button>
          <button @click="sharePost(post, 'facebook')" class="share-option">
            f Facebook
          </button>
          <button @click="sharePost(post, 'linkedin')" class="share-option">
            in LinkedIn
          </button>
          <button @click="sharePost(post, 'copy')" class="share-option">
            🔗 Copy Link
          </button>
        </div>

        <!-- Comments Section -->
        <div v-if="post.showComments" class="comments-section">
          <!-- Comment Input -->
          <div class="comment-input-wrapper">
            <input 
              v-model="commentText[post.id]"
              type="text"
              placeholder="Write a comment..."
              class="comment-input"
              @keydown.enter="addComment(post)"
            />
            <button 
              @click="addComment(post)"
              class="btn-comment"
              :disabled="!commentText[post.id]?.trim()"
            >
              Send
            </button>
          </div>

          <!-- Comments List -->
          <div v-if="post.comments && post.comments.length > 0" class="comments-list">
            <div v-for="comment in post.comments" :key="comment.id" class="comment-item">
              <img 
                :src="comment.avatar_url || '/default-avatar.png'"
                :alt="comment.username"
                class="comment-avatar"
              />
              <div class="comment-content">
                <div class="comment-header">
                  <strong>{{ comment.username }}</strong>
                  <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
                </div>
                <p class="comment-text">{{ comment.content }}</p>
              </div>
            </div>
          </div>
          <div v-else class="no-comments">
            No comments yet. Be the first to comment!
          </div>
        </div>
      </li>
    </ul>

    <!-- Load More Button -->
    <div v-if="hasMore && !loading" class="load-more">
      <button @click="loadMore" class="btn-load-more">
        Load More Posts
      </button>
    </div>

    <!-- Loading More -->
    <div v-if="loading && posts.length > 0" class="loading-more">
      <span class="spinner-small">⏳</span>
      <p>Loading more posts...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePostsFeed } from '~/composables/use-posts-feed'
import CreatePost from '@/components/posts/create-post.vue'
import PewGiftPicker from '@/components/pew-gift-picker.vue'

// Composables
const {
  posts,
  loading,
  refreshing,
  hasMore,
  error,
  filter,
  isEmpty,
  loadFeed,
  refreshFeed,
  likePost,
  bookmarkPost,
  addComment,
  deletePost,
  sharePost,
  setFilter,
  clearError,
  loadComments
} = usePostsFeed()

// Local state
const activePostMenu = ref<string | null>(null)
const activeShareMenu = ref<string | null>(null)
const commentText = ref<Record<string, string>>({})

// Filter tabs
const filterTabs = [
  { label: 'All', value: 'all' },
  { label: 'Following', value: 'following' },
  { label: 'Trending', value: 'trending' }
]

// Computed
const isEmpty = computed(() => posts.value.length === 0 && !loading.value)

// Methods
const formatTime = (date: string): string => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return d.toLocaleDateString()
}

const formatCount = (count: number): string => {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
  return count.toString()
}

const renderPost = (content: string): string => {
  if (!content) return ''
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/#(\w+)/g, '<a href="#" class="hashtag">#$1</a>')
}

const isOwnPost = (post: any): boolean => {
  // Check if post belongs to current user
  return false // Implement with actual user check
}

const toggleLike = async (post: any): Promise<void> => {
  await likePost(post.id)
}

const toggleBookmark = async (post: any): Promise<void> => {
  await bookmarkPost(post.id)
}

const toggleComments = async (post: any): Promise<void> => {
  post.showComments = !post.showComments
  if (post.showComments && (!post.comments || post.comments.length === 0)) {
    await loadComments(post.id)
  }
}

const togglePostMenu = (postId: string): void => {
  activePostMenu.value = activePostMenu.value === postId ? null : postId
}

const toggleShareMenu = (postId: string): void => {
  activeShareMenu.value = activeShareMenu.value === postId ? null : postId
}

const toggleLikesModal = (postId: string): void => {
  // Implement likes modal
  console.log('Show likes for post:', postId)
}

const addComment = async (post: any): Promise<void> => {
  const content = commentText.value[post.id]?.trim()
  if (!content) return

  const comment = await addComment(post.id, content)
  if (comment) {
    commentText.value[post.id] = ''
  }
}

const editPost = (post: any): void => {
  console.log('Edit post:', post.id)
  activePostMenu.value = null
}

const deletePostHandler = async (postId: string): Promise<void> => {
  if (confirm('Are you sure you want to delete this post?')) {
    await deletePost(postId)
    activePostMenu.value = null
  }
}

const searchByTag = (tag: string): void => {
  console.log('Search by tag:', tag)
}

const onPostCreated = (newPost: any): void => {
  posts.value.unshift(newPost)
}

const onGiftSent = (success: boolean): void => {
  if (success) {
    console.log('Gift sent successfully')
  }
}

const loadMore = async (): Promise<void> => {
  await loadFeed()
}

// Lifecycle
onMounted(async () => {
  await loadFeed()
})
</script>

<style scoped>
.feed-posts {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: white;
}

/* Header */
.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  flex: 1;
}

.feed-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 6px 12px;
  background: #f0f0f0;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s;
}

.filter-tab:hover {
  background: #e0e0e0;
}

.filter-tab.active {
  background: #667eea;
  color: white;
}

.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  font-size: 20px;
  border-radius: 50%;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  background: #f0f0f0;
  transform: rotate(180deg);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error Banner */
.error-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  margin: 1rem;
  font-size: 14px;
  border: 1px solid #fcc;
}

.btn-close {
  background: none;
  border: none;
  color: #c33;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #999;
  text-align: center;
}

.spinner-large {
  font-size: 48px;
  margin-bottom: 1rem;
  animation: spin 1s linear infinite;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 1rem;
}

/* Posts List */
.posts-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.post-item {
  border-bottom: 1px solid #e0e0e0;
  background: white;
  transition: background 0.2s;
}

.post-item:hover {
  background: #fafafa;
}

/* Post Header */
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.post-author {
  display: flex;
  gap: 12px;
  flex: 1;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.author-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.author-name {
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1f2937;
}

.verified-badge {
  color: #2563eb;
  font-size: 14px;
}

.post-time {
  font-size: 13px;
  color: #999;
}

.post-actions {
  position: relative;
}

.post-menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  font-size: 18px;
  border-radius: 50%;
  transition: background 0.2s;
}

.post-menu-btn:hover {
  background: #f0f0f0;
}

.post-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 150px;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f0f0f0;
}

.menu-item.delete {
  color: #ef4444;
}

/* Post Content */
.post-content {
  padding: 1rem;
}

.post-text {
  margin: 0 0 1rem 0;
  line-height: 1.6;
  word-break: break-word;
  color: #1f2937;
}

.post-media {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.media-item {
  width: 100%;
  height: 300px;
  overflow: hidden;
  border-radius: 8px;
  background: #f0f0f0;
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
  gap: 8px;
  margin-top: 1rem;
}

.tag {
  background: #e0f2fe;
  color: #2563eb;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  text-decoration: none;
  transition: all 0.2s;
}

.tag:hover {
  background: #bfdbfe;
}

/* Post Stats */
.post-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 1rem;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: color 0.2s;
}

.stat:hover {
  color: #667eea;
}

.stat-count {
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  color: #999;
  font-size: 12px;
}

/* Interaction Bar */
.interaction-bar {
  display: flex;
  justify-content: space-around;
  padding: 8px 1rem;
  gap: 8px;
}

.interaction-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
  color: #666;
  font-size: 13px;
  font-weight: 600;
}

.interaction-btn:hover:not(:disabled) {
  background: #f0f0f0;
  color: #667eea;
}

.interaction-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.interaction-btn.liked {
  color: #ef4444;
}

.interaction-btn.bookmarked {
  color: #667eea;
}

.icon {
  font-size: 18px;
}

.label {
  font-size: 12px;
}

/* Share Menu */
.share-menu {
  position: absolute;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 150px;
}

.share-option {
  display: block;
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  transition: background 0.2s;
}

.share-option:hover {
  background: #f0f0f0;
}

/* Comments Section */
.comments-section {
  padding: 1rem;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.comment-input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
}

.comment-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.comment-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-comment {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-comment:hover:not(:disabled) {
  background: #764ba2;
}

.btn-comment:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-header strong {
  font-size: 13px;
  color: #1f2937;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.no-comments {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 1rem;
}

/* Load More */
.load-more {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}

.btn-load-more {
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-load-more:hover {
  background: #764ba2;
  transform: translateY(-2px);
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2rem 1rem;
  color: #999;
  font-size: 14px;
}

.spinner-small {
  display: inline-block;
  animation: spin 1s linear infinite;
}

/* Responsive */
@media (max-width: 640px) {
  .feed-posts {
    max-width: 100%;
  }

  .filter-tabs {
    overflow-x: auto;
  }

  .post-media {
    grid-template-columns: 1fr;
  }

  .interaction-bar {
    padding: 8px 0.5rem;
  }

  .label {
    display: none;
  }
}
</style>
