<template>
  <button
    type="button"
    class="pal-btn"
    :class="[state, { compact }]"
    :disabled="busy"
    @click.stop.prevent="act"
  >
    {{ label }}
  </button>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type PalStatus = 'none' | 'friends' | 'outgoing' | 'incoming'

const props = withDefaults(defineProps<{
  userId: string
  status?: PalStatus
  requestId?: string | null
  compact?: boolean
}>(), { status: 'none', requestId: null, compact: false })

const emit = defineEmits<{ changed: [status: PalStatus] }>()

const state = ref<PalStatus>(props.status)
const requestId = ref<string | null>(props.requestId)
const busy = ref(false)

watch(() => [props.status, props.requestId] as const, ([status, id]) => {
  state.value = status
  requestId.value = id
})

const label = computed(() => ({
  none: 'Add friend',
  outgoing: 'Cancel request',
  incoming: 'Accept friend',
  friends: 'Unfriend'
})[state.value])

const act = async () => {
  if (state.value === 'friends' && !confirm('Remove this PAL?')) return
  busy.value = true
  try {
    if (state.value === 'none') {
      const response = await $fetch<{ status?: string, requestId?: string, id?: string }>(
        '/api/pals/request', { method: 'POST', body: { userId: props.userId } }
      )
      state.value = response.status === 'accepted' ? 'friends' : 'outgoing'
      requestId.value = response.requestId ?? response.id ?? null
    } else if (state.value === 'incoming' && requestId.value) {
      await $fetch('/api/pals/respond', { method: 'POST', body: { requestId: requestId.value, action: 'accept' } })
      state.value = 'friends'
    } else {
      await $fetch('/api/pals/remove', { method: 'POST', body: { userId: props.userId } })
      state.value = 'none'
      requestId.value = null
    }
    emit('changed', state.value)
  } catch (error) {
    const message = (error as { data?: { statusMessage?: string } })?.data?.statusMessage
    alert(message || 'Could not update PAL status. Try again.')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.pal-btn {
  border: 1px solid #475569;
  background: #1e293b;
  color: #e2e8f0;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
}
.pal-btn.compact { font-size: 0.75rem; padding: 0.2rem 0.65rem; }
.pal-btn.incoming { background: #16a34a; border-color: #16a34a; color: #fff; }
.pal-btn.friends:hover, .pal-btn.outgoing:hover { color: #fca5a5; border-color: #ef4444; }
.pal-btn:disabled { opacity: 0.6; cursor: wait; }
</style>
