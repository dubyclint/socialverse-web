<template>
  <div class="profile-container">
    <div v-if="loading" class="loading">
      <p>Loading profile...</p>
      <p style="font-size: 12px; color: #999;">Username: {{ routeUsername }}</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="goBack">Go Back</button>
    </div>

    <div v-else-if="profile" class="profile-content">
      <div class="profile-header">
        <img v-if="profile.avatar_url" :src="profile.avatar_url" :alt="profile.full_name" class="avatar" />
        <div class="profile-info">
          <h1>{{ profile.full_name }}</h1>
          <p class="username">@{{ profile.username }}</p>
          <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>
          <div v-if="profile.is_verified" class="verified-badge">✓ Verified</div>
        </div>
      </div>

      <div class="profile-stats">
        <div class="stat">
          <span class="label">Posts</span>
          <span class="value">0</span>
        </div>
        <div class="stat">
          <span class="label">Followers</span>
          <span class="value">0</span>
        </div>
        <div class="stat">
          <span class="label">Following</span>
          <span class="value">0</span>
        </div>
      </div>

      <div v-if="profile.email" class="profile-email">
        <strong>Email:</strong> {{ profile.email }}
      </div>

      <div class="verification-status">
        <strong>Status:</strong> {{ profile.verification_status }}
      </div>
    </div>

    <div v-else class="not-found">
      <p>User not found</p>
      <button @click="goBack">Go Back</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Profile } from '~/stores/profile'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref<string | null>(null)
const profile = ref<Profile | null>(null)

const routeUsername = computed(() => {
  try {
    return String(route.params.username || 'unknown')
  } catch {
    return 'error'
  }
})

const goBack = () => {
  router.back()
}

const loadProfile = async () => {
  loading.value = true
  error.value = null

  try {
    const username = String(route.params.username)
    
    if (!username || username === 'undefined') {
      error.value = 'Invalid username'
      loading.value = false
      return
    }

    const url = `/api/profile/${username}`
    const response = await fetch(url)
    const data = await response.json()

    if (data?.data) {
      profile.value = data.data as Profile
    } else {
      error.value = 'User not found'
    }
  } catch (err) {
    error.value = String(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .error, .not-found {
  text-align: center;
  padding: 40px 20px;
}

.error, .not-found {
  color: #e74c3c;
}

.profile-header {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
}

.profile-info h1 {
  margin: 0 0 5px 0;
  font-size: 24px;
}

.username {
  color: #666;
  margin: 0 0 10px 0;
}

.bio {
  margin: 10px 0;
  color: #555;
}

.verified-badge {
  display: inline-block;
  background: #27ae60;
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  margin-top: 10px;
}

.profile-stats {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat .label {
  color: #666;
  font-size: 12px;
  margin-bottom: 5px;
}

.stat .value {
  font-size: 20px;
  font-weight: bold;
}

.profile-email, .verification-status {
  padding: 10px;
  margin-bottom: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

button {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
}

button:hover {
  background: #2980b9;
}
</style>
