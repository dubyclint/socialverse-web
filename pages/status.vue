<template>
  <div class="st-page">
    <header class="st-head">
      <button class="st-back" aria-label="Back" @click="goBack"><Icon name="arrow-left" size="20" /></button>
      <h1>Status</h1>
    </header>

    <section class="st-mine">
      <button class="st-row" @click="myGroup ? openGroup(myGroup) : (composerOpen = true)">
        <div class="st-ring" :class="{ none: !myGroup }">
          <img :src="myAvatar" alt="">
          <span v-if="!myGroup" class="st-plus">+</span>
        </div>
        <div class="st-meta">
          <strong>My status</strong>
          <span>{{ myGroup ? `${myGroup.statuses.length} update${myGroup.statuses.length > 1 ? 's' : ''} · ${timeAgo(myGroup.statuses.at(-1)!.created_at)}` : 'Tap to add a status update' }}</span>
        </div>
      </button>
      <div class="st-actions">
        <button class="st-chip" @click="composerOpen = true"><Icon name="edit-3" size="16" /> Text</button>
        <button class="st-chip" :disabled="uploading" @click="mediaInput?.click()"><Icon name="camera" size="16" /> {{ uploading ? 'Uploading…' : 'Photo / video' }}</button>
        <input ref="mediaInput" type="file" accept="image/*,video/*" hidden @change="onMediaPicked">
      </div>
    </section>

    <p v-if="error" class="st-error">{{ error }}</p>

    <section v-if="recent.length" class="st-list">
      <h2>Recent updates</h2>
      <button v-for="g in recent" :key="g.author.id" class="st-row" @click="openGroup(g)">
        <div class="st-ring"><img :src="g.author.avatar_url || '/default-avatar.svg'" alt=""></div>
        <div class="st-meta">
          <strong>{{ g.author.full_name }}<VerifiedBadge v-if="g.author.verified" :type="g.author.verified_type" :size="14" /></strong>
          <span>{{ timeAgo(g.statuses.at(-1)!.created_at) }}</span>
        </div>
      </button>
    </section>
    <section v-if="viewedGroups.length" class="st-list">
      <h2>Viewed updates</h2>
      <button v-for="g in viewedGroups" :key="g.author.id" class="st-row" @click="openGroup(g)">
        <div class="st-ring seen"><img :src="g.author.avatar_url || '/default-avatar.svg'" alt=""></div>
        <div class="st-meta">
          <strong>{{ g.author.full_name }}<VerifiedBadge v-if="g.author.verified" :type="g.author.verified_type" :size="14" /></strong>
          <span>{{ timeAgo(g.statuses.at(-1)!.created_at) }}</span>
        </div>
      </button>
    </section>
    <p v-if="!loading && !groups.length" class="st-empty">No recent status updates from people you follow.</p>
    <div v-if="loading" class="st-empty">Loading…</div>

    <!-- Text / caption composer -->
    <div v-if="composerOpen" class="st-composer" :style="{ background: draft.background_color }">
      <div class="st-comp-top">
        <button aria-label="Close" @click="closeComposer"><Icon name="x" size="22" /></button>
        <div v-if="!draft.media_url" class="st-colors">
          <button v-for="c in COLORS" :key="c" class="st-color" :class="{ on: c === draft.background_color }" :style="{ background: c }" @click="draft.background_color = c" />
        </div>
      </div>
      <div class="st-comp-body">
        <img v-if="draft.media_url && draftIsVideo === false" :src="draft.media_url" class="st-comp-media" alt="">
        <video v-else-if="draft.media_url" :src="draft.media_url" class="st-comp-media" controls playsinline />
        <textarea v-model="draft.content" :class="{ caption: draft.media_url }" maxlength="700" :placeholder="draft.media_url ? 'Add a caption…' : 'Type a status'" />
      </div>
      <button class="st-send" :disabled="posting || (!draft.content.trim() && !draft.media_url)" @click="postStatus">
        {{ posting ? 'Posting…' : 'Share' }} <Icon name="send" size="18" />
      </button>
    </div>

    <!-- Viewer -->
    <div v-if="viewing" class="st-viewer" @click="onViewerTap">
      <div class="st-bars">
        <span v-for="(s, i) in viewing.statuses" :key="s.id" class="st-bar"><i :style="{ width: i < index ? '100%' : i === index ? `${progress}%` : '0%' }" /></span>
      </div>
      <div class="st-vhead" @click.stop>
        <img :src="viewing.author.avatar_url || '/default-avatar.svg'" alt="">
        <div class="st-meta">
          <strong>{{ viewing.is_me ? 'My status' : viewing.author.full_name }}<VerifiedBadge v-if="viewing.author.verified" :type="viewing.author.verified_type" :size="14" /></strong>
          <span>{{ timeAgo(current!.created_at) }}</span>
        </div>
        <button v-if="viewing.is_me" aria-label="Delete" @click="removeCurrent"><Icon name="trash-2" size="20" /></button>
        <button aria-label="Close" @click="closeViewer"><Icon name="x" size="22" /></button>
      </div>
      <div class="st-vbody" :style="current!.media_type === 'text' ? { background: current!.background_color || '#1e293b', color: current!.text_color || '#fff' } : {}">
        <p v-if="current!.media_type === 'text'" class="st-vtext">{{ current!.content }}</p>
        <img v-else-if="current!.media_type === 'image'" :src="current!.media_url!" alt="" @load="startTimer()">
        <video v-else ref="videoEl" :src="current!.media_url!" autoplay playsinline @loadedmetadata="onVideoMeta" @ended="next" />
        <p v-if="current!.media_type !== 'text' && current!.content" class="st-vcaption">{{ current!.content }}</p>
      </div>
      <div v-if="!viewing.is_me" class="st-react" @click.stop>
        <button class="st-like" :class="{ on: current!.liked }" aria-label="Like" @click="toggleLike"><Icon name="heart" size="20" /> {{ current!.like_count || '' }}</button>
        <input v-model="reply" maxlength="500" placeholder="Reply…" @focus="paused = true" @blur="paused = false" @keyup.enter="sendReply">
        <button aria-label="Send reply" :disabled="!reply.trim()" @click="sendReply"><Icon name="send" size="18" /></button>
        <button aria-label="Gift PEW" @click="giftOpen = !giftOpen; paused = giftOpen"><Icon name="gift" size="20" /></button>
        <button aria-label="Your comments" @click="openComments"><Icon name="message-circle" size="20" /></button>
        <div v-if="giftOpen" class="st-gift">
          <input v-model.number="giftAmount" type="number" min="0.01" step="0.01" aria-label="PEW amount">
          <button :disabled="gifting" @click="sendGift">{{ gifting ? 'Sending…' : 'Gift PEW' }}</button>
        </div>
        <p v-if="reactMsg" class="st-react-msg">{{ reactMsg }}</p>
      </div>
      <div v-if="viewing.is_me" class="st-viewers" @click.stop="toggleViewers">
        <div class="st-own-actions">
          <span><Icon name="eye" size="16" /> {{ viewerInfo?.view_count ?? current!.view_count ?? 0 }}</span>
          <button class="st-comments-btn" @click.stop="openComments"><Icon name="message-circle" size="16" /> Comments</button>
        </div>
        <ul v-if="showViewers && viewerInfo?.viewers.length">
          <li v-for="v in viewerInfo.viewers" :key="v.id"><img :src="v.avatar_url || '/default-avatar.svg'" alt="">{{ v.name }}<small>{{ timeAgo(v.viewed_at) }}</small></li>
        </ul>
      </div>
      <div v-if="showComments" class="st-csheet" @click.stop>
        <header><strong>{{ commentsAuthor ? 'Comments' : 'Your comments' }}</strong><button aria-label="Close comments" @click="closeComments"><Icon name="x" size="20" /></button></header>
        <p v-if="commentsLoading" class="st-cempty">Loading…</p>
        <p v-else-if="!threads.length" class="st-cempty">{{ commentsAuthor ? 'No comments yet' : 'You haven\'t commented on this status yet' }}</p>
        <div v-for="t in threads" :key="t.id" class="st-thread">
          <div class="st-cmsg"><img :src="t.user?.avatar_url || '/default-avatar.svg'" alt=""><div><strong>{{ t.user?.name }}</strong><p>{{ t.content }}</p><small>{{ timeAgo(t.created_at) }}</small></div></div>
          <div v-for="r in t.replies" :key="r.id" class="st-cmsg reply"><img :src="r.user?.avatar_url || '/default-avatar.svg'" alt=""><div><strong>{{ r.by_author ? `${r.user?.name} · author` : r.user?.name }}</strong><p>{{ r.content }}</p><small>{{ timeAgo(r.created_at) }}</small></div></div>
          <div class="st-creply">
            <input v-model="threadReply[t.id]" maxlength="500" :placeholder="commentsAuthor ? `Reply to ${t.user?.name ?? 'comment'}…` : 'Add to this thread…'" @keyup.enter="sendThreadReply(t.id)">
            <button :disabled="!threadReply[t.id]?.trim()" aria-label="Send" @click="sendThreadReply(t.id)"><Icon name="send" size="16" /></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useUserStore } from '~/stores/user'
