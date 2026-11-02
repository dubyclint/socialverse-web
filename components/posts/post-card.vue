<template>
  <article class="post-card" :class="{ sponsored }">
    <p v-if="post.repost_of" class="repost-banner">
      <Icon name="refresh" size="14" />
      <NuxtLink :to="authorLink" class="repost-author">{{ authorName }}</NuxtLink>
      reposted
    </p>

    <header class="post-header">
      <span class="post-avatar-wrap" :class="{ 'status-ring': hasUnseen(post.author?.id) }">
        <img :src="avatar" :alt="authorName" class="post-avatar" @click="hasUnseen(post.author?.id) ? navigateTo(`/status?u=${post.author?.id}`) : openAuthor()" />
        <PresenceDot v-if="post.author?.type !== 'PAGE'" :user-id="post.author?.id" :size="11" />
      </span>
      <div class="post-identity">
        <span class="author-row">
          <NuxtLink :to="authorLink" class="post-author">
            <span class="author-name">{{ authorName }}</span>
            <VerifiedBadge v-if="post.author?.verified" :type="post.author?.verified_type" :size="16" />
          </NuxtLink>
          <SocialFollowButton v-if="!isMine && post.author?.id && post.author?.type !== 'PAGE'" :user-id="post.author.id" compact />
        </span>
        <span class="post-meta">
          <span class="handle">@{{ post.author?.username || 'unknown' }}</span>
          <span class="dot">·</span>
          <time :datetime="post.created_at">{{ formatTimeAgo(post.created_at) }}</time>
        </span>
      </div>
      <div class="post-menu-wrap">
        <button class="icon-btn" aria-label="Post options" @click="menuOpen = !menuOpen">
          <Icon name="more-vertical" size="18" />
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
      <p ref="textEl" class="post-text" :class="{ clamp: !textOpen }">{{ content }}</p>
      <button v-if="textLong" type="button" class="read-more" @click="textOpen = !textOpen">{{ textOpen ? 'Show less' : 'Read more' }}</button>
    </div>

    <PostsPostMedia v-if="media.length" :media="media" :post-id="post.id" @open="openPost" />

    <div v-if="post.repost_of" class="repost-source">
      <div class="repost-source-head">
        <NuxtLink
          v-if="post.repost_of.author?.username"
          :to="`/profile/${post.repost_of.author.username}`"
          class="repost-avatar-link"
        >
          <img
            :src="post.repost_of.author?.avatar_url || '/default-avatar.svg'"
            :alt="post.repost_of.author?.full_name || 'User'"
            class="repost-avatar"
          />
        </NuxtLink>
        <img
          v-else
          :src="post.repost_of.author?.avatar_url || '/default-avatar.svg'"
          alt=""
          class="repost-avatar"
        />
        <span class="repost-source-name">
          {{ post.repost_of.author?.full_name || 'Unknown user' }}
          <VerifiedBadge v-if="post.repost_of.author?.verified" :type="post.repost_of.author?.verified_type" :size="14" />
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
        <NuxtLink :to="liker.type === 'PAGE' ? `/pages/${liker.username}` : `/profile/${liker.username}`" class="liker-avatar-link">
          <img :src="liker.avatar || '/default-avatar.svg'" :alt="liker.name" class="liker-avatar" />
        </NuxtLink>
        <NuxtLink :to="liker.type === 'PAGE' ? `/pages/${liker.username}` : `/profile/${liker.username}`">{{ liker.name }}</NuxtLink>
      </li>
    </ul>

    <div class="post-actions">
      <button
        type="button"
        class="action-btn"
        :class="{ active: liked }"
        @click="onLike($event)"
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
      @delta="commentsCount = Math.max(0, commentsCount + $event)"
      @synced="onCommentsSynced"
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
import { useStatusRings } from '~/composables/useStatusRings'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import PresenceDot from '~/components/presence-dot.vue'
import VerifiedBadge from '~/components/VerifiedBadge.vue'
import type { FeedPost, PostLiker } from '~/composables/useSocialFeed'
import { useEngagementSync } from '~/composables/use-engagement-sync'

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

const engagement = useEngagementSync()

/**
 * Server counts plus whatever this device has done that hasn't synced yet, so
 * a queued like/comment/share stays visible across refreshes and bad networks.
 */
const countsFor = (post: FeedPost) => {
  const cached = engagement.readMetrics(post.id)
  const pending = engagement.pendingFor(post.id)
  const serverLiked = post.liked_by_me ?? cached?.liked ?? false
  const liked = pending.liked ?? serverLiked
  const likeDelta = liked === serverLiked ? 0 : liked ? 1 : -1
  return {
    liked,
    likes: Math.max(0, (post.likes_count ?? cached?.likes ?? 0) + likeDelta),
    comments: (post.comments_count ?? cached?.comments ?? 0) + pending.comments.length,
    shares: (post.shares_count ?? cached?.shares ?? 0) + pending.shares
  }
}

// Counts and editable fields are mirrored locally: a card must not write back
// into the feed's post objects.
const initial = countsFor(props.post)
const liked = ref(initial.liked)
const likesCount = ref(initial.likes)
const commentsCount = ref(initial.comments)
const sharesCount = ref(initial.shares)
const content = ref(props.post.content)
const textEl = ref<HTMLElement | null>(null)
const textOpen = ref(false)
const textLong = ref(false)
const measureText = () => { const el = textEl.value; if (el && !textOpen.value) textLong.value = el.scrollHeight > el.clientHeight + 2 }
onMounted(() => nextTick(measureText))
watch(content, () => nextTick(measureText))
const media = ref<string[]>([...(props.post.media ?? [])])
const { hasUnseen } = useStatusRings()

