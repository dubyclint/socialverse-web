<!-- FILE: /pages/profile/index.vue - FIXED FOR SSR HYDRATION -->
<!-- ============================================================================
     PROFILE PAGE - FIXED: All user-specific data wrapped in ClientOnly
     ✅ FIXED: Profile data wrapped
     ✅ FIXED: Edit buttons wrapped
     ✅ FIXED: User stats wrapped
     ============================================================================ -->

<template>
  <div class="profile-page">
    <!-- ✅ FIXED: Wrap entire profile content in ClientOnly -->
    <ClientOnly>
      <div class="profile-container">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading profile...</p>
        </div>

        <!-- Profile Header -->
        <div v-else class="profile-header">
          <div class="profile-picture-section">
            <div class="profile-picture-container">
              <!-- Avatar with fallback -->
              <img 
                v-if="displayProfile.avatar_url && displayProfile.avatar_url !== '/default-avatar.png'" 
                :src="displayProfile.avatar_url" 
                :alt="`${displayProfile.display_name || 'User'} profile picture`"
                class="profile-picture"
                @error="handleAvatarError"
              />
              <img 
                v-else 
                src="/default-avatar.svg" 
                :alt="displayProfile.display_name || 'User'"
                class="profile-picture default-avatar"
              />
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
                {{ displayProfile.display_name || displayProfile.username || 'User' }}
                <!-- Verification Badges -->
                <div v-if="verificationBadges.length > 0" class="verification-badges">
                  <button
                    v-for="badge in verificationBadges"
                    :key="badge.badge_type"
                    @click="openVerificationDetails(badge)"
                    class="verification-badge"
                    :class="`badge-${badge.badge_type}`"
                    :title="`${badge.badge_type.replace('_', ' ').toUpperCase()}`"
                  >
                    <Icon :name="getBadgeIcon(badge.badge_type)" size="16" />
                    <span v-if="badge.badge_level >" class="badge-level">{{ badge.badge_level }}</span>
                  </button>
                </div>
              </h1>

              <p class="profile-username">@{{ displayProfile.username || 'unknown' }}</p>
              
              <!-- User Rank -->
              <div v-if="displayProfile.rank && !rankHidden" class="user-rank">
                <Icon name="star" size="14" />
                <span>{{ displayProfile.rank }}</span>
                <span class="rank-points">({{ formatNumber(displayProfile.rank_points || 0) }} pts)</span>
              </div>
            </div>

            <!-- Profile Stats -->
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-number">{{ formatNumber(displayProfile.posts_count || 0) }}</span>
                <span class="stat-label">Posts</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ formatNumber(displayProfile.followers_count || 0) }}</span>
                <span class="stat-label">Followers</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ formatNumber(displayProfile.following_count || 0) }}</span>
                <span class="stat-label">Following</span>
              </div>
            </div>

            <!-- Profile Actions -->
            <div class="profile-actions">
              <button 
                v-if="isOwnProfile" 
                @click="showCreatePost = true" 
                class="btn btn-primary"
              >
                <Icon name="plus" size="16" />
                Create Post
              </button>
              <button 
                v-if="isOwnProfile" 
                @click="showEditProfile = true" 
                class="btn btn-secondary"
              >
                <Icon name="edit" size="16" />
                Edit Profile
              </button>
              <button 
                v-if="isOwnProfile" 
                @click="showGeneralSettings = true" 
                class="btn btn-tertiary"
              >
                <Icon name="settings" size="16" />
                Settings
              </button>
              <button 
                v-if="!isOwnProfile" 
                @click="toggleFollow" 
                :class="['btn', isFollowing ? 'btn-secondary' : 'btn-primary']"
              >
                <Icon :name="isFollowing ? 'user-minus' : 'user-plus'" size="16" />
                {{ isFollowing ? 'Unfollow' : 'Follow' }}
              </button>
            </div>

            <!-- Bio Section -->
            <div v-if="displayProfile.bio" class="profile-bio">
              <p>{{ displayProfile.bio }}</p>
            </div>

            <!-- Additional Info -->
            <div class="profile-details">
              <div v-if="displayProfile.location" class="detail-item">
                <Icon name="map-pin" size="14" />
                <span>{{ displayProfile.location }}</span>
              </div>
              <div v-if="displayProfile.website" class="detail-item">
                <Icon name="link" size="14" />
                <a :href="displayProfile.website" target="_blank" rel="noopener noreferrer">
                  {{ displayProfile.website }}
                </a>
              </div>
              <div v-if="displayProfile.created_at" class="detail-item">
                <Icon name="calendar" size="14" />
                <span>Joined {{ formatDate(displayProfile.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Tabs -->
        <div class="profile-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tab-button', { active: activeTab === tab.id }]"
          >
            <Icon :name="tab.icon" size="18" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Posts Tab -->
          <div v-if="activeTab === 'posts'" class="posts-tab">
            <div v-if="userPosts.length === 0" class="empty-state">
              <Icon name="inbox" size="48" />
              <h3>No posts yet</h3>
              <p>{{ isOwnProfile ? 'Share your first post!' : 'This user hasn\'t posted yet' }}</p>
            </div>
            <div v-else class="posts-grid">
              <PostCard
                v-for="post in userPosts"
                :key="post.id"
                :post="post"
              />
            </div>
          </div>

          <!-- Media Tab -->
          <div v-if="activeTab === 'media'" class="media-tab">
            <div v-if="mediaPosts.length === 0" class="empty-state">
              <Icon name="image" size="48" />
              <h3>No media</h3>
              <p>{{ isOwnProfile ? 'Share photos and videos!' : 'No media shared yet' }}</p>
            </div>
            <div v-else class="media-grid">
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
                <div class="media-overlay">
                  <Icon name="eye" size="20" />
                </div>
              </div>
            </div>
          </div>

          <!-- Likes Tab (Own Profile Only) -->
          <div v-if="activeTab === 'likes' && isOwnProfile" class="likes-tab">
            <div v-if="likedPosts.length === 0" class="empty-state">
              <Icon name="heart" size="48" />
              <h3>No liked posts</h3>
              <p>Posts you like will appear here</p>
            </div>
            <div v-else class="posts-grid">
              <PostCard
                v-for="post in likedPosts"
                :key="post.id"
                :post="post"
              />
            </div>
          </div>
        </div>

        <!-- Modals -->
        <EditProfileModal v-if="showEditProfile" @close="showEditProfile = false" />
        <GeneralSettingsModal v-if="showGeneralSettings" @close="showGeneralSettings = false" />
        <AvatarUploadModal v-if="showAvatarUpload" @close="showAvatarUpload = false" />
      </div>
    </ClientOnly>

    <!-- Fallback for SSR -->
    <template #fallback>
      <div class="profile-loading">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

const route = useRoute()
const authStore = useAuthStore()

// State
const loading = ref(true)
const displayProfile = ref({})
const activeTab = ref('posts')
const showEditProfile = ref(false)
const showGeneralSettings = ref(false)
const showAvatarUpload = ref(false)
const showCreatePost = ref(false)
const isFollowing = ref(false)
const rankHidden = ref(false)
const verificationBadges = ref([])
const userPosts = ref([])
const mediaPosts = ref([])
const likedPosts = ref([])

// Computed
const isOwnProfile = computed(() => {
  return !route.params.username || route.params.username === authStore.user?.username
})

// Tabs
const tabs = [
  { id: 'posts', label: 'Posts', icon: 'grid' },
  { id: 'media', label: 'Media', icon: 'image' },
  { id: 'likes', label: 'Likes', icon: 'heart' }
]

// Methods
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const handleAvatarError = (e) => {
  e.target.src = '/default-avatar.svg'
}

const getBadgeIcon = (type) => {
  const icons = {
    verified: 'check-circle',
    premium: 'star',
    developer: 'code'
  }
  return icons[type] || 'check'
}

const toggleFollow = async () => {
  // Implement follow/unfollow logic
  isFollowing.value = !isFollowing.value
}

const openVerificationDetails = (badge) => {
  // Show badge details
}

const openMediaModal = (post) => {
  // Open media modal
}

// Lifecycle
onMounted(async () => {
  try {
    // Load profile data
    if (isOwnProfile.value) {
      displayProfile.value = {
        avatar_url: authStore.user?.avatar_url,
        display_name: authStore.user?.full_name,
        username: authStore.user?.username,
        bio: authStore.user?.bio,
        posts_count: 0,
        followers_count: 0,
        following_count: 0,
        created_at: authStore.user?.created_at
      }
    }
    loading.value = false
  } catch (error) {
    console.error('Error loading profile:', error)
    loading.value = false
  }
})
</script>

<style scoped>
/* Keep your existing styles */
.profile-page {
  min-height: 100vh;
  background: #fa;
}

.profile-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: #cbd5e1;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Add all your other existing styles here */
</style>
