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
import { ref } from 'vue'

const postContent = ref('')
const showEmojiPicker = ref(false)
const publishing = ref(false)

const popularEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉', '😎', '🤗']
const emit = defineEmits(['postCreated'])

// ✅ FIXED - Properly initialize Supabase client
const supabase = useSupabaseClient()

function addEmoji() {
  showEmojiPicker.value = !showEmojiPicker.value
}

function insertEmoji(emoji) {
  postContent.value += emoji
  showEmojiPicker.value = false
}

function addImage() {
  // TODO: Implement image upload
  alert('Image upload coming soon!')
}

function addGif() {
  // TODO: Implement GIF picker
  alert('GIF picker coming soon!')
}

async function publishPost() {
  if (!postContent.value.trim()) return
  
  // Check if Supabase is available
  if (!supabase) {
    alert('Please sign in to post')
    return
  }
  
  try {
    publishing.value = true
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('You must be logged in to post')
      return
    }
    
    // Create post object
    const post = {
      content: postContent.value,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Insert post into Supabase
    const { data, error } = await supabase
      .from('posts')
      .insert([post])
      .select()
      .single()
    
    if (error) {
      console.error('Error publishing post:', error)
      alert('Failed to publish post. Please try again.')
      return
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
      comments: []
    })
    
    // Clear the textarea
    postContent.value = ''
    
  } catch (error) {
    console.error('Error publishing post:', error)
    alert('An error occurred while publishing your post. Please try again.')
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
.create-post {
  width: 100%;
  margin-bottom: 2rem;
}

.create-form {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s ease;
}

.post-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  background: transparent;
  border: 1px solid #e0e0e0;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #f5f5f5;
  border-color: #667eea;
}

.publish-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.publish-btn:hover:not(:disabled) {
  background: #764ba2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.publish-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.emoji-option {
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.emoji-option:hover {
  background: white;
  transform: scale(1.2);
}

@media (max-width: 768px) {
  .create-form {
    padding: 1rem;
  }

  .post-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons {
    width: 100%;
  }

  .publish-btn {
    width: 100%;
  }
}
</style>

