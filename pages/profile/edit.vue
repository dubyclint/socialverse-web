<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
    <div class="max-w-2xl mx-auto">
      <div class="mb-8">
        <NuxtLink to="/profile" class="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4">
          <Icon name="mdi:arrow-left" class="w-5 h-5" />
          Back to Profile
        </NuxtLink>
        <h1 class="text-4xl font-bold text-white">Edit Profile</h1>
        <p class="text-slate-400 mt-2">Update your profile information and preferences</p>
      </div>

      <div v-if="isLoadingProfile" class="bg-slate-800 rounded-lg p-8 text-center border border-slate-700">
        <div class="inline-block">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <p class="text-slate-400 mt-4">Loading your profile...</p>
      </div>

      <div v-else-if="profileError" class="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
        <div class="flex items-start gap-3">
          <Icon name="mdi:alert-circle" class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 class="text-red-400 font-semibold">Error Loading Profile</h3>
            <p class="text-red-300 text-sm mt-1">{{ profileError }}</p>
          </div>
        </div>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-6" ref="formRef">
        <div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 class="text-xl font-semibold text-white mb-4">Profile Picture</h2>
          <div class="flex items-center gap-6">
            <div class="flex-shrink-0">
              <div class="relative">
                <img
                  v-if="avatarPreview || profile?.avatar_url"
                  :src="avatarPreview || profile?.avatar_url"
                  :alt="formData.full_name || 'Avatar'"
                  class="w-24 h-24 rounded-full object-cover border-2 border-slate-600"
                />
                <div
                  v-else
                  class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-slate-600"
                >
                  <Icon name="mdi:account" class="w-12 h-12 text-white" />
                </div>
                <label class="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 rounded-full p-2 cursor-pointer transition-colors">
                  <Icon name="mdi:camera" class="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleAvatarChange"
                    :disabled="isUploadingAvatar || isSubmitting"
                  />
                </label>
              </div>
            </div>
            <div class="flex-1">
              <p class="text-slate-300 text-sm mb-2"><strong>Supported formats:</strong> JPEG, PNG, GIF, WebP</p>
              <p class="text-slate-400 text-sm mb-4"><strong>Max size:</strong> 5MB</p>
              <div v-if="isUploadingAvatar" class="space-y-2">
                <div class="w-full bg-slate-700 rounded-full h-2">
                  <div class="bg-blue-500 h-2 rounded-full" style="width: 50%"></div>
                </div>
                <p class="text-blue-400 text-sm">Uploading avatar...</p>
              </div>
              <div v-else-if="avatarError" class="text-red-400 text-sm">{{ avatarError }}</div>
              <div v-else-if="avatarPreview" class="text-green-400 text-sm">✓ New avatar selected</div>
            </div>
          </div>
        </div>

        <div class="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
          <h2 class="text-xl font-semibold text-white mb-4">Basic Information</h2>

          <div ref="fullNameFieldRef">
            <label class="block text-sm font-medium text-slate-300 mb-2">Full Name <span class="text-red-500">*</span></label>
            <input
              v-model="formData.full_name"
              type="text"
              placeholder="Enter your full name"
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p v-if="fieldErrors.full_name" class="text-red-400 text-sm mt-1">{{ fieldErrors.full_name }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Username</label>
            <div class="relative">
              <span class="absolute left-4 top-2 text-slate-500">@</span>
              <input
                v-model="formData.username"
                type="text"
                placeholder="username"
                class="w-full pl-8 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p class="text-slate-500 text-xs mt-1">Optional (only if your backend supports username update)</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <input
              :value="profile?.email"
              type="email"
              disabled
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed opacity-75"
            />
            <p class="text-slate-500 text-xs mt-1">Email cannot be changed</p>
          </div>
        </div>

        <div class="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
          <h2 class="text-xl font-semibold text-white mb-4">About You</h2>

          <div ref="bioFieldRef">
            <label class="block text-sm font-medium text-slate-300 mb-2">Bio <span class="text-red-500">*</span></label>
            <textarea
              v-model="formData.bio"
              placeholder="Tell us about yourself..."
              rows="4"
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <div class="flex justify-between items-center mt-1">
              <p v-if="fieldErrors.bio" class="text-red-400 text-sm">{{ fieldErrors.bio }}</p>
              <p class="text-slate-500 text-xs">{{ formData.bio?.length || 0 }}/500</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Location</label>
            <input
              v-model="formData.location"
              type="text"
              placeholder="City, Country"
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Website</label>
            <input
              v-model="formData.website"
              type="url"
              placeholder="https://example.com"
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Date of Birth</label>
            <input
              v-model="formData.birth_date"
              type="date"
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Gender</label>
            <select
              v-model="formData.gender"
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div class="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
          <h2 class="text-xl font-semibold text-white mb-4">Privacy & Notifications</h2>

          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="formData.is_private"
              type="checkbox"
              class="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              :disabled="isSubmitting"
            />
            <span class="text-slate-300">
              Make my profile private
              <p class="text-slate-500 text-sm">Only approved followers can see your profile</p>
            </span>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="formData.email_notifications"
              type="checkbox"
              class="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              :disabled="isSubmitting"
            />
            <span class="text-slate-300">
              Receive email notifications
              <p class="text-slate-500 text-sm">Get updates about your account activity</p>
            </span>
          </label>
        </div>

        <div v-if="formError" class="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <Icon name="mdi:alert-circle" class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="text-red-400 font-semibold">Error Saving Profile</h3>
              <p class="text-red-300 text-sm mt-1">{{ formError }}</p>
            </div>
          </div>
        </div>

        <div v-if="formSuccess" class="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <Icon name="mdi:check-circle" class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="text-green-400 font-semibold">Profile Updated</h3>
              <p class="text-green-300 text-sm mt-1">Your profile has been saved successfully</p>
            </div>
          </div>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            :disabled="isSubmitting || !isFormDirty"
            class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Icon v-if="isSubmitting" name="mdi:loading" class="w-5 h-5 animate-spin" />
            <span>{{ isSubmitting ? 'Saving...' : 'Save Changes' }}</span>
          </button>

          <NuxtLink
            to="/profile"
            class="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="mdi:close" class="w-5 h-5" />
            <span>Cancel</span>
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

    <script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useProfile } from '~/composables/use-profile'
