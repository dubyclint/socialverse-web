 FILE: /pages/profile/complete.vue - PROFILE COMPLETION PAGE -->
<!-- ============================================================================
     PROFILE COMPLETION PAGE - Guides users through profile setup
     ============================================================================ -->

<template>
  <div class="profile-completion-page">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>Complete Your Profile</h1>
        <p>Let's set up your profile to get started</p>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>

      <!-- Form -->
      <form @submit.prevent="submitProfile" class="profile-form">
        <!-- Username -->
        <div class="form-group">
          <label for="username">Username</label>
          <input
            v-model="formData.username"
            type="text"
            id="username"
            placeholder="Enter your username"
            required
            @blur="checkUsernameAvailability"
          />
          <span v-if="usernameError" class="error">{{ usernameError }}</span>
          <span v-if="usernameAvailable && formData.username" class="success">✓ Username available</span>
        </div>

        <!-- Full Name -->
        <div class="form-group">
          <label for="fullName">Full Name</label>
          <input
            v-model="formData.fullName"
            type="text"
            id="fullName"
            placeholder="Enter your full name"
            required
          />
        </div>

        <!-- Bio -->
        <div class="form-group">
          <label for="bio">Bio</label>
          <textarea
            v-model="formData.bio"
            id="bio"
            placeholder="Tell us about yourself"
            rows="4"
          ></textarea>
          <span class="char-count">{{ formData.bio.length }}/500</span>
        </div>

        <!-- Avatar Upload -->
        <div class="form-group">
          <label for="avatar">Profile Picture (Optional)</label>
          <div class="avatar-upload">
            <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar preview" class="preview" />
            <input
              type="file"
              id="avatar"
              accept="image/*"
              @change="handleAvatarUpload"
            />
          </div>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="btn-primary" :disabled="loading || !usernameAvailable">
          <span v-if="loading">Saving...</span>
          <span v-else>Complete Profile</span>
        </button>
      </form>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const loading = ref(false)
const error = ref('')
const usernameError = ref('')
const usernameAvailable = ref(false)
const avatarPreview = ref('')

const formData = ref({
  username: '',
  fullName: '',
  bio: '',
  avatar: null as File | null
})

const progress = computed(() => {
  let filled = 0
  if (formData.value.username) filled += 25
  if (formData.value.fullName) filled += 25
  if (formData.value.bio) filled += 25
  if (formData.value.avatar) filled += 25
  return filled
})

// Check username availability
const checkUsernameAvailability = async () => {
  if (!formData.value.username) {
    usernameAvailable.value = false
    usernameError.value = ''
    return
  }

  try {
    const result = await $fetch('/api/auth/check-username', {
      method: 'POST',
      body: { username: formData.value.username }
    })

    if (result?.available) {
      usernameAvailable.value = true
      usernameError.value = ''
    } else {
      usernameAvailable.value = false
      usernameError.value = 'Username already taken'
    }
  } catch (err: any) {
    usernameError.value = 'Error checking username'
    usernameAvailable.value = false
  }
}

// Handle avatar upload
const handleAvatarUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    formData.value.avatar = file
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// Submit profile
const submitProfile = async () => {
  loading.value = true
  error.value = ''

  try {
    // Upload avatar if provided
    let avatarUrl = null
    if (formData.value.avatar) {
      const formDataObj = new FormData()
      formDataObj.append('file', formData.value.avatar)

      const uploadResult = await $fetch('/api/profile/avatar-upload', {
        method: 'POST',
        body: formDataObj
      })

      if (uploadResult?.success) {
        avatarUrl = uploadResult.url
      }
    }

    // Complete profile
    const result = await $fetch('/api/profile/complete', {
      method: 'POST',
      body: {
        username: formData.value.username,
        full_name: formData.value.fullName,
        bio: formData.value.bio
      }
    })

    if (result?.success) {
      // Update store
      profileStore.setProfile(result.data)

      // Redirect to dashboard
      await router.push('/feed')
    }
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to complete profile'
    console.error('[Profile Complete] Error:', err)
  } finally {
    loading.value = false
  }
}

// Fetch current profile on mount
onMounted(async () => {
  try {
    const result = await $fetch('/api/profile/me')
    if (result?.success && result.data) {
      formData.value.username = result.data.username || ''
      formData.value.fullName = result.data.full_name || ''
      formData.value.bio = result.data.bio || ''
      if (result.data.avatar_url) {
        avatarPreview.value = result.data.avatar_url
      }
    }
  } catch (err) {
    console.error('[Profile Complete] Failed to fetch profile:', err)
  }
})
</script>

<style scoped>
.profile-completion-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  padding: 40px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 10px;
  color: #333;
}

.header p {
  color: #666;
  font-size: 14px;
}

.progress-bar {
  height: 4px;
  background: #eee;
  border-radius: 2px;
  margin-bottom: 30px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.char-count {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.error {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
}

.success {
  color: #27ae60;
  font-size: 12px;
  margin-top: 4px;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #667eea;
}

.avatar-upload input[type="file"] {
  padding: 8px;
  border: 2px dashed #ddd;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
}

.btn-primary {
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: 10px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  background: #ffe6e6;
  color: #e74c3c;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 20px;
}
</style>
