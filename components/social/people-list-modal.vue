<template>
  <div class="people-overlay" @click.self="$emit('close')">
    <div class="people-modal" role="dialog" :aria-label="title">
      <header class="people-head">
        <h3>{{ title }}</h3>
        <button type="button" class="close" aria-label="Close" @click="$emit('close')"><Icon name="x" size="18" /></button>
      </header>

      <p v-if="loading && !people.length" class="hint">Loading…</p>
      <p v-else-if="error" class="hint error">{{ error }}</p>
      <p v-else-if="!people.length" class="hint">No one here yet.</p>

      <ul class="people-list">
        <li v-for="person in people" :key="person.id" class="person">
          <NuxtLink :to="`/profile/${person.username || person.id}`" class="person-link" @click="$emit('close')">
            <img :src="person.avatar_url || '/default-avatar.svg'" alt="" class="person-avatar" />
            <span class="person-text">
              <span class="person-name">{{ person.name }}</span>
              <span class="person-handle">@{{ person.username || 'unknown' }}</span>
            </span>
          </NuxtLink>
          <SocialFollowButton
            v-if="person.relationship && !person.relationship.is_self"
            :user-id="person.id"
            :initial-following="person.relationship.is_following"
            :follows-you="person.relationship.follows_you"
            compact
          />
        </li>
      </ul>

      <button v-if="hasMore" type="button" class="more" :disabled="loading" @click="load(page + 1)">
        {{ loading ? 'Loading…' : 'Show more' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface Relationship {
  is_self: boolean
  is_following: boolean
  follows_you: boolean
}
interface Person {
  id: string
  username: string | null
  name: string
  avatar_url: string | null
  relationship?: Relationship
}

const props = defineProps<{ userId: string, kind: 'followers' | 'following' | 'pals' }>()
defineEmits<{ close: [] }>()

const title = computed(() => ({ followers: 'Followers', following: 'Following', pals: 'PALs' })[props.kind])
const people = ref<Person[]>([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const error = ref('')

const load = async (nextPage: number) => {
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch<{ data: Person[], hasMore?: boolean }>(
      `/api/users/${props.userId}/${props.kind}`,
      { query: { page: nextPage } }
    )
    people.value = nextPage === 1 ? response.data : [...people.value, ...response.data]
    page.value = nextPage
    hasMore.value = Boolean(response.hasMore)
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not load this list.'
  } finally {
    loading.value = false
  }
}

onMounted(() => load(1))
</script>

<style scoped>
.people-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(2, 6, 23, 0.7); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.people-modal { width: 100%; max-width: 440px; max-height: 80vh; overflow-y: auto; background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 1rem; color: #e2e8f0; }
.people-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.people-head h3 { font-size: 1.05rem; font-weight: 700; }
.close { background: none; border: none; color: #94a3b8; cursor: pointer; }
.hint { color: #94a3b8; text-align: center; padding: 1rem 0; }
.hint.error { color: #fca5a5; }
.people-list { list-style: none; margin: 0; padding: 0; }
.person { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid #273449; }
.person-link { display: flex; align-items: center; gap: 0.65rem; min-width: 0; color: inherit; text-decoration: none; }
.person-avatar { width: 40px; height: 40px; border-radius: 999px; object-fit: cover; flex-shrink: 0; }
.person-text { display: flex; flex-direction: column; min-width: 0; }
.person-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.person-handle { color: #94a3b8; font-size: 0.8rem; }
.more { width: 100%; margin-top: 0.75rem; padding: 0.5rem; background: #273449; color: #e2e8f0; border: none; border-radius: 8px; cursor: pointer; }
</style>
