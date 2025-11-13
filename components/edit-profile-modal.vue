<!-- components/edit-profile-modal.vue -->
<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Edit Profile</h2>
        <button @click="$emit('close')" class="close-btn">
          <Icon name="x" size="20" />
        </button>
      </div>
      
      <form @submit.prevent="saveProfile" class="profile-form">
        <div class="form-sections">
          <!-- Basic Information -->
          <div class="form-section">
            <h3 class="section-title">Basic Information</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input
                  v-model="formData.fullName"
                  type="text"
                  class="form-input"
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">Username *</label>
                <input
                  v-model="formData.username"
                  type="text"
                  class="form-input"
                  placeholder="Choose a username"
                  @blur="validateUsername"
                  required
                />
                <span v-if="usernameError" class="error-text">{{ usernameError }}</span>
              </div>
            </div>

            <div class="form-row full">
              <div class="form-group">
                <label class="form-label">Bio</label>
                <textarea
                  v-model="formData.bio"
                  class="form-textarea"
                  placeholder="Tell us about yourself"
                  maxlength="500"
                ></textarea>
                <span class="char-count">{{ formData.bio.length }}/500</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input
                  v-model="formData.phoneNumber"
                  type="tel"
                  class="form-input"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">Website</label>
                <input
                  v-model="formData.website"
                  type="url"
                  class="form-input"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Location</label>
                <input
                  v-model="formData.location"
                  type="text"
                  class="form-input"
                  placeholder="City, Country"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">Avatar URL</label>
                <input
                  v-model="formData.avatarUrl"
                  type="url"
                  class="form-input"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
          </div>

          <!-- Professional Information -->
          <div class="form-section">
            <h3 class="section-title">Professional Information</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Occupation</label>
                <input
                  v-model="formData.occupation"
                  type="text"
                  class="form-input"
                  placeholder="Your job title"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">Highest Education</label>
                <input
                  v-model="formData.highestEducation"
                  type="text"
                  class="form-input"
                  placeholder="e.g., Bachelor's Degree"
                />
              </div>
            </div>

            <div class="form-row full">
              <div class="form-group">
                <label class="form-label">School/University</label>
                <input
                  v-model="formData.school"
                  type="text"
                  class="form-input"
                  placeholder="Name of your school or university"
                />
              </div>
            </div>
          </div>

          <!-- Skills & Interests -->
          <div class="form-section">
            <h3 class="section-title">Skills & Interests</h3>
            
            <div class="form-group">
              <label class="form-label">Skills</label>
              <div class="skills-input-wrapper">
                <input
                  ref="skillsInput"
                  type="text"
                  class="form-input"
                  placeholder="Add a skill and press button"
                />
                <button type="button" @click="addSkill" class="add-btn">Add</button>
              </div>
              <div class="tags-container">
                <span v-for="(skill, index) in formData.skills" :key="index" class="tag">
                  {{ skill }}
                  <button type="button" @click="removeSkill(index)" class="remove-tag">×</button>
                </span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Interests</label>
              <div class="skills-input-wrapper">
                <input
                  ref="interestInput"
                  type="text"
                  class="form-input"
                  placeholder="Add an interest and press button"
                />
                <button type="button" @click="addInterest" class="add-btn">Add</button>
              </div>
              <div class="tags-container">
                <span v-for="(interest, index) in formData.interests" :key="index" class="tag">
                  {{ interest }}
                  <button type="button" @click="removeInterest(index)" class="remove-tag">×</button>
                </span>
              </div>
            </div>
          </div>

          <!-- Personal Information -->
          <div class="form-section">
            <h3 class="section-title">Personal Information</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input
                  v-model="formData.dateOfBirth"
                  type="date"
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label class="form-label">Gender</label>
                <select v-model="formData.gender" class="form-input">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Privacy Settings -->
          <div class="form-section">
            <h3 class="section-title">Privacy Settings</h3>
            
            <div class="privacy-toggles">
              <label class="toggle-label">
                <input
                  v-model="privacySettings.profile_visibility_public"
                  type="checkbox"
                  class="toggle-input"
                />
                Make profile public
              </label>
              
              <label class="toggle-label">
                <input
                  v-model="privacySettings.bio_visibility_public"
                  type="checkbox"
                  class="toggle-input"
                />
                Show bio publicly
              </label>
              
              <label class="toggle-label">
                <input
                  v-model="privacySettings.location_visibility_public"
                  type="checkbox"
                  class="toggle-input"
                />
                Show location publicly
              </label>
              
              <label class="toggle-label">
                <input
                  v-model="privacySettings.contact_visibility_public"
                  type="checkbox"
                  class="toggle-input"
                />
                Show contact info publicly
              </label>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="closeModal" class="btn-cancel">
            Cancel
          </button>
          <button type="submit" :disabled="saving" class="btn-save">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import Icon from '@/components/ui/Icon.vue'

