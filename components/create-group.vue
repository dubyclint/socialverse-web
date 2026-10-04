<template>
  <div class="create-group-overlay" @click.self="emit('close')">
    <form class="create-group" @submit.prevent="submit">
      <header>
        <h2>New group</h2>
        <button type="button" class="close" aria-label="Close" @click="emit('close')">
          <Icon name="x" size="18" />
        </button>
      </header>

      <input v-model="groupName" class="field" maxlength="80" placeholder="Group name" required />

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
        placeholder="Search your contacts and pals"
        @input="onSearch"
      />

      <ul class="people">
        <li v-if="loading" class="hint">Loading…</li>
        <li v-else-if="!people.length" class="hint">
          No one found. People you follow, your PALs and synced contacts appear here.
        </li>
        <li v-for="person in people" :key="person.user_id">
          <label class="person">
            <input type="checkbox" :checked="isSelected(person)" @change="toggle(person)" />
            <img :src="person.avatar_url || '/default-avatar.svg'" alt="" />
            <span class="names">
              <strong>{{ person.display_name || person.username }}</strong>
              <small>@{{ person.username }}</small>
            </span>
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

const emit = defineEmits<{ close: []; create: [payload: { name: string; memberIds: string[] }] }>()

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
  emit('create', { name: groupName.value.trim(), memberIds: selected.value.map(person => person.user_id) })
}

onMounted(load)
</script>

<style scoped>
.create-group-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 23, 0.6);
  padding: 1rem;
}
.create-group {
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: 16px;
  background: #0f172a;
  color: #e2e8f0;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
h2 {
  font-size: 1.125rem;
  font-weight: 700;
}
.close {
  color: #94a3b8;
}
.field {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  border: 1px solid #334155;
  background: #1e293b;
  color: #f8fafc;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  font-size: 0.8rem;
}
.people {
  flex: 1;
  overflow-y: auto;
  min-height: 120px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.person {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.25rem;
  cursor: pointer;
}
.person img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: #334155;
}
.names {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.names small {
  color: #94a3b8;
}
.hint {
  padding: 1rem 0.25rem;
  color: #94a3b8;
  font-size: 0.875rem;
}
.error {
  color: #f87171;
  font-size: 0.875rem;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.actions button {
  padding: 0.55rem 1rem;
  border-radius: 10px;
  font-weight: 600;
}
.secondary {
  color: #cbd5e1;
}
.primary {
  background: #2563eb;
  color: #fff;
}
.primary:disabled {
  background: #475569;
  cursor: not-allowed;
}
</style>
