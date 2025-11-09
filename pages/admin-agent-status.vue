<template>
  <div>
    <h2>Agent Availability</h2>
    <ul>
      <li v-for="a in agents" :key="a.agentId">
        {{ a.agentId }} → {{ a.online ? 'Online' : 'Offline' }} ({{ a.currentSessions }}/{{ a.maxSessions }})
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const agents = ref([])

async function fetchAgents() {
  const res = await fetch('/api/support/agentStatus')
  agents.value = await res.json()
}

onMounted(fetchAgents)
</script>