watch(() => props.post, (post) => {
  const counts = countsFor(post)
  liked.value = counts.liked
  likesCount.value = counts.likes
  commentsCount.value = counts.comments
  sharesCount.value = counts.shares
  content.value = post.content
  media.value = [...(post.media ?? [])]
})

watch([liked, likesCount, commentsCount, sharesCount], () => {
  engagement.saveMetrics(props.post.id, {
    liked: liked.value,
    likes: likesCount.value,
    comments: commentsCount.value,
    shares: sharesCount.value
  })
}, { immediate: true })

const onCommentsSynced = (serverCount: number) => {
  commentsCount.value = serverCount + engagement.pendingFor(props.post.id).comments.length
}

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
const authorLink = computed(() => props.post.author?.type === 'PAGE'
  ? `/pages/${props.post.author.username}`
  : `/profile/${props.post.author?.username || ''}`)
const avatar = computed(() => props.post.author?.avatar_url || '/default-avatar.svg')

const flash = (message: string) => {
  notice.value = message
  setTimeout(() => { if (notice.value === message) notice.value = '' }, 3000)
}

const openPost = () => router.push(`/posts/${props.post.id}`)
const openAuthor = () => {
  if (props.post.author?.username) router.push(authorLink.value)
}

const { heartPop } = useCelebrate()

const onLike = async (event?: MouseEvent) => {
  const previous = { liked: liked.value, likes: likesCount.value }
  const next = !liked.value
  if (next && event) heartPop(event.clientX, event.clientY)
  liked.value = next
  likesCount.value = Math.max(0, likesCount.value + (next ? 1 : -1))

  const result = await likePost(props.post.id, next)
  if (result.status === 'failed') {
    liked.value = previous.liked
    likesCount.value = previous.likes
    return flash(result.message || 'Could not update your like')
  }
  if (result.status === 'queued') return

  liked.value = result.data.liked
  likesCount.value = result.data.likesCount
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
  const shared = await sharePost(props.post.id, 'copy')
  if (!shared) return flash('Could not share this post')
  const { url } = shared
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

.post-avatar-wrap { position: relative; display: inline-flex; flex-shrink: 0; }
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

.author-row { display: inline-flex; align-items: center; gap: 0.5rem; min-width: 0; }

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

.post-text.clamp { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.read-more { background: none; border: 0; padding: 0; margin-top: 2px; color: #60a5fa; font-size: 0.78rem; font-weight: 600; cursor: pointer; min-height: 0; }
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
.liker-avatar-link, .repost-avatar-link { display: inline-flex; flex-shrink: 0; }
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

/* Mobile keeps the desktop card design, scaled down. */
@media (max-width: 768px) {
  .post-card { border-radius: 12px; }
  .repost-banner { padding: 0.4rem 0.65rem 0; font-size: 0.7rem; }
  .post-header { gap: 0.5rem; padding: 0.5rem 0.65rem; }
  .post-avatar { width: 34px; height: 34px; }
  .post-author { font-size: 0.82rem; }
  .post-meta { font-size: 0.68rem; }
  .post-body { padding: 0 0.65rem 0.5rem; }
  .post-text { font-size: 0.84rem; line-height: 1.4; }
  .hashtag { font-size: 0.74rem; }
  .post-actions { gap: 0; }
  .action-btn { min-height: 0; padding: 0.4rem 0.15rem; font-size: 0.72rem; gap: 0.25rem; }
  .action-btn span { display: inline; }
  .action-btn :deep(svg) { width: 16px; height: 16px; }
}
.status-ring { border-radius: 50%; padding: 2px; background: conic-gradient(#3b82f6, #1d4ed8, #3b82f6); display: inline-flex; }
.status-ring .post-avatar { border: 2px solid #0f172a; }
/* One-line header: photo · name @handle · time · follow ··· menu */
.post-card .post-header { display: flex; flex-wrap: nowrap; align-items: center; gap: 0.45rem; padding: 0.4rem 0.6rem; min-height: 0; }
.post-card .post-identity { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: row; align-items: center; gap: 0.35rem; overflow: hidden; white-space: nowrap; }
.post-card .author-row { display: inline-flex; align-items: center; gap: 0.3rem; min-width: 0; flex: 0 1 auto; }
.post-card .post-author { display: inline-flex; align-items: center; gap: 3px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.2; }
.post-card .post-meta { display: inline-flex; align-items: center; gap: 3px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.2; margin: 0; }
.post-card .post-meta .handle { overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.post-card .post-menu-wrap { margin-left: auto; }
.post-card .post-menu-wrap .icon-btn { padding: 2px; min-height: 0; min-width: 0; }
/* main.css stacks every .post-header vertically under 480px; posts keep a single row. */
.post-card .post-header { flex-direction: row !important; border-bottom: 0; margin: 0; }
.post-card .author-row :deep(button) { min-height: 0 !important; height: auto; padding: 2px 10px; font-size: 0.72rem; line-height: 1.3; width: auto !important; margin: 0 !important; flex-shrink: 0; }
@media (max-width: 768px) {
  .post-card .post-header { align-items: center; }
  .post-card .post-avatar { width: 34px; height: 34px; }
  .post-card .post-identity { flex-direction: column; align-items: flex-start; gap: 1px; }
  .post-card .author-row { max-width: 100%; }
  .post-card .post-meta { max-width: 100%; font-size: 0.68rem; }
  .post-card .post-menu-wrap { align-self: center; }
}
.post-card .post-author { flex: 0 1 auto; max-width: 100%; }
.post-card .post-author .author-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.post-card .post-author > :not(.author-name) { flex-shrink: 0; }
.post-card .author-row > :not(.post-author) { flex-shrink: 0; }
</style>
