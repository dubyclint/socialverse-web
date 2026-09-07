<template>
  <section v-if="state" class="battle" :class="{ finished: state.match.status === 'FINISHED' }">
    <div class="timer">{{ countdown }}</div>

    <div class="split">
      <div class="side side-one" :class="outcome(1)">
        <h4>Side 1</h4>
        <p class="score">{{ state.score.sideOne }}</p>
        <button :disabled="!isLive" @click="tap(1)">Tap</button>
      </div>
      <div class="side side-two" :class="outcome(2)">
        <h4>Side 2</h4>
        <p class="score">{{ state.score.sideTwo }}</p>
        <button :disabled="!isLive" @click="tap(2)">Tap</button>
      </div>
    </div>

    <div class="tug">
      <div class="tug-fill" :style="{ width: `${(1 - state.score.position) * 100}%` }" />
    </div>

    <p v-if="state.match.status === 'FINISHED'" class="result">
      {{ state.match.winning_side ? `Side ${state.match.winning_side} wins` : 'Draw' }}
    </p>
    <p v-if="error" class="error">{{ error }}</p>
  </section>
</template>

<script setup lang="ts">
interface MatchState {
  match: {
    id: string
    status: 'PENDING' | 'LIVE' | 'FINISHED' | 'CANCELLED'
    ends_at: string | null
    winning_side: number | null
  }
  score: { sideOne: number; sideTwo: number; position: number }
  secondsRemaining: number | null
}

const props = defineProps<{ matchId: string }>()

const state = ref<MatchState | null>(null)
const remaining = ref(0)
const error = ref<string | null>(null)
let poll: ReturnType<typeof setInterval> | null = null
let tick: ReturnType<typeof setInterval> | null = null

const isLive = computed(() => state.value?.match.status === 'LIVE' && remaining.value > 0)

const countdown = computed(() => {
  const seconds = Math.max(0, remaining.value)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
})

function outcome(side: number): string {
  if (state.value?.match.status !== 'FINISHED') return ''
  if (state.value.match.winning_side === null) return 'draw'
  return state.value.match.winning_side === side ? 'winner' : 'loser'
}

async function load() {
  try {
    const res = await $fetch<MatchState>(`/api/stream/matches/${props.matchId}`)
    state.value = res
    // The countdown always re-syncs to the server's remaining seconds, so a
    // client clock that drifts cannot extend or shorten the match.
    remaining.value = res.secondsRemaining ?? 0
    if (res.match.status === 'LIVE' && remaining.value === 0) await finalize()
  } catch {
    error.value = 'Could not load the battle'
  }
}

async function finalize() {
  try {
    await $fetch(`/api/stream/matches/${props.matchId}/finalize`, { method: 'POST' })
    await load()
  } catch {
    /* another client already settled it */
  }
}

async function tap(side: 1 | 2) {
  error.value = null
  try {
    await $fetch(`/api/stream/matches/${props.matchId}/tap`, { method: 'POST', body: { side } })
    await load()
  } catch (err) {
    error.value = err && typeof err === 'object' && 'statusMessage' in err
      ? String((err as { statusMessage?: string }).statusMessage)
      : 'Tap rejected'
  }
}

onMounted(() => {
  load()
  poll = setInterval(load, 3000)
  tick = setInterval(() => {
    if (remaining.value > 0) remaining.value -= 1
  }, 1000)
})

onBeforeUnmount(() => {
  if (poll) clearInterval(poll)
  if (tick) clearInterval(tick)
})
</script>

<style scoped>
.battle { border: 1px solid #e5e5e5; border-radius: 10px; padding: 1rem; }
.timer { text-align: center; font-size: 1.6rem; font-variant-numeric: tabular-nums; font-weight: 700; }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 0.75rem 0; }
.side { text-align: center; border-radius: 8px; padding: 0.75rem; background: #fafafa; }
.side.winner { background: #e6f7e9; box-shadow: inset 0 0 0 2px #34a853; }
.side.loser { background: #f6f6f6; opacity: 0.6; }
.score { font-size: 1.5rem; font-weight: 700; margin: 0.25rem 0; }
.tug { height: 12px; border-radius: 6px; background: #b01f8c; overflow: hidden; }
.tug-fill { height: 100%; background: #1a73e8; transition: width 0.4s ease; }
.result { text-align: center; font-weight: 700; margin-top: 0.75rem; }
.error { color: #b00020; text-align: center; }
</style>
