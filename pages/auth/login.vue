<template>
  <div class="landing-page">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <!-- Logo with Home Link & Container -->
        <NuxtLink to="/auth/login" class="logo-container">
          <div class="logo-box">
            <span class="logo-text">SocialVerse</span>
          </div>
        </NuxtLink>
        
        <nav class="nav">
          <!-- Features in Styled Box -->
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
          <button 
            v-else 
            @click="handleLogout" 
            class="nav-link btn-login"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h2>Welcome to SocialVerse</h2>
        <p>Connect, Share, and Grow with Our Community</p>
        <div class="hero-buttons">
          <button 
            v-if="!user"
            @click="showSignupModal = true" 
            class="btn btn-primary"
          >
            Get Started
          </button>
          <button 
            v-if="!user"
            @click="showLoginModal = true" 
            class="btn btn-secondary"
          >
            Sign In
          </button>
          <button 
            v-else
            @click="goToFeed" 
            class="btn btn-primary"
          >
            Go to Feed
          </button>
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
      <button 
        v-if="!user"
        @click="showSignupModal = true" 
        class="btn btn-primary"
      >
        Create Account
      </button>
      <button 
        v-else
        @click="goToFeed" 
        class="btn btn-primary"
      >
        Explore Now
      </button>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4>SocialVerse</h4>
          <p>Connect, Share, and Grow with Our Community</p>
        </div>
        
        <div class="footer-section">
          <h5>Quick Links</h5>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h5>Legal</h5>
          <ul>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#terms">Terms of Service</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h5>Follow Us</h5>
          <div class="social-links">
            <a href="#" class="social-icon">f</a>
            <a href="#" class="social-icon">𝕏</a>
            <a href="#" class="social-icon">in</a>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; 2024 SocialVerse. All rights reserved.</p>
      </div>
    </footer>

    <!-- LOGIN MODAL -->
    <div v-if="showLoginModal" class="modal-overlay" @click.self="showLoginModal = false">
      <div class="modal-content">
        <button class="modal-close" @click="showLoginModal = false">✕</button>
        
        <div class="auth-form-container">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p class="text-gray-600 mb-8">Sign in to your SocialVerse account</p>

          <form @submit.prevent="handleLogin" class="space-y-4">
            <div>
              <label for="login-email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                id="login-email"
                v-model="loginForm.email"
                type="email"
                required
                placeholder="you@example.com"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="loginForm.loading"
              />
            </div>

            <div>
              <label for="login-password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                id="login-password"
                v-model="loginForm.password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="loginForm.loading"
              />
            </div>

            <div v-if="loginForm.error" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {{ loginForm.error }}
            </div>

            <button
              type="submit"
              :disabled="loginForm.loading"
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {{ loginForm.loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <div class="mt-6 space-y-3">
            <NuxtLink to="/auth/forgot-password" class="block text-center text-sm text-blue-600 hover:text-blue-700">
              Forgot your password?
            </NuxtLink>
            <p class="text-center text-gray-600">
              Don't have an account?
              <button 
                @click="switchToSignup" 
                class="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- SIGNUP MODAL -->
    <div v-if="showSignupModal" class="modal-overlay" @click.self="showSignupModal = false">
      <div class="modal-content">
        <button class="modal-close" @click="showSignupModal = false">✕</button>
        
        <div class="auth-form-container">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p class="text-gray-600 mb-8">Join SocialVerse today</p>

          <form @submit.prevent="handleSignup" class="space-y-4">
            <div>
              <label for="signup-email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                id="signup-email"
                v-model="signupForm.email"
                type="email"
                required
                placeholder="you@example.com"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="signupForm.loading"
              />
            </div>

            <div>
              <label for="signup-password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                id="signup-password"
                v-model="signupForm.password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="signupForm.loading"
              />
            </div>

            <div>
              <label for="signup-confirm" class="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                id="signup-confirm"
                v-model="signupForm.confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="signupForm.loading"
              />
            </div>

            <div v-if="signupForm.error" class="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {{ signupForm.error }}
            </div>

            <button
              type="submit"
              :disabled="signupForm.loading"
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {{ signupForm.loading ? 'Creating account...' : 'Sign Up' }}
            </button>
          </form>

          <div class="mt-6 space-y-3">
            <p class="text-center text-gray-600">
              Already have an account?
              <button 
                @click="switchToLogin" 
                class="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const user = useSupabaseUser()
const supabaseClient = useSupabaseClient()

const showLoginModal = ref(false)
const showSignupModal = ref(false)

const loginForm = ref({
  email: '',
  password: '',
  loading: false,
  error: ''
})

const signupForm = ref({
  email: '',
  password: '',
  confirmPassword: '',
  loading: false,
  error: ''
})

// Navigate to feed
const goToFeed = async () => {
  try {
    await navigateTo('/feed')
  } catch (err) {
    console.error('Navigation error:', err)
  }
}

// Handle Login
const handleLogin = async () => {
  loginForm.value.error = ''
  loginForm.value.loading = true

  try {
    if (!supabaseClient) {
      loginForm.value.error = 'Authentication service not available'
      return
    }

    const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: loginForm.value.email,
      password: loginForm.value.password
    })

    if (signInError) {
      loginForm.value.error = signInError.message || 'Failed to sign in'
      return
    }

    if (data.user) {
      // Store user data
      localStorage.setItem('auth_token', data.session?.access_token || '')
      localStorage.setItem('user', JSON.stringify(data.user))

      // Update auth store if available
      try {
        const authStore = useAuthStore()
        authStore.user = data.user
        authStore.sessionValid = true
      } catch (err) {
        console.warn('Auth store not available')
      }

      // Close modal and redirect
      showLoginModal.value = false
      await goToFeed()
    }
  } catch (err: any) {
    console.error('Login error:', err)
    loginForm.value.error = err.message || 'An error occurred during sign in'
  } finally {
    loginForm.value.loading = false
  }
}

