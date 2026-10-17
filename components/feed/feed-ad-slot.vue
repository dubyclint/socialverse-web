<template>
  <div
    v-if="item.type === 'ad'"
    class="feed-ad-native"
  >
    <SponsoredAd
      :ad="item.ad"
      placement="feed"
    />
  </div>
  <article
    v-else
    class="feed-ad"
  >
    <span class="sponsored">Sponsored</span>

    <ins
      v-if="item.type === 'external_ad'"
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
import SponsoredAd from '~/components/ads/sponsored-ad.vue'
import type { FeedItem } from '~/composables/useSocialFeed'

const props = defineProps<{ item: Exclude<FeedItem, { type: 'post' }> }>()

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

onMounted(() => {
  if (props.item.type === 'external_ad') {
    if (props.item.provider === 'adsense' && props.item.clientId) {
      mountAdsense(props.item.clientId)
    }
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
