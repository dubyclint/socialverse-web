<!-- components/EditProfileModal.vue -->
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
                <label class="form-label">Display Name</label>
                <input
                  v-model="formData.displayName"
                  type="text"
                  class="form-input"
                  placeholder="Your display name"
                />
                <div class="privacy-toggle">
                  <label class="toggle-label">
                    <input
                      v-model="privacySettings.display_name_public"
                      type="checkbox"
                      class="toggle-input"
                    />
                    <span class="toggle-slider"></span>
                    Public
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Bio</label>
                <textarea
                  v-model="formData.bio"
                  class="form-textarea"
                  rows="3"
                  placeholder="Tell us about yourself..."
                  maxlength="500"
                ></textarea>
                <div class="privacy-toggle">
                  <label class="toggle-label">
                    <input
                      v-model="privacySettings.bio_public"
                      type="checkbox"
                      class="toggle-input"
                    />
                    <span class="toggle-slider"></span>
                    Public
                  </label>
                </div>
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
                  placeholder="Your job title or profession"
                />
                <div class="privacy-toggle">
                  <label class="toggle-label">
                    <input
                      v-model="privacySettings.occupation_public"
                      type="checkbox"
                      class="toggle-input"
                    />
                    <span class="toggle-slider"></span>
                    Public
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Highest Education</label>
                <select v-model="formData.highestEducation" class="form-select">
                  <option value="">Select education level</option>
                  <option value="High School">High School</option>
                  <option value="Associate Degree">Associate Degree</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Doctorate">Doctorate</option>
                  <option value="Professional Degree">Professional Degree</option>
                  <option value="Other">Other</option>
                </select>
                <div class="privacy-toggle">
                  <label class="toggle-label">
                    <input
                      v-model="privacySettings.education_public"
                      type="checkbox"
                      class="toggle-input"
                    />
                    <span class="toggle-slider"></span>
                    Public
                  </label>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">School/University</label>
              <input
                v-model="formData.school"
                type="text"
                class="form-input"
                placeholder="Name of your school or university"
              />
              <div class="privacy-toggle">
                <label class="toggle-label">
                  <input
                    v-model="privacySettings.school_public"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                  Public
                </label>
              </div>
            </div>
          </div>
          
          <!-- Contact Information -->
          <div class="form-section">
            <h3 class="section-title">Contact Information</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Phone Number <span class="required">*</span></label>
                <input
                  v-model="formData.phoneNumber"
                  type="tel"
                  class="form-input"
                  placeholder="+1 (555) 123-4567"
                  required
                />
                <div class="privacy-toggle">
                  <label class="toggle-label">
                    <input
                      v-model="privacySettings.phone_public"
                      type="checkbox"
                      class="toggle-input"
                    />
                    <span class="toggle-slider"></span>
                    Public
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Email</label>
                <input
                  v-model="formData.email"
                  type="email"
                  class="form-input"
                  placeholder="your.email@example.com"
                />
                <div class="privacy-toggle">
                  <label class="toggle-label">
                    <input
                      v-model="privacySettings.email_public"
                      type="checkbox"
                      class="toggle-input"
                    />
                    <span class="toggle-slider"></span>
                    Public
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Personal Information -->
          <div class="form-section">
            <h3 class="section-title">Personal Information</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Location</label>
                <input
                  v-model="formData.location"
                  type="text"
                  class="form-input"
                  placeholder="City, Country"
                />
                <div class="privacy-toggle">
                  <label class="toggle-label">
                    <input
                      v-model="privacySettings.location_public"
                      type="checkbox"
                      class="toggle-input"
                    />
                    <span class="toggle-slider"></span>
                    Public
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Website</label>
                <input
                  v-model="formData.websiteUrl"
                  type="url"
                  class="form-input"
                  placeholder="https://yourwebsite.com"
                />
                <div class="privacy-toggle">
                  <label class="toggle-label">
                    <input
                      v-model="privacySettings.website_public"
                      type="checkbox"
                      class="toggle-input"
                    />
                    <span class="toggle-slider"></span>
                    Public
                  </label>
                </div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input
                  v-model="formData.dateOfBirth"
                  type="date"
                  class="form-input"
                />
                <div class="privacy-toggle">
                  <label class="toggle-label">
                    <input
                      v-model="privacySettings.date_of_birth_public"
                      type="checkbox"
                      class="toggle-input"
                    />
                    <span class="toggle-slider"></span>
                    Public
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Gender</label>
                <select v-model="formData.gender" class="form-select">
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
                <div class="privacy-toggle">
                  <label class="toggle-label">
                    <input
                      v-model="privacySettings.gender_public"
                      type="checkbox"
                      class="toggle-input"
                    />
                    <span class="toggle-slider"></span>
                    Public
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Skills and Interests -->
          <div class="form-section">
            <h3 class="section-title">Skills & Interests</h3>
            
            <div class="form-group">
              <label class="form-label">Skills</label>
              <div class="tags-input-container">
                <input
                  v-model="skillInput"
                  @keydown.enter.prevent="addSkill"
                  @keydown.comma.prevent="addSkill"
                  type="text"
                  class="form-input"
                  placeholder="Add skills (press Enter or comma to add)"
                />
                <div v-if="formData.skills.length > 0" class="tags-display">
                  <span
                    v-for="(skill, index) in formData.skills"
                    :key="index"
                    class="tag-item skill-tag"
                  >
                    {{ skill }}
                    <button
                      type="button"
                      @click="removeSkill(index)"
                      class="remove-tag-btn"
                    >
                      <Icon name="x" size="12" />
                    </button>
                  </span>
                </div>
              </div>
              <div class="privacy-toggle">
                <label class="toggle*
                <label class="toggle-label">
                  <input
                    v-model="privacySettings.skills_public"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                  Public
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Interests</label>
              <div class="tags-input-container">
                <input
                  v-model="interestInput"
                  @keydown.enter.prevent="addInterest"
                  @keydown.comma.prevent="addInterest"
                  type="text"
                  class="form-input"
                  placeholder="Add interests (press Enter or comma to add)"
                />
                <div v-if="formData.interests.length > 0" class="tags-display">
                  <span
                    v-for="(interest, index) in formData.interests"
                    :key="index"
                    class="tag-item interest-tag"
                  >
                    {{ interest }}
                    <button
                      type="button"
                      @click="removeInterest(index)"
                      class="remove-tag-btn"
                    >
                      <Icon name="x" size="12" />
                    </button>
                  </span>
                </div>
              </div>
              <div class="privacy-toggle">
                <label class="toggle-label">
                  <input
                    v-model="privacySettings.interests_public"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                  Public
                </label>
              </div>
            </div>
          </div>
          
          <!-- Social Media Links -->
          <div class="form-section">
            <h3 class="section-title">Social Media Links</h3>
            
            <div class="social-links-editor">
              <div
                v-for="platform in availablePlatforms"
                :key="platform.key"
                class="social-link-row"
              >
                <div class="platform-info">
                  <Icon :name="platform.icon" size="20" />
                  <span class="platform-name">{{ platform.name }}</span>
                </div>
                <div class="link-input-group">
                  <input
                    v-model="socialLinksData[platform.key]"
                    type="text"
                    class="form-input"
                    :placeholder="platform.key === 'website' ? 'https://yourwebsite.com' : `Your ${platform.name} username`"
                  />
                  <label class="toggle-label small">
                    <input
                      v-model="socialLinksPublic[platform.key]"
                      type="checkbox"
                      class="toggle-input"
                    />
                    <span class="toggle-slider small"></span>
                    Public
                  </label>
                </div>
              </div>
            </div>
            
            <div class="privacy-toggle">
              <label class="toggle-label">
                <input
                  v-model="privacySettings.social_links_public"
                  type="checkbox"
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
                Show social links section publicly
              </label>
            </div>
          </div>
          
          <!-- Premium Features -->
          <div v-if="isPremiumUser" class="form-section">
            <h3 class="section-title">Premium Features</h3>
            
            <div class="form-group">
              <div class="privacy-toggle">
                <label class="toggle-label">
                  <input
                    v-model="privacySettings.rank_hidden"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                  Hide my rank from public view
                </label>
                <p class="toggle-description">
                  Only available for premium users. Your rank will be hidden from other users.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button
            type="button"
            @click="$emit('close')"
            class="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="btn btn-primary"
          >
            <Icon v-if="saving" name="loader" size="16" class="spinning" />
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { Profile } from '~/models/Profile'
import { ProfilePrivacy } from '~/models/ProfilePrivacy'
import { SocialLinks } from '~/models/SocialLinks'

