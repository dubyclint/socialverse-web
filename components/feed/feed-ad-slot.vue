<template>
  <article class="feed-ad">
    <span class="sponsored">Sponsored</span>

    <a
      v-if="item.type === 'ad'"
      :href="item.ad.destinationUrl || '#'"
      target="_blank"
      rel="noopener nofollow"
      class="ad-body"
      @click="trackClick(item.ad.id)"
    >
      <img v-if="item.ad.creativeUrl" :src="item.ad.creativeUrl" :alt="item.ad.title" class="ad-creative" />
      <h4 class="ad-title">{{ item.ad.title }}</h4>
    </a>

    <ins
      v-else-if="item.type === 'external_ad'"
      class="adsbygoogle external-slot"
      :data-ad-client="item.clientId"
      :data-ad-slot="item.slotId"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  </article>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type { FeedItem } from '~/composables/useSocialFeed'

const props = defineProps<{ item: Exclude<FeedItem, { type: 'post' }> }>()

const trackClick = async (campaignId: string) => {
  try {
    await $fetch('/api/ads/track', {
      method: 'POST',
      body: { campaignId, interactionType: 'CLICK' }
    })
  } catch (error) {
    console.error('[Feed] Ad click tracking failed', error)
  }
}

/** AdSense needs its loader script once per page plus a push per placement. */
const mountAdsense = (clientId: string) => {
  const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`
  if (!document.querySelector(`script[src="${src}"]`)) {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.crossOrigin = 'anonymous'
    document.head.appendChild(script)
  }

  const globals = window as unknown as { adsbygoogle?: unknown[] }
  globals.adsbygoogle = globals.adsbygoogle || []
  globals.adsbygoogle.push({})
}

onMounted(async () => {
  if (props.item.type === 'external_ad') {
    if (props.item.provider === 'adsense' && props.item.clientId) {
      mountAdsense(props.item.clientId)
    }
    return
  }

  try {
    await $fetch('/api/ads/track', {
      method: 'POST',
      body: { campaignId: props.item.ad.id, interactionType: 'IMPRESSION' }
    })
  } catch (error) {
    console.error('[Feed] Ad impression tracking failed', error)
  }
})
</script>

<style scoped>
.feed-ad {
  border: 1px solid var(--border-color, #1e293b);
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.sponsored {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.ad-body {
  display: block;
  margin-top: 0.5rem;
}

.ad-creative {
  width: 100%;
  border-radius: 0.5rem;
  object-fit: cover;
  max-height: 320px;
}

.ad-title {
  margin: 0.5rem 0 0;
  font-size: 1rem;
  font-weight: 600;
}

.external-slot {
  display: block;
  min-height: 90px;
}
</style>
