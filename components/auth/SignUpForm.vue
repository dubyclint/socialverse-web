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
            @input="onUsernameInput"
            :disabled="loading"
          />
          <span v-if="checkingUsername" class="checking">
            Checking availability...
          </span>
          <span v-else-if="usernameStatus" :class="['status', usernameStatus.type]">
            {{ usernameStatus.message }}
          </span>
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
import { ref, computed, watch } from 'vue'

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
const checkingUsername = ref(false)
const usernameStatus = ref<{ type: string; message: string } | null>(null)
const passwordMismatch = ref(false)

// Debounce timer for username check
let usernameCheckTimer: NodeJS.Timeout

// Username validation with debounce
const onUsernameInput = () => {
  clearTimeout(usernameCheckTimer)
  checkingUsername.value = true
  usernameStatus.value = null
  error.value = ''
  
  usernameCheckTimer = setTimeout(async () => {
    await checkUsernameAvailability()
  }, 500)
}

// Check username availability
const checkUsernameAvailability = async () => {
  const username = formData.value.username.trim().toLowerCase()
  
  // Client-side validation first
  if (!username) {
    usernameStatus.value = null
    checkingUsername.value = false
    return
  }
  
  if (username.length < 3) {
    usernameStatus.value = { type: 'error', message: 'Username must be at least 3 characters' }
    checkingUsername.value = false
    return
  }
  
  if (username.length > 30) {
    usernameStatus.value = { type: 'error', message: 'Username must be less than 30 characters' }
    checkingUsername.value = false
    return
  }
  
  const usernameRegex = /^[a-z0-9_-]+$/
  if (!usernameRegex.test(username)) {
    usernameStatus.value = { type: 'error', message: 'Only letters, numbers, underscores, and hyphens allowed' }
    checkingUsername.value = false
    return
  }
  
  try {
    const response = await $fetch('/api/auth/check-username', {
      method: 'POST',
      body: { username }
    })
    
    if (response.available) {
      usernameStatus.value = { type: 'success', message: '✓ Username available' }
    } else {
      usernameStatus.value = { type: 'error', message: '✗ Username already taken' }
    }
  } catch (err) {
    console.error('Error checking username:', err)
    usernameStatus.value = { type: 'error', message: 'Error checking availability' }
  } finally {
    checkingUsername.value = false
  }
}

// Password validation
const validatePasswords = () => {
  passwordMismatch.value = formData.value.password !== formData.value.confirmPassword
}

watch(() => formData.value.confirmPassword, validatePasswords)

// Step 1 validation
const canProceedStep1 = computed(() => {
  return (
    formData.value.email &&
    formData.value.username &&
    formData.value.password &&
    formData.value.confirmPassword &&
    !passwordMismatch.value &&
    usernameStatus.value?.type === 'success' &&
    !checkingUsername.value
  )
})

// Step 2 validation
const canProceedStep2 = computed(() => {
  return formData.value.fullName && formData.value.phone
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
  }
}

// Submit form
const handleSubmit = async () => {
  if (!canProceedStep2.value) {
    error.value = 'Please fill in all required fields'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
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
    
    if (response.success) {
      // Redirect to verification or login page
      await navigateTo('/verify-email')
    }
  } catch (err: any) {
    console.error('Signup error:', err)
    
    // Handle specific errors
    if (err.status === 409) {
      error.value = 'Username already taken. Please choose another.'
      usernameStatus.value = { type: 'error', message: '✗ Username already taken' }
      currentStep.value = 1
    } else if (err.data?.statusMessage) {
      error.value = err.data.statusMessage
    } else {
      error.value = 'Signup failed. Please try again.'
    }
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
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

input,
textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s ease;
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
  opacity: 0.6;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.checking {
  font-size: 0.85rem;
  color: #ff9800;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checking::before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #ff9800;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status {
  font-size: 0.85rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

.status.success {
  color: #28a745;
}

.status.error {
  color: #dc3545;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
}

.error-text {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.submit-button,
.back-button {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-button {
  background-color: #007bff;
  color: white;
}

.submit-button:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.back-button {
  background-color: #6c757d;
  color: white;
}

.back-button:hover:not(:disabled) {
  background-color: #5a6268;
  transform: translateY(-2px);
}

.back-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

form {
  display: flex;
  flex-direction: column;
}

@media (max-width: 600px) {
  .signup-form {
    padding: 1.5rem;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .submit-button,
  .back-button {
    width: 100%;
  }
}
</style>
