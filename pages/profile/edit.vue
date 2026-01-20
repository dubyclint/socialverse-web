<!-- ============================================================================  
     FILE: /pages/profile/edit.vue - COMPLETE FIXED VERSION  
     ============================================================================  
     ✅ FIX #1: Make bio field OPTIONAL (only full_name required)  
     ✅ Changed isFormValid to only check full_name  
     ✅ This resolves: "Form validation failed" error  
     ============================================================================ -->  
<template>  
  <div class="profile-edit-page">  
    <!-- Header -->  
    <header class="edit-header">  
      <div class="header-content">  
        <NuxtLink to="/feed" class="back-btn">  
          <span class="back-icon">←</span>  
        </NuxtLink>  
        <h1 class="page-title">{{ isNewProfile ? 'Complete Your Profile' : 'Edit Profile' }}</h1>  
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
        <span class="error-icon">⚠️</span>  
        <h2>Error Loading Profile</h2>  
        <p>{{ error }}</p>  
        <button @click="loadProfile" class="btn btn-primary">  
          Try Again  
        </button>  
      </div>  
      <!-- Edit Form -->  
      <div v-else class="edit-form-container">  
        <!-- Progress Indicator (for new profiles) -->  
        <div v-if="isNewProfile" class="profile-progress">  
          <div class="progress-bar">  
            <div class="progress-fill" :style="{ width: completionPercentage + '%' }"></div>  
          </div>  
          <p class="progress-text">{{ completionPercentage }}% Complete</p>  
        </div>  
        <!-- Avatar Section -->  
        <section class="avatar-section">  
          <div class="avatar-wrapper">  
            <img   
              v-if="formData.avatar_url"   
              :src="formData.avatar_url"   
              :alt="formData.full_name"  
              class="avatar-image"  
              @error="handleAvatarError"  
            />  
            <div v-else class="avatar-placeholder">  
              <span class="placeholder-icon">📷</span>  
            </div>  
            <button   
              type="button"  
              @click="triggerAvatarUpload"  
              class="avatar-upload-btn"  
              :disabled="isUploadingAvatar"  
            >  
              {{ isUploadingAvatar ? 'Uploading...' : 'Change Avatar' }}  
            </button>  
            <input   
              ref="avatarInput"  
              type="file"  
              accept="image/*"  
              style="display: none"  
              @change="handleAvatarChange"  
            />  
          </div>  
          <div v-if="uploadAvatarProgress > 0 && uploadAvatarProgress < 100" class="upload-progress">  
            <div class="progress-bar">  
              <div class="progress-fill" :style="{ width: uploadAvatarProgress + '%' }"></div>  
            </div>  
            <p class="progress-text">{{ uploadAvatarProgress }}%</p>  
          </div>  
          <p v-if="uploadAvatarError" class="error-text">{{ uploadAvatarError }}</p>  
        </section>  
        <!-- Form Fields -->  
        <form @submit.prevent="saveProfile" class="edit-form">  
          <!-- Full Name -->  
          <div class="form-group">  
            <label for="full_name" class="form-label">Full Name *</label>  
            <input  
              id="full_name"  
              v-model="formData.full_name"  
              type="text"  
              class="form-input"  
              placeholder="Enter your full name"  
              required  
            />  
          </div>  
          <!-- Username -->  
          <div class="form-group">  
            <label for="username" class="form-label">Username *</label>  
            <div class="username-input-wrapper">  
              <input  
                id="username"  
                v-model="formData.username"  
                type="text"  
                class="form-input"  
                placeholder="Enter your username"  
                @blur="validateUsername"  
                required  
                disabled  
              />  
              <span class="username-hint">Cannot be changed</span>  
            </div>  
            <p v-if="usernameError" class="error-text">{{ usernameError }}</p>  
          </div>  
          <!-- Email -->  
          <div class="form-group">  
            <label for="email" class="form-label">Email</label>  
            <input  
              id="email"  
              v-model="formData.email"  
              type="email"  
              class="form-input"  
              placeholder="Enter your email"  
              disabled  
            />  
            <span class="username-hint">Cannot be changed</span>  
          </div>  
          <!-- Bio (OPTIONAL) -->  
          <div class="form-group">  
            <label for="bio" class="form-label">Bio</label>  
            <textarea  
              id="bio"  
              v-model="formData.bio"  
              class="form-textarea"  
              placeholder="Tell us about yourself"  
              rows="4"  
              maxlength="500"  
            ></textarea>  
            <p class="char-count">{{ formData.bio.length }}/500</p>  
          </div>  
          <!-- Location -->  
          <div class="form-group">  
            <label for="location" class="form-label">Location</label>  
            <input  
              id="location"  
              v-model="formData.location"  
              type="text"  
              class="form-input"  
              placeholder="Enter your location"  
            />  
          </div>  
          <!-- Website -->  
          <div class="form-group">  
            <label for="website" class="form-label">Website</label>  
            <input  
              id="website"  
              v-model="formData.website"  
              type="url"  
              class="form-input"  
              placeholder="https://example.com"  
            />  
          </div>  
          <!-- Birth Date -->  
          <div class="form-group">  
            <label for="birth_date" class="form-label">Birth Date</label>  
            <input  
              id="birth_date"  
              v-model="formData.birth_date"  
              type="date"  
              class="form-input"  
            />  
          </div>  
          <!-- Gender -->  
          <div class="form-group">  
            <label for="gender" class="form-label">Gender</label>  
            <select  
              id="gender"  
              v-model="formData.gender"  
              class="form-input"  
            >  
              <option value="">Select gender</option>  
              <option value="male">Male</option>  
              <option value="female">Female</option>  
              <option value="other">Other</option>  
              <option value="prefer_not_to_say">Prefer not to say</option>  
            </select>  
          </div>  
          <!-- Interests -->  
          <div class="form-group">  
            <label class="form-label">Interests</label>  
            <p class="field-hint">Select up to 5 interests</p>  
            <div class="interests-grid">  
              <button   
                v-for="interest in availableInterests"   
                :key="interest"  
                :class="['interest-tag', { selected: formData.interests.includes(interest) }]"  
                @click="toggleInterest(interest)"  
                type="button"  
              >  
                {{ interest }}  
              </button>  
            </div>  
          </div>  
          <!-- Privacy Settings -->  
          <div class="form-group checkbox-group">  
            <label class="checkbox-label">  
              <input  
                v-model="formData.is_private"  
                type="checkbox"  
                class="form-checkbox"  
              />  
              <span>Make profile private</span>  
            </label>  
          </div>  
          <!-- Success Message -->  
          <div v-if="successMessage" class="success-message">  
            <span class="success-icon">✅</span>  
            {{ successMessage }}  
          </div>  
          <!-- Save Error -->  
          <div v-if="saveError" class="error-message">  
            <span class="error-icon">❌</span>  
            {{ saveError }}  
          </div>  
          <!-- Form Actions -->  
          <div class="form-actions">  
            <button  
              type="button"  
              @click="cancelEdit"  
              class="btn btn-secondary"  
              :disabled="isSaving"  
            >  
              Cancel  
            </button>  
            <button  
              type="submit"  
              class="btn btn-primary"  
              :disabled="isSaving || !isFormValid"  
            >  
              {{ isSaving ? 'Saving...' : 'Save Changes' }}  
            </button>  
          </div>  
        </form>  
      </div>  
    </main>  
  </div>  
