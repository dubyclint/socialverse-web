<template>
  <div>
    <!-- Lazy load heavy components -->
    <Suspense>
      <template #default>
        <DynamicTradeListings v-if="showTrades" @close="showTrades = false" />
      </template>
      <template #fallback>
        <div class="loading-skeleton">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      </template>
    </Suspense>

    <Suspense>
      <template #default>
        <DynamicMatchResults v-if="showMatches" @close="showMatches = false" />
      </template>
      <template #fallback>
        <div class="loading-skeleton">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showTrades = ref(false)
const showMatches = ref(false)
</script>

<style scoped>
.loading-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.skeleton-line {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>

