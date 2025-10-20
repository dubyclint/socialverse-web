<template>
  <div v-if="shouldRender" class="ad-slot">
    <div v-if="ad.type === 'image'">
      <img :src="ad.mediaUrl" :alt="ad.altText" />
    </div>

    <div v-else-if="ad.type === 'video'">
      <video controls :src="ad.mediaUrl" :poster="ad.thumbnail" />
    </div>

    <div v-else-if="ad.type === 'text'">
      <h4>{{ ad.headline }}</h4>
      <p>{{ ad.description }}</p>
      <button @click="clickAd">{{ ad.cta }}</button>
    </div>

    <div v-else-if="ad.type === 'audio'">
      <audio controls :src="ad.mediaUrl" />
    </div>

    <div v-else-if="ad.type === 'external'" v-html="ad.html" />

    <small class="promoted-label">Promoted</small>
  </div>
</template>

<script setup>
import { useAdStore } from '@/stores/ads'
import { onMounted, ref } from 'vue'

const props = defineProps({ page: String })
const store = useAdStore()
const ad = ref(null)
const shouldRender = ref(false)

onMounted(async () => {
  await store.fetchServedAds(props.page)
  const candidates = store.servedAds.filter(a =>
    store.isAdAllowedOnPage(props.page, a.type)
  )
  if (candidates.length > 0) {
    ad.value = candidates[0]
    shouldRender.value = true

    if (ad.value.type !== 'external') {
      store.trackAd(ad.value.id, 'impression')
    }

    await fetch('/api/ads/track', {
      method: 'POST',
      body: JSON.stringify({
        adId: ad.value.id,
        action: 'variant',
        variant: ad.value.type,
        page: props.page
      }),
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

function clickAd() {
  if (ad.value.type !== 'external') {
    store.trackAd(ad.value.id, 'click')
    window.open(ad.value.link, '_blank')
  }
}
</script>
