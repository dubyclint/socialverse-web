<template>
  <main class="main-feed">
    <!-- Content Sections -->
    <div class="feed-container">
      <!-- Trending Posts Section -->
      <section class="feed-section">
        <div class="section-header">
          <h2>🔥 Trending Now</h2>
          <button class="see-all-btn">See All</button>
        </div>
        <div class="posts-grid trending">
          <PostCard 
            v-for="post in trendingPosts" 
            :key="post.id" 
            :post="post"
            :variant="'trending'"
          />
        </div>
      </section>

      <!-- Friends Posts Section -->
      <section class="feed-section">
        <div class="section-header">
          <h2>👥 Friends Updates</h2>
          <button class="see-all-btn">See All</button>
        </div>
        <div class="posts-grid friends">
          <PostCard 
            v-for="post in friendsPosts" 
            :key="post.id" 
            :post="post"
            :variant="'friends'"
          />
        </div>
      </section>

      <!-- Local/Regional Posts -->
      <section class="feed-section">
        <div class="section-header">
          <h2>📍 Local & Regional</h2>
          <button class="see-all-btn">See All</button>
        </div>
        <div class="posts-grid local">
          <PostCard 
            v-for="post in localPosts" 
            :key="post.id" 
            :post="post"
            :variant="'local'"
          />
        </div>
      </section>

      <!-- Sponsored Posts -->
      <section class="feed-section sponsored">
        <div class="section-header">
          <h2>💼 Sponsored</h2>
          <span class="sponsored-label">Ad</span>
        </div>
        <div class="posts-grid sponsored">
          <PostCard 
            v-for="post in sponsoredPosts" 
            :key="post.id" 
            :post="post"
            :variant="'sponsored'"
          />
        </div>
      </section>

      <!-- Verified Badge Posts -->
      <section class="feed-section">
        <div class="section-header">
          <h2>✅ Verified Creators</h2>
          <button class="see-all-btn">See All</button>
        </div>
        <div class="posts-grid verified">
          <PostCard 
            v-for="post in verifiedPosts" 
            :key="post.id" 
            :post="post"
            :variant="'verified'"
          />
        </div>
      </section>

      <!-- News & Announcements -->
      <section class="feed-section">
        <div class="section-header">
          <h2>📢 News & Announcements</h2>
          <button class="see-all-btn">See All</button>
        </div>
        <div class="posts-grid news">
          <PostCard 
            v-for="post in newsPosts" 
            :key="post.id" 
            :post="post"
            :variant="'news'"
          />
        </div>
      </section>

      <!-- Interest-based Posts -->
      <section class="feed-section">
        <div class="section-header">
          <h2>🎯 For You</h2>
          <button class="see-all-btn">See All</button>
        </div>
        <div class="posts-grid interests">
          <PostCard 
            v-for="post in interestPosts" 
            :key="post.id" 
            :post="post"
            :variant="'interests'"
          />
        </div>
      </section>
    </div>

    <!-- Floating Action Button -->
    <button class="fab" @click="createPost">
      <Icon name="plus" size="24" />
    </button>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Sample data - replace with actual API calls
const trendingPosts = ref([
  {
    id: 1,
    author: 'TechGuru',
    avatar: '/avatars/techguru.jpg',
    content: 'The future of Web3 is here! 🚀',
    image: '/posts/web3-future.jpg',
    likes: 1250,
    comments: 89,
    shares: 45,
    timestamp: '2 hours ago',
    verified: true
  },
  // Add more posts...
])

const friendsPosts = ref([
  {
    id: 2,
    author: 'Sarah Johnson',
    avatar: '/avatars/sarah.jpg',
    content: 'Beautiful sunset from my balcony 🌅',
    image: '/posts/sunset.jpg',
    likes: 234,
    comments: 12,
    shares: 8,
    timestamp: '4 hours ago',
    verified: false
  },
  // Add more posts...
])

const localPosts = ref([
  {
    id: 3,
    author: 'NYC Events',
    avatar: '/avatars/nyc-events.jpg',
    content: 'Free concert in Central Park this weekend! 🎵',
    image: '/posts/concert.jpg',
    likes: 567,
    comments: 34,
    shares: 89,
    timestamp: '6 hours ago',
    verified: true
  },
  // Add more posts...
])

const sponsoredPosts = ref([
  {
    id: 4,
    author: 'CryptoExchange',
    avatar: '/avatars/crypto-exchange.jpg',
    content: 'Trade crypto with zero fees for the first month! 💰',
    image: '/posts/crypto-ad.jpg',
    likes: 89,
    comments: 5,
    shares: 12,
    timestamp: '1 hour ago',
    verified: true,
    sponsored: true
  },
  // Add more posts...
])

const verifiedPosts = ref([
  {
    id: 5,
    author: 'Elon Musk',
    avatar: '/avatars/elon.jpg',
    content: 'Mars mission update: We\'re making great progress! 🚀',
    image: '/posts/mars.jpg',
    likes: 15420,
    comments: 2341,
    shares: 5678,
    timestamp: '8 hours ago',
    verified: true
  },
  // Add more posts...
])

const newsPosts = ref([
  {
    id: 6,
    author: 'SocialVerse Official',
    avatar: '/avatars/socialverse.jpg',
    content: 'New features coming next week: Enhanced privacy controls and AI-powered content discovery! 🎉',
    image: '/posts/announcement.jpg',
    likes: 892,
    comments: 156,
    shares: 234,
    timestamp: '12 hours ago',
    verified: true,
    pinned: true
  },
  // Add more posts...
])

const interestPosts = ref([
  {
    id: 7,
    author: 'Photography Pro',
    avatar: '/avatars/photo-pro.jpg',
    content: 'Tips for better smartphone photography 📸',
    image: '/posts/photography-tips.jpg',
    likes: 445,
    comments: 67,
    shares: 23,
    timestamp: '1 day ago',
    verified: false
  },
  // Add more posts...
])

const createPost = () => {
  navigateTo('/create-post')
}

// Load posts on mount
onMounted(() => {
  // Load posts from API
  loadPosts()
})

const loadPosts = async () => {
  // Implement API calls to load different types of posts
  try {
    // const trending = await $fetch('/api/posts/trending')
    // const friends = await $fetch('/api/posts/friends')
    // etc...
  } catch (error) {
    console.error('Error loading posts:', error)
  }
}
</script>

<style scoped>
.main-feed {
  min-height: calc(100vh - 200px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
}

.feed-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.feed-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feed-section:hover {
  transform: translateY(-2px);
}

.feed-section.sponsored {
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  border: 2px solid #fdcb6e;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f8f9fa;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3436;
}

.sponsored .section-header h2 {
  color: #2d3436;
}
.see-all-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.see-all-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.sponsored-label {
  background: #e17055;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.posts-grid.trending {
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
}

.posts-grid.friends {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.posts-grid.sponsored {
  grid-template-columns: 1fr;
  max-width: 600px;
  margin: 0 auto;
}

.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
}

.fab:hover {
  transform: scale(1.1) translateY(-2px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.6);
}

/* Responsive Design */
@media (max-width: 768px) {
  .feed-container {
    padding: 1rem;
    gap: 2rem;
  }
  
  .feed-section {
    padding: 1.5rem;
  }
  
  .posts-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header h2 {
    font-size: 1.25rem;
  }
  
  .fab {
    bottom: 1rem;
    right: 1rem;
    width: 50px;
    height: 50px;
  }
}

@media (max-width: 480px) {
  .feed-container {
    padding: 0.5rem;
  }
  
  .feed-section {
    padding: 1rem;
    border-radius: 12px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>

.
