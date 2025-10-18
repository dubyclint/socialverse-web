<template>
  <article class="post-card" :class="[variant, { sponsored: post.sponsored, pinned: post.pinned }]">
    <!-- Post Header -->
    <header class="post-header">
      <div class="author-info">
        <img :src="post.avatar" :alt="post.author" class="author-avatar" />
        <div class="author-details">
          <h4 class="author-name">
            {{ post.author }}
            <Icon v-if="post.verified" name="check-circle" size="16" class="verified-badge" />
          </h4>
          <p class="post-timestamp">{{ post.timestamp }}</p>
        </div>
      </div>
      
      <div class="post-actions">
        <button v-if="post.pinned" class="pin-indicator" title="Pinned Post">
          <Icon name="pin" size="16" />
        </button>
        <button v-if="post.sponsored" class="sponsored-indicator" title="Sponsored">
          <Icon name="dollar-sign" size="16" />
        </button>
        <button class="more-btn" @click="showMoreOptions">
          <Icon name="more-horizontal" size="20" />
        </button>
      </div>
    </header>

    <!-- Post Content -->
    <div class="post-content">
      <p class="post-text">{{ post.content }}</p>
      <div v-if="post.image" class="post-media">
        <img :src="post.image" :alt="post.content" @click="openMedia" />
        <div class="media-overlay">
          <button class="media-expand" @click="openMedia">
            <Icon name="maximize" size="20" />
          </button>
        </div>
      </div>
    </div>

    <!-- Post Footer -->
    <footer class="post-footer">
      <div class="engagement-stats">
        <span class="stat">{{ formatNumber(post.likes) }} likes</span>
        <span class="stat">{{ formatNumber(post.comments) }} comments</span>
        <span class="stat">{{ formatNumber(post.shares) }} shares</span>
      </div>
      
      <div class="action-buttons">
        <button class="action-btn like" :class="{ active: isLiked }" @click="toggleLike">
          <Icon :name="isLiked ? 'heart' : 'heart'" size="20" />
          <span>Like</span>
        </button>
        <button class="action-btn comment" @click="openComments">
          <Icon name="message-circle" size="20" />
          <span>Comment</span>
        </button>
        <button class="action-btn share" @click="sharePost">
          <Icon name="share" size="20" />
          <span>Share</span>
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
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const toggleLike = () => {
  isLiked.value = !isLiked.value
  // Implement like functionality
}

const openComments = () => {
  // Open comments modal or navigate to post detail
  navigateTo(`/post/${props.post.id}`)
}

const sharePost = () => {
  // Implement share functionality
  if (navigator.share) {
    navigator.share({
      title: `Post by ${props.post.author}`,
      text: props.post.content,
      url: `${window.location.origin}/post/${props.post.id}`
    })
  }
}

const openMedia = () => {
  // Open media in fullscreen
  // Implement media viewer
}

const showMoreOptions = () => {
  // Show more options menu
}
</script>

<style scoped>
.post-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #e1e5e9;
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

.verified-badge {
  color: #0984e3;
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
}

.pin-indicator:hover,
.sponsored-indicator:hover,
.more-btn:hover {
  background: #f8f9fa;
}

.pin-indicator {
  color: #f39c12;
}

.sponsored-indicator {
  color: #e17055;
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

.media-overlay {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.post-media:hover .media-overlay {
  opacity: 1;
}

.media-expand {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
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
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #636e72;
  font-weight: 500;
}

.action-btn:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
}

.action-btn.like.active {
  color: #e74c3c;
}

.action-btn.comment:hover {
  color: #0984e3;
}

.action-btn.share:hover {
  color: #00b894;
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
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
  
  .action-btn span {
    display: none;
  }
}
</style>
