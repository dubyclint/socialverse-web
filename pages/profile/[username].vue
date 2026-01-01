<template>
  <div class="profile-container">
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
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
import type { Profile } from '~/stores/profile'

const route = useRoute()
const loading = ref(false)
const error = ref<string | null>(null)
const profile = ref<Profile | null>(null)

onMounted(async () => {
  loading.value = true
  const username = route.params.username
  
  try {
    const { $fetch } = useNuxtApp()
    const res = await $fetch(`/api/profile/${username}`)
    if (res?.data) {
      profile.value = res.data
    } else {
      error.value = 'Not found'
    }
  } catch (e) {
    error.value = String(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
</style>
