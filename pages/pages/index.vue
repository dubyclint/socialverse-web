<template>
  <div class="pages-home">
    <header class="top">
      <button type="button" class="icon-btn" aria-label="Back" @click="$router.back()"><Icon name="arrow-left" size="20" /></button>
      <h1>My Pages</h1>
      <button v-if="canCreate" type="button" class="btn small" @click="showCreate = true"><Icon name="plus" size="16" /> Create</button>
    </header>

    <p class="muted intro">
      A Page is its own profile — for a business, brand, community or cause — linked to you. It posts, chats, gets followers,
      receives gifts into its own wallet and can be verified. You've created {{ context.createdCount }} of {{ context.cap }}.
    </p>

    <div v-if="loading && !context.managedPages.length" class="state">Loading your Pages…</div>

    <section v-else-if="!context.managedPages.length" class="empty">
      <Icon name="flag" size="40" />
      <h2>You don't have a Page yet</h2>
      <p class="muted">Create one for your business, brand or community.</p>
      <button type="button" class="btn" @click="showCreate = true">Create a Page</button>
    </section>

    <section v-else class="grid">
      <article v-for="page in context.managedPages" :key="page.id" class="page-card">
        <NuxtLink :to="`/pages/${page.handle}`" class="cover" :style="page.cover_url ? { backgroundImage: `url(${page.cover_url})` } : {}" :aria-label="`Open ${page.name}`" />
        <div class="body">
          <NuxtLink :to="`/pages/${page.handle}`" class="ident">
            <img :src="page.avatar_url || '/default-avatar.svg'" alt="" class="avatar">
            <span class="names">
              <strong>{{ page.name }} <VerifiedBadge v-if="page.is_verified" :type="page.verified_type" :size="14" /></strong>
              <small class="muted">@{{ page.handle }}<span v-if="page.category"> · {{ page.category }}</span></small>
            </span>
          </NuxtLink>
          <p class="stats"><strong>{{ page.followers_count ?? 0 }}</strong> followers · <strong>{{ page.posts_count ?? 0 }}</strong> posts · <span class="role">{{ roleLabel(page.role) }}</span></p>
          <div class="actions">
            <NuxtLink :to="`/pages/${page.handle}`" class="btn small">View Page</NuxtLink>
            <button type="button" class="btn small secondary" @click="actAs(page.id)">{{ context.activeActor?.id === page.id ? 'Acting as' : 'Act as' }}</button>
            <button type="button" class="btn small secondary" @click="postAs(page.id)"><Icon name="plus" size="14" /> Post</button>
          </div>
        </div>
      </article>
    </section>

    <section v-if="followed.length" class="followed">
      <h2>Pages you follow</h2>
      <NuxtLink v-for="page in followed" :key="page.id" :to="`/pages/${page.handle}`" class="row">
        <img :src="page.avatar_url || '/default-avatar.svg'" alt="" class="avatar sm">
        <span class="names">
          <strong>{{ page.name }} <VerifiedBadge v-if="page.is_verified" :type="page.verified_type" :size="14" /></strong>
          <small class="muted">@{{ page.handle }} · {{ page.followers_count ?? 0 }} followers</small>
        </span>
      </NuxtLink>
    </section>

    <div v-if="showCreate" class="sheet-backdrop" @click.self="showCreate = false">
      <form class="sheet" @submit.prevent="create">
        <div class="sheet-head">
          <h2>Create a Page</h2>
          <button type="button" class="icon-btn" aria-label="Close" @click="showCreate = false"><Icon name="x" size="18" /></button>
        </div>
        <label>Page name<input v-model.trim="form.name" placeholder="e.g. Bandwidth Media" maxlength="80" required @input="syncHandle"></label>
        <label>Handle
          <span class="handle-input"><span>@</span><input v-model.trim="form.handle" placeholder="bandwidth_media" maxlength="30" required @input="handleTouched = true"></span>
          <small class="muted">viorp.com/pages/{{ form.handle || 'handle' }}</small>
        </label>
        <label>Category
          <select v-model="form.category">
            <option value="">Choose a category</option>
            <option v-for="c in CATEGORIES" :key="c">{{ c }}</option>
          </select>
        </label>
        <label>About<textarea v-model.trim="form.bio" placeholder="What is this Page about?" maxlength="500" rows="3" /></label>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn" :disabled="saving || !form.name || !form.handle">{{ saving ? 'Creating…' : 'Create Page' }}</button>
        <p class="muted">You'll be the owner. You can add a photo, cover, contact details and admins next.</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useContextStore, type ManagedPage } from '~/stores/context'

definePageMeta({ middleware: ['auth'] })

const CATEGORIES = ['Business', 'Brand or product', 'Shop', 'Media / News', 'Entertainment', 'Music', 'Artist / Creator', 'Community', 'Religious organisation', 'Education', 'Non-profit', 'Sports', 'Health & wellness', 'Food & drink', 'Technology', 'Government', 'Other']

