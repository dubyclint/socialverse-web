<template>
  <div class="create-post-page">
    <header class="page-header">
      <div class="header-content">
        <button @click="goBack" class="back-btn">← Back</button>
        <h1 class="page-title">Create Post</h1>
        <div class="header-spacer"></div>
      </div>
    </header>

    <main class="page-content">
      <div class="create-post-container">
        <section class="user-section">
          <div class="user-card">
            <img v-if="userAvatar" :src="userAvatar" :alt="userName" class="user-avatar" />
            <div v-else class="user-avatar-placeholder">{{ userInitials }}</div>
            <div class="user-details">
              <h2 class="user-name">{{ userName }}</h2>
              <p class="user-handle">@{{ userHandle }}</p>
              <p class="user-status">{{ userStatus }}</p>
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="editor-container">
            <label for="post-content" class="editor-label">What's on your mind?</label>
            <textarea id="post-content" v-model="postContent" placeholder="Share your thoughts..." class="post-editor" rows="8" maxlength="2000"></textarea>
            <div class="editor-footer">
              <div class="char-counter">
                <span :class="{ 'char-warning': postContent.length > 1800 }">{{ postContent.length }}/2000</span>
              </div>
            </div>
          </div>

          <div class="media-section">
            <h3 class="section-heading">Add Media</h3>
            <div v-if="previewUrl" class="media-preview-container">
              <div class="media-preview">
                <img :src="previewUrl" class="preview-image" />
                <button @click="removeMedia" class="remove-media-btn">✕ Remove</button>
                <div v-if="uploading" class="upload-progress">
                  <div class="progress-bar"><div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div></div>
                </div>
              </div>
            </div>
            <div v-if="!previewUrl" class="upload-buttons">
              <button @click="triggerFileInput" class="upload-btn" :disabled="uploading">📸 Upload Photo/Video</button>
              <button @click="addGif" class="upload-btn">🎬 Add GIF</button>
            </div>
            <input ref="fileInputRef" type="file" accept="image/*,video/*" @change="handleMediaUpload" class="file-input" />
          </div>

          <div class="settings-section">
            <h3 class="section-heading">Post Settings</h3>
            <div class="setting-group">
              <label class="setting-label">Privacy Level</label>
              <div class="privacy-options">
                <button v-for="option in privacyOptions" :key="option.value" @click="selectPrivacy(option.value)" class="privacy-btn" :class="{ active: selectedPrivacy === option.value }">
                  <span>{{ option.icon }}</span><span>{{ option.label }}</span>
                </button>
              </div>
            </div>
            <div class="setting-group">
              <label class="setting-label">Options</label>
              <div class="options-list">
                <label class="option-checkbox"><input v-model="allowComments" type="checkbox" /> <span>Allow comments</span></label>
                <label class="option-checkbox"><input v-model="allowSharing" type="checkbox" /> <span>Allow sharing</span></label>
              </div>
            </div>
          </div>

          <div class="action-section">
            <button @click="saveDraft" class="btn btn-secondary">💾 Save Draft</button>
            <button @click="publishPost" class="btn btn-primary" :disabled="!postContent.trim() || publishing">
              {{ publishing ? '⏳ Publishing...' : '🚀 Publish Post' }}
            </button>
          </div>
        </section>

        <aside class="preview-sidebar">
          <h3 class="sidebar-title">Preview</h3>
          <div class="preview-card">
            <div class="preview-content"><p>{{ postContent || 'Your post will appear here...' }}</p></div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { usePostsStore } from '~/stores/posts'
import { useFileUpload } from '~/composables/use-file-upload'

const router = useRouter()
const userStore = useUserStore()
const postsStore = usePostsStore()

const { uploading, progressPercentage } = useFileUpload()

