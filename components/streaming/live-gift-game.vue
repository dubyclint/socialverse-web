<template>
  <div v-if="game" class="gift-game" :class="{ done: game.status !== 'live' }">
    <div class="gg-head">
      <strong>🏆 Top gift getter</strong>
      <span v-if="game.status === 'live'" class="gg-time">{{ clock }}</span>
      <span v-else class="gg-time">Finished</span>
      <button v-if="closable && game.status !== 'live'" class="gg-x" @click="$emit('close')">✕</button>
    </div>
    <ol class="gg-board">
      <li v-for="(b, i) in board.slice(0, 3)" :key="b.id" :class="{ win: winnerIds.includes(b.id) }">
        <span class="gg-rank">{{ ['🥇', '🥈', '🥉'][i] }}</span>
        <img :src="b.avatar_url || '/default-avatar.svg'" alt="" />
        <span class="gg-name">{{ b.name }}</span>
        <span class="gg-total">{{ b.total }}</span>
      </li>
      <li v-if="!board.length" class="gg-empty">Send gifts to climb the board</li>
    </ol>
    <p v-if="game.status !== 'live' && winners.length" class="gg-winner">🎉 {{ winners.map(w => w.name).join(' & ') }} {{ winners.length > 1 ? 'win' : 'wins' }}!</p>
    <p v-else-if="game.status !== 'live'" class="gg-winner">No gifts this round.</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Entry { id: string, name: string, avatar_url: string | null, total: number }
const props = defineProps<{ game: { status: string, ends_at: string } | null, board: Entry[], winners: Entry[], closable?: boolean }>()
defineEmits<{ close: [] }>()
const now = ref(Date.now())
let t: ReturnType<typeof setInterval> | null = null
onMounted(() => { t = setInterval(() => { now.value = Date.now() }, 500) })
onUnmounted(() => { if (t) clearInterval(t) })
const winnerIds = computed(() => props.winners.map(w => w.id))
const clock = computed(() => {
  const s = Math.max(0, Math.round(((props.game ? Date.parse(props.game.ends_at) : 0) - now.value) / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
</script>

<style scoped>
.gift-game { position: absolute; left: 10px; top: calc(env(safe-area-inset-top) + 84px); z-index: 7; width: min(230px, 60vw); background: #0f172acc; border: 1px solid #f59e0b88; border-radius: 12px; padding: 6px 8px; font-size: 12px; color: #fff; }
.gg-head { display: flex; align-items: center; gap: 6px; }
.gg-head strong { flex: 1; font-size: 12px; }
.gg-time { background: #f59e0b; color: #111; font-weight: 800; border-radius: 6px; padding: 0 6px; }
.gg-x { background: none; border: 0; color: #fff; cursor: pointer; min-height: 0; padding: 0 2px; }
.gg-board { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
.gg-board li { display: flex; align-items: center; gap: 5px; min-width: 0; }
.gg-board li.win { color: #fbbf24; font-weight: 700; }
.gg-board img { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.gg-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gg-total { font-weight: 700; }
.gg-empty { opacity: .75; }
.gg-winner { margin: 4px 0 0; font-weight: 800; color: #fbbf24; }
</style>
