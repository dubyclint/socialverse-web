<template>
  <div class="veep">
    <nav class="veep-top">
      <button v-for="t in tabs" :key="t.key" :class="{ on: tab === t.key }" @click="switchTab(t.key)">{{ t.label }}</button>
      <button class="veep-kebab" aria-label="Library" @click="openLibrary">⋮</button>
    </nav>

    <div ref="scroller" class="veep-scroll" @scroll.passive="onScroll">
      <section v-for="(it, i) in items" :key="keyOf(it, i)" class="veep-card" :data-i="i">
        <template v-if="it.type === 'post'">
          <VeepPlayer
            v-if="mediaOf(it.post)"
            :src="mediaOf(it.post)!"
            :video="isVideo(mediaOf(it.post)!)"
            :active="i === active"
            :near="i > active && i <= active + 2"
            :muted="muted"
            :low-data="lowData"
            @watched="w => track(it.post.id, w)"
            :engaged-seconds="adEngagedSeconds"
            @engaged="sec => requestViewAd(it.post.id, sec)"
          />
          <div v-if="viewAd && viewAd.postId === it.post.id" class="veep-view-ad" @click="viewAdClick">
            <img v-if="viewAd.ad.creativeUrl" :src="viewAd.ad.creativeUrl" alt="" @load="viewAdRendered" @error="settleViewAd('rendered_failed')">
            <div><small>Sponsored</small><b>{{ viewAd.ad.headline || viewAd.ad.title }}</b></div>
            <button aria-label="Close ad" @click.stop="viewAd = null">✕</button>
          </div>
          <div class="veep-meta">
            <NuxtLink v-if="it.post.author" :to="`/profile/${it.post.author.id}`" class="veep-handle veep-author">
              <span class="veep-author-name">{{ it.post.author.full_name || it.post.author.username }}</span>
              <VerifiedBadge v-if="it.post.author.verified" :type="it.post.author.verified_type" :size="15" />
              <small class="veep-author-user">@{{ it.post.author.username }}</small>
            </NuxtLink>
            <p class="veep-text" :class="{ open: openText === it.post.id }" @click="openText = openText === it.post.id ? null : it.post.id">{{ it.post.content }}</p>
            <p v-if="it.post.hashtags?.length" class="veep-tags">{{ it.post.hashtags.map(h => '#' + h).join(' ') }}</p>
          </div>
          <div class="veep-actions">
            <NuxtLink v-if="it.post.author" :to="hasUnseen(it.post.author.id) ? `/status?u=${it.post.author.id}` : `/profile/${it.post.author.id}`" class="veep-avatar" :class="{ ring: hasUnseen(it.post.author.id) }">
              <img :src="it.post.author.avatar_url || '/default-avatar.svg'" alt="">
              <span class="plus">+</span>
            </NuxtLink>
            <button :class="{ liked: it.post.liked_by_me }" @click="like(it.post)"><span class="ic">♥</span><small>{{ n(it.post.likes_count) }}</small></button>
            <button @click="openComments(it.post)"><span class="ic">💬</span><small>{{ n(it.post.comments_count) }}</small></button>
            <button :class="{ saved: saved.has(it.post.id) }" @click="toggleSave(it.post)"><span class="ic">🔖</span><small>{{ saved.has(it.post.id) ? 'Saved' : 'Save' }}</small></button>
            <button @click="share(it.post)"><span class="ic">↗</span><small>{{ n(it.post.shares_count) }}</small></button>
            <button @click="giftFor = it.post"><span class="ic">🎁</span><small>{{ n(it.post.gifts_count) }}</small></button>
            <button v-if="dl(it.post).allow_download !== false" @click="download(it.post)"><span class="ic">⬇</span><small>Download</small></button>
            <button @click="muted = !muted"><span class="ic">{{ muted ? '🔇' : '🔊' }}</span></button>
            <button aria-label="More" @click="menuFor = it.post"><span class="ic">⋯</span><small>More</small></button>
          </div>
        </template>

        <template v-else-if="it.type === 'ad'">
          <VeepPlayer
            v-if="it.ad.media?.[0]"
            :src="it.ad.media[0].url"
            :video="it.ad.media[0].type === 'video'"
            :active="i === active"
            :near="i > active && i <= active + 2"
            :muted="muted"
            :low-data="lowData"
          />
          <img v-else-if="it.ad.creativeUrl" :src="it.ad.creativeUrl" :alt="it.ad.headline || 'Sponsored'" class="veep-ad-fallback" />
          <div v-else class="veep-ad-fallback veep-ad-card"><strong>{{ it.ad.headline || it.ad.advertiser.name }}</strong></div>
          <div class="veep-meta">
            <span class="veep-sponsored">Sponsored</span>
            <span class="veep-handle">{{ it.ad.advertiser.name }}</span>
            <p class="veep-text">{{ it.ad.primaryText || it.ad.headline }}</p>
            <a v-if="it.ad.destinationUrl" :href="it.ad.destinationUrl" target="_blank" rel="noopener sponsored" class="veep-cta" @click="adClick(it.ad.id)">{{ it.ad.cta || 'Learn more' }}</a>
          </div>
        </template>
      </section>
      <div v-if="loading" class="veep-empty">Loading…</div>
      <div v-else-if="!items.length" class="veep-empty">No veeps here yet. Try another tab.</div>
    </div>

    <nav class="veep-bottom">
      <NuxtLink to="/feed">🏠<small>Home</small></NuxtLink>
      <NuxtLink to="/chat">💬<small>Chat</small></NuxtLink>
      <NuxtLink to="/wallet">👛<small>Wallet</small></NuxtLink>
      <NuxtLink to="/posts/create" class="veep-create">＋<small>Create</small></NuxtLink>
      <NuxtLink to="/stream">🔴<small>Live</small></NuxtLink>
    </nav>

    <!-- Comments bottom sheet -->
    <div v-if="commentsFor" class="sheet-bg" @click.self="commentsFor = null">
      <div class="sheet">
        <header>{{ comments.length }} comments <button @click="commentsFor = null">✕</button></header>
        <ul>
          <li v-for="c in comments" :key="c.id"><b>@{{ c.author.username }}</b> {{ c.content }}</li>
          <li v-if="!comments.length" class="muted">Be the first to comment</li>
        </ul>
        <form @submit.prevent="sendComment"><input v-model="draft" maxlength="1000" placeholder="Add a comment…"><button :disabled="!draft.trim()">Send</button></form>
      </div>
    </div>

    <!-- Gift -->
    <div v-if="giftFor" class="sheet-bg" @click.self="giftFor = null">
      <div class="sheet small">
        <header>Gift PEW to @{{ giftFor.author?.username }} <button @click="giftFor = null">✕</button></header>
        <div class="gift-row"><button v-for="a in [1, 5, 10, 50]" :key="a" @click="gift(a)">{{ a }} PEW</button></div>
        <p v-if="giftMsg" class="muted">{{ giftMsg }}</p>
      </div>
    </div>

    <!-- Meatball menu -->
    <div v-if="menuFor" class="sheet-bg" @click.self="menuFor = null">
      <div class="sheet small">
        <header>Options <button @click="menuFor = null">✕</button></header>
        <label class="opt">Quality
          <select v-model="quality"><option value="auto">Auto</option><option value="data">Data saver</option><option value="high">High</option></select>
        </label>
        <label v-if="dl(menuFor).is_mine" class="opt">Allow viewers to download
          <input type="checkbox" class="dl-tick" :checked="dl(menuFor).allow_download !== false" @change="setDownload(menuFor, ($event.target as HTMLInputElement).checked)" />
        </label>
        <NuxtLink class="opt" :to="`/support?post=${menuFor.id}`">Support / report</NuxtLink>
        <button class="opt" @click="report(menuFor)">Report this veep</button>
        <button class="opt" @click="hide(menuFor)">Hide this veep</button>
      </div>
    </div>

    <!-- Library -->
    <div v-if="libOpen" class="sheet-bg" @click.self="libOpen = false">
      <div class="sheet">
        <header>Library <button @click="libOpen = false">✕</button></header>
        <div class="lib-tabs"><button v-for="k in libKinds" :key="k" :class="{ on: libKind === k }" @click="loadLibrary(k)">{{ k }}</button></div>
        <div class="lib-grid">
          <NuxtLink v-for="p in library" :key="p.id" :to="`/veep?start=${p.id}`" class="lib-cell" @click="libOpen = false">
            <video v-if="p.media_urls?.[0] && isVideo(p.media_urls[0])" :src="p.media_urls[0]" preload="metadata" muted />
            <img v-else-if="p.media_urls?.[0]" :src="p.media_urls[0]" alt="" loading="lazy">
            <span>▶ {{ n(p.views_count || 0) }}</span>
          </NuxtLink>
          <p v-if="!library.length" class="muted">Nothing here yet</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VerifiedBadge from '~/components/VerifiedBadge.vue'
