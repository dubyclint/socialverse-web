<template>
  <div class="page-view">
    <div v-if="loading" class="muted">Loading…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else-if="page">
      <section class="header">
        <img :src="page.avatar_url || '/default-avatar.svg'" alt="" class="avatar" />
        <div class="info">
          <h1>{{ page.name }}</h1>
          <p class="muted">@{{ page.handle }}<span v-if="page.category"> · {{ page.category }}</span></p>
          <p class="muted">{{ page.followers_count }} followers · {{ page.posts_count }} posts</p>
          <p v-if="page.bio" class="bio">{{ page.bio }}</p>
          <div class="actions">
            <button v-if="!page.viewer_role" type="button" class="btn" :disabled="busy" @click="toggleFollow">{{ page.is_following ? 'Following' : 'Follow' }}</button>
            <button v-if="page.viewer_role" type="button" class="btn" @click="actAs">{{ isActive ? 'Acting as this Page' : 'Act as this Page' }}</button>
            <span v-if="page.viewer_role" class="role">{{ page.viewer_role.toLowerCase() }}</span>
          </div>
        </div>
      </section>

      <form v-if="canEdit" class="card" @submit.prevent="save">
        <h2>Edit Page</h2>
        <input v-model.trim="edit.name" placeholder="Name" maxlength="80" />
        <input v-model.trim="edit.category" placeholder="Category" maxlength="60" />
        <textarea v-model.trim="edit.bio" placeholder="About" maxlength="500" rows="3" />
        <label class="muted">Page photo <input type="file" accept="image/*" @change="onAvatar" /></label>
        <button type="submit" class="btn" :disabled="busy">{{ busy ? 'Saving…' : 'Save' }}</button>
      </form>

      <section v-if="page.viewer_role === 'OWNER'" class="card">
        <h2>Admins</h2>
        <div v-for="a in admins" :key="a.user_id" class="admin">
          <span>@{{ a.user?.username }} · {{ a.role.toLowerCase() }}</span>
          <button type="button" class="link" @click="removeAdmin(a.user_id)">Remove</button>
        </div>
        <form class="inline" @submit.prevent="addAdmin">
          <input v-model.trim="newAdmin.username" placeholder="username" />
          <select v-model="newAdmin.role"><option>MANAGER</option><option>MODERATOR</option><option>OWNER</option></select>
          <button type="submit" class="btn small">Add</button>
        </form>
        <button type="button" class="danger" @click="removePage">Delete Page</button>
      </section>
      <p v-if="notice" class="notice">{{ notice }}</p>

      <section class="posts">
        <h2>Posts</h2>
        <p v-if="!posts.length" class="muted">No posts yet.</p>
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
        <button v-if="hasMore" type="button" class="btn small" @click="loadPosts()">Load more</button>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import PostCard from '~/components/posts/post-card.vue'
import type { FeedPost } from '~/composables/useSocialFeed'
import { useFileUpload } from '~/composables/use-file-upload'
import { useContextStore } from '~/stores/context'

interface PageView {
  id: string, name: string, handle: string, category: string | null, bio: string | null, avatar_url: string | null
  followers_count: number, posts_count: number, viewer_role: 'OWNER' | 'MANAGER' | 'MODERATOR' | null, is_following: boolean
}
interface Admin { user_id: string, role: string, user: { username: string } | null }

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
const edit = reactive({ name: '', category: '', bio: '', avatar_url: '' as string | null })
const newAdmin = reactive({ username: '', role: 'MANAGER' })

const canEdit = computed(() => page.value?.viewer_role === 'OWNER' || page.value?.viewer_role === 'MANAGER')
const isActive = computed(() => context.activeActor?.id === page.value?.id)
const msg = (e: unknown, fallback: string) => {
  const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
  return err.data?.statusMessage || err.statusMessage || fallback
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
    Object.assign(edit, { name: page.value.name, category: page.value.category ?? '', bio: page.value.bio ?? '', avatar_url: page.value.avatar_url })
    await loadPosts(true)
    if (page.value.viewer_role) {
      admins.value = (await $fetch<{ admins: Admin[] }>(`/api/pages/${page.value.id}/admins`)).admins
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
const actAs = () => {
  if (page.value) context.switchToPage(page.value.id)
}
const onAvatar = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) void run(async () => { edit.avatar_url = (await uploadFile(file, 'avatars')).url }, 'Photo uploaded. Save to apply.')
}
const save = () => run(async () => {
  await $fetch(`/api/pages/${page.value!.id}`, { method: 'PATCH', body: { ...edit } })
  await context.refreshPages()
  await load()
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

watch(() => route.params.handle, load, { immediate: true })
</script>

<style scoped>
.page-view { max-width: 680px; margin: 0 auto; padding: 20px 16px 80px; color: #e2e8f0; }
.header { display: flex; gap: 16px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px; flex-wrap: wrap; }
.avatar { width: 96px; height: 96px; border-radius: 999px; object-fit: cover; border: 2px solid #f59e0b; }
.info { flex: 1; min-width: 200px; }
h1 { font-size: 1.4rem; font-weight: 800; }
h2 { font-size: 1rem; font-weight: 700; margin-bottom: 8px; }
.muted { color: #94a3b8; font-size: 0.85rem; }
.bio { margin-top: 8px; white-space: pre-wrap; }
.actions { display: flex; gap: 8px; align-items: center; margin-top: 10px; flex-wrap: wrap; }
.role { background: #334155; border-radius: 999px; padding: 2px 10px; font-size: 0.75rem; }
.card { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; }
input, textarea, select { background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 9px 12px; min-width: 0; }
.inline { display: flex; gap: 8px; flex-wrap: wrap; }
.inline input { flex: 1; }
.admin { display: flex; justify-content: space-between; gap: 8px; }
.btn { background: #2563eb; color: #fff; border: none; border-radius: 999px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; }
.btn.small { padding: 0.35rem 0.8rem; font-size: 0.8rem; }
.link { background: none; border: none; color: #f87171; cursor: pointer; }
.danger { background: none; border: 1px solid #ef4444; color: #f87171; border-radius: 999px; padding: 0.45rem 1rem; cursor: pointer; align-self: flex-start; margin-top: 6px; }
.notice { margin-top: 10px; color: #fbbf24; }
.error { color: #f87171; }
.posts { margin-top: 18px; display: flex; flex-direction: column; gap: 14px; }
</style>
