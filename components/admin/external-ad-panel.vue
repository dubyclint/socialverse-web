<template>
  <div>
    <h3>External Ad Platforms</h3>

    <select v-model="platform">
      <option value="Google AdSense">Google AdSense</option>
      <option value="Meta Ads Manager">Meta Ads Manager</option>
      <option value="Custom Server">Custom Server</option>
    </select>

    <textarea v-model="config" placeholder="Paste API config or script here" rows="6" />

    <button @click="save">Save Integration</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const platform = ref('')
const config = ref('')

async function save() {
  await fetch('/api/ads/external', {
    method: 'POST',
    body: JSON.stringify({ platform: platform.value, config: config.value }),
    headers: { 'Content-Type': 'application/json' }
  })
}
</script>
