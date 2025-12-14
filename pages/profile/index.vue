<!-- FIXED: /pages/profile/index.vue - With Auth Store Fallback -->
<template>
  <div class="profile-page">
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
            <img 
              v-if="displayProfile.avatar_url" 
              :src="displayProfile.avatar_url" 
              :alt="`${displayProfile.display_name || 'User'} profile picture`"
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
                  <span v-if="badge.badge_level > 1" class="badge-level">{{ badge.badge_level }}</span>
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
              class="btn btn-secondary"
            >
              <Icon name="settings" size="16" />
              Settings
            </button>
            <button 
              v-if="isOwnProfile" 
              @click="handleLogout" 
              class="btn btn-danger"
            >
              <Icon name="log-out" size="16" />
              Logout
            </button>
            <!-- Actions for other users -->
            <button 
              v-if="!isOwnProfile" 
              @click="toggleFollow" 
              class="btn"
              :class="isFollowing ? 'btn-secondary' : 'btn-primary'"
            >
              {{ isFollowing ? 'Unfollow' : 'Follow' }}
            </button>
            <button 
              v-if="!isOwnProfile" 
              @click="openChat" 
              class="btn btn-secondary"
            >
              <Icon name="message-circle" size="16" />
              Message
            </button>
          </div>
        </div>
      </div>

      <!-- Bio Section -->
      <div v-if="shouldShowBio && !loading" class="profile-bio-section">
        <div class="bio-content">
          <p v-if="displayProfile.bio" class="bio-text">{{ displayProfile.bio }}</p>
          
          <div class="bio-details-grid">
            <div v-if="displayProfile.occupation" class="bio-item">
              <Icon name="briefcase" size="16" />
              <span class="bio-label">Occupation:</span>
              <span class="bio-value">{{ displayProfile.occupation }}</span>
            </div>
            
            <div v-if="displayProfile.highest_education" class="bio-item">
              <Icon name="graduation-cap" size="16" />
              <span class="bio-label">Education:</span>
              <span class="bio-value">{{ displayProfile.highest_education }}</span>
            </div>
            
            <div v-if="displayProfile.location" class="bio-item">
              <Icon name="map-pin" size="16" />
              <span class="bio-label">Location:</span>
              <span class="bio-value">{{ displayProfile.location }}</span>
            </div>
            
            <div v-if="displayProfile.website_url" class="bio-item">
              <Icon name="globe" size="16" />
              <span class="bio-label">Website:</span>
              <a :href="displayProfile.website_url" target="_blank" class="bio-link">{{ displayProfile.website_url }}</a>
            </div>
          </div>

          <!-- Skills Section -->
          <div v-if="displayProfile.skills && displayProfile.skills.length > 0" class="skills-section">
            <h3 class="section-title">Skills</h3>
            <div class="skills-list">
              <span v-for="skill in displayProfile.skills" :key="skill" class="skill-tag">
                {{ skill }}
              </span>
            </div>
          </div>

          <!-- Social Links -->
          <div v-if="socialLinks.length > 0" class="social-links-section">
            <h3 class="section-title">Social Links</h3>
            <div class="social-links">
              <a 
                v-for="link in socialLinks" 
                :key="link.platform"
                :href="link.url" 
                target="_blank" 
                rel="noopener noreferrer"
                class="social-link"
                :title="link.platform"
              >
                <Icon :name="getSocialIcon(link.platform)" size="20" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Tabs -->
      <div v-if="!loading" class="profile-tabs">
        <button 
          v-for="tab in availableTabs" 
          :key="tab"
          @click="activeTab = tab"
          class="tab-button"
          :class="{ active: activeTab === tab }"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>

      <!-- Tab Content -->
      <div v-if="!loading" class="tab-content">
        <!-- Posts Tab -->
        <div v-if="activeTab === 'posts'" class="posts-tab">
          <div v-if="userPosts.length === 0" class="empty-state">
            <Icon name="file-text" size="48" />
            <h3>No posts yet</h3>
            <p v-if="isOwnProfile">Share your first post with the community!</p>
            <p v-else>This user hasn't posted anything yet.</p>
          </div>
          <div v-else class="posts-grid">
            <PostCard
              v-for="post in userPosts"
              :key="post.id"
              :post="post"
              @like="handleLike"
              @comment="handleComment"
              @share="handleShare"
            />
          </div>
          
          <!-- Load More Posts -->
          <div v-if="hasMorePosts" class="load-more-section">
            <button 
              @click="loadMorePosts" 
              :disabled="loadingPosts"
              class="btn btn-secondary"
            >
              <Icon v-if="loadingPosts" name="loader" size="16" class="spinning" />
              {{ loadingPosts ? 'Loading...' : 'Load More Posts' }}
            </button>
          </div>
        </div>

        <!-- Media Tab -->
        <div v-if="activeTab === 'media'" class="media-tab">
          <div v-if="mediaPosts.length === 0" class="empty-state">
            <Icon name="image" size="48" />
            <h3>No media posts</h3>
            <p>Photos and videos will appear here</p>
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
              @like="handleLike"
              @comment="handleComment"
              @share="handleShare"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreatePostModal 
      v-if="showCreatePost" 
      @close="showCreatePost = false"
      @posted="handlePostCreated"
    />
    
    <EditProfileModal 
      v-if="showEditProfile" 
      :profile="displayProfile"
      @close="showEditProfile = false"
      @updated="handleProfileUpdated"
    />
    
    <GeneralSettingsModal 
      v-if="showGeneralSettings" 
      @close="showGeneralSettings = false"
    />
    
    <VerificationDetailsModal 
      v-if="showVerificationDetails" 
      :badge="selectedBadge"
      @close="showVerificationDetails = false"
    />
    
    <AvatarUploadModal 
      v-if="showAvatarUpload" 
      @close="showAvatarUpload = false"
      @uploaded="handleAvatarUploaded"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check', 'security-middleware'],
  layout: 'default'
})
 
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

