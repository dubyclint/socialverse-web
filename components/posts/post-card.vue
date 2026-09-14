<template>
  <article class="post-card" :class="{ sponsored: post.sponsored }">
    <header class="post-header">
      <img
        :src="post.author?.avatar_url || '/default-avatar.svg'"
        :alt="post.author?.full_name || 'User'"
        class="author-avatar"
        @click="openAuthor"
      />
      <div class="author-details">
        <h4 class="author-name">
          {{ post.author?.full_name || 'Unknown user' }}
          <span v-if="post.author?.verified" class="badge" title="Verified">
            <Icon name="check-circle" size="14" />
          </span>
        </h4>
        <p class="author-handle">@{{ post.author?.username || 'unknown' }}</p>
      </div>
      <span class="post-timestamp">{{ formatTimeAgo(post.created_at) }}</span>
    </header>

    <div class="post-content" @click="openPost">
      <p v-if="post.content" class="post-text">{{ post.content }}</p>
      <div v-if="post.media?.length" class="post-media">
        <img
          v-for="(url, index) in post.media"
          :key="index"
          :src="url"
          :alt="`Post media ${index + 1}`"
          loading="lazy"
        />
      </div>
      <div v-if="post.hashtags?.length" class="post-hashtags">
        <NuxtLink
          v-for="tag in post.hashtags"
          :key="tag"
          :to="`/explore?tag=${tag}`"
          class="hashtag"
          @click.stop
        >#{{ tag }}</NuxtLink>
      </div>
    </div>

    <PostInteractionToolbar :post="post" @open-gift="$emit('pewgift', post)" />
  </article>
</template>

<script setup lang="ts">
import PostInteractionToolbar from '~/components/posts/PostInteractionToolbar.vue'
import type { RankedPost } from '~/server/utils/feed-ranker'

const props = defineProps<{ post: RankedPost & { sponsored?: boolean } }>()
defineEmits<{ pewgift: [post: RankedPost] }>()

const router = useRouter()

const openPost = () => router.push(`/posts/${props.post.id}`)

const openAuthor = () => {
  const author = props.post.author
  if (author?.username) router.push(`/profile/${author.username}`)
}

const formatTimeAgo = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.post-card {
  background: var(--bg-card, #0a0f1e);
  border: 1px solid var(--color-dark-grey, #1f2937);
  border-radius: var(--radius-lg, 24px);
  overflow: hidden;
  color: var(--text-primary, #f0fffb);
}

.post-card.sponsored {
  border-color: var(--color-solar-gold, #ffc857);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}

.author-avatar {
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
}

.author-details {
  flex: 1;
  min-width: 0;
}

.author-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.badge {
  color: var(--color-aurora-mint, #6fffd4);
  display: inline-flex;
}

.author-handle {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}

.post-timestamp {
  font-size: 0.8rem;
  opacity: 0.6;
  white-space: nowrap;
}

.post-content {
  padding: 0 1rem 0.75rem;
  cursor: pointer;
}

.post-text {
  margin: 0 0 0.75rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.post-media {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.post-media img {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: var(--radius-sm, 8px);
}

.post-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.hashtag {
  color: var(--color-aurora-mint, #6fffd4);
  font-size: 0.85rem;
  text-decoration: none;
}
</style>