const emit = defineEmits(['close', 'profile-updated'])
const authStore = useAuthStore()

const saving = ref(false)
const usernameError = ref('')

const skillsInput = ref(null)
const interestInput = ref(null)

const formData = ref({
  fullName: '',
  username: '',
  bio: '',
  phoneNumber: '',
  website: '',
  location: '',
  avatarUrl: '',
  occupation: '',
  highestEducation: '',
  school: '',
  skills: [],
  dateOfBirth: '',
  gender: '',
  interests: []
})

const privacySettings = ref({
  profile_visibility_public: true,
  bio_visibility_public: true,
  location_visibility_public: true,
  contact_visibility_public: false
})

// Load current profile data
const loadProfileData = async () => {
  try {
    const { data } = await $fetch(`/api/profile/${authStore.user.id}`)
    
    formData.value = {
      fullName: data.full_name || '',
      username: data.username || '',
      bio: data.bio || '',
      phoneNumber: data.phone || '',
      website: data.website || '',
      location: data.location || '',
      avatarUrl: data.avatar_url || '',
      occupation: data.occupation || '',
      highestEducation: data.highest_education || '',
      school: data.school || '',
      skills: data.skills || [],
      dateOfBirth: data.date_of_birth || '',
      gender: data.gender || '',
      interests: data.interests || []
    }

    if (data.privacy_settings) {
      privacySettings.value = data.privacy_settings
    }
  } catch (error) {
    console.error('Error loading profile:', error)
  }
}

const validateUsername = async () => {
  if (!formData.value.username) {
    usernameError.value = ''
    return
  }

  try {
    const { data } = await $fetch(`/api/validate-username`, {
      method: 'POST',
      body: {
        username: formData.value.username,
        userId: authStore.user.id
      }
    })
    usernameError.value = data.valid ? '' : data.error
  } catch (error) {
    console.error('Error validating username:', error)
  }
}

const addSkill = () => {
  const skill = skillsInput.value?.value?.trim()
  if (skill && !formData.value.skills.includes(skill)) {
    formData.value.skills.push(skill)
    skillsInput.value.value = ''
  }
}

const removeSkill = (index) => {
  formData.value.skills.splice(index, 1)
}

const addInterest = () => {
  const interest = interestInput.value?.value?.trim()
  if (interest && !formData.value.interests.includes(interest)) {
    formData.value.interests.push(interest)
    interestInput.value.value = ''
  }
}

const removeInterest = (index) => {
  formData.value.interests.splice(index, 1)
}

const saveProfile = async () => {
  try {
    if (usernameError.value) {
      alert('Please fix the username error first')
      return
    }

    saving.value = true

    const updates = {
      full_name: formData.value.fullName,
      username: formData.value.username,
      bio: formData.value.bio,
      phone: formData.value.phoneNumber,
      website: formData.value.website,
      location: formData.value.location,
      avatar_url: formData.value.avatarUrl,
      occupation: formData.value.occupation,
      highest_education: formData.value.highestEducation,
      school: formData.value.school,
      skills: formData.value.skills,
      date_of_birth: formData.value.dateOfBirth,
      gender: formData.value.gender,
      interests: formData.value.interests,
      privacy_settings: privacySettings.value
    }

    const { data: updatedProfile } = await $fetch(`/api/profile/${authStore.user.id}`, {
      method: 'PUT',
      body: updates
    })
    
    emit('profile-updated', updatedProfile)
    closeModal()
  } catch (error) {
    console.error('Error saving profile:', error)
    alert('Error saving profile: ' + error.message)
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  emit('close')
}

onMounted(() => {
  loadProfileData()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1e293b;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #334155;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
  position: sticky;
  top: 0;
  background: #1e293b;
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
}

.close-btn:hover {
  color: white;
}

.profile-form {
  padding: 1.5rem;
}

.form-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-row.full {
  grid-template-columns: 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #cbd5e1;
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  background: #334155;
  border: 1px solid #475569;
  border-radius: 6px;
  color: white;
  font-family: inherit;
  font-size: 0.95rem;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  background: #1e293b;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  font-size: 0.8rem;
  color: #94a3b8;
  text-align: right;
}

.error-text {
  font-size: 0.8rem;
  color: #ef4444;
}

.skills-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.skills-input-wrapper .form-input {
  flex: 1;
}

.add-btn {
  padding: 0.75rem 1rem;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.add-btn:hover {
  background: #2563eb;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: #3b82f6;
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
}

.remove-tag {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  display: flex;
  align-items: center;
}

.remove-tag:hover {
  opacity: 0.8;
}

.privacy-toggles {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: #cbd5e1;
  font-size: 0.95rem;
}

.toggle-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #334155;
}

.btn-cancel,
.btn-save {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.95rem;
}

.btn-cancel {
  background: #475569;
  color: white;
}

.btn-cancel:hover {
  background: #64748b;
}

.btn-save {
  background: #3b82f6;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #2563eb;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
