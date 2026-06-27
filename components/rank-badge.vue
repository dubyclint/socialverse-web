<template>
  <span v-if="!hidden" class="rank-badge">{{ rank }}</span>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRankStore } from '@/stores/rank'

const props = defineProps({ userId: String })
const rank = ref('')
const hidden = ref(false)

const store = useRankStore()

onMounted(async () => {
  const data = await store.fetchRank(props.userId)
  rank.value = data.rank
  hidden.value = data.hidden
})
</script>

<style scoped>
.rank-badge {
  margin-left: 0.4rem;
  background: #f0f0f0;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #555;
}
</style>
