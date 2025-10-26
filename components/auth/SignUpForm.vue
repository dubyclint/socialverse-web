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

        <!-- PHONE NUMBER FIELD - ADDED -->
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

<script setup>
import { ref, computed, onMounted } from 'vue'

const currentStep = ref(1)
const isSigningUp = ref(false)
const interests = ref([])
const selectedInterests = ref([])
const usernameStatus = ref(null)

const formData = ref({
  email: '',
  username: '',
  phone: '', // ADDED PHONE FIELD
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
         formData.value.phone && // ADDED PHONE VALIDATION
         formData.value.password.length >= 8 && 
         !passwordMismatch.value &&
         (!usernameStatus.value || usernameStatus.value.type === 'success')
})

// Methods
const checkUsernameAvailability = async () => {
  if (formData.value.username.length < 3) return
  
  // Implement username check logic
  usernameStatus.value = { type: 'success', message: 'Username available!' }
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
  // Load interests from Supabase
  const { data } = await $fetch('/api/interests')
  interests.value = data || []
}

const completeSignup = async () => {
  isSigningUp.value = true
  
  try {
    // Create user account
    const response = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        email: formData.value.email,
        username: formData.value.username,
        phone: formData.value.phone, // SEND PHONE TO API
        fullName: formData.value.displayName,
        password: formData.value.password,
        bio: formData.value.bio,
        location: formData.value.location,
        interests: selectedInterests.value
      }
    })
    
    if (response.success) {
      // Redirect to welcome page or login
      await navigateTo('/welcome')
    }
  } catch (error) {
    console.error('Signup failed:', error)
    // Handle error
  } finally {
    isSigningUp.value = false
  }
}

onMounted(() => {
  loadInterests()
})
</script>

<style scoped>
.signup-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.interests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.interest-card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.interest-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
}

.interest-card.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}
</style>