import { useStatusRings } from '~/composables/useStatusRings'
import VeepPlayer from '~/components/veep/veep-player.vue'
import type { FeedItem, RankedPost } from '~/server/utils/feed-ranker'

definePageMeta({ layout: false })
useHead({ title: 'Veep · Viorp' })

const route = useRoute()
const { hasUnseen } = useStatusRings()
const tabs = [{ key: 'veep', label: 'Veep' }, { key: 'global', label: 'Global' }, { key: 'trend', label: 'Trend' }, { key: 'hood', label: 'Hood' }] as const
type TabKey = typeof tabs[number]['key']
const tab = ref<TabKey>('veep')
const items = ref<FeedItem[]>([])
const page = ref(0)
const hasMore = ref(true)
const loading = ref(false)
const active = ref(0)
const muted = ref(false)
const scroller = ref<HTMLElement | null>(null)
const openText = ref<string | null>(null)
const saved = ref(new Set<string>())
const quality = ref<'auto' | 'data' | 'high'>('auto')
const downlink = ref<number | null>(null)
const lowData = computed(() => quality.value === 'data' || (quality.value === 'auto' && downlink.value !== null && downlink.value < 1.5))

const VIDEO = /\.(mp4|webm|mov|m4v|m3u8)(\?|#|$)/i
const isVideo = (u: string) => VIDEO.test(u)
const mediaOf = (p: RankedPost) => p.media.find(isVideo) ?? p.media[0] ?? null
const n = (v: number) => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : String(v ?? 0)
type DlPost = RankedPost & { allow_download?: boolean, is_mine?: boolean }
const dl = (p: RankedPost) => p as DlPost
const download = async (p: RankedPost) => {
  const url = mediaOf(p)
  if (!url) return
  try {
    const blob = await (await fetch(url)).blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `viorp-${p.id}.${(url.split('?')[0]?.split('.').pop() || 'mp4').slice(0, 4)}`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  } catch { window.open(url, '_blank', 'noopener') }
}
const setDownload = async (p: RankedPost, allow: boolean) => {
  try {
    const r = await $fetch<{ allow_download: boolean }>('/api/veep/download', { method: 'POST', body: { postId: p.id, allow } })
    dl(p).allow_download = r.allow_download
  } catch { /* unchanged */ }
}
const keyOf = (it: FeedItem, i: number) => it.type === 'post' ? it.post.id : it.type === 'ad' ? 'ad-' + it.ad.id + '-' + i : 'x' + i

const load = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true
  try {
    const r = await $fetch<{ items: FeedItem[], hasMore: boolean }>('/api/veep/feed', { query: { tab: tab.value, page: page.value, start: page.value === 0 ? route.query.start : undefined } })
    const seen = new Set(items.value.filter(x => x.type === 'post').map(x => (x as { post: RankedPost }).post.id))
    items.value.push(...r.items.filter(x => x.type !== 'post' || !seen.has(x.post.id)))
    hasMore.value = r.hasMore
    page.value++
  } catch (e: unknown) {
    if ((e as { statusCode?: number }).statusCode === 401) navigateTo('/login')
    hasMore.value = false
  } finally { loading.value = false }
}

