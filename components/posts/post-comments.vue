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
      <button class="composer-send" type="submit" :disabled="!draft.trim()">
        <Icon name="send" size="16" />
      </button>
    </form>

    <p v-if="error" class="comments-error">{{ error }}</p>
    <p v-if="loading && !comments.length" class="comments-state">Loading comments...</p>
    <p v-else-if="!threads.length" class="comments-state">No comments yet.</p>

    <ul v-else class="comment-list">
      <li v-for="thread in threads" :key="thread.comment.id" class="comment-thread">
        <article class="comment" :class="{ pending: thread.comment.pending }">
          <NuxtLink :to="`/profile/${thread.comment.author.username}`" class="comment-avatar-link">
            <img :src="thread.comment.author.avatar || '/default-avatar.svg'" :alt="thread.comment.author.name" class="comment-avatar" />
          </NuxtLink>
          <div class="comment-body">
            <NuxtLink :to="`/profile/${thread.comment.author.username}`" class="comment-author">
              {{ thread.comment.author.name }}
            </NuxtLink>
            <form v-if="editingId === thread.comment.id" class="edit-form" @submit.prevent="saveEdit(thread.comment)">
              <input v-model="editDraft" class="composer-input" type="text" maxlength="500" aria-label="Edit comment" />
              <button type="submit" class="meta-btn" :disabled="!editDraft.trim() || busyId === thread.comment.id">Save</button>
              <button type="button" class="meta-btn" @click="editingId = null">Cancel</button>
            </form>
            <p v-else class="comment-text">{{ thread.comment.content }}</p>
            <div class="comment-meta">
              <span v-if="thread.comment.pending">Waiting for connection...</span>
              <span v-else>{{ formatTimeAgo(thread.comment.createdAt) }}</span>
              <span v-if="thread.comment.editedAt">Edited</span>
              <button v-if="!thread.comment.pending" type="button" class="meta-btn" @click="replyingTo = replyingTo === thread.comment.id ? null : thread.comment.id">
                Reply
              </button>
              <template v-if="isOwn(thread.comment)">
                <button type="button" class="meta-btn" @click="startEdit(thread.comment)">Edit</button>
                <button type="button" class="meta-btn danger" :disabled="busyId === thread.comment.id" @click="remove(thread.comment)">Delete</button>
              </template>
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
              <button class="composer-send" type="submit" :disabled="!replyDraft.trim()">
                <Icon name="send" size="14" />
              </button>
            </form>

            <ul v-if="thread.replies.length" class="reply-list">
              <li v-for="reply in thread.replies" :key="reply.id" class="comment reply" :class="{ pending: reply.pending }">
                <NuxtLink :to="`/profile/${reply.author.username}`" class="comment-avatar-link">
                  <img :src="reply.author.avatar || '/default-avatar.svg'" :alt="reply.author.name" class="comment-avatar small" />
                </NuxtLink>
                <div class="comment-body">
                  <NuxtLink :to="`/profile/${reply.author.username}`" class="comment-author">
                    {{ reply.author.name }}
                  </NuxtLink>
                  <form v-if="editingId === reply.id" class="edit-form" @submit.prevent="saveEdit(reply)">
                    <input v-model="editDraft" class="composer-input" type="text" maxlength="500" aria-label="Edit reply" />
                    <button type="submit" class="meta-btn" :disabled="!editDraft.trim() || busyId === reply.id">Save</button>
                    <button type="button" class="meta-btn" @click="editingId = null">Cancel</button>
                  </form>
                  <p v-else class="comment-text">{{ reply.content }}</p>
                  <div class="comment-meta">
                    <span v-if="reply.pending">Waiting for connection...</span>
                    <span v-else>{{ formatTimeAgo(reply.createdAt) }}</span>
                    <span v-if="reply.editedAt">Edited</span>
                    <template v-if="isOwn(reply)">
                      <button type="button" class="meta-btn" @click="startEdit(reply)">Edit</button>
                      <button type="button" class="meta-btn danger" :disabled="busyId === reply.id" @click="remove(reply)">Delete</button>
                    </template>
                  </div>
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
import { computed, onMounted, ref, watch } from 'vue'
import type { PostComment } from '~/composables/useSocialFeed'
import { useEngagementSync } from '~/composables/use-engagement-sync'
import { useUserStore } from '~/stores/user'

const props = defineProps<{ postId: string, viewerAvatar: string }>()
const emit = defineEmits<{
  /** Optimistic change to the post's comment count. */
  delta: [change: number]
  /** Authoritative server count after a write. */
  synced: [count: number]
}>()

const { fetchComments, addComment, editComment, deleteComment, currentUserId } = useSocialFeed()
const engagement = useEngagementSync()
const userStore = useUserStore()

