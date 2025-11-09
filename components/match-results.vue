<template>
  <div class="match-results">
    <h3>Your Matches</h3>
    <ul>
      <li v-for="match in matches" :key="match._id">
        {{ match.name }} ({{ match.age }}) - {{ match.reason }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const matches = ref([])

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/match/results?userId=user123')
  matches.value = await res.json()
})
</script>

<style scoped>
.match-results {
  border: 1px solid #aaa;
  padding: 1rem;
}
</style>
