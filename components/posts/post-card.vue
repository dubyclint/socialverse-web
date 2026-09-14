<template>
  <article class="post-card" :class="{ sponsored }">
    <p v-if="post.repost_of" class="repost-banner">
      <Icon name="refresh" size="14" />
      <NuxtLink :to="authorLink" class="repost-author">{{ authorName }}</NuxtLink>
      reposted
    </p>

    <header class="post-header">
      <img :src="avatar" :alt="authorName" class="post-avatar" @click="openAuthor" />
      <div class="post-identity">
        <NuxtLink :to="authorLink" class="post-author">
          {{ authorName }}
          <Icon v-if="post.author?.verified" name="check-circle" size="13" class="verified" />
        </NuxtLink>
        <span class="post-meta">
          <span class="handle">@{{ post.author?.username || 'unknown' }}</span>
          <span class="dot">·</span>
          <time :datetime="post.created_at">{{ formatTimeAgo(post.created_at) }}</time>
        </span>
      </div>
      <div class="post-menu-wrap">
        <button class="icon-btn" aria-label="Post options" @click="menuOpen = !menuOpen">
          <Icon name="more-horizontal" size="18" />
        </button>
        <ul v-if="menuOpen" class="post-menu" @click="menuOpen = false">
          <li v-if="isMine"><button type="button" @click="editing = true"><Icon name="edit" size="14" /> Edit post</button></li>
          <li v-if="isMine"><button type="button" @click="onDelete"><Icon name="trash" size="14" /> Delete post</button></li>
          <li><button type="button" @click="copyLink"><Icon name="copy" size="14" /> Copy link</button></li>
          <li v-if="!isMine"><button type="button" @click="report"><Icon name="flag" size="14" /> Report</button></li>
        </ul>
      </div>
    </header>

    <div v-if="content" class="post-body">
      <p class="post-text">{{ content }}</p>
    </div>

    <PostsPostMedia v-if="media.length" :media="media" @open="openPost" />

    <div v-if="post.repost_of" class="repost-source">
      <div class="repost-source-head">
        <img
          :src="post.repost_of.author?.avatar_url || '/default-avatar.svg'"
          alt=""
          class="repost-avatar"
        />
        <span class="repost-source-name">
          {{ post.repost_of.author?.full_name || 'Unknown user' }}
        </span>
        <span class="repost-source-time">{{ formatTimeAgo(post.repost_of.created_at) }}</span>
      </div>
      <p v-if="post.repost_of.content" class="post-text">{{ post.repost_of.content }}</p>
      <PostsPostMedia v-if="post.repost_of.media?.length" :media="post.repost_of.media" />
    </div>

    <div v-if="post.hashtags?.length" class="post-hashtags">
      <NuxtLink v-for="tag in post.hashtags" :key="tag" :to="`/explore?tag=${tag}`" class="hashtag">
        #{{ tag }}
      </NuxtLink>
    </div>

    <div class="post-counts">
      <button type="button" class="count-btn" :disabled="!likesCount" @click="toggleLikers">
        <Icon name="heart" size="13" /> {{ likesCount }}
      </button>
      <button type="button" class="count-btn" @click="toggleComments">
        {{ commentsCount }} comments
      </button>
      <span class="count-btn static">{{ sharesCount }} shares</span>
      <span class="count-btn static"><Icon name="gift" size="13" /> {{ post.gifts_count }}</span>
    </div>

    <ul v-if="likersOpen" class="likers">
      <li v-if="likersLoading" class="likers-state">Loading...</li>
      <li v-for="liker in likers" v-else :key="liker.id" class="liker">
        <img :src="liker.avatar || '/default-avatar.svg'" alt="" class="liker-avatar" />
        <NuxtLink :to="`/profile/${liker.username}`">{{ liker.name }}</NuxtLink>
      </li>
    </ul>

    <div class="post-actions">
      <button
        type="button"
        class="action-btn"
        :class="{ active: liked }"
        @click="onLike"
      >
        <Icon name="heart" size="18" /> <span>Like</span>
      </button>
      <button type="button" class="action-btn" :class="{ active: commentsOpen }" @click="toggleComments">
        <Icon name="message-square" size="18" /> <span>Comment</span>
      </button>
      <button type="button" class="action-btn" :disabled="reposting" @click="onRepost">
        <Icon name="refresh" size="18" /> <span>Repost</span>
      </button>
      <button type="button" class="action-btn" @click="onShare">
        <Icon name="share" size="18" /> <span>Share</span>
      </button>
      <button type="button" class="action-btn gift" @click="$emit('pewgift', post)">
        <Icon name="gift" size="18" /> <span>Gift</span>
      </button>
    </div>

    <p v-if="notice" class="post-notice">{{ notice }}</p>

    <PostsPostComments
      v-if="commentsOpen"
      :post-id="post.id"
      :viewer-avatar="viewerAvatar"
      @added="commentsCount += 1"
    />

    <PostsPostEditModal
      v-if="editing"
      :post="post"
      @close="editing = false"
      @saved="onEdited"
    />
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FeedPost, PostLiker } from '~/composables/useSocialFeed'

