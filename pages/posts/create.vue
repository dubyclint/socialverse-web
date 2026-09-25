<template>
  <div class="create-post-page">
    <header class="page-header">
      <div class="header-content">
        <button class="back-btn" @click="goBack">← Back</button>
        <h1 class="page-title">Create Post</h1>
        <div class="header-spacer" />
      </div>
    </header>

    <main class="page-content">
      <div class="create-post-container">
        <section class="form-section">
          <div class="composer-head">
            <img v-if="userAvatar" :src="userAvatar" :alt="userName" class="user-avatar" />
            <div v-else class="user-avatar-placeholder">{{ userInitials }}</div>
            <div class="user-details">
              <h2 class="user-name">{{ userName }}</h2>
              <p class="user-handle">@{{ userHandle }}</p>
            </div>
          </div>

          <textarea
            id="post-content"
            v-model="postContent"
            placeholder="What's on your mind?"
            class="post-editor"
            rows="6"
            maxlength="2000"
          />
          <div class="editor-footer">
            <span :class="{ 'char-warning': postContent.length > 1800 }">{{ postContent.length }}/2000</span>
          </div>

          <div v-if="mediaItems.length" class="media-preview-grid">
            <div v-for="(item, index) in mediaItems" :key="item.previewUrl" class="media-preview">
              <video v-if="item.isVideo" :src="item.previewUrl" controls playsinline preload="metadata" />
              <img v-else :src="item.previewUrl" alt="" />
              <button class="remove-media-btn" aria-label="Remove" @click="removeMedia(index)">✕</button>
            </div>
          </div>

          <div v-if="uploading" class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }" />
          </div>

          <div class="upload-buttons">
            <button class="upload-btn" :disabled="uploading || mediaItems.length >= POST_MEDIA_MAX_ITEMS" @click="triggerFileInput">
              <Icon name="image" size="16" /> Add photo or video
            </button>
            <span class="upload-hint">Up to {{ POST_MEDIA_MAX_ITEMS }} items · videos max {{ videoLimitMb }}MB</span>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            :accept="POST_MEDIA_ACCEPT"
            class="file-input"
            @change="handleMediaSelect"
          />

          <div class="settings-section">
            <div class="setting-group">
              <label class="setting-label">Who can see this</label>
              <div class="privacy-options">
                <button
                  v-for="option in privacyOptions"
                  :key="option.value"
                  class="privacy-btn"
                  :class="{ active: selectedPrivacy === option.value }"
                  @click="selectPrivacy(option.value)"
                >
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

          <p v-if="errorMessage" class="publish-error">{{ errorMessage }}</p>
          <p v-if="successMessage" class="publish-success">{{ successMessage }}</p>

          <div class="action-section">
            <button class="btn btn-secondary" @click="saveDraft">Save draft</button>
            <button
              class="btn btn-primary"
              :disabled="(!postContent.trim() && !mediaItems.length) || publishing"
              @click="publishPost"
            >
              {{ publishing ? 'Publishing...' : 'Publish' }}
            </button>
          </div>
        </section>

        <aside class="preview-sidebar">
          <h3 class="sidebar-title">Preview</h3>
          <div class="preview-card">
            <p>{{ postContent || 'Your post will appear here...' }}</p>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import { usePostsStore } from '~/stores/posts'
import { useFileUpload } from '~/composables/use-file-upload'
import {
  POST_MEDIA_ACCEPT,
  POST_MEDIA_MAX_ITEMS,
  POST_VIDEO_MAX_BYTES,
  isPostVideoMime,
  validatePostMediaFile
} from '~/utils/post-media'

interface ComposerMedia {
  file: File
  previewUrl: string
  isVideo: boolean
}

const router = useRouter()
const userStore = useUserStore()
const postsStore = usePostsStore()

const { uploading, progressPercentage, uploadFile } = useFileUpload()

