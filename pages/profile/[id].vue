<template>
  <div class="profile-page">
    <div class="profile-container">
      <button type="button" class="back" @click="goBack"><Icon name="arrow-left" size="18" /> Back</button>

      <div v-if="loading" class="state-card">
        <div class="spinner" />
        <p>Loading profile...</p>
      </div>

      <div v-else-if="error || !profile" class="state-card error">
        <h2>Profile unavailable</h2>
        <p>{{ error || 'Profile not found.' }}</p>
        <NuxtLink to="/profile" class="btn">Go to My Profile</NuxtLink>
      </div>

      <template v-else>
        <section class="profile-header">
          <div class="avatar-wrap">
            <img
              :src="profile.avatar_url || '/default-avatar.svg'"
              :alt="displayName"
              class="avatar"
              @error="onAvatarError"
            />
            <span v-if="profile.is_online" class="online-dot" title="Online" />
          </div>
          <div class="identity">
            <div class="name-row">
              <h1>
                {{ displayName }}
                <Icon v-if="profile.is_verified" name="check-circle" size="18" class="verified" />
              </h1>
              <SocialFollowButton
                v-if="!isSelf"
                :user-id="profile.user_id"
                :initial-following="profile.relationship.is_following"
                :follows-you="profile.relationship.follows_you"
                @changed="onFollowChanged"
              />
            </div>
            <p class="username">
              @{{ profile.username || 'unknown' }}
              <span v-if="profile.relationship.follows_you && !isSelf" class="follows-you">Follows you</span>
            </p>
            <p v-if="presenceText" class="presence" :class="{ online: profile.is_online }">{{ presenceText }}</p>
            <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>

            <div class="stats">
              <span class="stat static"><strong>{{ profile.posts_count ?? 0 }}</strong> Posts</span>
              <button type="button" class="stat" @click="openList('followers')">
                <strong>{{ profile.followers_count }}</strong> Followers
              </button>
              <button
                type="button"
                class="stat"
                :class="{ locked: profile.following_hidden }"
                :title="profile.following_hidden ? 'This user keeps the accounts they follow private' : undefined"
                @click="openList('following')"
              >
                <strong>{{ profile.following_count }}</strong> Following
                <Icon v-if="profile.following_hidden" name="lock" size="12" />
              </button>
              <button type="button" class="stat" @click="openList('pals')">
                <strong>{{ profile.pals_count }}</strong> PALs
              </button>
            </div>

            <div class="actions">
              <template v-if="isSelf">
                <NuxtLink to="/profile/edit" class="btn secondary">Edit profile</NuxtLink>
                <NuxtLink to="/pages" class="btn secondary"><Icon name="flag" size="16" /> My Pages</NuxtLink>
                <NuxtLink to="/settings" class="btn secondary"><Icon name="settings" size="16" /> Settings</NuxtLink>
              </template>
              <template v-else>
                <button type="button" class="btn" @click="openChat">
                  <Icon name="message-circle" size="16" /> Message
                </button>
                <SocialPalButton
                  :user-id="profile.user_id"
                  :status="profile.relationship.pal_status"
                  :request-id="profile.relationship.pal_request_id"
                  @changed="onPalChanged"
                />
              </template>
            </div>
            <p v-if="listNotice" class="notice">{{ listNotice }}</p>
          </div>
        </section>

        <section v-if="profile.locked" class="locked-card">
          <Icon name="lock" size="18" />
          <span>This profile is locked. Only PALs can see {{ displayName }}'s details and posts.</span>
        </section>

        <section v-else-if="detailRows.length || interests.length" class="details-card">
          <h2>About</h2>
          <ul class="details">
            <li v-for="row in detailRows" :key="row.key">
              <Icon :name="row.icon" size="15" />
              <span class="label">{{ row.label }}</span>
              <a v-if="row.key === 'website'" :href="row.value" target="_blank" rel="noopener noreferrer">{{ row.value }}</a>
              <span v-else>{{ row.value }}</span>
              <Icon v-if="isSelf && hiddenFields.has(row.key)" name="eye-off" size="13" class="private-mark" title="Only visible to you" />
            </li>
          </ul>
          <div v-if="interests.length" class="interests">
            <span v-for="tag in interests" :key="tag" class="interest">{{ tag }}</span>
            <Icon v-if="isSelf && hiddenFields.has('interests')" name="eye-off" size="13" class="private-mark" title="Only visible to you" />
          </div>
        </section>

        <PlacementAd v-if="!isSelf" placement="profile" :context-text="profile.bio" />

        <section v-if="!profile.locked" class="posts-section">
          <h2>Posts</h2>
          <div v-if="postsLoading && !posts.length" class="state-card">Loading posts…</div>
          <div v-else-if="!posts.length" class="state-card">No posts yet.</div>
          <div v-else class="posts-list">
            <PostCard v-for="post in posts" :key="post.id" :post="post" />
          </div>
          <div ref="sentinel" class="sentinel">
            <span v-if="postsLoading && posts.length">Loading more…</span>
          </div>
        </section>
      </template>
    </div>

    <SocialPeopleListModal
      v-if="profile && listKind"
      :user-id="profile.user_id"
      :kind="listKind"
      @close="listKind = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PostCard from '~/components/posts/post-card.vue'
