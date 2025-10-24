<template>
  <div class="landing-page">
    <!-- Navigation Header -->
    <header class="header">
      <div class="header-container">
        <div class="logo-section">
          <div class="logo-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2"/>
              <path d="M20 8v24M8 20h24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="20" cy="20" r="4" fill="currentColor"/>
            </svg>
          </div>
          <h1 class="logo-text">SocialVerse</h1>
        </div>
        
        <nav class="nav-menu">
          <a href="#features" class="nav-link">Features</a>
          <a href="#about" class="nav-link">About</a>
          <a href="#pricing" class="nav-link">Pricing</a>
        </nav>

        <div class="header-actions">
          <button 
            v-if="!user" 
            @click="showLoginModal = true" 
            class="btn-header-login"
          >
            Sign In
          </button>
          <button 
            v-else 
            @click="handleLogout" 
            class="btn-header-logout"
          >
            Logout
          </button>
        </div>

        <!-- Mobile Menu Toggle -->
        <button class="mobile-menu-toggle" @click="mobileMenuOpen = !mobileMenuOpen">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <a href="#features" class="mobile-nav-link" @click="mobileMenuOpen = false">Features</a>
        <a href="#about" class="mobile-nav-link" @click="mobileMenuOpen = false">About</a>
        <a href="#pricing" class="mobile-nav-link" @click="mobileMenuOpen = false">Pricing</a>
        <button 
          v-if="!user"
          @click="showLoginModal = true; mobileMenuOpen = false" 
          class="mobile-btn-login"
        >
          Sign In
        </button>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-background">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
      </div>

      <div class="hero-content">
        <div class="hero-text">
          <h2 class="hero-title">
            <span class="title-word">Connect</span>
            <span class="title-word">Share</span>
            <span class="title-word">Grow</span>
          </h2>
          <p class="hero-subtitle">
            The next generation social platform where communities thrive, connections deepen, and opportunities flourish
          </p>

          <div class="hero-buttons">
            <button 
              v-if="!user"
              @click="showSignupModal = true" 
              class="btn-primary btn-lg"
            >
              <span class="btn-text">Start Free Today</span>
              <span class="btn-icon">→</span>
            </button>
            <button 
              v-if="!user"
              @click="showLoginModal = true" 
              class="btn-secondary btn-lg"
            >
              <span class="btn-text">Sign In</span>
            </button>
            <button 
              v-else
              @click="navigateTo('/feed')" 
              class="btn-primary btn-lg"
            >
              <span class="btn-text">Go to Feed</span>
              <span class="btn-icon">→</span>
            </button>
          </div>

          <div class="hero-stats">
            <div class="stat">
              <span class="stat-number">50K+</span>
              <span class="stat-label">Active Users</span>
            </div>
            <div class="stat">
              <span class="stat-number">100K+</span>
              <span class="stat-label">Connections</span>
            </div>
            <div class="stat">
              <span class="stat-number">24/7</span>
              <span class="stat-label">Support</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-image-container">
            <div class="floating-card card-1">
              <div class="card-icon">💬</div>
              <div class="card-text">Real-time Chat</div>
            </div>
            <div class="floating-card card-2">
              <div class="card-icon">🤝</div>
              <div class="card-text">Connect</div>
            </div>
            <div class="floating-card card-3">
              <div class="card-icon">🚀</div>
              <div class="card-text">Grow</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="section-header">
        <h2 class="section-title">Powerful Features</h2>
        <p class="section-subtitle">Everything you need to connect and grow</p>
      </div>

      <div class="features-grid">
        <div class="feature-card" v-for="(feature, index) in features" :key="index">
          <div class="feature-icon-wrapper">
            <div class="feature-icon">{{ feature.icon }}</div>
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
          <div class="feature-link">
            Learn more →
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="about">
      <div class="about-container">
        <div class="about-content">
          <h2 class="section-title">Why SocialVerse?</h2>
          <p class="about-text">
            SocialVerse is built for the modern social experience. We combine cutting-edge technology with human-centered design to create a platform where genuine connections flourish.
          </p>
          
          <div class="about-benefits">
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div class="benefit-text">
                <h4>Privacy First</h4>
                <p>Your data is yours. We never sell or share your information.</p>
              </div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div class="benefit-text">
                <h4>Community Driven</h4>
                <p>Built by users, for users. Your feedback shapes our future.</p>
              </div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div class="benefit-text">
                <h4>Always Secure</h4>
                <p>Enterprise-grade security protects your account 24/7.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="about-visual">
          <div class="about-image">
            <div class="image-placeholder">
              <div class="placeholder-icon">🌐</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="pricing">
      <div class="section-header">
        <h2 class="section-title">Simple, Transparent Pricing</h2>
        <p class="section-subtitle">Choose the plan that works for you</p>
      </div>

      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="pricing-header">
            <h3 class="pricing-title">Starter</h3>
            <p class="pricing-price"><span class="currency">$</span>0<span class="period">/month</span></p>
          </div>
          <ul class="pricing-features">
            <li>✓ Basic profile</li>
            <li>✓ Connect with friends</li>
            <li>✓ Share posts</li>
            <li>✗ Advanced analytics</li>
          </ul>
          <button class="btn-pricing">Get Started</button>
        </div>

        <div class="pricing-card pricing-card-featured">
          <div class="pricing-badge">Most Popular</div>
          <div class="pricing-header">
            <h3 class="pricing-title">Pro</h3>
            <p class="pricing-price"><span class="currency">$</span>9.99<span class="period">/month</span></p>
          </div>
          <ul class="pricing-features">
            <li>✓ Everything in Starter</li>
            <li>✓ Advanced analytics</li>
            <li>✓ Priority support</li>
            <li>✓ Custom profile</li>
          </ul>
          <button class="btn-pricing btn-pricing-featured">Start Free Trial</button>
        </div>

        <div class="pricing-card">
          <div class="pricing-header">
            <h3 class="pricing-title">Enterprise</h3>
            <p class="pricing-price"><span class="currency">Custom</span></p>
          </div>
          <ul class="pricing-features">
            <li>✓ Everything in Pro</li>
            <li>✓ Dedicated support</li>
            <li>✓ API access</li>
            <li>✓ Custom integrations</li>
          </ul>
          <button class="btn-pricing">Contact Sales</button>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="cta-content">
        <h2 class="cta-title">Ready to Join the Community?</h2>
        <p class="cta-subtitle">Start connecting, sharing, and growing today</p>
        <button 
          v-if="!user"
          @click="showSignupModal = true" 
          class="btn-primary btn-lg btn-cta"
        >
          <span class="btn-text">Create Your Account</span>
          <span class="btn-icon">→</span>
        </button>
        <button 
          v-else
          @click="navigateTo('/feed')" 
          class="btn-primary btn-lg btn-cta"
        >
          <span class="btn-text">Explore Now</span>
          <span class="btn-icon">→</span>
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-section">
          <h4 class="footer-title">SocialVerse</h4>
          <p class="footer-description">Connecting communities, one conversation at a time.</p>
        </div>
        <div class="footer-section">
          <h5 class="footer-heading">Product</h5>
          <ul class="footer-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#">Security</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h5 class="footer-heading">Company</h5>
          <ul class="footer-links">
            <li><a href="#">About</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Careers</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h5 class="footer-heading">Legal</h5>
          <ul class="footer-links">
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 SocialVerse. All rights reserved.</p>
      </div>
    </footer>

    <!-- ✅ LOGIN MODAL -->
    <div v-if="showLoginModal" class="modal-overlay" @click.self="showLoginModal = false">
      <div class="modal-content modal-fade-in">
        <button class="modal-close" @click="showLoginModal = false">✕</button>
        
        <div class="auth-form-container">
          <div class="auth-header">
            <h1 class="auth-title">Welcome Back</h1>
            <p class="auth-subtitle">Sign in to your SocialVerse account</p>
          </div>

          <form @submit.prevent="handleLogin" class="auth-form">
            <div class="form-group">
              <label for="login-email" class="form-label">Email Address</label>
              <input
                id="login-email"
                v-model="loginForm.email"
                type="email"
                required
                placeholder="you@example.com"
                class="form-input"
                :disabled="loginForm.loading"
              />
            </div>

            <div class="form-group">
              <label for="login-password" class="form-label">Password</label>
              <input
                id="login-password"
                v-model="loginForm.password"
                type="password"
                required
                placeholder="••••••••"
                class="form-input"
                :disabled="loginForm.loading"
              />
            </div>

            <div v-if="loginForm.error" class="form-error">
              <span class="error-icon">⚠</span>
              {{ loginForm.error }}
            </div>

            <button
              type="submit"
              :disabled="loginForm.loading"
              class="btn-submit"
            >
              {{ loginForm.loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <div class="auth-divider">
            <span>or</span>
          </div>

          <div class="auth-links">
            <NuxtLink to="/auth/forgot-password" class="auth-link">
              Forgot your password?
            </NuxtLink>
            <p class="auth-switch">
              Don't have an account?
              <button 
                @click="switchToSignup" 
                class="auth-switch-btn"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ SIGNUP MODAL -->
    <div v-if="showSignupModal" class="modal-overlay" @click.self="showSignupModal = false">
      <div class="modal-content modal-fade-in">
        <button class="modal-close" @click="showSignupModal = false">✕</button>
        
        <div class="auth-form-container">
          <div class="auth-header">
            <h1 class="auth-title">Create Account</h1>
            <p class="auth-subtitle">Join SocialVerse and start connecting</p>
          </div>

          <form @submit.prevent="handleSignup" class="auth-form">
            <div class="form-group">
              <label for="signup-email" class="form-label">Email Address</label>
              <input
                id="signup-email"
                v-model="signupForm.email"
                type="email"
                required
                placeholder="you@example.com"
                class="form-input"
                :disabled="signupForm.loading"
              />
            </div>

            <div class="form-group">
              <label for="signup-password" class="form-label">Password</label>
              <input
                id="signup-password"
                v-model="signupForm.password"
                type="password"
                required
                placeholder="••••••••"
                class="form-input"
                :disabled="signupForm.loading"
              />
            </div>

            <div class="form-group">
              <label for="signup-confirm" class="form-label">Confirm Password</label>
              <input
                id="signup-confirm"
                v-model="signupForm.confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                class="form-input"
                :disabled="signupForm.loading"
              />
            </div>

            <div v-if="signupForm.error" class="form-error">
              <span class="error-icon">⚠</span>
              {{ signupForm.error }}
            </div>

            <button
              type="submit"
              :disabled="signupForm.loading"
              class="btn-submit"
            >
              {{ signupForm.loading ? 'Creating account...' : 'Sign Up' }}
            </button>
          </form>

          <div class="auth-divider">
            <span>or</span>
          </div>

          <div class="auth-links">
            <p class="auth-switch">
              Already have an account?
              <button 
                @click="switchToLogin" 
                class="auth-switch-btn"
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

const router = useRouter()
const user = useSupabaseUser()
const supabaseClient = useSupabaseClient()

const showLoginModal = ref(false)
const showSignupModal = ref(false)
const mobileMenuOpen = ref(false)

const features = [
  {
    icon: '💬',
    title: 'Real-time Chat',
    description: 'Connect instantly with friends and communities through seamless messaging'
  },
  {
    icon: '🤝',
    title: 'Social Networking',
    description: 'Build meaningful connections and expand your network effortlessly'
  },
  {
    icon: '💰',
    title: 'P2P Trading',
    description: 'Secure peer-to-peer transactions with built-in trust mechanisms'
  },
  {
    icon: '🔒',
    title: 'Escrow Services',
    description: 'Protected transactions with our advanced escrow system'
  },
  {
    icon: '📊',
    title: 'Analytics',
    description: 'Track your growth and engagement with detailed insights'
  },
  {
    icon: '🌍',
    title: 'Global Community',
    description: 'Connect with millions of users worldwide'
  }
]

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
      localStorage.setItem('auth_token', data.session?.access_token || '')
      localStorage.setItem('user', JSON.stringify(data.user))

      try {
        const authStore = useAuthStore()
        authStore.user = data.user
        authStore.sessionValid = true
      } catch (err) {
        console.warn('Auth store not available')
      }

      showLoginModal.value = false
      await navigateTo('/feed')
    }
  } catch (err: any) {
    console.error('Login error:', err)
    loginForm.value.error = err.message || 'An error occurred during sign in'
  } finally {
    loginForm.value.loading = false
  }
}