const userAvatar = computed(() => userStore.userAvatar)
const userName = computed(() => userStore.userDisplayName || 'User')
const userHandle = computed(() => userStore.profile?.username || 'user')
const userInitials = computed(() => userStore.userInitials)
const videoLimitMb = Math.round(POST_VIDEO_MAX_BYTES / 1024 / 1024)

const postContent = computed({
  get: () => postsStore.draft.content,
  set: (val: string) => postsStore.updateDraft({ content: val })
})

const selectedPrivacy = computed(() => postsStore.draft.privacy)

const allowComments = computed({
  get: () => postsStore.draft.allowComments,
  set: (val: boolean) => postsStore.updateDraft({ allowComments: val })
})

const allowSharing = computed({
  get: () => postsStore.draft.allowSharing,
  set: (val: boolean) => postsStore.updateDraft({ allowSharing: val })
})

const mediaItems = ref<ComposerMedia[]>([])
const publishing = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const successMessage = ref('')
const errorMessage = ref('')

const privacyOptions = [
  { value: 'public', icon: '🌍', label: 'Public' },
  { value: 'friends', icon: '👥', label: 'Friends' },
  { value: 'private', icon: '🔒', label: 'Only me' }
]

const goBack = () => router.back()
const triggerFileInput = () => fileInputRef.value?.click()
const selectPrivacy = (val: string) => postsStore.updateDraft({ privacy: val })

const handleMediaSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const invalid = validatePostMediaFile(file)
  if (invalid) {
    errorMessage.value = invalid
    return
  }
  if (mediaItems.value.length >= POST_MEDIA_MAX_ITEMS) {
    errorMessage.value = `A post can hold at most ${POST_MEDIA_MAX_ITEMS} media items`
    return
  }

  errorMessage.value = ''
  mediaItems.value.push({
    file,
    previewUrl: URL.createObjectURL(file),
    isVideo: isPostVideoMime(file.type)
  })
}

const removeMedia = (index: number) => {
  const [removed] = mediaItems.value.splice(index, 1)
  if (removed) URL.revokeObjectURL(removed.previewUrl)
}

const clearMedia = () => {
  mediaItems.value.forEach(item => URL.revokeObjectURL(item.previewUrl))
  mediaItems.value = []
}

