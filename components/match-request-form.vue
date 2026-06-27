<template>
  <div class="match-form">
    <h3>Request a Match</h3>
    <form @submit.prevent="submitRequest">
      <label>Gender:</label>
      <select v-model="gender">
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>

      <label>Age Range:</label>
      <select v-model="ageRange">
        <option value="18-25">18–25</option>
        <option value="26-35">26–35</option>
        <option value="36+">36+</option>
      </select>

      <label>Reason:</label>
      <input v-model="reason" placeholder="Why do you want to match?" />

      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const gender = ref('male')
const ageRange = ref('18-25')
const reason = ref('')

async function submitRequest() {
  await fetch('http://localhost:3000/api/match/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user123',
      gender: gender.value,
      ageRange: ageRange.value,
      reason: reason.value,
      isPremium: true
    })
  })
}
</script>

<style scoped>
.match-form {
  border: 1px solid #ccc;
  padding: 1rem;
}
</style>