const handleSignup = async () => {
  signupForm.value.error = ''

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
      localStorage.setItem('auth_token', data.session?.access_token || '')
      localStorage.setItem('user', JSON.stringify(data.user))

      try {
        const authStore = useAuthStore()
        authStore.user = data.user
        authStore.sessionValid = true
      } catch (err) {
        console.warn('Auth store not available')
      }

      showSignupModal.value = false
      await navigateTo('/feed')
    }
  } catch (err: any) {
    console.error('Signup error:', err)
    signupForm.value.error = err.message || 'An error occurred during sign up'
  } finally {
    signupForm.value.loading = false
  }
}

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

const switchToSignup = () => {
  showLoginModal.value = false
  showSignupModal.value = true
}

const switchToLogin = () => {
  showSignupModal.value = false
  showLoginModal.value = true
}

onMounted(() => {
  if (user.value) {
    navigateTo('/feed')
  }
})

definePageMeta({
  layout: 'default'
})

useHead({
  title: 'SocialVerse - Connect, Share, Grow',
  meta: [
    { name: 'description', content: 'The next generation social platform where communities thrive' }
  ]
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #818cf8;
  --secondary: #ec4899;
  --accent: #f59e0b;
  --dark: #1f2937;
  --dark-light: #374151;
  --light: #f9fafb;
  --light-dark: #f3f4f6;
  --border: #e5e7eb;
  --text: #111827;
  --text-light: #6b7280;
  --success: #10b981;
  --error: #ef4444;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: var(--text);
  background: var(--light);
  line-height: 1.6;
}

/* ============ HEADER ============ */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  transition: all 0.3s ease;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  cursor: pointer;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.logo-icon svg {
  width: 24px;
  height: 24px;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.nav-menu {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: var(--text-light);
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--primary);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  transition: width 0.3s ease;
}

.nav-link:hover::after {
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-header-login {
  padding: 0.625rem 1.5rem;
  background: transparent;
  border: 2px solid var(--primary);
  color: var(--primary);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.btn-header-login:hover {
  background: var(--primary);
  color: white;
  transform: translateY(-2px);
}

.btn-header-logout {
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  border: none;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.btn-header-logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.mobile-menu-toggle span {
  width: 24px;
  height: 2px;
  background: var(--text);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.mobile-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid var(--border);
  padding: 1rem 2rem;
  flex-direction: column;
  gap: 1rem;
}

.mobile-nav-link {
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.mobile-nav-link:hover {
  color: var(--primary);
}

.mobile-btn-login {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  border: none;
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* ============ HERO SECTION ============ */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);
  bottom: -50px;
  left: -50px;
  animation-delay: 2s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%);
  top: 50%;
  left: 50%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(30px, -30px); }
  50% { transform: translate(-20px, 20px); }
  75% { transform: translate(20px, 30px); }
}

.hero-content {
  max-width: 1400px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-text {
  animation: slideInLeft 0.8s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.hero-title {
  font-size: clamp(2.5rem, 8vw, 4rem);
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  letter-spacing: -1px;
}

.title-word {
  display: inline-block;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 50%, var(--accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: fadeInUp 0.8s ease-out;
  margin-right: 0.5rem;
}

.title-word:nth-child(2) {
  animation-delay: 0.1s;
}

.title-word:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-light);
  margin-bottom: 2rem;
  line-height: 1.6;
  animation: fadeInUp 0.8s ease-out 0.3s both;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 3rem;
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.btn-primary {
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  border: none;
  color: white;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.2);
}

.btn-primary:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 40px rgba(99, 102, 241, 0.3);
}

.btn-primary:active {
  transform: translateY(-2px);
}

.btn-secondary {
  padding: 1rem 2rem;
  background: transparent;
  border: 2px solid var(--primary);
  color: var(--primary);
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-secondary:hover {
  background: var(--primary);
  color: white;
  transform: translateY(-4px);
}

.btn-lg {
  padding: 1.125rem 2.5rem;
  font-size: 1.1rem;
}

.btn-text {
  display: inline-block;
}

.btn-icon {
  display: inline-block;
  transition: transform 0.3s ease;
}

.btn-primary:hover .btn-icon {
  transform: translateX(4px);
}

.hero-stats {
  display: flex;
  gap: 3rem;
  animation: fadeInUp 0.8s ease-out 0.5s both;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-light);
  margin-top: 0.25rem;
}

.hero-visual {
  position: relative;
  height: 500px;
  animation: slideInRight 0.8s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.hero-image-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.floating-card {
  position: absolute;
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  animation: float 6s ease-in-out infinite;
}

.card-1 {
  width: 150px;
  top: 20px;
  left: 20px;
  animation-delay: 0s;
}

.card-2 {
  width: 150px;
  top: 200px;
  right: 40px;
  animation-delay: 1s;
}

.card-3 {
  width: 150px;
  bottom: 40px;
  left: 60px;
  animation-delay: 2s;
}

.card-icon {
  font-size: 2.5rem;
}

.card-text {
  font-weight: 600;
  text-align: center;
  font-size: 0.95rem;
  color: var(--text);
}

/* ============ FEATURES SECTION ============ */
.features {
  padding: 6rem 2rem;
  background: var(--light);
  position: relative;
  z-index: 1;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
  animation: fadeInUp 0.8s ease-out;
}

.section-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  margin-bottom: 1rem;
  color: var(--text);
}

.section-subtitle {
  font-size: 1.1rem;
  color: var(--text-light);
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
  border: 1px solid var(--border);
  animation: fadeInUp 0.8s ease-out;
  animation-fill-mode: both;
}

.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.2s; }
.feature-card:nth-child(3) { animation-delay: 0.3s; }
.feature-card:nth-child(4) { animation-delay: 0.4s; }
.feature-card:nth-child(5) { animation-delay: 0.5s; }
.feature-card:nth-child(6) { animation-delay: 0.6s; }

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.15);
  border-color: var(--primary);
}

