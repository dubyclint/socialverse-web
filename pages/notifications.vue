<template>
  <div>
    <h3>Your Notifications</h3>
    <ul v-if="notifications.length">
      <li v-for="note in notifications" :key="note._id">
        <strong>{{ note.type.toUpperCase() }}:</strong> {{ note.message }}
        <small>{{ formatTime(note.timestamp) }}</small>
      </li>
    </ul>
    <p v-else>No notifications yet.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const notifications = ref([])

onMounted(async () => {
  const res = await fetch('/api/user/notifications')
  notifications.value = await res.json()
})

function formatTime(ts) {
  return new Date(ts).toLocaleString()
}
</script>

<style scoped>
ul {
  list-style: none;
  padding: 0;
}
li {
  margin-bottom: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #ccc;
}
small {
  display: block;
  font-size: 0.8rem;
  color: #666;
}
</style>

