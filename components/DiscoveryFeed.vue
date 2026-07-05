// components/DiscoveryFeed.vue
<template>
  <div class="feed-container">
    <div v-for="item in processedFeed" :key="item.id">
      
      <MatchCard v-if="item.type !== 'ad'" :data="item" />
      
      <AdCard v-else :adData="item" />
      
    </div>
  </div>
</template>

<script setup>
const { data: feedItems, pending } = await useFetch('/api/discovery/feed')

// Ad Injection Strategy: Insert an ad after every 5 items
const processedFeed = computed(() => {
  const result = []
  feedItems.value.forEach((item, index) => {
    result.push(item)
    if ((index + 1) % 5 === 0) {
      result.push({ type: 'ad', id: `ad_${index}` })
    }
  })
  return result
})
</script>

