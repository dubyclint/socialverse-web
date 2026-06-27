<template>
  <div class="badge-admin">
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Document</th>
          <th>Social Proof</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="req in requests" :key="req.id">
          <td>{{ req.name }}</td>
          <td><a :href="req.docUrl" target="_blank">View</a></td>
          <td><a :href="req.socialLink" target="_blank">Link</a></td>
          <td>
            <button @click="approve(req.id)">✅ Approve</button>
            <button @click="reject(req.id)">❌ Reject</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const requests = ref([])

onMounted(async () => {
  const res = await fetch('/api/verified/status?pending=true')
  requests.value = await res.json()
})

async function approve(id) {
  await fetch('/api/verified/approve', {
    method: 'POST',
    body: JSON.stringify({ id, approve: true }),
    headers: { 'Content-Type': 'application/json' }
  })
  requests.value = requests.value.filter(r => r.id !== id)
}

async function reject(id) {
  await fetch('/api/verified/approve', {
    method: 'POST',
    body: JSON.stringify({ id, approve: false }),
    headers: { 'Content-Type': 'application/json' }
  })
  requests.value = requests.value.filter(r => r.id !== id)
}
</script>

<style scoped>
.badge-admin {
  margin-top: 1rem;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
}
button {
  margin-right: 0.5rem;
}
</style>
