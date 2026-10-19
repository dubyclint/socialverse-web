<template>
  <div class="group-info">
    <header class="top">
      <button type="button" class="icon-btn" aria-label="Back" @click="goBack"><Icon name="arrow-left" size="20" /></button>
      <h1>Group info</h1>
    </header>

    <div v-if="pending" class="state">Loading group…</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <template v-else-if="group">
      <section class="hero">
        <div class="photo-wrap">
          <img v-if="group.avatar" :src="group.avatar" alt="Group photo" class="photo" @click="photoSrc = group.avatar">
          <div v-else class="photo placeholder"><Icon name="users" size="40" /></div>
          <label v-if="isAdmin" class="photo-edit" title="Change group photo">
            <Icon :name="busy ? 'loader' : 'camera'" size="16" />
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden :disabled="busy" @change="changePhoto">
          </label>
        </div>
        <div v-if="editingName" class="name-edit">
          <input v-model.trim="nameDraft" maxlength="80" @keyup.enter="saveName">
          <button type="button" class="btn small" :disabled="busy || !nameDraft" @click="saveName">Save</button>
          <button type="button" class="btn small secondary" @click="editingName = false">Cancel</button>
        </div>
        <h2 v-else>
          {{ group.name }}
          <button v-if="isAdmin" type="button" class="icon-btn" aria-label="Edit name" @click="startRename"><Icon name="edit" size="16" /></button>
        </h2>
        <p class="muted">Group · {{ group.memberCount }} members</p>
        <div class="quick">
          <NuxtLink :to="`/chat?room=${group.id}`" class="quick-btn"><Icon name="message-circle" size="20" /><span>Message</span></NuxtLink>
          <button type="button" class="quick-btn" @click="openAppearance = true"><Icon name="image" size="20" /><span>Wallpaper</span></button>
          <button v-if="isAdmin" type="button" class="quick-btn" @click="openAdd"><Icon name="user-plus" size="20" /><span>Add</span></button>
        </div>
        <p v-if="notice" class="notice">{{ notice }}</p>
      </section>

      <section class="card">
        <h3>{{ group.memberCount }} members</h3>
        <button v-if="isAdmin" type="button" class="member add-row" @click="openAdd">
          <span class="add-icon"><Icon name="user-plus" size="18" /></span><span>Add members</span>
        </button>
        <div v-for="m in group.members" :key="m.userId ?? ''" class="member">
          <NuxtLink :to="`/profile/${m.userId}`" class="member-link">
            <img :src="m.avatar || '/default-avatar.svg'" alt="">
            <span class="member-name">
              <strong>{{ m.userId === myId ? 'You' : m.name }} <VerifiedBadge v-if="m.isVerified" :type="m.verifiedType" :size="14" /></strong>
              <small v-if="m.username" class="muted">@{{ m.username }}</small>
            </span>
          </NuxtLink>
          <span v-if="m.role === 'admin'" class="admin-tag">Group admin</span>
          <button v-if="isAdmin && m.userId !== myId" type="button" class="icon-btn" aria-label="Member options" @click="menuFor = menuFor === m.userId ? null : m.userId">
            <Icon name="more-vertical" size="18" />
          </button>
          <div v-if="menuFor === m.userId" class="member-menu">
            <button type="button" @click="setRole(m.userId!, m.role === 'admin' ? 'member' : 'admin')">{{ m.role === 'admin' ? 'Dismiss as admin' : 'Make group admin' }}</button>
            <button type="button" class="danger-text" @click="removeMember(m.userId!, m.name)">Remove from group</button>
          </div>
        </div>
      </section>

      <section class="card">
        <button type="button" class="danger-row" :disabled="busy" @click="leave"><Icon name="log-out" size="18" /> Exit group</button>
      </section>
      <p class="muted created">Created {{ group.createdAt ? new Date(group.createdAt).toLocaleDateString() : '' }}</p>
    </template>

    <div v-if="adding" class="sheet-backdrop" @click.self="adding = false">
      <div class="sheet" role="dialog" aria-label="Add members">
        <div class="sheet-head"><h3>Add members</h3><button type="button" class="icon-btn" aria-label="Close" @click="adding = false"><Icon name="x" size="18" /></button></div>
        <input v-model="query" type="search" placeholder="Search your contacts and PALs" @input="searchPeople">
        <p v-if="peopleLoading" class="muted">Loading…</p>
        <label v-for="p in candidates" :key="p.user_id" class="person">
          <input v-model="picked" type="checkbox" :value="p.user_id">
          <img :src="p.avatar_url || '/default-avatar.svg'" alt="">
          <span><strong>{{ p.display_name || p.username }}</strong> <small class="muted">@{{ p.username }}</small></span>
        </label>
        <p v-if="!peopleLoading && !candidates.length" class="muted">No one else to add.</p>
        <button type="button" class="btn" :disabled="busy || !picked.length" @click="addMembers">Add ({{ picked.length }})</button>
      </div>
    </div>
    <ChatSettings v-if="openAppearance" initial-section="chatWallpaper" @close="openAppearance = false" />
    <MediaLightbox :src="photoSrc" :alt="group?.name" @close="photoSrc = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ChatSettings from '~/components/chat/chat-settings.vue'
