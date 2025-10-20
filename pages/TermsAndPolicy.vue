<template>
  <div>
    <h2>Terms & Conditions</h2>
    <div v-for="term in terms" :key="term.feature" class="term-block">
      <h3>{{ formatFeature(term.feature) }}</h3>
      <p v-html="term.content"></p>
      <small>Last updated: {{ formatDate(term.lastUpdated) }}</small>
    </div>

    <div v-if="isAdmin">
      <h3>Edit Terms</h3>
      <form @submit.prevent="saveTerm">
        <label>Feature</label>
        <select v-model="edit.feature">
          <option v-for="f in featureList" :key="f" :value="f">{{ formatFeature(f) }}</option>
        </select>

        <label>Content</label>
        <textarea v-model="edit.content" rows="6" />

        <button type="submit">Save</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const terms = ref([])
const edit = ref({ feature: '', content: '' })
const featureList = ['p2p', 'gifting', 'monetization', 'match', 'rankHide', 'ads', 'chat', 'wallet']
const isAdmin = true // Replace with actual role check

function formatFeature(f) {
  return f.charAt(0).toUpperCase() + f.slice(1)
}

function formatDate(d) {
  return new Date(d).toLocaleDateString()
}

async function fetchTerms() {
  const res = await fetch('/api/admin/terms')
  terms.value = await res.json()
}

async function saveTerm() {
  await fetch('/api/admin/terms', {
    method: 'POST',
    body: JSON.stringify({ ...edit.value, adminId: 'admin123' }),
    headers: { 'Content-Type': 'application/json' }
  })
  fetchTerms()
}

onMounted(fetchTerms)
</script>

<style scoped>
.term-block {
  margin-bottom: 2rem;
  padding: 1rem;
  border-bottom: 1px solid #ccc;
}
textarea {
  width: 100%;
}
</style>
