<template>
  <div class="card">
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <form @submit.prevent="handleSubmit" class="form">
      <div class="field">
        <label for="full_name">Full Name *</label>
        <input
          id="full_name"
          v-model="formData.full_name"
          type="text"
          maxlength="100"
          :disabled="loading"
          placeholder="Your full name"
        />
        <p v-if="errors.full_name" class="field-error">{{ errors.full_name }}</p>
      </div>

      <div class="field">
        <label for="bio">Bio *</label>
        <textarea
          id="bio"
          v-model="formData.bio"
          rows="3"
          maxlength="500"
          :disabled="loading"
          placeholder="Tell us about yourself"
        />
        <div class="meta-row">
          <p v-if="errors.bio" class="field-error">{{ errors.bio }}</p>
          <small>{{ formData.bio.length }}/500</small>
        </div>
      </div>

      <div class="field">
        <label for="location">Location</label>
        <input id="location" v-model="formData.location" type="text" maxlength="100" :disabled="loading" />
      </div>

      <div class="field">
        <label for="website">Website</label>
        <input id="website" v-model="formData.website" type="url" maxlength="255" :disabled="loading" />
      </div>

      <div class="field">
        <label for="birth_date">Birth date</label>
        <input id="birth_date" v-model="formData.birth_date" type="date" :disabled="loading" />
      </div>

      <div class="field">
        <label for="gender">Gender</label>
        <select id="gender" v-model="formData.gender" :disabled="loading">
          <option value="">Not specified</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
      </div>

      <div class="field inline">
        <input id="is_private" v-model="formData.is_private" type="checkbox" :disabled="loading" />
        <label for="is_private">Make profile private</label>
      </div>

      <button class="btn" type="submit" :disabled="loading">
        {{ loading ? (isNewProfile ? 'Completing...' : 'Saving...') : (isNewProfile ? 'Complete Profile' : 'Save Profile') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

interface Props {
  isNewProfile?: boolean
  initialData?: {
    full_name?: string
    bio?: string
    location?: string
    website?: string
    birth_date?: string
    gender?: string
    is_private?: boolean
  }
}

const props = withDefaults(defineProps<Props>(), {
  isNewProfile: false,
  initialData: () => ({})
})

const emit = defineEmits<{
  success: [data: any]
}>()

const loading = ref(false)
const error = ref('')
const success = ref('')

const formData = reactive({
  full_name: props.initialData.full_name || '',
  bio: props.initialData.bio || '',
  location: props.initialData.location || '',
  website: props.initialData.website || '',
  birth_date: props.initialData.birth_date || '',
  gender: props.initialData.gender || '',
  is_private: props.initialData.is_private ?? false
})

const errors = reactive({
  full_name: '',
  bio: ''
})

const validate = () => {
  errors.full_name = ''
  errors.bio = ''

  if (!formData.full_name.trim()) errors.full_name = 'Full name is required'
  else if (formData.full_name.trim().length > 100) errors.full_name = 'Full name must be less than 100 characters'

  if (!formData.bio.trim()) errors.bio = 'Bio is required'
  else if (formData.bio.trim().length > 500) errors.bio = 'Bio must be less than 500 characters'

  return !errors.full_name && !errors.bio
}

const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const endpoint = props.isNewProfile ? '/api/profile/complete' : '/api/profile/update'
    const res: any = await $fetch(endpoint, {
      method: 'POST',
      body: {
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim(),
        location: formData.location?.trim() || null,
        website: formData.website?.trim() || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        is_private: formData.is_private
      }
    })

    success.value = props.isNewProfile
      ? 'Profile completed successfully!'
      : 'Profile updated successfully!'

    emit('success', res?.data || res)
  } catch (err: any) {
    error.value = err?.statusMessage || err?.data?.message || 'Failed to save profile'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.card { background:#1e293b; border:1px solid #334155; border-radius:12px; padding:20px; }
.form { display:grid; gap:14px; }
.field { display:grid; gap:6px; }
.field.inline { grid-template-columns:auto 1fr; align-items:center; gap:10px; }
label { color:#cbd5e1; font-size:.92rem; }
input, textarea, select {
  width:100%; background:#334155; border:1px solid #475569; color:#fff;
  border-radius:8px; padding:10px 12px;
}
input:focus, textarea:focus, select:focus { outline:2px solid #3b82f6; border-color:#3b82f6; }
.btn {
  border:none; border-radius:8px; padding:10px 14px; font-weight:600; cursor:pointer;
  background:#2563eb; color:#fff;
}
.btn:disabled { opacity:.65; cursor:not-allowed; }
.alert { border-radius:8px; padding:10px 12px; margin-bottom:12px; font-size:.9rem; }
.alert-error { background:rgba(127,29,29,.25); border:1px solid rgba(239,68,68,.45); color:#fecaca; }
.alert-success { background:rgba(20,83,45,.25); border:1px solid rgba(74,222,128,.45); color:#bbf7d0; }
.field-error { color:#f87171; font-size:.8rem; }
.meta-row { display:flex; justify-content:space-between; align-items:center; }
small { color:#94a3b8; }
</style>
