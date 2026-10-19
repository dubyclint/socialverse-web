<template>
  <img
    :src="SRC[type]"
    :alt="`verified ${type}`"
    :title="TITLES[type]"
    :class="['verified-badge', className]"
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
 * (the check disc is ~75% of the text height); `size` is the minimum in px.
 */
const props = withDefaults(defineProps<{
  type?: BadgeType | string | null
  size?: number
  className?: string
}>(), { type: 'personal', size: 18, className: '' })

const SRC: Record<BadgeType, string> = { personal: personalBadge, business: businessBadge, government: governmentBadge }
const TITLES: Record<BadgeType, string> = { personal: 'Verified individual', business: 'Verified business', government: 'Verified government' }

const type = computed<BadgeType>(() => (props.type === 'business' || props.type === 'government' ? props.type : 'personal'))
const minPx = computed(() => Math.max(18, props.size + 4))
</script>

<style scoped>
.verified-badge {
  display: inline-block;
  width: max(var(--badge-min), 1.35em);
  height: max(var(--badge-min), 1.35em);
  margin: -0.25em 0 -0.25em 5px;
  object-fit: contain;
  background: transparent;
  vertical-align: middle;
  transform: translateY(-1px);
  flex-shrink: 0;
  user-select: none;
  -webkit-user-select: none;
}
</style>
