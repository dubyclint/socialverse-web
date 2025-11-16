<template>
  <div>
    <h2>Trusted User Evaluation</h2>

    <label>
      Filter:
      <select v-model="filter">
        <option value="">All</option>
        <option value="trusted">Trusted Only</option>
        <option value="untrusted">Untrusted Only</option>
      </select>
    </label>

    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Country</th>
          <th>Verified</th>
          <th>Premium</th>
          <th>Trust Score</th>
          <th>Criteria Met</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.id">
          <td>{{ user.username }}</td>
          <td>{{ user.country }}</td>
          <td>{{ user.isVerified ? '✔' : '✘' }}</td>
          <td>{{ user.isPremium ? '✔' : '✘' }}</td>
          <td>{{ (user.trustScore * 100).toFixed(0) }}%</td>
          <td>
            <ul>
              <li v-for="c in user.criteriaMet" :key="c">{{ c }}</li>
            </ul>
          </td>
          <td>{{ user.isTrusted ? 'Auto-Approved' : 'Needs Review' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['route-guard', 'language-check', 'security-middleware'],
  layout: 'default'
})
 
import { ref, onMounted, computed } from 'vue'

const users = ref([])
const filter = ref('')

onMounted(async () => {
  const res = await fetch('/api/admin/trustScores')
  users.value = await res.json()
})

const filteredUsers = computed(() => {
  if (filter.value === 'trusted') return users.value.filter(u => u.isTrusted)
  if (filter.value === 'untrusted') return users.value.filter(u => !u.isTrusted)
  return users.value
})
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
th, td {
  border: 1px solid #ccc;
  padding: 0.5rem;
  text-align: left;
}
ul {
  margin: 0;
  padding-left: 1rem;
}
</style>
