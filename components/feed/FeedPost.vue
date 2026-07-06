<template>
  <article class="feed-post">
    <div class="post-header">
      <div class="post-author" @click="navigateToProfile(post.author?.id || post.author?.username)">
        <img 
          :src="post.author?.avatar_url || '/default-avatar.png'" 
          :alt="post.author?.full_name || 'User'"
          class="author-avatar"
        />
        <div class="author-info">
          <div class="author-name-row">
            <h4 class="author-name">{{ post.author?.full_name || 'Anonymous User' }}</h4>
            <span v-if="post.author?.verified" class="verified-badge">
              <Icon name="check-circle" size="14" />
            </span>
          </div>
          <p class="author-handle">@{{ post.author?.username || 'unknown' }}</p>
          <p class="post-time">{{ formatTime(post.created_at) }}</p>
        </div>
      </div>
      
      <button class="post-menu-btn" @click.stop="$emit('toggle-menu', post.id)">
        <Icon name="more-vertical" size="20" />
      </button>
      
      <div v-if="activeMenuId === post.id" class="post-menu" @click.stop>
        <button class="menu-item" @click="handleMenuAction('report')">Report Post</button>
        <button class="menu-item" @click="handleMenuAction('mute')">Mute @{{ post.author?.username }}</button>
      </div>
    </div>

    <div class="post-content" @click="navigateToPostDetails(post.id)">
      <p class="post-text">{{ post.content }}</p>
      <div v-if="post.media_url" class="post-media-gallery">
        <img :src="post.media_url" alt="Post attachment" class="post-image" loading="lazy" />
      </div>
    </div>

    <div class="post-stats">
      <span class="stat" @click.stop="$emit('like', post.id)">
        <Icon :name="post.is_liked ? 'heart-filled' : 'heart'" size="16" />
        {{ post.likes_count || 0 }}
      </span>
      <span class="stat" @click.stop="navigateToPostDetails(post.id)">
        <Icon name="message-square" size="16" />
        {{ post.comments_count || 0 }}
      </span>
      <span class="stat" @click.stop="$emit('share', post.id)">
        <Icon name="share" size="16" />
      </span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

interface Author {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  verified?: boolean
}

interface Post {
  id: string
  content: string
  media_url?: string
  created_at: string
  likes_count: number
  comments_count: number
  is_liked?: boolean
  author: Author
}

defineProps<{
  post: Post
  activeMenuId: string | null
}>()

const emit = defineEmits(['toggle-menu', 'like', 'share'])
const router = useRouter()

// Standardized safe navigation routes
const navigateToProfile = (identifier: string | undefined) => {
  if (identifier) {
    router.push(`/profile/${identifier}`)
  } else {
    console.warn('[FeedPost] Cannot navigate: Author profile lacks an identifier string.')
  }
}

const navigateToPostDetails = (postId: string) => {
  router.push(`/posts/${postId}`)
}

const handleMenuAction = (action: string) => {
  console.log(`[Post Action] Triggered ${action}`)
}

const formatTime = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>
