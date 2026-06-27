<template>
  <div></div>
</template>

<script setup>
const props = defineProps({ 
  adId: String, 
  action: String 
})

async function trackConversion() {
  await fetch('/api/ads/conversion', {
    method: 'POST',
    body: JSON.stringify({ 
      adId: props.adId, 
      action: props.action 
    }),
    headers: { 'Content-Type': 'application/json' }
  })
}

trackConversion()
</script>

<style scoped>
/* Empty styles - this component is used for tracking only */
</style>

