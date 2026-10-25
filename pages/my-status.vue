<template>
  <div class="ms-page">
    <header class="ms-head">
      <button class="ms-back" aria-label="Back" @click="goBack"><Icon name="arrow-left" size="20" /></button>
      <h1>My status</h1>
      <NuxtLink to="/status?new=1" class="ms-add"><Icon name="plus" size="16" /> Add</NuxtLink>
    </header>

    <p v-if="error" class="ms-error">{{ error }}</p>
    <div v-if="loading" class="ms-empty">Loading…</div>
    <div v-else-if="!items.length" class="ms-empty">
      <p>You have no active status.</p>
      <NuxtLink to="/status?new=1" class="ms-cta">Post a status</NuxtLink>
    </div>

    <article v-for="s in items" :key="s.id" class="ms-card">
      <div class="ms-top">
        <button class="ms-thumb" :style="s.media_type === 'text' ? { background: s.background_color || '#1e293b', color: s.text_color || '#fff' } : {}" @click="navigateTo('/status?mine=1')">
          <img v-if="s.media_type === 'image'" :src="s.media_url!" alt="">
          <video v-else-if="s.media_type === 'video'" :src="s.media_url!" muted playsinline />
          <span v-else>{{ s.content }}</span>
        </button>
        <div class="ms-info">
          <p v-if="s.content && s.media_type !== 'text'" class="ms-caption">{{ s.content }}</p>
          <span class="ms-time">{{ timeAgo(s.created_at) }} · expires {{ expiresIn(s.expires_at) }}</span>
          <div class="ms-counts">
            <button :class="{ on: open[s.id] === 'views' }" @click="toggle(s.id, 'views')"><Icon name="eye" size="14" /> {{ s.views.length }}</button>
            <button :class="{ on: open[s.id] === 'likes' }" @click="toggle(s.id, 'likes')"><Icon name="heart" size="14" /> {{ s.likes.length }}</button>
            <button :class="{ on: open[s.id] === 'comments' }" @click="toggle(s.id, 'comments')"><Icon name="message-circle" size="14" /> {{ roots(s).length }}</button>
            <button :class="{ on: open[s.id] === 'gifts' }" @click="toggle(s.id, 'gifts')"><Icon name="gift" size="14" /> {{ giftTotal(s) }} PEW</button>
          </div>
        </div>
        <button class="ms-del" aria-label="Delete status" @click="remove(s.id)"><Icon name="trash-2" size="18" /></button>
      </div>

      <div v-if="open[s.id] === 'comments'" class="ms-list">
        <p v-if="!roots(s).length" class="ms-none">No comments yet</p>
        <div v-for="c in roots(s)" :key="c.id" class="ms-thread">
          <NuxtLink :to="`/profile/${c.user.id}`" class="ms-person">
            <img :src="c.user.avatar_url || '/default-avatar.svg'" alt="">
            <div class="ms-person-text"><strong>{{ c.user.name }}</strong><span class="ms-text">{{ c.content }}</span></div>
          </NuxtLink>
          <div v-for="r in repliesOf(s, c.id)" :key="r.id" class="ms-reply">
            <strong>{{ r.mine ? 'You' : r.user.name }}</strong> <span class="ms-text">{{ r.content }}</span>
          </div>
          <div class="ms-reply-box">
            <input v-model="replyText[c.id]" maxlength="500" :placeholder="`Reply to ${c.user.name}…`" @keyup.enter="sendReply(s, c.id)">
            <button :disabled="!replyText[c.id]?.trim()" @click="sendReply(s, c.id)">Reply</button>
          </div>
        </div>
      </div>
      <ul v-else-if="open[s.id]" class="ms-list">
        <li v-for="row in rows(s)" :key="row.key">
          <NuxtLink :to="`/profile/${row.user.id}`" class="ms-person">
            <img :src="row.user.avatar_url || '/default-avatar.svg'" alt="">
            <div class="ms-person-text">
              <strong>{{ row.user.name }}</strong>
              <span v-if="row.text" class="ms-text">{{ row.text }}</span>
            </div>
          </NuxtLink>
          <small>{{ row.extra || timeAgo(row.at) }}</small>
        </li>
        <li v-if="!rows(s).length" class="ms-none">Nothing yet</li>
      </ul>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

