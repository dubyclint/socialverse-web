<template>
  <section class="trade-chat">
    <h3>Trade chat</h3>
    <p v-if="!roomId" class="empty">Chat opens once a trade is active.</p>
    <template v-else>
      <div class="messages">
        <div v-for="msg in messages" :key="msg.id" class="message">
          <strong>{{ msg.senderName }}:</strong> {{ msg.content }}
          <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
        </div>
        <p v-if="!messages.length" class="empty">No messages yet.</p>
      </div>
      <div class="input-area">
        <input
          v-model="draft"
          class="message-input"
          placeholder="Type a message…"
          @keyup.enter="send"
        />
        <button class="send-btn" :disabled="sending || !draft.trim()" @click="send">Send</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types/chat'

const props = defineProps<{ roomId?: string | null }>()

const messages = ref<ChatMessage[]>([])
const draft = ref('')
const sending = ref(false)
const error = ref<string | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

async function load() {
  if (!props.roomId) return
  try {
    const res = await $fetch<{ data: ChatMessage[] }>(`/api/chat/${props.roomId}/messages`)
    messages.value = res.data
  } catch {
    error.value = 'Could not load messages'
  }
}

async function send() {
  if (!props.roomId || !draft.value.trim()) return
  sending.value = true
  error.value = null
  try {
    await $fetch(`/api/chat/${props.roomId}/messages`, { method: 'POST', body: { message: draft.value } })
    draft.value = ''
    await load()
  } catch {
    error.value = 'Message not sent'
  } finally {
    sending.value = false
  }
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

watch(() => props.roomId, load, { immediate: true })

onMounted(() => {
  timer = setInterval(load, 5000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.trade-chat { border: 1px solid #e2e2e2; border-radius: 8px; padding: 1rem; }
.messages { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.75rem; }
.timestamp { color: #999; font-size: 0.75rem; margin-left: 0.4rem; }
.input-area { display: flex; gap: 0.5rem; }
.message-input { flex: 1; }
.empty { color: #777; }
.error { color: #b00020; }
</style>
