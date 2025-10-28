<template>
  <div class="signin-page">
    <div class="signin-container">
      <!-- Back to Home -->
      <NuxtLink to="/auth/login" class="back-link">
        ← Back to Home
      </NuxtLink>

      <!-- Sign In Card -->
      <div class="signin-card">
        <div class="signin-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your SocialVerse account</p>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Sign In Form -->
        <form @submit.prevent="handleSignIn" class="signin-form">
          <!-- Email Field -->
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="you@example.com"
              :disabled="loading"
              class="form-input"
            />
          </div>

          <!-- Password Field -->
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              :disabled="loading"
              class="form-input"
            />
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="form-options">
            <label class="remember-me">
              <input v-model="rememberMe" type="checkbox" />
              Remember me
            </label>
            <NuxtLink to="/auth/forgot-password" class="forgot-link">
              Forgot password?
            </NuxtLink>
          </div>

          <!-- Sign In Button -->
          <button
            type="submit"
            :disabled="loading"
            class="btn-signin"
          >
            {{ loading ? 'Signing In...' : 'Sign In' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="divider">
          <span>or</span>
        </div>

        <!-- Social Sign In (Optional) -->
        <div class="social-signin">
          <button @click="handleGitHubSignIn" :disabled="loading" class="btn-social btn-github">
            <span>🐙</span> Sign in with GitHub
          </button>
          <button @click="handleGoogleSignIn" :disabled="loading" class="btn-social btn-google">
            <span>🔍</span> Sign in with Google
          </button>
        </div>

        <!-- Sign Up Link -->
        <div class="signin-footer">
          <p>Don't have an account?</p>
          <NuxtLink to="/auth/signup" class="signup-link">
            Create one now
          </NuxtLink>
        </div>
      </div>

      <!-- Features Preview -->
      <div class="features-preview">
        <div class="preview-item">
          <span class="preview-icon">🌐</span>
          <h3>Connect Globally</h3>
          <p>Meet people from around the world</p>
        </div>
        <div class="preview-item">
          <span class="preview-icon">🎬</span>
          <h3>Stream Live</h3>
          <p>Share your moments in real-time</p>
        </div>
        <div class="preview-item">
          <span class="preview-icon">💬</span>
          <h3>Chat Instantly</h3>
          <p>Connect with your community</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const error = ref('')

const handleSignIn = async () => {
  error.value = ''
  loading.value = true

  try {
    console.log('[SignIn] Attempting to sign in with email:', email.value)

    const supabase = useSupabaseClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (signInError) {
      console.error('[SignIn] Error:', signInError)
      error.value = signInError.message || 'Failed to sign in. Please check your credentials.'
      return
    }

    if (!data.user) {
      error.value = 'Sign in failed. Please try again.'
      return
    }

    console.log('[SignIn] ✅ Successfully signed in:', data.user.email)

    // Store remember me preference
    if (rememberMe.value) {
      localStorage.setItem('rememberEmail', email.value)
    } else {
      localStorage.removeItem('rememberEmail')
    }

    // Redirect to feed
    await router.push('/feed')
  } catch (err: any) {
    console.error('[SignIn] Unexpected error:', err)
    error.value = err.message || 'An unexpected error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleGitHubSignIn = async () => {
  loading.value = true
  try {
    const supabase = useSupabaseClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      error.value = 'GitHub sign in failed. Please try again.'
    }
  } catch (err: any) {
    error.value = 'An error occurred during GitHub sign in.'
  } finally {
    loading.value = false
  }
}

const handleGoogleSignIn = async () => {
  loading.value = true
  try {
    const supabase = useSupabaseClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      error.value = 'Google sign in failed. Please try again.'
    }
  } catch (err: any) {
    error.value = 'An error occurred during Google sign in.'
  } finally {
    loading.value = false
  }
}

// Load remembered email on mount
onMounted(() => {
  const remembered = localStorage.getItem('rememberEmail')
  if (remembered) {
    email.value = remembered
    rememberMe.value = true
  }
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.signin-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.signin-container {
  width: 100%;
  max-width: 900px;
}

.back-link {
  display: inline-block;
  color: white;
  text-decoration: none;
  margin-bottom: 2rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-link:hover {
  transform: translateX(-5px);
}

.signin-card {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin-bottom: 2rem;
}

.signin-header {
  text-align: center;
  margin-bottom: 2rem;
}

.signin-header h1 {
  font-size: 2rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.signin-header p {
  color: #6b7280;
  font-size: 1rem;
}

.error-message {
  background-color: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #dc2626;
  font-size: 0.95rem;
}

.signin-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.form-input {
  padding: 0.875rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #374151;
  font-weight: 500;
}

.remember-me input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.forgot-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #764ba2;
}

.btn-signin {
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-signin:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-signin:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
  color: #9ca3af;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.social-signin {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.btn-social {
  padding: 0.875rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.btn-social:hover:not(:disabled) {
  border-color: #667eea;
  background: #f9fafb;
  transform: translateY(-2px);
}

.btn-social:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-github {
  color: #1f2937;
}

.btn-google {
  color: #1f2937;
}

.signin-footer {
  text-align: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.signin-footer p {
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.signup-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.signup-link:hover {
  color: #764ba2;
}

.features-preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.preview-item {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.preview-item:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
}

.preview-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.preview-item h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.preview-item p {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* Responsive */
@media (max-width: 640px) {
  .signin-card {
    padding: 1.5rem;
  }

  .signin-header h1 {
    font-size: 1.5rem;
  }

  .social-signin {
    grid-template-columns: 1fr;
  }

  .form-options {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .features-preview {
    grid-template-columns: 1fr;
  }
}
</style>
