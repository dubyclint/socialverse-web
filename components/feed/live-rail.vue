<template>
  <section v-if="items.length" class="live-rail">
    <header>
      <h3>Live now</h3>
      <NuxtLink to="/stream" class="see-all">See all</NuxtLink>
    </header>

    <div class="rail">
      <article
        v-for="item in items"
        :key="item.id"
        class="card"
        :class="{ battle: item.kind === 'battle' }"
        @click="open(item)"
      >
        <img :src="item.creatorAvatar || '/default-avatar.svg'" :alt="item.creatorName || 'Creator'" />
        <span class="tag">{{ item.kind === 'battle' ? 'BATTLE' : 'LIVE' }}</span>
        <span v-if="item.kind === 'battle' && item.endsAt" class="timer">{{ remaining(item.endsAt) }}</span>
        <p class="title">{{ item.title }}</p>
        <p class="meta">{{ item.creatorName || 'Creator' }} · {{ item.viewers }} watching</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
interface LiveCandidate {
  kind: 'stream' | 'battle'
  id: string
  streamId: string
  title: string
  creatorName: string | null
  creatorAvatar: string | null
  viewers: number
  matchId: string | null
  endsAt: string | null
}

const items = ref<LiveCandidate[]>([])
const now = ref(Date.now())
let poll: ReturnType<typeof setInterval> | null = null
let tick: ReturnType<typeof setInterval> | null = null

async function load() {
  try {
    const res = await $fetch<{ items: LiveCandidate[] }>('/api/discovery/live')
    items.value = res.items
  } catch {
    items.value = []
  }
}

function remaining(endsAt: string): string {
  const seconds = Math.max(0, Math.round((new Date(endsAt).getTime() - now.value) / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function open(item: LiveCandidate) {
  navigateTo(`/stream/${item.streamId}`)
}

onMounted(() => {
  load()
  poll = setInterval(load, 30000)
  tick = setInterval(() => { now.value = Date.now() }, 1000)
})

onBeforeUnmount(() => {
  if (poll) clearInterval(poll)
  if (tick) clearInterval(tick)
})
</script>

<style scoped>
.live-rail { margin-bottom: 1rem; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
h3 { margin: 0; font-size: 1rem; }
.see-all { font-size: 0.85rem; }
.rail { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.25rem; }
.card { position: relative; min-width: 140px; border: 1px solid #e5e5e5; border-radius: 10px; padding: 0.6rem; cursor: pointer; }
.card.battle { border-color: #f0a; box-shadow: 0 0 0 1px rgba(255, 0, 170, 0.15); }
.card img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.tag { position: absolute; top: 0.5rem; right: 0.5rem; background: #e11; color: #fff; font-size: 0.62rem; padding: 0 0.35rem; border-radius: 8px; }
.card.battle .tag { background: #b01f8c; }
.timer { position: absolute; bottom: 0.5rem; right: 0.5rem; font-size: 0.7rem; font-variant-numeric: tabular-nums; color: #b01f8c; }
.title { margin: 0.4rem 0 0.1rem; font-size: 0.85rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { margin: 0; font-size: 0.72rem; color: #777; }
</style>