import PlacementAd from '~/components/ads/placement-ad.vue'
import type { FeedPost } from '~/composables/useSocialFeed'
import { PROFILE_FIELD_LABELS, isFieldPublic, type PrivateProfileField } from '~/shared/profile-fields'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

type PalStatus = 'none' | 'friends' | 'outgoing' | 'incoming'

interface PublicProfile {
  user_id: string
  username: string | null
  display_name: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  website: string | null
  gender: string | null
  birth_date: string | null
  marital_status: string | null
  university: string | null
  work: string | null
  religion: string | null
  interest_tags: string[] | null
  field_visibility?: Record<string, boolean> | null
  locked: boolean
  is_online: boolean
  show_online: boolean
  last_seen: string | null
  is_verified: boolean | null
  posts_count: number | null
  followers_count: number
  following_count: number
  pals_count: number
  following_hidden: boolean
  relationship: {
    is_self: boolean
    is_following: boolean
    follows_you: boolean
    pal_status: PalStatus
    pal_request_id: string | null
  }
}

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const profile = ref<PublicProfile | null>(null)
const listKind = ref<'followers' | 'following' | 'pals' | null>(null)
const listNotice = ref('')

const isSelf = computed(() => Boolean(profile.value?.relationship.is_self))
const displayName = computed(() =>
  profile.value?.display_name || profile.value?.full_name || profile.value?.username || 'User'
)

const DETAIL_ICONS: Record<Exclude<PrivateProfileField, 'interests'>, string> = {
  work: 'briefcase',
  university: 'book-open',
  location: 'map-pin',
  marital_status: 'heart',
  religion: 'star',
  gender: 'user',
  birth_date: 'calendar',
  website: 'link'
}

const formatDetail = (key: string, value: string) => {
  if (key === 'birth_date') return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  if (key === 'gender') return value.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())
  return value
}

const detailRows = computed(() => {
  const p = profile.value
  if (!p) return []
  return (Object.keys(DETAIL_ICONS) as (keyof typeof DETAIL_ICONS)[])
    .filter(key => typeof p[key] === 'string' && p[key])
    .map(key => ({ key, icon: DETAIL_ICONS[key], label: PROFILE_FIELD_LABELS[key], value: formatDetail(key, p[key] as string) }))
})

const interests = computed(() => profile.value?.interest_tags ?? [])

const hiddenFields = computed(() => {
  const vis = profile.value?.field_visibility
  return new Set((Object.keys(PROFILE_FIELD_LABELS) as PrivateProfileField[]).filter(f => !isFieldPublic(vis, f)))
})

const presenceText = computed(() => {
  const p = profile.value
  if (!p) return ''
  if (p.is_online) return 'Online'
  if (!p.last_seen) return ''
  const mins = Math.round((Date.now() - new Date(p.last_seen).getTime()) / 60000)
  if (mins < 1) return 'Last seen just now'
  if (mins < 60) return `Last seen ${mins} min ago`
  if (mins < 1440) return `Last seen ${Math.round(mins / 60)} h ago`
  return `Last seen ${new Date(p.last_seen).toLocaleDateString()}`
})

const posts = ref<FeedPost[]>([])
const postsLoading = ref(false)
const postsPage = ref(1)
const postsHasMore = ref(false)
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const loadPosts = async (reset = false) => {
  const p = profile.value
  if (!p || p.locked || postsLoading.value) return
  if (reset) {
    posts.value = []
    postsPage.value = 1
  }
  postsLoading.value = true
  try {
    const res = await $fetch<{ data?: { posts: FeedPost[], hasMore: boolean } }>(
      `/api/posts/user/${p.user_id}`,
      { query: { page: postsPage.value, limit: 10 } }
    )
    posts.value = [...posts.value, ...(res.data?.posts ?? [])]
    postsHasMore.value = Boolean(res.data?.hasMore)
    postsPage.value += 1
  } catch (e) {
    console.error('[profile] posts failed', e)
    postsHasMore.value = false
  } finally {
    postsLoading.value = false
  }
}

watch(sentinel, (el) => {
  observer?.disconnect()
  if (!el) return
  observer = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting) && postsHasMore.value) void loadPosts()
  }, { rootMargin: '400px' })
  observer.observe(el)
})
onBeforeUnmount(() => observer?.disconnect())

const isAddressable = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ||
  /^[a-z0-9_.-]{2,40}$/i.test(v)

const onAvatarError = (e: Event) => {
  (e.target as HTMLImageElement).src = '/default-avatar.svg'
}

const goBack = () => (window.history.length > 1 ? router.back() : router.push('/feed'))

const openList = (kind: 'followers' | 'following' | 'pals') => {
  listNotice.value = ''
  if (kind === 'following' && profile.value?.following_hidden) {
    listNotice.value = 'This user keeps the accounts they follow private.'
    return
  }
  listKind.value = kind
}