.feature-icon-wrapper {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon-wrapper {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  transform: scale(1.1) rotate(5deg);
}

.feature-icon {
  font-size: 2rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text);
}

.feature-description {
  color: var(--text-light);
  margin-bottom: 1rem;
  line-height: 1.6;
}

.feature-link {
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-block;
}

.feature-card:hover .feature-link {
  transform: translateX(4px);
}

/* ============ ABOUT SECTION ============ */
.about {
  padding: 6rem 2rem;
  background: white;
  position: relative;
  z-index: 1;
}

.about-container {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.about-content {
  animation: slideInLeft 0.8s ease-out;
}

.about-text {
  font-size: 1.1rem;
  color: var(--text-light);
  margin-bottom: 2rem;
  line-height: 1.8;
}

.about-benefits {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.benefit-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.benefit-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.benefit-text h4 {
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
  color: var(--text);
}

.benefit-text p {
  color: var(--text-light);
  font-size: 0.95rem;
}

.about-visual {
  animation: slideInRight 0.8s ease-out;
}

.about-image {
  position: relative;
  height: 400px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-placeholder {
  font-size: 6rem;
  animation: float 6s ease-in-out infinite;
}

.placeholder-icon {
  display: inline-block;
}

/* ============ PRICING SECTION ============ */
.pricing {
  padding: 6rem 2rem;
  background: var(--light);
  position: relative;
  z-index: 1;
}

.pricing-grid {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.pricing-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid var(--border);
  transition: all 0.3s ease;
  position: relative;
  animation: fadeInUp 0.8s ease-out;
  animation-fill-mode: both;
}

.pricing-card:nth-child(1) { animation-delay: 0.1s; }
.pricing-card:nth-child(2) { animation-delay: 0.2s; }
.pricing-card:nth-child(3) { animation-delay: 0.3s; }

.pricing-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.15);
}

.pricing-card-featured {
  border: 2px solid var(--primary);
  transform: scale(1.05);
}

.pricing-card-featured:hover {
  transform: scale(1.05) translateY(-8px);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  left: 20px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.pricing-header {
  margin-bottom: 2rem;
  padding-top: 0.5rem;
}

.pricing-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.pricing-price {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary);
}

.currency {
  font-size: 1.5rem;
}

.period {
  font-size: 1rem;
  color: var(--text-light);
}

.pricing-features {
  list-style: none;
  margin-bottom: 2rem;
}

.pricing-features li {
  padding: 0.75rem 0;
  color: var(--text-light);
  border-bottom: 1px solid var(--border);
}

.pricing-features li:last-child {
  border-bottom: none;
}

.btn-pricing {
  width: 100%;
  padding: 1rem;
  background: transparent;
  border: 2px solid var(--primary);
  color: var(--primary);
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-pricing:hover {
  background: var(--primary);
  color: white;
}

.btn-pricing-featured {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  border: none;
  color: white;
}

.btn-pricing-featured:hover {
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
}

/* ============ CTA SECTION ============ */
.cta {
  padding: 6rem 2rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.cta::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.05"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g></svg>');
  opacity: 0.1;
}

.cta-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.8s ease-out;
}

.cta-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  color: white;
  margin-bottom: 1rem;
}

