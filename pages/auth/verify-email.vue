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

<script setup>
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
        type: 'signup'
      }
    })
    
    if (result.success) {
      success.value = true
      setTimeout(() => navigateTo('/feed'), 2000)
    }
  } catch (err: any) {
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
    
    await $fetch('/api/auth/resend-verification', {
      method: 'POST',
      body: { email: email.value }
    })
    
    error.value = 'Verification email sent! Check your inbox.'
  } catch (err: any) {
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  background-color: #efe;
  color: #3c3;
}

.error-icon {
  background-color: #fee;
  color: #c33;
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
}

.action-button,
.secondary-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.action-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.secondary-button {
  background-color: #f0f0f0;
  color: #333;
}

.secondary-button:hover {
  background-color: #e0e0e0;
}
</style>
