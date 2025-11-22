<!-- FILE: /pages/index.vue - LANDING PAGE -->
<!-- MARKETING/ONBOARDING PAGE - This is the public landing page -->

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
            <div class="feature-icon">👥</div>
            <h3>Connect & Network</h3>
            <p>Build meaningful connections with people who share your interests</p>
          </div>
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
          <div class="feature-card">
            <div class="feature-icon">💰</div>
            <h3>Monetization</h3>
            <p>Earn rewards and support your favorite creators</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2>Ready to Join SocialVerse?</h2>
        <p>Start connecting with millions of users today</p>
        <button @click="goToSignup" class="btn-cta">
          Create Your Account Now
        </button>
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
            <li><NuxtLink to="/terms-and-policy">Terms</NuxtLink></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Company</h4>
          <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#careers">Careers</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><a href="#privacy">Privacy</a></li>
            <li><NuxtLink to="/terms-and-policy">Terms</NuxtLink></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Follow Us</h4>
          <ul>
            <li><a href="#twitter">Twitter</a></li>
            <li><a href="#facebook">Facebook</a></li>
            <li><a href="#instagram">Instagram</a></li>
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
// Landing page - public page for unauthenticated users
// No middleware needed - this is a public page

definePageMeta({
  layout: 'blank',
  middleware: []  // NO MIDDLEWARE - this is a public landing page
})

// ✅ Use navigateTo() instead of useRouter().push()
// navigateTo() is Nuxt 3's native navigation method that works better with middleware
const goToSignin = async () => {
  console.log('[Index Page] goToSignin() called')
  try {
    console.log('[Index Page] Navigating to /auth/signin')
    await navigateTo('/auth/signin')
    console.log('[Index Page] ✓ Navigation successful')
  } catch (error) {
    console.error('[Index Page] ✗ Navigation error:', error)
  }
}

const goToSignup = async () => {
  console.log('[Index Page] goToSignup() called')
  try {
    console.log('[Index Page] Navigating to /auth/signup')
    await navigateTo('/auth/signup')
    console.log('[Index Page] ✓ Navigation successful')
  } catch (error) {
    console.error('[Index Page] ✗ Navigation error:', error)
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
  color: rgba(226, 232, 240, 0.7);
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.3s ease;
  text-decoration: none;
}

.nav-link:hover {
  color: white;
}

.btn-login {
  color: rgba(226, 232, 240, 0.7);
}

.btn-login:hover {
  color: #3b82f6;
}

.btn-signup {
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 0.375rem;
}

.btn-signup:hover {
  background: #2563eb;
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
  color: rgba(226, 232, 240, 0.8);
}

.hero-description {
  font-size: 1.125rem;
  color: rgba(226, 232, 240, 0.6);
  line-height: 1.6;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-hero {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-hero-primary {
  background: #3b82f6;
  color: white;
}

.btn-hero-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-hero-secondary {
  background: transparent;
  color: #3b82f6;
  border: 2px solid #3b82f6;
}

.btn-hero-secondary:hover {
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-placeholder {
  width: 300px;
  height: 300px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.1);
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

.cta-section {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  padding: 4rem 2rem;
  text-align: center;
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
  font-size: 1.125rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.btn-cta {
  background: white;
  color: #3b82f6;
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
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
  font-size: 1.125rem;
  margin-bottom: 1rem;
}

.footer-section ul {
  list-style: none;
  padding: 0;
}

.footer-section li {
  margin-bottom: 0.75rem;
}

.footer-section a,
.footer-section a:visited {
  color: rgba(226, 232, 240, 0.6);
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
  color: rgba(226, 232, 240, 0.5);
}

@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 2rem 1rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-placeholder {
    width: 200px;
    height: 200px;
  }

  .nav {
    gap: 0.5rem;
  }

  .btn-hero {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
}
</style>
