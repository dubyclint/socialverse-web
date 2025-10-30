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
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <!-- ✅ DEBUG INFO DISPLAY -->
        <div v-if="debugInfo" class="debug-panel">
          <details open>
            <summary>🔍 Debug Info (Click to expand)</summary>
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

// ✅ DIAGNOSTIC FUNCTION
const captureDebugInfo = (stage: string, data: any) => {
  const info = {
    timestamp: new Date().toISOString(),
    stage,
    data,
    environment: {
      hasAuthStore: !!useAuthStore,
      hasSupabaseClient: !!useSupabaseClient,
      hasNavigateTo: !!navigateTo,
      hasFetch: !!$fetch
    }
  }
  
  debugInfo.value = JSON.stringify(info, null, 2)
  console.log(`[SignUp Debug - ${stage}]`, info)
  return info
}

// Password validation
const validatePasswords = () => {
  passwordMismatch.value = formData.value.password !== formData.value.confirmPassword
}

// Step 1 validation
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

// Step 2 validation
const canProceedStep2 = computed(() => {
  return formData.value.fullName.trim() !== '' && formData.value.phone.trim() !== ''
})

// Next step
const nextStep = () => {
  if (currentStep.value === 1 && canProceedStep1.value) {
    currentStep.value = 2
    error.value = ''
  }
}

// Previous step
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

// ✅ WAIT FOR SESSION WITH POLLING
const waitForSession = async (maxAttempts = 60, delayMs = 500) => {
  const supabase = useSupabaseClient()
  let attempts = 0
  
  console.log('[SignUp] Starting session polling... (max 30 seconds)')
  captureDebugInfo('SESSION_POLLING_START', { maxAttempts, delayMs, maxSeconds: maxAttempts * delayMs / 1000 })
  
  while (attempts < maxAttempts) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.id) {
        console.log('[SignUp] ✅ Session found on attempt', attempts + 1)
        captureDebugInfo('SESSION_FOUND', { 
          attempts: attempts + 1, 
          userId: session.user.id,
          elapsedMs: (attempts + 1) * delayMs
        })
        return { success: true, session }
      }
      
      attempts++
      console.log(`[SignUp] Session not ready, attempt ${attempts}/${maxAttempts}`)
      
      await new Promise(resolve => setTimeout(resolve, delayMs))
      
    } catch (err: any) {
      console.error('[SignUp] Error checking session:', err)
      attempts++
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  console.error('[SignUp] ❌ Session not established after', maxAttempts, 'attempts')
  captureDebugInfo('SESSION_POLLING_FAILED', { maxAttempts, attempts })
  return { success: false, error: 'Session establishment timeout' }
}

// ✅ MAIN SIGNUP HANDLER
const handleSubmit = async () => {
  if (!canProceedStep2.value) {
    error.value = 'Please fill in all required fields'
    return
  }
  
  loading.value = true
  error.value = ''
  debugInfo.value = ''
  
  try {
    console.log('[SignUp] ========== SIGNUP START ==========')
    console.log('[SignUp] Form data:', {
      email: formData.value.email,
      username: formData.value.username,
      fullName: formData.value.fullName,
      phone: formData.value.phone
    })
    
    captureDebugInfo('FORM_SUBMIT_START', { 
      email: formData.value.email,
      username: formData.value.username
    })
    
    // Step 1: Call signup API
    console.log('[SignUp] Calling /api/auth/signup...')
    const response = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        email: formData.value.email.toLowerCase().trim(),
        password: formData.value.password,
        username: formData.value.username.trim().toLowerCase(),
        fullName: formData.value.fullName,
        phone: formData.value.phone,
        bio: formData.value.bio,
        location: formData.value.location,
        interests: formData.value.interests
      }
    })
    
    console.log('[SignUp] ✅ API Response received:', response)
    captureDebugInfo('API_RESPONSE_RECEIVED', response)
    
    if (!response.success) {
      error.value = response.message || 'Signup failed. Please try again.'
      console.error('[SignUp] API returned success: false')
      captureDebugInfo('API_SUCCESS_FALSE', response)
      return
    }
    
    try {
      // Step 2: Initialize stores
      const authStore = useAuthStore()
      const supabase = useSupabaseClient()
      
      captureDebugInfo('STORES_INITIALIZED', {
        authStoreExists: !!authStore,
        supabaseExists: !!supabase
      })
      
      console.log('[SignUp] Waiting for Supabase session...')
      
      // Step 3: Wait for session (up to 30 seconds)
      const sessionResult = await waitForSession(60, 500)
      
      if (!sessionResult.success) {
        error.value = 'Failed to establish session. Please try again.'
        console.error('[SignUp] Session polling failed:', sessionResult.error)
        captureDebugInfo('SESSION_POLLING_FAILED', sessionResult)
        return
      }
      
      console.log('[SignUp] Performing signup handshake...')
      captureDebugInfo('HANDSHAKE_START', {
        hasPerformSignupHandshake: typeof authStore.performSignupHandshake,
        sessionUserId: sessionResult.session?.user?.id
      })
      
      // Step 4: Perform handshake
      const handshakeResult = await authStore.performSignupHandshake()
      
      captureDebugInfo('HANDSHAKE_RESULT', handshakeResult)
      
      if (handshakeResult.success) {
        console.log('[SignUp] ✅ ========== SIGNUP SUCCESS ==========')
        captureDebugInfo('HANDSHAKE_SUCCESS', { redirecting: true })
        
        await navigateTo('/auth/verify-email')
      } else {
        error.value = handshakeResult.error || 'Failed to initialize session. Please try again.'
        console.error('[SignUp] Handshake failed:', handshakeResult.error)
        captureDebugInfo('HANDSHAKE_FAILED', handshakeResult)
      }
    } catch (handshakeErr: any) {
      console.error('[SignUp] Handshake error:', handshakeErr)
      captureDebugInfo('HANDSHAKE_ERROR', {
        message: handshakeErr.message,
        stack: handshakeErr.stack
      })
      
      error.value = `Session initialization error: ${handshakeErr.message}`
    }
  } catch (err: any) {
    console.error('[SignUp] ❌ API Error:', err)
    console.error('[SignUp] Error details:', {
      status: err.status,
      statusCode: err.statusCode,
      message: err.message,
      statusMessage: err.data?.statusMessage,
      data: err.data
    })
    
    captureDebugInfo('API_ERROR', {
      status: err.status,
      statusCode: err.statusCode,
      message: err.message,
      statusMessage: err.data?.statusMessage
    })
    
    // Handle specific errors
    if (err.status === 409 || err.statusCode === 409) {
      error.value = err.data?.statusMessage || 'Username or email already taken. Please try different ones.'
      currentStep.value = 1
    } else if (err.data?.statusMessage) {
      error.value = err.data.statusMessage
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'Signup failed. Please try again.'
    }
  } finally {
    loading.value = false
    console.log('[SignUp] ========== SIGNUP END ==========')
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
  padding: 0.75rem;
  margin-bottom: 1rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
  font-size: 0.9rem;
}

.debug-panel {
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
}

.debug-panel summary {
  cursor: pointer;
  font-weight: 600;
  color: #333;
  user-select: none;
}

.debug-panel summary:hover {
  color: #007bff;
}

.debug-panel pre {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
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
