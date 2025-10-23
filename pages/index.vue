<template>
  <div class="homepage">
    <!-- AUTHENTICATED VIEW -->
    <template v-if="isAuthenticated">
      <!-- Header -->
      <LayoutHeader />

      <!-- Main Content -->
      <div class="authenticated-container">
        <!-- Left Sidebar -->
        <aside class="left-sidebar">
          <LayoutSidebar />
        </aside>

        <!-- Center Feed -->
        <main class="feed-container">
          <!-- Post Creator -->
          <div class="post-creator">
            <img :src="userAvatar" alt="Your avatar" class="creator-avatar" />
            <input 
              type="text" 
              placeholder="What's on your mind?"
              @click="navigateTo('/post')"
              class="post-input"
            />
          </div>

          <!-- Posts Feed -->
          <div class="posts-feed">
            <PostCard 
              v-for="post in posts" 
              :key="post.id" 
              :post="post"
            />
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="loading">
            <p>Loading posts...</p>
          </div>

          <!-- Empty State -->
          <div v-if="!loading && posts.length === 0" class="empty-state">
            <p>No posts yet. Follow users to see their posts!</p>
          </div>
        </main>

        <!-- Right Sidebar -->
        <aside class="right-sidebar">
          <LayoutWalletWidget />
        </aside>
      </div>

      <!-- Footer -->
      <LayoutFooter />
    </template>

    <!-- PUBLIC VIEW (NOT AUTHENTICATED) -->
    <template v-else>
      <!-- Public Homepage -->
      <div class="public-homepage">
        <!-- Welcome Section -->
        <section class="welcome-section">
          <div class="welcome-content">
            <img src="/logo.svg" alt="SocialVerse" class="welcome-logo" />
            <h1 class="welcome-title">Welcome to SocialVerse</h1>
            <p class="welcome-subtitle">
              Connect, share, and discover on the decentralized social web.
              Your privacy, your data, your community.
            </p>
          </div>
        </section>

        <!-- Features Showcase -->
        <section class="features-showcase">
          <div class="features-grid">
            <!-- Chat Feature -->
            <div class="feature-card" @click="navigateTo('/auth/login')">
              <div class="feature-icon">
                <Icon name="message-circle" size="48" />
              </div>
              <h3>Chat</h3>
              <p>Connect with friends and communities in real-time</p>
              <button class="feature-btn">Sign In to Chat</button>
            </div>

            <!-- Post Creation Feature -->
            <div class="feature-card" @click="navigateTo('/auth/login')">
              <div class="feature-icon">
                <Icon name="plus-square" size="48" />
              </div>
              <h3>Create Posts</h3>
              <p>Share your thoughts, photos, and videos with the world</p>
              <button class="feature-btn">Sign In to Post</button>
            </div>

            <!-- Wallet/P2P Trading Feature -->
            <div class="feature-card" @click="navigateTo('/auth/login')">
              <div class="feature-icon">
                <Icon name="wallet" size="48" />
              </div>
              <h3>Wallet & P2P Trading</h3>
              <p>Manage your assets and trade peer-to-peer securely</p>
              <button class="feature-btn">Sign In to Trade</button>
            </div>

            <!-- Escrow Feature -->
            <div class="feature-card" @click="navigateTo('/auth/login')">
              <div class="feature-icon">
                <Icon name="shield" size="48" />
              </div>
              <h3>Escrow Services</h3>
              <p>Safe and secure transactions with escrow protection</p>
              <button class="feature-btn">Sign In to Use Escrow</button>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section">
          <h2>Ready to Join SocialVerse?</h2>
          <div class="cta-buttons">
            <NuxtLink to="/auth/signup" class="btn btn-primary">
              <Icon name="user-plus" size="20" />
              Sign Up
            </NuxtLink>
            <NuxtLink to="/auth/login" class="btn btn-secondary">
              <Icon name="log-in" size="20" />
              Sign In
            </NuxtLink>
          </div>
        </section>

        <!-- Footer -->
        <LayoutFooter />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const user = useSupabaseUser()
const isAuthenticated = computed(() => !!user.value)

// Data
const posts = ref([])
const loading = ref(false)
const userAvatar = ref('/default-avatar.png')

// Fetch posts on mount
onMounted(async () => {
  if (isAuthenticated.value) {
    await fetchPosts()
  }
})

// Fetch posts from API/store
const fetchPosts = async () => {
  try {
    loading.value = true
    // Try to fetch from API endpoint
    const { data } = await $fetch('/api/posts', {
      method: 'GET'
    }).catch(() => ({ data: null }))
    
    if (data) {
      posts.value = data
    } else {
      // Fallback to mock data
      posts.value = [
        {
          id: 1,
          username: 'John Doe',
          userAvatar: '/default-avatar.png',
          isVerified: true,
          content: 'Just launched my new project on SocialVerse! 🚀',
          mediaUrl: null,
          likes: [1, 2, 3],
          comments: [1, 2],
          timestamp: new Date()
        },
        {
          id: 2,
          username: 'Jane Smith',
          userAvatar: '/default-avatar.png',
          isVerified: false,
          content: 'Amazing day at the conference! Met some incredible people.',
          mediaUrl: '/sample-post.jpg',
          likes: [1, 2, 3, 4, 5],
          comments: [1, 2, 3],
          timestamp: new Date()
        }
      ]
    }
  } catch (error) {
    console.error('Error fetching posts:', error)
    // Fallback to mock data
    posts.value = [
      {
        id: 1,
        username: 'John Doe',
        userAvatar: '/default-avatar.png',
        isVerified: true,
        content: 'Just launched my new project on SocialVerse! 🚀',
        mediaUrl: null,
        likes: [1, 2, 3],
        comments: [1, 2],
        timestamp: new Date()
      }
    ]
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.homepage {
  width: 100%;
  min-height: 100vh;
}

/* AUTHENTICATED VIEW */
.authenticated-container {
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.left-sidebar {
  position: sticky;
  top: 80px;
  height: fit-content;
}

.feed-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-creator {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.creator-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.post-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.post-input:hover,
.post-input:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.posts-feed {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.right-sidebar {
  position: sticky;
  top: 80px;
  height: fit-content;
}

/* PUBLIC VIEW */
.public-homepage {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.welcome-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: white;
}

.welcome-content {
  max-width: 600px;
}

.welcome-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 2rem;
}

.welcome-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.welcome-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  line-height: 1.6;
}

.features-showcase {
  padding: 4rem 2rem;
  background: white;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.feature-icon {
  color: #667eea;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.feature-card p {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.feature-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.feature-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.cta-section {
  padding: 4rem 2rem;
  text-align: center;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.cta-section h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  border-radius: 24px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

/* Responsive */
@media (max-width: 1024px) {
  .authenticated-container {
    grid-template-columns: 1fr;
  }

  .left-sidebar,
  .right-sidebar {
    display: none;
  }
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .cta-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>


