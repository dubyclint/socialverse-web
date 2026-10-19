<template>
  <img
    :src="SRC[type]"
    :alt="`verified ${type}`"
    :title="TITLES[type]"
    :class="['vbadge', className]"
    :style="{ '--badge-min': `${minPx}px` }"
    loading="lazy"
    decoding="async"
    draggable="false"
  >
</template>

<script setup lang="ts">
import { computed } from 'vue'
import personalBadge from '~/assets/badges/personal_badge.png'
import businessBadge from '~/assets/badges/business_badge.png'
import governmentBadge from '~/assets/badges/government_badge.png'

type BadgeType = 'personal' | 'business' | 'government'

/**
 * Custom Yeller verification badge. Scales with the surrounding name's font-size
 * (the check disc is about the cap height of the name); `size` sets the minimum height in px.
 */
const props = withDefaults(defineProps<{
  type?: BadgeType | string | null
  size?: number
  className?: string
}>(), { type: 'personal', size: 18, className: '' })

const SRC: Record<BadgeType, string> = { personal: personalBadge, business: businessBadge, government: governmentBadge }
const TITLES: Record<BadgeType, string> = { personal: 'Verified individual', business: 'Verified business', government: 'Verified government' }

const type = computed<BadgeType>(() => (props.type === 'business' || props.type === 'government' ? props.type : 'personal'))
const minPx = computed(() => Math.max(20, props.size + 4))
</script>

<style scoped>
/* !important: parent components' generic `img` rules must not resize or pad the badge. */
img.vbadge {
  display: inline-block !important;
  height: max(var(--badge-min), 1.5em) !important;
  width: auto !important;
  max-width: none !important;
  aspect-ratio: 6 / 5;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  margin: -0.3em 0 -0.3em 5px;
  object-fit: contain !important;
  background: transparent !important;
  box-shadow: none !important;
  vertical-align: middle;
  transform: translateY(-1px);
  flex-shrink: 0;
  user-select: none;
  -webkit-user-select: none;
}
</style>
