<template>
  <div>
    <h2>Active Chat Sessions</h2>
    <ul>
      <li v-for="s in sessions" :key="s.sessionId">
        {{ s.userId }} → {{ s.agentId || 'Unassigned' }} [{{ s.status }}]
        <button @click="viewSession(s)">View</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const sessions = ref([])

async function fetchSessions() {
  const res = await fetch('/api/support/chat?admin=true')
  sessions.value = await res.json()
}

function viewSession(s) {
  console.log('Viewing session:', s)
}

onMounted(fetchSessions)
</script>