</template>  

<script setup lang="ts">    
import { ref, computed, onMounted } from 'vue'    
import { useRouter } from 'vue-router'    
import { useAuthStore } from '~/stores/auth'    
import { useProfileStore } from '~/stores/profile'    
import { useProfileSync } from '~/composables/useProfileSync'    
definePageMeta({    
  middleware: 'auth',    
  layout: 'default'    
})    
// ============================================================================    
// SETUP    
// ============================================================================    
const router = useRouter()    
const authStore = useAuthStore()    
const profileStore = useProfileStore()    
const { broadcastProfileUpdate } = useProfileSync()    
// ============================================================================    
// STATE    
// ============================================================================    
const loading = ref(true)    
const isSaving = ref(false)    
const error = ref<string | null>(null)    
const saveError = ref<string | null>(null)    
const successMessage = ref<string | null>(null)    
const showAvatarModal = ref(false)    
const usernameError = ref<string | null>(null)    
const isNewProfile = ref(false)    
const isUploadingAvatar = ref(false)    
const uploadAvatarProgress = ref(0)    
const uploadAvatarError = ref<string | null>(null)    
const avatarInput = ref<HTMLInputElement | null>(null)    
const formData = ref({    
  full_name: '',    
  username: '',    
  bio: '',    
  email: '',    
  avatar_url: '',  \n  location: '',    
  website: '',    
  birth_date: '',    
  gender: '',    
  interests: [] as string[],    
  is_private: false,    
  is_verified: false    
})    
const originalFormData = ref({ ...formData.value })    
// ============================================================================    
// CONSTANTS    
// ============================================================================    
const availableInterests = [    
  'Technology', 'Sports', 'Music', 'Art', 'Travel',    
  'Food', 'Fashion', 'Gaming', 'Books', 'Movies',    
  'Photography', 'Business', 'Health', 'Education', 'Nature'    
]    
// ============================================================================    
// COMPUTED    
// ============================================================================    
const completionPercentage = computed(() => {    
  const fields = [    
    formData.value.full_name,    
    formData.value.bio,    
    formData.value.avatar_url,    
    formData.value.location,    
    formData.value.website    
  ]    
  const filled = fields.filter(f => f && f.trim().length > 0).length    
  return Math.round((filled / fields.length) * 100)    
})    
// ✅ FIX #1: Make bio optional - only require full_name    
const isFormValid = computed(() => {    
  return (    
    formData.value.full_name?.trim() !== ''    
  )    
})    
const hasChanges = computed(() => {    
  return JSON.stringify(formData.value) !== JSON.stringify(originalFormData.value)    
})    
// ============================================================================    
// METHODS    
// ============================================================================    
const loadProfile = async () => {    
  console.log('[ProfileEdit] ============ LOAD PROFILE START ============')    
  loading.value = true    
  error.value = null    
  try {    
    const currentUser = authStore.user    
    if (!currentUser?.id) {    
      throw new Error('User not authenticated')    
    }    
    console.log('[ProfileEdit] Loading profile for user:', currentUser.id)    
    let profile = profileStore.profile    
    if (!profile) {    
      console.log('[ProfileEdit] Profile not in store, fetching from API...')    
      await profileStore.fetchProfile(currentUser.id)    
      profile = profileStore.profile    
    }    
    if (!profile) {    
      throw new Error('Profile not found')    
    }    
    console.log('[ProfileEdit] ✅ Profile loaded:', profile)    
    formData.value = {    
      full_name: profile.full_name || '',    
      username: profile.username || '',    
      bio: profile.bio || '',    
      email: profile.email || '',    
      avatar_url: profile.avatar_url || '',    
      location: profile.location || '',    
      website: profile.website || '',    
      birth_date: profile.birth_date || '',    
      gender: profile.gender || '',    
      interests: profile.interests || [],    
      is_private: profile.is_private || false,    
      is_verified: profile.is_verified || false    
    }    
    originalFormData.value = { ...formData.value }    
    isNewProfile.value = !profile.profile_completed    
    console.log('[ProfileEdit] ✅ Form populated successfully')    
    console.log('[ProfileEdit] ============ LOAD PROFILE END ============')    
  } catch (err: any) {    
    console.error('[ProfileEdit] ============ LOAD PROFILE ERROR ============')    
    console.error('[ProfileEdit] ❌ Error loading profile:', err)    
        
    const errorMessage = err?.data?.message || err?.message || 'Failed to load profile'    
    error.value = errorMessage    
        
    console.error('[ProfileEdit] ============ LOAD PROFILE ERROR END ============')    
  } finally {    
    loading.value = false    
  }    
}    
const validateUsername = async () => {    
  console.log('[ProfileEdit] Validating username:', formData.value.username)    
  usernameError.value = null    
  if (!formData.value.username || formData.value.username.trim().length === 0) {    
    usernameError.value = 'Username is required'    
    return    
  }    
  if (formData.value.username.length < 3) {    
    usernameError.value = 'Username must be at least 3 characters'    
    return    
  }    
  if (!/^[a-zA-Z0-9_-]+$/.test(formData.value.username)) {    
    usernameError.value = 'Username can only contain letters, numbers, underscores, and hyphens'    
    return    
  }    
  console.log('[ProfileEdit] ✅ Username is valid')    
}    
const triggerAvatarUpload = () => {    
  console.log('[ProfileEdit] Triggering avatar upload')    
  avatarInput.value?.click()    
}    
const handleAvatarChange = async (event: Event) => {    
  console.log('[ProfileEdit] ============ AVATAR UPLOAD START ============')    
      
  const input = event.target as HTMLInputElement    
  const file = input.files?.[0]    
  if (!file) {    
    console.log('[ProfileEdit] No file selected')    
    return    
  }    
  console.log('[ProfileEdit] File selected:', file.name, file.size)    
  if (!file.type.startsWith('image/')) {    
    uploadAvatarError.value = 'Please select an image file'    
    console.error('[ProfileEdit] Invalid file type:', file.type)    
    return    
  }    
  if (file.size > 5 * 1024 * 1024) {    
    uploadAvatarError.value = 'File size must be less than 5MB'    
    console.error('[ProfileEdit] File too large:', file.size)    
    return    
  }    
  isUploadingAvatar.value = true    
  uploadAvatarProgress.value = 0    
  uploadAvatarError.value = null    
  try {    
    const formDataToSend = new FormData()    
    formDataToSend.append('file', file)    
    console.log('[ProfileEdit] Uploading avatar...')    
    const response = await $fetch('/api/profile/avatar-upload', {    
      method: 'POST',    
      headers: {    
        'Authorization': `Bearer ${authStore.token}`    
      },    
      body: formDataToSend,    
      onUploadProgress: (event: any) => {    
        if (event.total) {    
          uploadAvatarProgress.value = Math.round((event.loaded / event.total) * 100)    
          console.log('[ProfileEdit] Upload progress:', uploadAvatarProgress.value + '%')    
        }    
      }    
    })    
    console.log('[ProfileEdit] ✅ Avatar uploaded:', response)    
    if (response?.url) {    
      formData.value.avatar_url = response.url    
      console.log('[ProfileEdit] Avatar URL updated')    
    }    
    console.log('[ProfileEdit] ============ AVATAR UPLOAD END ============')    
  } catch (err: any) {    
    console.error('[ProfileEdit] ============ AVATAR UPLOAD ERROR ============')    
    console.error('[ProfileEdit] ❌ Error uploading avatar:', err)    
        
    const errorMessage = err?.data?.message || err?.message || 'Failed to upload avatar'    
    uploadAvatarError.value = errorMessage    
        
    console.error('[ProfileEdit] ============ AVATAR UPLOAD ERROR END ============')    
  } finally {    
    isUploadingAvatar.value = false    
    uploadAvatarProgress.value = 0    
    input.value = ''    
  }    
}    
const handleAvatarError = (event: Event) => {    
  console.error('[ProfileEdit] Avatar load error')    
  const img = event.target as HTMLImageElement    
  img.style.display = 'none'    
}    
const toggleInterest = (interest: string) => {    
  console.log('[ProfileEdit] Toggling interest:', interest)    
      
  if (formData.value.interests.includes(interest)) {    
    formData.value.interests = formData.value.interests.filter(i => i !== interest)    
  } else if (formData.value.interests.length < 5) {    
    formData.value.interests.push(interest)    
  }    
  console.log('[ProfileEdit] Selected interests:', formData.value.interests)    
}    
// ============================================================================    
// ✅ CRITICAL FIX: saveProfile function - CHANGED ENDPOINT  
// ============================================================================    
const saveProfile = async () => {    
  console.log('[ProfileEdit] ============ SAVE PROFILE START ============')    
  console.log('[ProfileEdit] Saving profile with data:', formData.value)    
    
  if (!isFormValid.value) {    
    saveError.value = 'Please fill in all required fields'    
    console.error('[ProfileEdit] Form validation failed')    
    return    
  }    
    
  isSaving.value = true    
  saveError.value = null    
  successMessage.value = null    
    
  try {    
    const updateData = {    
      full_name: formData.value.full_name,    
      bio: formData.value.bio,    
      avatar_url: formData.value.avatar_url,    
      location: formData.value.location,    
      website: formData.value.website,    
      birth_date: formData.value.birth_date,    
      gender: formData.value.gender,    
      interests: formData.value.interests,    
      is_private: formData.value.is_private,    
      profile_completed: true    
    }    
      
    console.log('[ProfileEdit] Sending update request with data:', updateData)    
      
    // ✅ FIXED: Changed from /api/profile/update to /api/profile/complete  
    const response = await $fetch('/api/profile/complete', {    
      method: 'POST',    
      headers: {    
        'Authorization': `Bearer ${authStore.token}`    
      },    
      body: updateData    
    })    
      
    console.log('[ProfileEdit] ✅ Profile update response:', response)    
    if (response) {    
      profileStore.setProfile(response)    
      broadcastProfileUpdate(response)    
      originalFormData.value = { ...formData.value }    
      successMessage.value = 'Profile updated successfully!'    
      console.log('[ProfileEdit] ✅ Profile saved successfully')    
      setTimeout(() => {    
        console.log('[ProfileEdit] Redirecting to profile page')    
        router.push(`/profile/${response.id || response.username}`)    
      }, 1500)    
    }    
    console.log('[ProfileEdit] ============ SAVE PROFILE END ============')    
  } catch (err: any) {    
    console.error('[ProfileEdit] ============ SAVE PROFILE ERROR ============')    
    console.error('[ProfileEdit] ❌ Error saving profile:', err)    
        
    const errorMessage = err?.data?.message || err?.message || 'Failed to save profile'    
    saveError.value = errorMessage    
        
    console.error('[ProfileEdit] ============ SAVE PROFILE ERROR END ============')    
  } finally {    
    isSaving.value = false    
  }    
}    
const cancelEdit = () => {    
  console.log('[ProfileEdit] Canceling edit')    
      
  if (hasChanges.value) {    
    const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?')    
    if (!confirmed) {    
      return    
    }    
  }    
  router.back()    
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
  max-width: 700px;  
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
  font-size: 1.5rem;  
}  
.back-btn:hover {  
  background: #0f172a;  
  color: #60a5fa;  
}  
.back-icon {  
  display: inline-block;  
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
  max-width: 700px;  
  margin: 0 auto;  
  width: 100%;  
}  
.loading-state {  
  display: flex;  
  flex-direction: column;  
  align-items: center;  
  justify-content: center;  
  min-height: 400px;  
  gap: 1rem;  
}  
.spinner {  
  width: 40px;  
  height: 40px;  
  border: 4px solid #334155;  
  border-top-color: #3b82f6;  
  border-radius: 50%;  
  animation: spin 1s linear infinite;  
}  
@keyframes spin {  
  to {  
    transform: rotate(360deg);  
  }  
}  
.error-state {  
  display: flex;  
  flex-direction: column;  
  align-items: center;  
  justify-content: center;  
  min-height: 400px;  
  gap: 1rem;  
  text-align: center;  
}  
.error-icon {  
  font-size: 3rem;  
}  
.error-state h2 {  
  margin: 0;  
  font-size: 1.5rem;  
  color: #f87171;  
}  
.error-state p {  
  margin: 0;  
  color: #cbd5e1;  
}  
/* ============================================================================  
   FORM CONTAINER  
   ============================================================================ */  
