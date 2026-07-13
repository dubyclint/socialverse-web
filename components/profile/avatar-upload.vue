<template>
  <div>
    <label class="block text-sm font-medium text-slate-300 mb-2">Profile Picture (Optional)</label>

    <div class="flex items-center gap-4">
      <div class="flex-shrink-0">
        <div v-if="previewUrl" class="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500">
          <img :src="previewUrl" alt="Avatar preview" class="w-full h-full object-cover" />
        </div>
        <div
          v-else
          class="w-24 h-24 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center"
        >
          <svg class="w-12 h-12 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>

      <div class="flex-1">
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          @change="handleFileSelect"
          class="hidden"
        />

        <button
          type="button"
          @click="fileInput?.click()"
          :disabled="uploading"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          <span v-if="uploading">Uploading...</span>
          <span v-else>Choose Photo</span>
        </button>

        <p class="mt-2 text-xs text-slate-400">JPEG, PNG, GIF, WebP. Max 5MB.</p>
        <p v-if="uploadError" class="mt-2 text-xs text-red-400">{{ uploadError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref(props.modelValue || '')
const uploading = ref(false)
const uploadError = ref('')

watch(
  () => props.modelValue,
  (v) => { previewUrl.value = v || '' }
)

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
    uploadError.value = 'Please select JPEG, PNG, GIF, or WebP'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'File size must be less than 5MB'
    return
  }

  uploadError.value = ''
  uploading.value = true

  try {
    previewUrl.value = URL.createObjectURL(file)

    const formData = new FormData()
    formData.append('file', file)

    // Note: If you use a global fetch interceptor (recommended), 
    // you no longer need to pass the Authorization header manually.
    const res: any = await $fetch('/api/profile/avatar-upload', {
      method: 'POST',
      body: formData
    })

    const payload = res?.data || res
    const avatarUrl = payload?.avatar_url

    if (!avatarUrl) {
      throw new Error('Upload succeeded but avatar URL missing from response')
    }

    emit('update:modelValue', avatarUrl)
    previewUrl.value = avatarUrl
  } catch (err: any) {
    uploadError.value = err?.statusMessage || err?.message || 'Upload failed'
    previewUrl.value = props.modelValue || ''
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<style scoped>
/* Optional enhancement layer (safe with Tailwind) */

button {
  transition: background-color 0.2s ease, transform 0.08s ease, opacity 0.2s ease;
}

button:active:not(:disabled) {
  transform: translateY(1px);
}

button:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.95);
  outline-offset: 2px;
}

img {
  display: block;
  image-rendering: auto;
}

.text-red-400,
.text-slate-400 {
  line-height: 1.35;
}

/* Improve alignment on small screens */
@media (max-width: 640px) {
  .flex.items-center.gap-4 {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
