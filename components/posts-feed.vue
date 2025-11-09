<!-- components/PostFeed.vue -->
<!-- ============================================================================
     POST FEED COMPONENT - Display posts with engagement features
     ============================================================================ -->

<template>
  <div class="post-feed">
    <!-- Feed Header -->
    <div class="feed-header">
      <h2>Feed</h2>
      <button @click="refreshFeed" class="refresh-btn" :disabled="loading">
        <Icon name="refresh-cw" size="20" />
      </button>
    </div>

    <!-- Posts List -->
    <div class="posts-list">
      <div
        v-for="post in posts"
        :key="post.id"
        class="post-card"
      >
        <!-- Post Header -->
        <div class="post-header">
          <div class="post-author">
            <img
              :src="post.avatar_url"
              :alt="post.username"
              class="author-avatar"
            />
            <div class="author-info">
              <div class="author-name">{{ post.username }}</div>
              <div class="post-time">{{ formatTime(post.published_at) }}</div>
            </div>
          </div>
          <button class="post-menu-btn" @click="togglePostMenu(post.id)">
            <Icon name="more-vertical" size="20" />
          </button>
        </div>

        <!-- Post Content -->
        <div class="post-content">
          <p class="post-text">{{ post.content }}</p>

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
            <span class="stat-count">{{ post.likes_count }}</span>
            <span class="stat-label">Likes</span>
          </div>
          <div class="stat">
            <span class="stat-count">{{ post.comments_count }}</span>
            <span class="stat-label">Comments</span>
          </div>
          <div class="stat">
            <span class="stat-count">{{ post.shares_count }}</span>
            <span class="stat-label">Shares</span>
          </div>
        </div>
        
<PostGiftDisplay :post-id="post.id" />
        <!-- Post Actions -->
        <div class="post-actions">
  <button @click="likePost(post.id)" class="action-btn" :class="{ active: post.is_liked }">
    <Icon name="heart" size="20" :fill="post.is_liked" />
    <span>Like</span>
  </button>
  <button @click="toggleComments(post.id)" class="action-btn">
    <Icon name="message-circle" size="20" />
    <span>Comment</span>
  </button>
  <button @click="toggleShareMenu(post.id)" class="action-btn">
    <Icon name="share-2" size="20" />
    <span>Share</span>
  </button>
  <!-- NEW: PewGift Button -->
  <PewGiftPicker
    :post-id="post.id"
    @gift-sent="onGiftSent"
  />
  <button @click="viewAnalytics(post.id)" class="action-btn">
    <Icon name="bar-chart-2" size="20" />
    <span>Analytics</span>
  </button>
</div>
        <div class="post-actions">
          <button
            @click="likePost(post.id)"
            class="action-btn"
            :class="{ active: post.is_liked }"
          >
            <Icon name="heart" size="20" :fill="post.is_liked" />
            <span>Like</span>
          </button>
          <button
            @click="toggleComments(post.id)"
            class="action-btn"
          >
            <Icon name="message-circle" size="20" />
            <span>Comment</span>
          </button>
          <button
            @click="toggleShareMenu(post.id)"
            class="action-btn"
          >
            <Icon name="share-2" size="20" />
            <span>Share</span>
          </button>
          <button
            @click="viewAnalytics(post.id)"
            class="action-btn"
          >
            <Icon name="bar-chart-2" size="20" />
            <span>Analytics</span>
          </button>
        </div>

        <!-- Share Menu -->
        <div
          v-if="activeShareMenu === post.id"
          class="share-menu"
        >
          <button
            @click="shareToTwitter(post.id)"
            class="share-option"
          >
            <Icon name="twitter" size="18" />
            Twitter
          </button>
          <button
            @click="shareToFacebook(post.id)"
            class="share-option"
          >
            <Icon name="facebook" size="18" />
            Facebook
          </button>
          <button
            @click="shareToWhatsApp(post.id)"
            class="share-option"
          >
            <Icon name="message-square" size="18" />
            WhatsApp
          </button>
          <button
            @click="copyShareLink(post.id)"
            class="share-option"
          >
            <Icon name="copy" size="18" />
            Copy Link
          </button>
        </div>

        <!-- Comments Section -->
        <div
          v-if="activeComments === post.id"
          class="comments-section"
        >
          <!-- Add Comment -->
          <div class="add-comment">
            <input
              v-model="commentText[post.id]"
              type="text"
              placeholder="Write a comment..."
              class="comment-input"
              @keydown.enter="submitComment(post.id)"
            />
            <button
              @click="submitComment(post.id)"
              class="comment-submit-btn"
              :disabled="!commentText[post.id]?.trim()"
            >
              <Icon name="send" size="18" />
            </button>
          </div>

          <!-- Comments List -->
          <div class="comments-list">
            <PostComment
              v-for="comment in postComments[post.id]"
              :key="comment.id"
              :comment="comment"
              @reply="replyToComment"
            />
          </div>

          <!-- Load More Comments -->
          <button
            v-if="hasMoreComments[post.id]"
            @click="loadMoreComments(post.id)"
            class="load-more-btn"
          >
            Load more comments
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading posts...</p>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && posts.length === 0" class="empty-state">
      <Icon name="inbox" size="48" />
      <h3>No posts yet</h3>
      <p>Start following people to see their posts</p>
    </div>

    <!-- Load More Button -->
    <div v-if="hasMore && !loading" class="load-more-container">
      <button @click="loadFeed" class="load-more-btn">
        Load more posts
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { usePostFeed } from '~/composables/usePostFeed'
import PostComment from '~/components/PostComment.vue'