.edit-form-container {  
  background: #1e293b;  
  border-radius: 8px;  
  padding: 2rem;  
  border: 1px solid #334155;  
}  
.profile-progress {  
  margin-bottom: 2rem;  
}  
.progress-bar {  
  width: 100%;  
  height: 8px;  
  background: #334155;  
  border-radius: 4px;  
  overflow: hidden;  
}  
.progress-fill {  
  height: 100%;  
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);  
  transition: width 0.3s ease;  
}  
.progress-text {  
  margin: 0.5rem 0 0 0;  
  font-size: 0.875rem;  
  color: #94a3b8;  
  text-align: center;  
}  
/* ============================================================================  
   AVATAR SECTION  
   ============================================================================ */  
.avatar-section {  
  margin-bottom: 2rem;  
  text-align: center;  
}  
.avatar-wrapper {  
  position: relative;  
  display: inline-block;  
  margin-bottom: 1rem;  
}  
.avatar-image,  
.avatar-placeholder {  
  width: 120px;  
  height: 120px;  
  border-radius: 50%;  
  border: 4px solid #3b82f6;  
  object-fit: cover;  
  display: block;  
}  
.avatar-placeholder {  
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);  
  display: flex;  
  align-items: center;  
  justify-content: center;  
  font-size: 3rem;  
}  
.avatar-upload-btn {  
  display: block;  
  margin: 1rem auto 0;  
  padding: 0.5rem 1rem;  
  background: #3b82f6;  
  color: white;  
  border: none;  
  border-radius: 6px;  
  cursor: pointer;  
  font-weight: 500;  
  transition: background 0.2s;  
}  
.avatar-upload-btn:hover:not(:disabled) {  
  background: #2563eb;  
}  
.avatar-upload-btn:disabled {  
  background: #64748b;  
  cursor: not-allowed;  
}  
.upload-progress {  
  margin-top: 1rem;  
}  
/* ============================================================================  
   FORM FIELDS  
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
  font-weight: 600;  
  color: #f1f5f9;  
  font-size: 0.95rem;  
}  
.form-input,  
.form-textarea {  
  padding: 0.75rem;  
  background: #0f172a;  
  border: 1px solid #334155;  
  border-radius: 6px;  
  color: #e2e8f0;  
  font-family: inherit;  
  font-size: 1rem;  
  transition: border-color 0.2s;  
}  
.form-input:focus,  
.form-textarea:focus {  
  outline: none;  
  border-color: #3b82f6;  
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);  
}  
.form-input:disabled {  
  background: #1e293b;  
  color: #64748b;  
  cursor: not-allowed;  
}  
.form-textarea {  
  resize: vertical;  
  min-height: 100px;  
}  
.username-input-wrapper {  
  position: relative;  
}  
.username-hint {  
  font-size: 0.8rem;  
  color: #94a3b8;  
  margin-top: 0.25rem;  
}  
.char-count {  
  font-size: 0.8rem;  
  color: #94a3b8;  
  margin: 0;  
}  
.field-hint {  
  margin: 0;  
  font-size: 0.75rem;  
  color: #64748b;  
}  
/* ============================================================================  
   INTERESTS GRID  
   ============================================================================ */  