import type { Profile } from '~/types/profile'

const router = useRouter()
const { fetchCurrentProfile, updateProfile, uploadAvatar } = useProfile()

const profile = ref<Profile | null>(null)
const isLoadingProfile = ref(true)
const profileError = ref<string | null>(null)

const formData = ref({
  full_name: '',
  username: '', // optional in edit flow
  bio: '',
  location: '',
  website: '',
  birth_date: '', // canonical
  gender: '',
  is_private: false,
  email_notifications: true
})

const originalFormData = ref({ ...formData.value })
const fieldErrors = ref<Record<string, string>>({})
const formError = ref<string | null>(null)
const formSuccess = ref(false)
const isSubmitting = ref(false)

const avatarPreview = ref<string | null>(null)
const avatarFile = ref<File | null>(null)
const isUploadingAvatar = ref(false)
const avatarError = ref<string | null>(null)

const formRef = ref<HTMLFormElement | null>(null)
const fullNameFieldRef = ref<HTMLDivElement | null>(null)
const bioFieldRef = ref<HTMLDivElement | null>(null)

const isFormDirty = computed(() =>
  JSON.stringify(formData.value) !== JSON.stringify(originalFormData.value) || avatarFile.value !== null
)

const loadProfile = async () => {
  isLoadingProfile.value = true
  profileError.value = null
  try {
    const currentProfile: any = await fetchCurrentProfile()
    const p = currentProfile?.data || currentProfile
    if (!p) throw new Error('Failed to load profile')

    profile.value = p
    formData.value = {
      full_name: p.full_name || '',
      username: p.username || '',
      bio: p.bio || '',
      location: p.location || '',
      website: p.website || '',
      birth_date: p.birth_date && typeof p.birth_date === 'string' ? p.birth_date.split(/[ T]/)[0] : '',
      gender: p.gender || '',
      is_private: p.is_private || false,
      email_notifications: p.email_notifications !== false
    }
    originalFormData.value = { ...formData.value }
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.response?.status === 404) {
      await router.replace('/profile/complete')
      return
    }
    profileError.value = err?.message || 'Failed to load profile'
  } finally {
    isLoadingProfile.value = false
  }
}

