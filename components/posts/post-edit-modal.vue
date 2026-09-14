<template>
  <div class="edit-overlay" @click.self="$emit('close')">
    <section class="edit-modal">
      <header class="edit-head">
        <h3>Edit post</h3>
        <button class="icon-btn" aria-label="Close" @click="$emit('close')">
          <Icon name="x" size="18" />
        </button>
      </header>

      <textarea v-model="content" class="edit-text" rows="4" maxlength="2000" />

      <div v-if="media.length" class="edit-media">
        <div v-for="(url, index) in media" :key="url" class="edit-media-item">
          <video v-if="isVideo(url)" :src="url" controls playsinline preload="metadata" />
          <img v-else :src="url" alt="" />
          <button type="button" class="remove-media" aria-label="Remove media" @click="removeMedia(index)">
            <Icon name="x" size="14" />
          </button>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        class="file-input"
        :accept="POST_MEDIA_ACCEPT"
        @change="onFileChange"
      />

      <p v-if="error" class="edit-error">{{ error }}</p>

      <footer class="edit-actions">
        <button type="button" class="ghost" :disabled="busy" @click="fileInput?.click()">
          <Icon name="image" size="16" /> {{ media.length ? 'Add / replace photo' : 'Add photo or video' }}
        </button>
        <div class="spacer" />
        <button type="button" class="ghost" :disabled="busy" @click="$emit('close')">Cancel</button>
        <button type="button" class="primary" :disabled="busy || !canSave" @click="save">
          {{ busy ? 'Saving...' : 'Save' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { POST_MEDIA_ACCEPT, POST_MEDIA_MAX_ITEMS, validatePostMediaFile } from '~/utils/post-media'
import type { FeedPost } from '~/composables/useSocialFeed'

const props = defineProps<{ post: FeedPost }>()
const emit = defineEmits<{ close: [], saved: [payload: { content: string, media: string[] }] }>()

const { updatePost } = useSocialFeed()
const { uploadFile } = useFileUpload()

const content = ref(props.post.content)
const media = ref<string[]>([...(props.post.media ?? [])])
const fileInput = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const error = ref('')

const canSave = computed(() => content.value.trim().length > 0 || media.value.length > 0)

const isVideo = (url: string) => /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(url)

const removeMedia = (index: number) => {
  media.value.splice(index, 1)
}

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const invalid = validatePostMediaFile(file)
  if (invalid) {
    error.value = invalid
    return
  }

  if (media.value.length >= POST_MEDIA_MAX_ITEMS) {
    error.value = `A post can hold at most ${POST_MEDIA_MAX_ITEMS} media items`
    return
  }

  busy.value = true
  error.value = ''
  const uploaded = await uploadFile(file, 'posts', { optimize: !file.type.startsWith('video/') })
  busy.value = false

  if (!uploaded) {
    error.value = 'Upload failed, please try again'
    return
  }
  media.value.push(uploaded.url)
}

const save = async () => {
  busy.value = true
  error.value = ''
  const payload = { content: content.value.trim(), media: [...media.value] }
  const ok = await updatePost(props.post.id, payload)
  busy.value = false
  if (ok) emit('saved', payload)
  else error.value = 'Could not save changes'
}
</script>

<style scoped>
.edit-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(10, 15, 30, 0.75);
}

.edit-modal {
  width: min(520px, 100%);
  max-height: 85vh;
  overflow-y: auto;
  padding: 1rem;
  border-radius: var(--radius-md, 16px);
  background: var(--bg-card, #0a0f1e);
  border: 1px solid var(--color-dark-grey, #1f2937);
  color: var(--text-primary, #f0fffb);
}

.edit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.edit-head h3 { margin: 0; font-size: 1rem; }

.icon-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
}

.edit-text {
  width: 100%;
  padding: 0.7rem;
  border-radius: var(--radius-sm, 8px);
  border: 1px solid var(--color-dark-grey, #1f2937);
  background: var(--color-charcoal, #121827);
  color: inherit;
  resize: vertical;
  font: inherit;
}

.edit-media {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.edit-media-item {
  position: relative;
  border-radius: var(--radius-sm, 8px);
  overflow: hidden;
}

.edit-media-item img,
.edit-media-item video {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
  background: #000;
}

.remove-media {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 9999px;
  background: rgba(10, 15, 30, 0.8);
  color: #fff;
  cursor: pointer;
}

.file-input { display: none; }

.edit-error {
  margin: 0.6rem 0 0;
  font-size: 0.85rem;
  color: var(--color-error, #ff2e88);
}

.edit-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.spacer { flex: 1; }

.ghost,
.primary {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.9rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  cursor: pointer;
  border: 1px solid var(--color-dark-grey, #1f2937);
  background: transparent;
  color: inherit;
}

.primary {
  background: var(--accent, #6fffd4);
  color: var(--text-on-accent, #0a0f1e);
  border-color: transparent;
  font-weight: 600;
}

.ghost:disabled,
.primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
