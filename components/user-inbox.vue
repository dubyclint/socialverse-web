<template>
  <div class="min-h-screen bg-slate-950 p-6 text-white">
    <!-- Header -->
    <div class="max-w-2xl mx-auto mb-8">
      <h1 class="text-2xl font-black">Messages</h1>
      <div class="flex gap-4 mt-4 border-b border-slate-800">
        <button @click="activeTab = 'received'" :class="tabClasses('received')">Received</button>
        <button @click="activeTab = 'sent'" :class="tabClasses('sent')">Sent</button>
      </div>
    </div>

    <!-- Messages List -->
    <div class="max-w-2xl mx-auto space-y-4">
      <div v-for="msg in displayedMessages" :key="msg.id" class="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div class="flex items-center gap-3 mb-2">
          <img v-if="msg.avatar" :src="msg.avatar" class="w-8 h-8 rounded-full" />
          <div>
            <p class="text-sm font-bold">{{ activeTab === 'received' ? msg.from : `To ${msg.to}` }}</p>
            <p class="text-[10px] text-slate-500">{{ formatTime(msg.timestamp) }}</p>
          </div>
        </div>
        <p class="text-sm text-slate-300">{{ msg.text }}</p>
      </div>
    </div>

    <!-- Send Form -->
    <form @submit.prevent="sendMessage" class="max-w-2xl mx-auto mt-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl">
      <input v-model="recipient" placeholder="Recipient username" class="w-full bg-slate-950 p-3 rounded-lg mb-3 border border-slate-800 outline-none" />
      <textarea v-model="message" placeholder="Type your message..." class="w-full bg-slate-950 p-3 rounded-lg mb-3 border border-slate-800 outline-none h-24"></textarea>
      <button type="submit" class="bg-indigo-600 px-6 py-2 rounded-lg font-bold text-sm">Send</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/user'
import { api } from '~/lib/api'

const userStore = useUserStore()
const activeTab = ref('received')
const received = ref([])
const sent = ref([])
const recipient = ref('')
const message = ref('')

const displayedMessages = computed(() => activeTab.value === 'received' ? received.value : sent.value)

const tabClasses = (tab: string) => ({
  'pb-2 border-b-2 transition': true,
  'border-indigo-500 text-white': activeTab.value === tab,
  'border-transparent text-slate-500': activeTab.value !== tab
})

const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

async function sendMessage() {
  try {
    await api('/messages/send', {
      method: 'POST',
      body: { to: recipient.value, text: message.value }
    })
    message.value = ''
    recipient.value = ''
    // Refresh lists here
  } catch (err) {
    console.error('Failed to send message', err)
  }
}

onMounted(async () => {
  // Use api() to fetch messages instead of raw GunDB calls
  const response = await api('/messages/list')
  received.value = response.received || []
  sent.value = response.sent || []
})
</script>
