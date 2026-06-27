<template>
  <div class="pal-request">
    <h3>pal requests</h3>
    <div v-for="request in requests" :key="request._id" class="request">
      <span>{{ request.requesterName }}</span>
      <button @click="accept(request._id)">Accept</button>
      <button @click="reject(request._id)">Reject</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const requests = ref([])

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/pal/requests?userId=user123')
  requests.value = await res.json()
})

async function accept(id) {
  await fetch('http://localhost:3000/api/pal/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: id })
  })
}
async function reject(id) {
  // Optional: implement reject logic
}
</script>

<style scoped>
.pal-request {
  border: 1px solid #ccc;
  padding: 1rem;
}
.request {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
</style>