const comments = ref<PostComment[]>([])
const loading = ref(true)
const error = ref('')
const draft = ref('')
const replyDraft = ref('')
const replyingTo = ref<string | null>(null)
const editingId = ref<string | null>(null)
const editDraft = ref('')
const busyId = ref<string | null>(null)

const viewer = computed(() => ({
  id: currentUserId.value ?? '',
  username: userStore.profile?.username ?? '',
  name: userStore.profile?.full_name || userStore.profile?.username || 'You',
  avatar: props.viewerAvatar || null
}))

const isOwn = (comment: PostComment) => !comment.pending && Boolean(viewer.value.id) && comment.author.id === viewer.value.id

const threads = computed(() =>
  comments.value
    .filter(comment => !comment.parentId)
    .map(comment => ({
      comment,
      replies: comments.value.filter(reply => reply.parentId === comment.id)
    }))
)

/** Comments queued on this device are shown until the server has them. */
const mergePending = (server: PostComment[]) => {
  const known = new Set(server.map(comment => comment.id))
  const pending = engagement.pendingFor(props.postId).comments
    .filter(item => !known.has(item.clientId))
    .map((item): PostComment => ({
      id: item.clientId,
      postId: props.postId,
      parentId: item.parentId,
      content: item.content,
      createdAt: item.createdAt,
      pending: true,
      author: viewer.value
    }))
  return [...server, ...pending]
}

const load = async () => {
  loading.value = true
  try {
    comments.value = mergePending(await fetchComments(props.postId))
    error.value = ''
  } catch {
    comments.value = mergePending(comments.value.filter(comment => !comment.pending))
    if (!comments.value.length) error.value = 'Comments could not be loaded'
  } finally {
    loading.value = false
  }
}

const submit = async (parentId?: string) => {
  const content = (parentId ? replyDraft.value : draft.value).trim()
  if (!content) return

  const clientId = crypto.randomUUID()
  const optimistic: PostComment = {
    id: clientId,
    postId: props.postId,
    parentId: parentId ?? null,
    content,
    createdAt: new Date().toISOString(),
    pending: true,
    author: viewer.value
  }
  comments.value.push(optimistic)
  emit('delta', 1)
  if (parentId) {
    replyDraft.value = ''
    replyingTo.value = null
  } else {
    draft.value = ''
  }
  error.value = ''

  const result = await addComment(props.postId, content, parentId ?? null, clientId)
  if (result.status === 'queued') return
  if (result.status === 'failed') {
    comments.value = comments.value.filter(comment => comment.id !== clientId)
    emit('delta', -1)
    error.value = result.message || 'Comment could not be posted'
    return
  }
  comments.value = comments.value.map(comment => comment.id === clientId ? result.data.comment : comment)
  emit('synced', result.data.commentsCount)
}

const startEdit = (comment: PostComment) => {
  editingId.value = comment.id
  editDraft.value = comment.content
}

const saveEdit = async (comment: PostComment) => {
  const content = editDraft.value.trim()
  if (!content) return
  if (content === comment.content) {
    editingId.value = null
    return
  }

  const previous = { content: comment.content, editedAt: comment.editedAt }
  busyId.value = comment.id
  comment.content = content
  editingId.value = null
  try {
    const saved = await editComment(props.postId, comment.id, content)
    comment.content = saved.content
    comment.editedAt = saved.editedAt
  } catch {
    comment.content = previous.content
    comment.editedAt = previous.editedAt
    error.value = 'Comment could not be updated'
  } finally {
    busyId.value = null
  }
}

const remove = async (comment: PostComment) => {
  if (import.meta.client && !window.confirm('Delete this comment?')) return

  const removed = comments.value.filter(item => item.id === comment.id || item.parentId === comment.id)
  busyId.value = comment.id
  comments.value = comments.value.filter(item => !removed.includes(item))
  emit('delta', -removed.length)
  try {
    emit('synced', await deleteComment(props.postId, comment.id))
  } catch {
    comments.value = [...comments.value, ...removed]
    emit('delta', removed.length)
    error.value = 'Comment could not be deleted'
  } finally {
    busyId.value = null
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

// When the retry queue drains, swap pending placeholders for the saved rows.
watch(
  () => engagement.pendingFor(props.postId).comments.length,
  (now, before) => {
    if (now < before) void load()
  }
)

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

.comment-avatar-link {
  display: inline-flex;
  flex-shrink: 0;
}

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

.comment.pending { opacity: 0.6; }

.edit-form {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

.meta-btn {
  border: none;
  background: none;
  padding: 0;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.meta-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.meta-btn.danger { color: var(--color-error, #ff2e88); }
</style>
