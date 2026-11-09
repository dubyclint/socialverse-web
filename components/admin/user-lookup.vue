<!-- Admin only: look up an account by username to see its linked email, phone, last seen and last username change. -->
<template>
  <section class="lookup">
    <form class="lookup-bar" role="search" @submit.prevent="run">
      <Icon name="search" size="16" />
      <input v-model.trim="q" type="search" placeholder="Search username to see linked email and phone" aria-label="Search username" autocomplete="off" @input="queue">
      <button v-if="q" type="button" class="clear" aria-label="Clear" @click="clear">✕</button>
    </form>
    <p v-if="busy" class="note">Searching…</p>
    <p v-else-if="error" class="note err">{{ error }}</p>
    <p v-else-if="searched && !users.length" class="note">No account with that username.</p>
    <ul v-if="users.length" class="results">
      <li v-for="u in users" :key="u.id" class="card">
        <NuxtLink :to="`/profile/${u.username || u.id}`" class="who">
          <img :src="u.avatar_url || '/default-avatar.svg'" alt="" class="av">
          <span><b>{{ u.name || u.username }}</b><small>@{{ u.username }}</small></span>
        </NuxtLink>
        <dl>
          <dt>Email</dt><dd>{{ u.email || '—' }}</dd>
          <dt>Phone</dt><dd>{{ u.phone || 'None' }}<em v-if="u.phone && u.phone_verified"> · verified</em></dd>
          <dt>Last seen</dt><dd>{{ when(u.last_seen) }}</dd>
          <dt>Username changed</dt><dd>{{ u.username_changed_at ? when(u.username_changed_at) : 'Never' }}</dd>
          <dt>Joined</dt><dd>{{ when(u.joined_at) }}</dd>
        </dl>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface LookupUser { id: string, username: string | null, name: string | null, avatar_url: string | null, email: string | null, phone: string | null, phone_verified: boolean, last_seen: string | null, username_changed_at: string | null, joined_at: string | null }

const q = ref('')
const users = ref<LookupUser[]>([])
const busy = ref(false)
const error = ref('')
const searched = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
let seq = 0

const when = (iso: string | null) => iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown'

const run = async () => {
  if (timer) { clearTimeout(timer); timer = null }
  const term = q.value.replace(/^@/, '')
  if (term.length < 2) { users.value = []; searched.value = false; error.value = ''; return }
  const mine = ++seq
  busy.value = true
  error.value = ''
  try {
    const res = await $fetch<{ users: LookupUser[] }>('/api/admin/user-lookup', { query: { q: term } })
    if (mine === seq) { users.value = res.users; searched.value = true }
  } catch (e) {
    if (mine === seq) { users.value = []; error.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Search failed' }
  } finally {
    if (mine === seq) busy.value = false
  }
}
const queue = () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(run, 400)
}
const clear = () => { q.value = ''; users.value = []; searched.value = false; error.value = '' }
</script>

<style scoped>
.lookup { margin: 0 0 18px; }
.lookup-bar { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, .25); background: rgba(15, 23, 42, .7); color: #94a3b8; }
.lookup-bar input { flex: 1; min-width: 0; background: transparent; border: 0; outline: 0; color: #f1f5f9; font-size: 14px; }
.lookup-bar input::-webkit-search-cancel-button { display: none; }
.clear { color: #94a3b8; font-size: 13px; padding: 0 2px; }
.note { margin: 8px 2px 0; font-size: 12px; color: #94a3b8; }
.note.err { color: #f87171; }
.results { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 10px; }
.card { padding: 12px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, .18); background: rgba(15, 23, 42, .55); }
.who { display: flex; align-items: center; gap: 10px; color: inherit; text-decoration: none; min-width: 0; }
.who span { display: flex; flex-direction: column; min-width: 0; }
.who b, .who small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.who small { color: #94a3b8; font-size: 12px; }
.av { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; flex: none; background: #1e293b; }
dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; margin: 10px 0 0; font-size: 13px; }
dt { color: #94a3b8; }
dd { margin: 0; color: #e2e8f0; overflow-wrap: anywhere; }
dd em { color: #34d399; font-style: normal; }
</style>