type FollowedPage = Omit<ManagedPage, 'role'>

const context = useContextStore()
const route = useRoute()
const form = reactive({ name: '', handle: '', category: '', bio: '' })
const handleTouched = ref(false)
const saving = ref(false)
const loading = ref(true)
const error = ref('')
const showCreate = ref(route.query.create === '1')
const followed = ref<FollowedPage[]>([])

const canCreate = computed(() => context.createdCount < context.cap)
const roleLabel = (role: string) => (role === 'OWNER' ? 'Owner' : role === 'MANAGER' ? 'Manager' : 'Moderator')

const syncHandle = () => {
  if (handleTouched.value) return
  form.handle = form.name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30)
}

const actAs = (pageId: string) => {
  if (context.activeActor?.id === pageId) context.switchTo(context.user)
  else context.switchToPage(pageId)
}
const postAs = async (pageId: string) => {
  context.switchToPage(pageId)
  await navigateTo('/posts/create')
}

const create = async () => {
  saving.value = true
  error.value = ''
  try {
    const res = await $fetch<{ page: { handle: string } }>('/api/pages', { method: 'POST', body: { ...form } })
    await context.refreshPages()
    await navigateTo(`/pages/${res.page.handle}`)
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
    error.value = err.data?.statusMessage || err.statusMessage || 'Could not create Page'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const res = await $fetch<{ followed: FollowedPage[] }>('/api/pages/mine')
    followed.value = res.followed ?? []
    await context.refreshPages()
  } catch {
    /* list stays empty */
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.pages-home { max-width: 760px; margin: 0 auto; padding: 0 12px 90px; color: #e2e8f0; }
.top { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 8px; padding: 10px 0; background: #0f172a; }
.top h1 { flex: 1; font-size: 1.3rem; font-weight: 800; margin: 0; }
.icon-btn { background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 6px; border-radius: 999px; display: inline-flex; }
.intro { margin: 4px 0 16px; }
.muted { color: #94a3b8; font-size: .85rem; }
.state { padding: 30px; text-align: center; color: #94a3b8; }
.empty { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; padding: 36px 16px; background: #1e293b; border: 1px solid #334155; border-radius: 16px; color: #f59e0b; }
.empty h2 { color: #fff; margin: 0; font-size: 1.15rem; }
.empty p { margin: 0 0 6px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.page-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; }
.cover { display: block; height: 96px; background: linear-gradient(135deg, #1e3a8a, #6d28d9 60%, #db2777) center / cover no-repeat; }
.body { padding: 0 14px 14px; display: flex; flex-direction: column; gap: 8px; }
.ident { display: flex; align-items: flex-end; gap: 10px; margin-top: -26px; color: inherit; text-decoration: none; }
.avatar { width: 64px; height: 64px; border-radius: 999px; object-fit: cover; border: 3px solid #1e293b; background: #0f172a; flex-shrink: 0; }
.avatar.sm { width: 44px; height: 44px; border-width: 0; }
.names { display: flex; flex-direction: column; min-width: 0; padding-bottom: 4px; }
.names strong { display: inline-flex; align-items: center; font-size: 1rem; }
.stats { margin: 0; color: #cbd5e1; font-size: .85rem; }
.role { color: #fbbf24; }
.actions { display: flex; gap: 6px; flex-wrap: wrap; }
.btn { display: inline-flex; align-items: center; gap: 6px; background: #2563eb; color: #fff; border: none; border-radius: 999px; padding: .55rem 1.1rem; font-weight: 600; cursor: pointer; text-decoration: none; font-size: .9rem; }
.btn.small { padding: .4rem .85rem; font-size: .8rem; }
.btn.secondary { background: #334155; }
.btn:disabled { opacity: .6; }
.followed { margin-top: 24px; display: flex; flex-direction: column; gap: 8px; }
.followed h2 { font-size: 1rem; margin: 0 0 4px; }
.row { display: flex; align-items: center; gap: 12px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 10px 12px; color: inherit; text-decoration: none; }
.sheet-backdrop { position: fixed; inset: 0; z-index: 50; background: rgba(0, 0, 0, .55); display: flex; align-items: flex-end; justify-content: center; }
.sheet { width: min(560px, 100%); max-height: 90vh; overflow-y: auto; background: #1e293b; border-radius: 16px 16px 0 0; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.sheet-head { display: flex; justify-content: space-between; align-items: center; }
.sheet-head h2 { margin: 0; font-size: 1.15rem; }
.sheet label { display: flex; flex-direction: column; gap: 4px; font-size: .8rem; color: #94a3b8; }
.handle-input { display: flex; align-items: center; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding-left: 10px; color: #94a3b8; }
.handle-input input { border: none; flex: 1; }
input, textarea, select { background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 10px 12px; font-size: .95rem; min-width: 0; }
.error { color: #f87171; font-size: .85rem; margin: 0; }
@media (min-width: 640px) { .sheet-backdrop { align-items: center; } .sheet { border-radius: 16px; } }
</style>