const validateField = (field: string) => {
  const errors: Record<string, string> = {}

  if (field === 'full_name' || field === 'all') {
    if (!formData.value.full_name?.trim()) errors.full_name = 'Full name is required'
    else if (formData.value.full_name.length > 100) errors.full_name = 'Full name must be less than 100 characters'
  }

  // username no longer required in edit flow

  if (field === 'bio' || field === 'all') {
    if (!formData.value.bio?.trim()) errors.bio = 'Bio is required'
    else if (formData.value.bio.length > 500) errors.bio = 'Bio must be less than 500 characters'
  }

  if (field === 'all') {
    fieldErrors.value = errors
    return Object.keys(errors).length === 0
  } else {
    if (errors[field]) fieldErrors.value[field] = errors[field]
    else delete fieldErrors.value[field]
    return !errors[field]
  }
}

const handleAvatarChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  avatarError.value = null
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    avatarError.value = 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
    avatarFile.value = null
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    avatarError.value = 'File size exceeds 5MB limit.'
    avatarFile.value = null
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => { avatarPreview.value = e.target?.result as string }
  reader.onerror = () => {
    avatarError.value = 'Failed to read file. Please try again.'
    avatarFile.value = null
    avatarPreview.value = null
  }
  reader.readAsDataURL(file)
  avatarFile.value = file
}

const handleSubmit = async () => {
  if (!validateField('all')) {
    formError.value = 'Please fix the errors above'
    await nextTick()
    return
  }

  isSubmitting.value = true
  formError.value = null
  formSuccess.value = false

  try {
    let finalAvatarUrl = profile.value?.avatar_url || ''

    if (avatarFile.value) {
      isUploadingAvatar.value = true
      const uploadRes: any = await uploadAvatar(avatarFile.value)
      finalAvatarUrl = uploadRes?.avatar_url || uploadRes?.data?.avatar_url || uploadRes || finalAvatarUrl
      if (!finalAvatarUrl) throw new Error('Failed to upload avatar image')
    }

    const payload = {
      ...formData.value,
      avatar_url: finalAvatarUrl
    }

    const updated: any = await updateProfile(payload)
    if (!updated) throw new Error('Failed to update profile changes')

    profile.value = {
      ...(profile.value || ({} as Profile)),
      ...formData.value,
      avatar_url: finalAvatarUrl
    } as Profile

    originalFormData.value = { ...formData.value }
    avatarFile.value = null
    avatarPreview.value = null
    formSuccess.value = true

    setTimeout(() => router.push('/profile'), 1200)
  } catch (err: any) {
    formError.value = err?.message || 'Failed to save profile'
  } finally {
    isSubmitting.value = false
    isUploadingAvatar.value = false
  }
}

onMounted(loadProfile)

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})
</script>          
              
<style scoped>
/* Better defaults for form controls in this page */
input:disabled,
textarea:disabled,
select:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
}

/* Spinner utility */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Smoother card + section visuals */
.bg-slate-800 {
  backdrop-filter: blur(6px);
}

/* Better checkbox alignment with multiline labels */
label.flex.items-center.gap-3 {
  align-items: flex-start;
}

label.flex.items-center.gap-3 input[type='checkbox'] {
  margin-top: 0.2rem;
  flex-shrink: 0;
}

/* File input camera button polish */
label[for],
label.absolute.bottom-0.right-0 {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

/* Input consistency */
input[type='text'],
input[type='url'],
input[type='email'],
input[type='date'],
textarea,
select {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

/* Accessible focus ring fallback (in case utility classes don’t load) */
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
button:focus-visible,
a:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.9);
  outline-offset: 2px;
  border-radius: 0.5rem;
}

/* Avatar image safety */
img {
  image-rendering: auto;
}

/* Error/success message readability */
.text-red-300,
.text-green-300 {
  line-height: 1.45;
}

/* Responsive tune */
@media (max-width: 640px) {
  .max-w-2xl {
    max-width: 100%;
  }

  .flex.gap-4.pt-4 {
    flex-direction: column;
  }

  .flex.items-center.gap-6 {
    flex-direction: column;
    align-items: flex-start;
  }

  .w-24.h-24 {
    width: 5rem;
    height: 5rem;
  }
}
</style>
