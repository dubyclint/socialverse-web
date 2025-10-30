<template>
  <div class="signup-form">
    <h2>Join SocialVerse</h2>
    
    <!-- Step 1: Basic Info -->
    <div v-if="currentStep === 1" class="step">
      <h3>Create Your Account</h3>
      
      <form @submit.prevent="nextStep">
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <div class="form-group">
          <label for="email">Email Address</label>
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
            placeholder="username"
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

    <!-- Step 2: Profile Info -->
    <div v-if="currentStep === 2" class="step">
      <h3>Complete Your Profile</h3>
      
      <form @submit.prevent="handleSubmit">
        <!-- ✅ ERROR MESSAGE - ALWAYS VISIBLE -->
        <div v-if="error" class="error-message-large">
          <div class="error-title">❌ Error</div>
          <div class="error-content">{{ error }}</div>
        </div>
        
        <!-- ✅ DEBUG INFO - ALWAYS VISIBLE -->
        <div v-if="debugInfo" class="debug-panel-large">
          <div class="debug-title">🔍 Debug Information</div>
          <pre class="debug-content">{{ debugInfo }}</pre>
        </div>

        <!-- Full Name - REQUIRED -->
        <div class="form-group">
          <label for="fullName">Full Name <span class="required">*</span></label>
          <input 
            id="fullName"
            v-model="formData.fullName" 
            type="text" 
            required 
            placeholder="e.g., Pech love"
            :disabled="loading"
          />
          <span class="hint">Your full name as it appears on your ID</span>
        </div>

        <!-- Phone Number - REQUIRED -->
        <div class="form-group">
          <label for="phone">Phone Number <span class="required">*</span></label>
          <input 
            id="phone"
            v-model="formData.phone" 
            type="tel" 
            required 
            placeholder="e.g., +2349059010737"
            :disabled="loading"
          />
          <span class="hint">Include country code (e.g., +234 for Nigeria)</span>
        </div>

        <!-- Bio - OPTIONAL -->
        <div class="form-group">
          <label for="bio">Bio <span class="optional">(Optional)</span></label>
          <textarea 
            id="bio"
            v-model="formData.bio" 
            placeholder="Tell us about yourself (max 500 characters)"
            rows="3"
            maxlength="500"
            :disabled="loading"
          ></textarea>
          <span class="hint">{{ formData.bio.length }}/500 characters</span>
        </div>

        <!-- Location - OPTIONAL -->
        <div class="form-group">
          <label for="location">Location <span class="optional">(Optional)</span></label>
          <input 
            id="location"
            v-model="formData.location" 
            type="text" 
            placeholder="e.g., Lagos, Nigeria"
            :disabled="loading"
          />
          <span class="hint">City, Country</span>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="button" 
            class="back-button" 
            @click="previousStep"
            :disabled="loading"
          >
            ← Back
          </button>
          <button 
            type="submit" 
            class="submit-button" 
            :disabled="!canProceedStep2 || loading"
          >
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </div>

        <!-- Summary -->
        <div class="profile-summary">
          <h4>Profile Summary</h4>
          <div class="summary-item">
            <span class="label">Full Name:</span>
            <span class="value">{{ formData.fullName || '—' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Phone:</span>
            <span class="value">{{ formData.phone || '—' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Bio:</span>
            <span class="value">{{ formData.bio || '—' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Location:</span>
            <span class="value">{{ formData.location || '—' }}</span>
          </div>
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
  location: ''
})

const currentStep = ref(1)
const loading = ref(false)
const error = ref('')
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
  const fullName = formData.value.fullName.trim()
  const phone = formData.value.phone.trim()
  
  return fullName.length > 0 && phone.length > 0
})

const nextStep = () => {
  if (currentStep.value === 1 && canProceedStep1.value) {
    currentStep.value = 2
    error.value = ''
    debugInfo.value = ''
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    error.value = ''
    debugInfo.value = ''
  }
}

const handleSubmit = async () => {
  if (!canProceedStep2.value) {
    error.value = 'Please fill in Full Name and Phone Number'
    return
  }
  
  loading.value = true
  error.value = ''
  debugInfo.value = ''
  
  try {
    const payload = {
      email: formData.value.email.toLowerCase().trim(),
      password: formData.value.password,
      username: formData.value.username.trim().toLowerCase(),
      fullName: formData.value.fullName.trim(),
      phone: formData.value.phone.trim(),
      bio: formData.value.bio.trim(),
      location: formData.value.location.trim()
    }
    
    console.log('📤 Sending registration request:', payload)
    debugInfo.value = JSON.stringify({
      stage: 'SENDING_REQUEST',
      endpoint: '/auth-register',
      payload,
      timestamp: new Date().toISOString()
    }, null, 2)
    
    let response
    try {
      // ✅ CALL NEW ENDPOINT
      response = await $fetch('/auth-register', {
        method: 'POST',
        body: payload
      })
      console.log('✅ Registration response:', response)
    } catch (apiErr: any) {
      console.error('❌ API Error:', apiErr)
      debugInfo.value = JSON.stringify({
        stage: 'API_ERROR',
        error: {
          status: apiErr.status,
          statusCode: apiErr.statusCode,
          message: apiErr.message,
          statusMessage: apiErr.data?.statusMessage,
          fullData: apiErr.data
        },
        timestamp: new Date().toISOString()
      }, null, 2)
      
      if (apiErr.data?.statusMessage) {
        error.value = apiErr.data.statusMessage
      } else if (apiErr.message) {
        error.value = apiErr.message
      } else {
        error.value = 'API request failed'
      }
      return
    }
    
    if (!response?.success) {
      console.error('❌ Response not successful:', response)
      debugInfo.value = JSON.stringify({
        stage: 'RESPONSE_NOT_SUCCESS',
        response,
        timestamp: new Date().toISOString()
      }, null, 2)
      error.value = response?.message || 'Registration failed'
      return
    }
    
    debugInfo.value = JSON.stringify({
      stage: 'REGISTRATION_SUCCESS',
      message: 'Account created successfully!',
      user: response.user,
      profile: response.profile,
      timestamp: new Date().toISOString()
    }, null, 2)
    
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
      debugInfo.value = JSON.stringify({
        stage: 'SESSION_NOT_FOUND',
        message: 'Session polling failed after 30 seconds',
        timestamp: new Date().toISOString()
      }, null, 2)
      return
    }
    
    console.log('🤝 Performing handshake...')
    debugInfo.value = JSON.stringify({
      stage: 'PERFORMING_HANDSHAKE',
      timestamp: new Date().toISOString()
    }, null, 2)
    
    const handshakeResult = await authStore.performSignupHandshake()
    
    if (handshakeResult.success) {
      console.log('✅ SUCCESS - Redirecting to verify email')
      debugInfo.value = JSON.stringify({
        stage: 'HANDSHAKE_SUCCESS',
        message: 'Redirecting to email verification...',
        timestamp: new Date().toISOString()
      }, null, 2)
      await navigateTo('/auth/verify-email')
    } else {
      error.value = handshakeResult.error || 'Session initialization failed'
      debugInfo.value = JSON.stringify({
        stage: 'HANDSHAKE_FAILED',
        error: handshakeResult.error,
        timestamp: new Date().toISOString()
      }, null, 2)
    }
    
  } catch (err: any) {
    console.error('❌ Fatal Error:', err)
    error.value = err.message || 'An error occurred during registration'
    debugInfo.value = JSON.stringify({
      stage: 'FATAL_ERROR',
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack
      },
      timestamp: new Date().toISOString()
    }, null, 2)
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

.required {
  color: #dc3545;
  font-weight: bold;
}

.optional {
  color: #6c757d;
  font-size: 0.85rem;
  font-weight: normal;
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

/* ✅ LARGE ERROR DISPLAY - ALWAYS VISIBLE */
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
  line-height: 1.5;
  word-break: break-word;
}

/* ✅ LARGE DEBUG DISPLAY - ALWAYS VISIBLE */
.debug-panel-large {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: #d1ecf1;
  border: 3px solid #0c5460;
  border-radius: 8px;
}

.debug-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #0c5460;
}

.debug-content {
  background-color: #fff;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #0c5460;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  color: #0c5460;
}

.profile-summary {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.profile-summary h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 0.95rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #dee2e6;
  font-size: 0.9rem;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item .label {
  font-weight: 600;
  color: #555;
}

.summary-item .value {
  color: #666;
  text-align: right;
  word-break: break-word;
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
  margin-top: 1.5rem;
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

@media (max-width: 600px) {
  .signup-form {
    padding: 1rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  h3 {
    font-size: 1.1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .submit-button,
  .back-button {
    width: 100%;
  }

  .debug-content {
    font-size: 0.75rem;
  }
}
</style>
