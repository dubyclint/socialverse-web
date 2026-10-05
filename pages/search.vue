<template>
  <div class="search-page">
    <header class="search-head">
      <button type="button" class="back" aria-label="Back" @click="goBack"><Icon name="arrow-left" size="20" /></button>
      <div class="search-box">
        <Icon name="search" size="18" class="search-icon" />
        <input
          ref="inputRef"
          v-model="query"
          type="search"
          class="search-input"
          placeholder="Search by username or full name"
          autocomplete="off"
          enterkeyhint="search"
          @keyup.enter="commitQuery"
        />
        <button v-if="query" type="button" class="clear" aria-label="Clear" @click="query = ''"><Icon name="x" size="16" /></button>
      </div>
    </header>

    <main class="search-body">
      <section v-if="!trimmed" class="recent">
        <div class="recent-head">
          <h2>Recent searches</h2>
          <button v-if="recent.length" type="button" class="link" @click="clearRecent">Clear all</button>
        </div>
        <p v-if="!recent.length" class="hint">Search for anyone on Viorp by their username or full name.</p>
        <ul class="recent-list">
          <li v-for="item in recent" :key="item" class="recent-item">
            <button type="button" class="recent-term" @click="query = item">
              <Icon name="clock" size="16" /> {{ item }}
            </button>
            <button type="button" class="remove" :aria-label="`Remove ${item}`" @click="removeRecent(item)">
              <Icon name="x" size="14" />
            </button>
          </li>
        </ul>
      </section>

      <section v-else>
        <p v-if="trimmed.length < 2" class="hint">Keep typing…</p>
        <p v-else-if="loading && !results.length" class="hint">Searching…</p>
        <p v-else-if="error" class="hint error">{{ error }}</p>
        <p v-else-if="!results.length" class="hint">No users match “{{ trimmed }}”.</p>

        <ul class="results">
          <li v-for="person in results" :key="person.id" class="result">
            <NuxtLink :to="`/profile/${person.username || person.id}`" class="result-link" @click="commitQuery">
              <img :src="person.avatar_url || '/default-avatar.svg'" alt="" class="result-avatar" />
              <span class="result-text">
                <span class="result-name">
                  {{ person.name }}
                  <Icon v-if="person.is_verified" name="check-circle" size="13" class="verified" />
                </span>
                <span class="result-handle">
                  @{{ person.username || 'unknown' }}
                  <template v-if="person.relationship?.follows_you"> · Follows you</template>
                </span>
              </span>
            </NuxtLink>
            <div v-if="person.relationship" class="result-actions">
              <SocialFollowButton
                :user-id="person.id"
                :initial-following="person.relationship.is_following"
                :follows-you="person.relationship.follows_you"
                compact
                @changed="commitQuery"
              />
              <SocialPalButton
                :user-id="person.id"
                :status="person.relationship.pal_status"
                :request-id="person.relationship.pal_request_id"
                compact
                @changed="commitQuery"
              />
            </div>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({ middleware: ['auth'], layout: 'default' })

type PalStatus = 'none' | 'friends' | 'outgoing' | 'incoming'

interface SearchResult {
  id: string
  username: string | null
  name: string
  avatar_url: string | null
  is_verified: boolean
  relationship?: {
    is_following: boolean
    follows_you: boolean
    pal_status: PalStatus
    pal_request_id: string | null
  }
}

const RECENT_KEY = 'viorp:recent-user-searches'
const RECENT_LIMIT = 12

const route = useRoute()
const router = useRouter()
const inputRef = ref<HTMLInputElement | null>(null)
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const error = ref('')
const recent = ref<string[]>([])
const trimmed = computed(() => query.value.trim())

let debounce: ReturnType<typeof setTimeout> | null = null
let requestSeq = 0

const readRecent = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

const saveRecent = (items: string[]) => {
  recent.value = items
  localStorage.setItem(RECENT_KEY, JSON.stringify(items))
}

const commitQuery = () => {
  const term = trimmed.value
  if (term.length < 2) return
  saveRecent([term, ...recent.value.filter(item => item.toLowerCase() !== term.toLowerCase())].slice(0, RECENT_LIMIT))
}

const removeRecent = (item: string) => saveRecent(recent.value.filter(entry => entry !== item))
const clearRecent = () => saveRecent([])

const runSearch = async (term: string) => {
  const seq = ++requestSeq
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch<{ data: SearchResult[] }>('/api/users/search', { query: { q: term } })
    if (seq === requestSeq) results.value = response.data ?? []
  } catch {
    if (seq === requestSeq) error.value = 'Search failed. Check your connection and try again.'
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

watch(trimmed, (term) => {
  if (debounce) clearTimeout(debounce)
  router.replace({ query: term ? { q: term } : {} })
  if (term.length < 2) {
    results.value = []
    return
  }
  debounce = setTimeout(() => runSearch(term), 250)
})

const goBack = () => (window.history.length > 1 ? router.back() : router.push('/feed'))

onMounted(() => {
  recent.value = readRecent()
  inputRef.value?.focus()
  if (trimmed.value.length >= 2) runSearch(trimmed.value)
})
</script>

<style scoped>
.search-page { min-height: 100vh; background: #0f172a; color: #e2e8f0; }
.search-head { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #1e293b; border-bottom: 1px solid #334155; }
.back { background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 6px; display: flex; }
.search-box { flex: 1; position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 12px; color: #64748b; pointer-events: none; }
.search-input { width: 100%; padding: 0.6rem 2.25rem; background: #0f172a; border: 1px solid #334155; border-radius: 999px; color: #f1f5f9; font-size: 0.95rem; }
.search-input:focus { outline: none; border-color: #3b82f6; }
.search-input::-webkit-search-cancel-button { display: none; }
.clear { position: absolute; right: 10px; background: none; border: none; color: #94a3b8; cursor: pointer; display: flex; }
.search-body { max-width: 680px; margin: 0 auto; padding: 12px; }
.recent-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.recent-head h2 { font-size: 1rem; font-weight: 700; }
.link { background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 0.85rem; }
.hint { color: #94a3b8; text-align: center; padding: 1.5rem 0; }
.hint.error { color: #fca5a5; }
.recent-list, .results { list-style: none; margin: 0; padding: 0; }
.recent-item { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; }
.recent-term { flex: 1; display: flex; align-items: center; gap: 10px; background: none; border: none; color: #e2e8f0; padding: 0.7rem 0.25rem; cursor: pointer; text-align: left; font-size: 0.95rem; }
.remove { background: none; border: none; color: #64748b; cursor: pointer; padding: 6px; display: flex; }
.result { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0.6rem 0; border-bottom: 1px solid #1e293b; }
.result-link { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; color: inherit; text-decoration: none; }
.result-avatar { width: 46px; height: 46px; border-radius: 999px; object-fit: cover; flex-shrink: 0; }
.result-text { display: flex; flex-direction: column; min-width: 0; }
.result-name { font-weight: 600; display: inline-flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.verified { color: #3b82f6; }
.result-handle { color: #94a3b8; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.result-actions { display: flex; gap: 6px; flex-shrink: 0; }
@media (max-width: 420px) { .result-actions { flex-direction: column; } }
</style>
