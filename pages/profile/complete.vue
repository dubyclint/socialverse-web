<!-- ============================================================================
     FILE: /pages/profile/complete.vue - PART 1 (TEMPLATE) - USERNAME FIX ONLY
     ============================================================================
     ✅ FIXED: Username field changed to read-only display
     ✅ PRESERVED: All other functionality intact
     ============================================================================ -->

<template>
  <div class="profile-complete-page">
    <!-- HEADER - unchanged -->
    <header class="complete-header">
      <div class="header-content">
        <button class="btn-back" @click="goBack" title="Go back">
          <Icon name="arrow-left" size="20" />
        </button>
        
        <div class="header-info">
          <h1 class="page-title">Complete Your Profile</h1>
          <p class="page-subtitle">Add your information to get started</p>
        </div>

        <div class="header-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <span class="progress-text">{{ progressPercentage }}% Complete</span>
        </div>
      </div>
    </header>

    <!-- MAIN CONTENT -->
    <main class="complete-main">
      <div class="form-container">
        <!-- Form Card -->
        <div class="form-card">
          <!-- Avatar Section - unchanged -->
          <section class="form-section avatar-section">
            <h2 class="section-title">Profile Photo</h2>
            <p class="section-description">Upload a profile picture to personalize your account</p>

            <div class="avatar-upload-wrapper">
              <div class="avatar-preview">
                <img 
                  v-if="formData.avatarPreview" 
                  :src="formData.avatarPreview" 
                  :alt="formData.fullName || 'Profile'" 
                  class="avatar-image"
                />
                <div v-else class="avatar-placeholder">
                  <Icon name="user" size="48" />
                </div>

                <button 
                  class="btn-upload-overlay"
                  @click="triggerAvatarUpload"
                  title="Upload photo"
                >
                  <Icon name="camera" size="24" />
                </button>
              </div>

              <input 
                ref="avatarInput"
                type="file" 
                accept="image/*" 
                class="hidden-input"
                @change="handleAvatarUpload"
              />

              <div class="upload-info">
                <p class="info-text">JPG, PNG or GIF (Max 5MB)</p>
                <button 
                  type="button"
                  class="btn-upload-text"
                  @click="triggerAvatarUpload"
                >
                  Click to upload
                </button>
              </div>

              <div v-if="avatarUploading" class="upload-progress">
                <div class="spinner-small"></div>
                <span>Uploading...</span>
              </div>

              <div v-if="avatarError" class="upload-error">
                <Icon name="alert-circle" size="16" />
                <span>{{ avatarError }}</span>
              </div>
            </div>
          </section>

          <!-- Divider -->
          <div class="form-divider"></div>

          <!-- Basic Info Section -->
          <section class="form-section">
            <h2 class="section-title">Basic Information</h2>
            <p class="section-description">Tell us about yourself</p>

            <!-- Username Field - FIXED: Now read-only display -->
            <div class="form-group">
              <label class="form-label">Username</label>
              <div class="username-display">
                <div class="username-value">@{{ formData.username }}</div>
                <span class="username-badge">Set at signup</span>
              </div>
            </div>

            <!-- Full Name Field - unchanged -->
            <div class="form-group">
              <label for="fullName" class="form-label">
                Full Name
                <span class="required">*</span>
              </label>
              <input 
                id="fullName"
                v-model="formData.fullName"
                type="text" 
                placeholder="John Doe"
                class="form-input"
                :class="{ 'has-error': errors.fullName }"
                @blur="validateFullName"
              />
              <p v-if="errors.fullName" class="error-message">{{ errors.fullName }}</p>
              <p class="field-hint">{{ formData.fullName.length }}/100 characters</p>
            </div>

            <!-- Email Field - unchanged -->
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input 
                id="email"
                :value="currentUserEmail"
                type="email" 
                class="form-input read-only"
                readonly
              />
              <p class="field-hint">Your email cannot be changed here</p>
            </div>
          </section>

          <!-- Divider -->
          <div class="form-divider"></div>

          <!-- Bio Section - unchanged -->
          <section class="form-section">
            <h2 class="section-title">About You</h2>
            <p class="section-description">Write a short bio to introduce yourself</p>

            <div class="form-group">
              <label for="bio" class="form-label">
                Bio
                <span class="required">*</span>
              </label>
              <textarea 
                id="bio"
                v-model="formData.bio"
                placeholder="Tell us about yourself..."
                class="form-textarea"
                :class="{ 'has-error': errors.bio }"
                rows="4"
                @blur="validateBio"
              ></textarea>
              <p v-if="errors.bio" class="error-message">{{ errors.bio }}</p>
              <p class="field-hint">{{ formData.bio.length }}/500 characters</p>
            </div>

            <div class="form-group">
              <label for="location" class="form-label">Location</label>
              <div class="input-wrapper">
                <Icon name="map-pin" size="16" class="input-icon" />
                <input 
                  id="location"
                  v-model="formData.location"
                  type="text" 
                  placeholder="City, Country"
                  class="form-input with-icon"
                />
              </div>
              <p class="field-hint">{{ formData.location.length }}/100 characters</p>
            </div>

            <div class="form-group">
              <label for="website" class="form-label">Website</label>
              <div class="input-wrapper">
                <Icon name="link" size="16" class="input-icon" />
                <input 
                  id="website"
                  v-model="formData.website"
                  type="url" 
                  placeholder="https://example.com"
                  class="form-input with-icon"
                  @blur="validateWebsite"
                />
              </div>
              <p v-if="errors.website" class="error-message">{{ errors.website }}</p>
              <p class="field-hint">Include the full URL with https://</p>
            </div>
          </section>

          <!-- Divider -->
          <div class="form-divider"></div>

          <!-- Additional Info Section - unchanged -->
          <section class="form-section">
            <h2 class="section-title">Additional Information</h2>
            <p class="section-description">Help us personalize your experience</p>

            <div class="form-group">
              <label for="dateOfBirth" class="form-label">Date of Birth</label>
              <input 
                id="dateOfBirth"
                v-model="formData.dateOfBirth"
                type="date" 
                class="form-input"
              />
              <p class="field-hint">We'll use this to show you age-appropriate content</p>
            </div>

            <div class="form-group">
              <label for="gender" class="form-label">Gender</label>
              <select 
                id="gender"
                v-model="formData.gender"
                class="form-select"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

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
          </section>

          <!-- Divider -->
          <div class="form-divider"></div>

          <!-- Privacy Section - unchanged -->
          <section class="form-section">
            <h2 class="section-title">Privacy & Preferences</h2>
            <p class="section-description">Control your account settings</p>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  v-model="formData.isPrivate"
                  type="checkbox" 
                  class="checkbox-input"
                />
                <span class="checkbox-text">Make my profile private</span>
              </label>
              <p class="field-hint">Only approved followers can see your posts</p>
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  v-model="formData.emailNotifications"
                  type="checkbox" 
                  class="checkbox-input"
                />
                <span class="checkbox-text">Receive email notifications</span>
              </label>
              <p class="field-hint">Get updates about your account activity</p>
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input 
                  v-model="formData.agreeToTerms"
                  type="checkbox" 
                  class="checkbox-input"
                  :class="{ 'has-error': errors.agreeToTerms }"
                />
                <span class="checkbox-text">
                  I agree to the
                  <NuxtLink to="/terms" target="_blank" class="link">Terms of Service</NuxtLink>
                  and
                  <NuxtLink to="/privacy" target="_blank" class="link">Privacy Policy</NuxtLink>
                </span>
              </label>
              <p v-if="errors.agreeToTerms" class="error-message">{{ errors.agreeToTerms }}</p>
            </div>
          </section>
        </div>

        <!-- Form Actions - unchanged -->
        <div class="form-actions">
          <button 
            class="btn-cancel"
            @click="goBack"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button 
            class="btn-submit"
            @click="submitProfile"
            :disabled="submitting || !isFormValid"
          >
            <span v-if="!submitting">Complete Profile</span>
            <span v-else class="btn-loading">
              <Icon name="loader" size="16" />
              Saving...
            </span>
          </button>
        </div>

        <!-- Error Alert - unchanged -->
        <div v-if="submitError" class="alert alert-error">
          <Icon name="alert-circle" size="20" />
          <div class="alert-content">
            <h3 class="alert-title">Error</h3>
            <p class="alert-message">{{ submitError }}</p>
          </div>
          <button class="btn-close-alert" @click="submitError = null">
            <Icon name="x" size="16" />
          </button>
        </div>

        <!-- Success Alert - unchanged -->
        <div v-if="submitSuccess" class="alert alert-success">
          <Icon name="check-circle" size="20" />
          <div class="alert-content">
            <h3 class="alert-title">Success!</h3>
            <p class="alert-message">Your profile has been completed successfully</p>
          </div>
        </div>
      </div>

      <!-- Info Sidebar - unchanged -->
      <aside class="info-sidebar">
        <div class="info-card">
          <Icon name="info" size="24" />
          <h3 class="info-title">Profile Tips</h3>
          <ul class="info-list">
            <li>Use a clear, recognizable profile photo</li>
            <li>Write a bio that describes your interests</li>
            <li>Add your location to connect with locals</li>
            <li>Include your website to drive traffic</li>
            <li>Select interests to find like-minded people</li>
          </ul>
        </div>

        <div class="info-card">
          <Icon name="shield" size="24" />
          <h3 class="info-title">Your Privacy</h3>
          <p class="info-text">
            Your information is secure and will only be used to personalize your experience. You can update your privacy settings anytime.
          </p>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'
