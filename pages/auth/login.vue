<template>
  <div class="landing-page">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <NuxtLink to="/" class="logo-container">
          <div class="logo-box">
            <span class="logo-text">SocialVerse</span>
          </div>
        </NuxtLink>

        <nav class="nav">
          <div class="features-badge">
            <a href="#features" class="features-link">✨ Features</a>
          </div>

          <button
            v-if="!user"
            @click="showLoginModal = true"
            class="nav-link btn-login"
          >
            Sign In
          </button>
          <button
            v-if="!user"
            @click="showSignupModal = true"
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
        <div class="hero-buttons">
          <button
            v-if="!user"
            @click="showSignupModal = true"
            class="btn-hero btn-hero-primary"
          >
            Get Started
          </button>
          <button
            v-if="!user"
            @click="showLoginModal = true"
            class="btn-hero btn-hero-secondary"
          >
            Sign In
          </button>
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
            <h3>Universe Match Meet & Chat</h3>
            <p>Connect with people from around the world and expand your circle based on your interests, lists, and likes.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Secure & Private Escrow</h3>
            <p>Leave the trust and security to us. Create deals today and submit your terms and conditions.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>P2P & SOXM Features</h3>
            <p>Experience the P2P feature with a new world definition of payment, ecommerce, and outsourcing.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💬</div>
            <h3>Real-time Chat</h3>
            <p>Think beyond what is available today with real-time chats and more features.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>Wallet</h3>
            <p>Your chats, posts, and comments are revenue streams. Withdraw by swapping to crypto or trade in P2P.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎨</div>
            <h3>Discover & Customize</h3>
            <p>Discover live streams, post content, Ad Center, monetization, and more.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2>Ready to Join SocialVerse?</h2>
        <p>Start connecting with people today and build your network.</p>
        <button
          v-if="!user"
          @click="showSignupModal = true"
          class="btn-cta"
        >
          Create Account Now
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>About SocialVerse</h4>
          <p>SocialVerse is a modern social networking platform designed to connect people worldwide.</p>
        </div>
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#" @click.prevent="showLoginModal = true">Sign In</a></li>
            <li><a href="#" @click.prevent="showSignupModal = true">Sign Up</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Support</h4>
          <ul>
            <li><a href="#" target="_blank">Help Center</a></li>
            <li><a href="#" target="_blank">Contact Us</a></li>
            <li><NuxtLink to="/privacy">Privacy Policy</NuxtLink></li>
            <li><NuxtLink to="/terms">Terms of Service</NuxtLink></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Follow Us</h4>
          <div class="social-links">
            <a href="#" class="social-link" target="_blank">Twitter</a>
            <a href="#" class="social-link" target="_blank">Facebook</a>
            <a href="#" class="social-link" target="_blank">Instagram</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 SocialVerse. All rights reserved.</p>
      </div>
    </footer>

    <!-- Login Modal -->
    <div v-if="showLoginModal" class="modal-overlay" @click="showLoginModal = false">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="showLoginModal = false">×</button>

        <h2>Sign In</h2>

        <form @submit.prevent="handleLogin">
          <div v-if="loginForm.error" class="error-message">
            {{ loginForm.error }}
          </div>

          <div class="form-group">
            <label for="login-email">Email</label>
            <input
              id="login-email"
              v-model="loginForm.email"
              type="email"
              required
              placeholder="you@example.com"
              :disabled="loginForm.loading"
            />
          </div>

          <div class="form-group">
            <label for="login-password">Password</label>
            <input
              id="login-password"
              v-model="loginForm.password"
              type="password"
              required
              placeholder="••••••••"
              :disabled="loginForm.loading"
            />
          </div>

          <button
            type="submit"
            class="btn-submit"
            :disabled="loginForm.loading"
          >
            {{ loginForm.loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p class="signup-link">
          Don't have an account?
          <button
            @click="showLoginModal = false; showSignupModal = true"
            class="link-button"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>

    <!-- Signup Modal -->
    <div v-if="showSignupModal" class="modal-overlay" @click="showSignupModal = false">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="showSignupModal = false">×</button>

        <h2>Sign Up</h2>

        <form @submit.prevent="handleSignup">
          <div v-if="signupForm.error" class="error-message">
            {{ signupForm.error }}
          </div>

          <div class="form-group">
            <label for="signup-name">Full Name</label>
            <input
              id="signup-name"
              v-model="signupForm.name"
              type="text"
              required
              placeholder="John Doe"
              :disabled="signupForm.loading"
            />
          </div>

          <div class="form-group">
            <label for="signup-email">Email</label>
            <input
              id="signup-email"
              v-model="signupForm.email"
              type="email"
              required
              placeholder="you@example.com"
              :disabled="signupForm.loading"
            />
          </div>

          <!-- ADDED: Phone Number Field -->
          <div class="form-group">
            <label for="signup-phone">Phone Number</label>
            <input
              id="signup-phone"
              v-model="signupForm.phone"
              type="tel"
              required
              placeholder="+1 (555) 000-0000"
              :disabled="signupForm.loading"
            />
          </div>

          <div class="form-group">
            <label for="signup-password">Password</label>
            <input
              id="signup-password"
              v-model="signupForm.password"
              type="password"
              required
              placeholder="••••••••"
              :disabled="signupForm.loading"
            />
          </div>

          <div class="form-group">
            <label for="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              v-model="signupForm.confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              :disabled="signupForm.loading"
            />
          </div>

          <button
            type="submit"
            class="btn-submit"
            :disabled="signupForm.loading"
          >
            {{ signupForm.loading ? 'Creating account...' : 'Sign Up' }}
          </button>
        </form>

        <p class="login-link">
          Already have an account?
          <button
            @click="showSignupModal = false; showLoginModal = true"
            class="link-button"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'

const user = useSupabaseUser()
const authStore = useAuthStore()
const router = useRouter()

// Modal state
const showLoginModal = ref(false)
const showSignupModal = ref(false)

// Form state
const loginForm = ref({
  email: '',
  password: '',
  loading: false,
  error: ''
})

const signupForm = ref({
  name: '',
  email: '',
  phone: '', // ADDED: Phone field
  password: '',
  confirmPassword: '',
  loading: false,
  error: ''
})

// Handle Login
const handleLogin = async () => {
  loginForm.value.error = ''
  loginForm.value.loading = true

  try {
    // Validate inputs
    if (!loginForm.value.email || !loginForm.value.password) {
      loginForm.value.error = 'Email and password are required'
      return
    }

    // Call login API endpoint
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: loginForm.value.email,
        password: loginForm.value.password
      }
    })

    if (response.success && response.data?.user?.id) {
      console.log('[Login] User authenticated with ID:', response.data.user.id)

      // Store user data and profile
      localStorage.setItem('auth_token', response.data.session?.access_token || '')
      localStorage.setItem('user', JSON.stringify(response.data.user))
      localStorage.setItem('profile', JSON.stringify(response.data.profile))

      // Initialize auth store with profile
      await authStore.initialize()

      // Close modal
      showLoginModal.value = false
      
      // Redirect to feed
      await new Promise(resolve => setTimeout(resolve, 100))
      await router.push('/feed')
    } else {
      loginForm.value.error = 'Login failed. Please try again.'
    }
  } catch (err: any) {
    console.error('Login error:', err)
    loginForm.value.error = err.data?.statusMessage || err.message || 'An error occurred during sign in'
  } finally {
    loginForm.value.loading = false
  }
}

