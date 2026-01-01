<template>
  <div style="padding: 20px;">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" style="color: red;">Error: {{ error }}</div>
    <div v-else-if="profile">
      <h1>{{ profile.full_name }}</h1>
      <p>@{{ profile.username }}</p>
    </div>
    <div v-else>Not found</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: false
})

const route = useRoute()
const loading = ref(false)
const error = ref<string | null>(null)
const profile = ref<any>(null)

onMounted(async () => {
  loading.value = true
  const username = route.params.username
  
  try {
    const response = await fetch(`/api/profile/${username}`)
    const json = await response.json()
    profile.value = json?.data || null
    if (!profile.value) error.value = 'Not found'
  } catch (e) {
    error.value = String(e)
  } finally {
    loading.value = false
  }
})
</script>
