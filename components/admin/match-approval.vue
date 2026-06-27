<template>
  <div class="admin-match">
    <h3>Match Requests</h3>
    <ul>
      <li v-for="req in requests" :key="req._id">
        {{ req.userId }} wants to match for: {{ req.reason }}
        <input v-model="matchMap[req._id]" placeholder="Matched user ID" />
        <button @click="approve(req._id)">Approve</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const requests = ref([])
const matchMap = ref({})

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/admin/match-requests')
  requests.value = await res.json()
})

async function approve(requestId) {
  await fetch('http://localhost:3000/api/admin/approve-match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId,
      matchedUserId: matchMap.value[requestId]
    })
  })
}
</script>

<style scoped>
.admin-match {
  border: 1px solid #bbb;
  padding: 1rem;
}
</style>