const props = defineProps({
  profile: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])
const authStore = useAuthStore()

// Form data
const formData = reactive({
  displayName: '',
  bio: '',
  occupation: '',
  highestEducation: '',
  school: '',
  phoneNumber: '',
  email: '',
  location: '',
  websiteUrl: '',
  dateOfBirth: '',
  gender: '',
  skills: [],
  interests: []
})

const privacySettings = reactive({
  display_name_public: true,
  bio_public: true,
  occupation_public: true,
  education_public: true,
  school_public: true,
  phone_public: false,
  email_public: false,
  skills_public: true,
  interests_public: true,
  location_public: true,
  website_public: true,
  date_of_birth_public: false,
  gender_public: true,
  social_links_public: true,
  rank_hidden: false
})

const socialLinksData = reactive({})
const socialLinksPublic = reactive({})

// UI state
const saving = ref(false)
const skillInput = ref('')
const interestInput = ref('')
const isPremiumUser = ref(false)

// Available social platforms
const availablePlatforms = computed(() => SocialLinks.getSupportedPlatforms())

// Methods
const loadProfileData = async () => {
  try {
    // Load profile data
    Object.assign(formData, {
      displayName: props.profile.display_name || '',
      bio: props.profile.bio || '',
      occupation: props.profile.occupation || '',
      highestEducation: props.profile.highest_education || '',
      school: props.profile.school || '',
      phoneNumber: props.profile.phone_number || '',
      email: props.profile.email || '',
      location: props.profile.location || '',
      websiteUrl: props.profile.website_url || '',
      dateOfBirth: props.profile.date_of_birth || '',
      gender: props.profile.gender || '',
      skills: props.profile.skills || [],
      interests: props.profile.interests || []
    })
    
    // Load privacy settings
    const privacy = await ProfilePrivacy.getPrivacySettings(authStore.user.id)
    Object.assign(privacySettings, privacy)
    
    // Load social links
    const socialLinks = await SocialLinks.getUserSocialLinks(authStore.user.id, true)
    socialLinks.forEach(link => {
      socialLinksData[link.platform] = link.username || link.url
      socialLinksPublic[link.platform] = link.is_public
    })
    
    // Check premium status
    isPremiumUser.value = await Profile.isPremiumUser(authStore.user.id)
    
  } catch (error) {
    console.error('Error loading profile data:', error)
  }
}