import { useFetchWithAuth } from '~/composables/use-fetch'

// ============================================================================
// SETUP & INITIALIZATION
// ============================================================================
const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const fetchWithAuth = useFetchWithAuth()

// ============================================================================
// REACTIVE STATE - FORM DATA
// ============================================================================
const formData = ref({
  username: authStore.user?.username || '',
  fullName: '',
  bio: '',
  location: '',
  website: '',
  dateOfBirth: '',
  gender: '',
  interests: [] as string[],
  isPrivate: false,
  emailNotifications: true,
  agreeToTerms: false,
  avatarUrl: '',
  avatarPreview: ''
})

// ============================================================================
// REACTIVE STATE - FORM VALIDATION
// ============================================================================
const errors = ref({
  username: '',
  fullName: '',
  bio: '',
  website: '',
  agreeToTerms: ''
})

// ============================================================================
// REACTIVE STATE - UI STATE
// ============================================================================
const submitting = ref(false)
const submitError = ref<string | null>(null)
const submitSuccess = ref(false)
const avatarUploading = ref(false)
const avatarError = ref<string | null>(null)
const usernameChecking = ref(false)
const usernameAvailable = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================
const currentUserEmail = computed(() => authStore.user?.email || '')

const availableInterests = [
  'Technology', 'Sports', 'Music', 'Art', 'Travel',
  'Food', 'Fashion', 'Gaming', 'Books', 'Movies',
  'Photography', 'Business', 'Health', 'Education', 'Nature'
]

