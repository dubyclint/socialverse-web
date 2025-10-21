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
        <div class="action-buttons">
          <button @click="addEmoji" class="action-btn" title="Add emoji">
            😊
          </button>
          <button @click="addImage" class="action-btn" title="Add image">
            🖼️
          </button>
          <button @click="addGif" class="action-btn" title="Add GIF">
            GIF
          </button>
        </div>
        <button 
          @click="publishPost" 
          :disabled="!postContent.trim() || publishing"
          class="publish-btn"
        >
          {{ publishing ? 'Publishing...' : 'Post' }}
        </button>
      </div>
      
      <!-- Emoji Picker -->
      <div v-if="showEmojiPicker" class="emoji-picker">
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

  

const supabase = useSupabaseClient();
const postContent = ref('');
const showEmojiPicker = ref(false);
const publishing = ref(false);

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

async function publishPost() {
  if (!postContent.value.trim()) return;
  
  try {
    publishing.value = true;
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('You must be logged in to post');
      return;
    }
    
    // Create post object
    const post = {
      content: postContent.value,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert post into Supabase
    const { data, error } = await supabase
      .from('posts')
      .insert([post])
      .select()
      .single();
    
    if (error) {
      console.error('Error publishing post:', error);
      alert('Failed to publish post. Please try again.');
      return;
    }
    
    // Emit event for parent component with the created post
    emit('postCreated', {
      id: data.id,
      content: data.content,
      user_id: data.user_id,
      created_at: data.created_at,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      pewgifts_count: 0,
      user_liked: false,
      showComments: false,
      comments: [],
      newComment: ''
    });
    
    // Clear form
    postContent.value = '';
    showEmojiPicker.value = false;
    
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('An unexpected error occurred. Please try again.');
  } finally {
    publishing.value = false;
  }
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
  gap: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: #f0f2f5;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #e4e6eb;
}

.publish-btn {
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.publish-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.publish-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.emoji-option {
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.emoji-option:hover {
  background: #e5e7eb;
}
</style>

