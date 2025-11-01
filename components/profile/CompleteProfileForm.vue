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

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Avatar Upload -->
      <AvatarUpload v-model="formData.avatarUrl" />

      <!-- First Name -->
      <div>
        <label for="firstName" class="block text-sm font-medium text-slate-300 mb-2">
          First Name *
        </label>
        <input
          id="firstName"
          v-model="formData.firstName"
          type="text"
          required
          placeholder="John"
          :disabled="loading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <p v-if="errors.firstName" class="mt-1 text-xs text-red-400">{{ errors.firstName }}</p>
      </div>

      <!-- Last Name -->
      <div>
        <label for="lastName" class="block text-sm font-medium text-slate-300 mb-2">
          Last Name *
        </label>
        <input
          id="lastName"
          v-model="formData.lastName"
          type="text"
          required
          placeholder="Doe"
          :disabled="loading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <p v-if="errors.lastName" class="mt-1 text-xs text-red-400">{{ errors.lastName }}</p>
      </div>

      <!-- Phone Number -->
      <div>
        <label for="phone" class="block text-sm font-medium text-slate-300 mb-2">
          Phone Number (Optional)
        </label>
        <input
          id="phone"
          v-model="formData.phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          :disabled="loading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <p v-if="errors.phone" class="mt-1 text-xs text-red-400">{{ errors.phone }}</p>
      </div>

      <!-- Bio -->
      <div>
        <label for="bio" class="block text-sm font-medium text-slate-300 mb-2">
          Bio (Optional)
        </label>
        <textarea
          id="bio"
          v-model="formData.bio"
          placeholder="Tell us about yourself..."
          :disabled="loading"
          maxlength="500"
          rows="4"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 resize-none"
        ></textarea>
        <p class="mt-1 text-xs text-slate-400">
          {{ formData.bio.length }}/500 characters
        </p>
      </div>

      <!-- Address -->
      <div>
        <label for="address" class="block text-sm font-medium text-slate-300 mb-2">
          Address (Optional)
        </label>
        <input
          id="address"
          v-model="formData.address"
          type="text"
          placeholder="123 Main St, City, State"
          :disabled="loading"
          class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <!-- Interests -->
      <InterestsSelector v-model="formData.interests" :disabled="loading" />
      <p v-if="errors.interests" class="text-xs text-red-400">{{ errors.interests }}</p>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="loading || formData.interests.length === 0"
        class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        <span v-if="loading" class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Completing profile...
        </span>
        <span v-else>Complete Profile & Get Started</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const emit = defineEmits<{
  success: []
}>()

const { completeProfile } = useProfile()

const loading = ref(false)
const error = ref('')
const success = ref('')

const formData = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  bio: '',
  address: '',
  avatarUrl: '',
  interests: [] as string[]
})

const errors = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  interests: ''
})

const validateForm = () => {
  errors.firstName = ''
  errors.lastName = ''
  errors.phone = ''
  errors.interests = ''

  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required'
  }

  if (!formData.lastName.trim()) {
    errors.lastName = 'Last name is required'
  }

  if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
    errors.phone = 'Please enter a valid phone number'
  }

  if (formData.interests.length === 0) {
    errors.interests = 'Please select at least one interest'
  }

  return !errors.firstName && !errors.lastName && !errors.phone && !errors.interests
}

const handleSubmit = async () => {
  error.value = ''
  success.value = ''

  if (!validateForm()) {
    error.value = 'Please fix the errors above'
    return
  }

  loading.value = true

  try {
    const result = await completeProfile({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
      bio: formData.bio || undefined,
      address: formData.address || undefined,
      avatarUrl: formData.avatarUrl || undefined,
      interests: formData.interests
    })

    if (result.success) {
      success.value = 'Profile completed successfully!'
      setTimeout(() => {
        emit('success')
      }, 1000)
    } else {
      error.value = result.error || 'Failed to complete profile'
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Minimal scoped styles */
</style>
