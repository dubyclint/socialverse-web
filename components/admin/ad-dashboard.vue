<template>
  <div>
    <h3>Ad Controls</h3>

    <div v-for="type in adTypes" :key="type">
      <label>
        <input type="checkbox" v-model="page.allowed[type]" />
        {{ type }}
      </label>
    </div>

    <label>
      <input type="checkbox" v-model="page.autoBoostEnabled" />
      Auto-boost winning format
    </label>

    <button @click="save">Save Settings</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const adTypes = ['image', 'video', 'text', 'audio', 'external']
const page = ref({ name: 'Home Feed', allowed: {}, autoBoostEnabled: false })

onMounted(async () => {
  const res = await fetch('/api/ads/page-rules?name=Home Feed')
  page.value = await res.json()
})

async function save() {
  await fetch('/api/ads/page-rules', {
    method: 'POST',
    body: JSON.stringify(page.value),
    headers: { 'Content-Type': 'application/json' }
  })
}
</script>
