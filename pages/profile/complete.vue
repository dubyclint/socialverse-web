<template>
  <div class="complete-page">
    <div class="complete-card">
      <h1>Complete Your Profile</h1>
      <p class="subtitle">Finish setting up your account to continue.</p>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">Profile completed successfully. Redirecting...</div>

      <form @submit.prevent="submit" class="form">
        <div class="field">
          <label for="full_name">Full name *</label>
          <input
            id="full_name"
            v-model="form.full_name"
            type="text"
            maxlength="100"
            placeholder="Your full name"
            :disabled="loading"
          />
        </div>

        <div class="field">
          <label for="bio">Bio *</label>
          <textarea
            id="bio"
            v-model="form.bio"
            rows="4"
            maxlength="500"
            placeholder="Tell people about yourself"
            :disabled="loading"
          />
          <small>{{ form.bio.length }}/500</small>
        </div>

        <div class="field">
          <label for="location">Location</label>
          <input
            id="location"
            v-model="form.location"
            type="text"
            maxlength="100"
            placeholder="City, Country"
            :disabled="loading"
          />
        </div>

        <div class="field">
          <label for="website">Website</label>
          <input
            id="website"
            v-model="form.website"
            type="url"
            maxlength="255"
            placeholder="https://example.com"
            :disabled="loading"
          />
        </div>

        <div class="field">
          <label for="birth_date">Birth date</label>
          <input
            id="birth_date"
            v-model="form.birth_date"
            type="date"
            :disabled="loading"
          />
        </div>

        <div class="field">
          <label for="gender">Gender</label>
          <select id="gender" v-model="form.gender" :disabled="loading">
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        <div class="field inline">
          <input id="is_private" v-model="form.is_private" type="checkbox" :disabled="loading" />
          <label for="is_private">Make profile private</label>
        </div>

        <button class="btn" type="submit" :disabled="loading">
          {{ loading ? 'Saving...' : 'Complete profile' }}
        </button>
      </form>
    </div>
  </div>
</template>
            
<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '~/lib/api'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

const router = useRouter()

// State
const loading = ref(true) 
const success = ref(false)
const error = ref('')

const form = reactive({
  full_name: '',
  bio: '',
  location: '',
  website: '',
  birth_date: '',
  gender: '',
  is_private: false
})

// Validation
const validate = () => {
  if (!form.full_name.trim()) return 'Full name is required'
  if (form.full_name.trim().length > 100) return 'Full name must be less than 100 characters'
  if (!form.bio.trim()) return 'Bio is required'
  if (form.bio.trim().length > 500) return 'Bio must be less than 500 characters'
  if (form.location && form.location.length > 100) return 'Location must be less than 100 characters'
  if (form.website && form.website.length > 255) return 'Website must be less than 255 characters'
  return ''
}

// Submission
const submit = async () => {
  error.value = ''
  const validationError = validate()
  if (validationError) {
    error.value = validationError
    return
  }

  loading.value = true
  try {
    // API utility handles Authorization header internally via interceptors
    await api('/profile/complete', {
      method: 'POST',
      body: {
        full_name: form.full_name.trim(),
        bio: form.bio.trim(),
        location: form.location?.trim() || null,
        website: form.website?.trim() || null,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        is_private: form.is_private
      }
    })

    success.value = true
    setTimeout(() => router.replace('/profile/complete-success'), 700)
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to complete profile'
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Check if profile exists using the unified API utility
    await api('/profile/me')
    // If successful, user already has a profile; bounce to main profile page
    await router.replace('/profile')
  } catch (e: any) {
    const status = e?.status || e?.response?.status || e?.statusCode
    
    // 404 indicates the profile setup is required
    if (status === 404) {
      loading.value = false 
    } else {
      console.error('[complete-profile] precheck error:', e)
      error.value = 'Failed to verify profile status. Please refresh.'
      loading.value = false
    }
  }
})
</script>    

<style scoped>
.complete-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0f172a;
  padding: 24px;
}

.complete-card {
  width: 100%;
  max-width: 560px;
  background: #111827;
  border: 1px solid #334155;
  border-radius: 14px;
  padding: 24px;
  color: #e5e7eb;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
  color: #fff;
}

.subtitle {
  margin: 8px 0 20px;
  color: #94a3b8;
}

.form {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 6px;
}

.field.inline {
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
}

label {
  font-size: 0.92rem;
  color: #cbd5e1;
}

input,
textarea,
select {
  width: 100%;
  background: #1e293b;
  border: 1px solid #475569;
  color: #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
}

input:focus,
textarea:focus,
select:focus {
  outline: 2px solid #3b82f6;
  border-color: #3b82f6;
}

small {
  color: #94a3b8;
  justify-self: end;
}

.btn {
  margin-top: 6px;
  border: none;
  border-radius: 10px;
  padding: 11px 14px;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.alert {
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
  font-size: 0.92rem;
}

.alert-error {
  background: rgba(127, 29, 29, 0.35);
  border: 1px solid rgba(248, 113, 113, 0.45);
  color: #fecaca;
}

.alert-success {
  background: rgba(20, 83, 45, 0.35);
  border: 1px solid rgba(74, 222, 128, 0.45);
  color: #bbf7d0;
}
</style>
