<template>
  <section v-if="suggestions.length" class="pal-rail" aria-label="People you may know">
    <header>
      <h3>People you may know</h3>
      <NuxtLink to="/pal" class="see-all">See all</NuxtLink>
    </header>
    <div class="rail">
      <article v-for="person in suggestions.slice(0, 12)" :key="person.id" class="card">
        <NuxtLink :to="`/profile/${person.username || person.id}`" class="who">
          <span class="avatar-wrap">
            <img :src="person.avatar_url || '/default-avatar.svg'" :alt="person.name" class="avatar" />
            <PresenceDot :user-id="person.id" :size="11" />
          </span>
          <strong class="name">{{ person.name }} <VerifiedBadge v-if="person.is_verified" :type="person.verified_type" :size="14" /></strong>
          <span class="reason">{{ person.reasons[0] || (person.username ? `@${person.username}` : '') }}</span>
        </NuxtLink>
        <button type="button" class="add" :disabled="busy.has(person.id)" @click="add(person.id)">
          {{ sent.has(person.id) ? 'Requested' : 'Add PAL' }}
        </button>
        <button type="button" class="dismiss" aria-label="Dismiss" @click="dismiss(person.id)">×</button>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { usePals } from '~/composables/use-pals'
import PresenceDot from '~/components/presence-dot.vue'
import VerifiedBadge from '~/components/VerifiedBadge.vue'

const { suggestions, loadSuggestions, sendRequest } = usePals()
const busy = ref(new Set<string>())
const sent = ref(new Set<string>())

const add = async (id: string) => {
  busy.value = new Set(busy.value).add(id)
  try {
    await sendRequest(id)
    sent.value = new Set(sent.value).add(id)
  } finally {
    const next = new Set(busy.value)
    next.delete(id)
    busy.value = next
  }
}
const dismiss = (id: string) => {
  suggestions.value = suggestions.value.filter(person => person.id !== id)
}

onMounted(() => {
  loadSuggestions().catch(() => { suggestions.value = [] })
})
</script>

<style scoped>
.pal-rail { background: var(--color-surface, #1e293b); border-radius: 12px; padding: 8px 10px; margin: 0; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
h3 { font-size: 0.95rem; margin: 0; }
.see-all { font-size: 0.8rem; color: #60a5fa; }
.rail { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.rail::-webkit-scrollbar { display: none; }
.card { position: relative; flex: 0 0 140px; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 8px; border-radius: 10px; background: var(--color-bg, #0f172a); text-align: center; }
.who { display: flex; flex-direction: column; align-items: center; gap: 4px; color: inherit; text-decoration: none; min-width: 0; width: 100%; }
.avatar-wrap { position: relative; display: inline-flex; }
.avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
.name { font-size: 0.85rem; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.reason { font-size: 0.72rem; color: #94a3b8; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.add { width: 100%; padding: 6px; border: 0; border-radius: 8px; background: #4f46e5; color: #fff; font-size: 0.8rem; cursor: pointer; }
.add:disabled { opacity: 0.6; }
.dismiss { position: absolute; top: 4px; right: 6px; background: none; border: 0; color: #94a3b8; font-size: 1rem; cursor: pointer; }
</style>
