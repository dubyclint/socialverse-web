<template>
  <div>
    <label class="block text-sm font-medium text-slate-300 mb-2">
      Select Your Interests * (Min 1)
    </label>

    <!-- Loading State -->
    <div v-if="loadingInterests" class="text-center py-4">
      <p class="text-slate-400">Loading interests...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="interestsError" class="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
      <p class="text-red-400 text-sm">{{ interestsError }}</p>
    </div>

    <!-- Interests Grid -->
    <div v-else class="space-y-4">
      <div v-for="category in groupedInterests" :key="category.name" class="space-y-2">
        <h3 class="text-sm font-semibold text-slate-300">{{ category.name }}</h3>
        <div class="grid grid-cols-2 gap-2">
          <label
            v-for="interest in category.interests"
            :key="interest.id"
            class="flex items-center p-3 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
            :class="{ 'border-blue-500 bg-blue-900/20': modelValue.includes(interest.id) }"
          >
            <input
              type="checkbox"
              :value="interest.id"
              :checked="modelValue.includes(interest.id)"
              :disabled="disabled"
              @change="handleInterestChange"
              class="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-slate-300">{{ interest.name }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  modelValue: string[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const { fetchInterests } = useInterests()

const interests = ref<any[]>([])
const loadingInterests = ref(true)
const interestsError = ref('')

const groupedInterests = computed(() => {
  const grouped: { [key: string]: any[] } = {}

  interests.value.forEach(interest => {
    const category = interest.category || 'Other'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(interest)
  })

  return Object.entries(grouped).map(([name, items]) => ({
    name,
    interests: items
  }))
})

const handleInterestChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const interestId = target.value

  let newValue = [...props.modelValue]

  if (target.checked) {
    if (!newValue.includes(interestId)) {
      newValue.push(interestId)
    }
  } else {
    newValue = newValue.filter(id => id !== interestId)
  }

  emit('update:modelValue', newValue)
}

onMounted(async () => {
  try {
    loadingInterests.value = true
    const result = await fetchInterests()
    interests.value = result
  } catch (err: any) {
    interestsError.value = err.message || 'Failed to load interests'
  } finally {
    loadingInterests.value = false
  }
})
</script>

<style scoped>
/* Minimal scoped styles */
</style>
