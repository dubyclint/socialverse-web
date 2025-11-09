<template>
  <div>
    <h2>Premium Feature Toggle</h2>
    <form @submit.prevent="saveRule">
      <label>Target</label>
      <select v-model="rule.target">
        <option value="country">Country</option>
        <option value="region">Region</option>
        <option value="geo">Geo Coordinates</option>
        <option value="all">All Users</option>
      </select>

      <label>Value</label>
      <input v-model="rule.value" placeholder="e.g. Nigeria or 6.45,3.39" />

      <label><input type="checkbox" v-model="rule.features.p2p" /> P2P Access</label>
      <label><input type="checkbox" v-model="rule.features.matching" /> Matching Access</label>
      <label><input type="checkbox" v-model="rule.features.rankHide" /> Rank Hide Access</label>

      <label><input type="checkbox" v-model="rule.active" /> Active</label>

      <button type="submit">Save Rule</button>
    </form>

    <h3>Existing Rules</h3>
    <ul>
      <li v-for="r in rules" :key="r._id">
        {{ r.target }}: {{ r.value }} → {{ r.features }}
        <button @click="deleteRule(r)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const rule = ref({
  target: 'country',
  value: '',
  features: { p2p: false, matching: false, rankHide: false },
  active: true
})

const rules = ref([])

async function fetchRules() {
  const res = await fetch('/api/admin/premiumRules')
  rules.value = await res.json()
}

async function saveRule() {
  await fetch('/api/admin/premiumRules', {
    method: 'POST',
    body: JSON.stringify(rule.value),
    headers: { 'Content-Type': 'application/json' }
  })
  fetchRules()
}

async function deleteRule(r) {
  await fetch('/api/admin/premiumRules', {
    method: 'DELETE',
    body: JSON.stringify({ target: r.target, value: r.value }),
    headers: { 'Content-Type': 'application/json' }
  })
  fetchRules()
}

onMounted(fetchRules)
</script>
