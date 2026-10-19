<template>
  <div class="page-view">
    <button type="button" class="back" @click="$router.back()"><Icon name="arrow-left" size="18" /> Back</button>
    <div v-if="loading" class="state-card">Loading Page…</div>
    <div v-else-if="error" class="state-card error">{{ error }}</div>
    <template v-else-if="page">
      <div class="cover" :class="{ empty: !page.cover_url }" :style="page.cover_url ? { backgroundImage: `url(${page.cover_url})` } : {}" role="img" aria-label="Cover photo" @click="page.cover_url && (photoSrc = page.cover_url)">
        <label v-if="canEdit" class="cover-edit" @click.stop><Icon name="camera" size="14" /> {{ page.cover_url ? 'Change cover' : 'Add cover photo' }}<input type="file" accept="image/*" hidden @change="onCover"></label>
      </div>

      <section class="profile-header">
        <div class="avatar-wrap">
          <img :src="page.avatar_url || '/default-avatar.svg'" :alt="page.name" class="avatar" title="View photo" @click="photoSrc = page.avatar_url">
          <label v-if="canEdit" class="avatar-edit" title="Change Page photo"><Icon name="camera" size="14" /><input type="file" accept="image/*" hidden @change="onAvatar"></label>
        </div>
        <div class="identity">
          <h1>{{ page.name }} <VerifiedBadge v-if="page.is_verified" :type="page.verified_type" :size="20" /></h1>
          <p class="username">@{{ page.handle }}<span v-if="page.category"> · {{ page.category }}</span> <span class="page-tag">Page</span></p>
          <p v-if="page.owner?.username" class="muted">Linked to <NuxtLink :to="`/profile/${page.owner.username}`" class="owner-link">{{ page.owner.display_name || page.owner.full_name || page.owner.username }}</NuxtLink> <VerifiedBadge v-if="page.owner.is_verified" :type="page.owner.verified_type" :size="14" /></p>
          <p v-if="page.bio" class="bio">{{ page.bio }}</p>

          <div class="stats">
            <span class="stat static"><strong>{{ page.posts_count }}</strong> Posts</span>
            <button type="button" class="stat" @click="openFollowers"><strong>{{ page.followers_count }}</strong> Followers</button>
          </div>

          <div class="actions">
            <template v-if="page.viewer_role">
              <button type="button" class="btn" @click="postAsPage"><Icon name="plus" size="16" /> Post as Page</button>
              <button type="button" class="btn secondary" @click="actAs">{{ isActive ? 'Acting as this Page' : 'Act as this Page' }}</button>
              <NuxtLink to="/chat" class="btn secondary"><Icon name="message-circle" size="16" /> Inbox</NuxtLink>
              <button v-if="canEdit" type="button" class="btn secondary" @click="tab = 'manage'"><Icon name="settings" size="16" /> Edit Page</button>
            </template>
            <template v-else>
              <button type="button" class="btn" :disabled="busy" @click="toggleFollow">{{ page.is_following ? 'Following' : 'Follow' }}</button>
              <button type="button" class="btn secondary" :disabled="busy" @click="messagePage"><Icon name="message-circle" size="16" /> Message</button>
            </template>
            <button type="button" class="btn secondary" @click="sharePage"><Icon name="share" size="16" /> Share</button>
          </div>
          <p v-if="page.viewer_role" class="muted role-line">You are {{ page.viewer_role.toLowerCase() === 'owner' ? 'the owner' : `a ${page.viewer_role.toLowerCase()}` }} of this Page.</p>
          <p v-if="notice" class="notice">{{ notice }}</p>
        </div>
      </section>

      <section v-if="canEdit && setupSteps.some(step => !step.done)" class="card setup">
        <h2>Finish setting up {{ page.name }}</h2>
        <button v-for="step in setupSteps" :key="step.label" type="button" class="setup-step" :class="{ done: step.done }" :disabled="step.done" @click="step.action()">
          <span>{{ step.done ? '✓' : '○' }}</span> {{ step.label }}
        </button>
      </section>

      <nav class="tabs">
        <button type="button" :class="{ active: tab === 'posts' }" @click="tab = 'posts'">Posts</button>
        <button type="button" :class="{ active: tab === 'about' }" @click="tab = 'about'">About</button>
        <button v-if="page.viewer_role" type="button" :class="{ active: tab === 'manage' }" @click="tab = 'manage'">Manage</button>
      </nav>

      <section v-if="tab === 'posts'" class="posts">
        <PlacementAd v-if="!page.viewer_role" placement="page" :context-text="page.bio" />
        <div v-if="!posts.length" class="state-card">
          <p>No posts yet.</p>
          <button v-if="page.viewer_role" type="button" class="btn" @click="postAsPage">Create the first post</button>
        </div>
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
        <button v-if="hasMore" type="button" class="btn small" @click="loadPosts()">Load more</button>
      </section>

      <section v-else-if="tab === 'about'" class="card about">
        <h2>About</h2>
        <p v-if="page.bio" class="bio">{{ page.bio }}</p>
        <p v-if="page.category"><Icon name="tag" size="14" /> {{ page.category }}</p>
        <p v-if="page.location"><Icon name="map-pin" size="14" /> {{ page.location }}</p>
        <p v-if="page.website"><Icon name="link" size="14" /> <a :href="page.website" target="_blank" rel="noopener nofollow">{{ page.website.replace(/^https?:\/\//, '') }}</a></p>
        <p v-if="page.contact_email"><Icon name="mail" size="14" /> <a :href="`mailto:${page.contact_email}`">{{ page.contact_email }}</a></p>
        <p v-if="page.contact_phone"><Icon name="phone" size="14" /> <a :href="`tel:${page.contact_phone}`">{{ page.contact_phone }}</a></p>
        <p v-if="page.founded_year"><Icon name="calendar" size="14" /> Founded {{ page.founded_year }}</p>
        <p><Icon name="flag" size="14" /> Page created {{ new Date(page.created_at).toLocaleDateString() }}</p>
        <p v-if="!hasAbout && !page.bio" class="muted">No details yet.<button v-if="canEdit" type="button" class="inline-link" @click="tab = 'manage'">Add details</button></p>
      </section>

      <template v-else-if="tab === 'manage' && page.viewer_role">
        <form v-if="canEdit" ref="editForm" class="card" @submit.prevent="save">
          <h2>Page details</h2>
          <label>Name<input v-model.trim="edit.name" maxlength="80" required></label>
          <label>Category<input v-model.trim="edit.category" placeholder="e.g. Media, Shop, Church, Music" maxlength="60"></label>
          <label>About<textarea v-model.trim="edit.bio" placeholder="What is this Page about?" maxlength="500" rows="3" /></label>
          <label>Website<input v-model.trim="edit.website" placeholder="https://" maxlength="300"></label>
          <label>Location<input v-model.trim="edit.location" maxlength="120"></label>
          <label>Contact email<input v-model.trim="edit.contact_email" type="email" maxlength="200"></label>
          <label>Contact phone<input v-model.trim="edit.contact_phone" type="tel" maxlength="40"></label>
          <label>Year founded<input v-model.number="edit.founded_year" type="number" min="1800" :max="new Date().getFullYear()"></label>
          <div class="photo-row">
            <label class="file-btn"><Icon name="camera" size="14" /> Page photo<input type="file" accept="image/*" hidden @change="onAvatar"></label>
            <label class="file-btn"><Icon name="image" size="14" /> Cover photo<input type="file" accept="image/*" hidden @change="onCover"></label>
          </div>
          <button type="submit" class="btn" :disabled="busy">{{ busy ? 'Saving…' : 'Save details' }}</button>
        </form>

        <VerificationRequestCard v-if="page.viewer_role === 'OWNER'" :page-id="page.id" />

        <section v-if="canEdit && wallet" class="card">
          <h2>Page wallet</h2>
          <div class="wallet-row">
            <div><span class="muted">Balance</span><strong>{{ wallet.balance.toFixed(2) }} PEW</strong></div>
            <div><span class="muted">Withdrawable earnings</span><strong>{{ wallet.withdrawable_pew.toFixed(2) }} PEW</strong><small class="muted">≈ ${{ wallet.withdrawable_usd.toFixed(2) }} after fees</small></div>
          </div>
          <p class="muted">Gifts on this Page's posts land here (minus the {{ wallet.gift_fee_pct }}% gift fee). While acting as this Page, gifts you send come from this wallet.</p>
          <form class="inline" @submit.prevent="walletAction('fund')">
            <input v-model.number="walletAmount" type="number" min="0" step="0.01" placeholder="Amount (PEW)">
            <button type="submit" class="btn small" :disabled="busy">Add from my wallet</button>
            <button v-if="page.viewer_role === 'OWNER'" type="button" class="btn small" :disabled="busy || wallet.withdrawable_pew <= 0" @click="walletAction('payout')">Pay earnings to me</button>
          </form>
          <div v-for="item in wallet.items" :key="item.id" class="admin">
            <span>{{ item.label }}<span v-if="item.counterpart" class="muted"> · {{ item.counterpart }}</span><small class="muted"> · {{ new Date(item.created_at).toLocaleDateString() }}</small></span>
            <span :class="item.direction === 'in' ? 'in' : 'out'">{{ item.direction === 'in' ? '+' : '-' }}{{ item.amount.toFixed(2) }}</span>
          </div>
        </section>

        <section v-if="page.viewer_role === 'OWNER'" class="card">
          <h2>Admins</h2>
          <div v-for="a in admins" :key="a.user_id" class="admin">
            <span>@{{ a.user?.username }} · {{ a.role.toLowerCase() }}</span>
            <button type="button" class="link" @click="removeAdmin(a.user_id)">Remove</button>
          </div>
          <form class="inline" @submit.prevent="addAdmin">
            <input v-model.trim="newAdmin.username" placeholder="username">
            <select v-model="newAdmin.role"><option>MANAGER</option><option>MODERATOR</option><option>OWNER</option></select>
            <button type="submit" class="btn small">Add</button>
          </form>
          <button type="button" class="danger" @click="removePage">Delete Page</button>
        </section>
      </template>
    </template>
    <div v-if="followersOpen" class="sheet-backdrop" @click.self="followersOpen = false">
      <div class="sheet" role="dialog" aria-label="Followers">
        <div class="sheet-head"><h2>Followers</h2><button type="button" class="link" @click="followersOpen = false">Close</button></div>
        <p v-if="followersLoading" class="muted">Loading…</p>
        <p v-else-if="!followers.length" class="muted">No followers yet.</p>
        <NuxtLink v-for="f in followers" :key="f.id" :to="`/profile/${f.username || f.id}`" class="follower">
          <img :src="f.avatar_url || '/default-avatar.svg'" alt="">
          <span>{{ f.name }} <VerifiedBadge v-if="f.is_verified" :type="f.verified_type" :size="14" /></span>
          <span class="muted">@{{ f.username }}</span>
        </NuxtLink>
      </div>
    </div>
    <MediaLightbox :src="photoSrc" :alt="page?.name" @close="photoSrc = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import PostCard from '~/components/posts/post-card.vue'
import PlacementAd from '~/components/ads/placement-ad.vue'
import VerifiedBadge from '~/components/VerifiedBadge.vue'
import VerificationRequestCard from '~/components/verification-request-card.vue'
import MediaLightbox from '~/components/chat/media-lightbox.vue'
import type { FeedPost } from '~/composables/useSocialFeed'
import { useFileUpload } from '~/composables/use-file-upload'
import { useContextStore } from '~/stores/context'

interface PageView {
  id: string, name: string, handle: string, category: string | null, bio: string | null, avatar_url: string | null
  followers_count: number, posts_count: number, viewer_role: 'OWNER' | 'MANAGER' | 'MODERATOR' | null, is_following: boolean
  is_verified?: boolean | null, verified_type?: string | null
  cover_url: string | null, website: string | null, location: string | null, contact_email: string | null
  contact_phone: string | null, founded_year: number | null, created_at: string
  owner?: { user_id: string, username: string | null, display_name: string | null, full_name: string | null, avatar_url: string | null, is_verified: boolean | null, verified_type: string | null } | null
}
interface Follower { id: string, username: string | null, name: string, avatar_url: string | null, is_verified: boolean, verified_type: string | null }
interface Admin { user_id: string, role: string, user: { username: string } | null }
interface PageWallet {
  balance: number, withdrawable_pew: number, withdrawable_usd: number, gift_fee_pct: number
  items: { id: string, label: string, direction: 'in' | 'out', amount: number, counterpart: string | null, created_at: string }[]
}

const route = useRoute()
const context = useContextStore()
const { uploadFile } = useFileUpload()
const page = ref<PageView | null>(null)
const loading = ref(true)
const error = ref('')
const busy = ref(false)
const notice = ref('')
const posts = ref<FeedPost[]>([])
const postsPage = ref(1)
const hasMore = ref(false)
const admins = ref<Admin[]>([])
const edit = reactive({
  name: '', category: '', bio: '', avatar_url: '' as string | null, cover_url: '' as string | null,
  website: '', location: '', contact_email: '', contact_phone: '', founded_year: null as number | null
})
const photoSrc = ref<string | null>(null)
const tab = ref<'posts' | 'about' | 'manage'>('posts')
const followersOpen = ref(false)
const followersLoading = ref(false)
const followers = ref<Follower[]>([])
const hasAbout = computed(() => Boolean(page.value && (page.value.category || page.value.location || page.value.website || page.value.contact_email || page.value.contact_phone || page.value.founded_year)))
const newAdmin = reactive({ username: '', role: 'MANAGER' })
const wallet = ref<PageWallet | null>(null)
const walletAmount = ref<number | null>(null)

const setupSteps = computed(() => {
  const p = page.value
  if (!p) return []
  const manage = () => { tab.value = 'manage' }
  return [
    { label: 'Add a Page photo', done: Boolean(p.avatar_url), action: manage },
    { label: 'Add a cover photo', done: Boolean(p.cover_url), action: manage },
    { label: 'Describe the Page (About)', done: Boolean(p.bio), action: manage },
    { label: 'Add contact details or a website', done: Boolean(p.website || p.contact_email || p.contact_phone), action: manage },
    { label: 'Publish the first post', done: p.posts_count > 0, action: () => { void postAsPage() } }
  ]
})
const canEdit = computed(() => page.value?.viewer_role === 'OWNER' || page.value?.viewer_role === 'MANAGER')
const isActive = computed(() => context.activeActor?.id === page.value?.id)
const msg = (e: unknown, fallback: string) => {
  const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
  return err.data?.statusMessage || err.statusMessage || fallback
}

const loadWallet = async () => {
  if (!page.value || !canEdit.value) return
  wallet.value = await $fetch<PageWallet>(`/api/pages/${page.value.id}/wallet`).catch(() => null)
}

const walletAction = async (action: 'fund' | 'payout') => {
  if (!page.value || !walletAmount.value) { notice.value = 'Enter an amount'; return }
  busy.value = true
  notice.value = ''
  try {
    await $fetch(`/api/pages/${page.value.id}/wallet/${action}`, { method: 'POST', body: { amount: walletAmount.value } })
    notice.value = action === 'fund' ? 'Added to the Page wallet.' : 'Earnings moved to your withdrawable balance.'
    walletAmount.value = null
    await loadWallet()
  } catch (e) {
    notice.value = msg(e, 'Wallet update failed')
  } finally {
    busy.value = false
  }
}

const loadPosts = async (reset = false) => {
  if (!page.value) return
  if (reset) { posts.value = []; postsPage.value = 1 }
  const res = await $fetch<{ posts: FeedPost[], hasMore: boolean }>(`/api/pages/${page.value.id}/posts`, { query: { page: postsPage.value } })
  posts.value = [...posts.value, ...res.posts]
  hasMore.value = res.hasMore
  postsPage.value += 1
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    page.value = await $fetch<PageView>(`/api/pages/${encodeURIComponent(String(route.params.handle))}`)
    const p = page.value
    Object.assign(edit, {
      name: p.name, category: p.category ?? '', bio: p.bio ?? '', avatar_url: p.avatar_url, cover_url: p.cover_url,
      website: p.website ?? '', location: p.location ?? '', contact_email: p.contact_email ?? '',
      contact_phone: p.contact_phone ?? '', founded_year: p.founded_year
    })
    await loadPosts(true)
    if (page.value.viewer_role) {
      admins.value = (await $fetch<{ admins: Admin[] }>(`/api/pages/${page.value.id}/admins`)).admins
      await loadWallet()
    }
  } catch (e) {
    error.value = msg(e, 'Page not found')
  } finally {
    loading.value = false
  }
}

const run = async (fn: () => Promise<unknown>, ok?: string) => {
  busy.value = true
  notice.value = ''
  try {
    await fn()
    if (ok) notice.value = ok
  } catch (e) {
    notice.value = msg(e, 'Something went wrong')
  } finally {
    busy.value = false
  }
}

const toggleFollow = () => run(async () => {
  const res = await $fetch<{ following: boolean, followers_count: number }>(`/api/pages/${page.value!.id}/follow`, { method: 'POST' })
  page.value!.is_following = res.following
  page.value!.followers_count = res.followers_count
})
const openFollowers = async () => {
  if (!page.value) return
  followersOpen.value = true
  followersLoading.value = true
  try {
    followers.value = (await $fetch<{ data: Follower[] }>(`/api/pages/${page.value.id}/followers`)).data
  } catch (e) {
    notice.value = msg(e, 'Could not load followers')
    followersOpen.value = false
  } finally {
    followersLoading.value = false
  }
}

const postAsPage = async () => {
  if (!page.value) return
  context.switchToPage(page.value.id)
  await navigateTo('/posts/create')
}

const actAs = () => {
  if (page.value) context.switchToPage(page.value.id)
}
const onAvatar = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) void run(async () => { edit.avatar_url = (await uploadFile(file, 'avatars')).url; await persistEdit() }, 'Page photo updated')
}
const onCover = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) void run(async () => { edit.cover_url = (await uploadFile(file, 'posts')).url; await persistEdit() }, 'Cover photo updated')
}
const messagePage = () => run(async () => {
  const res = await $fetch<{ data: { id: string } }>(`/api/pages/${page.value!.id}/message`, { method: 'POST' })
  await navigateTo({ path: '/chat', query: { room: res.data.id } })
})
const sharePage = async () => {
  if (!page.value) return
  const url = `${window.location.origin}/pages/${page.value.handle}`
  try {
    if (navigator.share) await navigator.share({ title: page.value.name, url })
    else { await navigator.clipboard.writeText(url); notice.value = 'Link copied' }
  } catch { /* share sheet dismissed */ }
}
const persistEdit = async () => {
  await $fetch(`/api/pages/${page.value!.id}`, { method: 'PATCH', body: { ...edit, founded_year: edit.founded_year || null } })
  await context.refreshPages()
  const fresh = await $fetch<PageView>(`/api/pages/${page.value!.id}`)
  page.value = fresh
}
const save = () => run(async () => {
  await persistEdit()
  tab.value = 'about'
}, 'Saved')
const addAdmin = () => run(async () => {
  await $fetch(`/api/pages/${page.value!.id}/admins`, { method: 'POST', body: { ...newAdmin } })
  newAdmin.username = ''
  admins.value = (await $fetch<{ admins: Admin[] }>(`/api/pages/${page.value!.id}/admins`)).admins
}, 'Admin added')
const removeAdmin = (userId: string) => run(async () => {
  await $fetch(`/api/pages/${page.value!.id}/admins/${userId}`, { method: 'DELETE' })
  admins.value = admins.value.filter(a => a.user_id !== userId)
}, 'Removed')
const removePage = () => {
  if (!confirm('Delete this Page and all its posts?')) return
  void run(async () => {
    await $fetch(`/api/pages/${page.value!.id}`, { method: 'DELETE' })
    await context.refreshPages()
    await navigateTo('/pages')
  })
}

