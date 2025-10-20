<template>
  <div class="universe-chat">
    <h3>Global Chat (Universe)</h3>
    <div class="filters">
      <select v-model="country">
        <option value="">All Countries</option>
        <option value="Nigeria">Nigeria</option>
        <option value="USA">USA</option>
        <!-- Add more countries -->
      </select>
      <input v-model="interest" placeholder="Interest tag" />
      <button @click="loadMessages">Filter</button>
    </div>
    <div class="messages">
      <div v-for="msg in messages" :key="msg._id" class="message">
        <strong>{{ msg.senderId }}</strong>: {{ msg.message }}
      </div>
    </div>
    <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type your message..." />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const country = ref('')
const interest = ref('')
const messages = ref([])
const newMessage = ref('')

async function loadMessages() {
  const res = await fetch(`http://localhost:3000/api/universe/messages?country=${country.value}&interestTags=${interest.value}`)
  messages.value = await res.json()
}

async function sendMessage() {
  await fetch('http://localhost:3000/api/universe/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderId: 'user123',
      country: country.value,
      interestTags: [interest.value],
      message: newMessage.value
    })
  })
  newMessage.value = ''
  loadMessages()
}
</script>

<style scoped>
.universe-chat {
  border: 1px solid #ddd;
  padding: 1rem;
}
.message {
  margin-bottom: 0.5rem;
}
.filters {
  margin-bottom: 1rem;
}
</style>
