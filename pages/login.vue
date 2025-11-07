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
            to="/auth/signin"
            class="nav-link btn-login"
          >
            Sign In
          </NuxtLink>
          <NuxtLink
            to="/auth/signup"
            class="nav-link btn-signup"
          >
            Sign Up
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
            to="/auth/signup"
            class="btn-hero btn-hero-primary"
          >
            Get Started Free
          </NuxtLink>
          <NuxtLink
            to="/auth/signin"
            class="btn-hero btn-hero-secondary"
          >
            Sign In
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
          <div class="feature-card">
            <div class="feature-icon">🌐</div>
            <h3>Universe Match</h3>
            <p>Connect with people from around the world based on your interests and preferences</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🎬</div>
            <h3>Live Streaming</h3>
            <p>Stream your moments live and engage with your audience in real-time</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">💬</div>
            <h3>Real-Time Chat</h3>
            <p>Chat instantly with friends and new connections using our advanced messaging system</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🎁</div>
            <h3>Gift & Rewards</h3>
            <p>Send gifts to creators and earn rewards for your engagement</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔐</div>
            <h3>Secure & Private</h3>
            <p>Your privacy and security are our top priorities with end-to-end encryption</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>Cross-Platform</h3>
            <p>Access SocialVerse seamlessly on web, mobile, and desktop</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>About</h4>
          <ul>
            <li><NuxtLink to="/about">About Us</NuxtLink></li>
            <li><NuxtLink to="/blog">Blog</NuxtLink></li>
            <li><NuxtLink to="/careers">Careers</NuxtLink></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>Legal</h4>
          <ul>
            <li><NuxtLink to="/terms">Terms of Service</NuxtLink></li>
            <li><NuxtLink to="/privacy">Privacy Policy</NuxtLink></li>
            <li><NuxtLink to="/cookies">Cookie Policy</NuxtLink></li>
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

<script setup lang=\"ts\">
import { ref } from 'vue'

const user = ref(null)
</script>

<style scoped>
/* Landing Page */
.landing-page {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  min-height: 100vh;
  color: white;
}

/* Header */
.header {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
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
  color: white;
}

.logo-box {
  font-size: 1.5rem;
  font-weight: bold;
}

.logo-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.nav-link:hover {
  color: white;
}

.btn-login {
  color: #cbd5e1;
}

.btn-login:hover {
  color: white;
}

.btn-signup {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.btn-signup:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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

/* Features Section */
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

/* Footer */
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
.footer-section :deep(a) {
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-section a:hover,
.footer-section :deep(a:hover) {
  color: white;
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 2rem 1rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-image {
    display: none;
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