const progressPercentage = computed(() => {
  let completed = 0
  const total = 6

  if (formData.value.username) completed++
  if (formData.value.fullName) completed++
  if (formData.value.bio) completed++
  if (formData.value.avatarUrl) completed++
  if (formData.value.interests.length > 0) completed++
  if (formData.value.agreeToTerms) completed++

  return Math.round((completed / total) * 100)
})

const isFormValid = computed(() => {
  return (
    formData.value.username &&
    formData.value.fullName &&
    formData.value.bio &&
    formData.value.agreeToTerms &&
    !errors.value.username &&
    !errors.value.fullName &&
    !errors.value.bio &&
    !errors.value.website &&
    usernameAvailable
  )
})

// ============================================================================
// METHODS - VALIDATION
// ============================================================================
const validateUsername = () => {
  console.log('[ProfileComplete] Validating username:', formData.value.username)
  
  errors.value.username = ''

  if (!formData.value.username) {
    errors.value.username = 'Username is required'
    return
  }

  if (formData.value.username.length < 3) {
    errors.value.username = 'Username must be at least 3 characters'
    return
  }

  if (formData.value.username.length > 30) {
    errors.value.username = 'Username must be less than 30 characters'
    return
  }

  if (!/^[a-z0-9_-]+$/.test(formData.value.username.toLowerCase())) {
    errors.value.username = 'Username can only contain letters, numbers, underscores, and hyphens'
    return
  }

  console.log('[ProfileComplete] Username validation passed')
}

