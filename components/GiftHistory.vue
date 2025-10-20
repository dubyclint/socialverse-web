<template>
  <div class="gift-history">
    <h3>Gift History</h3>
    <ul>
      <li v-for="gift in gifts" :key="gift._id">
        Sent {{ gift.amount }} to {{ gift.recipientId }} on {{ formatDate(gift.timestamp) }}
        <span v-if="gift.commentId"> (Comment gift)</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const gifts = ref([])

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/pewgift/history?userId=user123')
  gifts.value = await res.json()
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString()
}
</script>

<style scoped>
.gift-history {
  border: 1px solid #ccc;
  padding: 1rem;
}
</style>
