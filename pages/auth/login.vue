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
          <button 
            v-else 
            @click="handleLogout" 
            class="nav-link btn-logout"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">Welcome to SocialVerse</h1>
        <p class="hero-subtitle">Connect, Share, and Grow Your Network Solid </p>
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
          <NuxtLink 
            v-if="user"
            to="/feed" 
            class="btn-hero btn-hero-primary"
          >
            Go to Feed
          </NuxtLink>
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
            <h3>Universe Match Meet&Chat </h3>
            <p>Connect with people from around the world and expand your circle based STRICTLY on your interest,Lists and likes filters. cross and meet NOW.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Secure & Private escrow </h3>
            <p> No Problem if the other party is unknown. leave the trust and security create the deal today submit your deal terms and condition our full dedicated TEAM and system is waiting to implement it and deliver it strictly T&Cs applies.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>P2P & SOXM Features </h3>
            <p> have you tried the p2p feature? or the incoming SOXM Feature with a new world definition of what payment,ecommerce and outsourcing should be like in ERA AI, web3 and computing?.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💬</div>
            <h3>Real-time Chat</h3>
            <p>isnt society and civilization changing fast? lets think chats realtime and beyound what is available today.check it out and more updates.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3> Wallet </h3>
            <p> Are you aware your the private chat,the live stream, the universe match,the group chat,the posts ,the comments are all user revenue streams ? yes pewgift , you can gift and recieve gifts can instanly and it reflects in your wallat ballance instantly, you withdrwal by swap to crypto on your wallet or trade it in the p2p section for your local currency . our GIG pew economy and ecosystem got you covered. always check us for more user centric policies and features. T&Cs Applies .</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎨</div>
            <h3>Customizable </h3>
            <p>Discover other features now , the  like live stream, the Adcenter.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2>Ready to Join SocialVerse?</h2>
        <p>Start connecting with people today and build your netwoth & network.</p>
        <button 
          v-if="!user"
          @click="showSignupModal = true" 
          class="btn-cta"
        >
          Create Account Now
        </button>
        <NuxtLink 
          v-if="user"
          to="/feed" 
          class="btn-cta"
        >
          Go to Your Feed
        </NuxtLink>
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
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Follow Us</h4>
          <div class="social-links">
            <a href="#" class="social-link">Twitter</a>
            <a href="#" class="social-link">Facebook</a>
            <a href="#" class="social-link">Instagram</a>
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
import { ref, onMounted, watch } from 'vue'

