<!-- ============================================================================
     FILE: /pages/profile/edit.vue
     PHASE 3: Profile Edit Page
     ============================================================================
     Features:
     ✅ Edit profile form (name, username, bio)
     ✅ Avatar upload via modal
     ✅ Save changes functionality
     ✅ Error handling
     ✅ Loading states
     ✅ Dark mode styling (matches feed.vue)
     ✅ Form validation
     ============================================================================ -->

<template>
  <div class="profile-edit-page">
    <!-- Header -->
    <header class="edit-header">
      <div class="header-content">
        <NuxtLink to="/feed" class="back-btn">
          <Icon name="arrow-left" size="24" />
        </NuxtLink>
        <h1 class="page-title">Edit Profile</h1>
        <div style="width: 40px;"></div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="edit-main">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <Icon name="alert-circle" size="48" />
        <h2>Error Loading Profile</h2>
        <p>{{ error }}</p>
        <button @click="loadProfile" class="btn btn-primary">
          Try Again
        </button>
      </div>

      <!-- Edit Form -->
      <div v-else class="edit-form-container">
        <!-- Avatar Section -->
        <section class="avatar-section">
          <div class="avatar-wrapper">
            <img 
              :src="formData.avatar_url || '/default-avatar.svg'" 
              :alt="formData.full_name || 'Avatar'"
              class="avatar-image"
            />
            <button 
              @click="openAvatarModal" 
              class="avatar-edit-btn"
              title="Change avatar"
            >
              <Icon name="camera" size="20" />
            </button>
          </div>
          <p class="avatar-hint">Click the camera icon to change your avatar</p>
        </section>

        <!-- Form Fields -->
        <form @submit.prevent="saveProfile" class="edit-form">
          <!-- Full Name -->
          <div class="form-group">
            <label for="full_name" class="form-label">Full Name</label>
            <input 
              id="full_name"
              v-model="formData.full_name" 
              type="text" 
              class="form-input"
              placeholder="Enter your full name"
              maxlength="100"
            />
            <p class="form-hint">{{ formData.full_name?.length || 0 }}/100</p>
          </div>

          <!-- Username -->
          <div class="form-group">
            <label for="username" class="form-label">Username</label>
            <div class="username-input-wrapper">
              <span class="username-prefix">@</span>
              <input 
                id="username"
                v-model="formData.username" 
                type="text" 
                class="form-input username-input"
                placeholder="username"
                maxlength="30"
                @blur="validateUsername"
              />
            </div>
            <p v-if="usernameError" class="form-error">{{ usernameError }}</p>
            <p v-else class="form-hint">3-30 characters, lowercase letters, numbers, and underscores only</p>
          </div>

          <!-- Bio -->
          <div class="form-group">
            <label for="bio" class="form-label">Bio</label>
            <textarea 
              id="bio"
              v-model="formData.bio" 
              class="form-textarea"
              placeholder="Tell us about yourself"
              maxlength="500"
              rows="4"
            ></textarea>
            <p class="form-hint">{{ formData.bio?.length || 0 }}/500</p>
          </div>

          <!-- Email (Read-only) -->
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input 
              id="email"
              :value="formData.email" 
              type="email" 
              class="form-input"
              disabled
            />
            <p class="form-hint">Email cannot be changed here</p>
          </div>

          <!-- Verification Status -->
          <div class="form-group">
            <label class="form-label">Verification Status</label>
            <div class="verification-status">
              <span v-if="formData.is_verified" class="status-badge verified">
                <Icon name="check-circle" size="16" />
                Verified
              </span>
              <span v-else class="status-badge pending">
                <Icon name="clock" size="16" />
                Pending Verification
              </span>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <NuxtLink to="/feed" class="btn btn-secondary">
              Cancel
            </NuxtLink>
            <button 
              type="submit" 
              :disabled="isSaving || !isFormValid"
              class="btn btn-primary"
            >
              <span v-if="!isSaving">Save Changes</span>
              <span v-else>Saving...</span>
            </button>
          </div>

          <!-- Success Message -->
          <div v-if="successMessage" class="success-message">
            <Icon name="check-circle" size="20" />
            {{ successMessage }}
          </div>
        </form>
      </div>
    </main>

    <!-- Avatar Upload Modal -->
    <AvatarUploadModal 
      :is-open="showAvatarModal"
      @close="closeAvatarModal"
      @success="handleAvatarSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'