watch(() => route.params.handle, () => { tab.value = 'posts'; void load() }, { immediate: true })
</script>

<style scoped>
.page-view { max-width: 720px; margin: 0 auto; padding: 12px 12px 90px; color: #e2e8f0; display: flex; flex-direction: column; gap: 14px; }
.back { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #93c5fd; cursor: pointer; padding: 4px 0; }
.state-card { background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 22px; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.state-card.error { color: #f87171; }
.cover { position: relative; height: 180px; border-radius: 16px; background: #1e293b center / cover no-repeat; cursor: zoom-in; margin-bottom: -64px; }
.cover.empty { background: linear-gradient(135deg, #1e3a8a, #6d28d9 60%, #db2777); cursor: default; }
.cover-edit { position: absolute; right: 10px; bottom: 10px; background: rgba(15, 23, 42, .75); color: #fff; border-radius: 999px; padding: 6px 12px; font-size: .8rem; display: inline-flex; gap: 6px; align-items: center; cursor: pointer; }
.profile-header { position: relative; display: flex; gap: 16px; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 18px; margin: 0 8px; flex-wrap: wrap; }
.avatar-wrap { position: relative; flex-shrink: 0; margin-top: -48px; }
.avatar { width: 104px; height: 104px; border-radius: 999px; object-fit: cover; border: 3px solid #0f172a; box-shadow: 0 0 0 2px #f59e0b; background: #0f172a; cursor: zoom-in; }
.avatar-edit { position: absolute; right: 2px; bottom: 2px; width: 30px; height: 30px; border-radius: 999px; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid #1e293b; }
.identity { flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 4px; }
h1 { font-size: 1.45rem; font-weight: 800; margin: 0; display: flex; align-items: center; flex-wrap: wrap; }
h2 { font-size: 1rem; font-weight: 700; margin: 0 0 8px; }
.username { color: #94a3b8; margin: 0; }
.page-tag { margin-left: 6px; background: #f59e0b22; color: #fbbf24; border-radius: 999px; padding: 1px 8px; font-size: .72rem; font-weight: 600; }
.muted { color: #94a3b8; font-size: .85rem; margin: 0; }
.owner-link { color: #93c5fd; }
.bio { white-space: pre-wrap; margin: 6px 0 0; }
.stats { display: flex; gap: 18px; margin-top: 8px; }
.stat { background: none; border: none; color: #cbd5e1; padding: 0; cursor: pointer; font: inherit; }
.stat.static { cursor: default; }
.stat strong { color: #fff; margin-right: 4px; }
.actions { display: flex; gap: 8px; align-items: center; margin-top: 12px; flex-wrap: wrap; }
.role-line { margin-top: 6px; }
.btn { display: inline-flex; align-items: center; gap: 6px; background: #2563eb; color: #fff; border: none; border-radius: 999px; padding: .5rem 1rem; font-weight: 600; cursor: pointer; text-decoration: none; font-size: .9rem; }
.btn.secondary { background: #334155; }
.btn.small { padding: .35rem .8rem; font-size: .8rem; align-self: center; }
.btn:disabled { opacity: .6; }
.notice { margin: 8px 0 0; color: #fbbf24; }
.setup { margin: 0 8px; }
.setup-step { display: flex; gap: 10px; align-items: center; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 10px; padding: 10px 12px; cursor: pointer; text-align: left; }
.setup-step.done { color: #4ade80; cursor: default; opacity: .8; }
.tabs { display: flex; gap: 4px; border-bottom: 1px solid #334155; margin: 0 8px; }
.tabs button { background: none; border: none; color: #94a3b8; padding: 10px 16px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; }
.tabs button.active { color: #fff; border-bottom-color: #f59e0b; }
.card { display: flex; flex-direction: column; gap: 10px; background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 16px; margin: 0 8px; }
.card label { display: flex; flex-direction: column; gap: 4px; font-size: .8rem; color: #94a3b8; }
.about p { display: flex; align-items: center; gap: 8px; word-break: break-word; margin: 0; }
.about a { color: #60a5fa; }
.inline-link { background: none; border: none; color: #60a5fa; cursor: pointer; margin-left: 6px; }
.photo-row { display: flex; gap: 8px; flex-wrap: wrap; }
.file-btn { flex-direction: row !important; align-items: center; gap: 6px !important; background: #334155; color: #e2e8f0 !important; border-radius: 999px; padding: 8px 14px; cursor: pointer; font-size: .85rem !important; }
input, textarea, select { background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 9px 12px; min-width: 0; font-size: .95rem; }
.inline { display: flex; gap: 8px; flex-wrap: wrap; }
.inline input { flex: 1; }
.admin { display: flex; justify-content: space-between; gap: 8px; }
.link { background: none; border: none; color: #f87171; cursor: pointer; }
.danger { background: none; border: 1px solid #ef4444; color: #f87171; border-radius: 999px; padding: .45rem 1rem; cursor: pointer; align-self: flex-start; margin-top: 6px; }
.wallet-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.wallet-row div { display: flex; flex-direction: column; gap: 2px; }
.in { color: #4ade80; }
.out { color: #f87171; }
.posts { display: flex; flex-direction: column; gap: 14px; }
.sheet-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, .55); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
.sheet { width: min(520px, 100%); max-height: 70vh; overflow-y: auto; background: #1e293b; border-radius: 16px 16px 0 0; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.sheet-head { display: flex; justify-content: space-between; align-items: center; }
.follower { display: flex; align-items: center; gap: 10px; color: #e2e8f0; text-decoration: none; }
.follower img { width: 40px; height: 40px; border-radius: 999px; object-fit: cover; }
@media (max-width: 520px) {
  .cover { height: 140px; }
  .profile-header { flex-direction: column; align-items: center; text-align: center; }
  h1, .actions, .stats { justify-content: center; }
}
</style>