// Stores and routing
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Reactive data
const profileData = ref<any>({})
const privacySettings = ref<any>({})
const socialLinks = ref<any[]>([])
const verificationBadges = ref<any[]>([])
const userPosts = ref<any[]>([])
const mediaPosts = ref<any[]>([])
const likedPosts = ref<any[]>([])

// UI state
const activeTab = ref('posts')
const showCreatePost = ref(false)
const showEditProfile = ref(false)
const showGeneralSettings = ref(false)
const showVerificationDetails = ref(false)
const showAvatarUpload = ref(false)
const selectedBadge = ref<any>(null)

// Loading states
const loading = ref(true)
const loadingPosts = ref(false)
const hasMorePosts = ref(true)
const currentPage = ref(1)

// Follow state
const isFollowing = ref(false)

// Computed properties
const isOwnProfile = computed(() => {
  return authStore.user?.id === profileData.value.id
})

// FIXED: Fallback to auth store data if API data is missing
const displayProfile = computed(() => {
  return {
    id: profileData.value.id || authStore.user?.id,
    display_name: profileData.value.display_name || authStore.userDisplayName || 'User',
    username: profileData.value.username || authStore.user?.user_metadata?.username || 'unknown',
    avatar_url: profileData.value.avatar_url || authStore.userAvatar || '/default-avatar.png',
    bio: profileData.value.bio || '',
    occupation: profileData.value.occupation || '',
    highest_education: profileData.value.highest_education || '',
    location: profileData.value.location || '',
    website_url: profileData.value.website_url || '',
    skills: profileData.value.skills || [],
    posts_count: profileData.value.posts_count || 0,
    followers_count: profileData.value.followers_count || 0,
    following_count: profileData.value.following_count || 0,
    rank: profileData.value.rank || '',
    rank_points: profileData.value.rank_points || 0
  }
})

const shouldShowBio = computed(() => {
  return displayProfile.value.bio || 
         displayProfile.value.occupation || 
         displayProfile.value.highest_education ||
         displayProfile.value.location ||
         displayProfile.value.website_url ||
         (displayProfile.value.skills && displayProfile.value.skills.length > 0) ||
         (socialLinks.value && socialLinks.value.length > 0)
})

const availableTabs = computed(() => {
  const tabs = ['posts', 'media']
  if (isOwnProfile.value) {
    tabs.push('likes')
  }
  return tabs
})

