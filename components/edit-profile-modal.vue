<!-- FILE: /components/edit-profile-modal.vue - COMPLETE FIXED VERSION -->  
<template>  
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
import { useProfileStore } from '~/stores/profile'  
import { useRouter } from 'vue-router'  
const emit = defineEmits(['close'])  
const router = useRouter()  
const authStore = useAuthStore()  
const profileStore = useProfileStore()  
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
const saveProfile = async () => {  
  saving.value = true  
  try {  
    const response = await $fetch('/api/profile/update', {  
      method: 'POST',  
      headers: {  
        'Authorization': `Bearer ${authStore.token}`  
      },  
      body: {  
        full_name: formData.value.fullName,  
        bio: formData.value.bio,  
        location: formData.value.location,  
        website: formData.value.website,  
        twitter: formData.value.twitter,  
        instagram: formData.value.instagram,  
        linkedin: formData.value.linkedin  
      }  
    })  
    if (response) {  
      profileStore.setProfile(response)  
      emit('close')  
      router.push(`/profile/${response.username}`)  
    }  
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
  background: rgba(0, 0, 0, 0.7);  
  display: flex;  
  align-items: center;  
  justify-content: center;  
  z-index: 9999;  
  padding: 1rem;  
}  
.modal-content {  
  background: #1e293b;  
  border-radius: 16px;  
  width: 100%;  
  max-width: 600px;  
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
  z-index: 10;  
}  
.modal-header h2 {  
  margin: 0;  
  color: #f1f5f9;  
  font-size: 1.25rem;  
  font-weight: 700;  
}  
.close-btn {  
  background: none;  
  border: none;  
  color: #94a3b8;  
  cursor: pointer;  
  padding: 0.5rem;  
  border-radius: 6px;  
  transition: all 0.3s;  
  display: flex;  
  align-items: center;  
  justify-content: center;  
}  
.close-btn:hover {  
  background: #334155;  
  color: #e2e8f0;  
}  
.profile-form {  
  padding: 1.5rem;  
}  
.form-sections {  
  display: flex;  
  flex-direction: column;  
  gap: 2rem;  
  margin-bottom: 2rem;  
}  
.form-section {  
  display: flex;  
  flex-direction: column;  
  gap: 1rem;  
}  
.section-title {  
  color: #f1f5f9;  
  font-size: 1rem;  
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
  background: #0f172a;  
  border: 1px solid #334155;  
  border-radius: 8px;  
  color: #e2e8f0;  
  font-size: 0.875rem;  
  transition: all 0.3s;  
  font-family: inherit;  
}  
.form-input:focus,  
.form-textarea:focus {  
  outline: none;  
  border-color: #3b82f6;  
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);  
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
  font-size: 0.95rem;  
}  
.btn-cancel {  
  background: #334155;  
  color: #e2e8f0;  
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
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);  
}  
.btn-save:disabled {  
  opacity: 0.5;  
  cursor: not-allowed;  
}  
@media (max-width: 640px) {  
  .modal-content {  
    max-width: 100%;  
    border-radius: 12px;  
  }  
  .form-row {  
    grid-template-columns: 1fr;  
  }  
  .form-actions {  
    flex-direction: column;  
  }  
  .btn-cancel,  
  .btn-save {  
    width: 100%;  
  }  
}  
</style>  
