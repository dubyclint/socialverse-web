<template>
  <div v-if="!hidden" class="rank-progress">
    <div class="label">{{ rank }} → {{ next?.rank || 'Max' }}</div>
    <progress :value="points" :max="next?.points || points"></progress>
  </div>
</template>

<script setup>
import { useRankStore } from '@/stores/rank'
const props = defineProps({ userId: String })
const { rank, next, points, hidden } = useRankStore().getProgress(props.userId)
</script>

<style scoped>
.rank-progress {
  margin-top: 0.5rem;
}
.label {
  font-size: 0.8rem;
  margin-bottom: 0.2rem;
}
progress {
  width: 100%;
  height: 8px;
}
</style>