// Handle Signup
const handleSignup = async () => {
  signupForm.value.error = ''

  // Validate passwords match
  if (signupForm.value.password !== signupForm.value.confirmPassword) {
    signupForm.value.error = 'Passwords do not match'
    return
  }

  signupForm.value.loading = true

  try {
    if (!supabaseClient) {
      signupForm.value.error = 'Authentication service not available'
      return
    }

    const { data, error: signUpError } = await supabaseClient.auth.signUp({
      email: signupForm.value.email,
      password: signupForm.value.password
    })

    if (signUpError) {
      signupForm.value.error = signUpError.message || 'Failed to sign up'
      return
    }

    if (data.user) {
      // Store user data
      localStorage.setItem('auth_token', data.session?.access_token || '')
      localStorage.setItem('user', JSON.stringify(data.user))

      // Update auth store if available
      try {
        const authStore = useAuthStore()
        authStore.user = data.user
        authStore.sessionValid = true
      } catch (err) {
        console.warn('Auth store not available')
      }

      // Close modal and redirect
      showSignupModal.value = false
      await goToFeed()
    }
  } catch (err: any) {
    console.error('Signup error:', err)
    signupForm.value.error = err.message || 'An error occurred during sign up'
  } finally {
    signupForm.value.loading = false
  }
}

// Handle Logout
const handleLogout = async () => {
  try {
    await supabaseClient.auth.signOut()
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    
    try {
      const authStore = useAuthStore()
      authStore.user = null
      authStore.sessionValid = false
    } catch (err) {
      console.warn('Auth store not available')
    }

    await navigateTo('/')
  } catch (err) {
    console.error('Logout error:', err)
  }
}

// Switch between login and signup modals
const switchToSignup = () => {
  showLoginModal.value = false
  showSignupModal.value = true
}