const validateFullName = () => {
  console.log('[ProfileComplete] Validating full name:', formData.value.fullName)
  
  errors.value.fullName = ''

  if (!formData.value.fullName) {
    errors.value.fullName = 'Full name is required'
    return
  }

  if (formData.value.fullName.length < 2) {
    errors.value.fullName = 'Full name must be at least 2 characters'
    return
  }

  if (formData.value.fullName.length > 100) {
    errors.value.fullName = 'Full name must be less than 100 characters'
    return
  }

  console.log('[ProfileComplete] Full name validation passed')
}

const validateBio = () => {
  console.log('[ProfileComplete] Validating bio:', formData.value.bio)
  
  errors.value.bio = ''

  if (!formData.value.bio) {
    errors.value.bio = 'Bio is required'
    return
  }

  if (formData.value.bio.length < 10) {
    errors.value.bio = 'Bio must be at least 10 characters'
    return
  }

  if (formData.value.bio.length > 500) {
    errors.value.bio = 'Bio must be less than 500 characters'
    return
  }

  console.log('[ProfileComplete] Bio validation passed')
}

const validateWebsite = () => {
  console.log('[ProfileComplete] Validating website:', formData.value.website)
  
  errors.value.website = ''

  if (!formData.value.website) {
    return
  }

  try {
    new URL(formData.value.website)
    console.log('[ProfileComplete] Website validation passed')
  } catch {
    errors.value.website = 'Please enter a valid URL (e.g., https://example.com)'
  }
}

// ============================================================================
// METHODS - USERNAME AVAILABILITY CHECK
// ============================================================================
const checkUsernameAvailability = async () => {
  console.log('[ProfileComplete] Checking username availability:', formData.value.username)
  
  if (!formData.value.username || formData.value.username.length < 3) {
    usernameAvailable.value = false
    return
  }

  try {
    validateUsername()
    if (errors.value.username) {
      usernameAvailable.value = false
      return
    }

    usernameChecking.value = true

    const response = await fetchWithAuth('/api/auth/check-username', {
      method: 'POST',
      body: { username: formData.value.username }
    })

    console.log('[ProfileComplete] Username availability response:', response)
    usernameAvailable.value = response.available || false
  } catch (err) {
    console.error('[ProfileComplete] Error checking username:', err)
    usernameAvailable.value = false
  } finally {
    usernameChecking.value = false
  }
}

// ============================================================================
// METHODS - FILE UPLOAD
// ============================================================================
const triggerAvatarUpload = () => {
  console.log('[ProfileComplete] Triggering avatar upload')
  avatarInput.value?.click()
}

