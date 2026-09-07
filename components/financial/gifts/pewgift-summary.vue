<template>
  <div class="pewgift-summary">
    <h3>Gift Summary</h3>
    <p>Total Gifts Received: {{ totalReceived }} PEW</p>
    <p>Total Gifts Sent: {{ totalSent }} PEW</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ApiResponse } from '~/types/api'

const totalReceived = ref(0)
const totalSent = ref(0)

onMounted(async () => {
  try {
    const response = await $fetch<ApiResponse<{ sent: number, received: number }>>(
      '/api/pewgift/summary'
    )
    totalReceived.value = response.data?.received ?? 0
    totalSent.value = response.data?.sent ?? 0
  } catch (error) {
    console.error('Failed to load gift summary:', error)
  }
})
</script>

<style scoped>
.pewgift-summary {
  border: 1px solid #aaa;
  padding: 1rem;
}
</style>
