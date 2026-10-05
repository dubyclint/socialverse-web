<template>
  <button
    type="button"
    class="follow-btn"
    :class="[{ following, compact }]"
    :disabled="busy"
    :aria-pressed="following"
    @click.stop.prevent="toggle"
  >
    {{ following ? (hovering ? 'Unfollow' : 'Following') : (followsYou ? 'Follow back' : 'Follow') }}
  </button>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useFollowState } from '~/composables/use-follow-state'

const props = withDefaults(defineProps<{
  userId: string
  initialFollowing?: boolean | null
  followsYou?: boolean
  compact?: boolean
}>(), {
  initialFollowing: null,
  followsYou: false,
  compact: false
})

const emit = defineEmits<{ changed: [following: boolean, followersCount: number | null] }>()

const { followed, pending, ensureLoaded, seed, setFollowing } = useFollowState()
const hovering = ref(false)
const following = computed(() => Boolean(followed.value[props.userId]))
const busy = computed(() => Boolean(pending.value[props.userId]))

onMounted(() => {
  if (props.initialFollowing !== null) seed(props.userId, props.initialFollowing)
  else ensureLoaded()
})

const toggle = async () => {
  const next = !following.value
  try {
    const count = await setFollowing(props.userId, next)
    emit('changed', next, count)
  } catch (error) {
    const message = (error as { data?: { statusMessage?: string } })?.data?.statusMessage
    alert(message || 'Could not update follow. Try again.')
  }
}
</script>

<style scoped>
.follow-btn {
  border: 1px solid #3b82f6;
  background: #3b82f6;
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  white-space: nowrap;
}
.follow-btn.compact { font-size: 0.75rem; padding: 0.2rem 0.65rem; }
.follow-btn.following { background: transparent; color: #cbd5e1; border-color: #475569; }
.follow-btn.following:hover { color: #fca5a5; border-color: #ef4444; }
.follow-btn:disabled { opacity: 0.6; cursor: wait; }
</style>
