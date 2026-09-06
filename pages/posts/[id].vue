<template>
  <div class="post-detail">
    <div v-if="pending" class="loading">
      <p>Loading post...</p>
    </div>

    <div v-else-if="post" class="post-container">
      <div class="post-header">
        <div class="author-info">
          <img :src="post.author.avatar || '/default-avatar.svg'" :alt="post.author.name" class="author-avatar" />
          <div class="author-details">
            <h3 class="author-name">{{ post.author.name }}</h3>
            <p class="post-date">{{ formatDate(post.createdAt) }}</p>
          </div>
        </div>

        <div v-if="post.isMine" class="post-actions">
          <button class="edit-btn" @click="startEdit">{{ editing ? 'Cancel' : 'Edit' }}</button>
          <button class="delete-btn" @click="removePost">Delete</button>
        </div>
      </div>

      <div class="post-content">
        <h1 v-if="post.title" class="post-title">{{ post.title }}</h1>

        <form v-if="editing" class="comment-form" @submit.prevent="saveEdit">
          <textarea v-model="draft" rows="5" maxlength="5000" required></textarea>
          <button type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button>
        </form>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-else class="post-body" v-html="renderContent(post.content)"></div>

        <div v-if="post.media.length" class="post-images">
          <img
            v-for="(image, index) in post.media"
            :key="index"
            :src="image"
            :alt="`Post image ${index + 1}`"
            class="post-image"
            @click="openImageModal(image)"
          />
        </div>

        <div v-if="post.tags.length" class="post-tags">
          <span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
        </div>
      </div>

      <div class="post-stats">
        <div class="engagement-stats">
          <button :class="['stat-btn', { liked: post.likedByMe }]" @click="toggleLike">
            ❤️ {{ post.likesCount }}
          </button>
          <button class="stat-btn" @click="scrollToComments">
            💬 {{ comments.length }}
          </button>
          <button class="stat-btn" @click="sharePost">
            🔗 Share
          </button>
        </div>
      </div>

      <div ref="commentsSection" class="comments-section">
        <h3>Comments ({{ comments.length }})</h3>

        <form class="comment-form" @submit.prevent="addComment">
          <textarea
            v-model="newComment"
            placeholder="Add a comment..."
            rows="3"
            maxlength="500"
            required
          ></textarea>
          <button type="submit" :disabled="!newComment.trim() || posting">
            {{ posting ? 'Posting…' : 'Post Comment' }}
          </button>
        </form>

        <p v-if="commentError" class="post-error">{{ commentError }}</p>

        <div class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment">
            <div class="comment-header">
              <img :src="comment.author.avatar || '/default-avatar.svg'" :alt="comment.author.name" class="comment-avatar" />
              <div class="comment-info">
                <span class="comment-author">{{ comment.author.name }}</span>
                <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
              </div>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error">
      <p>{{ loadError || 'Post not found' }}</p>
    </div>

    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <img :src="selectedImage" alt="Enlarged post image" class="modal-image" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import type { PostDetailView } from '~/server/api/posts/[id]/index.get'
import type { PostCommentView } from '~/server/api/posts/[id]/comments.get'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'language-check'],
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

const postId = computed(() => String(route.params.id))

const post = ref<PostDetailView | null>(null)
const comments = ref<PostCommentView[]>([])
const pending = ref(true)
const posting = ref(false)
const loadError = ref('')
const commentError = ref('')
const newComment = ref('')
const showImageModal = ref(false)
const selectedImage = ref('')
const commentsSection = ref<HTMLElement | null>(null)

const messageOf = (err: unknown) => (err instanceof Error ? err.message : 'Request failed')

const renderContent = (content: string): string => md.render(content || '')

const formatDate = (value: string): string => new Date(value).toLocaleString()

const load = async () => {
  pending.value = true
  loadError.value = ''
  try {
    const [detail, commentList] = await Promise.all([
      $fetch<{ data: PostDetailView }>(`/api/posts/${postId.value}`),
      $fetch<{ data: PostCommentView[] }>(`/api/posts/${postId.value}/comments`)
    ])
    post.value = detail.data
    comments.value = commentList.data
  } catch (err) {
    post.value = null
    loadError.value = messageOf(err)
  } finally {
    pending.value = false
  }
}