const openChat = () => {
  if (profile.value) router.push({ path: '/chat', query: { user: profile.value.user_id } })
}

const onFollowChanged = (following: boolean, followersCount: number | null) => {
  if (!profile.value) return
  profile.value.relationship.is_following = following
  if (followersCount !== null) profile.value.followers_count = followersCount
}

const onPalChanged = (status: PalStatus) => {
  if (!profile.value) return
  const wasFriends = profile.value.relationship.pal_status === 'friends'
  profile.value.relationship.pal_status = status
  if (status === 'friends' && !wasFriends) profile.value.pals_count += 1
  if (status !== 'friends' && wasFriends) profile.value.pals_count = Math.max(0, profile.value.pals_count - 1)
}

const load = async () => {
  loading.value = true
  error.value = ''
  listKind.value = null
  listNotice.value = ''
  try {
    const id = String(route.params.id || '').trim()
    if (!id || !isAddressable(id)) {
      error.value = 'Invalid profile address.'
      return
    }
    profile.value = await $fetch<PublicProfile>(`/api/profile/${encodeURIComponent(id)}`)
    void loadPosts(true)
  } catch (e: unknown) {
    const err = e as { statusCode?: number, data?: { statusMessage?: string } }
    error.value = err.statusCode === 404 ? 'Profile not found.' : err.data?.statusMessage || 'Failed to load profile.'
    profile.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, load, { immediate: true })
</script>

<style scoped>
.profile-page { min-height: 100vh; background: #0f172a; padding: 16px; }
.profile-container { max-width: 900px; margin: 0 auto; }
.back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #94a3b8; cursor: pointer; margin-bottom: 12px; font-size: 0.9rem; }
.state-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; color: #cbd5e1; text-align: center; }
.state-card.error h2 { color: #fca5a5; }
.spinner { width: 34px; height: 34px; border: 3px solid #334155; border-top-color: #3b82f6; border-radius: 999px; margin: 0 auto 10px; animation: spin 1s linear infinite; }
.profile-header { display: grid; grid-template-columns: 110px 1fr; gap: 18px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; color: #e2e8f0; }
.avatar-wrap { position: relative; width: 110px; height: 110px; }
.avatar { width: 110px; height: 110px; border-radius: 999px; object-fit: cover; border: 2px solid #3b82f6; }
.online-dot { position: absolute; right: 8px; bottom: 8px; width: 16px; height: 16px; border-radius: 999px; background: #22c55e; border: 3px solid #1e293b; }
.presence { margin-top: 4px; color: #94a3b8; font-size: 0.8rem; }
.presence.online { color: #4ade80; }
.locked-card, .details-card { margin-top: 14px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px 20px; color: #cbd5e1; }
.locked-card { display: flex; align-items: center; gap: 10px; color: #fbbf24; }
.details-card h2, .posts-section h2 { font-size: 1rem; font-weight: 700; color: #f1f5f9; margin-bottom: 10px; }
.details { list-style: none; display: grid; gap: 8px; }
.details li { display: flex; align-items: center; gap: 8px; min-width: 0; flex-wrap: wrap; }
.details .label { color: #64748b; font-size: 0.8rem; min-width: 120px; }
.details a { color: #60a5fa; word-break: break-all; }
.private-mark { color: #64748b; }
.interests { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; align-items: center; }
.interest { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); color: #bfdbfe; border-radius: 999px; padding: 2px 10px; font-size: 0.8rem; }
.posts-section { margin-top: 18px; }
.posts-list { display: flex; flex-direction: column; gap: 14px; }
.sentinel { min-height: 24px; text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 8px; }
.identity { min-width: 0; }
.name-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.name-row h1 { font-size: 1.4rem; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; }
.verified { color: #3b82f6; }
.username { color: #94a3b8; margin-top: 4px; display: flex; align-items: center; gap: 8px; }
.follows-you { background: #334155; color: #cbd5e1; font-size: 0.7rem; padding: 2px 8px; border-radius: 6px; }
.bio { margin-top: 10px; color: #cbd5e1; white-space: pre-line; }
.meta { margin-top: 6px; color: #94a3b8; display: flex; align-items: center; gap: 4px; }
.stats { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 14px; }
.stat { background: none; border: none; color: #94a3b8; padding: 0; cursor: pointer; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 4px; }
.stat strong { color: #f1f5f9; font-weight: 700; }
.stat.static { cursor: default; }
.stat:not(.static):hover strong { text-decoration: underline; }
.stat.locked { cursor: not-allowed; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.btn { display: inline-flex; align-items: center; gap: 6px; background: #2563eb; color: white; padding: 0.45rem 1rem; border-radius: 999px; text-decoration: none; border: none; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
.btn.secondary { background: #334155; }
.notice { margin-top: 10px; color: #fbbf24; font-size: 0.85rem; }
@media (max-width: 560px) {
  .profile-header { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .name-row, .username, .stats, .actions { justify-content: center; }
  .avatar-wrap { margin: 0 auto; }
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