const switchTab = (k: TabKey) => {
  if (tab.value === k) return
  tab.value = k; items.value = []; page.value = 0; hasMore.value = true; active.value = 0
  scroller.value?.scrollTo({ top: 0 })
  load()
}

let raf = 0
const onScroll = () => {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    const el = scroller.value
    if (!el) return
    active.value = Math.round(el.scrollTop / el.clientHeight)
    if (active.value >= items.value.length - 4) load()
  })
}

// Interaction vector: watch time / completion / loops go to the server and tune later pages.
const track = (postId: string, w: { watchMs: number, completed: boolean, loops: number }) => {
  $fetch('/api/veep/event', { method: 'POST', body: { postId, kind: 'watch', ...w } }).catch(() => {})
}

const like = async (p: RankedPost) => {
  const want = !p.liked_by_me
  p.liked_by_me = want; p.likes_count += want ? 1 : -1
  try {
    const r = await $fetch<{ data: { liked: boolean, likesCount: number } }>(`/api/posts/${p.id}/like`, { method: 'POST', body: { liked: want } })
    p.liked_by_me = r.data.liked; p.likes_count = r.data.likesCount
    $fetch('/api/veep/event', { method: 'POST', body: { postId: p.id, kind: r.data.liked ? 'like' : 'unlike' } }).catch(() => {})
  } catch { p.liked_by_me = !want; p.likes_count += want ? -1 : 1 }
}

