<template>
  <div>
    <h2>Live Support Chat</h2>
    <div v-if="session">
      <div v-for="msg in session.messages" :key="String(msg.timestamp)">
        <strong>{{ msg.sender }}:</strong> {{ msg.content }}
      </div>
      <input v-model="message" @keyup.enter="sendMessage" placeholder="Type your message..." />
      <button @click="endSession">End Chat</button>
      <button @click="escalateSession">Escalate</button>
    </div>
    <div v-else>
      <button @click="startSession">Start Chat</button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth','profile-completion', 'language-check', 'security-middleware'],
  layout: 'default'
})
  
import { ref } from 'vue'

interface SupportMessage {
  sender: string
  content: string
  timestamp: Date | string
}

interface SupportSession {
  sessionId: string
  status: string
  messages: SupportMessage[]
}

const session = ref<SupportSession | null>(null)
const message = ref('')
const userId = 'user123'

async function startSession() {
  const agents = await fetch('/api/support/agentStatus?queue=true').then(res => res.json())
  const agent = agents[0]

  const res = await fetch('/api/support/chat', {
    method: 'POST',
    body: JSON.stringify({ action: 'start', userId, agentId: agent.agentId }),
    headers: { 'Content-Type': 'application/json' }
  })
  session.value = await res.json() as SupportSession
}

async function sendMessage() {
  if (!session.value) return
  await fetch('/api/support/chat', {
    method: 'POST',
    body: JSON.stringify({
      action: 'message',
      sessionId: session.value.sessionId,
      sender: 'user',
      content: message.value
    }),
    headers: { 'Content-Type': 'application/json' }
  })
  session.value.messages.push({
    sender: 'user',
    content: message.value,
    timestamp: new Date()
  })
  message.value = ''
}

async function endSession() {
  if (!session.value) return
  await fetch('/api/support/chat', {
    method: 'POST',
    body: JSON.stringify({ action: 'end', sessionId: session.value.sessionId }),
    headers: { 'Content-Type': 'application/json' }
  })
  session.value.status = 'closed'
}

async function escalateSession() {
  if (!session.value) return
  await fetch('/api/support/chat', {
    method: 'POST',
    body: JSON.stringify({ action: 'escalate', sessionId: session.value.sessionId }),
    headers: { 'Content-Type': 'application/json' }
  })
  session.value.status = 'escalated'
}
</script>