import MediaLightbox from '~/components/chat/media-lightbox.vue'

definePageMeta({ middleware: ['auth'] })

interface Member {
  userId: string | null
  username: string | null
  name: string
  avatar: string | null
  isVerified: boolean
  verifiedType: string | null
  role: string
}
interface GroupDetail {
  id: string
  name: string
  avatar: string | null
  createdAt: string | null
  myRole: string
  memberCount: number
  members: Member[]
}
interface Person { user_id: string, username: string, display_name: string | null, avatar_url: string | null }

const route = useRoute()
const router = useRouter()
const user = useSupabaseUser()
const groupId = computed(() => String(route.params.id))
const myId = computed(() => user.value?.id ?? (user.value as { sub?: string } | null)?.sub ?? '')

const group = ref<GroupDetail | null>(null)
const pending = ref(true)
const error = ref('')
const notice = ref('')
const busy = ref(false)
const photoSrc = ref<string | null>(null)
const menuFor = ref<string | null>(null)
const editingName = ref(false)
const nameDraft = ref('')
const openAppearance = ref(false)
const adding = ref(false)
const query = ref('')
const people = ref<Person[]>([])
const peopleLoading = ref(false)
const picked = ref<string[]>([])

const isAdmin = computed(() => group.value?.myRole === 'admin')
const candidates = computed(() => {
  const inGroup = new Set(group.value?.members.map(m => m.userId))
  return people.value.filter(p => !inGroup.has(p.user_id))
})

const errMsg = (e: unknown, fallback: string) =>
  (e as { data?: { statusMessage?: string } })?.data?.statusMessage || fallback

const load = async () => {
  try {
    const res = await $fetch<{ data: GroupDetail }>(`/api/groups/${groupId.value}`)
    group.value = res.data
    error.value = ''
  } catch (e) {
    error.value = errMsg(e, 'Could not load this group')
  } finally {
    pending.value = false
  }
}

const run = async (fn: () => Promise<unknown>, done: string, fallback: string) => {
  busy.value = true
  notice.value = ''
  menuFor.value = null
  try {
    await fn()
    notice.value = done
    await load()
  } catch (e) {
    notice.value = errMsg(e, fallback)
  } finally {
    busy.value = false
  }
}

const goBack = () => (window.history.length > 1 ? router.back() : router.push(`/chat?room=${groupId.value}`))

const startRename = () => {
  nameDraft.value = group.value?.name ?? ''
  editingName.value = true
}
const saveName = () => run(async () => {
  await $fetch(`/api/groups/${groupId.value}`, { method: 'PATCH', body: { name: nameDraft.value } })
  editingName.value = false
}, 'Group name updated', 'Could not rename the group')

const changePhoto = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { notice.value = 'Group photo must be under 5 MB'; return }
  void run(async () => {
    const form = new FormData()
    form.append('file', file)
    const res = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: form })
    await $fetch(`/api/groups/${groupId.value}`, { method: 'PATCH', body: { avatar: res.url } })
  }, 'Group photo updated', 'Could not change the group photo')
}

const fetchPeople = async () => {
  peopleLoading.value = true
  try {
    const res = await $fetch<{ data: Person[] }>('/api/chat/people', { query: { q: query.value || undefined } })
    people.value = res.data
  } catch {
    people.value = []
  } finally {
    peopleLoading.value = false
  }
}
let timer: ReturnType<typeof setTimeout> | null = null
const searchPeople = () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(fetchPeople, 250)
}
const openAdd = () => {
  adding.value = true
  picked.value = []
  void fetchPeople()
}
const addMembers = () => run(async () => {
  await $fetch(`/api/groups/${groupId.value}/members`, { method: 'POST', body: { memberIds: picked.value } })
  adding.value = false
}, 'Members added', 'Could not add those people')

const setRole = (userId: string, role: 'admin' | 'member') => run(
  () => $fetch(`/api/groups/${groupId.value}/members/${userId}`, { method: 'PATCH', body: { role } }),
  role === 'admin' ? 'Now a group admin' : 'Dismissed as admin',
  'Could not change that role'
)

const removeMember = (userId: string, name: string) => {
  if (!window.confirm(`Remove ${name} from the group?`)) return
  void run(() => $fetch(`/api/groups/${groupId.value}/members/${userId}`, { method: 'DELETE' }), `${name} removed`, 'Could not remove that member')
}

