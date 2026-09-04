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

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'profile-completion', 'route-guard'],
  layout: 'default'
})
 
import { ref, onMounted } from 'vue'

interface ChatSession {
  sessionId: string
  userId: string
  agentId?: string | null
  status: string
}

const sessions = ref<ChatSession[]>([])

async function fetchSessions() {
  const res = await fetch('/api/support/chat?admin=true')
  sessions.value = (await res.json()) as ChatSession[]
}

function viewSession(s: ChatSession) {
  console.log('Viewing session:', s)
}

onMounted(fetchSessions)
</script>