definePageMeta({
  layout: 'blank',
  middleware:  ['auth','profile-completion', 'language-check'],
})

// ============================================================================
// SETUP
// ============================================================================
const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

// ============================================================================
// STATE
// ============================================================================
const loading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const showAvatarModal = ref(false)
const usernameError = ref<string | null>(null)

const formData = ref({
  full_name: '',
  username: '',
  bio: '',
  email: '',
  avatar_url: '',
  is_verified: false
})

const originalFormData = ref({ ...formData.value })

// ============================================================================
// COMPUTED
// ============================================================================

/**
 * Check if form has valid data
 */
const isFormValid = computed(() => {
  return (
    formData.value.full_name?.trim() !== '' &&
    formData.value.username?.trim() !== '' &&
    !usernameError.value &&
    (formData.value.full_name !== originalFormData.value.full_name ||
     formData.value.username !== originalFormData.value.username ||
     formData.value.bio !== originalFormData.value.bio ||
     formData.value.avatar_url !== originalFormData.value.avatar_url)
  )
})

/**
 * Check if form has changes
 */
const hasChanges = computed(() => {
  return (
    formData.value.full_name !== originalFormData.value.full_name ||
    formData.value.username !== originalFormData.value.username ||
    formData.value.bio !== originalFormData.value.bio ||
    formData.value.avatar_url !== originalFormData.value.avatar_url
  )
})

// ============================================================================
// METHODS - FORM VALIDATION
// ============================================================================

/**
 * Validate username format
 */
const validateUsername = () => {
  const username = formData.value.username?.trim() || ''
  
  if (!username) {
    usernameError.value = 'Username is required'
    return false
  }

  if (username.length < 3) {
    usernameError.value = 'Username must be at least 3 characters'
    return false
  }

  if (username.length > 30) {
    usernameError.value = 'Username must be at most 30 characters'
    return false
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    usernameError.value = 'Username can only contain lowercase letters, numbers, and underscores'
    return false
  }

  usernameError.value = null
  return true
}

// ============================================================================
// METHODS - PROFILE LOADING
// ============================================================================

/**
 * Load profile data
 */