const toggleSave = (p: RankedPost) => {
  const on = !saved.value.has(p.id)
  const next = new Set(saved.value); if (on) next.add(p.id); else next.delete(p.id); saved.value = next
  $fetch('/api/veep/event', { method: 'POST', body: { postId: p.id, kind: on ? 'save' : 'unsave' } }).catch(() => {})
}

const share = async (p: RankedPost) => {
  const url = `${location.origin}/veep?start=${p.id}`
  try {
    if (navigator.share) await navigator.share({ url, text: p.content?.slice(0, 100) })
    else await navigator.clipboard.writeText(url)
    await $fetch(`/api/posts/${p.id}/share`, { method: 'POST', body: { platform: 'copy' } }).catch(() => {})
    p.shares_count++
    $fetch('/api/veep/event', { method: 'POST', body: { postId: p.id, kind: 'share' } }).catch(() => {})
  } catch { /* share cancelled */ }
}

interface Comment { id: string, content: string, author: { username: string } }
const commentsFor = ref<RankedPost | null>(null)
const comments = ref<Comment[]>([])
const draft = ref('')
const openComments = async (p: RankedPost) => {
  commentsFor.value = p; comments.value = []
  try { comments.value = (await $fetch<{ data: Comment[] }>(`/api/posts/${p.id}/comments`)).data } catch { /* empty */ }
}
const sendComment = async () => {
  const p = commentsFor.value
  if (!p || !draft.value.trim()) return
  const content = draft.value.trim(); draft.value = ''
  try {
    await $fetch(`/api/posts/${p.id}/comments`, { method: 'POST', body: { content } })
    p.comments_count++
    await openComments(p)
  } catch { draft.value = content }
}

