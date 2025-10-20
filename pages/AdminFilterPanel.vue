<template>
  <div>
    <h3>Pending Filter Requests</h3>
    <div v-for="req in requests" :key="req.userId" class="request">
      <p>User: {{ req.userId }}</p>
      <ul>
        <li v-for="(val, key) in req.filters" :key="key">
          <label>
            <input type="checkbox" v-model="selected[req.userId][key]" />
            {{ key }}: {{ val }}
          </label>
        </li>
      </ul>
      <input v-model="reasons[req.userId]" placeholder="Rejection reason (max 40 chars)" />
      <button @click="approve(req.userId)">Approve Selected</button>
      <button @click="reject(req.userId)">Reject All</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const requests = ref([])
const selected = ref({})
const reasons = ref({})

onMounted(async () => {
  const res = await fetch('/api/admin/filterRequests')
  requests.value = await res.json()
  for (const req of requests.value) {
    selected.value[req.userId] = {}
    for (const key in req.filters) {
      selected.value[req.userId][key] = true
    }
    reasons.value[req.userId] = ''
  }
})

async function approve(userId) {
  const approved = Object.entries(selected.value[userId])
    .filter(([_, val]) => val)
    .map(([key]) => key)

  await fetch('/api/admin/approveFilters', {
    method: 'POST',
    body: JSON.stringify({ userId, approvedFilters: approved }),
    headers: { 'Content-Type': 'application/json' }
  })
}

async function reject(userId) {
  await fetch('/api/admin/rejectFilters', {
    method: 'POST',
    body: JSON.stringify({ userId, reason: reasons.value[userId] }),
    headers: { 'Content-Type': 'application/json' }
  })
}
</script>
