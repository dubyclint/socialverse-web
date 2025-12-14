<!-- FILE: /components/feed/FeedPost.vue -->
<template>
  <article class="feed-post">
    <!-- Post Header -->
    <div class="post-header">
      <div class="post-author">
        <img 
          :src="post.author.avatar" 
          :alt="post.author.name"
          class="author-avatar"
        />
        <div class="author-info">
          <div class="author-name-row">
            <h4 class="author-name">{{ post.author.name }}</h4>
            <span v-if="post.author.verified" class="verified-badge">
              <Icon name="check-circle" size="14" />
            </span>
          </div>
          <p class="author-handle">@{{ post.author.username }}</p>
          <p class="post-time">{{ formatTime(post.createdAt) }}</p>
        </div>
      </div>
      <button class="post-menu-btn" @click="showMenu = !showMenu">
        <Icon name="more-vertical" size="20" />
      </button>
      <div v-if="showMenu" class="post-menu">
        <button class="menu-item">Report Post</button>
        <button class="menu-item">Mute @{{ post.author.username }}</button>
        <button class="menu-item danger">Block @{{ post.author.username }}</button>
      </div>
    </div>

    <!-- Post Content -->
    <div class="post-content">
      <p class="post-text">{{ post.content }}</p>
      <img 
        v-if="post.image" 
        :src="post.image" 
        :alt="post.content"
        class="post-image"
      />
    </div>

    <!-- Post Stats -->
    <div class="post-stats">
      <span class="stat">{{ post.likes }} Likes</span>
      <span class="stat">{{ post.comments }} Comments</span>
      <span class="stat">{{ post.shares }} Shares</span>
    </div>

    <!-- Post Actions -->
    <div class="post-actions">
      <button 
        class="action-btn"
        :class="{ active: post.liked }"
        @click="toggleLike"
      >
        <Icon name="heart" size="18" />
        <span>{{ post.likes }}</span>
      </button>
      <button class="action-btn" @click="showComments = !showComments">
        <Icon name="message-circle" size="18" />
        <span>{{ post.comments }}</span>
      </button>
      <button class="action-btn" @click="sharePost">
        <Icon name="share-2" size="18" />
        <span>{{ post.shares }}</span>
      </button>
      <button class="action-btn" @click="savePost">
        <Icon name="bookmark" size="18" />
      </button>
    </div>

    <!-- Comments Section -->
    <div v-if="showComments" class="comments-section">
      <div class="comment-input">
        <img 
          :src="currentUserAvatar" 
          :alt="currentUserName"
          class="comment-avatar"
        />
        <input 
          v-model="newComment"
          type="text"
          placeholder="Write a comment..."
          class="comment-input-field"
          @keyup.enter="postComment"
        />
        <button 
          class="comment-submit-btn"
          @click="postComment"
          :disabled="!newComment.trim()"
        >
          <Icon name="send" size="16" />
        </button>
      </div>

      <div class="comments-list">
        <div v-for="comment in post.commentsList" :key="comment.id" class="comment">
          <img 
            :src="comment.author.avatar" 
            :alt="comment.author.name"
            class="comment-avatar"
          />
          <div class="comment-content">
            <div class="comment-header">
              <h5 class="comment-author">{{ comment.author.name }}</h5>
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
            </div>
            <p class="comment-text">{{ comment.text }}</p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Author {
  id: string
  name: string
  username: string
  avatar: string
  verified: boolean
}

interface Comment {
  id: string
  author: Author
  text: string
  createdAt: Date
}

interface Post {
  id: string
  author: Author
  content: string
  image?: string
  likes: number
  comments: number
  shares: number
  liked: boolean
  createdAt: Date
  commentsList: Comment[]
}

const props = defineProps<{
  post: Post
}>()

const showMenu = ref(false)
const showComments = ref(false)
const newComment = ref('')
const currentUserName = 'You'
const currentUserAvatar = '/default-avatar.png'

const toggleLike = () => {
  props.post.liked = !props.post.liked
  props.post.likes += props.post.liked ? 1 : -1
}

const sharePost = () => {
  // TODO: Implement share functionality
  console.log('Share post:', props.post.id)
}

const savePost = () => {
  // TODO: Implement save functionality
  console.log('Save post:', props.post.id)
}

const postComment = () => {
  if (!newComment.value.trim()) return

  const comment: Comment = {
    id: Date.now().toString(),
    author: {
      id: '1',
      name: currentUserName,
      username: 'yourname',
      avatar: currentUserAvatar,
      verified: false
    },
    text: newComment.value,
    createdAt: new Date()
  }

  props.post.commentsList.push(comment)
  props.post.comments += 1
  newComment.value = ''
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}
</script>

<style scoped>
.feed-post {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  margin-bottom: 1rem;
}

.feed-post:hover {
  border-color: #475569;
}

/* Post Header */
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid #334155;
  position: relative;
}

.post-author {
  display: flex;
  gap: 0.75rem;
  flex: 1;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.author-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-name {
  margin: 0;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
}

.verified-badge {
  color: #3b82f6;
  display: flex;
  align-items: center;
}

.author-handle {
  margin: 0;
  color: #94a3b8;
  font-size: 0.85rem;
}

.post-time {
  margin: 0;
  color: #64748b;
  font-size: 0.8rem;
}

.post-menu-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.post-menu-btn:hover {
  background: #334155;
  color: #e2e8f0;
}

.post-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
  z-index: 10;
  min-width: 200px;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #cbd5e1;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.menu-item:hover {
  background: #1e293b;
  color: white;
}

.menu-item.danger {
  color: #ef4444;
}

.menu-item.danger:hover {
  background: #7f1d1d;
}

/* Post Content */
.post-content {
  padding: 1rem;
}

.post-text {
  margin: 0 0 1rem;
  color: #e2e8f0;
  font-size: 0.95rem;
  line-height: 1.5;
  word-wrap: break-word;
}

.post-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
}

/* Post Stats */
.post-stats {
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid #334155;
  border-bottom: 1px solid #334155;
  font-size: 0.85rem;
  color: #94a3b8;
}

.stat {
  cursor: pointer;
  transition: color 0.2s;
}

.stat:hover {
  color: #cbd5e1;
}

/* Post Actions */
.post-actions {
  display: flex;
  justify-content: space-around;
  padding: 0.75rem 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 0.9rem;
  flex: 1;
  justify-content: center;
}

.action-btn:hover {
  color: #3b82f6;
  background: #1e293b;
}

.action-btn.active {
  color: #ef4444;
}

/* Comments Section */
.comments-section {
  padding: 1rem;
  border-top: 1px solid #334155;
  background: #0f172a;
}

.comment-input {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-input-field {
  flex: 1;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: #e2e8f0;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s;
}

.comment-input-field:focus {
  border-color: #3b82f6;
  background: #1e293b;
}

.comment-submit-btn {
  background: #3b82f6;
  border: none;
  color: white;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment-submit-btn:hover:not(:disabled) {
  background: #2563eb;
}

.comment-submit-btn:disabled {
  background: #64748b;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment {
  display: flex;
  gap: 0.75rem;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.comment-author {
  margin: 0;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
}

.comment-time {
  color: #94a3b8;
  font-size: 0.8rem;
}

.comment-text {
  margin: 0;
  color: #cbd5e1;
  font-size: 0.9rem;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .post-stats {
    gap: 1rem;
  }

  .post-actions {
    padding: 0.5rem 0;
  }

  .action-btn {
    padding: 0.5rem 0.5rem;
    font-size: 0.8rem;
  }
}
</style>