definePageMeta({ middleware: ['auth', 'profile-completion'], layout: 'default' })
useHead({ title: 'My status - Viorp' })

interface Person { id: string, name: string, username: string, avatar_url: string | null }
interface MyStatus {
  id: string
  content: string | null
  media_url: string | null
  media_type: 'text' | 'image' | 'video'
  background_color: string | null
  text_color: string | null
  created_at: string
  expires_at: string
  views: { user: Person, at: string }[]
  likes: { user: Person, at: string }[]
  comments: { id: string, user: Person, content: string, at: string, reply_to: string | null, mine: boolean }[]
  gifts: { id: string, user: Person, amount: number, at: string }[]
}
type Section = 'views' | 'likes' | 'comments' | 'gifts'

const router = useRouter()
const items = ref<MyStatus[]>([])
const loading = ref(true)
const error = ref('')
const open = reactive<Record<string, Section | undefined>>({})
const replyText = reactive<Record<string, string>>({})
const roots = (s: MyStatus) => s.comments.filter(c => !c.reply_to)
const repliesOf = (s: MyStatus, id: string) => s.comments.filter(c => c.reply_to === id)
const sendReply = async (s: MyStatus, rootId: string) => {
  const text = replyText[rootId]?.trim()
  if (!text) return
  try {
    const res = await $fetch<{ data: { id: string, created_at: string } }>(`/api/status/${s.id}/comments`, { method: 'POST', body: { content: text, replyTo: rootId } })
    s.comments.push({ id: res.data.id, user: { id: '', name: 'You', username: '', avatar_url: null }, content: text, at: res.data.created_at, reply_to: rootId, mine: true })
    replyText[rootId] = ''
  } catch (e) {
    error.value = errMsg(e, 'Could not send reply')
  }
}

const errMsg = (e: unknown, fallback: string) => (e as { data?: { statusMessage?: string } })?.data?.statusMessage || fallback
const load = async () => {
  try {
    items.value = (await $fetch<{ data: MyStatus[] }>('/api/status/mine')).data ?? []
  } catch (e) {
    error.value = errMsg(e, 'Could not load your statuses')
  } finally {
    loading.value = false
  }
}
const goBack = () => (window.history.length > 1 ? router.back() : navigateTo('/feed'))
const toggle = (id: string, section: Section) => { open[id] = open[id] === section ? undefined : section }
const giftTotal = (s: MyStatus) => Math.round(s.gifts.reduce((sum, g) => sum + g.amount, 0) * 100) / 100
const rows = (s: MyStatus) => {
  switch (open[s.id]) {
    case 'views': return s.views.map(v => ({ key: `v${v.user.id}`, user: v.user, at: v.at, text: '', extra: '' }))
    case 'likes': return s.likes.map(l => ({ key: `l${l.user.id}`, user: l.user, at: l.at, text: '', extra: '' }))
    case 'comments': return s.comments.map(c => ({ key: c.id, user: c.user, at: c.at, text: c.content, extra: '' }))
    case 'gifts': return s.gifts.map(g => ({ key: g.id, user: g.user, at: g.at, text: '', extra: `${g.amount} PEW` }))
    default: return []
  }
}
const timeAgo = (iso: string) => {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : new Date(iso).toLocaleDateString()
}
const expiresIn = (iso: string) => {
  const m = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 60000))
  return m < 60 ? `in ${m}m` : `in ${Math.floor(m / 60)}h`
}
const remove = async (id: string) => {
  if (!confirm('Delete this status?')) return
  try {
    await $fetch(`/api/status/${id}`, { method: 'DELETE' })
    items.value = items.value.filter(s => s.id !== id)
  } catch (e) {
    error.value = errMsg(e, 'Could not delete')
  }
}
onMounted(load)
</script>

