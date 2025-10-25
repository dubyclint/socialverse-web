<template>
  <div class="feed-container">
    <!-- Header Component (Imported) -->
    <Header />

    <!-- Main Feed Body -->
    <main class="feed-body">
      <div class="feed-wrapper">
        <!-- Feed Posts Section -->
        <section class="posts-feed">
          <!-- Create Post Section -->
          <CreatePost @post-created="onPostCreated" />

          <!-- Posts List -->
          <div v-if="loading && posts.length === 0" class="loading-state">
            <div class="spinner"></div>
            <p>Loading posts...</p>
          </div>

          <div v-else-if="error" class="error-state">
            <p>{{ error }}</p>
            <button @click="retryLoadPosts" class="retry-btn">Retry</button>
          </div>

          <div v-else class="posts-container">
            <!-- Posts List -->
            <article 
              v-for="post in posts" 
              :key="post.id" 
              class="post-item"
              :class="[post.type, { 'sponsored': post.sponsored, 'ad': post.isAd }]"
            >
              <!-- Post Header -->
              <header class="post-header">
                <div class="author-info">
                  <img 
                    :src="post.author_avatar || '/default-avatar.png'" 
                    :alt="post.author"
                    class="author-avatar"
                  />
                  <div class="author-details">
                    <h4 class="author-name">
                      {{ post.author }}
                      <Icon v-if="post.verified" name="check-circle" size="16" class="verified-badge" />
                    </h4>
                    <p class="post-timestamp">{{ formatDate(post.created_at) }}</p>
                  </div>
                </div>

                <div class="post-badges">
                  <span v-if="post.sponsored" class="badge sponsored-badge">
                    <Icon name="dollar-sign" size="14" />
                    Sponsored
                  </span>
                  <span v-if="post.isAd" class="badge ad-badge">
                    <Icon name="megaphone" size="14" />
                    Ad
                  </span>
                  <span v-if="post.pinned" class="badge pinned-badge">
                    <Icon name="pin" size="14" />
                    Pinned
                  </span>
                </div>

                <button class="more-options-btn" @click="togglePostOptions(post.id)">
                  <Icon name="more-horizontal" size="20" />
                </button>
              </header>

              <!-- Post Content -->
              <div class="post-content">
                <p class="post-text">{{ post.content }}</p>
                
                <!-- Post Media -->
                <div v-if="post.media_urls && post.media_urls.length > 0" class="post-media">
                  <img 
                    v-for="(url, index) in post.media_urls" 
                    :key="index"
                    :src="url" 
                    :alt="`Post media ${index + 1}`"
                    class="post-image"
                    @click="openMediaViewer(url)"
                  />
                </div>
              </div>

              <!-- Engagement Stats -->
              <div class="engagement-stats">
                <span class="stat">
                  <Icon name="heart" size="14" />
                  {{ formatCount(post.likes_count || 0) }} likes
                </span>
                <span class="stat">
                  <Icon name="message-circle" size="14" />
                  {{ formatCount(post.comments_count || 0) }} comments
                </span>
                <span class="stat">
                  <Icon name="share-2" size="14" />
                  {{ formatCount(post.shares_count || 0) }} shares
                </span>
                <span class="stat">
                  <Icon name="gift" size="14" />
                  {{ formatCount(post.pewgifts_count || 0) }} gifts
                </span>
              </div>

              <!-- Interaction Bar -->
              <div class="interaction-bar">
                <!-- Like Button -->
                <button 
                  @click="toggleLike(post)"
                  :class="['interaction-btn', 'like-btn', { 'active': post.user_liked }]"
                  :disabled="post.liking"
                  :title="`${post.user_liked ? 'Unlike' : 'Like'} this post`"
                >
                  <Icon :name="post.user_liked ? 'heart' : 'heart'" size="20" />
                  <span>{{ post.user_liked ? 'Liked' : 'Like' }}</span>
                </button>

                <!-- Comment Button -->
                <button 
                  @click="toggleComments(post)"
                  class="interaction-btn comment-btn"
                  title="Comment on this post"
                >
                  <Icon name="message-circle" size="20" />
                  <span>Comment</span>
                </button>

                <!-- Share Button -->
                <button 
                  @click="sharePost(post)"
                  class="interaction-btn share-btn"
                  title="Share this post"
                >
                  <Icon name="share-2" size="20" />
                  <span>Share</span>
                </button>

                <!-- PewGift Button (Interactive Component) -->
                <button 
                  @click="openPewGiftModal(post)"
                  class="interaction-btn pewgift-btn"
                  :class="{ 'has-gifts': post.pewgifts_count > 0 }"
                  title="Send a PewGift to support this post"
                >
                  <Icon name="gift" size="20" />
                  <span>PewGift</span>
                </button>
              </div>

              <!-- Comments Section -->
              <div v-if="post.showComments" class="comments-section">
                <!-- Comment Input -->
                <div class="comment-input-wrapper">
                  <img 
                    :src="currentUserAvatar" 
                    :alt="currentUserName"
                    class="comment-input-avatar"
                  />
                  <div class="comment-input-group">
                    <input 
                      v-model="post.newComment"
                      @keyup.enter="addComment(post)"
                      placeholder="Write a comment..."
                      class="comment-field"
                    />
                    <button 
                      @click="addComment(post)"
                      :disabled="!post.newComment?.trim() || post.commenting"
                      class="comment-submit-btn"
                    >
                      {{ post.commenting ? '...' : 'Post' }}
                    </button>
                  </div>
                </div>

                <!-- Comments List -->
                <div v-if="post.comments && post.comments.length > 0" class="comments-list">
                  <div 
                    v-for="comment in post.comments" 
                    :key="comment.id"
                    class="comment-item"
                  >
                    <img 
                      :src="comment.author_avatar || '/default-avatar.png'" 
                      :alt="comment.author"
                      class="comment-avatar"
                    />
                    <div class="comment-content">
                      <div class="comment-header">
                        <span class="comment-author">{{ comment.author }}</span>
                        <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
                      </div>
                      <p class="comment-text">{{ comment.content }}</p>
                      <div class="comment-actions">
                        <button 
                          @click="toggleCommentLike(comment)"
                          :class="['comment-like-btn', { 'liked': comment.user_liked }]"
                        >
                          <Icon :name="comment.user_liked ? 'heart' : 'heart'" size="14" />
                          {{ comment.likes_count || 0 }}
                        </button>
                        <button class="comment-reply-btn">Reply</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Load More Comments -->
                <button 
                  v-if="post.hasMoreComments" 
                  @click="loadMoreComments(post)"
                  class="load-more-comments-btn"
                >
                  Load more comments
                </button>
              </div>
            </article>

            <!-- Load More Posts -->
            <div v-if="hasMore" class="load-more-wrapper">
              <button 
                @click="loadMorePosts" 
                :disabled="loading"
                class="load-more-btn"
              >
                {{ loading ? 'Loading...' : 'Load More Posts' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Sidebar (Optional - for ads/sponsored content) -->
        <aside class="feed-sidebar">
          <!-- Ad Slots -->
          <div v-for="ad in adSlots" :key="ad.id" class="ad-slot">
            <AdSlot :ad="ad" />
          </div>

          <!-- Trending Section -->
          <div class="trending-section">
            <h3>Trending</h3>
            <div v-for="trend in trendingTopics" :key="trend.id" class="trend-item">
              <p class="trend-title">{{ trend.title }}</p>
              <p class="trend-count">{{ formatCount(trend.count) }} posts</p>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <!-- PewGift Modal -->
    <div v-if="showPewGiftModal" class="modal-overlay" @click="closePewGiftModal">
      <div class="pewgift-modal" @click.stop>
        <div class="modal-header">
          <h3>Send PewGift</h3>
          <button @click="closePewGiftModal" class="close-btn">
            <Icon name="x" size="20" />
          </button>
        </div>

        <div class="modal-content">
          <p class="modal-description">Support this post with a PewGift!</p>

          <!-- Quick Amount Buttons -->
          <div class="quick-amounts">
            <button 
              v-for="amount in quickGiftAmounts" 
              :key="amount"
              @click="selectedGiftAmount = amount; customGiftAmount = null"
              :class="['amount-btn', { 'selected': selectedGiftAmount === amount && !customGiftAmount }]"
            >
              {{ amount }} PEW
            </button>
          </div>

          <!-- Custom Amount Input -->
          <div class="custom-amount-section">
            <input 
              v-model.number="customGiftAmount"
              type="number"
              placeholder="Custom amount"
              min="1"
              step="0.01"
              class="custom-amount-input"
              @focus="selectedGiftAmount = null"
            />
            <span class="currency-label">PEW</span>
          </div>

          <!-- Gift Preview -->
          <div v-if="giftPreview" class="gift-preview">
            <div class="preview-row">
              <span>Gift Amount:</span>
              <span class="amount">{{ giftPreview.amount }} PEW</span>
            </div>
            <div class="preview-row">
              <span>Platform Fee:</span>
              <span class="fee">{{ giftPreview.platformFee }} PEW</span>
            </div>
            <div class="preview-row total">
              <span>Total Cost:</span>
              <span class="total-amount">{{ giftPreview.total }} PEW</span>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions">
            <button @click="closePewGiftModal" class="cancel-btn">Cancel</button>
            <button 
              @click="sendPewGift" 
              :disabled="!getSelectedGiftAmount() || sendingGift"
              class="send-gift-btn"
            >
              {{ sendingGift ? 'Sending...' : `Send ${getSelectedGiftAmount()} PEW` }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="homefeed-footer">
      <p>&copy; 2024 SocialVerse. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Header from '~/components/layout/Header.vue'
import CreatePost from '~/components/posts/CreatePost.vue'
import AdSlot from '~/components/AdSlot.vue'

// State
const posts = ref([])
const loading = ref(false)
const error = ref(null)
const hasMore = ref(true)
const currentPage = ref(1)

const showPewGiftModal = ref(false)
const selectedPost = ref(null)
const selectedGiftAmount = ref(null)
const customGiftAmount = ref(null)
const sendingGift = ref(false)

const adSlots = ref([])
const trendingTopics = ref([])

const quickGiftAmounts = [1, 5, 10, 25, 50]
const currentUserAvatar = ref('/default-avatar.png')
const currentUserName = ref('You')

// Computed
const giftPreview = computed(() => {
  const amount = getSelectedGiftAmount()
  if (!amount) return null
  
  const platformFee = amount * 0.05 // 5% platform fee
  const total = amount + platformFee
  
  return {
    amount,
    platformFee: platformFee.toFixed(2),
    total: total.toFixed(2)
  }
})

// Methods
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return d.toLocaleDateString()
}

function formatCount(count) {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
  return count.toString()
}

async function loadPosts() {
  loading.value = true
  error.value = null
  
  try {
    // Fetch posts from API
    const response = await $fetch('/api/posts', {
      query: { page: currentPage.value, limit: 10 }
    })
    
    posts.value = response.data.map(post => ({
      ...post,
      showComments: false,
      newComment: '',
      commenting: false,
      liking: false,
      user_liked: false,
      hasMoreComments: false
    }))
    
    hasMore.value = response.hasMore
  } catch (err) {
    error.value = 'Failed to load posts. Please try again.'
    console.error('Error loading posts:', err)
  } finally {
    loading.value = false
  }
}

function loadMorePosts() {
  currentPage.value++
  loadPosts()
}

async function toggleLike(post) {
  post.liking = true
  try {
    await $fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
    post.user_liked = !post.user_liked
    post.likes_count += post.user_liked ? 1 : -1
  } catch (err) {
    console.error('Error toggling like:', err)
  } finally {
    post.liking = false
  }
}

function toggleComments(post) {
  post.showComments = !post.showComments
}

async function addComment(post) {
  if (!post.newComment?.trim()) return
  
  post.commenting = true
  try {
    const response = await $fetch(`/api/posts/${post.id}/comments`, {
      method: 'POST',
      body: { content: post.newComment }
    })
    
    if (!post.comments) post.comments = []
    post.comments.push(response)
    post.newComment = ''
    post.comments_count++
  } catch (err) {
    console.error('Error adding comment:', err)
  } finally {
    post.commenting = false
  }
}

async function toggleCommentLike(comment) {
  try {
    await $fetch(`/api/comments/${comment.id}/like`, { method: 'POST' })
    comment.user_liked = !comment.user_liked
    comment.likes_count += comment.user_liked ? 1 : -1
  } catch (err) {
    console.error('Error toggling comment like:', err)
  }
}

function loadMoreComments(post) {
  // Load more comments logic
}

async function sharePost(post) {
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Check out this post on SocialVerse',
        text: post.content,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
    post.shares_count++
  } catch (err) {
    console.error('Error sharing post:', err)
  }
}

function openPewGiftModal(post) {
  selectedPost.value = post
  selectedGiftAmount.value = null
  customGiftAmount.value = null
  showPewGiftModal.value = true
}

function closePewGiftModal() {
  showPewGiftModal.value = false
  selectedPost.value = null
}

function getSelectedGiftAmount() {
  return customGiftAmount.value || selectedGiftAmount.value
}

async function sendPewGift() {
  const amount = getSelectedGiftAmount()
  if (!amount || !selectedPost.value) return
  
  sendingGift.value = true
  try {
    await $fetch(`/api/posts/${selectedPost.value.id}/pewgift`, {
      method: 'POST',
      body: { amount }
    })
    
    selectedPost.value.pewgifts_count++
    closePewGiftModal()
    alert(`Successfully sent ${amount} PEW!`)
  } catch (err) {
    console.error('Error sending PewGift:', err)
    alert('Failed to send PewGift. Please try again.')
  } finally {
    sendingGift.value = false
  }
}

function togglePostOptions(postId) {
  // Toggle post options menu
}

function openMediaViewer(url) {
  // Open media viewer modal
}

function onPostCreated(newPost) {
  posts.value.unshift(newPost)
}

function retryLoadPosts() {
  currentPage.value = 1
  loadPosts()
}

// Lifecycle
onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.homefeed-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

.feed-body {
  flex: 1;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.feed-wrapper {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

.posts-feed {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.posts-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.post-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.post-item.sponsored {
  border-left: 4px solid #ffc107;
}

.post-item.ad {
  border-left: 4px solid #2196f3;
  background: #f0f7ff;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.author-info {
  display: flex;
  gap: 12px;
  flex: 1;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.verified-badge {
  color: #1976d2;
}

.post-timestamp {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.post-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.sponsored-badge {
  background: #fff3cd;
  color: #856404;
}

.ad-badge {
  background: #cfe2ff;
  color: #084298;
}

.pinned-badge {
  background: #d1ecf1;
  color: #0c5460;
}

.more-options-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #999;
  transition: color 0.2s;
}

.more-options-btn:hover {
  color: #333;
}

.post-content {
  margin-bottom: 12px;
}

.post-text {
  margin: 0 0 12px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.post-media {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.post-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s;
}

.post-image:hover {
  transform: scale(1.02);
}

.engagement-stats {
  display: flex;
  gap: 16px;
  padding: 8px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.interaction-bar {
  display: flex;
  gap: 8px;
  justify-content: space-around;
}

.interaction-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
}

.interaction-btn:hover {
  background: #e8e8e8;
  color: #333;
}

.interaction-btn.active {
  background: #ffe0e0;
  color: #d32f2f;
}

.like-btn.active {
  background: #ffe0e0;
  color: #d32f2f;
}

.pewgift-btn {
  color: #ff9800;
}

.pewgift-btn.has-gifts {
  background: #fff3e0;
  color: #e65100;
}

.comments-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.comment-input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.comment-input-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-input-group {
  flex: 1;
  display: flex;
  gap: 6px;
}

.comment-field {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
}

.comment-field:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.comment-submit-btn {
  padding: 8px 16px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.2s;
}

.comment-submit-btn:hover:not(:disabled) {
  background: #1565c0;
}

.comment-submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  display: flex;
  gap: 8px;
}

.comment-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 4px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-author {
  font-weight: 600;
  font-size: 12px;
}

.comment-date {
  font-size: 11px;
  color: #999;
}

.comment-text {
  margin: 4px 0;
  font-size: 13px;
  color: #333;
}

.comment-actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
}

.comment-like-btn,
.comment-reply-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}

.comment-like-btn:hover,
.comment-reply-btn:hover {
  color: #333;
}

.comment-like-btn.liked {
  color: #d32f2f;
}

.load-more-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.load-more-btn {
  padding: 10px 24px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #1565c0;
}

.load-more-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.feed-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ad-slot {
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.trending-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.trending-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}

.trend-item {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.trend-item:last-child {
  border-bottom: none;
}

.trend-item:hover {
  background: #f5f5f5;
  padding: 8px 4px;
}

.trend-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.trend-count {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: #999;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pewgift-modal {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 4px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-description {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 8px;
}

.amount-btn {
  padding: 8px 12px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.amount-btn:hover {
  border-color: #1976d2;
  color: #1976d2;
}

.amount-btn.selected {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.custom-amount-section {
  display: flex;
  gap: 8px;
}

.custom-amount-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
}

.custom-amount-input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.currency-label {
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-weight: 600;
  color: #666;
}

.gift-preview {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.preview-row.total {
  border-top: 1px solid #ddd;
  padding-top: 8px;
  margin-top: 8px;
  font-weight: 600;
  color: #333;
}

.amount,
.fee,
.total-amount {
  font-weight: 600;
  color: #1976d2;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.cancel-btn,
.send-gift-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}

.cancel-btn:hover {
  background: #e8e8e8;
}

.send-gift-btn {
  background: #ff9800;
  color: white;
}

.send-gift-btn:hover:not(:disabled) {
  background: #f57c00;
}

.send-gift-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Loading & Error States */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f5f5f5;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state p {
  margin: 16px 0 0 0;
  color: #d32f2f;
  font-size: 14px;
}

.retry-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.retry-btn:hover {
  background: #1565c0;
}

/* Footer */
.homefeed-footer {
  background: #333;
  color: white;
  text-align: center;
  padding: 20px;
  margin-top: 40px;
  font-size: 13px;
}

.homefeed-footer p {
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .feed-wrapper {
    grid-template-columns: 1fr;
  }

  .feed-sidebar {
    display: none;
  }

  .post-item {
    padding: 12px;
  }

  .interaction-bar {
    gap: 4px;
  }

  .interaction-btn {
    padding: 6px 8px;
    font-size: 12px;
  }

  .pewgift-modal {
    max-width: 90%;
  }
}

@media (max-width: 480px) {
  .feed-body {
    padding: 12px;
  }

  .post-header {
    flex-direction: column;
    gap: 8px;
  }

  .post-badges {
    width: 100%;
  }

  .engagement-stats {
    flex-wrap: wrap;
  }

  .quick-amounts {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>






