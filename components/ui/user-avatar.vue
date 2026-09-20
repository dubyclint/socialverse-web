<!-- FILE: /components/ui/user-avatar.vue -->
<template>
  <component
    :is="linkTarget ? 'NuxtLink' : 'span'"
    :to="linkTarget"
    class="user-avatar"
    :style="sizeStyle"
    :title="name || undefined"
    :aria-label="name ? `View ${name}'s profile` : undefined"
  >
    <img v-if="src" :src="src" :alt="name || 'User avatar'" class="avatar-image" />
    <span v-else class="avatar-fallback">{{ initials }}</span>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '~/stores/user'

const props = withDefaults(defineProps<{
  userId?: string | null
  src?: string | null
  name?: string | null
  size?: number
  /** Set to false for avatars that should not navigate (e.g. inside a link). */
  clickable?: boolean
}>(), {
  userId: null,
  src: null,
  name: null,
  size: 40,
  clickable: true
})

const userStore = useUserStore()

/** Own avatar goes to /profile, everyone else to their public profile. */
const linkTarget = computed<string | undefined>(() => {
  if (!props.clickable || !props.userId) return undefined
  return props.userId === userStore.userId ? '/profile' : `/profile/${props.userId}`
})

const initials = computed(() => {
  const source = (props.name ?? '').trim()
  if (!source) return '?'
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
})

const sizeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.max(11, Math.round(props.size / 2.6))}px`
}))
</script>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-dark-grey, #1F2937);
  color: var(--text-primary, #F0FFFB);
  font-weight: 600;
  text-decoration: none;
}

a.user-avatar {
  cursor: pointer;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
