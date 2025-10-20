<template>
  <div class="pal-list">
    <h3>My Pals</h3>
    <ul>
      <li v-for="pal in pals" :key="pal._id">
        {{ pal.name }}
        <span v-if="pal.isVerified">✔️</span>
        <span class="rank-icon">{{ pal.rankIcon }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const pals = ref([])

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/pal/list?userId=user123')
  pals.value = await res.json()
})
</script>

<style scoped>
.pal-list {
  border: 1px solid #aaa;
  padding: 1rem;
}
.rank-icon {
  margin-left: 10px;
}
</style>