// --- User Profile Computed Refs ---
const userAvatar = computed(() => userStore.user?.avatar)
const userName = computed(() => userStore.user?.username || 'User')
const userHandle = computed(() => userStore.user?.handle || 'handle')
const userStatus = computed(() => userStore.user?.status || 'Active')
const userInitials = computed(() => userName.value.substring(0, 2).toUpperCase())

// --- Draft State Management ---
const postContent = computed({
  get: () => postsStore.draft.content,
  set: (val) => postsStore.updateDraft({ content: val })
})

const selectedPrivacy = computed({
  get: () => postsStore.draft.privacy,
  set: (val) => postsStore.updateDraft({ privacy: val })
})

const allowComments = computed({
  get: () => postsStore.draft.allowComments,
  set: (val) => postsStore.updateDraft({ allowComments: val })
})

const allowSharing = computed({
  get: () => postsStore.draft.allowSharing,
  set: (val) => postsStore.updateDraft({ allowSharing: val })
})

// --- Local UI State ---
const previewUrl = ref<string | null>(null)
const mediaFile = ref<File | null>(null)
const publishing = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const successMessage = ref('')

const privacyOptions = [
  { value: 'public', icon: '🌍', label: 'Public' },
  { value: 'friends', icon: '👥', label: 'Friends Only' },
  { value: 'private', icon: '🔒', label: 'Private' }
]

// --- Actions ---
function goBack() {
  router.back()
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function addGif() {
  triggerFileInput()
}

async function publishPost() {
  if (!postContent.value.trim()) return
  publishing.value = true
  try {
    // API interaction using userStore data if needed
    // await postsStore.createPost({ ...postsStore.draft, authorId: userStore.user?.id })
    await new Promise(resolve => setTimeout(resolve, 1000))
    successMessage.value = '🎉 Post published successfully!'
    postsStore.clearDraft()
    setTimeout(() => router.push('/posts'), 2000)
  } catch (e) {
    console.error('Publishing error:', e)
  } finally {
    publishing.value = false
  }
}

function saveDraft() {
  postsStore.updateDraft({ saved_at: new Date().toISOString() })
  successMessage.value = '✅ Draft saved!'
  setTimeout(() => successMessage.value = '', 3000)
}

function selectPrivacy(val: string) { 
  postsStore.updateDraft({ privacy: val }) 
}

function handleMediaUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    mediaFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

function removeMedia() {
  previewUrl.value = null
  mediaFile.value = null
}

// --- Lifecycle ---
onMounted(() => {
  postsStore.loadDraft()
})

onBeforeUnmount(() => {
  if (postContent.value.trim() && !publishing.value) {
    if (!window.confirm('Leave with unsaved changes?')) {
      // Logic to prevent route change could go here if using Navigation Guards
    }
  }
})
</script>

<style scoped>
.create-post-page { min-height: 100vh; background: #f5f7fa; padding: 2rem 1rem; }
.page-header { background: white; padding: 1.5rem; margin-bottom: 2rem; position: sticky; top: 0; z-index: 100; }
.header-content { display: flex; align-items: center; justify-content: space-between; max-width: 1200px; margin: 0 auto; }
.create-post-container { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; max-width: 1200px; margin: 0 auto; }
.user-card { background: white; padding: 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem; }
.user-avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
.form-section { background: white; padding: 2rem; border-radius: 12px; }
.post-editor { width: 100%; padding: 1rem; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical; }
  .media-preview { position: relative; border-radius: 8px; overflow: hidden; background: #f5f5f5; }
.remove-media-btn { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.7); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; }
.privacy-btn { padding: 12px; background: #f5f5f5; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; display: flex; flex-direction: column; align-items: center; }
.privacy-btn.active { background: #667eea; color: white; border-color: #667eea; }
.btn { padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-primary { background: #667eea; color: white; border: none; }
.btn-secondary { background: #f5f5f5; border: 2px solid #e0e0e0; }

@media (max-width: 1024px) {
  .create-post-container { grid-template-columns: 1fr; }
  .preview-sidebar { display: none; }
}
</style>
