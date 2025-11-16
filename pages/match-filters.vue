<template>
  <div>
    <h3>Submit Match Filters</h3>
    <form @submit.prevent="submitFilters">
      <!-- Filter inputs same as before -->
      <button type="submit">Submit for Approval</button>
    </form>

    <div v-if="status !== 'none'">
      <h4>Status: {{ status }}</h4>
      <p v-if="status === 'approved'">Approved Filters: {{ approvedFilters.join(', ') }}</p>
      <p v-if="status === 'rejected'">Rejected: {{ rejectionReason }}</p>
      <p v-if="status === 'pending'">Awaiting admin review…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})
 
import { ref, onMounted } from 'vue'

const filters = ref({
  region: '',
  country: '',
  currency: '',
  category: '',
  rank: '',
  verifiedOnly: false,
  excludeSeen: true
})

const status = ref('none')
const approvedFilters = ref([])
const rejectionReason = ref('')

async function submitFilters() {
  await fetch('/api/match/userFilters', {
    method: 'POST',
    body: JSON.stringify(filters.value),
    headers: { 'Content-Type': 'application/json' }
  })
  checkStatus()
}

async function checkStatus() {
  const res = await fetch('/api/match/filterStatus')
  const data = await res.json()
  status.value = data.status
  approvedFilters.value = data.approvedFilters
  rejectionReason.value = data.rejectionReason
}

onMounted(checkStatus)
</script>
