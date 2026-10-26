<template>
  <div class="create-group-overlay" @click.self="emit('close')">
    <form class="create-group" @submit.prevent="submit">
      <header>
        <h2>New group</h2>
        <button type="button" class="close" aria-label="Close" @click="emit('close')">
          <Icon name="x" size="18" />
        </button>
      </header>

      <div class="name-row">
        <label class="group-photo" :title="avatar ? 'Change group photo' : 'Add group photo'">
          <img v-if="avatar" :src="avatar" alt="Group photo" />
          <Icon v-else :name="uploading ? 'loader' : 'camera'" size="20" />
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden :disabled="uploading" @change="pickPhoto" />
        </label>
        <input v-model="groupName" class="field" maxlength="80" placeholder="Group name" required />
      </div>

      <div v-if="selected.length" class="chips">
        <button v-for="person in selected" :key="person.user_id" type="button" class="chip" @click="toggle(person)">
          {{ person.display_name || person.username }}
          <Icon name="x" size="12" />
        </button>
      </div>

      <input
        v-model="query"
        class="field"
        type="search"
        placeholder="Search friends, contacts or conversations"
        @input="onSearch"
      />

      <p class="section-label">{{ query ? 'Results' : 'Suggested' }}<span v-if="selected.length"> · {{ selected.length }} selected</span></p>
      <ul class="people">
        <li v-if="loading" class="hint">Loading…</li>
        <li v-else-if="!people.length" class="hint">
          No one found. People you follow, your PALs and synced contacts appear here.
        </li>
        <li v-for="person in people" :key="person.user_id">
          <label class="person" :class="{ on: isSelected(person) }">
            <img :src="person.avatar_url || '/default-avatar.svg'" alt="" />
            <span class="names">
              <strong>{{ person.display_name || person.username }}</strong>
              <small>@{{ person.username }}</small>
            </span>
            <input type="checkbox" class="pick" :checked="isSelected(person)" @change="toggle(person)" />
          </label>
        </li>
      </ul>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="actions">
        <button type="button" class="secondary" @click="emit('close')">Cancel</button>
        <button type="submit" class="primary" :disabled="!groupName.trim() || !selected.length">
          Create ({{ selected.length }})
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Person {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

const emit = defineEmits<{ close: []; create: [payload: { name: string; memberIds: string[]; avatar: string | null }] }>()

const avatar = ref<string | null>(null)
const uploading = ref(false)
const pickPhoto = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { error.value = 'Group photo must be under 5 MB'; return }
  uploading.value = true
  error.value = ''
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: form })
    avatar.value = res.url
  } catch {
    error.value = 'Could not upload the group photo'
  } finally {
    uploading.value = false
  }
}

const groupName = ref('')
const query = ref('')
const people = ref<Person[]>([])
const selected = ref<Person[]>([])
const loading = ref(false)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: Person[] }>('/api/chat/people', { query: { q: query.value || undefined } })
    people.value = res.data
  } catch {
    error.value = 'Could not load your contacts'
  } finally {
    loading.value = false
  }
}

let timer: ReturnType<typeof setTimeout> | null = null
const onSearch = () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(load, 250)
}

const isSelected = (person: Person) => selected.value.some(item => item.user_id === person.user_id)
const toggle = (person: Person) => {
  selected.value = isSelected(person)
    ? selected.value.filter(item => item.user_id !== person.user_id)
    : [...selected.value, person]
}

const submit = () => {
  emit('create', { name: groupName.value.trim(), memberIds: selected.value.map(person => person.user_id), avatar: avatar.value })
}

onMounted(load)
</script>

<style scoped>
.create-group-overlay { position: fixed; inset: 0; z-index: 60; display: flex; align-items: flex-end; justify-content: center; background: rgba(2, 6, 23, 0.7); }
.create-group {
  width: 100%; height: 100dvh; max-height: 100dvh; display: flex; flex-direction: column; gap: 0.6rem;
  padding: 0.75rem 0.75rem calc(0.75rem + env(safe-area-inset-bottom, 0px)); background: #0f172a; color: #e2e8f0;
}
@media (min-width: 640px) {
  .create-group-overlay { align-items: center; padding: 1rem; }
  .create-group { max-width: 480px; height: auto; max-height: 86vh; border-radius: 16px; border: 1px solid #1e293b; padding: 1rem; }
}
header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
h2 { font-size: 1.05rem; font-weight: 700; margin: 0; }
.close { color: #94a3b8; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; flex-shrink: 0; }
.close:hover { background: #1e293b; }
.name-row { display: flex; gap: 0.6rem; align-items: center; }
.name-row .field { flex: 1; min-width: 0; }
.group-photo { width: 48px; height: 48px; flex-shrink: 0; border-radius: 999px; background: #334155; color: #cbd5e1; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; }
.group-photo img { width: 100%; height: 100%; object-fit: cover; }
.field { width: 100%; padding: 0.55rem 0.8rem; border-radius: 10px; border: 1px solid #334155; background: #1e293b; color: #f8fafc; font-size: 16px; }
.chips { display: flex; gap: 0.35rem; overflow-x: auto; scrollbar-width: none; flex-shrink: 0; }
.chips::-webkit-scrollbar { display: none; }
.chip { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.6rem; border-radius: 999px; background: #2563eb; color: #fff; font-size: 0.78rem; white-space: nowrap; flex-shrink: 0; max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
.section-label { margin: 0.1rem 0 0; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; }
.people { flex: 1; overflow-y: auto; min-height: 120px; list-style: none; margin: 0 -0.25rem; padding: 0; }
.person { display: flex; align-items: center; gap: 0.65rem; padding: 0.5rem 0.5rem; min-height: 52px; border-radius: 10px; cursor: pointer; }
.person:hover, .person.on { background: #1e293b; }
.person img { width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%; object-fit: cover; background: #334155; }
.names { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.names strong, .names small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.names strong { font-size: 0.92rem; font-weight: 600; }
.names small { color: #94a3b8; font-size: 0.75rem; }
.pick { appearance: none; -webkit-appearance: none; flex-shrink: 0; width: 22px; height: 22px; border-radius: 999px; border: 2px solid #475569; background: transparent; display: grid; place-content: center; cursor: pointer; margin: 0; min-height: 0; min-width: 0; max-height: 22px; padding: 0; box-sizing: border-box; }
.pick::after { content: ''; width: 10px; height: 6px; border-left: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(-45deg) translate(1px, -1px); opacity: 0; }
.pick:checked { background: #2563eb; border-color: #2563eb; }
.pick:checked::after { opacity: 1; }
.hint { padding: 1rem 0.5rem; color: #94a3b8; font-size: 0.85rem; }
.error { color: #f87171; font-size: 0.85rem; margin: 0; }
.actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
.actions button { flex: 1; padding: 0.6rem 1rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; }
@media (min-width: 640px) { .actions { justify-content: flex-end; } .actions button { flex: 0 0 auto; } }
.secondary { color: #cbd5e1; background: #1e293b; }
.primary { background: #2563eb; color: #fff; }
.primary:disabled { background: #475569; cursor: not-allowed; }
</style>
