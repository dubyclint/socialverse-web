<template>
  <div class="user-inbox">
    <div class="tabs">
      <button @click="activeTab = 'received'" :class="{ active: activeTab === 'received' }">Received</button>
      <button @click="activeTab = 'sent'" :class="{ active: activeTab === 'sent' }">Sent</button>
    </div>

    <div v-if="activeTab === 'received'" class="messages">
      <h3>Received Messages</h3>
      <ul>
        <li v-for="msg in received" :key="msg.id">
          <img :src="msg.avatar" class="avatar" v-if="msg.avatar" />
          <strong>{{ msg.from }}:</strong> {{ msg.text }}
          <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
          <span v-if="msg.read">✓ Read</span>
        </li>
      </ul>
    </div>

    <div v-if="activeTab === 'sent'" class="messages">
      <h3>Sent Messages</h3>
      <ul>
        <li v-for="msg in sent" :key="msg.id">
          <strong>To {{ msg.to }}:</strong> {{ msg.text }}
          <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
        </li>
      </ul>
    </div>

    <form @submit.prevent="sendMessage" class="send-form">
      <input v-model="recipient" placeholder="Recipient username" required />
      <textarea v-model="message" placeholder="Type your message..." required></textarea>
      <button type="submit">Send</button>
    </form>
  </div>
</template>

<script setup>
import { gun, sea } from '~/gundb/client'
import { useAuth } from '#imports'
import { ref, onMounted } from 'vue'

const { data: session } = useAuth()
const currentUser = session.value?.user?.id || 'anonymous'

const activeTab = ref('received')
const received = ref([])
const sent = ref([])
const recipient = ref('')
const message = ref('')

function formatTime(ts) {
  return new Date(ts).toLocaleString()
}

async function sendMessage() {
  const msg = {
    from: currentUser,
    to: recipient.value,
    text: await sea.encrypt(message.value, await sea.secret(recipient.value, session.value.user)),
    timestamp: Date.now(),
    read: false
  }

  gun.get(`inbox/${recipient.value}`).set(msg)
  gun.get(`sent/${currentUser}`).set(msg)

  sent.value.unshift({ ...msg, text: message.value })
  message.value = ''
  recipient.value = ''
}

onMounted(() => {
  gun.get(`inbox/${currentUser}`).map().on(async (data, key) => {
    if (!received.value.find(m => m.timestamp === data.timestamp)) {
      const decrypted = await sea.decrypt(data.text, await sea.secret(currentUser, session.value.user))
      const profile = await gun.get(`users/${data.from}`).then()
      received.value.unshift({
        id: key,
        ...data,
        text: decrypted,
        avatar: profile?.avatarUrl || null
      })

      gun.get(`inbox/${currentUser}/${key}`).put({ read: true })
    }
  })

  gun.get(`sent/${currentUser}`).map().on(async (data, key) => {
    if (!sent.value.find(m => m.timestamp === data.timestamp)) {
      const decrypted = await sea.decrypt(data.text, await sea.secret(currentUser, session.value.user))
      sent.value.unshift({ id: key, ...data, text: decrypted })
    }
  })
})
</script>

<style scoped>
.user-inbox {
  padding: 1rem;
}
.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.tabs button {
  padding: 0.5rem 1rem;
  border: none;
  background: #eee;
  cursor: pointer;
}
.tabs button.active {
  background: #ccc;
}
.messages ul {
  list-style: none;
  padding: 0;
}
.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 0.5rem;
}
.timestamp {
  font-size: 0.8rem;
  color: #888;
  margin-left: 0.5rem;
}
.send-form {
  margin-top: 1rem;
}
.send-form input,
.send-form textarea {
  display: block;
  width: 100%;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
}
</style>
