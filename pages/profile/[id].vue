<template>
  <div class="profile-page">
    <div class="profile-container">
      <div v-if="loading" class="state-card">
        <div class="spinner" />
        <p>Loading profile...</p>
      </div>

      <div v-else-if="error" class="state-card error">
        <h2>Profile unavailable</h2>
        <p>{{ error }}</p>
        <NuxtLink to="/profile" class="btn">Go to My Profile</NuxtLink>
      </div>

      <template v-else>
        <div class="profile-header">
          <img
            :src="profile.avatar_url || '/default-avatar.svg'"
            :alt="profile.full_name || profile.username || 'User'"
            class="avatar"
            @error="onAvatarError"
          />
          <div>
            <h1>{{ profile.full_name || profile.username || 'User' }}</h1>
            <p class="username">@{{ profile.username || 'unknown' }}</p>
            <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>
            <p v-if="profile.location" class="meta">📍 {{ profile.location }}</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

const route = useRoute()
const loading = ref(true)
const error = ref('')
const profile = ref<any>(null)

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

const onAvatarError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = '/default-avatar.svg'
}

onMounted(async () => {
  try {
    const id = String(route.params.id || '').trim()

    if (!id) {
      error.value = 'Missing profile id.'
      return
    }

    // Optional strictness: enforce UUID-shaped ids
    if (!isUuid(id)) {
      error.value = 'Invalid profile id format.'
      return
    }

    const res: any = await $fetch(`/api/profile/${encodeURIComponent(id)}`)
    profile.value = res?.data || res

    if (!profile.value) {
      error.value = 'Profile not found.'
    }
  } catch (e: any) {
    if (e?.statusCode === 404 || e?.response?.status === 404) {
      error.value = 'Profile not found.'
    } else {
      error.value = e?.statusMessage || 'Failed to load profile.'
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #0f172a;
  padding: 24px;
}
.profile-container {
  max-width: 900px;
  margin: 0 auto;
}
.state-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 24px;
  color: #cbd5e1;
  text-align: center;
}
.state-card.error h2 {
  color: #fca5a5;
}
.spinner {
  width: 34px;
  height: 34px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 999px;
  margin: 0 auto 10px;
  animation: spin 1s linear infinite;
}
.profile-header {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 18px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 20px;
  color: #e2e8f0;
}
.avatar {
  width: 110px;
  height: 110px;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid #3b82f6;
}
.username {
  color: #94a3b8;
  margin-top: 4px;
}
.bio {
  margin-top: 10px;
  color: #cbd5e1;
}
.meta {
  margin-top: 6px;
  color: #94a3b8;
}
.btn {
  display: inline-block;
  margin-top: 12px;
  background: #2563eb;
  color: white;
  padding: 10px 14px;
  border-radius: 8px;
  text-decoration: none;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
