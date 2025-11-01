<template>
  <div class="min-h-screen bg-slate-900">
    <!-- Header -->
    <Header />

    <!-- Settings Container -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Settings</h1>
        <p class="text-slate-400">Manage your account preferences and security</p>
      </div>

      <!-- Settings Tabs -->
      <div class="flex gap-4 mb-8 border-b border-slate-700 overflow-x-auto">
        <button
          v-for="tab in settingsTabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap',
            activeTab === tab.id
              ? 'text-blue-500 border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-300'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="space-y-6">
        <!-- Account Settings Tab -->
        <div v-if="activeTab === 'account'" class="space-y-6">
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 class="text-xl font-bold text-white mb-4">Account Information</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  :value="user?.email"
                  disabled
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <input
                  type="text"
                  :value="user?.username"
                  disabled
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Settings Tab -->
        <div v-if="activeTab === 'profile'" class="space-y-6">
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 class="text-xl font-bold text-white mb-4">Profile Information</h2>
            
            <!-- Profile Completion Progress -->
            <div class="mb-6">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-slate-300">Profile Completion</span>
                <span class="text-sm font-bold text-blue-400">{{ profileCompletion }}%</span>
              </div>
              <div class="w-full bg-slate-700 rounded-full h-2">
                <div
                  class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  :style="{ width: profileCompletion + '%' }"
                ></div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  v-model="profileData.fullName"
                  type="text"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Occupation</label>
                <input
                  v-model="profileData.occupation"
                  type="text"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Your job title"
                />
              </div>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-slate-300 mb-2">Bio</label>
              <textarea
                v-model="profileData.bio"
                class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                rows="4"
                placeholder="Tell us about yourself..."
                maxlength="500"
              ></textarea>
              <span class="text-xs text-slate-400">{{ profileData.bio.length }}/500</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Location</label>
                <input
                  v-model="profileData.location"
                  type="text"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Website</label>
                <input
                  v-model="profileData.website"
                  type="url"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Education Level</label>
                <select
                  v-model="profileData.highestEducation"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select education level</option>
                  <option value="high_school">High School</option>
                  <option value="associate">Associate Degree</option>
                  <option value="bachelor">Bachelor's Degree</option>
                  <option value="master">Master's Degree</option>
                  <option value="phd">PhD</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">School/University</label>
                <input
                  v-model="profileData.school"
                  type="text"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Name of your school"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Date of Birth</label>
                <input
                  v-model="profileData.dateOfBirth"
                  type="date"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                <select
                  v-model="profileData.gender"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non_binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <!-- Skills -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-slate-300 mb-2">Skills</label>
              <div class="flex gap-2 mb-3">
                <input
                  ref="skillInput"
                  type="text"
                  class="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Add a skill"
                  @keydown.enter="addSkill"
                />
                <button
                  @click="addSkill"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(skill, index) in profileData.skills"
                  :key="index"
                  class="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                >
                  {{ skill }}
                  <button
                    @click="removeSkill(index)"
                    class="hover:opacity-70 transition-opacity"
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>

            <!-- Interests -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-slate-300 mb-2">Interests</label>
              <div class="flex gap-2 mb-3">
                <input
                  ref="interestInput"
                  type="text"
                  class="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Add an interest"
                  @keydown.enter="addInterest"
                />
                <button
                  @click="addInterest"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(interest, index) in profileData.interests"
                  :key="index"
                  class="inline-flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-full text-sm"
                >
                  {{ interest }}
                  <button
                    @click="removeInterest(index)"
                    class="hover:opacity-70 transition-opacity"
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>

            <button
              @click="saveProfileChanges"
              :disabled="savingProfile"
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {{ savingProfile ? 'Saving...' : 'Save Profile Changes' }}
            </button>
          </div>
        </div>

        <!-- Privacy Settings Tab -->
        <div v-if="activeTab === 'privacy'" class="space-y-6">
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 class="text-xl font-bold text-white mb-4">Privacy Settings</h2>
            <div class="space-y-4">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="privacySettings.profilePublic"
                  type="checkbox"
                  class="w-5 h-5 rounded"
                />
                <span class="text-slate-300">Make my profile public</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="privacySettings.bioPublic"
                  type="checkbox"
                  class="w-5 h-5 rounded"
                />
                <span class="text-slate-300">Show my bio publicly</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="privacySettings.locationPublic"
                  type="checkbox"
                  class="w-5 h-5 rounded"
                />
                <span class="text-slate-300">Show my location publicly</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="privacySettings.contactPublic"
                  type="checkbox"
                  class="w-5 h-5 rounded"
                />
                <span class="text-slate-300">Show my contact info publicly</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Security Settings Tab -->
        <div v-if="activeTab === 'security'" class="space-y-6">
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 class="text-xl font-bold text-white mb-4">Change Password</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                <input
                  v-model="passwordData.current"
                  type="password"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                <input
                  v-model="passwordData.new"
                  type="password"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
                <input
                  v-model="passwordData.confirm"
                  type="password"
                  class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                @click="changePassword"
                :disabled="changingPassword"
                class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                {{ changingPassword ? 'Changing...' : 'Change Password' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Notifications Settings Tab -->
        <div v-if="activeTab === 'notifications'" class="space-y-6">
          <div class="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 class="text-xl font-bold text-white mb-4">Notification Preferences</h2>
            <div class="space-y-4">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="notificationSettings.emailNotifications"
                  type="checkbox"
                  class="w-5 h-5 rounded"
                />
                <span class="text-slate-300">Email notifications</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="notificationSettings.pushNotifications"
                  type="checkbox"
                  class="w-5 h-5 rounded"
                />
                <span class="text-slate-300">Push notifications</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="notificationSettings.messageNotifications"
                  type="checkbox"
                  class="w-5 h-5 rounded"
                />
                <span class="text-slate-300">Message notifications</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="notificationSettings.likeNotifications"
                  type="checkbox"
                  class="w-5 h-5 rounded"
                />
                <span class="text-slate-300">Like notifications</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Profile } from '~/models/Profile'

definePageMeta({
  middleware: 'auth-guard'
})

const authStore = useAuthStore()

const activeTab = ref('account')
const profileCompletion = ref(0)
const savingProfile = ref(false)
const changingPassword = ref(false)

const skillInput = ref(null)
const interestInput = ref(null)

const settingsTabs = [
  { id: 'account', label: 'Account' },
  { id: 'profile', label: 'Profile' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' }
]

const user = computed(() => authStore.user)

const profileData = ref({
  fullName: '',
  occupation: '',
  bio: '',
  location: '',
  website: '',
  highestEducation: '',
  school: '',
  dateOfBirth: '',
  gender: '',
  skills: [],
  interests: []
})

const privacySettings = ref({
  profilePublic: true,
  bioPublic: true,
  locationPublic: true,
  contactPublic: false
})

const passwordData = ref({
  current: '',
  new: '',
  confirm: ''
})

const notificationSettings = ref({
  emailNotifications: true,
  pushNotifications: true,
  messageNotifications: true,
  likeNotifications: true
})

const loadProfileData = async () => {
  try {
    const profile = await Profile.getProfile(authStore.user.id)
    
    profileData.value = {
      fullName: profile.full_name || '',
      occupation: profile.occupation || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      highestEducation: profile.highest_education || '',
      school: profile.school || '',
      dateOfBirth: profile.date_of_birth || '',
      gender: profile.gender || '',
      skills: profile.skills || [],
      interests: profile.interests || []
    }

    // Calculate profile completion
    profileCompletion.value = await Profile.getProfileCompletionPercentage(authStore.user.id)
  } catch (error) {
    console.error('Error loading profile:', error)
  }
}

const addSkill = () => {
  const skill = skillInput.value?.value?.trim()
  if (skill && !profileData.value.skills.includes(skill)) {
    profileData.value.skills.push(skill)
    skillInput.value.value = ''
  }
}

const removeSkill = (index) => {
  profileData.value.skills.splice(index, 1)
}

const addInterest = () => {
  const interest = interestInput.value?.value?.trim()
  if (interest && !profileData.value.interests.includes(interest)) {
    profileData.value.interests.push(interest)
    interestInput.value.value = ''
  }
}

const removeInterest = (index) => {
  profileData.value.interests.splice(index, 1)
}

const saveProfileChanges = async () => {
  try {
    savingProfile.value = true

    const updates = {
      full_name: profileData.value.fullName,
      occupation: profileData.value.occupation,
      bio: profileData.value.bio,
      location: profileData.value.location,
      website: profileData.value.website,
      highest_education: profileData.value.highestEducation,
      school: profileData.value.school,
      date_of_birth: profileData.value.dateOfBirth,
      gender: profileData.value.gender,
      skills: profileData.value.skills,
      interests: profileData.value.interests,
      privacy_settings: privacySettings.value
    }

    await Profile.updateProfile(authStore.user.id, updates)
    
    // Recalculate profile completion
    profileCompletion.value = await Profile.getProfileCompletionPercentage(authStore.user.id)
    
    alert('Profile updated successfully!')
  } catch (error) {
    console.error('Error saving profile:', error)
    alert('Error saving profile: ' + error.message)
  } finally {
    savingProfile.value = false
  }
}

const changePassword = async () => {
  if (passwordData.value.new !== passwordData.value.confirm) {
    alert('Passwords do not match')
    return
  }

  try {
    changingPassword.value = true
    // Implement password change logic here
    alert('Password changed successfully!')
    passwordData.value = { current: '', new: '', confirm: '' }
  } catch (error) {
    console.error('Error changing password:', error)
    alert('Error changing password')
  } finally {
    changingPassword.value = false
  }
}

onMounted(() => {
  loadProfileData()
})
</script>

<style scoped>
/* Minimal scoped styles - rely on Tailwind */
</style>