const user = useSupabaseUser()
const supabaseClient = useSupabaseClient()
const userStore = useUserStore()
const router = useRouter()

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
    await router.push('/feed')
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

    // Validate inputs
    if (!loginForm.value.email || !loginForm.value.password) {
      loginForm.value.error = 'Email and password are required'
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

    if (data.user?.id) {
      // CRITICAL: Verify user ID exists before storing
      console.log('[Login] User authenticated with ID:', data.user.id)
      
      // Store user data
      localStorage.setItem('auth_token', data.session?.access_token || '')
      localStorage.setItem('user', JSON.stringify(data.user))

      // Initialize user store with profile
      await userStore.initializeSession()

      // Close modal and redirect
      showLoginModal.value = false
      await goToFeed()
    } else {
      loginForm.value.error = 'User ID not available from authentication'
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
  signupForm.value.loading = true

  try {
    if (!supabaseClient) {
      signupForm.value.error = 'Authentication service not available'
      return
    }

    // Validate inputs
    if (!signupForm.value.email || !signupForm.value.password) {
      signupForm.value.error = 'Email and password are required'
      return
    }

    if (signupForm.value.password !== signupForm.value.confirmPassword) {
      signupForm.value.error = 'Passwords do not match'
      return
    }

    if (signupForm.value.password.length < 6) {
      signupForm.value.error = 'Password must be at least 6 characters'
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

    if (data.user?.id) {
      console.log('[Signup] User created with ID:', data.user.id)
      
      // Store user data
      localStorage.setItem('auth_token', data.session?.access_token || '')
      localStorage.setItem('user', JSON.stringify(data.user))

      // Initialize user store
      await userStore.initializeSession()

      // Close modal and redirect
      showSignupModal.value = false
      await goToFeed()
    } else {
      signupForm.value.error = 'User ID not available from authentication'
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
    userStore.clearProfile()
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    await router.push('/')
  } catch (err) {
    console.error('Logout error:', err)
  }
}

// Redirect to feed if already logged in
watch(user, (newUser) => {
  if (newUser?.id) {
    goToFeed()
  }
}, { immediate: true })
</script>

<style scoped>
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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
  width: 100%;
}

.logo-container {
  text-decoration: none;
  flex-shrink: 0;
}

.logo-box {
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.logo-text {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
  white-space: nowrap;
}

.nav {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.features-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

.features-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
}

.nav-link {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-login {
  border: 2px solid white;
}

.btn-login:hover {
  background: white;
  color: #667eea;
}

.btn-signup {
  background: white;
  color: #667eea;
  font-weight: 600;
}

.btn-signup:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-logout {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid white;
}

.btn-logout:hover {
  background: white;
  color: #667eea;
}

/* Hero Section Styles */
.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 2rem;
  text-align: center;
  flex: 1;
}

.hero-content {
  max-width: 600px;
  color: white;
  width: 100%;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.95;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
  line-height: 1.4;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-hero {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  min-width: 150px;
}

.btn-hero-primary {
  background: white;
  color: #667eea;
}

.btn-hero-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.btn-hero-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-hero-secondary:hover {
  background: white;
  color: #667eea;
  transform: translateY(-3px);
}

/* Features Section Styles */
.features {
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.features-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  text-align: center;
  margin-bottom: 3rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  color: white;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.feature-card p {
  font-size: 0.95rem;
  opacity: 0.9;
  line-height: 1.6;
}

/* CTA Section */
.cta-section {
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.08);
  text-align: center;
  color: white;
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
}

.cta-content h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.cta-content p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.btn-cta {
  padding: 1rem 2.5rem;
  font-size: 1rem;
  font-weight: 600;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

/* Footer Styles */
.footer {
  background: rgba(0, 0, 0, 0.3);
  color: white;
  padding: 3rem 2rem 1rem;
  margin-top: auto;
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
  font-weight: 600;
}

.footer-section p {
  font-size: 0.9rem;
  opacity: 0.8;
  line-height: 1.6;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section ul li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.footer-section a:hover {
  opacity: 1;
  text-decoration: underline;
}

.social-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.social-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.2);
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.85rem;
  opacity: 0.7;
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
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  margin: auto;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #333;
}

.modal-content h2 {
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
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
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.signup-link,
.login-link {
  text-align: center;
  margin-top: 1rem;
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
  transition: color 0.3s ease;
}

.link-button:hover {
  color: #764ba2;
}

/* Mobile Responsive Styles */
@media (max-width: 1024px) {
  .header-content {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .nav {
    width: 100%;
    justify-content: space-between;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .features-title {
    font-size: 2rem;
  }

  .feature-card {
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 0.75rem 1rem;
  }

  .logo-text {
    font-size: 1.2rem;
  }

  .nav {
    gap: 0.5rem;
  }

  .nav-link {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }

  .features-badge {
    padding: 0.4rem 0.8rem;
  }

  .features-link {
    font-size: 0.85rem;
  }

  .hero {
    min-height: auto;
    padding: 2rem 1rem;
  }

  .hero-title {
    font-size: 2rem;
    margin-bottom: 0.75rem;
  }

  .hero-subtitle {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  .hero-buttons {
    gap: 0.75rem;
  }

  .btn-hero {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
    min-width: 120px;
  }

  .features {
    padding: 2rem 1rem;
  }

  .features-title {
    font-size: 1.5rem;
    margin-bottom: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .feature-card {
    padding: 1.5rem;
  }

  .feature-icon {
    font-size: 2.5rem;
  }

  .feature-card h3 {
    font-size: 1.2rem;
  }

  .feature-card p {
    font-size: 0.9rem;
  }

  .cta-section {
    padding: 2rem 1rem;
  }

  .cta-content h2 {
    font-size: 1.5rem;
  }

  .cta-content p {
    font-size: 1rem;
  }

  .btn-cta {
    padding: 0.75rem 2rem;
    font-size: 0.95rem;
  }

  .footer {
    padding: 2rem 1rem 1rem;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .footer-section h4 {
    font-size: 1rem;
  }

  .footer-section p {
    font-size: 0.85rem;
  }

  .modal-content {
    padding: 1.5rem;
    max-width: 90%;
  }

  .modal-content h2 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }

  .form-group label {
    font-size: 0.9rem;
  }

  .form-group input {
    padding: 0.65rem;
    font-size: 0.95rem;
  }

  .btn-submit {
    padding: 0.65rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0.5rem 0.75rem;
  }

  .logo-box {
    padding: 0.4rem 0.75rem;
  }

  .logo-text {
    font-size: 1rem;
  }

  .nav {
    gap: 0.25rem;
  }

  .nav-link {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }

  .features-badge {
    padding: 0.3rem 0.6rem;
  }

  .features-link {
    font-size: 0.75rem;
  }

  .hero {
    padding: 1.5rem 1rem;
  }

  .hero-title {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .hero-subtitle {
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .hero-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn-hero {
    width: 100%;
    padding: 0.65rem 1rem;
    font-size: 0.9rem;
  }

  .features {
    padding: 1.5rem 1rem;
  }

  .features-title {
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
  }

  .features-grid {
    gap: 1rem;
  }

  .feature-card {
    padding: 1rem;
  }

  .feature-icon {
    font-size: 2rem;
    margin-bottom: 0.75rem;
  }

  .feature-card h3 {
    font-size: 1rem;
    margin-bottom: 0.3rem;
  }

  .feature-card p {
    font-size: 0.8rem;
  }

  .cta-section {
    padding: 1.5rem 1rem;
  }

  .cta-content h2 {
    font-size: 1.3rem;
    margin-bottom: 0.75rem;
  }

  .cta-content p {
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .btn-cta {
    padding: 0.65rem 1.5rem;
    font-size: 0.9rem;
  }

  .footer {
    padding: 1.5rem 1rem 0.75rem;
  }

  .footer-content {
    gap: 1rem;
  }

  .footer-section h4 {
    font-size: 0.95rem;
    margin-bottom: 0.75rem;
  }

  .footer-section p {
    font-size: 0.8rem;
  }

  .footer-section ul li {
    margin-bottom: 0.4rem;
  }

  .footer-section a {
    font-size: 0.8rem;
  }

  .social-links {
    gap: 0.5rem;
  }

  .social-link {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .footer-bottom {
    font-size: 0.75rem;
    padding-top: 1rem;
  }

  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-content {
    padding: 1.25rem;
    max-width: 95%;
  }

  .close-btn {
    font-size: 1.25rem;
  }

  .modal-content h2 {
    font-size: 1.2rem;
    margin-bottom: 0.75rem;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-group label {
    font-size: 0.85rem;
    margin-bottom: 0.3rem;
  }

  .form-group input {
    padding: 0.6rem;
    font-size: 0.9rem;
  }

  .btn-submit {
    padding: 0.6rem;
    font-size: 0.9rem;
    margin-top: 0.75rem;
  }

  .signup-link,
  .login-link {
    font-size: 0.85rem;
    margin-top: 0.75rem;
  }
}

/* Landscape Mobile */
@media (max-height: 600px) and (orientation: landscape) {
  .hero {
    min-height: auto;
    padding: 1rem;
  }

  .hero-title {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .hero-subtitle {
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .btn-hero {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
}
</style>