const props = withDefaults(
  defineProps<{ post: FeedPost, sponsored?: boolean, viewerAvatar?: string }>(),
  { sponsored: false, viewerAvatar: '/default-avatar.svg' }
)

const emit = defineEmits<{ pewgift: [post: FeedPost], removed: [postId: string] }>()

const router = useRouter()
const {
  currentUserId,
  likePost,
  sharePost,
  deletePost,
  repostPost,
  fetchLikers
} = useSocialFeed()

// Counts and editable fields are mirrored locally: a card must not write back
// into the feed's post objects.
const liked = ref(props.post.liked_by_me)
const likesCount = ref(props.post.likes_count)
const commentsCount = ref(props.post.comments_count)
const sharesCount = ref(props.post.shares_count)
const content = ref(props.post.content)
const media = ref<string[]>([...(props.post.media ?? [])])

watch(() => props.post, (post) => {
  liked.value = post.liked_by_me
  likesCount.value = post.likes_count
  commentsCount.value = post.comments_count
  sharesCount.value = post.shares_count
  content.value = post.content
  media.value = [...(post.media ?? [])]
})

const menuOpen = ref(false)
const commentsOpen = ref(false)
const likersOpen = ref(false)
const likersLoading = ref(false)
const likers = ref<PostLiker[]>([])
const editing = ref(false)
const reposting = ref(false)
const notice = ref('')

const isMine = computed(() => Boolean(currentUserId.value) && props.post.author?.id === currentUserId.value)
const authorName = computed(() => props.post.author?.full_name || 'Unknown user')
const authorLink = computed(() => `/profile/${props.post.author?.username || ''}`)
const avatar = computed(() => props.post.author?.avatar_url || '/default-avatar.svg')

const flash = (message: string) => {
  notice.value = message
  setTimeout(() => { if (notice.value === message) notice.value = '' }, 3000)
}

const openPost = () => router.push(`/posts/${props.post.id}`)
const openAuthor = () => {
  if (props.post.author?.username) router.push(authorLink.value)
}

const onLike = async () => {
  const result = await likePost(props.post.id)
  if (!result) return flash('Could not update your like')

  liked.value = result.liked
  likesCount.value = result.likesCount
  if (likersOpen.value) await loadLikers()
}

const toggleComments = () => {
  commentsOpen.value = !commentsOpen.value
}

const loadLikers = async () => {
  likersLoading.value = true
  try {
    likers.value = await fetchLikers(props.post.id)
  } finally {
    likersLoading.value = false
  }
}

const toggleLikers = async () => {
  likersOpen.value = !likersOpen.value
  if (likersOpen.value) await loadLikers()
}

const onRepost = async () => {
  reposting.value = true
  const ok = await repostPost(props.post.id)
  reposting.value = false
  flash(ok ? 'Reposted to your feed' : 'Could not repost')
}

const onShare = async () => {
  const url = await sharePost(props.post.id, 'copy')
  if (!url) return flash('Could not share this post')
  sharesCount.value += 1

  if (import.meta.client && navigator.share) {
    try {
      await navigator.share({ url, text: content.value.slice(0, 120) })
      return
    } catch {
      // user dismissed the sheet; fall through to clipboard
    }
  }
  if (import.meta.client) await navigator.clipboard?.writeText(url)
  flash('Link copied')
}

const copyLink = async () => {
  if (!import.meta.client) return
  await navigator.clipboard?.writeText(`${window.location.origin}/posts/${props.post.id}`)
  flash('Link copied')
}

const report = async () => {
  try {
    const result = await $fetch<{ success: boolean, message: string }>(
      `/api/posts/${props.post.id}/report`,
      { method: 'POST', body: { reason: 'other' } }
    )
    flash(result.message)
  } catch {
    flash('Could not submit report')
  }
}

const onDelete = async () => {
  if (import.meta.client && !window.confirm('Delete this post?')) return
  const ok = await deletePost(props.post.id)
  if (ok) emit('removed', props.post.id)
  else flash('Could not delete this post')
}