import type { StatusGroup } from '~/server/api/status/index.get'

definePageMeta({ middleware: ['auth', 'profile-completion', 'language-check'], layout: 'default' })
useHead({ title: 'Status - Viorp' })

const COLORS = ['#1e293b', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#2563eb', '#0f172a']
const IMAGE_MS = 6000
const TEXT_MS = 5000

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const groups = ref<StatusGroup[]>([])
const loading = ref(true)
const error = ref('')
const uploading = ref(false)
const posting = ref(false)
const composerOpen = ref(false)
const mediaInput = ref<HTMLInputElement | null>(null)
const draft = ref({ content: '', media_url: '' as string, background_color: COLORS[1]! })
const draftIsVideo = ref(false)

const myAvatar = computed(() => userStore.profile?.avatar_url || '/default-avatar.svg')
const myGroup = computed(() => groups.value.find(g => g.is_me) ?? null)
const recent = computed(() => groups.value.filter(g => !g.is_me && !g.all_viewed))
const viewedGroups = computed(() => groups.value.filter(g => !g.is_me && g.all_viewed))

const errMsg = (e: unknown, fallback: string) => (e as { data?: { statusMessage?: string } })?.data?.statusMessage || fallback

const load = async () => {
  try {
    const res = await $fetch<{ data: StatusGroup[] }>('/api/status')
    groups.value = res.data ?? []
  } catch (e) {
    error.value = errMsg(e, 'Could not load statuses')
  } finally {
    loading.value = false
  }
}

const timeAgo = (iso: string) => {
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : new Date(iso).toLocaleDateString()
}

const goBack = () => (window.history.length > 1 ? router.back() : navigateTo('/feed'))

const onMediaPicked = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  const isVideo = file.type.startsWith('video/')
  if (file.size > (isVideo ? 50 : 10) * 1024 * 1024) {
    error.value = isVideo ? 'Videos can be up to 50 MB' : 'Photos can be up to 10 MB'
    return
  }
  uploading.value = true
  error.value = ''
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: form })
    draft.value.media_url = res.url
    draftIsVideo.value = isVideo
    composerOpen.value = true
  } catch (err) {
    error.value = errMsg(err, 'Upload failed')
  } finally {
    uploading.value = false
  }
}

