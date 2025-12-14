<!-- FILE: /pages/feed.vue (REFACTORED) -->
<template>
  <div class="feed-page">
    <!-- Header -->
    <FeedHeader />

    <!-- Main Feed Layout -->
    <main class="feed-main">
      <div class="feed-container">
        <!-- Left Sidebar - User Profile -->
        <aside class="left-sidebar">
          <UserProfileCard />
        </aside>

        <!-- Center - Feed Posts -->
        <section class="center-feed">
          <!-- Create Post Card -->
          <div class="create-post-card">
            <img 
              :src="currentUserAvatar" 
              :alt="currentUserName"
              class="create-post-avatar"
            />
            <input 
              type="text"
              placeholder="What's on your mind?"
              class="create-post-input"
              @click="showCreatePostModal = true"
            />
            <button class="create-post-btn" @click="showCreatePostModal = true">
              <Icon name="image" size="18" />
            </button>
          </div>

          <!-- Create Post Modal -->
          <div v-if="showCreatePostModal" class="modal-overlay" @click="showCreatePostModal = false">
            <div class="modal-content" @click.stop>
              <div class="modal-header">
                <h3>Create a Post</h3>
                <button class="close-btn" @click="showCreatePostModal = false">
                  <Icon name="x" size="20" />
                </button>
              </div>
              <div class="modal-body">
                <textarea 
                  v-model="newPostContent"
                  placeholder="What's on your mind?"
                  class="post-textarea"
                ></textarea>
                <input 
                  type="file"
                  accept="image/*"
                  class="post-image-input"
                  @change="handleImageUpload"
                />
                <button 
                  class="post-submit-btn"
                  @click="submitPost"
                  :disabled="!newPostContent.trim()"
                >
                  Post
                </button>
              </div>
            </div>
          </div>

          <!-- Posts Feed -->
          <div class="posts-list">
            <FeedPost 
              v-for="post in posts"
              :key="post.id"
              :post="post"
            />
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading posts...</p>
          </div>

          <!-- Empty State -->
          <div v-if="!isLoading && posts.length === 0" class="empty-state">
            <Icon name="inbox" size="48" />
            <h3>No posts yet</h3>
            <p>Follow people to see their posts here</p>
          </div>
        </section>

        <!-- Right Sidebar - Trending/Suggestions -->
        <aside class="right-sidebar">
          <div class="sidebar-card">
            <h3 class="sidebar-title">Trending Now</h3>
            <div class="trending-list">
              <div v-for="trend in trendingTopics" :key="trend.id" class="trending-item">
                <div class="trend-info">
                  <p class="trend-category">{{ trend.category }}</p>
                  <h4 class="trend-title">{{ trend.title }}</h4>
                  <p class="trend-count">{{ trend.count }} posts</p>
                </div>
              </div>
            </div>
          </div>

          <div class="sidebar-card">
            <h3 class="sidebar-title">Suggestions</h3>
            <div class="suggestions-list">
              <div v-for="user in suggestedUsers" :key="user.id" class="suggestion-item">
                <img :src="user.avatar" :alt="user.name" class="suggestion-avatar" />
                <div class="suggestion-info">
                  <h4 class="suggestion-name">{{ user.name }}</h4>
                  <p class="suggestion-handle">@{{ user.username }}</p>
                </div>
                <button class="follow-btn">Follow</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Post {
  id: string
  author: {
    id: string
    name: string
    username: string
    avatar: string
    verified: boolean
  }
  content: string
  image?: string
  likes: number
  comments: number
  shares: number
  liked: boolean
  createdAt: Date
  commentsList: any[]
}

interface TrendingTopic {
  id: string
  category: string
  title: string
  count: number
}

interface SuggestedUser {
  id: string
  name: string
  username: string
  avatar: string
}

const showCreatePostModal = ref(false)
const isLoading = ref(false)
const newPostContent = ref('')
const currentUserName = 'You'
const currentUserAvatar = '/default-avatar.png'

const posts = reactive<Post[]>([
  {
    id: '1',
    author: {
      id: '1',
      name: 'Jane Smith',
      username: 'janesmith',
      avatar: '/default-avatar.png',
      verified: true
    },
    content: 'Just launched my new project! Check it out and let me know what you think 🚀',
    image: undefined,
    likes: 234,
    comments: 45,
    shares: 12,
    liked: false,
    createdAt: new Date(Date.now() - 3600000),
    commentsList: []
  },
  {
    id: '2',
    author: {
      id: '2',
      name: 'Alex Johnson',
      username: 'alexjohnson',
      avatar: '/default-avatar.png',
      verified: false
    },
    content: 'Beautiful sunset today! Nature is amazing 🌅',
    image: undefined,
    likes: 567,
    comments: 89,
    shares: 34,
    liked: false,
    createdAt: new Date(Date.now() - 7200000),
    commentsList: []
  }
])