const {
  posts,
  loading,
  hasMore,
  loadFeed,
  likePost,
  addComment,
  sharePost,
  refreshFeed
} = usePostFeed()

const activeComments = ref<string | null>(null)
const activeShareMenu = ref<string | null>(null)
const commentText = reactive<Record<string, string>>({})
const postComments = reactive<Record<string, any[]>>({})
const hasMoreComments = reactive<Record<string, boolean>>({})

/**
 * Format time
 */
const formatTime = (date: string): string => {
  const now = new Date()
  const postDate = new Date(date)
  const diff = now.getTime() - postDate.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return postDate.toLocaleDateString()
}

/**
 * Toggle comments
 */
const toggleComments = async (postId: string) => {
  if (activeComments.value === postId) {
    activeComments.value = null
  } else {
    activeComments.value = postId
    if (!postComments[postId]) {
      await loadMoreComments(postId)
    }
  }
}

/**
 * Load more comments
 */
const loadMoreComments = async (postId: string) => {
  try {
    const offset = postComments[postId]?.length || 0
    const response = await $fetch<any>(`/api/posts/${postId}/comments`, {
      query: { limit: 10, offset }
    })

    if (response.success) {
      if (!postComments[postId]) {
        postComments[postId] = []
      }
      postComments[postId].push(...response.data)
      hasMoreComments[postId] = response.data.length === 10
    }
  } catch (error) {
    console.error('Load comments error:', error)
  }
}

/**
 * Submit comment
 */
const submitComment = async (postId: string) => {
  const content = commentText[postId]?.trim()
  if (!content) return

  try {
    const comment = await addComment(postId, content)
    if (comment) {
      if (!postComments[postId]) {
        postComments[postId] = []
      }
      postComments[postId].unshift(comment)
      commentText[postId] = ''
    }
  } catch (error) {
    console.error('Submit comment error:', error)
  }
}

/**
 * Reply to comment
 */
const replyToComment = (commentId: string) => {
  console.log('Reply to comment:', commentId)
  // Implement reply functionality
}

/**
 * Toggle share menu
 */
const toggleShareMenu = (postId: string) => {
  activeShareMenu.value = activeShareMenu.value === postId ? null : postId
}

/**
 * Share to Twitter
 */
const shareToTwitter = async (postId: string) => {
  const result = await sharePost(postId, 'twitter')
  if (result) {
    window.open(result.shareUrl, '_blank')
  }
  activeShareMenu.value = null
}

/**
 * Share to Facebook
 */
const shareToFacebook = async (postId: string) => {
  const result = await sharePost(postId, 'facebook')
  if (result) {
    window.open(result.shareUrl, '_blank')
  }
  activeShareMenu.value = null
}

/**
 * Share to WhatsApp
 */
const shareToWhatsApp = async (postId: string) => {
  const result = await sharePost(postId, 'whatsapp')
  if (result) {
    window.open(result.shareUrl, '_blank')
  }
  activeShareMenu.value = null
}

/**
 * Copy share link
 */
const copyShareLink = async (postId: string) => {
  const result = await sharePost(postId, 'copy')
  if (result) {
    navigator.clipboard.writeText(result.shareUrl)
    // Show toast notification
  }
  activeShareMenu.value = null
}

/**
 * View analytics
 */
const viewAnalytics = (postId: string) => {
  navigateTo(`/posts/${postId}/analytics`)
}

// Load initial feed
onMounted(() => {
  loadFeed()
})
</script>

<style scoped>
.post-feed {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.feed-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.refresh-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #2563eb;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}

.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.author-info {
  flex: 1;
  min-width: 0;
}

.author-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}

.post-time {
  font-size: 13px;
  color: #6b7280;
}

.post-menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-menu-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.post-content {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.post-text {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
}

.post-media {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
}

.media-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  background: #f3f4f6;
  overflow: hidden;
}

.media-image,
.media-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: inline-block;
  padding: 4px 8px;
  background: #f0f7ff;
  color: #2563eb;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.post-stats {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
}

.stat-count {
  font-weight: 600;
  color: #1f2937;
}

.post-actions {
  display: flex;
  gap: 8px;
  padding: 8px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #2563eb;
}

.action-btn.active {
  color: #ef4444;
}

.share-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
}

.share-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s;
}

.share-option:hover {
  background: white;
  color: #2563eb;
}

.comments-section {
  padding: 16px;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
}

.add-comment {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.comment-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s;
}

.comment-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.comment-submit-btn {
  padding: 8px 12px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.comment-submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.comment-submit-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.load-more-btn {
  width: 100%;
  padding: 10px;
  background: #f3f4f6;
  color: #2563eb;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.load-more-btn:hover {
  background: #e5e7eb;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: #6b7280;
  text-align: center;
}

.empty-state h3 {
  margin: 12px 0 8px 0;
  color: #1f2937;
  font-size: 18px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
}

@media (max-width: 640px) {
  .post-feed {
    padding: 0;
  }

  .post-card {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .post-media {
    grid-template-columns: 1fr;
  }
}
</style>
            