const closeComposer = () => {
  composerOpen.value = false
  draft.value = { content: '', media_url: '', background_color: COLORS[1]! }
}

const postStatus = async () => {
  posting.value = true
  error.value = ''
  try {
    await $fetch('/api/status/create', { method: 'POST', body: { content: draft.value.content, media_url: draft.value.media_url || null, background_color: draft.value.background_color, text_color: '#ffffff' } })
    closeComposer()
    await load()
  } catch (e) {
    error.value = errMsg(e, 'Could not post your status')
  } finally {
    posting.value = false
  }
}

// ---- viewer ----
const viewing = ref<StatusGroup | null>(null)
const index = ref(0)
const progress = ref(0)
const videoEl = ref<HTMLVideoElement | null>(null)
const viewerInfo = ref<{ view_count: number, viewers: { id: string, name: string, avatar_url: string | null, viewed_at: string }[] } | null>(null)
const showViewers = ref(false)
const paused = ref(false)
interface ThreadPerson { id: string, name: string, avatar_url: string | null }
interface Thread { id: string, content: string, created_at: string, user: ThreadPerson | null, replies: { id: string, content: string, created_at: string, user: ThreadPerson | null, by_author: boolean }[] }
const showComments = ref(false)
const commentsLoading = ref(false)
const commentsAuthor = ref(false)
const threads = ref<Thread[]>([])
const threadReply = reactive<Record<string, string>>({})
const loadComments = async () => {
  const s = current.value
  if (!s) return
  commentsLoading.value = true
  try {
    const res = await $fetch<{ data: { is_author: boolean, threads: Thread[] } }>(`/api/status/${s.id}/comments`)
    commentsAuthor.value = res.data.is_author
    threads.value = res.data.threads
  } catch (e) { flash(errMsg(e, 'Could not load comments')) } finally { commentsLoading.value = false }
}
const openComments = () => { showComments.value = true; paused.value = true; loadComments() }
const closeComments = () => { showComments.value = false; paused.value = false }
const sendThreadReply = async (rootId: string) => {
  const s = current.value
  const text = threadReply[rootId]?.trim()
  if (!s || !text) return
  try {
    await $fetch(`/api/status/${s.id}/comments`, { method: 'POST', body: { content: text, replyTo: rootId } })
    threadReply[rootId] = ''
    await loadComments()
  } catch (e) { flash(errMsg(e, 'Could not send reply')) }
}
const reply = ref('')
const giftOpen = ref(false)
const giftAmount = ref(1)
const gifting = ref(false)
const reactMsg = ref('')
const flash = (msg: string) => { reactMsg.value = msg; setTimeout(() => { if (reactMsg.value === msg) reactMsg.value = '' }, 2500) }
const toggleLike = async () => {
  const s = current.value
  if (!s) return
  try {
    const res = await $fetch<{ data: { liked: boolean, count: number } }>(`/api/status/${s.id}/like`, { method: 'POST' })
    s.liked = res.data.liked
    s.like_count = res.data.count
  } catch (e) { flash(errMsg(e, 'Could not like')) }
}
const sendReply = async () => {
  const s = current.value
  const text = reply.value.trim()
  if (!s || !text) return
  try {
    await $fetch(`/api/status/${s.id}/comments`, { method: 'POST', body: { content: text } })
    reply.value = ''
    flash('Comment sent')
    if (showComments.value) await loadComments()
  } catch (e) { flash(errMsg(e, 'Could not send reply')) }
}
const sendGift = async () => {
  const s = current.value
  if (!s) return
  gifting.value = true
  try {
    await $fetch(`/api/status/${s.id}/gift`, { method: 'POST', body: { amount: giftAmount.value } })
    giftOpen.value = false
    paused.value = false
    flash(`Gifted ${giftAmount.value} PEW`)
  } catch (e) { flash(errMsg(e, 'Gift failed')) } finally { gifting.value = false }
}
let timer: ReturnType<typeof setInterval> | null = null
const current = computed(() => viewing.value?.statuses[index.value] ?? null)