.cta-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
}

.btn-cta {
  background: white;
  color: var(--primary);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.btn-cta:hover {
  background: var(--light);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

/* ============ FOOTER ============ */
.footer {
  background: var(--dark);
  color: white;
  padding: 4rem 2rem 2rem;
  position: relative;
  z-index: 1;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section {
  animation: fadeInUp 0.8s ease-out;
}

.footer-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-description {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

.footer-heading {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: white;
}

.footer-links {
  list-style: none;
}

.footer-links li {
  margin-bottom: 0.75rem;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: var(--primary);
}

.footer-bottom {
  max-width: 1400px;
  margin: 0 auto;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

/* ============ MODALS ============ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 100%;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-fade-in {
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: var(--text-light);
  z-index: 10;
  transition: all 0.3s ease;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-close:hover {
  background: var(--light-dark);
  color: var(--text);
}

.auth-form-container {
  padding: 3rem 2rem;
}

.auth-header {
  margin-bottom: 2rem;
  text-align: center;
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  color: var(--text-light);
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: var(--text);
  font-size: 0.95rem;
}

.form-input {
  padding: 0.875rem 1rem;
  border: 2px solid var(--border);
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input:disabled {
  background: var(--light-dark);
  cursor: not-allowed;
}

.form-error {
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: var(--error);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideInDown 0.3s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-icon {
  font-size: 1.25rem;
}

.btn-submit {
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  border: none;
  color: white;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
  color: var(--text-light);
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.auth-links {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
}

.auth-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.auth-link:hover {
  color: var(--primary-dark);
}

.auth-switch {
  color: var(--text-light);
  font-size: 0.95rem;
}

.auth-switch-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s ease;
  font-size: inherit;
}

.auth-switch-btn:hover {
  color: var(--primary-dark);
}

/* ============ RESPONSIVE ============ */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    height: 300px;
  }

  .about-container {
    grid-template-columns: 1fr;
  }

  .about-image {
    height: 300px;
  }

  .hero-stats {
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .mobile-menu {
    display: flex;
  }

  .header-actions {
    display: none;
  }

  .hero {
    min-height: auto;
    padding: 3rem 1rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-buttons {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1.5rem;
  }

  .features {
    padding: 4rem 1rem;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .about {
    padding: 4rem 1rem;
  }

  .pricing {
    padding: 4rem 1rem;
  }

  .pricing-card-featured {
    transform: scale(1);
  }

  .pricing-card-featured:hover {
    transform: translateY(-8px);
  }

  .cta {
    padding: 4rem 1rem;
  }

  .cta-title {
    font-size: 1.75rem;
  }

  .footer-container {
    grid-template-columns: 1fr;
  }

  .modal-content {
    max-width: 90vw;
  }

  .auth-form-container {
    padding: 2rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 1rem;
  }

  .logo-text {
    font-size: 1.25rem;
  }

  .hero {
    padding: 2rem 1rem;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .hero-subtitle {
    font-size: 0.95rem;
  }

  .btn-lg {
    padding: 0.875rem 1.5rem;
    font-size: 0.95rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .features-grid {
    gap: 1rem;
  }

  .feature-card {
    padding: 1.5rem;
  }

  .pricing-grid {
    gap: 1rem;
  }

  .pricing-card {
    padding: 1.5rem;
  }

  .cta-title {
    font-size: 1.5rem;
  }

  .cta-subtitle {
    font-size: 1rem;
  }

  .footer-container {
    gap: 1.5rem;
  }

  .modal-content {
    border-radius: 16px;
  }

  .auth-form-container {
    padding: 1.5rem 1rem;
  }

  .auth-title {
    font-size: 1.5rem;
  }
}
</style>
