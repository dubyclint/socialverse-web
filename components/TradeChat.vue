<template>
  <div class="trade-chat">
    <h3>Trade Chat</h3>
    <div class="messages">
      <div v-for="msg in messages" :key="msg.id" class="message">
        <strong>{{ msg.sender }}:</strong> {{ msg.text }}
      </div>
    </div>
    <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type a message..." />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Gun from 'gun/gun'
import 'gun/sea'

const gun = Gun(['https://gun-messaging-peer.herokuapp.com/gun'])
const messages = ref([])
const newMessage = ref('')
const tradeId = 'trade123' // Replace dynamically
const user = 'Paul' // Replace dynamically

onMounted(() => {
  gun.get(tradeId).map().on((msg, id) => {
    messages.value.push({ id, ...msg })
  })
})

function sendMessage() {
  gun.get(tradeId).set({
    sender: user,
    text: newMessage.value,
    timestamp: Date.now()
  })
  newMessage.value = ''
}
</script>

<style scoped>
.trade-chat {
  border: 1px solid #aaa;
  padding: 1rem;
}
.message {
  margin-bottom: 0.5rem;
}
</style>