const loadProfile = async () => {
  try {
    console.log('[ProfileEdit] Loading profile...')
    loading.value = true
    error.value = null

    // Get profile from store or fetch
    let profile = profileStore.profile

    if (!profile) {
      console.log('[ProfileEdit] Profile not in store, fetching...')
      const response = await fetch('/api/user/profile')
      
      if (!response.ok) {
        throw new Error('Failed to load profile')
      }

      const data = await response.json()
      profile = data.data
    }

    if (!profile) {
      throw new Error('No profile data available')
    }

    // Populate form
    formData.value = {
      full_name: profile.full_name || '',
      username: profile.username || '',
      bio: profile.bio || '',
      email: profile.email || authStore.user?.email || '',
      avatar_url: profile.avatar_url || '',
      is_verified: profile.is_verified || false
    }

    originalFormData.value = { ...formData.value }

    console.log('[ProfileEdit] ✅ Profile loaded')
  } catch (err: any) {
    console.error('[ProfileEdit] Error loading profile:', err)
    error.value = err.message || 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

// ============================================================================
// METHODS - FORM SUBMISSION
// ============================================================================

/**
 * Save profile changes
 */
const saveProfile = async () => {
  try {
    console.log('[ProfileEdit] Saving profile...')
    
    // Validate form
    if (!validateUsername()) {
      return
    }

    isSaving.value = true
    error.value = null
    successMessage.value = null

    // Prepare data
    const updateData = {
      full_name: formData.value.full_name,
      username: formData.value.username,
      bio: formData.value.bio
    }

    console.log('[ProfileEdit] Sending update request:', updateData)

    // Send update request
    const response = await fetch('/api/profile/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to save profile')
    }

    const data = await response.json()
    console.log('[ProfileEdit] ✅ Profile saved:', data)

    // Update store
    profileStore.setProfile({
      ...profileStore.profile,
      ...data.data
    })

    // Update original data
    originalFormData.value = { ...formData.value }

    // Show success message
    successMessage.value = 'Profile updated successfully!'

    // Redirect after delay
    setTimeout(() => {
      router.push(`/profile/${formData.value.username}`)
    }, 1500)

  } catch (err: any) {
    console.error('[ProfileEdit] Error saving profile:', err)
    error.value = err.message || 'Failed to save profile'
  } finally {
    isSaving.value = false
  }
}

// ============================================================================
// METHODS - AVATAR MODAL
// ============================================================================

/**
 * Open avatar upload modal
 */
const openAvatarModal = () => {
  console.log('[ProfileEdit] Opening avatar modal')
  showAvatarModal.value = true
}

/**
 * Close avatar upload modal
 */
const closeAvatarModal = () => {
  console.log('[ProfileEdit] Closing avatar modal')
  showAvatarModal.value = false
}

/**
 * Handle avatar upload success
 */
const handleAvatarSuccess = (avatarUrl: string) => {
  console.log('[ProfileEdit] Avatar uploaded:', avatarUrl)
  formData.value.avatar_url = avatarUrl
  closeAvatarModal()
}

// ============================================================================
// LIFECYCLE
// ============================================================================
onMounted(async () => {
  console.log('[ProfileEdit] Component mounted')
  await loadProfile()
})
</script>

<style scoped>
/* ============================================================================
   PAGE LAYOUT
   ============================================================================ */
.profile-edit-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
}

/* ============================================================================
   HEADER
   ============================================================================ */
.edit-header {
  background: #1e293b;
  border-bottom: 1px solid #334155;
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
}

.back-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.back-btn:hover {
  background: #0f172a;
  color: #60a5fa;
}

.page-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f1f5f9;
}

/* ============================================================================
   MAIN CONTENT
   ============================================================================ */
.edit-main {
  flex: 1;
  padding: 2rem 1rem;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
  text-align: center;
  color: #ef4444;
}

.error-state h2 {
  margin: 0;
  color: #f1f5f9;
}

.error-state p {
  margin: 0;
  color: #94a3b8;
}

/* ============================================================================
   FORM CONTAINER
   ============================================================================ */
.edit-form-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Avatar Section */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #3b82f6;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: 3px solid #1e293b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.avatar-edit-btn:hover {
  background: #2563eb;
  transform: scale(1.1);
}

.avatar-hint {
  margin: 0;
  font-size: 0.875rem;
  color: #94a3b8;
}

/* ============================================================================
   FORM
   ============================================================================ */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #f1f5f9;
}

.form-input,
.form-textarea {
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s;
}

.form-input:hover,
.form-textarea:hover {
  border-color: #475569;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #64748b;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.username-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.username-prefix {
  position: absolute;
  left: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
}

.username-input {
  padding-left: 2rem;
}

.form-hint {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
}

.form-error {
  margin: 0;
  font-size: 0.75rem;
  color: #ef4444;
}

/* Verification Status */
.verification-status {
  display: flex;
  gap: 0.5rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.verified {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #334155;
  color: #e2e8f0;
}

.btn-secondary:hover {
  background: #475569;
}

/* Success Message */
.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 8px;
  font-weight: 600;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================================================
   RESPONSIVE DESIGN
   ============================================================================ */
@media (max-width: 640px) {
  .edit-main {
    padding: 1rem 0.5rem;
  }

  .page-title {
    font-size: 1.1rem;
  }

  .avatar-image {
    width: 100px;
    height: 100px;
  }

  .avatar-edit-btn {
    width: 36px;
    height: 36px;
  }
}
</style>
