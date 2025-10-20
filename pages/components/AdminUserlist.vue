<template>
  <div class="admin-user-list">
    <h3>Users</h3>
    <ul>
      <li v-for="user in users" :key="user._id">
        {{ user.name }} - Verified: {{ user.isVerified ? '✔️' : '❌' }}
        <button @click="toggleVerify(user._id, !user.isVerified)">
          {{ user.isVerified ? 'Unverify' : 'Verify' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const users = ref([])

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/admin/users')
  users.value = await res.json()
})

async function toggleVerify(userId, verified) {
  await fetch('http://localhost:3000/api/admin/verify-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, verified })
  })
}
</script>

<style scoped>
.admin-user-list {
  border: 1px solid #ccc;
  padding: 1rem;
}
</style>