<style scoped>
.ms-page { max-width: 640px; margin: 0 auto; min-height: 100dvh; padding-bottom: 80px; color: var(--text-primary, #e2e8f0); }
.ms-head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; position: sticky; top: 0; background: var(--bg-primary, #0f172a); z-index: 2; }
.ms-head h1 { font-size: 1.25rem; font-weight: 700; margin: 0; flex: 1; }
.ms-back { background: none; border: 0; color: inherit; padding: 4px; }
.ms-add { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 999px; background: #22c55e; color: #fff; font-size: .85rem; font-weight: 600; text-decoration: none; flex-shrink: 0; }
.ms-error { margin: 8px 16px; color: #f87171; font-size: .85rem; }
.ms-empty { padding: 40px 16px; text-align: center; color: #94a3b8; }
.ms-cta { display: inline-block; margin-top: 12px; padding: 10px 18px; border-radius: 999px; background: #22c55e; color: #fff; text-decoration: none; font-weight: 600; }
.ms-card { margin: 10px 16px; padding: 12px; border-radius: 14px; background: #111827; border: 1px solid rgba(148,163,184,.15); }
.ms-top { display: flex; gap: 12px; align-items: flex-start; }
.ms-thumb { width: 72px; height: 96px; border-radius: 10px; overflow: hidden; flex-shrink: 0; border: 0; padding: 4px; background: #1e293b; color: #fff; font-size: .65rem; display: grid; place-items: center; cursor: pointer; }
.ms-thumb img, .ms-thumb video { width: 100%; height: 100%; object-fit: cover; margin: -4px; width: calc(100% + 8px); height: calc(100% + 8px); }
.ms-thumb span { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.ms-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.ms-caption { margin: 0; font-size: .9rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.ms-time { font-size: .75rem; color: #94a3b8; }
.ms-counts { display: flex; flex-wrap: wrap; gap: 6px; }
.ms-counts button { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 999px; border: 1px solid rgba(148,163,184,.3); background: transparent; color: inherit; font-size: .78rem; }
.ms-counts button.on { background: #1d4ed8; border-color: #1d4ed8; }
.ms-del { background: none; border: 0; color: #f87171; padding: 4px; flex-shrink: 0; }
.ms-list { list-style: none; margin: 10px 0 0; padding: 0; border-top: 1px solid rgba(148,163,184,.15); }
.ms-list li { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
.ms-person { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; color: inherit; text-decoration: none; }
.ms-person img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.ms-person-text { display: flex; flex-direction: column; min-width: 0; }
.ms-person-text strong { font-size: .88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ms-text { font-size: .82rem; color: #cbd5e1; overflow-wrap: anywhere; }
.ms-list small { color: #94a3b8; flex-shrink: 0; font-size: .75rem; }
.ms-thread { padding: 8px 0; border-bottom: 1px solid rgba(148,163,184,.1); }
.ms-reply { margin: 4px 0 0 44px; font-size: .84rem; overflow-wrap: anywhere; }
.ms-reply strong { color: #93c5fd; }
.ms-reply-box { display: flex; gap: 6px; margin: 6px 0 0 44px; }
.ms-reply-box input { flex: 1; min-width: 0; background: #1e293b; border: 1px solid #334155; border-radius: 999px; padding: 7px 12px; color: #fff; outline: none; }
.ms-reply-box button { background: #22c55e; color: #fff; border: 0; border-radius: 999px; padding: 6px 12px; font-size: .8rem; flex-shrink: 0; }
.ms-reply-box button:disabled { opacity: .4; }
.ms-none { color: #94a3b8; font-size: .85rem; justify-content: center; }
</style>