const switchToLogin = () => {
  showSignupModal.value = false
  showLoginModal.value = true
}

// If user is already authenticated, redirect to feed
onMounted(() => {
  if (user.value) {
    goToFeed()
  }
})

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
  padding: 1rem 2rem;
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
  gap: 2rem;
}

/* Logo Container */
.logo-container {
  text-decoration: none;
  display: flex;
  align-items: center;
}

.logo-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.logo-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
}

/* Navigation */
.nav {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: all 0.3s ease;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.nav-link:hover {
  color: #667eea;
}

/* Features Badge */
.features-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0.5rem 1.25rem;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
}

.features-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.features-link {
  text-decoration: none;
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Buttons */
.btn-login {
  background: #667eea;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-login:hover {
  background: #764ba2;
  transform: translateY(-2px);
}

.btn-signup {
  background: white;
  color: #667eea;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  border: 2px solid #667eea;
  transition: all 0.3s ease;
  font-weight: 600;
}

.btn-signup:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
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
  font-size: 3.5rem;
  margin: 0 0 1rem 0;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hero-content p {
  font-size: 1.25rem;
  margin: 0 0 2rem 0;
  opacity: 0.95;
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
  border-radius: 8px;
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
  font-size: 2.5rem;
  margin: 0 0 3rem 0;
  color: #333;
  font-weight: 700;
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
  border: 1px solid #e9ecef;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  background: white;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h4 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
  color: #333;
  font-weight: 600;
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
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.cta p {
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
  opacity: 0.95;
}

/* Footer */
.footer {
  background: rgba(0, 0, 0, 0.15);
  color: white;
  padding: 3rem 2rem 1.5rem;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.footer-section h4 {
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.footer-section h5 {
  font-size: 1rem;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.footer-section p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section ul li {
  margin-bottom: 0.75rem;
}

.footer-section ul li a {
  color: white;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.3s ease;
  font-size: 0.95rem;
}

.footer-section ul li a:hover {
  opacity: 1;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 600;
}

.social-icon:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  opacity: 0.8;
  font-size: 0.9rem;
}

.footer-bottom p {
  margin: 0;
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 100%;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  z-index: 10;
}

.modal-close:hover {
  color: #333;
}

.auth-form-container {
  padding: 2rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-content {
    gap: 1rem;
  }

  .hero-content h2 {
    font-size: 2.5rem;
  }

  .features h3 {
    font-size: 2rem;
  }

  .cta h3 {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .logo-box {
    padding: 0.5rem 1rem;
  }

  .logo-text {
    font-size: 1.25rem;
  }

  .nav {
    width: 100%;
    justify-content: center;
    gap: 0.75rem;
  }

  .hero {
    padding: 2rem 1rem;
  }

  .hero-content h2 {
    font-size: 2rem;
  }

  .hero-content p {
    font-size: 1rem;
  }

  .hero-buttons {
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn {
    width: 100%;
  }

  .features {
    padding: 2rem 1rem;
  }

  .features h3 {
    font-size: 1.75rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .cta {
    padding: 2rem 1rem;
  }

  .cta h3 {
    font-size: 1.75rem;
  }

  .footer-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .footer {
    padding: 2rem 1rem 1rem;
  }

  .modal-content {
    max-width: 90%;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0.75rem;
  }

  .header-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .nav {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
  }

  .nav-link,
  .btn-login,
  .btn-signup,
  .features-badge {
    width: 100%;
    text-align: center;
  }

  .logo-text {
    font-size: 1.1rem;
  }

  .hero-content h2 {
    font-size: 1.5rem;
  }

  .hero-content p {
    font-size: 0.9rem;
  }

  .features h3,
  .cta h3 {
    font-size: 1.5rem;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .footer-section h4,
  .footer-section h5 {
    font-size: 0.95rem;
  }

  .modal-content {
    max-width: 95%;
  }

  .auth-form-container {
    padding: 1.5rem;
  }
}
</style>