const handleAvatarUpload = async (event: Event) => {
  console.log('[ProfileComplete] Handling avatar upload')
  
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    console.warn('[ProfileComplete] No file selected')
    return
  }

  avatarError.value = null

  if (!file.type.startsWith('image/')) {
    avatarError.value = 'Please select an image file'
    console.error('[ProfileComplete] Invalid file type:', file.type)
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    avatarError.value = 'File size must be less than 5MB'
    console.error('[ProfileComplete] File too large:', file.size)
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    formData.value.avatarPreview = e.target?.result as string
    console.log('[ProfileComplete] Avatar preview created')
  }
  reader.readAsDataURL(file)

  try {
    avatarUploading.value = true
    console.log('[ProfileComplete] Uploading avatar...')

    const formDataToSend = new FormData()
    formDataToSend.append('file', file)

    const uploadResponse = await fetchWithAuth('/api/upload/avatar', {
      method: 'POST',
      body: formDataToSend
    })

    console.log('[ProfileComplete] Upload response:', uploadResponse)

    if (!uploadResponse?.success) {
      throw new Error(uploadResponse?.message || 'Upload failed')
    }

    if (!uploadResponse.url) {
      throw new Error('No URL returned from upload')
    }

    formData.value.avatarUrl = uploadResponse.url
    console.log('[ProfileComplete] Avatar uploaded successfully:', uploadResponse.url)
  } catch (err: any) {
    console.error('[ProfileComplete] Error uploading avatar:', err)
    avatarError.value = err?.message || 'Failed to upload avatar'
    formData.value.avatarPreview = ''
    formData.value.avatarUrl = ''
  } finally {
    avatarUploading.value = false
  }
}

// ============================================================================
// METHODS - FORM INTERACTIONS
// ============================================================================
const toggleInterest = (interest: string) => {
  console.log('[ProfileComplete] Toggling interest:', interest)
  
  if (formData.value.interests.includes(interest)) {
    formData.value.interests = formData.value.interests.filter(i => i !== interest)
  } else if (formData.value.interests.length < 5) {
    formData.value.interests.push(interest)
  }

  console.log('[ProfileComplete] Selected interests:', formData.value.interests)
}

// ============================================================================
// METHODS - FORM SUBMISSION
// ============================================================================
const submitProfile = async () => {
  console.log('[ProfileComplete] ============ SUBMIT PROFILE START ============')
  console.log('[ProfileComplete] Form data:', {
    username: formData.value.username,
    fullName: formData.value.fullName,
    bio: formData.value.bio,
    avatarUrl: formData.value.avatarUrl,
    interests: formData.value.interests,
    agreeToTerms: formData.value.agreeToTerms
  })

  try {
    submitting.value = true
    submitError.value = null
    submitSuccess.value = false

    validateUsername()
    validateFullName()
    validateBio()
    validateWebsite()

    if (!isFormValid.value) {
      console.error('[ProfileComplete] Form validation failed')
      submitError.value = 'Please fix the errors in the form'
      return
    }

    console.log('[ProfileComplete] Form validation passed')

    if (!formData.value.username) {
      throw new Error('Username is required')
    }

    if (!formData.value.fullName) {
      throw new Error('Full name is required')
    }

    if (!formData.value.bio) {
      throw new Error('Bio is required')
    }

    if (!formData.value.agreeToTerms) {
      throw new Error('You must agree to the terms and conditions')
    }

    console.log('[ProfileComplete] Submitting profile to API...')

    const result = await fetchWithAuth('/api/profile/complete', {
      method: 'POST',
      body: {
        username: formData.value.username,
        full_name: formData.value.fullName,
        bio: formData.value.bio,
        location: formData.value.location,
        website: formData.value.website,
        date_of_birth: formData.value.dateOfBirth,
        gender: formData.value.gender,
        interests: formData.value.interests,
        avatar_url: formData.value.avatarUrl,
        is_private: formData.value.isPrivate,
        email_notifications: formData.value.emailNotifications
      }
    })

    console.log('[ProfileComplete] API response:', result)

    if (!result) {
      throw new Error('No response from server')
    }

    if (!result.success) {
      throw new Error(result.message || 'Failed to complete profile')
    }

    console.log('[ProfileComplete] ✅ Profile completed successfully')
    submitSuccess.value = true

    if (result.profile) {
      console.log('[ProfileComplete] Updating profile store')
      profileStore.setProfile(result.profile)
    }

    setTimeout(() => {
      console.log('[ProfileComplete] Redirecting to feed')
      router.push('/feed')
    }, 2000)

    console.log('[ProfileComplete] ============ SUBMIT PROFILE END (SUCCESS) ============')
  } catch (err: any) {
    console.error('[ProfileComplete] ============ SUBMIT PROFILE ERROR ============')
    console.error('[ProfileComplete] Error:', err)
    
    const errorMessage = err?.data?.message || err?.message || 'Failed to complete profile'
    submitError.value = errorMessage

    console.error('[ProfileComplete] Error details:', {
      message: errorMessage,
      status: err?.status,
      statusCode: err?.statusCode
    })
    console.error('[ProfileComplete] ============ SUBMIT PROFILE ERROR END ============')
  } finally {
    submitting.value = false
  }
}

