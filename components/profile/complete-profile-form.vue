<!-- FILE: /components/auth/CompleteProfileForm.vue - NEW -->
<!-- Form to complete profile with username creation -->

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
      <!-- Username Field -->
      <div>
        <label for="username" class="block text-sm font-medium text-slate-300 mb-2">
          Username
        </label>
        <input
          id="username"
          v-model="formData.username"
          type="text"
          required
          placeholder="Choose your username"
          :disabled="loading"
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
          First Name
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
          Last Name
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
          Completing Profile...
        </span>
        <span v-else>Complete Profile</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const emit = defineEmits<{
  success: [data: any]
}>()

const loading = ref(false)
const error = ref('')
const success = ref('')
const usernameInfo = ref('')

const formData = reactive({
  username: '',
  firstName: '',
  lastName: '',
  bio: ''
})

const errors = reactive({
  username: '',
  firstName: '',
  lastName: '',
  bio: ''
})

const validateForm = () => {
  errors.username = ''
  errors.firstName = ''
  errors.lastName = ''
  errors.bio = ''

  // Username validation
  if (formData.username.length < 3 || formData.username.length > 30) {
    errors.username = 'Username must be 3-30 characters'
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
    errors.username = 'Username can only contain letters, numbers, underscores, and hyphens'
  }

  // First name validation
  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required'
  }

  // Last name validation
  if (!formData.lastName.trim()) {
    errors.lastName = 'Last name is required'
  }

  // Bio validation (optional but if provided, max 500 chars)
  if (formData.bio && formData.bio.length > 500) {
    errors.bio = 'Bio must be less than 500 characters'
  }

  return !errors.username && !errors.firstName && !errors.lastName && !errors.bio
}

const handleSubmit = async () => {
  error.value = ''
  success.value = ''
  usernameInfo.value = ''

  if (!validateForm()) {
    error.value = 'Please fix the errors above'
    return
  }

  loading.value = true

  try {
    // Step 1: Create/validate username (with auto-generation if taken)
    const usernameResponse = await $fetch('/api/profile/create-with-username', {
      method: 'POST',
      body: {
        username: formData.username
      }
    })

    if (!usernameResponse.success) {
      error.value = usernameResponse.message || 'Failed to create username'
      loading.value = false
      return
    }

    // Show info if username was modified
    if (usernameResponse.wasModified) {
      usernameInfo.value = `Username "${usernameResponse.username}" was auto-generated (your choice was taken)`
    }

    // Step 2: Complete profile with other details
    const profileResponse = await $fetch('/api/profile/complete', {
      method: 'POST',
      body: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio || null,
        interests: []
      }
    })

    if (profileResponse.success) {
      success.value = 'Profile completed successfully!'
      setTimeout(() => {
        emit('success', { userId: profileResponse.userId })
      }, 1000)
    } else {
      error.value = profileResponse.message || 'Failed to complete profile'
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
    console.error('Profile completion error:', err)
  } finally {
    loading.value = false
  }
}
</script>