.interests-grid {  
  display: grid;  
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));  
  gap: 0.75rem;  
}  
.interest-tag {  
  padding: 0.75rem 1rem;  
  background: #0f172a;  
  border: 1px solid #334155;  
  color: #cbd5e1;  
  border-radius: 8px;  
  cursor: pointer;  
  transition: all 0.2s;  
  font-size: 0.875rem;  
  font-weight: 500;  
}  
.interest-tag:hover {  
  border-color: #475569;  
  background: #1e293b;  
}  
.interest-tag.selected {  
  background: #3b82f6;  
  border-color: #3b82f6;  
  color: white;  
}  
/* ============================================================================  
   CHECKBOX  
   ============================================================================ */  
.checkbox-group {  
  flex-direction: row;  
  align-items: center;  
}  
.checkbox-label {  
  display: flex;  
  align-items: center;  
  gap: 0.5rem;  
  cursor: pointer;  
  font-weight: 500;  
}  
.form-checkbox {  
  width: 18px;  
  height: 18px;  
  cursor: pointer;  
  accent-color: #3b82f6;  
}  
/* ============================================================================  
   MESSAGES  
   ============================================================================ */  
.success-message,  
.error-message {  
  padding: 1rem;  
  border-radius: 6px;  
  display: flex;  
  align-items: center;  
  gap: 0.75rem;  
  font-weight: 500;  
}  
.success-message {  
  background: #064e3b;  
  color: #86efac;  
  border: 1px solid #10b981;  
}  
.success-icon {  
  font-size: 1.25rem;  
}  
.error-message {  
  background: #7f1d1d;  
  color: #fca5a5;  
  border: 1px solid #ef4444;  
}  
.error-text {  
  color: #f87171;  
  font-size: 0.875rem;  
  margin: 0.25rem 0 0 0;  
}  
/* ============================================================================  
   BUTTONS  
   ============================================================================ */  
