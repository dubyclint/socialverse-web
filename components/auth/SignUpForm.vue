<template>
  <div class="signup-form">
    <h2>Join SocialVerse</h2>
    
    <!-- Step 1: Basic Info -->
    <div v-if="currentStep === 1" class="step">
      <h3>Create Your Account</h3>
      
      <form @submit.prevent="nextStep">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email"
            v-model="formData.email" 
            type="email" 
            required 
            placeholder="your@email.com"
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
            @input="checkUsernameAvailability"
          />
          <span v-if="usernameStatus" :class="usernameStatus.type">
            {{ usernameStatus.message }}
          </span>
        </div>

        <!-- PHONE NUMBER FIELD -->
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input 
            id="phone"
            v-model="formData.phone" 
            type="tel" 
            required 
            placeholder="+1 (555) 000-0000"
          />
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
          />
          <span v-if="passwordMismatch" class="error">
            Passwords don't match
          </span>
        </div>

        <button type="submit" :disabled="!canProceedStep1" class="btn-primary">
          Continue
        </button>
      </form>
    </div>

    <!-- Step 2: Interests Selection -->
    <div v-if="currentStep === 2" class="step">
      <h3>What interests you?</h3>
      <p>Select at least 3 interests to personalize your experience</p>
      
      <div class="interests-grid">
        <div 
          v-for="interest in interests" 
          :key="interest.id"
          class="interest-card"
          :class="{ selected: selectedInterests.includes(interest.id) }"
          @click="toggleInterest(interest.id)"
        >
          <div class="interest-icon">{{ interest.icon || '📌' }}</div>
          <h4>{{ interest.name }}</h4>
          <p>{{ interest.description }}</p>
        </div>
      </div>

      <div class="step-actions">
        <button @click="currentStep = 1" class="btn-secondary">
          Back
        </button>
        <button 
          @click="nextStep" 
          :disabled="selectedInterests.length < 3"
          class="btn-primary"
        >
          Continue ({{ selectedInterests.length }}/3+ selected)
        </button>
      </div>
    </div>

    <!-- Step 3: Profile Details -->
    <div v-if="currentStep === 3" class="step">
      <h3>Complete Your Profile</h3>
      
      <form @submit.prevent="completeSignup">
        <div class="form-group">
          <label for="displayName">Display Name</label>
          <input 
            id="displayName"
            v-model="formData.displayName" 
            type="text" 
            required 
            placeholder="How should others see you?"
          />
        </div>

        <div class="form-group">
          <label for="bio">Bio (Optional)</label>
          <textarea 
            id="bio"
            v-model="formData.bio"
            placeholder="Tell us about yourself..."
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="location">Location (Optional)</label>
          <input 
            id="location"
            v-model="formData.location" 
            type="text" 
            placeholder="Where are you from?"
          />
        </div>

        <div class="privacy-settings">
          <h4>Privacy Settings</h4>
          <label class="checkbox-label">
            <input 
              v-model="formData.profilePrivate" 
              type="checkbox"
            />
            Make my profile private
          </label>
          
          <label class="checkbox-label">
            <input 
              v-model="formData.emailNotifications" 
              type="checkbox"
            />
            Send me email notifications
          </label>
        </div>

        <div class="terms-agreement">
          <label class="checkbox-label required">
            <input 
              v-model="formData.agreeToTerms" 
              type="checkbox" 
              required
            />
            I agree to the <a href="/terms" target="_blank">Terms of Service</a> 
            and <a href="/privacy" target="_blank">Privacy Policy</a>
          </label>
        </div>

        <div v-if="signupError" class="error-message">
          {{ signupError }}
        </div>

        <div class="step-actions">
          <button @click="currentStep = 2" class="btn-secondary">
            Back
          </button>
          <button 
            type="submit" 
            :disabled="isSigningUp || !formData.agreeToTerms"
            class="btn-primary"
          >
            {{ isSigningUp ? 'Creating Account...' : 'Create Account' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Loading State -->
    <div v-if="isSigningUp" class="loading-overlay">
      <div class="spinner"></div>
      <p>Setting up your account...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentStep = ref(1)
const isSigningUp = ref(false)
const interests = ref([])
const selectedInterests = ref([])
const usernameStatus = ref(null)
const signupError = ref('')

const formData = ref({
  email: '',
  username: '',
  phone: '',
  password: '',
  confirmPassword: '',
  displayName: '',
  bio: '',
  location: '',
  profilePrivate: false,
  emailNotifications: true,
  agreeToTerms: false
})

// Computed properties
const passwordMismatch = computed(() => {
  return formData.value.password !== formData.value.confirmPassword && 
         formData.value.confirmPassword.length > 0
})

const canProceedStep1 = computed(() => {
  return formData.value.email && 
         formData.value.username && 
         formData.value.username.length >= 3 &&
         formData.value.phone && 
         formData.value.password.length >= 8 && 
         !passwordMismatch.value
  // REMOVED: username status check - we'll validate on signup instead
})

// Methods
const checkUsernameAvailability = async () => {
  if (formData.value.username.length < 3) {
    usernameStatus.value = null
    return
  }
  
  try {
    console.log('[SignUp] Checking username availability:', formData.value.username)
    const response = await $fetch('/api/auth/check-username', {
      method: 'POST',
      body: { username: formData.value.username }
    })
    
    console.log('[SignUp] Username check response:', response)
    
    if (response.available) {
      usernameStatus.value = { type: 'success', message: '✓ Username available!' }
    } else {
      usernameStatus.value = { type: 'error', message: '✗ Username already taken' }
    }
  } catch (error) {
    console.error('[SignUp] Username check error:', error)
    // On error, don't block the form - let signup validation handle it
    usernameStatus.value = null
  }
}

const toggleInterest = (interestId) => {
  const index = selectedInterests.value.indexOf(interestId)
  if (index > -1) {
    selectedInterests.value.splice(index, 1)
  } else {
    selectedInterests.value.push(interestId)
  }
}

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const loadInterests = async () => {
  try {
    console.log('[SignUp] Loading interests...')
    const response = await $fetch('/api/interests')
    interests.value = response.data || []
    console.log('[SignUp] Loaded', interests.value.length, 'interests')
  } catch (error) {
    console.error('[SignUp] Failed to load interests:', error)
    interests.value = []
  }
}

const completeSignup = async () => {
  isSigningUp.value = true
  signupError.value = ''
  
  try {
    // Validate username one more time before signup
    if (usernameStatus.value && usernameStatus.value.type === 'error') {
      signupError.value = 'Username is already taken. Please choose another.'
      isSigningUp.value = false
      return
    }

    console.log('[SignUp] Submitting form with interests:', selectedInterests.value)
    
    // Create user account
    const response = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        email: formData.value.email,
        username: formData.value.username,
        phone: formData.value.phone,
        fullName: formData.value.displayName,
        password: formData.value.password,
        bio: formData.value.bio,
        location: formData.value.location,
        interests: selectedInterests.value
      }
    })
    
    console.log('[SignUp] Response:', response)
    
    if (response.success) {
      console.log('[SignUp] ✅ Account created successfully')
      // Redirect to verify email page
      await navigateTo('/auth/verify-email')
    } else {
      throw new Error(response.statusMessage || 'Signup failed')
    }
  } catch (error: any) {
    console.error('[SignUp] Error:', error)
    
    // Handle error message
    const errorMessage = 
      error.data?.statusMessage || 
      error.statusMessage || 
      error.message || 
      'Signup failed. Please try again.'
    
    signupError.value = errorMessage
  } finally {
    isSigningUp.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadInterests()
})

// Watch username changes
watch(() => formData.value.username, () => {
  checkUsernameAvailability()
})
</script>

<style scoped>
.signup-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
  color: #1f2937;
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

h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.step > p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 500;
  color: #374151;
  font-size: 0.95rem;
}

input,
textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input:disabled,
textarea:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.error {
  color: #ef4444;
  font-size: 0.875rem;
}

.success {
  color: #10b981;
  font-size: 0.875rem;
}

.warning {
  color: #f59e0b;
  font-size: 0.875rem;
}

.interests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.interest-card {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.interest-card:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

.interest-card.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.interest-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.interest-card h4 {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #1f2937;
}

.interest-card p {
  font-size: 0.875rem;
  color: #6b7280;
}

.privacy-settings {
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.privacy-settings h4 {
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #1f2937;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
  font-weight: 400;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.terms-agreement {
  background-color: #fef3c7;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.terms-agreement a {
  color: #3b82f6;
  text-decoration: none;
}

.terms-agreement a:hover {
  text-decoration: underline;
}

.error-message {
  background-color: #fee2e2;
  color: #991b1b;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  border-left: 4px solid #dc2626;
}

.step-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #1f2937;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  color: white;
  margin-top: 1rem;
  font-size: 1.1rem;
}
</style>
