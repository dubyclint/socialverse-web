<template>
  <div class="signup-form">
    <h2>Join SocialVerse</h2>
    
    <!-- Step 1: Basic Info -->
    <div v-if="currentStep === 1" class="step">
      <h3>Create Your Account</h3>
      
      <form @submit.prevent="nextStep">
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email"
            v-model="formData.email" 
            type="email" 
            required 
            placeholder="your@email.com"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="username">Username</label>
          <input 
            id="username"
            v-model="formData.username" 
            type="text" 
            required 
            placeholder="@username"
            :disabled="loading"
          />
          <span class="hint">3-30 characters, letters, numbers, underscores, hyphens only</span>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            id="password"
            v-model="formData.password" 
            type="password" 
            required 
            minlength="8"
            placeholder="At least 8 characters"
            @input="validatePasswords"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input 
            id="confirmPassword"
            v-model="formData.confirmPassword" 
            type="password" 
            required 
            placeholder="Confirm your password"
            @input="validatePasswords"
            :disabled="loading"
          />
          <span v-if="passwordMismatch" class="error-text">
            Passwords do not match
          </span>
        </div>

        <button 
          type="submit" 
          class="submit-button" 
          :disabled="!canProceedStep1 || loading"
        >
          {{ loading ? 'Processing...' : 'Next' }}
        </button>
      </form>
    </div>

    <!-- Step 2: Additional Info -->
    <div v-if="currentStep === 2" class="step">
      <h3>Complete Your Profile</h3>
      
      <form @submit.prevent="handleSubmit">
        <div v-if="error" class="error-message-large">
          <div class="error-title">❌ Error</div>
          <div class="error-content">{{ error }}</div>
          <div v-if="errorDetails" class="error-details">
            <pre>{{ errorDetails }}</pre>
          </div>
        </div>
        
        <div v-if="debugInfo" class="debug-panel-large">
          <div class="debug-title">🔍 Debug Info</div>
          <pre class="debug-content">{{ debugInfo }}</pre>
        </div>

        <div class="form-group">
          <label for="fullName">Full Name</label>
          <input 
            id="fullName"
            v-model="formData.fullName" 
            type="text" 
            required 
            placeholder="John Doe"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input 
            id="phone"
            v-model="formData.phone" 
            type="tel" 
            required 
            placeholder="+1 (555) 000-0000"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="bio">Bio (Optional)</label>
          <textarea 
            id="bio"
            v-model="formData.bio" 
            placeholder="Tell us about yourself"
            rows="3"
            :disabled="loading"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="location">Location (Optional)</label>
          <input 
            id="location"
            v-model="formData.location" 
            type="text" 
            placeholder="City, Country"
            :disabled="loading"
          />
        </div>

        <div class="form-actions">
          <button 
            type="button" 
            class="back-button" 
            @click="previousStep"
            :disabled="loading"
          >
            Back
          </button>
          <button 
            type="submit" 
            class="submit-button" 
            :disabled="!canProceedStep2 || loading"
          >
            {{ loading ? 'Creating Account...' : 'Sign Up' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const formData = ref({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  phone: '',
  bio: '',
  location: '',
  interests: []
})

const currentStep = ref(1)
const loading = ref(false)
const error = ref('')
const errorDetails = ref('')
const passwordMismatch = ref(false)
const debugInfo = ref('')

const validatePasswords = () => {
  passwordMismatch.value = formData.value.password !== formData.value.confirmPassword
}

const canProceedStep1 = computed(() => {
  const email = formData.value.email.trim()
  const username = formData.value.username.trim().toLowerCase()
  const password = formData.value.password
  const confirmPassword = formData.value.confirmPassword
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailValid = emailRegex.test(email)
  
  const usernameRegex = /^[a-z0-9_-]+$/
  const usernameValid = username.length >= 3 && username.length <= 30 && usernameRegex.test(username)
  
  validatePasswords()
  
  const passwordValid = password.length >= 8 && password === confirmPassword
  
  return emailValid && usernameValid && passwordValid
})

const canProceedStep2 = computed(() => {
  return formData.value.fullName.trim() !== '' && formData.value.phone.trim() !== ''
})

const nextStep = () => {
  if (currentStep.value === 1 && canProceedStep1.value) {
    currentStep.value = 2
    error.value = ''
    errorDetails.value = ''
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    error.value = ''
    errorDetails.value = ''
  }
}

const handleSubmit = async () => {
  if (!canProceedStep2.value) {
    error.value = 'Please fill in all required fields'
    return
  }
  
  loading.value = true
  error.value = ''
  errorDetails.value = ''
  debugInfo.value = ''
  
  try {
    const payload = {
      email: formData.value.email.toLowerCase().trim(),
      password: formData.value.password,
      username: formData.value.username.trim().toLowerCase(),
      fullName: formData.value.fullName,
      phone: formData.value.phone,
      bio: formData.value.bio,
      location: formData.value.location
    }
    
    console.log('📤 Calling /api/auth/register with payload:', payload)
    
    // ✅ CALL NEW REGISTER ENDPOINT
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: payload
    })
    
    console.log('✅ Register response:', response)
    debugInfo.value = JSON.stringify(response, null, 2)
    
    if (!response?.success) {
      error.value = response?.message || 'Registration failed'
      errorDetails.value = JSON.stringify(response, null, 2)
      return
    }
    
    console.log('✅ Registration successful, initializing session...')
    
    // Initialize auth
    const authStore = useAuthStore()
    const supabase = useSupabaseClient()
    
    // Wait for session
    console.log('⏳ Waiting for session...')
    let sessionFound = false
    
    for (let i = 0; i < 60; i++) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id) {
          console.log(`✅ Session found on attempt ${i + 1}`)
          sessionFound = true
          break
        }
      } catch (e) {
        console.warn(`Session check ${i + 1} failed`)
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    if (!sessionFound) {
      error.value = 'Session not established'
      return
    }
    
    console.log('🤝 Performing handshake...')
    const handshakeResult = await authStore.performSignupHandshake()
    
    if (handshakeResult.success) {
      console.log('✅ SUCCESS - Redirecting to verify email')
      await navigateTo('/auth/verify-email')
    } else {
      error.value = handshakeResult.error || 'Session initialization failed'
      errorDetails.value = JSON.stringify(handshakeResult, null, 2)
    }
    
  } catch (err: any) {
    console.error('❌ Error:', err)
    
    // Check if response is HTML (redirect)
    if (err.message && err.message.includes('<!DOCTYPE') || err.message.includes('<html')) {
      error.value = 'API endpoint not found - received HTML instead of JSON. Check server configuration.'
      errorDetails.value = 'The server is redirecting to the landing page instead of processing the API request.'
    } else {
      error.value = err.message || 'An error occurred'
      errorDetails.value = JSON.stringify({
        message: err.message,
        status: err.status,
        statusCode: err.statusCode
      }, null, 2)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.signup-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 1.8rem;
}

h3 {
  margin-bottom: 1.5rem;
  color: #555;
  font-size: 1.3rem;
}

.step {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

input,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

input:disabled,
textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #666;
}

.error-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #dc3545;
}

.error-message {
  padding: 0.75rem;
  margin-bottom: 1rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
  font-size: 0.9rem;
}

.error-message-large {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: #f8d7da;
  border: 3px solid #dc3545;
  border-radius: 8px;
  color: #721c24;
}

.error-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
  color: #dc3545;
}

.error-content {
  font-size: 1rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.error-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #dc3545;
}

.error-details pre {
  background-color: #fff;
  padding: 0.75rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dc3545;
}

.debug-panel-large {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: #fff3cd;
  border: 3px solid #ffc107;
  border-radius: 8px;
}

.debug-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #856404;
}

.debug-content {
  background-color: #fff;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ffc107;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
}

.submit-button,
.back-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button {
  flex: 1;
  background-color: #007bff;
  color: white;
}

.submit-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.back-button {
  flex: 1;
  background-color: #6c757d;
  color: white;
}

.back-button:hover:not(:disabled) {
  background-color: #5a6268;
}

.back-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