const toggleLike = async () => {
  if (!post.value) return
  try {
    const res = await $fetch<{ data: { liked: boolean, likesCount: number } }>(
      `/api/posts/${postId.value}/like`,
      { method: 'POST' }
    )
    post.value.likedByMe = res.data.liked
    post.value.likesCount = res.data.likesCount
  } catch (err) {
    loadError.value = messageOf(err)
  }
}

const addComment = async () => {
  const content = newComment.value.trim()
  if (!content) return
  posting.value = true
  commentError.value = ''
  try {
    const res = await $fetch<{ data: PostCommentView }>(`/api/posts/${postId.value}/comments`, {
      method: 'POST',
      body: { content }
    })
    comments.value.push(res.data)
    if (post.value) post.value.commentsCount += 1
    newComment.value = ''
  } catch (err) {
    commentError.value = messageOf(err)
  } finally {
    posting.value = false
  }
}

const editing = ref(false)
const saving = ref(false)
const draft = ref('')

const startEdit = () => {
  editing.value = !editing.value
  draft.value = post.value?.content ?? ''
}

const saveEdit = async () => {
  if (!post.value) return
  saving.value = true
  try {
    await $fetch(`/api/posts/${postId.value}/update`, {
      method: 'POST',
      body: { content: draft.value }
    })
    post.value.content = draft.value.trim()
    editing.value = false
  } catch (err) {
    loadError.value = messageOf(err)
  } finally {
    saving.value = false
  }
}

const removePost = async () => {
  if (!confirm('Delete this post?')) return
  try {
    await $fetch(`/api/posts/${postId.value}/delete`, { method: 'POST' })
    await router.push('/posts')
  } catch (err) {
    loadError.value = messageOf(err)
  }
}

const scrollToComments = () => commentsSection.value?.scrollIntoView({ behavior: 'smooth' })

const sharePost = async () => {
  const url = window.location.href
  try {
    if (navigator.share) {
      await navigator.share({ title: post.value?.title || 'SocialVerse post', url })
    } else {
      await navigator.clipboard.writeText(url)
    }
    await $fetch(`/api/posts/${postId.value}/share`, { method: 'POST' }).catch(() => undefined)
  } catch {
    // Sharing cancelled by the user is not an error worth surfacing.
  }
}

const openImageModal = (image: string) => {
  selectedImage.value = image
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = ''
}

onMounted(load)
</script>

<style scoped>
.post-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.post-container {
  background: #1e293b;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.author-name {
  margin: 0;
  font-size: 1.1rem;
}

.post-date {
  margin: 0;
  color: #666;
  font-size: 0.875rem;
}

.post-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-btn, .delete-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn {
  border-color: #dc3545;
  color: #dc3545;
}

.post-content {
  padding: 1rem;
}

.post-title {
  margin: 0 0 1rem 0;
  font-size: 2rem;
}

.post-body {
  line-height: 1.6;
  margin-bottom: 1rem;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.post-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #f0f0f0;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  color: #666;
}

.post-stats {
  padding: 1rem;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.engagement-stats {
  display: flex;
  gap: 1rem;
}

.stat-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.stat-btn:hover {
  background: #f0f0f0;
}

.stat-btn.liked {
  color: #dc3545;
}

.comments-section {
  padding: 1rem;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.comment-form textarea {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

.comment-form button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.comment-form button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.comment-author {
  font-weight: bold;
}

.comment-date {
  color: #999;
  font-size: 0.875rem;
  margin-left: auto;
}

.comment-content {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
}

.comment-actions button {
  background: none;
  border: 1px solid #ddd;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.comment-actions button.liked {
  color: #dc3545;
  border-color: #dc3545;
}

.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-image {
  max-width: 90%;
  max-height: 90%;
  border-radius: 8px;
}
</style>