const giftFor = ref<RankedPost | null>(null)
const giftMsg = ref('')
const gift = async (amount: number) => {
  const p = giftFor.value
  if (!p) return
  giftMsg.value = 'Sending…'
  try {
    await $fetch(`/api/posts/${p.id}/pewgift`, { method: 'POST', body: { amount } })
    p.gifts_count++; giftMsg.value = `Sent ${amount} PEW`
    setTimeout(() => { giftFor.value = null; giftMsg.value = '' }, 900)
  } catch (e: unknown) { giftMsg.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Gift failed' }
}

const menuFor = ref<RankedPost | null>(null)
const report = async (p: RankedPost) => {
  await $fetch(`/api/posts/${p.id}/report`, { method: 'POST', body: { reason: 'inappropriate' } }).catch(() => {})
  hide(p)
}
const hide = (p: RankedPost) => {
  items.value = items.value.filter(x => x.type !== 'post' || x.post.id !== p.id)
  menuFor.value = null
}

const libKinds = ['watched', 'liked', 'saved', 'shared'] as const
const libOpen = ref(false)
const libKind = ref<typeof libKinds[number]>('watched')
const library = ref<{ id: string, media_urls: string[] | null, views_count: number }[]>([])
const loadLibrary = async (k: typeof libKinds[number]) => {
  libKind.value = k
  try { library.value = (await $fetch<{ items: typeof library.value }>('/api/veep/library', { query: { kind: k } })).items } catch { library.value = [] }
}
const openLibrary = () => { libOpen.value = true; loadLibrary('watched') }

const adTrack = (id: string, interactionType: 'IMPRESSION' | 'CLICK') => { $fetch('/api/ads/track', { method: 'POST', body: { campaignId: id, interactionType, placement: 'veep' } }).catch(() => {}) }
const adClick = (id: string) => adTrack(id, 'CLICK')

// Sutoi G: at the engaged mark, request one ad for this view. The server decides house vs network ads
// by DAU; if nothing renders within the admin fill timeout the request settles as 'no_ad' (no credit).
interface ViewAd { postId: string, requestId: string, ad: { id: string, creativeUrl?: string | null, headline?: string | null, title?: string | null } }
const viewAd = ref<ViewAd | null>(null)
const adEngagedSeconds = ref(6)
onMounted(() => { $fetch<{ ad_engaged_s?: number }>('/api/veep/settings').then((s) => { if (s.ad_engaged_s) adEngagedSeconds.value = s.ad_engaged_s }).catch(() => {}) })
let viewAdTimer: ReturnType<typeof setTimeout> | null = null
let viewAdSettled = true
const settleViewAd = (status: 'rendered' | 'no_ad' | 'rendered_failed') => {
  if (viewAdSettled || !viewAd.value) return
  viewAdSettled = true
  if (viewAdTimer) { clearTimeout(viewAdTimer); viewAdTimer = null }
  $fetch('/api/veep/ad-result', { method: 'POST', body: { adRequestId: viewAd.value.requestId, status } }).catch(() => {})
  if (status !== 'rendered') viewAd.value = null
  else { const id = viewAd.value.ad.id; adTrack(id, 'IMPRESSION'); setTimeout(() => { if (viewAd.value?.ad.id === id) viewAd.value = null }, 5000) }
}
const viewAdRendered = () => settleViewAd('rendered')
const viewAdClick = () => { if (viewAd.value) adClick(viewAd.value.ad.id) }
const requestViewAd = async (postId: string, seconds: number) => {
  try {
    const r = await $fetch<{ adRequestId: string | null, ad: ViewAd['ad'] | null, timeoutMs?: number }>('/api/veep/ad-request', { method: 'POST', body: { postId, watchSeconds: seconds } })
    if (!r.adRequestId) return
    if (!r.ad) { await $fetch('/api/veep/ad-result', { method: 'POST', body: { adRequestId: r.adRequestId, status: 'no_ad' } }).catch(() => {}); return }
    viewAdSettled = false
    viewAd.value = { postId, requestId: r.adRequestId, ad: r.ad }
    viewAdTimer = setTimeout(() => settleViewAd('no_ad'), r.timeoutMs ?? 3500)
    if (!r.ad.creativeUrl) settleViewAd('rendered')
  } catch { /* not engaged / rate limited */ }
}
const adSeen = new Set<string>()
watch(active, (i) => {
  const it = items.value[i]
  if (it?.type === 'ad' && !adSeen.has(it.ad.id)) { adSeen.add(it.ad.id); adTrack(it.ad.id, 'IMPRESSION') }
})

watch(() => route.query.start, () => { items.value = []; page.value = 0; hasMore.value = true; active.value = 0; scroller.value?.scrollTo({ top: 0 }); load() })

onMounted(() => {
  const c = (navigator as Navigator & { connection?: { downlink?: number, addEventListener?: (e: string, f: () => void) => void } }).connection
  if (c) { downlink.value = c.downlink ?? null; c.addEventListener?.('change', () => { downlink.value = c.downlink ?? null }) }
  const t = String(route.query.tab ?? '')
  if (tabs.some(x => x.key === t)) tab.value = t as TabKey
  load()
})
</script>

<style scoped>
.veep { position: fixed; inset: 0; background: #000; color: #fff; z-index: 50; }
.veep-scroll { height: 100dvh; overflow-y: scroll; scroll-snap-type: y mandatory; overscroll-behavior: contain; scrollbar-width: none; }
.veep-scroll::-webkit-scrollbar { display: none; }
.veep-card { position: relative; height: 100dvh; scroll-snap-align: start; scroll-snap-stop: always; overflow: hidden; }
.veep-top { position: absolute; top: 0; left: 0; right: 0; z-index: 20; display: flex; justify-content: center; gap: 4px; padding: calc(env(safe-area-inset-top) + 8px) 44px 8px; background: linear-gradient(rgba(0,0,0,.45), transparent); backdrop-filter: blur(2px); }
.veep-top button { color: rgba(255,255,255,.7); font-weight: 600; font-size: 15px; padding: 4px 10px; background: none; border: 0; }
.veep-top button.on { color: #fff; border-bottom: 2px solid #fff; }
.veep-top .veep-kebab { position: absolute; right: 8px; font-size: 22px; border: 0; }
.veep-meta { position: absolute; left: 14px; bottom: calc(env(safe-area-inset-bottom) + 72px); z-index: 10; max-width: 70%; text-shadow: 0 1px 3px rgba(0,0,0,.6); }
.veep-handle { font-weight: 700; color: #fff; text-decoration: none; display: block; margin-bottom: 4px; }
.veep-text { font-size: 14px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; }
.veep-text.open { -webkit-line-clamp: unset; max-height: 40vh; overflow-y: auto; }
.veep-tags { font-size: 13px; font-weight: 600; margin: 4px 0 0; }
.veep-sponsored { font-size: 11px; background: rgba(255,255,255,.2); padding: 1px 6px; border-radius: 4px; }
.veep-cta { display: inline-block; margin-top: 8px; background: #3b82f6; color: #fff; padding: 6px 14px; border-radius: 6px; font-weight: 600; text-decoration: none; }
.veep-actions { position: absolute; right: 10px; bottom: calc(env(safe-area-inset-bottom) + 96px); z-index: 10; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.veep-actions button { display: flex; flex-direction: column; align-items: center; background: none; border: 0; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.6); min-height: 0; }
.veep-actions .ic { font-size: 28px; line-height: 1; }
.veep-actions small { font-size: 11px; font-weight: 600; margin-top: 2px; }
.veep-actions .liked .ic { color: #ef4444; }
.veep-actions .saved .ic { filter: hue-rotate(40deg) saturate(2); }
.veep-avatar { position: relative; display: block; width: 46px; height: 46px; }
.veep-avatar.ring img { border-color: #3b82f6; box-shadow: 0 0 0 2px #3b82f6; }
.veep-avatar img { width: 46px; height: 46px; border-radius: 50%; border: 2px solid #fff; object-fit: cover; }
.veep-avatar .plus { position: absolute; bottom: -7px; left: 50%; transform: translateX(-50%); width: 18px; height: 18px; border-radius: 50%; background: #3b82f6; color: #fff; font-size: 14px; line-height: 18px; text-align: center; font-weight: 700; }
.veep-view-ad { position: absolute; left: 12px; right: 72px; top: calc(env(safe-area-inset-top) + 56px); z-index: 15; display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 12px; background: rgba(0,0,0,.7); color: #fff; }
.veep-view-ad img { width: 48px; height: 48px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.veep-view-ad div { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.veep-view-ad b { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.veep-view-ad small { font-size: 10px; opacity: .7; }
.veep-view-ad button { background: none; border: 0; color: #fff; min-height: 0; }
.veep-bottom { position: absolute; bottom: 0; left: 0; right: 0; z-index: 20; display: flex; justify-content: space-around; padding: 6px 0 calc(env(safe-area-inset-bottom) + 6px); background: rgba(0,0,0,.75); }
.veep-bottom a { display: flex; flex-direction: column; align-items: center; color: #fff; text-decoration: none; font-size: 20px; }
.veep-bottom small { font-size: 10px; }
.veep-empty { height: 100dvh; display: flex; align-items: center; justify-content: center; color: #aaa; }
.sheet-bg { position: absolute; inset: 0; z-index: 40; background: rgba(0,0,0,.4); display: flex; align-items: flex-end; }
.sheet { width: 100%; max-height: 70dvh; background: #111827; border-radius: 14px 14px 0 0; display: flex; flex-direction: column; animation: up .2s ease-out; }
.sheet.small { max-height: 50dvh; }
.sheet header { display: flex; justify-content: space-between; padding: 12px 14px; font-weight: 700; border-bottom: 1px solid #1f2937; }
.sheet header button { background: none; border: 0; color: #fff; }
.sheet ul { flex: 1; overflow-y: auto; list-style: none; margin: 0; padding: 8px 14px; font-size: 14px; }
.sheet li { padding: 6px 0; }
.sheet form { display: flex; gap: 8px; padding: 10px 14px calc(env(safe-area-inset-bottom) + 10px); border-top: 1px solid #1f2937; }
.sheet form input { flex: 1; background: #1f2937; border: 0; border-radius: 20px; padding: 8px 14px; color: #fff; }
.sheet form button { background: #3b82f6; color: #fff; border: 0; border-radius: 20px; padding: 0 14px; }
.muted { color: #9ca3af; }
.gift-row { display: flex; gap: 8px; padding: 14px; flex-wrap: wrap; }
.gift-row button { flex: 1; background: #1f2937; color: #fff; border: 1px solid #374151; border-radius: 10px; padding: 10px; font-weight: 600; }
.opt { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 12px 14px; background: none; border: 0; border-bottom: 1px solid #1f2937; color: #fff; text-align: left; text-decoration: none; font-size: 14px; }
.opt select { background: #1f2937; color: #fff; border: 0; border-radius: 6px; padding: 4px; }
.lib-tabs { display: flex; gap: 6px; padding: 8px 14px; }
.lib-tabs button { text-transform: capitalize; background: #1f2937; color: #ccc; border: 0; border-radius: 14px; padding: 4px 12px; font-size: 13px; }
.lib-tabs button.on { background: #fff; color: #000; }
.lib-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; overflow-y: auto; padding: 0 2px 10px; }
.lib-cell { position: relative; aspect-ratio: 9/16; background: #1f2937; overflow: hidden; }
.lib-cell img, .lib-cell video { width: 100%; height: 100%; object-fit: cover; }
.lib-cell span { position: absolute; left: 4px; bottom: 4px; font-size: 11px; color: #fff; text-shadow: 0 1px 2px #000; }
@keyframes up { from { transform: translateY(100%) } }
.veep-actions { bottom: calc(env(safe-area-inset-bottom) + 76px) !important; max-height: 66dvh; gap: 10px !important; justify-content: flex-end; }
.veep-actions .ic { font-size: 24px !important; }
.veep-actions .veep-avatar img { width: 40px; height: 40px; }
.veep-create { font-weight: 700; }
.dl-tick { width: 14px; height: 14px; min-height: 0; accent-color: #3b82f6; }
.veep-ad-fallback { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #000; }
.veep-ad-card { display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center; font-size: 22px; background: linear-gradient(160deg, #1e3a8a, #7c3aed); }
.veep-author { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; min-width: 0; max-width: 100%; }
.veep-author-name { min-width: 0; max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.veep-author :deep(svg), .veep-author img { flex-shrink: 0; }
.veep-author-user { flex-basis: 100%; font-weight: 500; font-size: 12px; opacity: .8; }
</style>
