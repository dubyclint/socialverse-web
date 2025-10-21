<template>
  <div class="create-post">
    <div class="create-form">
      <textarea 
        v-model="postContent" 
        placeholder="What's on your mind?"
        class="post-textarea"
        rows="4"
        maxlength="500"
      ></textarea>
      
      <div class="post-actions">
        <div class="media-buttons">
          <button @click="addEmoji" class="emoji-btn">😀</button>
          <button @click="addImage" class="image-btn">📷</button>
          <button @click="addGif" class="gif-btn">GIF</button>
        </div>
        
        <div class="post-controls">
          <span class="char-count">{{ postContent.length }}/500</span>
          <button 
            @click="publishPost" 
            :disabled="!postContent.trim()" 
            class="publish-btn"
          >
            🚀 Pew
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="showEmojiPicker" class="emoji-picker">
      <div class="emoji-grid">
        <span 
          v-for="emoji in popularEmojis" 
          :key="emoji"
          @click="insertEmoji(emoji)"
          class="emoji-option"
        >
          {{ emoji }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { gun } from '~/plugins/gun-client';

const postContent = ref('');
const showEmojiPicker = ref(false);

const popularEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉', '😎', '🤗'];

const emit = defineEmits(['postCreated']);

function addEmoji() {
  showEmojiPicker.value = !showEmojiPicker.value;
}

function insertEmoji(emoji) {
  postContent.value += emoji;
  showEmojiPicker.value = false;
}

function addImage() {
  // TODO: Implement image upload
  alert('Image upload coming soon!');
}

function addGif() {
  // TODO: Implement GIF picker
  alert('GIF picker coming soon!');
}

function publishPost() {
  if (!postContent.value.trim()) return;
  
  const post = {
    content: postContent.value,
    timestamp: Date.now(),
    author: 'current_user', // Replace with actual user data
    likes: 0,
    comments: 0,
    id: Date.now().toString()
  };
  
  // Store in GunDB - only on client side
  if (process.client) {
    const gunInstance = gun();
    if (gunInstance) {
      gunInstance.get('posts').set(post);
    }
  }
  
  // Emit event for parent component
  emit('postCreated', post);
  
  // Clear form
  postContent.value = '';
  showEmojiPicker.value = false;
}
</script>

<style scoped>
.create-post {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-textarea {
  width: 100%;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 1rem;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  box-sizing: border-box;
}

.post-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.media-buttons {
  display: flex;
  gap: 0.5rem;
}

.media-buttons button {
  padding: 0.5rem 1rem;
  border: 1px solid #e1e5e9;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.media-buttons button:hover {
  background: #f8fafc;
  border-color: #2563eb;
}

.post-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.char-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.publish-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.publish-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.publish-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.emoji-picker {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 0.5rem;
}

.emoji-option {
  padding: 0.5rem;
  text-align: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
  font-size: 1.5rem;
}

.emoji-option:hover {
  background: #e5e7eb;
}
</style>