// Handle Signup - CORRECTED: Collects phone number from user
const handleSignup = async () => {
  signupForm.value.error = ''
  signupForm.value.loading = true

  try {
    // Validate inputs - UPDATED: Include phone validation
    if (!signupForm.value.email || !signupForm.value.password || !signupForm.value.name || !signupForm.value.phone) {
      signupForm.value.error = 'All fields are required'
      return
    }

    if (signupForm.value.password !== signupForm.value.confirmPassword) {
      signupForm.value.error = 'Passwords do not match'
      return
    }

    if (signupForm.value.password.length < 8) {
      signupForm.value.error = 'Password must be at least 8 characters'
      return
    }

    // Validate phone format (basic validation - at least 10 digits)
    const phoneDigits = signupForm.value.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      signupForm.value.error = 'Phone number must have at least 10 digits'
      return
    }

    // Call signup API endpoint - creates account in database with phone number
    const response = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        email: signupForm.value.email,
        password: signupForm.value.password,
        fullName: signupForm.value.name,
        username: signupForm.value.name.toLowerCase().replace(/\s+/g, ''),
        phone: signupForm.value.phone // FIXED: Send user's phone number
      }
    })

    if (response.success) {
      console.log('[Signup] Account created successfully')

      // Show success message
      signupForm.value.error = ''
      
      // Close signup modal
      showSignupModal.value = false
      
      // Open login modal for user to sign in
      await new Promise(resolve => setTimeout(resolve, 300))
      showLoginModal.value = true
      
      // Reset signup form
      signupForm.value = {
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        loading: false,
        error: ''
      }
      
      // Pre-fill login email
      loginForm.value.email = signupForm.value.email
    } else {
      signupForm.value.error = 'Signup failed. Please try again.'
    }
  } catch (err: any) {
    console.error('Signup error:', err)
    signupForm.value.error = err.data?.statusMessage || err.message || 'An error occurred during sign up'
  } finally {
    signupForm.value.loading = false
  }
}