const trendingTopics = reactive<TrendingTopic[]>([
  { id: '1', category: 'Technology', title: '#WebDevelopment', count: 45230 },
  { id: '2', category: 'Entertainment', title: '#MovieNight', count: 32145 },
  { id: '3', category: 'Sports', title: '#Football', count: 28934 },
  { id: '4', category: 'News', title: '#Breaking', count: 19283 }
])

const suggestedUsers = reactive<SuggestedUser[]>([
  { id: '1', name: 'Sarah Wilson', username: 'sarahwilson', avatar: '/default-avatar.png' },
  { id: '2', name: 'Mike Brown', username: 'mikebrown', avatar: '/default-avatar.png' },
  { id: '3', name: 'Emma Davis', username: 'emmadavis', avatar: '/default-avatar.png' }
])

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    console.log('Image uploaded:', file.name)
  }
}

const submitPost = () => {
  if (!newPostContent.value.trim()) return

  const newPost: Post = {
    id: Date.now().toString(),
    author: {
      id: '1',
      name: currentUserName,
      username: 'yourname',
      avatar: currentUserAvatar,
      verified: false
    },
    content: newPostContent.value,
    likes: 0,
    comments: 0,
    shares: 0,
    liked: false,
    createdAt: new Date(),
    commentsList: []
  }

  posts.unshift(newPost)
  newPostContent.value = ''
  showCreatePostModal.value = false
}
</script>

<style scoped>
.feed-page {
  background: #0f172a;
  min-height: 100vh;
}

.feed-main {
  padding-top: 60px;
}

.feed-container {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
}

/* Left Sidebar */
.left-sidebar {
  position: sticky;
  top: 80px;
  height: fit-content;
}

/* Center Feed */
.center-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.create-post-card {
  display: flex;
  gap: 1rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1rem;
  align-items: center;
}

.create-post-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.create-post-input {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 20px;
  padding: 0.75rem 1rem;
  color: #e2e8f0;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
  cursor: pointer;
}

.create-post-input:focus {
  border-color: #3b82f6;
  background: #1e293b;
}

.create-post-btn {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.create-post-btn:hover {
  background: #1e293b;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
}

.modal-header h3 {
  margin: 0;
  color: white;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #1e293b;
  color: #e2e8f0;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-textarea {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1rem;
  color: #e2e8f0;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 150px;
  outline: none;
  transition: all 0.2s;
}

.post-textarea:focus {
  border-color: #3b82f6;
}

.post-image-input {
  color: #94a3b8;
}

.post-submit-btn {
  background: #3b82f6;
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.post-submit-btn:hover:not(:disabled) {
  background: #2563eb;
}

.post-submit-btn:disabled {
  background: #64748b;
  cursor: not-allowed;
}

/* Posts List */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  color: white;
}

.empty-state p {
  margin: 0;
}

/* Right Sidebar */
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 80px;
  height: fit-content;
}

.sidebar-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
}

.sidebar-title {
  margin: 0 0 1rem;
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
}

.trending-list,
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trending-item {
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.trending-item:hover {
  background: #0f172a;
}

.trend-category {
  margin: 0;
  color: #94a3b8;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.trend-title {
  margin: 0.25rem 0;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
}

.trend-count {
  margin: 0;
  color: #64748b;
  font-size: 0.8rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.suggestion-item:hover {
  background: #0f172a;
}

.suggestion-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.suggestion-info {
  flex: 1;
  min-width: 0;
}

.suggestion-name {
  margin: 0;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-handle {
  margin: 0.25rem 0 0;
  color: #94a3b8;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.follow-btn {
  background: #3b82f6;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.follow-btn:hover {
  background: #2563eb;
}

/* Responsive */
@media (max-width: 1200px) {
  .feed-container {
    grid-template-columns: 1fr 320px;
  }

  .left-sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .feed-container {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }

  .right-sidebar {
    display: none;
  }

  .create-post-card {
    padding: 0.75rem;
  }

  .create-post-input {
    font-size: 0.9rem;
  }
}
</style>