// ============================================================================
// METHODS - NAVIGATION
// ============================================================================
const goBack = () => {
  console.log('[ProfileComplete] Going back')
  router.back()
}

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================
onMounted(() => {
  console.log('[ProfileComplete] Component mounted')
  console.log('[ProfileComplete] Current user:', {
    id: authStore.user?.id,
    email: authStore.user?.email,
    username: authStore.user?.username
  })
  usernameAvailable.value = true
})
</script>

<style scoped>
/* ============================================================================
   GLOBAL STYLES
   ============================================================================ */
.profile-complete-page {
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
}

/* ============================================================================
   HEADER SECTION
   ============================================================================ */
.complete-header {
  background: #1e293b;
  border-bottom: 1px solid #334155;
  padding: 2rem 1rem;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.btn-back {
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
  flex-shrink: 0;
}

.btn-back:hover {
  background: #0f172a;
  color: #60a5fa;
}

.header-info {
  flex: 1;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
}

.page-subtitle {
  margin: 0.5rem 0 0 0;
  font-size: 0.95rem;
  color: #94a3b8;
}

.header-progress {
  flex-shrink: 0;
  min-width: 200px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #334155;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 600;
}

/* ============================================================================
   MAIN CONTENT
   ============================================================================ */
.complete-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* ============================================================================
   FORM SECTIONS
   ============================================================================ */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #f1f5f9;
}

.section-description {
  margin: 0;
  font-size: 0.95rem;
  color: #94a3b8;
}

.form-divider {
  height: 1px;
  background: #334155;
  margin: 1rem 0;
}

/* ============================================================================
   AVATAR SECTION
   ============================================================================ */
.avatar-section {
  align-items: center;
  text-align: center;
}

.avatar-upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.avatar-preview {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  background: #0f172a;
  border: 3px solid #334155;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.btn-upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-preview:hover .btn-upload-overlay {
  opacity: 1;
}

.hidden-input {
  display: none;
}

.upload-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-text {
  margin: 0;
  font-size: 0.875rem;
  color: #94a3b8;
}

.btn-upload-text {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  transition: all 0.2s;
}

.btn-upload-text:hover {
  color: #60a5fa;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #0f172a;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 0.875rem;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.upload-error {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #7f1d1d;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.875rem;
}

