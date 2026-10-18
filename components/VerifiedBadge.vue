<template>
  <img
    :src="src"
    :alt="`verified ${type}`"
    :title="TITLES[type]"
    :width="size"
    :height="size"
    :class="['verified-badge', className]"
    :style="{ width: `${size}px`, height: `${size}px`, '--badge-color': COLORS[type] }"
    loading="lazy"
    decoding="async"
    draggable="false"
  >
</template>

<script setup lang="ts">
import { computed } from 'vue'
import personalSmall from '~/assets/badges/personal_128.png'
import businessSmall from '~/assets/badges/business_128.png'
import governmentSmall from '~/assets/badges/government_128.png'
import personalLarge from '~/assets/badges/personal_orbit_verified.png'
import businessLarge from '~/assets/badges/business_orbit_verified.png'
import governmentLarge from '~/assets/badges/government_orbit_verified.png'

type BadgeType = 'personal' | 'business' | 'government'

const props = withDefaults(defineProps<{
  type?: BadgeType | string | null
  size?: 16 | 20 | 24 | 32 | 48 | 128 | number
  className?: string
}>(), { type: 'personal', size: 20, className: '' })

const SMALL: Record<BadgeType, string> = { personal: personalSmall, business: businessSmall, government: governmentSmall }
const LARGE: Record<BadgeType, string> = { personal: personalLarge, business: businessLarge, government: governmentLarge }
const COLORS: Record<BadgeType, string> = { personal: '#6D28D9', business: '#FFC233', government: '#5EE9B5' }
const TITLES: Record<BadgeType, string> = { personal: 'Verified individual', business: 'Verified business', government: 'Verified government' }

const type = computed<BadgeType>(() => (props.type === 'business' || props.type === 'government' ? props.type : 'personal'))
const src = computed(() => (props.size <= 24 ? SMALL : LARGE)[type.value])
</script>

<style scoped>
.verified-badge {
  display: inline-block;
  object-fit: contain;
  background: transparent;
  vertical-align: middle;
  flex-shrink: 0;
  user-select: none;
}
</style>