const publishPost = async () => {
  if (!postContent.value.trim() && !mediaItems.value.length) return

  publishing.value = true
  errorMessage.value = ''
  try {
    const hashtags = Array.from(
      new Set((postContent.value.match(/#[\p{L}0-9_]+/gu) || []).map(tag => tag.slice(1).toLowerCase()))
    )

    const media: Array<{ url: string, type: string }> = []
    for (const item of mediaItems.value) {
      const uploaded = await uploadFile(item.file, 'posts', { optimize: !item.isVideo })
      if (!uploaded) throw new Error('We could not upload your media. Please try again.')
      media.push({ url: uploaded.url, type: item.file.type })
    }

    const response = await $fetch<{ success: boolean, data?: { id: string } }>('/api/posts/create', {
      method: 'POST',
      body: {
        content: postContent.value.trim(),
        privacy: selectedPrivacy.value,
        tags: hashtags,
        media
      }
    })

    if (!response?.data) throw new Error('Your post could not be published. Please try again.')

    postsStore.clearDraft()
    clearMedia()
    await router.push('/feed')
  } catch (e) {
    // Server/database details never reach the composer; the user gets a plain message.
    errorMessage.value =
      e instanceof Error && !/\b(supabase|postgres|sql|fetch failed|\d{3} )\b/i.test(e.message)
        ? e.message
        : 'Your post could not be published. Please try again.'
  } finally {
    publishing.value = false
  }
}

const saveDraft = () => {
  postsStore.updateDraft({ saved_at: new Date().toISOString() })
  successMessage.value = 'Draft saved'
  setTimeout(() => { successMessage.value = '' }, 3000)
}

onMounted(async () => {
  postsStore.loadDraft()
  if (!userStore.profile) await userStore.fetchProfile()
})

onBeforeUnmount(clearMedia)
</script>

<style scoped>
.create-post-page {
  min-height: 100vh;
  background: var(--bg-app, #121827);
  color: var(--text-primary, #f0fffb);
  padding-bottom: 2rem;
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--bg-card, #0a0f1e);
  border-bottom: 1px solid var(--color-dark-grey, #1f2937);
  padding: 0.85rem 1rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1100px;
  margin: 0 auto;
}

.page-title { margin: 0; font-size: 1.05rem; }
.header-spacer { width: 60px; }

.back-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
}

.create-post-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.5rem;
  max-width: 1100px;
  margin: 1.5rem auto 0;
  padding: 0 1rem;
}

.form-section,
.preview-card {
  background: var(--bg-card, #0a0f1e);
  border: 1px solid var(--color-dark-grey, #1f2937);
  border-radius: var(--radius-md, 16px);
  padding: 1rem;
}

.composer-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.user-avatar,
.user-avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  object-fit: cover;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-dark-grey, #1f2937);
}

.user-details h2 { margin: 0; font-size: 0.95rem; }
.user-handle { margin: 0; font-size: 0.8rem; opacity: 0.65; }

.post-editor {
  width: 100%;
  padding: 0.85rem;
  border-radius: var(--radius-sm, 8px);
  border: 1px solid var(--color-dark-grey, #1f2937);
  background: var(--color-charcoal, #121827);
  color: inherit;
  font: inherit;
  resize: vertical;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  font-size: 0.75rem;
  opacity: 0.6;
  margin-top: 0.25rem;
}

.char-warning { color: var(--color-solar-gold, #ffc857); opacity: 1; }

.media-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.media-preview {
  position: relative;
  border-radius: var(--radius-sm, 8px);
  overflow: hidden;
  background: #000;
}

.media-preview img,
.media-preview video {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.remove-media-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 9999px;
  background: rgba(10, 15, 30, 0.8);
  color: #fff;
  cursor: pointer;
}

.progress-bar {
  height: 4px;
  margin-top: 0.75rem;
  border-radius: 9999px;
  background: var(--color-dark-grey, #1f2937);
  overflow: hidden;
}

.progress-fill { height: 100%; background: var(--accent, #6fffd4); transition: width 0.2s; }

.upload-buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.85rem;
  flex-wrap: wrap;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 9999px;
  border: 1px solid var(--color-dark-grey, #1f2937);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 0.85rem;
}

.upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.upload-hint { font-size: 0.75rem; opacity: 0.6; }
.file-input { display: none; }

.settings-section { margin-top: 1.25rem; display: grid; gap: 1rem; }
.setting-label { display: block; font-size: 0.8rem; opacity: 0.7; margin-bottom: 0.4rem; }

.privacy-options { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.privacy-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid var(--color-dark-grey, #1f2937);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 0.85rem;
}

.privacy-btn.active {
  background: var(--accent, #6fffd4);
  color: var(--text-on-accent, #0a0f1e);
  border-color: transparent;
}

.options-list { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; }
.option-checkbox { display: inline-flex; align-items: center; gap: 0.35rem; }

.publish-error { color: var(--color-error, #ff2e88); margin: 0.75rem 0 0; font-size: 0.85rem; }
.publish-success { color: var(--accent, #6fffd4); margin: 0.75rem 0 0; font-size: 0.85rem; }

.action-section { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; }

.btn {
  padding: 0.55rem 1.2rem;
  border-radius: 9999px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid var(--color-dark-grey, #1f2937);
  background: transparent;
  color: inherit;
}

.btn-primary {
  background: var(--accent, #6fffd4);
  color: var(--text-on-accent, #0a0f1e);
  border-color: transparent;
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.sidebar-title { font-size: 0.9rem; margin: 0 0 0.5rem; opacity: 0.8; }
.preview-card p { margin: 0; white-space: pre-wrap; font-size: 0.9rem; }

@media (max-width: 1024px) {
  .create-post-container { grid-template-columns: 1fr; }
  .preview-sidebar { display: none; }
}
</style>
