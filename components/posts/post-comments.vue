<template>
  <section class="comments">
    <form class="comment-composer" @submit.prevent="submit()">
      <img :src="viewerAvatar" alt="" class="composer-avatar" />
      <input
        v-model="draft"
        class="composer-input"
        type="text"
        maxlength="500"
        placeholder="Write a comment..."
      />
      <button class="composer-send" type="submit" :disabled="!draft.trim() || sending">
        <Icon name="send" size="16" />
      </button>
    </form>

    <p v-if="error" class="comments-error">{{ error }}</p>
    <p v-if="loading" class="comments-state">Loading comments...</p>
    <p v-else-if="!threads.length" class="comments-state">No comments yet.</p>

    <ul v-else class="comment-list">
      <li v-for="thread in threads" :key="thread.comment.id" class="comment-thread">
        <article class="comment">
          <img :src="thread.comment.author.avatar || '/default-avatar.svg'" alt="" class="comment-avatar" />
          <div class="comment-body">
            <NuxtLink :to="`/profile/${thread.comment.author.username}`" class="comment-author">
              {{ thread.comment.author.name }}
            </NuxtLink>
            <p class="comment-text">{{ thread.comment.content }}</p>
            <div class="comment-meta">
              <span>{{ formatTimeAgo(thread.comment.createdAt) }}</span>
              <button type="button" @click="replyingTo = replyingTo === thread.comment.id ? null : thread.comment.id">
                Reply
              </button>
            </div>

            <form
              v-if="replyingTo === thread.comment.id"
              class="reply-composer"
              @submit.prevent="submit(thread.comment.id)"
            >
              <input
                v-model="replyDraft"
                class="composer-input"
                type="text"
                maxlength="500"
                :placeholder="`Reply to ${thread.comment.author.name}`"
              />
              <button class="composer-send" type="submit" :disabled="!replyDraft.trim() || sending">
                <Icon name="send" size="14" />
              </button>
            </form>

            <ul v-if="thread.replies.length" class="reply-list">
              <li v-for="reply in thread.replies" :key="reply.id" class="comment reply">
                <img :src="reply.author.avatar || '/default-avatar.svg'" alt="" class="comment-avatar small" />
                <div class="comment-body">
                  <NuxtLink :to="`/profile/${reply.author.username}`" class="comment-author">
                    {{ reply.author.name }}
                  </NuxtLink>
                  <p class="comment-text">{{ reply.content }}</p>
                  <div class="comment-meta"><span>{{ formatTimeAgo(reply.createdAt) }}</span></div>
                </div>
              </li>
            </ul>
          </div>
        </article>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { PostComment } from '~/composables/useSocialFeed'

const props = defineProps<{ postId: string, viewerAvatar: string }>()
const emit = defineEmits<{ added: [comment: PostComment] }>()

const { fetchComments, addComment } = useSocialFeed()

const comments = ref<PostComment[]>([])
const loading = ref(true)
const sending = ref(false)
const error = ref('')
const draft = ref('')
const replyDraft = ref('')
const replyingTo = ref<string | null>(null)

const threads = computed(() =>
  comments.value
    .filter(comment => !comment.parentId)
    .map(comment => ({
      comment,
      replies: comments.value.filter(reply => reply.parentId === comment.id)
    }))
)

const load = async () => {
  loading.value = true
  try {
    comments.value = await fetchComments(props.postId)
  } catch {
    error.value = 'Comments could not be loaded'
  } finally {
    loading.value = false
  }
}

const submit = async (parentId?: string) => {
  const content = (parentId ? replyDraft.value : draft.value).trim()
  if (!content || sending.value) return

  sending.value = true
  error.value = ''
  try {
    const comment = await addComment(props.postId, content, parentId)
    comments.value.push(comment)
    emit('added', comment)
    if (parentId) {
      replyDraft.value = ''
      replyingTo.value = null
    } else {
      draft.value = ''
    }
  } catch {
    error.value = 'Comment could not be posted'
  } finally {
    sending.value = false
  }
}

const formatTimeAgo = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

onMounted(load)
</script>

<style scoped>
.comments {
  border-top: 1px solid var(--color-dark-grey, #1f2937);
  padding: 0.75rem 1rem 1rem;
}

.comment-composer,
.reply-composer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reply-composer { margin-top: 0.5rem; }

.composer-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  object-fit: cover;
  flex-shrink: 0;
}

.composer-input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.9rem;
  border-radius: 9999px;
  border: 1px solid var(--color-dark-grey, #1f2937);
  background: var(--color-charcoal, #121827);
  color: var(--text-primary, #f0fffb);
  font-size: 0.9rem;
}

.composer-send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 9999px;
  background: var(--accent, #6fffd4);
  color: var(--text-on-accent, #0a0f1e);
  cursor: pointer;
}

.composer-send:disabled { opacity: 0.4; cursor: not-allowed; }

.comments-state,
.comments-error {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
  opacity: 0.7;
}

.comments-error { color: var(--color-error, #ff2e88); opacity: 1; }

.comment-list,
.reply-list {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reply-list { margin-left: 0.25rem; }

.comment {
  display: flex;
  gap: 0.5rem;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-avatar.small { width: 26px; height: 26px; }

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-author {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary, #f0fffb);
  text-decoration: none;
}

.comment-text {
  margin: 0.15rem 0 0;
  font-size: 0.9rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-meta {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.2rem;
  font-size: 0.75rem;
  opacity: 0.7;
}

.comment-meta button {
  background: none;
  border: none;
  color: inherit;
  padding: 0;
  cursor: pointer;
  font-size: 0.75rem;
}
</style>