const stopTimer = () => { if (timer) clearInterval(timer); timer = null }
const startTimer = (ms?: number) => {
  stopTimer()
  progress.value = 0
  const total = ms ?? (current.value?.media_type === 'text' ? TEXT_MS : IMAGE_MS)
  const started = Date.now()
  timer = setInterval(() => {
    if (showViewers.value || paused.value) return
    progress.value = Math.min(100, ((Date.now() - started) / total) * 100)
    if (progress.value >= 100) next()
  }, 50)
}
const onVideoMeta = () => {
  const d = videoEl.value?.duration
  startTimer(Number.isFinite(d) && d ? Math.min(d, 60) * 1000 : IMAGE_MS)
}

const markSeen = async () => {
  const s = current.value
  if (!s || !viewing.value) return
  viewerInfo.value = null
  showViewers.value = false
  if (viewing.value.is_me) {
    viewerInfo.value = (await $fetch<{ data: typeof viewerInfo.value }>(`/api/status/${s.id}`).catch(() => ({ data: null }))).data
  } else if (!s.viewed) {
    s.viewed = true
    viewing.value.all_viewed = viewing.value.statuses.every(x => x.viewed)
    $fetch(`/api/status/${s.id}`).catch(() => {})
  }
}

const show = async () => {
  progress.value = 0
  await nextTick()
  if (current.value?.media_type === 'text') startTimer()
  else stopTimer()
  markSeen()
}

const openGroup = (g: StatusGroup) => {
  viewing.value = g
  const firstUnseen = g.statuses.findIndex(s => !s.viewed)
  index.value = firstUnseen >= 0 ? firstUnseen : 0
  show()
}

const nextGroup = () => {
  const order = [...(myGroup.value ? [myGroup.value] : []), ...recent.value, ...viewedGroups.value]
  const at = order.findIndex(g => g === viewing.value)
  const following = order[at + 1]
  if (following && !viewing.value?.is_me) openGroup(following)
  else closeViewer()
}
const next = () => {
  if (!viewing.value) return
  if (index.value < viewing.value.statuses.length - 1) { index.value++; show() } else nextGroup()
}
const prev = () => { if (index.value > 0) { index.value--; show() } else show() }
const onViewerTap = (e: MouseEvent) => (e.clientX < window.innerWidth / 3 ? prev() : next())
const closeViewer = () => { stopTimer(); viewing.value = null; showViewers.value = false }
const toggleViewers = () => { showViewers.value = !showViewers.value }

