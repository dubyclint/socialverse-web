<template>
  <div class="signup-form">
    <h2>Join SocialVerse</h2>
    
    <!-- Step 1: Basic Info -->
    <div v-if="currentStep === 1" class="step">
      <h3>Create Your Account</h3>
      
      <form @submit.prevent="nextStep">
        <!-- Error display -->
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
        <!-- Error display -->
        <div v-if="error" class="error-message">
          <strong>Error:</strong> {{ error }}
        </div>
        
        <!-- ✅ FULL DEBUG INFO - ALWAYS VISIBLE DURING SIGNUP -->
        <div v-if="debugInfo" class="debug-panel">
          <details open>
            <summary>🔍 Full Debug Info</summary>
            <pre>{{ debugInfo }}</pre>
          </details>
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
const passwordMismatch = ref(false)
const debugInfo = ref('')

// ✅ COMPREHENSIVE DEBUG CAPTURE
const captureDebugInfo = (stage: string, data: any, isError = false) => {
  const info = {
    timestamp: new Date().toISOString(),
    stage,
    isError,
    data,
    environment: {
      hasAuthStore: !!useAuthStore,
      hasSupabaseClient: !!useSupabaseClient,
      hasNavigateTo: !!navigateTo,
      hasFetch: !!$fetch,
      nodeEnv: process.env.NODE_ENV,
      publicUrl: process.env.NUXT_PUBLIC_SITE_URL
    }
  }
  
  debugInfo.value = JSON.stringify(info, null, 2)
  
  if (isError) {
    console.error(`❌ [SignUp Debug - ${stage}]`, info)
  } else {
    console.log(`✅ [SignUp Debug - ${stage}]`, info)
  }
  
  return info
}

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
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    error.value = ''
    if (currentStep.value === 1) {
      formData.value.fullName = ''
      formData.value.phone = ''
      formData.value.bio = ''
      formData.value.location = ''
    }
  }
}

