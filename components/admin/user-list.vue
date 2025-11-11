<!-- components/admin/user-list.vue - FIXED -->
<template>
  <div class="admin/user-list">
    <h3>Users</h3>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <ul v-else>
      <li v-for="user in users" :key="user.id">
        {{ user.name }} - Verified: {{ user.is_verified ? '✔️' : '❌' }}
        <button @click="toggleVerify(user.id, !user.is_verified)">
          {{ user.is_verified ? 'Unverify' : 'Verify' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const users = ref([])
const loading = ref(false)
const error = ref(null)
const api = useApi()

onMounted(async () => {
  loading.value = true
  try {
    const result = await api.admin.getStats()
    if (result.success) {
      users.value = result.data.users || []
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

async function toggleVerify(userId, verified) {
  try {
    const result = await api.admin.verifyUser(userId)
    if (result.success) {
      const user = users.value.find(u => u.id === userId)
      if (user) {
        user.is_verified = verified
      }
    }
  } catch (err) {
    error.value = err.message
  }
}
</script>

<style scoped>
.admin-user-list {
  border: 1px solid #ccc;
  padding: 1rem;
}

.loading, .error {
  padding: 1rem;
  text-align: center;
}

.error {
  color: red;
}
</style>
