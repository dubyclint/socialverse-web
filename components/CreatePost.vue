<!-- components/CreatePost.vue -->
<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Create New Post</h2>
        <button @click="$emit('close')" class="close-btn">
          <Icon name="x" size="20" />
        </button>
      </div>
      
      <form @submit.prevent="submitPost" class="post-form">
        <div class="form-group">
          <textarea
            v-model="postContent"
            placeholder="What's on your mind?"
            class="post-textarea"
            rows="4"
            maxlength="2000"
            required
          ></textarea>
          <div class="character-count">
            {{ postContent.length }}/2000
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Add Media (Optional)</label>
          <div class="media-upload-area">
            <input
              ref="fileInput"
              type="file"
              accept="image/*,video/*"
              multiple
              @change="handleFileUpload"
              class="file-input"
            />
            <button
              type="button"
              @click="$refs.fileInput.click()"
              class="upload-btn"
            >
              <Icon name="upload" size="20" />
              Choose Files
            </button>
          </div>
          
          <div v-if="uploadedFiles.length > 0" class="uploaded-files">
            <div
              v-for="(file, index) in uploadedFiles"
              :key="index"
              class="file-preview"
            >
              <img
                v-if="file.type.startsWith('image/')"
                :src="file.preview"
                :alt="file.name"
                class="file-thumbnail"
              />
              <video
                v-else-if="file.type.startsWith('video/')"
                :src="file.preview"
                class="file-thumbnail"
                muted
              />
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <button
                  type="button"
                  @click="removeFile(index)"
                  class="remove-file-btn"
                >
                  <Icon name="x" size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Privacy</label>
          <select v-model="postPrivacy" class="privacy-select">
            <option value="public">🌍 Public - Anyone can see</option>
            <option value="friends">👥 Friends - Only friends can see</option>
            <option value="private">🔒 Private - Only you can see</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Tags (Optional)</label>
          <input
            v-model="tagInput"
            @keydown.enter.prevent="addTag"
            @keydown.comma.prevent="addTag"
            placeholder="Add tags (press Enter or comma to add)"
            class="tag-input"
          />
          <div v-if="tags.length > 0" class="tags-display">
            <span
              v-for="(tag, index) in tags"
              :key="index"
              class="tag-item"
            >
              #{{ tag }}
              <button
                type="button"
                @click="removeTag(index)"
                class="remove-tag-btn"
              >
                <Icon name="x" size="12" />
              </button>
            </span>
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
            :disabled="!postContent.trim() || submitting"
            class="btn btn-primary"
          >
            <Icon v-if="submitting" name="loader" size="16" class="spinning" />
            {{ submitting ? 'Posting...' : 'Post' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { Post } from '~/Post'

const emit = defineEmits(['close', 'posted'])
const authStore = useAuthStore()

// Form data
const postContent = ref('')
const postPrivacy = ref('public')
const uploadedFiles = ref([])
const tags = ref([])
const tagInput = ref('')
const submitting = ref(false)

// Methods
const handleFileUpload = (event) => {
  const files = Array.from(event.target.files)
  
  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert(`File ${file.name} is too large. Maximum size is 10MB.`)
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedFiles.value.push({
        file,
        name: file.name,
        type: file.type,
        preview: e.target.result
      })
    }
    reader.readAsDataURL(file)
  })
  
  // Clear input
  event.target.value = ''
}

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1)
}

const addTag = () => {
  const tag = tagInput.value.trim().replace(/[#,]/g, '')
  if (tag && !tags.value.includes(tag)) {
    tags.value.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (index) => {
  tags.value.splice(index, 1)
}

const submitPost = async () => {
  try {
    submitting.value = true
    
    // Upload files first if any
    let mediaUrls = []
    if (uploadedFiles.value.length > 0) {
      // Implement file upload logic here
      // mediaUrls = await uploadFiles(uploadedFiles.value)
    }
    
    // Create post
    const postData = {
      userId: authStore.user.id,
      content: postContent.value.trim(),
      privacy: postPrivacy.value,
      tags: tags.value,
      mediaUrls: mediaUrls
    }
    
    const newPost = await Post.create(postData)
    
    emit('posted', newPost)
    
  } catch (error) {
    console.error('Error creating post:', error)
    alert('Failed to create post. Please try again.')
  } finally {
    submitting.value = false
  }
}

const closeModal = () => {
  emit('close')
}
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
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

.post-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.post-textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s;
}

.post-textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.character-count {
  text-align: right;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.media-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: border-color 0.2s;
}

.media-upload-area:hover {
  border-color: #4f46e5;
}

.file-input {
  display: none;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.upload-btn:hover {
  background: #4338ca;
}

.uploaded-files {
  margin-top: 1rem;
  display: grid;
  gap: 1rem;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.file-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}

.file-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name {
  font-weight: 500;
  color: #374151;
}

.remove-file-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-file-btn:hover {
  background: #dc2626;
}

.privacy-select {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s;
}

.privacy-select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.tag-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.tag-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
}

.remove-tag-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #4338ca;
  padding: 0;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.remove-tag-btn:hover {
  background: rgba(67, 56, 202, 0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
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
</style>
