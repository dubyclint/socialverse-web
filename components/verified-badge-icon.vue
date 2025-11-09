<template>
  <span v-if="verified" class="badge-icon">🛡️</span>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useVerifiedStore } from '@/stores/verified'

const props = defineProps({ userId: String })
const verified = ref(false)

const store = useVerifiedStore()

onMounted(async () => {
  const status = await store.fetchStatus(props.userId)
  verified.value = status === 'approved'
})
</script>

<style scoped>
.badge-icon {
  margin-left: 0.3rem;
  vertical-align: middle;
  color: #2c7be5;
}
</style>