const onEdited = (updated: { content: string, media: string[] }) => {
  content.value = updated.content
  media.value = updated.media
  editing.value = false
}

const formatTimeAgo = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.post-card {
  background: var(--bg-card, #0a0f1e);
  border: 1px solid var(--color-dark-grey, #1f2937);
  border-radius: var(--radius-md, 16px);
  overflow: hidden;
  color: var(--text-primary, #f0fffb);
}

.post-card.sponsored { border-color: var(--color-solar-gold, #ffc857); }

.repost-banner {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  padding: 0.5rem 0.85rem 0;
  font-size: 0.78rem;
  opacity: 0.75;
}

.repost-author { color: inherit; font-weight: 600; text-decoration: none; }

/* Header stays a single horizontal row on every breakpoint. */
.post-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.85rem;
}

.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
}

.post-identity {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.post-author {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.verified { color: var(--color-aurora-mint, #6fffd4); }

.post-meta {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  opacity: 0.65;
  white-space: nowrap;
  overflow: hidden;
}

.handle { overflow: hidden; text-overflow: ellipsis; }

.post-menu-wrap { position: relative; flex-shrink: 0; }

.icon-btn {
  background: none;
  border: none;
  color: inherit;
  padding: 0.3rem;
  border-radius: 9999px;
  cursor: pointer;
}

.post-menu {
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 30;
  min-width: 170px;
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  background: var(--color-charcoal, #121827);
  border: 1px solid var(--color-dark-grey, #1f2937);
  border-radius: var(--radius-sm, 8px);
  box-shadow: 0 4px 20px rgba(10, 15, 30, 0.4);
}

.post-menu button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.6rem;
  background: none;
  border: none;
  color: inherit;
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
}

.post-menu button:hover { background: rgba(111, 255, 212, 0.08); }

.post-body { padding: 0 0.85rem 0.6rem; }

.post-text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.repost-source {
  margin: 0 0.85rem 0.6rem;
  border: 1px solid var(--color-dark-grey, #1f2937);
  border-radius: var(--radius-sm, 8px);
  overflow: hidden;
  padding-bottom: 0.5rem;
}

.repost-source-head {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.6rem;
  font-size: 0.8rem;
}

.repost-avatar { width: 24px; height: 24px; border-radius: 9999px; object-fit: cover; }
.repost-source-name { font-weight: 600; }
.repost-source-time { opacity: 0.6; margin-left: auto; }
.repost-source .post-text { padding: 0 0.6rem 0.4rem; }

.post-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem 0;
}

.hashtag { color: var(--color-aurora-mint, #6fffd4); font-size: 0.82rem; text-decoration: none; }

.post-counts {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.5rem 0.85rem;
  font-size: 0.78rem;
  opacity: 0.8;
}

.count-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: inherit;
  font-size: 0.78rem;
  padding: 0;
  cursor: pointer;
}

.count-btn:disabled { cursor: default; opacity: 0.6; }
.count-btn.static { cursor: default; }

.likers {
  list-style: none;
  margin: 0 0.85rem 0.5rem;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  background: var(--color-charcoal, #121827);
  border-radius: var(--radius-sm, 8px);
  max-height: 180px;
  overflow-y: auto;
}

.liker { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
.liker a { color: inherit; text-decoration: none; }
.liker-avatar { width: 24px; height: 24px; border-radius: 9999px; object-fit: cover; }
.likers-state { font-size: 0.8rem; opacity: 0.7; }

/* Compact action bar so the media keeps the space. */
.post-actions {
  display: flex;
  border-top: 1px solid var(--color-dark-grey, #1f2937);
}

.action-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.5rem 0.2rem;
  background: none;
  border: none;
  color: inherit;
  opacity: 0.8;
  font-size: 0.82rem;
  cursor: pointer;
}

.action-btn:hover { background: rgba(111, 255, 212, 0.07); }
.action-btn.active { color: var(--color-aurora-mint, #6fffd4); opacity: 1; }
.action-btn.gift { color: var(--color-solar-gold, #ffc857); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.post-notice {
  margin: 0;
  padding: 0.4rem 0.85rem;
  font-size: 0.8rem;
  color: var(--color-aurora-mint, #6fffd4);
}

@media (max-width: 768px) {
  .post-card { border-radius: 0; border-left: none; border-right: none; }
  .action-btn span { display: none; }
  .action-btn { padding: 0.6rem 0.2rem; }
}
</style>
