<!-- FILE: /components/edit-profile-modal.vue - FIXED FOR SSR HYDRATION -->
<!-- ============================================================================
     EDIT PROFILE MODAL - FIXED: All user data wrapped in ClientOnly
     ✅ FIXED: User profile data wrapped
     ============================================================================ -->

<template>
  <!-- ✅ FIXED: Wrap entire modal in ClientOnly -->
  <ClientOnly>
    <div class="modal-overlay" @click="$emit('close')">
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
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Bio</label>
                <textarea
                  v-model="formData.bio"
                  class="form-textarea"
                  placeholder="Tell us about yourself"
                  rows="4"
                  maxlength="500"
                ></textarea>
                <span class="char-count">{{ formData.bio.length }}/500</span>
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
                  <label class="form-label">Website</label>
                  <input
                    v-model="formData.website"
                    type="url"
                    class="form-input"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            <!-- Social Links -->
            <div class="form-section">
              <h3 class="section-title">Social Links</h3>
              
              <div class="form-group">
                <label class="form-label">Twitter</label>
                <input
                  v-model="formData.twitter"
                  type="text"
                  class="form-input"
                  placeholder="@username"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Instagram</label>
                <input
                  v-model="formData.instagram"
                  type="text"
                  class="form-input"
                  placeholder="@username"
                />
              </div>

              <div class="form-group">
                <label class="form-label">LinkedIn</label>
                <input
                  v-model="formData.linkedin"
                  type="url"
                  class="form-input"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" @click="$emit('close')" class="btn-cancel">
              Cancel
            </button>
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

const emit = defineEmits(['close'])
const authStore = useAuthStore()

// Form Data
const formData = ref({
  fullName: authStore.user?.full_name || '',
  bio: authStore.user?.bio || '',
  location: authStore.user?.location || '',
  website: authStore.user?.website || '',
  twitter: authStore.user?.twitter || '',
  instagram: authStore.user?.instagram || '',
  linkedin: authStore.user?.linkedin || ''
})

const saving = ref(false)

// Methods
const saveProfile = async () => {
  saving.value = true
  try {
    // Save profile logic here
    console.log('Saving profile:', formData.value)
    await new Promise(resolve => setTimeout(resolve, 1000))
    emit('close')
  } catch (error) {
    console.error('Error saving profile:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0,);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: #e293b;
  border-radius: 16px;
  width: 100%;
  max-width: px;
  max-height:vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #334155;
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: rem;
}

.close-btn {
  background: none;
  border: none;
  color: #a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #334155;
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
  color: white;
  font-size: rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  color: #cbd5e1;
  font-size: 0.875rem;
  font-weight: 500;
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  background: #f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
  transition: all 0.3s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  font-size: 0.75rem;
  color: #64748b;
  text-align: right;
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
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-cancel {
  background: #334155;
  color: white;
}

.btn-cancel:hover {
  background: #475569;
}

.btn-save {
  background: #3b82f6;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #2563eb;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
