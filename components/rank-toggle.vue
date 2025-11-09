<template>
  <div v-if="canToggle">
    <button @click="toggleRank">
      {{ hideRank ? 'Unhide Rank' : 'Hide Rank' }}
    </button>
    <p>Valid until: {{ new Date(expires).toLocaleDateString() }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const props = defineProps({ userId: String })
const hideRank = ref(false)
const canToggle = ref(false)
const expires = ref(null)

onMounted(async () => {
  const res = await fetch(`/api/user/${props.userId}`)
  const data = await res.json()
  hideRank.value = data.hideRank
  canToggle.value = data.canToggleRank && Date.now() < new Date(data.rankToggleExpires).getTime()
  expires.value = data.rankToggleExpires
})

async function toggleRank() {
  const res = await fetch('/api/rank/toggle', {
    method: 'POST',
    body: JSON.stringify({ userId: props.userId }),
    headers: { 'Content-Type': 'application/json' }
  })
  const data = await res.json()
  hideRank.value = data.hideRank
}
</script>
