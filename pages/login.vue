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
            v-if="!user"
            @click="navigateToSignin"
            class="nav-link btn-login"
          >
            Sign In
          </button>
          <button
            v-if="!user"
            @click="navigateToSignup"
            class="nav-link btn-signup"
          >
            Sign Up
          </button>
          
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
          <button
            v-if="!user"
            @click="navigateToSignup"
            class="btn-hero btn-hero-primary"
          >
            Get Started Free
          </button>
          <button
            v-if="!user"
            @click="navigateToSignin"
            class="btn-hero btn-hero-secondary"
          >
            Sign In
          </button>
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

    <!-- Sign In Modal -->
    <div v-if="showSigninModal" class="modal-overlay" @click="showSigninModal = false">
      <div class="modal-content signin-modal" @click.stop>
        <button class="modal-close" @click="showSigninModal = false">×</button>
        <div class="signin-form">
          <h2>Welcome Back</h2>
          <p>Sign in to your SocialVerse account</p>

          <div v-if="signinError" class="error-message">
            {{ signinError }}
          </div>

          <form @submit.prevent="handleSignIn" class="form-group">
            <div>
              <label for="signin-email">Email</label>
              <input
                id="signin-email"
                v-model="signinEmail"
                type="email"
                required
                placeholder="you@example.com"
                :disabled="signinLoading"
              />
            </div>

            <div>
              <label for="signin-password">Password</label>
              <input
                id="signin-password"
                v-model="signinPassword"
                type="password"
                required
                placeholder="••••••••"
                :disabled="signinLoading"
              />
            </div>

            <button type="submit" :disabled="signinLoading" class="btn-signin">
              {{ signinLoading ? 'Signing In...' : 'Sign In' }}
            </button>
          </form>

          <p class="signin-footer">
            Don't have an account?
            <button @click="handleSwitchToSignup" class="link-button">
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const router = useRouter()
const user = ref(null)
const showSigninModal = ref(false)
const signinEmail = ref('')
const signinPassword = ref('')
const signinLoading = ref(false)
const signinError = ref('')

/**
 * Navigate to signup page (full page, not modal)
 */
const navigateToSignup = () => {
  console.log('[Login] Navigating to signup page')
  showSigninModal.value = false
  router.push('/auth/signup')
}

/**
 * Navigate to signin page (full page, not modal)
 */
const navigateToSignin = () => {
  console.log('[Login] Opening signin modal')
  showSigninModal.value = true
}

/**
 * Switch from signin modal to signup page
 */
const handleSwitchToSignup = () => {
  console.log('[Login] Switching from signin modal to signup page')
  showSigninModal.value = false
  router.push('/auth/signup')
}

const handleSignIn = async () => {
  signinError.value = ''
  signinLoading.value = true

  try {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: signinEmail.value,
      password: signinPassword.value
    })

    if (error) {
      signinError.value = error.message
      return
    }

    if (data.session) {
      console.log('[Login] Sign in successful')
      showSigninModal.value = false
      await router.push('/feed')
    }
  } catch (err: any) {
    console.error('[Login] Sign in error:', err)
    signinError.value = err.message || 'An error occurred during sign in'
  } finally {
    signinLoading.value = false
  }
}

onMounted(() => {
  console.log('[Login] Page mounted')
})
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

.btn-dashboard {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: #1e293b;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  position: relative;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.signin-modal {
  max-width: 450px;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #cbd5e1;
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.3s ease;
}

.modal-close:hover {
  color: white;
}

.signin-form h2 {
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.signin-form p {
  color: #cbd5e1;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group div {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  background: rgba(30, 41, 59, 0.5);
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(30, 41, 59, 0.8);
}

.form-group input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-signin {
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.btn-signin:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-signin:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.signin-footer {
  text-align: center;
  margin-top: 1.5rem;
  color: #cbd5e1;
}

.link-button {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 600;
  transition: color 0.3s ease;
  padding: 0;
}

.link-button:hover {
  color: #764ba2;
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
