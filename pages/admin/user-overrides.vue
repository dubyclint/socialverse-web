<template>
  <div>
    <h2>User-Specific Overrides</h2>
    <form @submit.prevent="saveOverride">
      <label>User ID</label>
      <input v-model="override.userId" />

      <label>Override Type</label>
      <select v-model="override.overrideType">
        <option value="premium">Premium Access</option>
        <option value="fee">Fee Rate</option>
        <option value="monetization">Monetization</option>
        <option value="tier">Country Tier</option>
        <option value="trust">Trust Logic</option>
      </select>

      <label>Key</label>
      <input v-model="override.key" placeholder="e.g. p2p, makerPercent, tier" />

      <label>Value</label>
      <input v-model="override.value" />

      <label>Reason</label>
      <input v-model="override.reason" />

      <button type="submit">Save Override</button>
    </form>

    <h3>Overrides for User</h3>
    <input v-model="queryUserId" placeholder="Enter User ID" @input="fetchOverrides" />
    <ul>
      <li v-for="o in overrides" :key="o.key">
        {{ o.overrideType }} → {{ o.key }} = {{ o.value }} ({{ o.reason }})
        <button @click="removeOverride(o)">Remove</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['route-guard', 'language-check', 'security-middleware'],
  layout: 'default'
})
 
import { ref } from 'vue'

const override = ref({
  userId: '',
  overrideType: 'premium',
  key: '',
  value: '',
  reason: ''
})

const queryUserId = ref('')
const overrides = ref([])

async function fetchOverrides() {
  if (!queryUserId.value) return
  const res = await fetch(`/api/admin/userOverrides?userId=${queryUserId.value}`)
  overrides.value = await res.json()
}

async function saveOverride() {
  await fetch('/api/admin/userOverrides', {
    method: 'POST',
    body: JSON.stringify(override.value),
    headers: { 'Content-Type': 'application/json' }
  })
  fetchOverrides()
}

async function removeOverride(o) {
  await fetch('/api/admin/userOverrides', {
    method: 'DELETE',
    body: JSON.stringify({ userId: o.userId, key: o.key }),
    headers: { 'Content-Type': 'application/json' }
  })
  fetchOverrides()
}
</script>
