<!-- ============================================================================
FILE: /pages/auth/verify-email.vue - EMAIL VERIFICATION PAGE
============================================================================
This page handles email verification when user clicks the link in their email
============================================================================ -->

<template>
  <div class="verify-email-container">
    <div class="verify-email-card">
      <div class="verify-email-header">
        <NuxtLink to="/" class="logo-link">
          <span class="logo-icon">🌐</span>
          <span class="logo-text">SocialVerse</span>
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <h2>Verifying your email...</h2>
        <p>Please wait while we confirm your email address.</p>
      </div>

      <!-- Success State -->
      <div v-else-if="success" class="success-state">
        <div class="success-icon">✅</div>
        <h2>Email Verified!</h2>
        <p>Your email has been successfully verified.</p>
        <p class="redirect-message">Redirecting to login in {{ redirectCountdown }} seconds...</p>
        <NuxtLink to="/auth/signin" class="btn-primary">
          Go to Login Now
        </NuxtLink>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h2>Verification Failed</h2>
        <p class="error-message">{{ error }}</p>
        
        <div class="error-actions">
          <button @click="resendEmail" :disabled="resendLoading" class="btn-primary">
            {{ resendLoading ? 'Sending...' : 'Resend Verification Email' }}
          </button>
          <NuxtLink to="/auth/signin" class="btn-secondary">
            Back to Login
          </NuxtLink>
        </div>

        <div v-if="resendSuccess" class="resend-success">
          ✅ {{ resendSuccess }}
        </div>
      </div>

      <!-- Initial State (shouldn't show) -->
      <div v-else class="initial-state">
        <p>Processing verification...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
  layout: 'blank'
})

const route = useRoute()
const router = useRouter()
const { verifyEmail } = useEmailVerification()

const loading = ref(true)
const success = ref(false)
const error = ref('')
const redirectCountdown = ref(5)
const resendLoading = ref(false)
const resendSuccess = ref('')
const userEmail = ref('')

/**
 * Extract token from URL
 */
const getTokenFromUrl = (): string | null => {
  const token = route.query.token as string
  const hash = route.hash

  if (token) {
    return token
  }

  // Try to extract from hash (some email clients modify URLs)
  if (hash) {
    const hashToken = hash.split('token=')[1]
    if (hashToken) {
      return hashToken.split('&')[0]
    }
  }

  return null
}

/**
 * Verify email on page load
 */
onMounted(async () => {
  console.log('[Verify Email Page] Component mounted')
  
  const token = getTokenFromUrl()
  
  if (!token) {
    console.error('[Verify Email Page] No token found in URL')
    error.value = 'No verification token found. Please check your email link.'
    loading.value = false
    return
  }

  console.log('[Verify Email Page] Token found, verifying...')

  const result = await verifyEmail(token, 'email')

  if (result.success) {
    console.log('[Verify Email Page] ✅ Email verified successfully')
    success.value = true
    loading.value = false

    // Redirect to login after countdown
    const interval = setInterval(() => {
      redirectCountdown.value--
      if (redirectCountdown.value <= 0) {
        clearInterval(interval)
        router.push('/auth/signin')
      }
    }, 1000)
  } else {
    console.error('[Verify Email Page] ✗ Verification failed:', result.error)
    error.value = result.error || 'Email verification failed'
    loading.value = false
  }
})

/**
 * Resend verification email
 */
const resendEmail = async () => {
  const email = prompt('Please enter your email address:')
  
  if (!email) {
    return
  }

  resendLoading.value = true
  resendSuccess.value = ''

  try {
    const { resendVerificationEmail } = useEmailVerification()
    const result = await resendVerificationEmail(email)

    if (result.success) {
      resendSuccess.value = 'Verification email sent! Check your inbox.'
      userEmail.value = email
    } else {
      error.value = result.error || 'Failed to resend email'
    }
  } catch (err) {
    console.error('[Verify Email Page] Resend error:', err)
    error.value = 'Failed to resend verification email'
  } finally {
    resendLoading.value = false
  }
}
</script>

<style scoped>
.verify-email-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.verify-email-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.verify-email-header {
  margin-bottom: 40px;
}

.logo-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-decoration: none;
  color: #333;
  font-size: 24px;
  font-weight: bold;
}

.logo-icon {
  font-size: 32px;
}

.logo-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state h2 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.loading-state p {
  color: #666;
  margin: 0;
}

/* Success State */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.success-icon,
.error-icon {
  font-size: 64px;
}

.success-state h2 {
  font-size: 28px;
  color: #28a745;
  margin: 0;
}

.success-state p {
  color: #666;
  margin: 0;
}

.redirect-message {
  font-size: 14px;
  color: #999;
  font-style: italic;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.error-state h2 {
  font-size: 28px;
  color: #dc3545;
  margin: 0;
}

.error-message {
  color: #666;
  margin: 0;
  padding: 15px;
  background: #f8d7da;
  border-radius: 8px;
  border-left: 4px solid #dc3545;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.resend-success {
  padding: 15px;
  background: #d4edda;
  border-radius: 8px;
  border-left: 4px solid #28a745;
  color: #155724;
  font-size: 14px;
}

/* Buttons */
.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* Responsive */
@media (max-width: 600px) {
  .verify-email-card {
    padding: 30px 20px;
  }

  .verify-email-header {
    margin-bottom: 30px;
  }

  .logo-link {
    font-size: 20px;
  }

  .logo-icon {
    font-size: 28px;
  }
}
</style>
