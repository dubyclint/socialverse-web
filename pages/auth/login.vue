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
.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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
}

.nav {
  display: flex;
  gap: 1rem;
  align-items: center;
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
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
}

.close-btn:hover {
  color: #333;
}

.modal-content h2 {
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
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
}

.link-button:hover {
  color: #764ba2;
}
</style>
