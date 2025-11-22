<!-- FILE: /pages/posts.vue -->
<!-- ============================================================================ -->
<!-- POSTS PAGE - Display user posts and feed -->
<!-- ============================================================================ -->

<template>
  <div class="posts-page">
    <!-- Create Post Section -->
    <section class="create-post-section">
      <CreatePost />
    </section>

    <!-- Latest Posts Section -->
    <section class="posts-section">
      <h2 class="section-title">Latest Posts</h2>
      
      <div v-if="posts.length === 0" class="empty-state">
        <p>No posts yet. Be the first to share!</p>
      </div>

      <div v-else class="posts-list">
        <PostCard 
          v-for="post in posts" 
          :key="post.id || post._id" 
          :post="post"
          @pewgift="handlepewGift"
          @like="handleLike"
          @comment="handleComment"
          @share="handleShare"
        />
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>Loading posts...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchPosts">Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})
  
import { ref, onMounted } from 'vue'
import CreatePost from '@/components/posts/create-post.vue'
import PostCard from '@/components/posts/post-card.vue'

const posts = ref([])
const loading = ref(false)
const error = ref(null)

/**
 * Fetch posts from backend
 */
const fetchPosts = async () => {
  loading.value = true
  error.value = null
  
  try {
    // TODO: Replace with actual API call
    // const { data } = await $fetch('/api/posts')
    // posts.value = data
    
    console.log('Fetching posts...')
  } catch (err) {
    console.error('Error fetching posts:', err)
    error.value = 'Failed to load posts. Please try again.'
  } finally {
    loading.value = false
  }
}

/**
 * Handle pewgift action from post card
 */
const handlePewgift = (postId) => {
  console.log('Pewgift action triggered for post:', postId)
  // This will be handled by the pewgift-button component in post-card
}

/**
 * Handle like action from post card
 */
const handleLike = (postId) => {
  console.log('Like action triggered for post:', postId)
}

/**
 * Handle comment action from post card
 */
const handleComment = (postId) => {
  console.log('Comment action triggered for post:', postId)
}

/**
 * Handle share action from post card
 */
const handleShare = (postId) => {
  console.log('Share action triggered for post:', postId)
}

/**
 * Initialize page
 */
onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
.posts-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.create-post-section {
  margin-bottom: 30px;
}

.posts-section {
  margin-top: 30px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 16px;
}

.loading {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  color: #c33;
}

.error-message button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #c33;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error-message button:hover {
  background-color: #a22;
}
</style>
