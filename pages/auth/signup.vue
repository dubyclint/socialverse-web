<template>
  <div class="signup-page">
    <ClientOnly>
      <div class="signup-container">
        <div class="signup-card">
          <!-- Header -->
          <div class="signup-header">
            <h1>Create Account</h1>
            <p>Join SocialVerse today</p>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSignup" class="signup-form">
            <!-- Email -->
            <div class="form-group">
              <label for="email">Email Address</label>
              <input 
                id="email"
                v-model="formData.email" 
                type="email" 
                placeholder="your@email.com"
                required
                :disabled="loading"
              />
            </div>

            <!-- Username -->
            <div class="form-group">
              <label for="username">Username</label>
              <input 
                id="username"
                v-model="formData.username" 
                type="text" 
                placeholder="username"
                required
                :disabled="loading"
              />
            </div>

            <!-- Password -->
            <div class="form-group">
              <label for="password">Password</label>
              <input 
                id="password"
                v-model="formData.password" 
                type="password" 
                placeholder="••••••••"
                required
                :disabled="loading"
              />
            </div>

            <!-- Full Name (optional) -->
            <div class="form-group">
              <label for="fullName">Full Name (Optional)</label>
              <input 
                id="fullName"
                v-model="formData.fullName" 
                type="text" 
                placeholder="Your Full Name"
                :disabled="loading"
              />
            </div>

            <!-- Error Message -->
            <div v-if="error" class="error-message">
              <span class="error-icon">⚠️</span>
              {{ error }}
            </div>

            <!-- Success Message -->
            <div v-if="successMessage" class="success-message">
              <span class="success-icon">✓</span>
              {{ successMessage }}
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              class="submit-btn"
              :disabled="loading"
            >
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? 'Creating Account...' : 'Sign Up' }}
            </button>
          </form>

          <!-- Divider -->
          <div class="divider">
            <span>or</span>
          </div>

          <!-- Social Login (Optional) -->
          <div class="social-login">
            <button type="button" class="social-btn google-btn" :disabled="loading">
              <span>🔵</span>
              Sign up with Google
            </button>
            <button type="button" class="social-btn github-btn" :disabled="loading">
              <span>⚫</span>
              Sign up with GitHub
            </button>
          </div>

          <!-- Login Link -->
          <div class="login-link">
            <p>Already have an account? 
              <NuxtLink to="/auth/login">Login here</NuxtLink>
            </p>
          </div>

          <!-- Terms -->
          <div class="terms">
            <p>By signing up, you agree to our 
              <a href="/terms">Terms of Service</a> and 
              <a href="/privacy">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuth } from '~/composables/use-auth'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { signup, loading, error: authError } = useAuth()
const successMessage = ref('')
const error = ref('')

const formData = ref({
  email: '',
  password: '',
  username: '',
  fullName: ''
})

const handleSignup = async () => {
  error.value = ''
  successMessage.value = ''

  console.log('[Signup Page] Submitting signup form...')
  
  // Client-side validation
  if (!formData.value.email || !formData.value.password || !formData.value.username) {
    error.value = 'Please fill in all required fields'
    console.error('[Signup Page] Missing required fields')
    return
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.value.email)) {
    error.value = 'Please enter a valid email address'
    return
  }

  // Password validation
  if (formData.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters long'
    return
  }

  // Username validation
  if (formData.value.username.length < 3) {
    error.value = 'Username must be at least 3 characters long'
    return
  }

  try {
    console.log('[Signup Page] Calling signup function...')
    
    const result = await signup({
      email: formData.value.email,
      password: formData.value.password,
      username: formData.value.username,
      fullName: formData.value.fullName || undefined
    })

    console.log('[Signup Page] Signup result:', result)

    if (result.success) {
      console.log('[Signup Page] ✅ Signup successful')
      successMessage.value = result.message || 'Account created! Please check your email to confirm.'
      
      // Clear form
      formData.value = {
        email: '',
        password: '',
        username: '',
        fullName: ''
      }
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigateTo('/auth/verify-email')
      }, 2000)
    } else {
      console.error('[Signup Page] Signup failed:', result.error)
      error.value = result.error || 'Signup failed. Please try again.'
    }
  } catch (err: any) {
    console.error('[Signup Page] Unexpected error:', err)
    error.value = 'An unexpected error occurred. Please try again.'
  }
}

// Watch for auth store errors
watch(() => authError.value, (newError) => {
  if (newError) {
    error.value = newError
  }
})
</script>

<style scoped>
.signup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.signup-container {
  width: 100%;
  max-width: 420px;
}

.signup-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 2rem;
}

.signup-header {
  text-align: center;
  margin-bottom: 2rem;
}

.signup-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.signup-header p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #dc2626;
  padding: 0.75rem;
  background: #fee2e2;
  border-radius: 6px;
  font-size: 0.875rem;
  border-left: 4px solid #dc2626;
}

.error-icon {
  font-size: 1.25rem;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #059669;
  padding: 0.75rem;
  background: #d1fae5;
  border-radius: 6px;
  font-size: 0.875rem;
  border-left: 4px solid #059669;
}

.success-icon {
  font-size: 1.25rem;
}

.submit-btn {
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  color: #d1d5db;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.divider span {
  color: #9ca3af;
  font-size: 0.875rem;
}

.social-login {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.social-btn {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #374151;
}

.social-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.social-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.google-btn:hover:not(:disabled) {
  border-color: #ea4335;
  color: #ea4335;
}

.github-btn:hover:not(:disabled) {
  border-color: #1f2937;
  color: #1f2937;
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.login-link p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.login-link a:hover {
  color: #764ba2;
  text-decoration: underline;
}

.terms {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.terms a {
  color: #667eea;
  text-decoration: none;
}

.terms a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .signup-card {
    padding: 1.5rem;
  }

  .signup-header h1 {
    font-size: 1.5rem;
  }

  .submit-btn {
    padding: 0.75rem;
  }
}
</style>
