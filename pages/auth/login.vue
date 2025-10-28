<template>
  <div class="landing-page">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <NuxtLink to="/" class="logo-container">
          <div class="logo-box">
            <span class="logo-text">🌐 SocialVerse</span>
          </div>
        </NuxtLink>

        <nav class="nav">
          <a href="#features" class="nav-link features-link">✨ Features</a>
          
          <NuxtLink 
            v-if="!user"
            to="/auth/signin" 
            class="nav-link btn-login"
          >
            Sign In
          </NuxtLink>
          <NuxtLink 
            v-if="!user"
            to="/auth/signup" 
            class="nav-link btn-signup"
          >
            Sign Up
          </NuxtLink>
          
          <NuxtLink 
            v-if="user"
            to="/feed" 
            class="nav-link btn-dashboard"
          >
            Dashboard
          </NuxtLink>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">Welcome to SocialVerse</h1>
        <p class="hero-subtitle">Connect, Share, and Grow Your Network</p>
        <p class="hero-description">
          Join millions of users connecting, streaming, and sharing their passions
        </p>
        
        <div class="hero-buttons">
          <NuxtLink 
            v-if="!user"
            to="/auth/signup" 
            class="btn-hero btn-hero-primary"
          >
            Get Started Free
          </NuxtLink>
          <NuxtLink 
            v-if="!user"
            to="/auth/signin" 
            class="btn-hero btn-hero-secondary"
          >
            Sign In
          </NuxtLink>
          <NuxtLink 
            v-if="user"
            to="/feed" 
            class="btn-hero btn-hero-primary"
          >
            Go to Feed
          </NuxtLink>
        </div>
      </div>

      <div class="hero-image">
        <div class="hero-placeholder">
          <span>🎬</span>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="features-container">
        <h2 class="features-title">Why Choose SocialVerse?</h2>
        
        <div class="features-grid">
          <!-- Feature 1 -->
          <div class="feature-card">
            <div class="feature-icon">🌐</div>
            <h3>Universe Match</h3>
            <p>Connect with people from around the world based on your interests and preferences</p>
          </div>

          <!-- Feature 2 -->
          <div class="feature-card">
            <div class="feature-icon">🎬</div>
            <h3>Live Streaming</h3>
            <p>Stream your moments live and engage with your audience in real-time</p>
          </div>

          <!-- Feature 3 -->
          <div class="feature-card">
            <div class="feature-icon">💬</div>
            <h3>Real-Time Chat</h3>
            <p>Chat instantly with friends and new connections using our advanced messaging system</p>
          </div>

          <!-- Feature 4 -->
          <div class="feature-card">
            <div class="feature-icon">🎁</div>
            <h3>Gifts & Rewards</h3>
            <p>Send and receive gifts, earn rewards, and unlock exclusive features</p>
          </div>

          <!-- Feature 5 -->
          <div class="feature-card">
            <div class="feature-icon">🤝</div>
            <h3>P2P Trading</h3>
            <p>Trade items securely with other users using our escrow system</p>
          </div>

          <!-- Feature 6 -->
          <div class="feature-card">
            <div class="feature-icon">⭐</div>
            <h3>Rank System</h3>
            <p>Build your reputation and unlock premium features as you grow</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2>Ready to Join SocialVerse?</h2>
        <p>Start connecting with people who share your interests today</p>
        
        <div class="cta-buttons">
          <NuxtLink 
            v-if="!user"
            to="/auth/signup" 
            class="btn-cta btn-cta-primary"
          >
            Create Account Now
          </NuxtLink>
          <NuxtLink 
            v-if="!user"
            to="/auth/signin" 
            class="btn-cta btn-cta-secondary"
          >
            Already have an account?
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>SocialVerse</h4>
          <p>Connect, Share, and Grow</p>
        </div>

        <div class="footer-section">
          <h4>Links</h4>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><NuxtLink to="/terms">Terms of Service</NuxtLink></li>
            <li><NuxtLink to="/privacy">Privacy Policy</NuxtLink></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>Support</h4>
          <ul>
            <li><a href="mailto:support@socialverse.com">Contact Us</a></li>
            <li><NuxtLink to="/support">Help Center</NuxtLink></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; 2024 SocialVerse. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const user = ref(null)

onMounted(async () => {
  try {
    const supabase = useSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user.value = authUser
  } catch (error) {
    console.error('[Landing] Error checking auth:', error)
  }
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
}

/* Header */
.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-container {
  text-decoration: none;
  display: flex;
  align-items: center;
}

.logo-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-text {
  color: white;
  font-weight: bold;
  font-size: 1.3rem;
}

.nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  background: none;
  font-size: 1rem;
}

.nav-link:hover {
  color: #667eea;
}

.features-link {
  color: #667eea;
}

.btn-login {
  color: #333;
}

.btn-login:hover {
  background-color: #f0f0f0;
}

.btn-signup {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.6rem 1.2rem;
}

.btn-signup:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-dashboard {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.6rem 1.2rem;
}

/* Hero Section */
.hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

.hero-content {
  color: white;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.95;
}

.hero-description {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-hero {
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
  border: none;
  cursor: pointer;
}

.btn-hero-primary {
  background: white;
  color: #667eea;
}

.btn-hero-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.btn-hero-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
}

.btn-hero-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-3px);
}

.hero-image {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-placeholder {
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

/* Features Section */
.features {
  background: white;
  padding: 4rem 2rem;
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
}

.features-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 3rem;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  padding: 2rem;
  background: #f9fafb;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

/* CTA Section */
.cta-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 4rem 2rem;
  text-align: center;
  color: white;
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
}

.cta-content h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.cta-content p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.95;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-cta {
  padding: 0.9rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.btn-cta-primary {
  background: white;
  color: #667eea;
}

.btn-cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.btn-cta-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
}

.btn-cta-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Footer */
.footer {
  background: #1f2937;
  color: white;
  padding: 3rem 2rem 1rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h4 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #667eea;
}

.footer-section p {
  color: #d1d5db;
  line-height: 1.6;
}

.footer-section ul {
  list-style: none;
}

.footer-section ul li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: #d1d5db;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: #667eea;
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid #374151;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 2rem 1rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .hero-buttons {
    flex-direction: column;
  }

  .btn-hero {
    width: 100%;
    text-align: center;
  }

  .hero-placeholder {
    width: 200px;
    height: 200px;
    font-size: 3rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .nav {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .features-title {
    font-size: 2rem;
  }

  .cta-content h2 {
    font-size: 2rem;
  }

  .cta-buttons {
    flex-direction: column;
  }

  .btn-cta {
    width: 100%;
  }
}
</style>
