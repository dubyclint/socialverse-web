<template>
  <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" style="color: red;">{{ error }}</div>
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
  error.value = null
  
  try {
    // Get username safely
    const usernameParam = route.params.username
    const username = Array.isArray(usernameParam) ? usernameParam[0] : String(usernameParam || '')
    
    console.log('[Profile] Username param:', usernameParam)
    console.log('[Profile] Username string:', username)
    
    if (!username) {
      error.value = 'Username is required'
      loading.value = false
      return
    }

    // Construct URL safely
    const url = `/api/profile/${encodeURIComponent(username)}`
    console.log('[Profile] Fetching from URL:', url)

    // Use native fetch with explicit error handling
    const response = await fetch(url)
    console.log('[Profile] Response status:', response.status)

    if (!response.ok) {
      error.value = `HTTP ${response.status}: ${response.statusText}`
      loading.value = false
      return
    }

    const json = await response.json()
    console.log('[Profile] Response data:', json)

    if (json?.data) {
      profile.value = json.data
      console.log('[Profile] ✅ Profile loaded')
    } else {
      error.value = 'User not found'
    }
  } catch (e: any) {
    console.error('[Profile] Exception:', e)
    error.value = `Error: ${e?.message || String(e)}`
  } finally {
    loading.value = false
  }
})
</script>