// ✅ MAIN SIGNUP HANDLER WITH DETAILED ERROR CAPTURE
const handleSubmit = async () => {
  if (!canProceedStep2.value) {
    error.value = 'Please fill in all required fields'
    return
  }
  
  loading.value = true
  error.value = ''
  debugInfo.value = ''
  
  console.log('═══════════════════════════════════════════════════════════')
  console.log('🚀 SIGNUP PROCESS STARTED')
  console.log('═══════════════════════════════════════════════════════════')
  
  try {
    const signupPayload = {
      email: formData.value.email.toLowerCase().trim(),
      password: formData.value.password,
      username: formData.value.username.trim().toLowerCase(),
      fullName: formData.value.fullName,
      phone: formData.value.phone,
      bio: formData.value.bio,
      location: formData.value.location,
      interests: formData.value.interests
    }
    
    console.log('📤 Sending payload to /api/auth/signup:', signupPayload)
    captureDebugInfo('PAYLOAD_PREPARED', signupPayload)
    
    // ✅ CALL API WITH DETAILED ERROR HANDLING
    let response
    try {
      response = await $fetch('/api/auth/signup', {
        method: 'POST',
        body: signupPayload
      })
      console.log('✅ API Response received:', response)
      captureDebugInfo('API_RESPONSE_SUCCESS', response)
    } catch (apiErr: any) {
      console.error('❌ API Call Failed:', apiErr)
      console.error('Error details:', {
        status: apiErr.status,
        statusCode: apiErr.statusCode,
        message: apiErr.message,
        data: apiErr.data,
        response: apiErr.response,
        cause: apiErr.cause
      })
      
      captureDebugInfo('API_CALL_FAILED', {
        status: apiErr.status,
        statusCode: apiErr.statusCode,
        message: apiErr.message,
        statusMessage: apiErr.data?.statusMessage,
        fullData: apiErr.data
      }, true)
      
      // Set error and return
      if (apiErr.data?.statusMessage) {
        error.value = apiErr.data.statusMessage
      } else if (apiErr.message) {
        error.value = apiErr.message
      } else {
        error.value = 'Signup failed. Please check the debug info above.'
      }
      
      return
    }
    
    // ✅ CHECK RESPONSE
    if (!response || !response.success) {
      console.error('❌ API returned non-success response:', response)
      captureDebugInfo('API_RESPONSE_NOT_SUCCESS', response, true)
      error.value = response?.message || 'Signup failed. Please try again.'
      return
    }
    
    console.log('✅ API signup successful, initializing session...')
    
    // ✅ INITIALIZE STORES
    try {
      const authStore = useAuthStore()
      const supabase = useSupabaseClient()
      
      console.log('✅ Stores initialized')
      captureDebugInfo('STORES_READY', {
        authStoreExists: !!authStore,
        supabaseExists: !!supabase
      })
      
      // ✅ WAIT FOR SESSION
      console.log('⏳ Waiting for Supabase session...')
      let sessionFound = false
      let attempts = 0
      const maxAttempts = 60
      
      while (attempts < maxAttempts && !sessionFound) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user?.id) {
            console.log(`✅ Session found on attempt ${attempts + 1}`)
            captureDebugInfo('SESSION_FOUND', {
              userId: session.user.id,
              attempts: attempts + 1
            })
            sessionFound = true
            break
          }
        } catch (sessionErr) {
          console.warn(`⚠️ Session check attempt ${attempts + 1} failed:`, sessionErr)
        }
        
        attempts++
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      if (!sessionFound) {
        console.error(`❌ Session not found after ${maxAttempts} attempts`)
        captureDebugInfo('SESSION_NOT_FOUND', { maxAttempts, attempts }, true)
        error.value = 'Session establishment failed. Please try again.'
        return
      }
      
      // ✅ PERFORM HANDSHAKE
      console.log('🤝 Performing signup handshake...')
      const handshakeResult = await authStore.performSignupHandshake()
      
      console.log('Handshake result:', handshakeResult)
      captureDebugInfo('HANDSHAKE_RESULT', handshakeResult)
      
      if (handshakeResult.success) {
        console.log('═══════════════════════════════════════════════════════════')
        console.log('✅ SIGNUP PROCESS COMPLETED SUCCESSFULLY')
        console.log('═══════════════════════════════════════════════════════════')
        
        await navigateTo('/auth/verify-email')
      } else {
        console.error('❌ Handshake failed:', handshakeResult.error)
        captureDebugInfo('HANDSHAKE_FAILED', handshakeResult, true)
        error.value = handshakeResult.error || 'Failed to initialize session.'
      }
    } catch (storeErr: any) {
      console.error('❌ Store/Handshake error:', storeErr)
      captureDebugInfo('STORE_ERROR', {
        message: storeErr.message,
        stack: storeErr.stack
      }, true)
      error.value = `Session error: ${storeErr.message}`
    }
  } catch (err: any) {
    console.error('═══════════════════════════════════════════════════════════')
    console.error('❌ SIGNUP PROCESS FAILED')
    console.error('═══════════════════════════════════════════════════════════')
    console.error('Error:', err)
    console.error('Full error object:', {
      name: err.name,
      message: err.message,
      status: err.status,
      statusCode: err.statusCode,
      data: err.data,
      stack: err.stack
    })
    
    captureDebugInfo('FATAL_ERROR', {
      name: err.name,
      message: err.message,
      status: err.status,
      statusCode: err.statusCode,
      data: err.data
    }, true)
    
    error.value = err.message || 'An unexpected error occurred. Check console for details.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.signup-form {
  max-width: 500px;
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
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #f8d7da;
  border: 2px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
  font-size: 0.95rem;
  font-weight: 500;
}

.debug-panel {
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 4px;
  font-size: 0.85rem;
}

.debug-panel summary {
  cursor: pointer;
  font-weight: 600;
  color: #333;
  user-select: none;
  padding: 0.5rem;
  background-color: #ffeaa7;
  border-radius: 3px;
}

.debug-panel summary:hover {
  background-color: #ffdb58;
}

.debug-panel pre {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #fff;
  border: 1px solid #ffc107;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
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
