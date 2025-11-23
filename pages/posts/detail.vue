<template>
  <div class="post-detail">
    <div v-if="loading" class="loading">
      <p>Loading post...</p>
    </div>
    
    <div v-else-if="post" class="post-container">
      <div class="post-header">
        <div class="author-info">
          <img :src="post.author.avatar" :alt="post.author.name" class="author-avatar" />
          <div class="author-details">
            <h3 class="author-name">{{ post.author.name }}</h3>
            <p class="post-date">{{ formatDate(post.createdAt) }}</p>
          </div>
        </div>
        
        <div class="post-actions">
          <button v-if="canEdit" @click="editPost" class="edit-btn">✏️ Edit</button>
          <button v-if="canDelete" @click="deletePost" class="delete-btn">🗑️ Delete</button>
        </div>
      </div>

      <div class="post-content">
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-body" v-html="renderContent(post.content)"></div>
        
        <div v-if="post.images && post.images.length" class="post-images">
          <img 
            v-for="(image, index) in post.images" 
            :key="index"
            :src="image" 
            :alt="`Post image ${index + 1}`"
            class="post-image"
            @click="openImageModal(image)"
          />
        </div>
        
        <div v-if="post.tags && post.tags.length" class="post-tags">
          <span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
        </div>
      </div>

      <div class="post-stats">
        <div class="engagement-stats">
          <button @click="toggleLike" :class="['stat-btn', { liked: isLiked }]">
            ❤️ {{ post.likes || 0 }}
          </button>
          <button @click="scrollToComments" class="stat-btn">
            💬 {{ post.comments?.length || 0 }}
          </button>
          <button @click="sharePost" class="stat-btn">
            🔗 Share
          </button>
        </div>
      </div>

      <div class="comments-section" ref="commentsSection">
        <h3>Comments ({{ post.comments?.length || 0 }})</h3>
        
        <form @submit.prevent="addComment" class="comment-form">
          <textarea 
            v-model="newComment" 
            placeholder="Add a comment..." 
            rows="3"
            required
          ></textarea>
          <button type="submit" :disabled="!newComment.trim()">Post Comment</button>
        </form>
        
        <div class="comments-list">
          <div 
            v-for="comment in post.comments" 
            :key="comment.id"
            class="comment"
          >
            <div class="comment-header">
              <img :src="comment.author.avatar" :alt="comment.author.name" class="comment-avatar" />
              <div class="comment-info">
                <span class="comment-author">{{ comment.author.name }}</span>
                <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
              </div>
            </div>
            <div class="comment-content" v-html="renderContent(comment.content)"></div>
            
            <div class="comment-actions">
              <button @click="likeComment(comment.id)" :class="{ liked: comment.isLiked }">
                ❤️ {{ comment.likes || 0 }}
              </button>
              <button @click="replyToComment(comment.id)">Reply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="error">
      <p>Post not found</p>
    </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <img :src="selectedImage" alt="Enlarged post image" class="modal-image" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})
 
import { ref, computed, onMounted } from 'vue';
import MarkdownIt from 'markdown-it';

const props = defineProps({
  id: String
});

const md = new MarkdownIt();
const loading = ref(true);
const post = ref(null);
const newComment = ref('');
const isLiked = ref(false);
const showImageModal = ref(false);
const selectedImage = ref('');
const commentsSection = ref(null);

// Mock post data
const mockPost = {
  id: props.id,
  title: 'Welcome to SocialVerse!',
  content: 'This is a sample post showcasing the **post detail** component. You can add *markdown* formatting, images, and much more!\n\n## Features\n- Rich text content\n- Image galleries\n- Comments system\n- Like functionality',
  author: {
    name: 'John Doe',
    avatar: 'https://via.placeholder.com/48'
  },
  createdAt: Date.now() - 3600000,
  likes: 42,
  images: [
    'https://via.placeholder.com/600x300',
    'https://via.placeholder.com/600x300/0066cc'
  ],
  tags: ['welcome', 'socialverse', 'introduction'],
  comments: [
    {
      id: 1,
      content: 'Great post! Looking forward to more content.',
      author: {
        name: 'Alice Smith',
        avatar: 'https://via.placeholder.com/32'
      },
      createdAt: Date.now() - 1800000,
      likes: 5,
      isLiked: false
    },
    {
      id: 2,
      content: 'This platform looks amazing! Can\'t wait to explore more features.',
      author: {
        name: 'Bob Wilson',
        avatar: 'https://via.placeholder.com/32'
      },
      createdAt: Date.now() - 900000,
      likes: 3,
      isLiked: true
    }
  ]
};

const canEdit = computed(() => {
  return post.value?.author?.name === 'John Doe';
});

const canDelete = computed(() => {
  return canEdit.value || false;
});

function renderContent(content) {
  return md.render(content || '');
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function toggleLike() {
  isLiked.value = !isLiked.value;
  if (isLiked.value) {
    post.value.likes = (post.value.likes || 0) + 1;
  } else {
    post.value.likes = Math.max(0, (post.value.likes || 0) - 1);
  }
}

function scrollToComments() {
  commentsSection.value?.scrollIntoView({ behavior: 'smooth' });
}

function sharePost() {
  if (navigator.share) {
    navigator.share({
      title: post.value.title,
      text: 'Check out this post on SocialVerse',
      url: window.location.href
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  }
}

function addComment() {
  if (!newComment.value.trim()) return;
  
  const comment = {
    id: Date.now(),
    content: newComment.value,
    author: {
      name: 'Current User',
      avatar: 'https://via.placeholder.com/32'
    },
    createdAt: Date.now(),
    likes: 0,
    isLiked: false
  };
  
  post.value.comments = post.value.comments || [];
  post.value.comments.push(comment);
  newComment.value = '';
}

function likeComment(commentId) {
  const comment = post.value.comments.find(c => c.id === commentId);
  if (comment) {
    comment.isLiked = !comment.isLiked;
    if (comment.isLiked) {
      comment.likes = (comment.likes || 0) + 1;
    } else {
      comment.likes = Math.max(0, (comment.likes || 0) - 1);
    }
  }
}

function replyToComment(commentId) {
  console.log('Replying to comment:', commentId);
}

function editPost() {
  console.log('Editing post:', post.value.id);
}

function deletePost() {
  if (confirm('Are you sure you want to delete this post?')) {
    console.log('Deleting post:', post.value.id);
  }
}

function openImageModal(image) {
  selectedImage.value = image;
  showImageModal.value = true;
}

function closeImageModal() {
  showImageModal.value = false;
  selectedImage.value = '';
}

onMounted(async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    post.value = mockPost;
  } catch (error) {
    console.error('Failed to load post:', error);
  } finally {
    loading.value = false;
  }
});
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
  background: white;
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