const rankHidden = computed(() => {
  return privacySettings.value?.hide_rank || false
})

// Methods
const loadProfile = async () => {
  try {
    loading.value = true
    const userId = route.params.id || authStore.user?.id
    
    // If loading own profile, use auth store data as primary source
    if (isOwnProfile.value && authStore.user) {
      profileData.value = {
        id: authStore.user.id,
        display_name: authStore.userDisplayName,
        username: authStore.user.user_metadata?.username || 'unknown',
        avatar_url: authStore.userAvatar,
        ...profileData.value
      }
    }
    
    // Fetch profile data via API
    try {
      const response = await $fetch(`/api/profile/${userId}`)
      profileData.value = response.profile || response
      privacySettings.value = response.privacy_settings || {}
      socialLinks.value = response.social_links || []
      verificationBadges.value = response.verification_badges || []
    } catch (apiError) {
      console.warn('API profile fetch failed, using auth store data:', apiError)
      // API failed, but we already have fallback data from auth store
    }
    
    // Load initial posts
    await loadUserPosts()
    
    // Check follow status if not own profile
    if (!isOwnProfile.value) {
      try {
        const followStatus = await $fetch(`/api/follows/status/${userId}`)
        isFollowing.value = followStatus.is_following
      } catch (error) {
        console.error('Error checking follow status:', error)
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error)
  } finally {
    loading.value = false
  }
}

const loadUserPosts = async () => {
  try {
    loadingPosts.value = true
    const userId = route.params.id || authStore.user?.id
    
    // Fetch posts via API endpoint
    const response = await $fetch(`/api/posts/user/${userId}`, {
      query: {
        page: currentPage.value,
        limit: 12
      }
    })
    
    if (currentPage.value === 1) {
      userPosts.value = response.posts || []
    } else {
      userPosts.value.push(...(response.posts || []))
    }
    
    mediaPosts.value = (response.posts || []).filter((p: any) => p.media_url)
    hasMorePosts.value = response.has_more || false
  } catch (error) {
    console.error('Error loading posts:', error)
    userPosts.value = []
    mediaPosts.value = []
  } finally {
    loadingPosts.value = false
  }
}

const loadMorePosts = async () => {
  currentPage.value++
  await loadUserPosts()
}

const handlePostCreated = (newPost: any) => {
  userPosts.value.unshift(newPost)
  profileData.value.posts_count = (profileData.value.posts_count || 0) + 1
  showCreatePost.value = false
}

const handleProfileUpdated = (updatedProfile: any) => {
  profileData.value = { ...profileData.value, ...updatedProfile }
  showEditProfile.value = false
}

const handleAvatarUploaded = (newAvatarUrl: string) => {
  profileData.value.avatar_url = newAvatarUrl
  authStore.setUser({
    ...authStore.user,
    user_metadata: {
      ...authStore.user?.user_metadata,
      avatar_url: newAvatarUrl
    }
  })
  showAvatarUpload.value = false
}

const handleLike = (postId: string) => {
  const post = userPosts.value.find(p => p.id === postId)
  if (post) {
    post.liked = !post.liked
    post.likes += post.liked ? 1 : -1
  }
}

const handleComment = (postId: string) => {
  console.log('Comment on post:', postId)
}

const handleShare = (postId: string) => {
  console.log('Share post:', postId)
}

const toggleFollow = async () => {
  try {
    const userId = route.params.id
    const endpoint = isFollowing.value ? 'unfollow' : 'follow'
    await $fetch(`/api/follows/${endpoint}/${userId}`, { method: 'POST' })
    isFollowing.value = !isFollowing.value
  } catch (error) {
    console.error('Error toggling follow:', error)
  }
}

const openChat = () => {
  router.push(`/chat/${route.params.id}`)
}

const handleLogout = async () => {
  authStore.clearAuth()
  router.push('/auth/signin')
}

const openVerificationDetails = (badge: any) => {
  selectedBadge.value = badge
  showVerificationDetails.value = true
}

const openMediaModal = (post: any) => {
  console.log('Open media modal:', post)
}

const getBadgeIcon = (badgeType: string): string => {
  const iconMap: Record<string, string> = {
    'verified': 'check-circle',
    'premium': 'star',
    'moderator': 'shield',
    'creator': 'award'
  }
  return iconMap[badgeType] || 'badge'
}

const getSocialIcon = (platform: string): string => {
  const iconMap: Record<string, string> = {
    'twitter': 'twitter',
    'instagram': 'instagram',
    'facebook': 'facebook',
    'linkedin': 'linkedin',
    'github': 'github',
    'youtube': 'youtube'
  }
  return iconMap[platform.toLowerCase()] || 'link'
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// Lifecycle
onMounted(() => {
  console.log('Profile page mounted')
  console.log('Auth user:', authStore.user)
  console.log('Display name:', authStore.userDisplayName)
  loadProfile()
})

// Watch for route changes
watch(() => route.params.id, () => {
  currentPage.value = 1
  loadProfile()
})
</script>

<style scoped>
.profile-page {
  background: #0f172a;
  min-height: 100vh;
  padding-bottom: 2rem;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #94a3b8;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.profile-header {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.profile-picture-section {
  display: flex;
  justify-content: center;
}

.profile-picture-container {
  position: relative;
  width: 160px;
  height: 160px;
}

.profile-picture {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #334155;
}

.profile-picture-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #0f172a;
  border: 4px solid #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #3b82f6;
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.edit-avatar-btn:hover {
  background: #2563eb;
}

.profile-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.profile-name-section {
  margin-bottom: 1rem;
}

.profile-name {
  margin: 0 0 0.5rem;
  color: white;
  font-size: 1.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.verification-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.verification-badge {
  background: none;
  border: none;
  color: #fbbf24;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.verification-badge:hover {
  background: #1e293b;
}

.badge-level {
  font-size: 0.75rem;
  font-weight: 600;
}

.profile-username {
  margin: 0;
  color: #64748b;
  font-size: 1rem;
}

.user-rank {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fbbf24;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.rank-points {
  color: #94a3b8;
  font-size: 0.85rem;
}

.profile-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  color: #94a3b8;
  font-size: 0.85rem;
}

.profile-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #334155;
  color: #e2e8f0;
}

.btn-secondary:hover {
  background: #475569;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.profile-bio-section {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.bio-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.bio-text {
  margin: 0;
  color: #e2e8f0;
  line-height: 1.6;
}

.bio-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.bio-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #cbd5e1;
}

.bio-item svg {
  color: #3b82f6;
  flex-shrink: 0;
}

.bio-label {
  font-weight: 600;
  color: #e2e8f0;
}

.bio-value {
  color: #cbd5e1;
}

.bio-link {
  color: #3b82f6;
  text-decoration: none;
  transition: all 0.2s;
}

.bio-link:hover {
  text-decoration: underline;
}

.skills-section,
.social-links-section {
  margin-top: 1rem;
}

.section-title {
  margin: 0 0 1rem;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.skill-tag {
  background: #334155;
  color: #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  color: #3b82f6;
  transition: all 0.2s;
}

.social-link:hover {
  color: #60a5fa;
}

.profile-tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid #334155;
  margin-bottom: 2rem;
  overflow-x: auto;
}

.tab-button {
  background: none;
  border: none;
  color: #94a3b8;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-button:hover {
  color: #e2e8f0;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.posts-tab,
.media-tab,
.likes-tab {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  color: #94a3b8;
}

.empty-state svg {
  color: #64748b;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem;
  color: #e2e8f0;
  font-size: 1.25rem;
}

.empty-state p {
  margin: 0;
  color: #64748b;
}

.posts-grid,
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.media-item {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
}

.media-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
}

.media-item:hover .media-overlay {
  opacity: 1;
}

.load-more-section {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@media (max-width: 768px) {
  .profile-header {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .profile-picture-container {
    width: 120px;
    height: 120px;
    margin: 0 auto;
  }

  .profile-name {
    font-size: 1.5rem;
    justify-content: center;
  }

  .profile-stats {
    justify-content: center;
  }

  .profile-actions {
    justify-content: center;
  }

  .posts-grid,
  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
