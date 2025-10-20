<template>
  <div class="notification-center">
    <h4>🔔 Escrow Notifications</h4>
    <ul>
      <li v-for="note in notifications" :key="note.id">
        <strong>{{ note.type.toUpperCase() }}</strong> — Deal #{{ note.dealId }} — {{ formatDate(note.timestamp) }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'

const notifications = ref([])
const toast = useToast()

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString()
}

onMounted(() => {
  const socket = io('http://localhost:3000') // adjust if needed
  socket.on('escrow:update', ({ dealId, action }) => {
    const entry = {
      id: Date.now(),
      dealId,
      type: action,
      timestamp: new Date().toISOString()
    }
    notifications.value.unshift(entry)
    toast.info(`🔔 Deal #${dealId} was ${action}`)
  })
})
</script>

<style scoped>
.notification-center {
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 300px;
  background: #fff;
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 1000;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}
</style>
