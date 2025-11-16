<template>
  <div class="explore-page">
    <h1>Explore</h1>
    <div class="explore-content">
      <div class="explore-section">
        <h2>Trending Posts</h2>
        <div v-if="loading" class="loading">
          Loading trending content...
        </div>
        <div v-else-if="error" class="error">
          {{ error }}
        </div>
        <div v-else class="posts-grid">
          <div v-for="post in trendingPosts" :key="post.id" class="post-card">
            <div class="post-author">{{ post.author }}</div>
            <div class="post-content">{{ truncateContent(post.content) }}</div>
            <div class="post-date">{{ formatDate(post.created_at) }}</div>
          </div>
        </div>
      </div>
      
      <div class="explore-section">
        <h2>Popular Topics</h2>
        <div class="topics-grid">
          <div class="topic-card">
            <h3>#Technology</h3>
            <p>Latest tech discussions</p>
          </div>
          <div class="topic-card">
            <h3>#Social</h3>
            <p>Connect with others</p>
          </div>
          <div class="topic-card">
            <h3>#Trading</h3>
            <p>P2P marketplace</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})
  
import { ref, onMounted } from 'vue'
useHead({
  title: 'Explore - SocialVerse',
  meta: [
    { name: 'description', content: 'Discover trending content and topics' }
  ]
})

const supabase = useSupabaseClient()

const trendingPosts = ref([])
const loading = ref(false)
const error = ref('')

const loadTrendingPosts = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const { data, error: supabaseError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6)
      
    if (supabaseError) throw supabaseError
    
    trendingPosts.value = data || []
  } catch (err) {
    error.value = 'Failed to load trending posts'
    console.error('Trending posts error:', err)
  } finally {
    loading.value = false
  }
}

const truncateContent = (content) => {
  if (!content) return ''
  return content.length > 150 ? content.slice(0, 150) + '...' : content
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadTrendingPosts()
})
</script>

<style scoped>
.explore-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.explore-page h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 2rem;
}

.explore-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.explore-section h2 {
  margin-bottom: 1.5rem;
  color: #444;
  font-size: 1.5rem;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  border-radius: 8px;
}

.loading {
  background: #f8f9fa;
  color: #6c757d;
}

.error {
  background: #fee;
  color: #c33;
  border: 1px solid #fcc;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.post-card {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
}

.post-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.post-author {
  font-weight: 600;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.post-content {
  color: #333;
  line-height: 1.6;
  margin-bottom: 1rem;
  word-break: break-word;
}

.post-date {
  color: #6c757d;
  font-size: 0.875rem;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.topic-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.topic-card:hover {
  transform: translateY(-4px);
}

.topic-card h3 {
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
}

.topic-card p {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.9;
}
</style>
