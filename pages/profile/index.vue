<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-picture-section">
          <div class="profile-picture-container">
            <img 
              v-if="profileData.avatar_url" 
              :src="profileData.avatar_url" 
              :alt="`${profileData.display_name || 'User'} profile picture`"
              class="profile-picture"
            />
            <div v-else class="profile-picture-placeholder">
              <Icon name="user" size="48" />
            </div>
            <button 
              v-if="isOwnProfile" 
              @click="showAvatarUpload = true" 
              class="edit-avatar-btn"
            >
              <Icon name="camera" size="16" />
            </button>
          </div>
        </div>

        <div class="profile-info">
          <div class="profile-name-section">
            <h1 class="profile-name">
              {{ profileData.display_name || profileData.username || 'Anonymous User' }}
              <span v-if="profileData.is_verified" class="verified-badge" title="Verified Account">
                ✅
              </span>
            </h1>
            <p class="profile-username">@{{ profileData.username || 'unknown' }}</p>
          </div>

          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-number">{{ formatNumber(profileData.posts_count || 0) }}</span>
              <span class="stat-label">Posts</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ formatNumber(profileData.followers_count || 0) }}</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ formatNumber(profileData.following_count || 0) }}</span>
              <span class="stat-label">Following</span>
            </div>
          </div>

          <div class="profile-actions">
            <button 
              v-if="isOwnProfile" 
              @click="showEditProfile = true" 
              class="btn-primary"
            >
              <Icon name="edit" size="16" />
              Edit Profile
            </button>
            <template v-else>
              <button 
                @click="toggleFollow" 
                :class="['btn-primary', { 'btn-following': isFollowing }]"
                :disabled="followLoading"
              >
                <Icon :name="isFollowing ? 'user-check' : 'user-plus'" size="16" />
                {{ followLoading ? 'Loading...' : (isFollowing ? 'Following' : 'Follow') }}
              </button>
              <button @click="sendMessage" class="btn-secondary">
                <Icon name="message-circle" size="16" />
                Message
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- Profile Bio -->
      <div v-if="profileData.bio" class="profile-bio">
        <p>{{ profileData.bio }}</p>
      </div>

      <!-- Profile Details -->
      <div class="profile-details">
        <div v-if="profileData.location" class="detail-item">
          <Icon name="map-pin" size="16" />
          <span>{{ profileData.location }}</span>
        </div>
        <div v-if="profileData.website" class="detail-item">
          <Icon name="link" size="16" />
          <a :href="profileData.website" target="_blank" rel="noopener noreferrer">
            {{ formatWebsite(profileData.website) }}
          </a>
        </div>
        <div class="detail-item">
          <Icon name="calendar" size="16" />
          <span>Joined {{ formatJoinDate(profileData.created_at) }}</span>
        </div>
      </div>

      <!-- Profile Tabs -->
      <div class="profile-tabs">
        <button 
          @click="activeTab = 'posts'" 
          :class="['tab-btn', { active: activeTab === 'posts' }]"
        >
          Posts
        </button>
        <button 
          @click="activeTab = 'media'" 
          :class="['tab-btn', { active: activeTab === 'media' }]"
        >
          Media
        </button>
        <button 
          v-if="isOwnProfile" 
          @click="activeTab = 'likes'" 
          :class="['tab-btn', { active: activeTab === 'likes' }]"
        >
          Likes
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Posts Tab -->
        <div v-if="activeTab === 'posts'" class="posts-grid">
          <div v-if="posts.length === 0" class="empty-state">
            <Icon name="file-text" size="48" />
            <h3>No posts yet</h3>
            <p v-if="isOwnProfile">Share your first post to get started!</p>
            <p v-else>{{ profileData.display_name || 'This user' }} hasn't posted anything yet.</p>
          </div>
          <PostCard 
            v-for="post in posts" 
            :key="post.id" 
            :post="post"
            @like="handleLike"
            @comment="handleComment"
            @share="handleShare"
          />
        </div>

        <!-- Media Tab -->
        <div v-if="activeTab === 'media'" class="media-grid">
          <div v-if="mediaPosts.length === 0" class="empty-state">
            <Icon name="image" size="48" />
            <h3>No media posts</h3>
            <p>Photos and videos will appear here</p>
          </div>
          <div 
            v-for="post in mediaPosts" 
            :key="post.id"
            class="media-item"
            @click="openMediaModal(post)"
          >
            <img 
              v-if="post.media_type === 'image'"
              :src="post.media_url" 
              :alt="post.content"
              class="media-thumbnail"
            />
            <video 
              v-else-if="post.media_type === 'video'"
              :src="post.media_url"
              class="media-thumbnail"
              muted
            />
          </div>
        </div>

        <!-- Likes Tab (Own Profile Only) -->
        <div v-if="activeTab === 'likes' && isOwnProfile" class="posts-grid">
          <div v-if="likedPosts.length === 0" class="empty-state">
            <Icon name="heart" size="48" />
            <h3>No liked posts</h3>
            <p>Posts you like will appear here</p>
          </div>
          <PostCard 
            v-for="post in likedPosts" 
            :key="post.id" 
            :post="post"
            @like="handleLike"
            @comment="handleComment"
            @share="handleShare"
          />
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div v-if="showEditProfile" class="modal-overlay" @click="closeEditProfile">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Edit Profile</h3>
          <button @click="closeEditProfile" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="saveProfile" class="edit-profile-form">
          <div class="form-group">
            <label for="displayName">Display Name</label>
            <input 
              id="displayName"
              v-model="editForm.display_name" 
              type="text"
              class="form-input"
              maxlength="50"
            />
          </div>

          <div class="form-group">
            <label for="bio">Bio</label>
            <textarea 
              id="bio"
              v-model="editForm.bio" 
              class="form-textarea"
              rows="4"
              maxlength="160"
              placeholder="Tell people about yourself..."
            ></textarea>
            <small class="char-count">{{ editForm.bio?.length || 0 }}/160</small>
          </div>

          <div class="form-group">
            <label for="location">Location</label>
            <input 
              id="location"
              v-model="editForm.location" 
              type="text"
              class="form-input"
              placeholder="City, Country"
            />
          </div>

          <div class="form-group">
            <label for="website">Website</label>
            <input 
              id="website"
              v-model="editForm.website" 
              type="url"
              class="form-input"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div class="form-actions">
            <button type="button" @click="closeEditProfile" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Avatar Upload Modal -->
    <div v-if="showAvatarUpload" class="modal-overlay" @click="closeAvatarUpload">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Update Profile Picture</h3>
          <button @click="closeAvatarUpload" class="close-btn">&times;</button>
        </div>
        <div class="avatar-upload-content">
          <div class="upload-area">
            <input 
              ref="fileInput"
              type="file" 
              accept="image/*" 
              @change="handleFileSelect"
              class="file-input"
            />
            <div class="upload-placeholder" @click="$refs.fileInput.click()">
              <Icon name="upload" size="32" />
              <p>Click to upload or drag and drop</p>
              <small>PNG, JPG up to 5MB</small>
            </div>
          </div>
          <div v-if="selectedFile" class="preview-section">
            <img :src="previewUrl" alt="Preview" class="avatar-preview" />
            <button @click="uploadAvatar" class="btn-primary" :disabled="uploading">
              {{ uploading ? 'Uploading...' : 'Save Photo' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

// Page meta with authentication
definePageMeta({ 
  middleware: ['auth']
})

// Reactive data
const route = useRoute()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const profileData = ref({})
const posts = ref([])
const mediaPosts = ref([])
const likedPosts = ref([])
const activeTab = ref('posts')
const showEditProfile = ref(false)
const showAvatarUpload = ref(false)
const saving = ref(false)
const uploading = ref(false)
const followLoading = ref(false)
const isFollowing = ref(false)
const selectedFile = ref(null)
const previewUrl = ref('')

const editForm = ref({
  display_name: '',
  bio: '',
  location: '',
  website: ''
})

// Computed properties
const isOwnProfile = computed(() => {
  const profileUsername = route.params.username || user.value?.user_metadata?.username
  return profileUsername === user.value?.user_metadata?.username
})

// Methods
const loadProfile = async () => {
  try {
    const username = route.params.username || user.value?.user_metadata?.username
    
    // Mock data - replace with actual API call
    profileData.value = {
      id: user.value?.id,
      username: username,
      display_name: user.value?.user_metadata?.display_name || username,
      bio: user.value?.user_metadata?.bio || '',
      location: user.value?.user_metadata?.location || '',
      website: user.value?.user_metadata?.website || '',
      avatar_url: user.value?.user_metadata?.avatar_url || '',
      is_verified: user.value?.user_metadata?.is_verified || false,
      posts_count: 42,
      followers_count: 1250,
      following_count: 890,
      created_at: user.value?.created_at || new Date().toISOString()
    }

    // Load posts
    await loadPosts()
    await loadMediaPosts()
    if (isOwnProfile.value) {
      await loadLikedPosts()
    }
  } catch (error) {
    console.error('Error loading profile:', error)
  }
}

const loadPosts = async () => {
  try {
    // Mock data - replace with actual API call
    posts.value = [
      {
        id: 1,
        content: 'Just deployed my new app! 🚀',
        created_at: '2024-01-20T10:30:00Z',
        likes_count: 25,
        comments_count: 8,
        is_liked: false
      }
    ]
  } catch (error) {
    console.error('Error loading posts:', error)
  }
}

const loadMediaPosts = async () => {
  try {
    // Mock data - replace with actual API call
    mediaPosts.value = []
  } catch (error) {
    console.error('Error loading media posts:', error)
  }
}

const loadLikedPosts = async () => {
  try {
    // Mock data - replace with actual API call
    likedPosts.value = []
  } catch (error) {
    console.error('Error loading liked posts:', error)
  }
}

const toggleFollow = async () => {
  followLoading.value = true
  try {
    isFollowing.value = !isFollowing.value
    // API call would go here
  } catch (error) {
    console.error('Error toggling follow:', error)
    isFollowing.value = !isFollowing.value // Revert on error
  } finally {
    followLoading.value = false
  }
}

const sendMessage = () => {
  navigateTo(`/chat?user=${profileData.value.username}`)
}

const saveProfile = async () => {
  saving.value = true
  try {
    // Update profile data
    Object.assign(profileData.value, editForm.value)
    
    // API call would go here
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    closeEditProfile()
  } catch (error) {
    console.error('Error saving profile:', error)
  } finally {
    saving.value = false
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

const uploadAvatar = async () => {
  if (!selectedFile.value) return
  
  uploading.value = true
  try {
    // Upload file logic would go here
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update profile data
    profileData.value.avatar_url = previewUrl.value
    
    closeAvatarUpload()
  } catch (error) {
    console.error('Error uploading avatar:', error)
  } finally {
    uploading.value = false
  }
}

const closeEditProfile = () => {
  showEditProfile.value = false
  editForm.value = {
    display_name: profileData.value.display_name || '',
    bio: profileData.value.bio || '',
    location: profileData.value.location || '',
    website: profileData.value.website || ''
  }
}

const closeAvatarUpload = () => {
  showAvatarUpload.value = false
  selectedFile.value = null
  previewUrl.value = ''
}

const handleLike = (postId) => {
  const post = posts.value.find(p => p.id === postId) || likedPosts.value.find(p => p.id === postId)
  if (post) {
    post.is_liked = !post.is_liked
    post.likes_count += post.is_liked ? 1 : -1
  }
}

const handleComment = (postId) => {
  navigateTo(`/post/${postId}`)
}

const handleShare = (postId) => {
  // Implement share functionality
  console.log('Sharing post:', postId)
}

const openMediaModal = (post) => {
  // Implement media modal
  console.log('Opening media:', post)
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatWebsite = (url) => {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

const formatJoinDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  })
}

// Watchers
watch(() => route.params.username, () => {
  loadProfile()
})

// Lifecycle
onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.profile-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.profile-picture-container {
  position: relative;
}

.profile-picture,
.profile-picture-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-picture-placeholder {
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: 2px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.verified-badge {
  font-size: 1.25rem;
}

.profile-username {
  color: #6b7280;
  margin: 0 0 1rem 0;
}

.profile-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.profile-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-following {
  background: #10b981;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.profile-bio {
  margin-bottom: 1rem;
  color: #1f2937;
  line-height: 1.6;
}

.profile-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  color: #6b7280;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-item a {
  color: #3b82f6;
  text-decoration: none;
}

.profile-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.tab-btn {
  padding: 1rem 2rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.posts-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.media-item {
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.media-item:hover {
  transform: scale(1.02);
}

.media-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-state h3 {
  margin: 1rem 0 0.5rem 0;
  color: #1f2937;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 500px*_
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.edit-profile-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.char-count {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.avatar-upload-content {
  padding: 1.5rem;
}

.upload-area {
  margin-bottom: 1rem;
}

.file-input {
  display: none;
}

.upload-placeholder {
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-placeholder:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.preview-section {
  text-align: center;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-stats {
    justify-content: center;
  }
  
  .profile-actions {
    justify-content: center;
  }
  
  .profile-details {
    justify-content: center;
  }
  
  .tab-btn {
    padding: 1rem;
    flex: 1;
  }
  
  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>