.form-actions {  
  display: flex;  
  gap: 1rem;  
  margin-top: 2rem;  
  justify-content: flex-end;  
}  
.btn {  
  padding: 0.75rem 1.5rem;  
  border: none;  
  border-radius: 6px;  
  font-weight: 600;  
  cursor: pointer;  
  transition: all 0.2s;  
  font-size: 1rem;  
}  
.btn-primary {  
  background: #3b82f6;  
  color: white;  
}  
.btn-primary:hover:not(:disabled) {  
  background: #2563eb;  
}  
.btn-primary:disabled {  
  background: #64748b;  
  cursor: not-allowed;  
  opacity: 0.6;  
}  
.btn-secondary {  
  background: #334155;  
  color: #e2e8f0;  
}  
.btn-secondary:hover:not(:disabled) {  
  background: #475569;  
}  
.btn-secondary:disabled {  
  background: #1e293b;  
  cursor: not-allowed;  
  opacity: 0.6;  
}  
/* ============================================================================  
   RESPONSIVE DESIGN  
   ============================================================================ */  
@media (max-width: 640px) {  
  .edit-main {  
    padding: 1rem;  
  }  
  .edit-form-container {  
    padding: 1.5rem;  
  }  
  .form-actions {  
    flex-direction: column;  
  }  
  .btn {  
    width: 100%;  
  }  
  .page-title {  
    font-size: 1.1rem;  
  }  
  .avatar-image,  
  .avatar-placeholder {  
    width: 100px;  
    height: 100px;  
  }  
  .interests-grid {  
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));  
  }  
}  
</style>  

