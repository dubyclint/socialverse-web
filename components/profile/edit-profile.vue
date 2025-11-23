<!-- FILE: /components/profile/edit-profile.vue -->
<!-- MERGED: edit-profile.vue + complete-profile-form.vue -->
<!-- Comprehensive profile editing with username creation and validation -->

<template>
  <div class="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
    <!-- Error Message -->
    <div v-if="error" class="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
      <p class="text-red-400 text-sm">{{ error }}</p>
    </div>

    <!-- Success Message -->
    <div v-if="success" class="mb-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
      <p class="text-green-400 text-sm">{{ success }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Username Field (New Profile Only) -->
      <div v-if="isNewProfile">
        <label for="username" class="block text-sm font-medium text-slate-300 mb-2">
          Username *
        </label>
        <input
          id="username"
          v-model="formData.username"
          type="text"
          required
          placeholder="Choose your username"
          :disabled="loading"
          @blur="checkUsernameAvailability"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <p class="mt-1 text-xs text-slate-400">
          3-30 characters, letters, numbers, underscores, hyphens only
        </p>
        <p v-if="errors.username" class="mt-1 text-xs text-red-400">{{ errors.username }}</p>
        <p v-if="usernameInfo" class="mt-1 text-xs text-blue-400">
          {{ usernameInfo }}
        </p>
      </div>

      <!-- First Name Field -->
      <div>
        <label for="firstName" class="block text-sm font-medium text-slate-300 mb-2">
          First Name *
        </label>
        <input
          id="firstName"
          v-model="formData.firstName"
          type="text"
          required
          placeholder="Your first name"
          :disabled="loading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <p v-if="errors.firstName" class="mt-1 text-xs text-red-400">{{ errors.firstName }}</p>
      </div>

      <!-- Last Name Field -->
      <div>
        <label for="lastName" class="block text-sm font-medium text-slate-300 mb-2">
          Last Name *
        </label>
        <input
          id="lastName"
          v-model="formData.lastName"
          type="text"
          required
          placeholder="Your last name"
          :disabled="loading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <p v-if="errors.lastName" class="mt-1 text-xs text-red-400">{{ errors.lastName }}</p>
      </div>

      <!-- Email Field (Edit Only) -->
      <div v-if="!isNewProfile">
        <label for="email" class="block text-sm font-medium text-slate-300 mb-2">
          Email
        </label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          placeholder="Your email"
          :disabled="loading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <p v-if="errors.email" class="mt-1 text-xs text-red-400">{{ errors.email }}</p>
      </div>

      <!-- Bio Field -->
      <div>
        <label for="bio" class="block text-sm font-medium text-slate-300 mb-2">
          Bio (Optional)
        </label>
        <textarea
          id="bio"
          v-model="formData.bio"
          placeholder="Tell us about yourself"
          :disabled="loading"
          rows="3"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        ></textarea>
        <p v-if="errors.bio" class="mt-1 text-xs text-red-400">{{ errors.bio }}</p>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        <span v-if="loading" class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isNewProfile ? 'Completing Profile...' : 'Saving Profile...' }}
        </span>
        <span v-else>{{ isNewProfile ? 'Complete Profile' : 'Save Profile' }}</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'

interface Props {
  isNewProfile?: boolean
  initialData?: {
    username?: string
    firstName?: string
    lastName?: string
    email?: string
    bio?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  isNewProfile: true,
  initialData: () => ({})
})

const emit = defineEmits<{
  success: [data: any]
}>()

const loading = ref(false)
const error = ref('')
const success = ref('')
const usernameInfo = ref('')

const formData = reactive({
  username: props.initialData?.username || '',
  firstName: props.initialData?.firstName || '',
  lastName: props.initialData?.lastName || '',
  email: props.initialData?.email || '',
  bio: props.initialData?.bio || ''
})

const errors = reactive({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  bio: ''
})

const validateForm = () => {
  errors.username = ''
  errors.firstName = ''
  errors.lastName = ''
  errors.email = ''
  errors.bio = ''

  // Username validation (only for new profiles)
  if (props.isNewProfile) {
    if (formData.username.length < 3 || formData.username.length > 30) {
      errors.username = 'Username must be 3-30 characters'
      return false
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, underscores, and hyphens'
      return false
    }
  }

  // First name validation
  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required'
    return false
  }

  // Last name validation
  if (!formData.lastName.trim()) {
    errors.lastName = 'Last name is required'
    return false
  }

  // Email validation (if provided)
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address'
    return false
  }

  return true
}

const checkUsernameAvailability = async () => {
  if (!props.isNewProfile || !formData.username) return

  if (formData.username.length < 3) {
    usernameInfo.value = ''
    return
  }

  try {
    const response = await fetch(`/api/auth/check-username?username=${formData.username}`)
    const data = await response.json()

    if (data.available) {
      usernameInfo.value = '✓ Username is available'
    } else {
      errors.username = 'Username is already taken'
      usernameInfo.value = ''
    }
  } catch (err) {
    console.error('Error checking username:', err)
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const endpoint = props.isNewProfile ? '/api/auth/complete-profile' : '/api/profile/update'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to save profile')
    }

    const data = await response.json()
    success.value = props.isNewProfile ? 'Profile completed successfully!' : 'Profile updated successfully!'
    
    emit('success', data)
  } catch (err: any) {
    error.value = err.message || 'An error occurred while saving your profile'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.bg-slate-800 {
  background-color: rgb(30, 41, 59);
}

.border-slate-700 {
  border-color: rgb(51, 65, 85);
}

.text-slate-300 {
  color: rgb(203, 213, 225);
}

.text-slate-400 {
  color: rgb(148, 163, 184);
}

.bg-slate-700 {
  background-color: rgb(51, 65, 85);
}

.border-slate-600 {
  border-color: rgb(71, 85, 105);
}

.text-white {
  color: white;
}

.placeholder-slate-500 {
  color: rgb(100, 116, 139);
}

.focus\:border-blue-500:focus {
  border-color: rgb(59, 130, 246);
}

.focus\:ring-blue-500:focus {
  box-shadow: 0 0 0 1px rgb(59, 130, 246);
}

.disabled\:opacity-50:disabled {
  opacity: 0.5;
}

.bg-blue-600 {
  background-color: rgb(37, 99, 235);
}

.hover\:bg-blue-700:hover {
  background-color: rgb(29, 78, 216);
}

.disabled\:bg-slate-600:disabled {
  background-color: rgb(71, 85, 105);
}

.text-red-400 {
  color: rgb(248, 113, 113);
}

.text-blue-400 {
  color: rgb(96, 165, 250);
}

.bg-red-900\/20 {
  background-color: rgba(127, 29, 29, 0.2);
}

.border-red-500\/50 {
  border-color: rgba(239, 68, 68, 0.5);
}

.bg-green-900\/20 {
  background-color: rgba(20, 83, 45, 0.2);
}

.border-green-500\/50 {
  border-color: rgba(34, 197, 94, 0.5);
}

.text-green-400 {
  color: rgb(74, 222, 128);
}
</style>