const removeCurrent = async () => {
  const s = current.value
  if (!s || !confirm('Delete this status?')) return
  try {
    await $fetch(`/api/status/${s.id}`, { method: 'DELETE' })
    closeViewer()
    await load()
  } catch (e) {
    error.value = errMsg(e, 'Could not delete')
  }
}

onMounted(async () => {
  await load()
  const target = String(route.query.u || '')
  if (route.query.new === '1') composerOpen.value = true
  const g = route.query.mine === '1' ? myGroup.value : target ? groups.value.find(x => x.author.id === target) : null
  if (g) openGroup(g)
})
onBeforeUnmount(stopTimer)
</script>

<style scoped>
.st-page { max-width: 640px; margin: 0 auto; min-height: 100dvh; padding-bottom: 80px; color: var(--text-primary, #e2e8f0); }
.st-head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; position: sticky; top: 0; background: var(--bg-primary, #0f172a); z-index: 2; }
.st-head h1 { font-size: 1.25rem; font-weight: 700; margin: 0; }
.st-back { background: none; border: 0; color: inherit; padding: 4px; }
.st-mine { padding: 4px 16px 12px; border-bottom: 1px solid rgba(148,163,184,.15); }
.st-row { display: flex; align-items: center; gap: 12px; width: 100%; background: none; border: 0; color: inherit; padding: 10px 0; text-align: left; cursor: pointer; }
.st-ring { position: relative; width: 54px; height: 54px; border-radius: 50%; padding: 2px; background: conic-gradient(#22c55e, #16a34a, #22c55e); flex-shrink: 0; }
.st-ring.seen { background: #64748b; }
.st-ring.none { background: transparent; }
.st-ring img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid var(--bg-primary, #0f172a); }
.st-plus { position: absolute; right: -2px; bottom: -2px; width: 20px; height: 20px; border-radius: 50%; background: #22c55e; color: #fff; font-weight: 700; display: grid; place-items: center; border: 2px solid var(--bg-primary, #0f172a); font-size: 14px; }
.st-meta { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.st-meta strong { display: flex; align-items: center; font-size: .98rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.st-meta span { font-size: .8rem; color: #94a3b8; }
.st-actions { display: flex; gap: 8px; }
.st-chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; border: 1px solid rgba(148,163,184,.3); background: rgba(30,41,59,.6); color: inherit; font-size: .85rem; }
.st-list { padding: 8px 16px; }
.st-list h2 { font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; margin: 8px 0 0; }
.st-empty { padding: 32px 16px; text-align: center; color: #94a3b8; }
.st-error { margin: 8px 16px; color: #f87171; font-size: .85rem; }
.st-composer { position: fixed; inset: 0; z-index: 60; display: flex; flex-direction: column; height: 100dvh; transition: background .2s; }
.st-comp-top { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; gap: 12px; }
.st-comp-top button { background: none; border: 0; color: #fff; }
.st-colors { display: flex; gap: 8px; overflow-x: auto; }
.st-color { width: 26px; height: 26px; border-radius: 50%; border: 2px solid rgba(255,255,255,.4) !important; flex-shrink: 0; }
.st-color.on { border-color: #fff !important; transform: scale(1.15); }
.st-comp-body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; gap: 12px; min-height: 0; }
.st-comp-media { max-width: 100%; max-height: 60dvh; border-radius: 12px; object-fit: contain; }
.st-comp-body textarea { width: 100%; background: transparent; border: 0; color: #fff; font-size: 1.6rem; text-align: center; resize: none; outline: none; min-height: 120px; }
.st-comp-body textarea.caption { font-size: 1rem; min-height: 48px; background: rgba(0,0,0,.35); border-radius: 12px; padding: 10px; text-align: left; }
.st-comp-body textarea::placeholder { color: rgba(255,255,255,.6); }
.st-send { align-self: flex-end; margin: 0 16px calc(16px + env(safe-area-inset-bottom)); display: inline-flex; gap: 8px; align-items: center; padding: 12px 20px; border-radius: 999px; border: 0; background: #22c55e; color: #fff; font-weight: 600; }
.st-send:disabled { opacity: .5; }
.st-viewer { position: fixed; inset: 0; z-index: 70; background: #000; display: flex; flex-direction: column; height: 100dvh; user-select: none; }
.st-bars { display: flex; gap: 4px; padding: 10px 10px 0; padding-top: calc(10px + env(safe-area-inset-top)); }
.st-bar { flex: 1; height: 3px; background: rgba(255,255,255,.3); border-radius: 2px; overflow: hidden; }
.st-bar i { display: block; height: 100%; background: #fff; }
.st-vhead { display: flex; align-items: center; gap: 10px; padding: 10px 12px; color: #fff; }
.st-vhead img { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; }
.st-vhead button { background: none; border: 0; color: #fff; padding: 6px; }
.st-vbody { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; min-height: 0; }
.st-vbody img, .st-vbody video { max-width: 100%; max-height: 100%; object-fit: contain; }
.st-vtext { font-size: 1.7rem; text-align: center; padding: 24px; word-break: break-word; white-space: pre-wrap; }
.st-vcaption { position: absolute; bottom: 16px; left: 16px; right: 16px; text-align: center; color: #fff; background: rgba(0,0,0,.5); padding: 8px 12px; border-radius: 10px; }
.st-react { display: flex; align-items: center; gap: 8px; padding: 10px 12px calc(10px + env(safe-area-inset-bottom)); color: #fff; flex-wrap: wrap; position: relative; }
.st-react button { background: none; border: 0; color: #fff; display: inline-flex; align-items: center; gap: 4px; padding: 6px; flex-shrink: 0; }
.st-react button:disabled { opacity: .4; }
.st-like.on { color: #f43f5e; }
.st-react input { flex: 1; min-width: 0; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.25); border-radius: 999px; padding: 8px 12px; color: #fff; outline: none; }
.st-gift { display: flex; gap: 8px; width: 100%; }
.st-gift input { border-radius: 10px; }
.st-gift button { background: #22c55e !important; border-radius: 10px; padding: 8px 14px !important; font-weight: 600; }
.st-react-msg { width: 100%; margin: 0; font-size: .8rem; color: #a7f3d0; text-align: center; }
.st-own-actions { display: flex; align-items: center; gap: 14px; }
.st-own-actions span { display: inline-flex; align-items: center; gap: 4px; }
.st-comments-btn { display: inline-flex; align-items: center; gap: 4px; background: rgba(255,255,255,.14); border: 0; color: #fff; border-radius: 999px; padding: 6px 12px; }
.st-csheet { position: absolute; left: 0; right: 0; bottom: 0; max-height: 70dvh; overflow-y: auto; background: #0f172a; color: #e2e8f0; border-radius: 16px 16px 0 0; padding: 12px 14px calc(14px + env(safe-area-inset-bottom)); z-index: 5; }
.st-csheet header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.st-csheet header button { background: none; border: 0; color: inherit; }
.st-cempty { color: #94a3b8; text-align: center; padding: 16px 0; margin: 0; }
.st-thread { border-top: 1px solid rgba(148,163,184,.15); padding: 8px 0; }
.st-cmsg { display: flex; gap: 8px; padding: 4px 0; }
.st-cmsg.reply { margin-left: 34px; }
.st-cmsg img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.st-cmsg div { min-width: 0; }
.st-cmsg strong { font-size: .82rem; }
.st-cmsg p { margin: 2px 0; font-size: .88rem; overflow-wrap: anywhere; }
.st-cmsg small { color: #94a3b8; font-size: .72rem; }
.st-creply { display: flex; gap: 6px; margin: 6px 0 0 34px; }
.st-creply input { flex: 1; min-width: 0; background: #1e293b; border: 1px solid #334155; border-radius: 999px; padding: 7px 12px; color: #fff; outline: none; }
.st-creply button { background: #22c55e; border: 0; color: #fff; border-radius: 999px; padding: 6px 10px; }
.st-creply button:disabled { opacity: .4; }
.st-viewers { color: #fff; text-align: center; padding: 12px 12px calc(12px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.st-viewers ul { list-style: none; margin: 0; padding: 0; width: 100%; max-height: 40dvh; overflow-y: auto; text-align: left; background: #111827; border-radius: 12px; }
.st-viewers li { display: flex; align-items: center; gap: 10px; padding: 8px 12px; }
.st-viewers li img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; }
.st-viewers li small { margin-left: auto; color: #94a3b8; }
</style>
