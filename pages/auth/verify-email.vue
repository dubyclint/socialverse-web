<template>
  <div class="verify-container">
    <div class="verify-card">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <h2>Verifying your email...</h2>
        <p>Please wait while we confirm your email address.</p>
      </div>
      
      <div v-else-if="success" class="success-state">
        <div class="success-icon">✓</div>
        <h2>Email Verified!</h2>
        <p>Your email has been successfully verified.</p>
        <button @click="navigateTo('/feed')" class="action-button">
          Go to Feed
        </button>
      </div>
      
      <div v-else-if="error" class="error-state">
        <div class="error-icon">✕</div>
        <h2>Verification Failed</h2>
        <p>{{ error }}</p>
        <div class="action-buttons">
          <button @click="resendEmail" class="action-button">
            Resend Verification Email
          </button>
          <button @click="navigateTo('/auth')" class="secondary-button">
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

const loading = ref(true)
const success = ref(false)
const error = ref('')
const email = ref('')

onMounted(async () => {
  try {
    const route = useRoute()
    const token = route.query.token_hash || route.query.token
    
    if (!token) {
      error.value = 'No verification token found. Please check your email link.'
      loading.value = false
      return
    }
    
    // Call verification endpoint
    const result = await $fetch('/api/auth/verify-email', {
      method: 'POST',
      body: {
        token: token as string,
        verifyType: 'signup'  // ✅ FIX: Changed from 'type' to 'verifyType' (avoid reserved keyword)
      }
    })
    
    if (result.success) {
      // ✅ FIX #2: Ensure session is fully initialized after email verification
      const authStore = useAuthStore()
      
      console.log('[VerifyEmail] Email verified, checking session status...')
      
      // Check if session is already initialized
      if (!authStore.sessionValid) {
        console.log('[VerifyEmail] Session not initialized, performing handshake...')
        const handshakeResult = await authStore.performSignupHandshake()
        
        if (handshakeResult.success) {
          console.log('[VerifyEmail] ✅ Session initialized after email verification')
        } else {
          console.warn('[VerifyEmail] Handshake failed but email is verified:', handshakeResult.error)
          // Continue anyway since email is verified
        }
      } else {
        console.log('[VerifyEmail] ✅ Session already initialized')
      }
      
      success.value = true
      setTimeout(() => navigateTo('/feed'), 2000)
    }
  } catch (err: any) {
    console.error('[VerifyEmail] Error:', err)
    error.value = err.data?.statusMessage || err.message || 'Verification failed'
  } finally {
    loading.value = false
  }
})

const resendEmail = async () => {
  try {
    loading.value = true
    error.value = ''
    
    if (!email.value) {
      error.value = 'Please enter your email address'
      loading.value = false
      return
    }
    
    console.log('[VerifyEmail] Resending verification email to:', email.value)
    
    await $fetch('/api/auth/resend-verification', {
      method: 'POST',
      body: { email: email.value }
    })
    
    error.value = 'Verification email sent! Check your inbox.'
  } catch (err: any) {
    console.error('[VerifyEmail] Resend error:', err)
    error.value = err.data?.statusMessage || 'Failed to resend email'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.verify-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.verify-card {
  background: white;
  padding: 3rem 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.loading-state,
.success-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.success-icon,
.error-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
}

.success-icon {
  background-color: #d4edda;
  color: #155724;
}

.error-icon {
  background-color: #f8d7da;
  color: #721c24;
}

h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  margin-top: 1rem;
}

.action-button,
.secondary-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.action-button {
  background-color: #667eea;
  color: white;
}

.action-button:hover {
  background-color: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.secondary-button {
  background-color: #e9ecef;
  color: #333;
}

.secondary-button:hover {
  background-color: #dee2e6;
  transform: translateY(-2px);
}

@media (max-width: 480px) {
  .verify-card {
    padding: 2rem 1.5rem;
  }

  h2 {
    font-size: 1.25rem;
  }

  p {
    font-size: 0.9rem;
  }
}
</style>
