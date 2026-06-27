<template>
  <div class="landing-page">
    <header class="header">
      <div class="header-content">
        <NuxtLink to="/" class="logo-container">
          <div class="logo-box">
            <Icon name="sparkles" size="24" />
            <span class="logo-text">SocialVerse</span>
          </div>
        </NuxtLink>

        <nav class="nav">
          <button class="nav-link" @click="goToSignin">Sign In</button>
          <button class="cta-button" @click="goToSignup">Get Started</button>
        </nav>
      </div>
    </header>

    <main class="hero">
      <div class="hero-content">
        <h1>Encrypted social messaging for modern communities</h1>
        <p>
          Connect, share, and engage with privacy-first messaging, social feeds,
          and creator-driven experiences.
        </p>
        <div class="hero-actions">
          <button class="cta-button large" @click="goToSignup">Create account</button>
          <button class="secondary-button large" @click="goToSignin">I already have an account</button>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>Product</h4>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#security">Security</a></li>
            <li><a href="#community">Community</a></li>
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
        <p>&copy; 2026 SocialVerse. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'blank',
  middleware: []
})

// IMPORTANT: use canonical existing routes (no /auth/signin or /auth/signup)
const goToSignin = async () => {
  await navigateTo('/signin')
}

const goToSignup = async () => {
  await navigateTo('/signup')
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
  font-size: 1.25rem;
  font-weight: 700;
}
.nav {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.nav-link,
.cta-button,
.secondary-button {
  border: none;
  cursor: pointer;
  border-radius: 10px;
  padding: 0.65rem 1rem;
  font-weight: 600;
}
.nav-link {
  background: transparent;
  color: #cbd5e1;
}
.cta-button {
  background: #2563eb;
  color: #fff;
}
.secondary-button {
  background: #334155;
  color: #fff;
}
.hero {
  min-height: 65vh;
  display: grid;
  place-items: center;
  padding: 2rem;
}
.hero-content {
  max-width: 760px;
  text-align: center;
}
.hero-actions {
  margin-top: 1.25rem;
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}
.large {
  padding: 0.85rem 1.15rem;
}
.footer {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  margin-top: 2rem;
  padding: 2rem;
}
.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}
.footer-section h4 {
  margin-bottom: 0.75rem;
}
.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.footer-section li {
  margin-bottom: 0.35rem;
}
.footer-bottom {
  max-width: 1200px;
  margin: 1.25rem auto 0;
  color: #94a3b8;
}
@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
  }
}
</style>
