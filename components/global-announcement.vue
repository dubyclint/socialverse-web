<template>
  <Transition name="ann">
    <div v-if="visible && item" :class="['announcement', item.level, { inline }]" role="alert">
      <div class="body">
        <strong>{{ item.title }}</strong>
        <p>{{ item.message }}</p>
        <a v-if="item.link_url" :href="item.link_url" :target="item.link_url.startsWith('/') ? undefined : '_blank'" rel="noopener noreferrer">Learn more</a>
      </div>
      <button type="button" class="close" aria-label="Dismiss announcement" @click="dismiss">×</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface Announcement { id: number, title: string, message: string, level: 'info' | 'warning' | 'critical', link_url: string | null }

const props = defineProps<{ inline?: boolean }>()

const KEY = 'viorp:dismissed-announcement'
const item = ref<Announcement | null>(null)
const dismissed = ref<string | null>(null)
const visible = computed(() => item.value && dismissed.value !== String(item.value.id))
let timer: ReturnType<typeof setInterval> | null = null

const load = async () => {
  try {
    item.value = (await $fetch<{ announcement: Announcement | null }>('/api/announcements/current', { query: { t: Math.floor(Date.now() / 60_000) } })).announcement
  } catch {
    // keep the last known announcement on transient errors
  }
}
// The feed copy reappears on every new sign-in session; the floating copy stays dismissed.
const storage = () => (props.inline ? sessionStorage : localStorage)
const dismiss = () => {
  if (!item.value) return
  dismissed.value = String(item.value.id)
  storage().setItem(KEY, dismissed.value)
}

onMounted(() => {
  dismissed.value = storage().getItem(KEY)
  void load()
  timer = setInterval(load, 5 * 60_000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.announcement { position: fixed; top: calc(env(safe-area-inset-top, 0px) + 8px); left: 50%; transform: translateX(-50%); z-index: 9000; width: min(560px, calc(100vw - 16px)); display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; background: #4c1d95; color: #fff; box-shadow: 0 10px 30px rgba(0, 0, 0, .25); }
.announcement.inline { position: static; transform: none; width: auto; margin: 0 0 12px; box-shadow: none; }
.announcement.warning { background: #b45309; }
.announcement.critical { background: #b91c1c; }
.body { flex: 1; min-width: 0; }
.body p { margin: 4px 0 0; font-size: .9rem; white-space: pre-line; overflow-wrap: anywhere; }
.body a { color: #fde68a; font-size: .85rem; }
.close { background: transparent; border: 0; color: #fff; font-size: 1.4rem; line-height: 1; cursor: pointer; padding: 0 4px; }
.ann-enter-active, .ann-leave-active { transition: opacity .2s, transform .2s; }
.ann-enter-from, .ann-leave-to { opacity: 0; transform: translate(-50%, -8px); }
.inline.ann-enter-from, .inline.ann-leave-to { transform: translateY(-8px); }
</style>
