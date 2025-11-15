<!-- components/PostComment.vue -->
<!-- ============================================================================
     POST COMMENT COMPONENT
     ============================================================================ -->

<template>
  <div class="comment">
    <!-- Comment Header -->
    <div class="comment-header">
      <img
        :src="comment.profiles.avatar_url"
        :alt="comment.profiles.username"
        class="comment-avatar"
      />
      <div class="comment-info">
        <div class="comment-author">{{ comment.profiles.username }}</div>
        <div class="comment-time">{{ formatTime(comment.created_at) }}</div>
      </div>
    </div>

    <!-- Comment Content -->
    <div class="comment-content">
      {{ comment.content }}
    </div>

    <!-- Comment Actions -->
    <div class="comment-actions"> 
         <button
  @click="showPewgiftModal = true"
  class="comment-action-btn pewgift-btn"
  title="Send pewgift"
>
  <Icon name="gift" size="14" />
  <span>Pewgift</span>
</button>

<!-- Pewgift Modal -->
<div v-if="showPewgiftModal" class="modal-overlay" @click="showPewgiftModal = false">
  <div class="pewgift-modal" @click.stop>
    <div class="modal-header">
      <h4>Send Pewgift to {{ comment.profiles.username }}</h4>
      <button @click="showPewgiftModal = false" class="close-btn">✕</button>
    </div>
    <div class="modal-body">
      <input 
        v-model.number="pewgiftAmount" 
        type="number" 
        min="1" 
        placeholder="Enter pewgift amount"
        class="amount-input"
      />
      <button @click="sendPewgift" class="send-btn" :disabled="!pewgiftAmount">
        Send Pewgift
      </button>
    </div>
  </div>
</div>

      <button
        @click="toggleLike"
        class="comment-action-btn"
        :class="{ active: isLiked }"
      >
        <Icon name="heart" size="14" :fill="isLiked" />
        <span>{{ likesCount }}</span>
      </button>
      <button
        @click="$emit('reply', comment.id)"
        class="comment-action-btn"
      >
        <Icon name="reply" size="14" />
        <span>Reply</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  comment: any
}

const showPewgiftModal = ref(false)
const pewgiftAmount = ref(0)

const sendPewgift = async () => {
  if (!pewgiftAmount.value || pewgiftAmount.value <= 0) {
    alert('Please enter a valid amount')
    return
  }
  
  try {
    // API call to send pewgift
    const response = await fetch('/api/pewgift/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: comment.profiles.id,
        amount: pewgiftAmount.value,
        commentId: comment.id
      })
    })
    
    if (response.ok) {
      alert('Pewgift sent successfully!')
      showPewgiftModal.value = false
      pewgiftAmount.value = 0
    }
  } catch (error) {
    console.error('Error sending pewgift:', error)
    alert('Failed to send pewgift')
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  reply: [commentId: string]
}>()

const isLiked = ref(false)
const likesCount = ref(props.comment.likes_count || 0)

const formatTime = (date: string): string => {
  const now = new Date()
  const commentDate = new Date(date)
  const diff = now.getTime() - commentDate.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return commentDate.toLocaleDateString()
}

const toggleLike = () => {
  isLiked.value = !isLiked.value
  likesCount.value += isLiked.value ? 1 : -1
}
</script>

<style scoped>
.comment {
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-info {
  flex: 1;
  min-width: 0;
}

.comment-author {
  font-weight: 600;
  color: #1f2937;
  font-size: 13px;
}

.comment-time {
  font-size: 12px;
  color: #9ca3af;
}

.comment-content {
  margin-bottom: 8px;
  color: #1f2937;
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.comment-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
  padding: 0;
}

.comment-action-btn:hover {
  color: #2563eb;
}

.comment-action-btn.active {
  color: #ef4444;
}
</style>