const leave = async () => {
  if (!window.confirm('Exit this group? You will stop receiving its messages.')) return
  busy.value = true
  try {
    await $fetch(`/api/groups/${groupId.value}/members/${myId.value}`, { method: 'DELETE' })
    await router.push('/chat')
  } catch (e) {
    notice.value = errMsg(e, 'Could not leave the group')
  } finally {
    busy.value = false
  }
}

await load()
</script>

<style scoped>
.group-info { max-width: 640px; margin: 0 auto; padding: 0 0 90px; color: #e2e8f0; min-height: 100vh; }
.top { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #0f172a; border-bottom: 1px solid #1e293b; }
.top h1 { font-size: 1.1rem; font-weight: 700; margin: 0; }
.icon-btn { background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 6px; border-radius: 999px; display: inline-flex; }
.state { padding: 40px 16px; text-align: center; color: #94a3b8; }
.state.error { color: #f87171; }
.hero { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 22px 16px; background: #1e293b; margin-bottom: 10px; }
.photo-wrap { position: relative; }
.photo { width: 120px; height: 120px; border-radius: 999px; object-fit: cover; cursor: zoom-in; }
.photo.placeholder { background: #334155; display: flex; align-items: center; justify-content: center; color: #94a3b8; cursor: default; }
.photo-edit { position: absolute; right: 4px; bottom: 4px; width: 34px; height: 34px; border-radius: 999px; background: #22c55e; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 3px solid #1e293b; }
.hero h2 { font-size: 1.35rem; font-weight: 700; margin: 6px 0 0; display: flex; align-items: center; gap: 4px; }
.name-edit { display: flex; gap: 6px; width: 100%; max-width: 420px; }
.name-edit input { flex: 1; }
.muted { color: #94a3b8; font-size: .85rem; margin: 0; }
.quick { display: flex; gap: 10px; margin-top: 12px; }
.quick-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 84px; padding: 10px; border-radius: 12px; border: 1px solid #334155; background: #0f172a; color: #4ade80; font-size: .8rem; cursor: pointer; text-decoration: none; }
.quick-btn span { color: #e2e8f0; }
.notice { color: #fbbf24; font-size: .85rem; margin: 6px 0 0; }
.card { background: #1e293b; padding: 12px 16px; margin-bottom: 10px; display: flex; flex-direction: column; }
.card h3 { font-size: .9rem; color: #94a3b8; margin: 0 0 6px; font-weight: 600; }
.member { position: relative; display: flex; align-items: center; gap: 10px; padding: 8px 0; }
.member-link { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; color: inherit; text-decoration: none; }
.member img { width: 44px; height: 44px; border-radius: 999px; object-fit: cover; }
.member-name { display: flex; flex-direction: column; min-width: 0; }
.member-name strong { display: inline-flex; align-items: center; }
.admin-tag { font-size: .7rem; color: #4ade80; border: 1px solid #166534; border-radius: 6px; padding: 2px 6px; flex-shrink: 0; }
.member-menu { position: absolute; right: 0; top: 46px; z-index: 6; background: #0f172a; border: 1px solid #334155; border-radius: 10px; display: flex; flex-direction: column; min-width: 190px; overflow: hidden; }
.member-menu button { background: none; border: none; color: #e2e8f0; text-align: left; padding: 10px 14px; cursor: pointer; }
.member-menu button:hover { background: #1e293b; }
.danger-text { color: #f87171 !important; }
.add-row { background: none; border: none; color: #e2e8f0; cursor: pointer; font: inherit; }
.add-icon { width: 44px; height: 44px; border-radius: 999px; background: #22c55e; color: #fff; display: flex; align-items: center; justify-content: center; }
.danger-row { background: none; border: none; color: #f87171; display: flex; gap: 10px; align-items: center; padding: 6px 0; cursor: pointer; font: inherit; }
.created { text-align: center; padding: 6px; }
.btn { background: #22c55e; color: #fff; border: none; border-radius: 999px; padding: .55rem 1rem; font-weight: 600; cursor: pointer; }
.btn.small { padding: .35rem .8rem; font-size: .8rem; }
.btn.secondary { background: #334155; }
.btn:disabled { opacity: .6; }
input[type="search"], .name-edit input { background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #fff; padding: 9px 12px; }
.sheet-backdrop { position: fixed; inset: 0; z-index: 50; background: rgba(0, 0, 0, .55); display: flex; align-items: flex-end; justify-content: center; }
.sheet { width: min(560px, 100%); max-height: 80vh; overflow-y: auto; background: #1e293b; border-radius: 16px 16px 0 0; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.sheet-head { display: flex; justify-content: space-between; align-items: center; }
.sheet-head h3 { margin: 0; }
.person { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.person img { width: 40px; height: 40px; border-radius: 999px; object-fit: cover; }
</style>
