<template>
  <SponsoredAd
    v-if="ad"
    :ad="ad"
    :placement="placement"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SponsoredAd from '~/components/ads/sponsored-ad.vue'
import type { AdPlacement, AdView } from '~/utils/ad-options'

const props = defineProps<{ placement: Exclude<AdPlacement, 'feed'>, contextText?: string | null }>()
const ad = ref<AdView | null>(null)

const SENSITIVE = /\b(death|died|funeral|rip|rest in peace|accident|killed|murder|rape|abuse|suicide|kidnap|terror|bomb|war|violence|blood|porn|nude|nsfw|sex|drugs|overdose|shooting|tragedy|condolence|mourning)\b/i

onMounted(async () => {
  if (props.contextText && SENSITIVE.test(props.contextText)) return
  try {
    const res = await $fetch<{ ad: AdView | null }>('/api/ads/placement', { query: { placement: props.placement } })
    ad.value = res.ad
  } catch {
    ad.value = null
  }
})
</script>
