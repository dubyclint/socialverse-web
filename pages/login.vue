<!-- FILE: /pages/login.vue - COMPLETE FIX -->
<!-- LANDING PAGE - MARKETING/ONBOARDING PAGE -->
<!-- This is the public landing page, NOT the auth page -->

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
          
          <button
            @click="goToSignin"
            class="nav-link btn-login"
          >
            Sign In
          </button>
          <button
            @click="goToSignup"
            class="nav-link btn-signup"
          >
            Sign Up
          </button>
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
          <button
            @click="goToSignup"
            class="btn-hero btn-hero-primary"
          >
            Get Started Free
          </button>
          <button
            @click="goToSignin"
            class="btn-hero btn-hero-secondary"
          >
            Sign In
          </button>
        </div>
      </div>

      <div class="hero-image">
        <div class="hero-placeholder">
          🚀
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">
      <div class="features-container">
        <h2 class="features-title">Why Choose SocialVerse?</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">💬</div>
            <h3>Real-time Chat</h3>
            <p>Connect instantly with friends and communities</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎥</div>
            <h3>Live Streaming</h3>
            <p>Share your moments with the world in real-time</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🤝</div>
            <h3>Community</h3>
            <p>Build and grow your community with like-minded people</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Secure & Private</h3>
            <p>Your data is encrypted and protected</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Fast & Reliable</h3>
            <p>Lightning-fast performance on any device</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🌍</div>
            <h3>Global Reach</h3>
            <p>Connect with people from around the world</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>Product</h4>
          <ul>
            <li><NuxtLink to="/">Home</NuxtLink></li>
            <li><a href="#features">Features</a></li>
            <li><NuxtLink to="/terms">Terms</NuxtLink></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Careers</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><NuxtLink to="/privacy">Privacy</NuxtLink></li>
            <li><NuxtLink to="/terms">Terms</NuxtLink></li>
            <li><a href="#">Contact</a></li>
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
// FILE: /pages/login.vue - SCRIPT SECTION
// Landing page - public page for unauthenticated users

definePageMeta({
  layout: 'blank',
   middleware: []  // NO MIDDLEWARE - this is a public landing page
})

// ✅ CHANGE: Use navigateTo() instead of useRouter().push()
const goToSignin = async () => {
  console.log('[Login Page] goToSignin() called')
  console.log('[Login Page] Current route:', useRoute().path)
  
  try {
    console.log('[Login Page] Navigating to /auth/signin')
    await navigateTo('/auth/signin')
    console.log('[Login Page] ✓ Navigation successful')
  } catch (error) {
    console.error('[Login Page] ✗ Navigation error:', error)
  }
}

const goToSignup = async () => {
  console.log('[Login Page] goToSignup() called')
  console.log('[Login Page] Current route:', useRoute().path)
  
  try {
    console.log('[Login Page] Navigating to /auth/signup')
    await navigateTo('/auth/signup')
    console.log('[Login Page] ✓ Navigation successful')
  } catch (error) {
    console.error('[Login Page] ✗ Navigation error:', error)
  }
}
</script>

<style scoped>
.landing-page {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  min-height: 100vh;
}

.header {
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.logo-container {
  text-decoration: none;
  color: white;
}

.logo-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  background: none;
  border: none;
  color: #cbd5e1;
  cursor: pointer;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.3s ease;
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.nav-link:hover {
  color: white;
}

.btn-login {
  color: #667eea;
}

.btn-login:hover {
  background: rgba(102, 126, 234, 0.1);
}

.btn-signup {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1.5rem;
}

.btn-signup:hover {
  opacity: 0.9;
}

.hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: bold;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: #cbd5e1;
}

.hero-description {
  font-size: 1.1rem;
  color: #94a3b8;
  line-height: 1.6;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-hero-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-hero-secondary {
  background: transparent;
  color: white;
  border: 2px solid rgba(102, 126, 234, 0.5);
}

.btn-hero-secondary:hover {
  border-color: rgba(102, 126, 234, 1);
  background: rgba(102, 126, 234, 0.1);
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-placeholder {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 5rem;
  border: 2px solid rgba(102, 126, 234, 0.3);
}

.features {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
}

.features-container {
  text-align: center;
}

.features-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 3rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.feature-card p {
  opacity: 0.8;
  line-height: 1.6;
}

.footer {
  background: rgba(15, 23, 42, 0.9);
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  padding: 3rem 2rem 1rem;
  margin-top: 4rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h4 {
  margin-bottom: 1rem;
  color: white;
}

.footer-section ul {
  list-style: none;
  padding: 0;
}

.footer-section li {
  margin-bottom: 0.5rem;
}

.footer-section a,
.footer-section a:visited {
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: white;
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  opacity: 0.7;
}

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

  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .nav {
    width: 100%;
    justify-content: center;
  }
}
</style>
