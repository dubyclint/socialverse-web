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
              <div class="post-header">
                <div class="user-info">
                  <img :src="post.user_avatar" :alt="post.user_name" class="user-avatar" />
                  <div class="user-details">
                    <h4 class="user-name">{{ post.user_name }}</h4>
                    <span class="post-time">{{ formatDate(post.created_at) }}</span>
                  </div>
                </div>
                <button @click="togglePostOptions(post.id)" class="options-btn">
                  <Icon name="more-vertical" size="20" />
                </button>
              </div>

              <!-- Post Content -->
              <div class="post-content">
                <p class="post-text">{{ post.content }}</p>
                
                <!-- Post Media -->
                <div v-if="post.media && post.media.length > 0" class="post-media">
                  <img 
                    v-for="(media, index) in post.media" 
                    :key="index"
                    :src="media.url" 
                    :alt="post.content"
                    class="post-image"
                    @click="openMediaViewer(media.url)"
                  />
                </div>
              </div>

              <!-- Engagement Stats -->
              <div class="engagement-stats">
                <span class="stat">
                  <Icon name="heart" size="16" />
                  {{ formatCount(post.likes_count) }} Likes
                </span>
                <span class="stat">
                  <Icon name="message-circle" size="16" />
                  {{ formatCount(post.comments_count) }} Comments
                </span>
                <span class="stat">
                  <Icon name="share-2" size="16" />
                  {{ formatCount(post.shares_count) }} Shares
                </span>
              </div>

              <!-- Interaction Bar -->
              <div class="interaction-bar">
                <!-- Like Button -->
                <button 
                  @click="toggleLike(post)"
                  class="interaction-btn like-btn"
                  :class="{ 'liked': post.user_liked }"
                  :disabled="post.liking"
                  title="Like this post"
                >
                  <Icon :name="post.user_liked ? 'heart' : 'heart'" size="20" />
                  <span>Like</span>
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
                    class="comment-user-avatar" 
                  />
                  <div class="comment-input-group">
                    <input 
                      v-model="post.newComment"
                      type="text"
                      placeholder="Write a comment..."
                      class="comment-input"
                      @keyup.enter="addComment(post)"
                    />
                    <button 
                      @click="addComment(post)"
                      :disabled="!post.newComment?.trim() || post.commenting"
                      class="comment-submit-btn"
                    >
                      {{ post.commenting ? 'Posting...' : 'Post' }}
                    </button>
                  </div>
                </div>

                <!-- Comments List -->
                <div v-if="post.comments && post.comments.length > 0" class="comments-list">
                  <div v-for="comment in post.comments" :key="comment.id" class="comment-item">
                    <img :src="comment.user_avatar" :alt="comment.user_name" class="comment-avatar" />
                    <div class="comment-content">
                      <div class="comment-header">
                        <strong class="comment-user-name">{{ comment.user_name }}</strong>
                        <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                      </div>
                      <p class="comment-text">{{ comment.content }}</p>
                      <div class="comment-actions">
                        <button class="comment-like-btn">
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

        <!-- Sidebar -->
        <aside class="sidebar">
          <!-- Ad Slot -->
          <AdSlot v-if="adSlots.length > 0" :ad="adSlots[0]" />

          <!-- Trending Topics -->
          <div class="trending-section">
            <h3>Trending Topics</h3>
            <div class="trending-list">
              <div v-for="topic in trendingTopics" :key="topic.id" class="trending-item">
                <span class="topic-name">{{ topic.name }}</span>
                <span class="topic-count">{{ formatCount(topic.count) }} posts</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <!-- PewGift Modal -->
    <div v-if="showPewGiftModal" class="modal-overlay" @click="closePewGiftModal">
      <div class="modal-content-wrapper" @click.stop>
        <div class="modal-header">
          <h3>Send a PewGift</h3>
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
              class="send-btn"
            >
              {{ sendingGift ? 'Sending...' : 'Send PewGift' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import Header from '~/components/layout/Header.vue'
import CreatePost from '~/components/posts/CreatePost.vue'
import AdSlot from '~/components/AdSlot.vue'

const router = useRouter()
const authStore = useAuthStore()

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

// CORRECTED: Get current user from auth store - DYNAMIC USER DATA
const currentUserAvatar = computed(() => authStore.profile?.avatar_url || '/default-avatar.png')
const currentUserName = computed(() => authStore.userDisplayName || 'You')

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

async function loadMoreComments(post) {
  try {
    const response = await $fetch(`/api/posts/${post.id}/comments`, {
      query: { limit: 10 }
    })
    post.comments = [...(post.comments || []), ...response.data]
    post.hasMoreComments = response.hasMore
  } catch (err) {
    console.error('Error loading more comments:', err)
  }
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

// ✅ FIX #3: Add session check in onMounted hook
onMounted(async () => {
  console.log('[Feed] Page mounted, checking authentication...')
  
  // ✅ Ensure session is fully initialized before rendering feed
  if (authStore.isAuthenticated && !authStore.sessionValid) {
    console.warn('[Feed] User authenticated but session not initialized, performing handshake...')
    
    try {
      const handshakeResult = await authStore.performSignupHandshake()
      
      if (handshakeResult.success) {
        console.log('[Feed] ✅ Session initialized successfully')
      } else {
        console.warn('[Feed] Handshake failed:', handshakeResult.error)
        // Continue anyway - user is authenticated
      }
    } catch (err) {
      console.error('[Feed] Error during handshake:', err)
      // Continue anyway - user is authenticated
    }
  } else if (!authStore.isAuthenticated) {
    console.log('[Feed] User not authenticated, initializing auth store...')
    try {
      await authStore.initialize()
    } catch (err) {
      console.error('[Feed] Error initializing auth store:', err)
    }
  } else {
    console.log('[Feed] ✅ Session already initialized')
  }
  
  // Load posts after session is ready
  loadPosts()
})
</script>

<style scoped>
.feed-container {
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

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.post-time {
  font-size: 0.8rem;
  color: #999;
}

.options-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 4px;
}

.options-btn:hover {
  color: #333;
}

.post-content {
  margin-bottom: 12px;
}

.post-text {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
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
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.post-image:hover {
  transform: scale(1.02);
}

.engagement-stats {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  font-size: 0.85rem;
  color: #666;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.interaction-bar {
  display: flex;
  gap: 8px;
  margin-top: 12px;
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
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.interaction-btn:hover:not(:disabled) {
  background: #e8e8e8;
  color: #333;
}

.interaction-btn.liked {
  color: #e74c3c;
  background: #ffe8e8;
}

.interaction-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comments-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.comment-input-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-input-group {
  flex: 1;
  display: flex;
  gap: 8px;
}

.comment-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
}

.comment-input:focus {
  outline: none;
  border-color: #667eea;
}

.comment-submit-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.2s;
}

.comment-submit-btn:hover:not(:disabled) {
  background: #5568d3;
}

.comment-submit-btn:disabled {
  opacity: 0.6;
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
  width: 28px;
  height: 28px;
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

.comment-user-name {
  font-size: 0.9rem;
  color: #333;
}

.comment-time {
  font-size: 0.8rem;
  color: #999;
}

.comment-text {
  margin: 4px 0;
  font-size: 0.9rem;
  color: #666;
}

.comment-actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.comment-like-btn,
.comment-reply-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}

.comment-like-btn:hover,
.comment-reply-btn:hover {
  color: #333;
}

.load-more-comments-btn {
  padding: 8px 12px;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  color: #667eea;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.2s;
  margin-top: 8px;
}

.load-more-comments-btn:hover {
  background: #e8e8e8;
}

.load-more-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.load-more-btn {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: background 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #5568d3;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: white;
  border-radius: 8px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-state p {
  color: #e74c3c;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.retry-btn:hover {
  background: #5568d3;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trending-section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.trending-section h3 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #333;
}

.trending-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trending-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.trending-item:last-child {
  border-bottom: none;
}

.trending-item:hover {
  background: #f9f9f9;
}

.topic-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.topic-count {
  font-size: 0.8rem;
  color: #999;
}

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

.modal-content-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 4px;
}

.close-btn:hover {
  color: #333;
}

.modal-content {
  padding: 20px;
}

.modal-description {
  margin: 0 0 16px 0;
  font-size: 0.95rem;
  color: #666;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.amount-btn {
  padding: 10px;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  transition: all 0.2s;
}

.amount-btn:hover {
  background: #e8e8e8;
}

.amount-btn.selected {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.custom-amount-section {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.custom-amount-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.custom-amount-input:focus {
  outline: none;
  border-color: #667eea;
}

.currency-label {
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #999;
  font-weight: 600;
}

.gift-preview {
  background: #f9f9f9;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 0.9rem;
  color: #666;
}

.preview-row.total {
  border-top: 1px solid #ddd;
  padding-top: 12px;
  margin-top: 8px;
  font-weight: 600;
  color: #333;
}

.amount,
.fee,
.total-amount {
  color: #333;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.cancel-btn,
.send-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
}

.cancel-btn {
  background: #e8e8e8;
  color: #333;
}

.cancel-btn:hover {
  background: #d8d8d8;
}

.send-btn {
  background: #667eea;
  color: white;
}

.send-btn:hover:not(:disabled) {
  background: #5568d3;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .feed-wrapper {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
  }

  .interaction-bar {
    flex-wrap: wrap;
  }

  .interaction-btn {
    flex: 0 1 calc(50% - 4px);
  }
}
</style>