// Redirect to feed if already logged in
watch(user, (newUser) => {
  if (newUser?.id) {
    router.push('/feed')
  }
}, { immediate: true })
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  overflow-x: hidden;
}

.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow-x: hidden;
}

/* Header Styles */
.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 1rem;
}

.logo-container {
  text-decoration: none;
  flex-shrink: 0;
}

.logo-box {
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.logo-text {
  font-size: 1.2rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.features-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: none;
}

.features-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s;
  font-size: 0.9rem;
}

.features-link:hover {
  opacity: 0.8;
}

.nav-link {
  background: none;
  border: none;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: all 0.3s;
  font-weight: 500;
  white-space: nowrap;
}

.btn-login {
  border: 2px solid white;
}

.btn-login:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-signup {
  background: white;
  color: #667eea;
}

.btn-signup:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Hero Section */
.hero {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  width: 100%;
}

.hero-content {
  max-width: 600px;
  width: 100%;
}

.hero-title {
  font-size: 2.5rem;
  color: white;
  margin: 0 0 1rem 0;
  font-weight: bold;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 2rem 0;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-hero {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-hero-primary {
  background: white;
  color: #667eea;
  flex: 1;
  min-width: 150px;
}

.btn-hero-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.btn-hero-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  flex: 1;
  min-width: 150px;
}

.btn-hero-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Features Section */
.features {
  padding: 3rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  width: 100%;
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.features-title {
  font-size: 2rem;
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  font-weight: bold;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: white;
  margin: 1rem 0;
  font-size: 1.1rem;
}

.feature-card p {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0;
  font-size: 0.9rem;
}

/* CTA Section */
.cta-section {
  padding: 3rem 1rem;
  text-align: center;
  background: rgba(0, 0, 0, 0.1);
  width: 100%;
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.cta-content h2 {
  font-size: 2rem;
  color: white;
  margin-bottom: 1rem;
}

.cta-content p {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
}

.btn-cta {
  background: white;
  color: #667eea;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* Footer */
.footer {
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.8);
  padding: 2rem 1rem 1rem;
  margin-top: auto;
  width: 100%;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
}

.footer-section h4 {
  color: white;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.footer-section p {
  font-size: 0.85rem;
  line-height: 1.5;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.3s;
  font-size: 0.85rem;
}

.footer-section a:hover {
  color: white;
}

.social-links {
  display: flex;
  gap: 0.75rem;
}

.social-link {
  display: inline-flex;
  width: 35px;
  height: 35px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  font-size: 0.75rem;
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.2);
}

.footer-bottom {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #000;
}

.modal-content h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  word-break: break-word;
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.signup-link,
.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
  font-size: 0.9rem;
}

.link-button {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  transition: color 0.3s;
  font-family: inherit;
  font-size: inherit;
  padding: 0;
}

.link-button:hover {
  color: #764ba2;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    padding: 0 0.5rem;
  }

  .logo-text {
    font-size: 1rem;
  }

  .nav-link {
    padding: 0.4rem 0.5rem;
    font-size: 0.8rem;
  }

  .hero-title {
    font-size: 1.8rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-buttons {
    gap: 0.5rem;
  }

  .btn-hero {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    min-width: 120px;
  }

  .features-title {
    font-size: 1.5rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .feature-card {
    padding: 1rem;
  }

  .feature-icon {
    font-size: 2rem;
  }

  .feature-card h3 {
    font-size: 1rem;
  }

  .feature-card p {
    font-size: 0.85rem;
  }

  .cta-content h2 {
    font-size: 1.5rem;
  }

  .cta-content p {
    font-size: 1rem;
  }

  .btn-cta {
    padding: 0.6rem 1.5rem;
    font-size: 0.9rem;
  }

  .modal-content {
    padding: 1.25rem;
    border-radius: 10px;
  }

  .modal-content h2 {
    font-size: 1.3rem;
    margin-bottom: 1.25rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group input {
    padding: 0.65rem;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0.75rem;
  }

  .header-content {
    padding: 0;
  }

  .logo-box {
    padding: 0.4rem 0.75rem;
  }

  .logo-text {
    font-size: 0.9rem;
  }

  .nav-link {
    padding: 0.35rem 0.4rem;
    font-size: 0.75rem;
  }

  .hero {
    padding: 1.5rem 0.75rem;
  }

  .hero-title {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .hero-subtitle {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .hero-buttons {
    gap: 0.5rem;
    flex-direction: column;
  }

  .btn-hero {
    width: 100%;
    padding: 0.6rem;
    font-size: 0.85rem;
  }

  .features {
    padding: 2rem 0.75rem;
  }

  .features-title {
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
  }

  .features-grid {
    gap: 0.75rem;
  }

  .feature-card {
    padding: 0.75rem;
  }

  .feature-icon {
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
  }

  .feature-card h3 {
    font-size: 0.9rem;
    margin: 0.5rem 0;
  }

  .feature-card p {
    font-size: 0.8rem;
  }

  .cta-section {
    padding: 2rem 0.75rem;
  }

  .cta-content h2 {
    font-size: 1.3rem;
    margin-bottom: 0.75rem;
  }

  .cta-content p {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .btn-cta {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }

  .footer {
    padding: 1.5rem 0.75rem 0.75rem;
  }

  .footer-content {
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .footer-section h4 {
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .footer-section p {
    font-size: 0.8rem;
  }

  .footer-section a {
    font-size: 0.8rem;
  }

  .social-link {
    width: 30px;
    height: 30px;
    font-size: 0.7rem;
  }

  .modal-overlay {
    padding: 0.75rem;
  }

  .modal-content {
    padding: 1rem;
    border-radius: 8px;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    font-size: 1.3rem;
  }

  .modal-content h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 0.85rem;
  }

  .form-group label {
    font-size: 0.9rem;
  }

  .form-group input {
    padding: 0.6rem;
    font-size: 16px;
  }

  .btn-submit {
    padding: 0.65rem;
    font-size: 0.95rem;
  }

  .signup-link,
  .login-link {
    font-size: 0.85rem;
    margin-top: 1rem;
  }
}
</style>
