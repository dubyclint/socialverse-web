<template>
  <article 
    class="post-card" 
    :class="[variant, { sponsored: post.sponsored, pinned: post.pinned, verified: post.verified }]"
  >
    <!-- Post Header -->
    <header class="post-header">
      <div class="author-info">
        <img 
          :src="post.userAvatar || post.avatar" 
          :alt="post.username || post.author" 
          class="author-avatar" 
        />
        <div class="author-details">
          <h4 class="author-name">
            {{ post.username || post.author }}
            <span v-if="post.verified || post.isVerified" class="badge">✔️</span>
          </h4>
          <p class="post-timestamp">{{ post.timestamp || formatDate(post.createdAt) }}</p>
        </div>
      </div>
      
      <div class="post-actions">
        <button v-if="post.pinned" class="pin-indicator" title="Pinned Post">
          📍
        </button>
        <button v-if="post.sponsored" class="sponsored-indicator" title="Sponsored">
          $$
        </button>
        <button class="more-btn" @click="showMoreOptions">
          ⋮
        </button>
      </div>
    </header>

    <!-- Post Content -->
    <div class="post-content">
      <p class="post-text">{{ post.content }}</p>
      <div v-if="post.mediaUrl || post.image" class="post-media">
        <img 
          :src="post.mediaUrl || post.image" 
          :alt="post.content" 
          @click="openMedia" 
        />
      </div>
    </div>

    <!-- Post Footer -->
    <footer class="post-footer">
      <div class="engagement-stats">
        <span class="stat">{{ formatNumber(post.likes?.length || post.likes) }} likes</span>
        <span class="stat">{{ formatNumber(post.comments?.length || post.comments) }} comments</span>
        <span class="stat">{{ formatNumber(post.shares || 0) }} shares</span>
      </div>
      
      <div class="action-buttons">
        <button 
          class="action-btn like" 
          :class="{ active: isLiked }" 
          @click="toggleLike"
        >
          {{ isLiked ? '❤️' : '🤍' }} Like
        </button>
        <button class="action-btn comment" @click="openComments">
          💬 Comment
        </button>
        <button class="action-btn share" @click="sharePost">
          🔄 Share
        </button>
        <button class="action-btn pewgift" @click="sendPewgift">
  🎁 Pewgift
</button>
      </div>
    </footer>
  </article>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  variant: {
    type: String,
    default: 'default'
  }
})

const isLiked = ref(false)

const formatNumber = (num) => {
  if (typeof num !== 'number') return num || 0
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toggleLike = () => {
  isLiked.value = !isLiked.value
  // Implement like functionality
}

const openComments = () => {
  // Open comments modal or navigate to post detail
  console.log('Open comments for post:', props.post._id)
}

const sharePost = () => {
  // Implement share functionality
  if (navigator.share) {
    navigator.share({
      title: `Post by ${props.post.username || props.post.author}`,
      text: props.post.content,
      url: `${window.location.origin}/post/${props.post._id || props.post.id}`
    }).catch(err => console.log('Error sharing:', err))
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard?.writeText(window.location.href)
  }
}

const sendPewgift = () => {
  // Trigger pewgift flow
  console.log('Send pewgift to post:', props.post._id)
}


const openMedia = () => {
  // Open media in fullscreen viewer
  console.log('Open media:', props.post.mediaUrl || props.post.image)
}

const showMoreOptions = () => {
  // Show more options menu
  console.log('Show more options for post:', props.post._id)
}
</script>

<style scoped>
.post-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #e1e5e9;
  margin-bottom: 1.5rem;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.post-card.trending {
  border-left: 4px solid #ff6b6b;
}

.post-card.friends {
  border-left: 4px solid #4ecdc4;
}

.post-card.local {
  border-left: 4px solid #45b7d1;
}

.post-card.sponsored {
  border: 2px solid #f39c12;
  background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
}

.post-card.verified {
  border-left: 4px solid #2ecc71;
}

.post-card.news {
  border-left: 4px solid #9b59b6;
}

.post-card.interests {
  border-left: 4px solid #e74c3c;
}

.post-card.pinned {
  border-top: 3px solid #f39c12;
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #f8f9fa;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #2d3436;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge {
  color: #0984e3;
  font-size: 0.9rem;
}

.post-timestamp {
  margin: 0;
  font-size: 0.85rem;
  color: #636e72;
}

.post-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pin-indicator,
.sponsored-indicator,
.more-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #636e72;
  font-size: 1rem;
}

.pin-indicator:hover,
.sponsored-indicator:hover,
.more-btn:hover {
  background: #f8f9fa;
}

.post-content {
  padding: 1rem;
}

.post-text {
  margin: 0 0 1rem 0;
  line-height: 1.6;
  color: #2d3436;
}

.post-media {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.post-media img {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.post-media:hover img {
  transform: scale(1.02);
}

.post-footer {
  padding: 1rem;
  border-top: 1px solid #f8f9fa;
}

.engagement-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #636e72;
}

.action-buttons {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid #ddd;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #636e72;
  font-weight: 500;
  flex: 1;
  min-width: 70px;
  justify-content: center;
}

.action-btn:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.action-btn.like.active {
  color: #e74c3c;
  border-color: #e74c3c;
}

.action-btn.comment:hover {
  color: #0984e3;
  border-color: #0984e3;
}

.action-btn.share:hover {
  color: #00b894;
  border-color: #00b894;
}

.action-btn.gift:hover {
  color: #fd79a8;
  border-color: #fd79a8;
}

/* Responsive Design */
@media (max-width: 480px) {
  .post-header {
    padding: 0.75rem;
  }
  
  .author-avatar {
    width: 40px;
    height: 40px;
  }
  
  .author-name {
    font-size: 0.9rem;
  }
  
  .post-content {
    padding: 0.75rem;
  }
  
  .post-footer {
    padding: 0.75rem;
  }
  
  .action-buttons {
    gap: 0.25rem;
  }
  
  .action-btn {
    padding: 0.5rem;
    font-size: 0.85rem;
  }
}
</style>
