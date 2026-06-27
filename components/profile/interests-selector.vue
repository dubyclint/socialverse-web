<template>
  <div>
    <label class="block text-sm font-medium text-slate-300 mb-2">
      Select Your Interests * (1–5)
    </label>

    <div v-if="loadingInterests" class="text-center py-4">
      <p class="text-slate-400">Loading interests...</p>
    </div>

    <div v-else-if="interestsError" class="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
      <p class="text-red-400 text-sm">{{ interestsError }}</p>
    </div>

    <div v-else class="space-y-4">
      <div class="text-xs text-slate-400">
        Selected: {{ modelValue.length }}/5
      </div>

      <div v-for="category in groupedInterests" :key="category.name" class="space-y-2">
        <h3 class="text-sm font-semibold text-slate-300">{{ category.name }}</h3>
        <div class="grid grid-cols-2 gap-2">
          <label
            v-for="interest in category.interests"
            :key="interest.id"
            class="flex items-center p-3 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            :class="{ 'border-blue-500 bg-blue-900/20': modelValue.includes(interest.name) }"
          >
            <input
              type="checkbox"
              :value="interest.name"
              :checked="modelValue.includes(interest.name)"
              :disabled="disabled || (modelValue.length >= 5 && !modelValue.includes(interest.name))"
              @change="handleInterestChange"
              class="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-slate-300">{{ interest.name }}</span>
          </label>
        </div>
      </div>
    </div>

    <p v-if="selectionError" class="mt-2 text-xs text-red-400">
      {{ selectionError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  modelValue: string[] // interest names (canonical for /api/profile/complete)
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const interests = ref<any[]>([])
const loadingInterests = ref(true)
const interestsError = ref('')
const selectionError = ref('')

const groupedInterests = computed(() => {
  const grouped: Record<string, any[]> = {}
  for (const interest of interests.value) {
    const category = interest?.category || 'Other'
    if (!grouped[category]) grouped[category] = []
    grouped[category].push(interest)
  }
  return Object.entries(grouped).map(([name, items]) => ({ name, interests: items }))
})

const fetchInterests = async () => {
  const res: any = await $fetch('/api/profile/interests')
  const data = res?.data || res
  return data?.interests || data || []
}

const handleInterestChange = (event: Event) => {
  selectionError.value = ''
  const target = event.target as HTMLInputElement
  const interestName = target.value

  let next = [...props.modelValue]

  if (target.checked) {
    if (next.length >= 5) {
      selectionError.value = 'You can select up to 5 interests'
      target.checked = false
      return
    }
    if (!next.includes(interestName)) next.push(interestName)
  } else {
    next = next.filter((name) => name !== interestName)
  }

  emit('update:modelValue', next)
}

onMounted(async () => {
  try {
    loadingInterests.value = true
    interests.value = await fetchInterests()
  } catch (err: any) {
    interestsError.value = err?.statusMessage || err?.message || 'Failed to load interests'
  } finally {
    loadingInterests.value = false
  }
})
</script>

<style scoped>
/* Optional: rely primarily on utility classes */
</style>
