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
          <img
            :src="profile.avatar_url || '/default-avatar.svg'"
            :alt="displayName"
            class="avatar"
            @error="onAvatarError"
          />
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
            <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>
            <p v-if="profile.location" class="meta"><Icon name="map-pin" size="14" /> {{ profile.location }}</p>

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
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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
.avatar { width: 110px; height: 110px; border-radius: 999px; object-fit: cover; border: 2px solid #3b82f6; }
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
  .name-row, .username, .stats, .actions, .meta { justify-content: center; }
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