const addSkill = () => {
  const skill = skillInput.value.trim()
  if (skill && !formData.skills.includes(skill)) {
    formData.skills.push(skill)
    skillInput.value = ''
  }
}

const removeSkill = (index) => {
  formData.skills.splice(index, 1)
}

const addInterest = () => {
  const interest = interestInput.value.trim()
  if (interest && !formData.interests.includes(interest)) {
    formData.interests.push(interest)
    interestInput.value = ''
  }
}

const removeInterest = (index) => {
  formData.interests.splice(index, 1)
}

const saveProfile = async () => {
  try {
    saving.value = true
    
    // Validate required fields
    if (!formData.phoneNumber.trim()) {
      alert('Phone number is required.')
      return
    }
    
    // Update profile
    const updatedProfile = await Profile.updateProfile(authStore.user.id, {
      displayName: formData.displayName,
      bio: formData.bio,
      occupation: formData.occupation,
      highestEducation: formData.highestEducation,
      school: formData.school,
      phoneNumber: formData.phoneNumber,
      skills: formData.skills,
      interests: formData.interests,
      location: formData.location,
      websiteUrl: formData.websiteUrl,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender
    })
    
    // Update privacy settings
    await ProfilePrivacy.updatePrivacySettings(authStore.user.id, privacySettings)
    
    // Update social links
    for (const platform of availablePlatforms.value) {
      const value = socialLinksData[platform.key]
      if (value && value.trim()) {
        let url = value.trim()
        let username = value.trim()
        
        // Format URL for platforms
        if (platform.baseUrl && !url.startsWith('http')) {
          if (platform.key === 'website') {
            url = url.startsWith('http') ? url : `https://${url}`
          } else {
            url = `${platform.baseUrl}${username}`
          }
        }
        
        await SocialLinks.upsertSocialLink(authStore.user.id, {
          platform: platform.key,
          username: platform.key === 'website' ? null : username,
          url: url,
          isPublic: socialLinksPublic[platform.key] !== false
        })
      } else {
        // Remove empty social links
        await SocialLinks.deleteSocialLink(authStore.user.id, platform.key)
      }
    }
    
    emit('updated', updatedProfile)
    
  } catch (error) {
    console.error('Error saving profile:', error)
    alert('Failed to save profile. Please try again.')
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  emit('close')
}

// Lifecycle
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #6b7280;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required {
  color: #ef4444;
}

.form-input,
.form-textarea,
.form-select {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.privacy-toggle {
  margin-top: 0.5rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
}

.toggle-label.small {
  font-size: 0.75rem;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: #d1d5db;
  border-radius: 12px;
  transition: background-color 0.2s;
}

.toggle-slider.small {
  width: 36px;
  height: 20px;
  border-radius: 10px;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-slider.small::before {
  width: 16px;
  height: 16px;
}

.toggle-input:checked + .toggle-slider {
  background: #4f46e5;
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-input:checked + .toggle-slider.small::before {
  transform: translateX(16px);
}

.toggle-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
  margin-left: 3rem;
}

.tags-input-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
}

.skill-tag {
  background: #e0e7ff;
  color: #4338ca;
}

.interest-tag {
  background: #fce7f3;
  color: #be185d;
}

.remove-tag-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.skill-tag .remove-tag-btn {
  color: #4338ca;
}

.skill-tag .remove-tag-btn:hover {
  background: rgba(67, 56, 202, 0.1);
}

.interest-tag .remove-tag-btn {
  color: #be185d;
}

.interest-tag .remove-tag-btn:hover {
  background: rgba(190, 24, 93, 0.1);
}

.social-links-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.social-link-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.platform-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
  font-weight: 500;
  color: #374151;
}

.link-input-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  position: sticky;
  bottom: 0;
  background: white;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    margin: 0;
    border-radius: 0;
    height: 100vh;
    max-height: 100vh;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .social-link-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .platform-info {
    min-width: auto;
  }
  
  .link-input-group {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
}
</style>
