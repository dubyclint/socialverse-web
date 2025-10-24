<template>
  <div class="landing-page">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <h1 class="logo">SocialVerse</h1>
        <nav class="nav">
          <a href="#features" class="nav-link">Features</a>
          <a href="/auth/login" class="nav-link btn-login">Sign In</a>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h2>Welcome to SocialVerse</h2>
        <p>Connect, Share, and Grow with Our Community</p>
        <div class="hero-buttons">
          <button @click="navigateTo('/auth/signup')" class="btn btn-primary">Get Started</button>
          <button @click="navigateTo('/auth/login')" class="btn btn-secondary">Sign In</button>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <h3>Our Features</h3>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📱</div>
          <h4>Social Networking</h4>
          <p>Connect with friends and share your thoughts</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💬</div>
          <h4>Real-time Chat</h4>
          <p>Instant messaging with your connections</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💰</div>
          <h4>P2P Trading</h4>
          <p>Secure peer-to-peer transactions</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h4>Escrow Services</h4>
          <p>Safe and protected transactions</p>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <h3>Ready to Join?</h3>
      <p>Start your journey with SocialVerse today</p>
      <button @click="navigateTo('/auth/signup')" class="btn btn-primary">Create Account</button>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p>&copy; 2024 SocialVerse. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'SocialVerse - Connect, Share, Grow',
  meta: [
    { name: 'description', content: 'SocialVerse - A modern social networking platform' }
  ]
})
</script>

<style scoped>
.landing-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.logo {
  font-size: 1.75rem;
  font-weight: 700;
  color: #667eea;
  margin: 0;
}

.nav {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #667eea;
}

.btn-login {
  background: #667eea;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 24px;
  transition: background 0.3s ease;
}

.btn-login:hover {
  background: #764ba2;
}

/* Hero Section */
.hero {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: white;
}

.hero-content h2 {
  font-size: 3rem;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.hero-content p {
  font-size: 1.25rem;
  margin: 0 0 2rem 0;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: white;
  color: #667eea;
}

/* Features Section */
.features {
  background: white;
  padding: 4rem 2rem;
  text-align: center;
}

.features h3 {
  font-size: 2rem;
  margin: 0 0 3rem 0;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h4 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.feature-card p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

/* CTA Section */
.cta {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4rem 2rem;
  text-align: center;
}

.cta h3 {
  font-size: 2rem;
  margin: 0 0 1rem 0;
}

.cta p {
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
  opacity: 0.9;
}

/* Footer */
.footer {
  background: #333;
  color: white;
  padding: 2rem;
  text-align: center;
  margin-top: auto;
}

.footer p {
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .nav {
    gap: 1rem;
  }

  .hero-content h2 {
    font-size: 2rem;
  }

  .hero-content p {
    font-size: 1rem;
  }

  .hero-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