/* ============================================================================
   FORM GROUPS
   ============================================================================ */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required {
  color: #ef4444;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix,
.input-icon {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
  pointer-events: none;
  display: flex;
  align-items: center;
}

.form-input,
.form-textarea,
.form-select {
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  transition: all 0.2s;
  font-family: inherit;
}

.form-input:hover,
.form-textarea:hover,
.form-select:hover {
  border-color: #475569;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.form-input.with-icon {
  padding-left: 2.5rem;
}

.form-input.read-only {
  background: #1e293b;
  cursor: not-allowed;
  opacity: 0.6;
}

.form-input.has-error,
.form-textarea.has-error {
  border-color: #ef4444;
}

.form-input.has-error:focus,
.form-textarea.has-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-suffix {
  position: absolute;
  right: 1rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
}

.input-suffix.success {
  color: #10b981;
}

.input-suffix.error {
  color: #ef4444;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.form-select {
  cursor: pointer;
}

.field-hint {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
}

.error-message {
  margin: 0;
  font-size: 0.875rem;
  color: #fca5a5;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.success-message {
  margin: 0;
  font-size: 0.875rem;
  color: #86efac;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* ============================================================================
   USERNAME DISPLAY (READ-ONLY) - FIXED
   ============================================================================ */
.username-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #0f172a;
  border: 1px dashed #334155;
  border-radius: 8px;
  opacity: 0.85;
}

.username-value {
  font-weight: 600;
  color: #94a3b8;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.95rem;
}

.username-badge {
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  background: #334155;
  color: #cbd5e1;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.username-display:hover {
  border-color: #475569;
  opacity: 1;
  transition: all 0.2s ease;
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
   CHECKBOX GROUP
   ============================================================================ */
.checkbox-group {
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.checkbox-text {
  font-size: 0.95rem;
  color: #e2e8f0;
  line-height: 1.5;
}

.link {
  color: #3b82f6;
  text-decoration: none;
  transition: all 0.2s;
}

.link:hover {
  color: #60a5fa;
  text-decoration: underline;
}

/* ============================================================================
   FORM ACTIONS
   ============================================================================ */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 2rem;
  border-top: 1px solid #334155;
}

.btn-cancel,
.btn-submit {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-cancel {
  background: transparent;
  color: #94a3b8;
  border: 1px solid #334155;
}

.btn-cancel:hover:not(:disabled) {
  background: #0f172a;
  border-color: #475569;
  color: #e2e8f0;
}

.btn-submit {
  background: #3b82f6;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ============================================================================
   ALERTS
   ============================================================================ */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid;
}

.alert-error {
  background: #7f1d1d;
  border-color: #ef4444;
  color: #fca5a5;
}

.alert-success {
  background: #064e3b;
  border-color: #10b981;
  color: #86efac;
}

.alert-content {
  flex: 1;
}

.alert-title {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  font-size: 0.95rem;
}

.alert-message {
  margin: 0;
  font-size: 0.875rem;
}

.btn-close-alert {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ============================================================================
   INFO SIDEBAR
   ============================================================================ */
.info-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: sticky;
  top: 100px;
  height: fit-content;
}

.info-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-card :deep(svg) {
  color: #3b82f6;
}

.info-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #f1f5f9;
}

.info-list {
  margin: 0;
  padding-left: 1.25rem;
  list-style: disc;
  color: #cbd5e1;
  font-size: 0.875rem;
  line-height: 1.6;
}

.info-list li {
  margin-bottom: 0.5rem;
}

.info-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #cbd5e1;
}

/* ============================================================================
   RESPONSIVE DESIGN
   ============================================================================ */
@media (max-width: 1024px) {
  .complete-main {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .info-sidebar {
    position: static;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .info-card {
    padding: 1rem;
  }

  .info-title {
    font-size: 0.95rem;
  }

  .info-list {
    font-size: 0.8rem;
  }
}

@media (max-width: 768px) {
  .complete-header {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .header-progress {
    width: 100%;
  }

  .form-card {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn-cancel,
  .btn-submit {
    width: 100%;
  }

  .interests-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }

  .info-sidebar {
    grid-template-columns: 1fr;
  }

  .username-display {
    flex-direction: column;
    align-items: flex-start;
  }

  .username-badge {
    margin-left: 0;
    margin-top: 0.5rem;
  }
}

@media (max-width: 480px) {
  .complete-header {
    padding: 1rem 0.5rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .form-card {
    padding: 1rem;
    border-radius: 8px;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .avatar-preview {
    width: 120px;
    height: 120px;
  }

  .form-input,
  .form-textarea,
  .form-select {
    font-size: 16px;
  }

  .interests-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
