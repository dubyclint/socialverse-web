<template>
  <div>
    <label class="block text-sm font-medium text-slate-300 mb-2">
      Profile Picture (Optional)
    </label>

    <div class="flex items-center gap-4">
      <!-- Avatar Preview -->
      <div class="flex-shrink-0">
        <div
          v-if="previewUrl"
          class="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500"
        >
          <img :src="previewUrl" :alt="'Avatar preview'" class="w-full h-full object-cover" />
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

      <!-- Upload Controls -->
      <div class="flex-1">
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="handleFileSelect"
          class="hidden"
        />

        <button
          type="button"
          @click="$refs.fileInput.click()"
          :disabled="uploading"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          <span v-if="uploading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </span>
          <span v-else>Choose Photo</span>
        </button>

        <p class="mt-2 text-xs text-slate-400">
          JPG, PNG or WebP. Max 5MB.
        </p>

        <p v-if="uploadError" class="mt-2 text-xs text-red-400">
          {{ uploadError }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { uploadAvatar } = useProfile()

const fileInput = ref<HTMLInputElement>()
const previewUrl = ref(props.modelValue || '')
const uploading = ref(false)
const uploadError = ref('')

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    uploadError.value = 'Please select a JPG, PNG, or WebP image'
    return
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'File size must be less than 5MB'
    return
  }

  uploadError.value = ''
  uploading.value = true

  try {
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // Upload file
    const result = await uploadAvatar(file)

    if (result.success) {
      emit('update:modelValue', result.url)
    } else {
      uploadError.value = result.error || 'Upload failed'
      previewUrl.value = props.modelValue || ''
    }
  } catch (err: any) {
    uploadError.value = err.message || 'An error occurred during upload'
    previewUrl.value = props.modelValue || ''
  } finally {
    uploading.value = false
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}
</script>

<style scoped>
/* Minimal scoped styles */
</style>
