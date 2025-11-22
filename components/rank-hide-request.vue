<template>
  <div v-if="isPremium">
    <h4>Hide/Unhide Rank</h4>
    <button @click="submitRequest" :disabled="requested">
      Pay 10 USDT & Request {{ action }}
    </button>
    <p v-if="requested">Request submitted. Awaiting admin approval.</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({ userId: String, isPremium: Boolean, action: String }) // 'hide' or 'unhide'
const requested = ref(false)

async function submitRequest() {
  await fetch('/api/rank/hide-request', {
    method: 'POST',
    body: JSON.stringify({ userId: props.userId, action: props.action }),
    headers: { 'Content-Type': 'application/json' }
  })
  requested.value = true
}
</script>
