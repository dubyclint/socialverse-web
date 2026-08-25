<template>
  <!-- ✅ WRAPPED WITH ClientOnly TO PREVENT HYDRATION MISMATCH -->
  <ClientOnly>
    <div>
      <h3>Notifications</h3>
      <ul>
        <li v-for="note in notifications" :key="note.id">
          <span>{{ note.message_text }}</span>
          <small>{{ formatTime(note.created_at) }}</small>
        </li>
      </ul>
    </div>
  </ClientOnly>
  <!-- ✅ END OF ClientOnly WRAPPER -->
</template>

<script setup>
import { ref, onMounted } from 'vue'

const notifications = ref([])

onMounted(async () => {
  const res = await $fetch('/api/user/notifications')
  notifications.value = res.data ?? []
})

function formatTime(ts) {
  return new Date(ts).toLocaleString()
}
</script>

