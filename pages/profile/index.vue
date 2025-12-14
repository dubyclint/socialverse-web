<!-- FILE: /pages/profile/index.vue (FIXED - COMPLETE VERSION) -->
<!-- ============================================================================ -->
<!-- PROFILE PAGE - FIXED: Proper user ID extraction and auth store fallback -->
<!-- ============================================================================ -->
<!-- ✅ CRITICAL FIX: Now properly uses auth store user ID -->
<!-- ✅ Fallback to auth store data if API fails -->
<!-- ✅ Proper error handling with detailed logging -->
<!-- ✅ Avatar fallback to default SVG -->
<!-- ============================================================================ -->

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
            <!-- ✅ CRITICAL FIX: Proper avatar with fallback -->
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
const api = useApi()

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
  // ✅ CRITICAL FIX: Properly compare user IDs
  const profileId = route.params.id || authStore.user?.id
  const currentUserId = authStore.user?.id
  
  console.log('[Profile] Comparing IDs - Profile:', profileId, 'Current:', currentUserId)
  return profileId === currentUserId
})

// ✅ CRITICAL FIX: Fallback to auth store data if API data is missing
const displayProfile = computed(() => {
  const profile = {
    id: profileData.value.id || authStore.user?.id,
    display_name: profileData.value.display_name || authStore.userDisplayName || 'User',
    username: profileData.value.username || authStore.user?.user_metadata?.username || 'unknown',
    avatar_url: profileData.value.avatar_url || authStore.userAvatar || '/default-avatar.svg',
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
  
  console.log('[Profile] Display profile:', profile)
  return profile
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

// ============================================================================
// METHODS
// ============================================================================

/**
 * ✅ CRITICAL FIX: Load profile with proper user ID extraction
 */
const loadProfile = async () => {
  try {
    loading.value = true
    
    // ✅ Get user ID from route or auth store
    const userId = route.params.id || authStore.user?.id
    
    console.log('[Profile] Loading profile for user:', userId)
    
    if (!userId) {
      console.error('[Profile] ❌ No user ID available')
      loading.value = false
      return
    }

    // ✅ If loading own profile, use auth store data as primary source
    if (isOwnProfile.value && authStore.user) {
      console.log('[Profile] ✅ Loading own profile from auth store')
      profileData.value = {
        id: authStore.user.id,
        display_name: authStore.userDisplayName,
        username: authStore.user.user_metadata?.username || 'unknown',
        avatar_url: authStore.userAvatar,
        ...profileData.value
      }
    }
    
    // ✅ Fetch profile data via API with proper user ID
    try {
      console.log('[Profile] Fetching profile from API...')
      const response = await api.profile.getProfile(userId)
      
      if (response?.profile) {
        profileData.value = response.profile
        console.log('[Profile] ✅ Profile fetched successfully')
      } else if (response) {
        profileData.value = response
      }
      
      privacySettings.value = response?.privacy_settings || {}
      socialLinks.value = response?.social_links || []
      verificationBadges.value = response?.verification_badges || []
    } catch (apiError: any) {
      console.warn('[Profile] ⚠️ API profile fetch failed:', apiError.message)
      console.log('[Profile] Using auth store data as fallback')
      // API failed, but we already have fallback data from auth store
    }
    
    // ✅ Load initial posts with proper user ID
    await loadUserPosts(userId)
    
    // ✅ Check follow status if not own profile
    if (!isOwnProfile.value) {
      try {
        console.log('[Profile] Checking follow status...')
        const followStatus = await $fetch(`/api/follows/status/${userId}`)
        isFollowing.value = followStatus.is_following
      } catch (error) {
        console.error('[Profile] Error checking follow status:', error)
      }
    }
  } catch (error) {
    console.error('[Profile] ❌ Error loading profile:', error)
  } finally {
    loading.value = false
  }
}

/**
 * ✅ CRITICAL FIX: Load user posts with proper user ID
 */
const loadUserPosts = async (userId?: string) => {
  try {
    loadingPosts.value = true
    
    // ✅ Use provided userId or get from route/auth store
    const id = userId || route.params.id || authStore.user?.id
    
    if (!id) {
      console.error('[Profile] ❌ No user ID for loading posts')
      return
    }
    
    console.log('[Profile] Fetching posts for user:', id)
    
    // ✅ Fetch posts via API with proper user ID
    const response = await api.posts.getUserPosts(id, currentPage.value, 12)
    
    if (currentPage.value === 1) {
      userPosts.value = response.posts || []
    } else {
      userPosts.value.push(...(response.posts || []))
    }
    
    mediaPosts.value = (response.posts || []).filter((p: any) => p.media_url)
    hasMorePosts.value = response.has_more || false
    
    console.log('[Profile] ✅ Posts loaded:', userPosts.value.length, 'items')
  } catch (error) {
    console.error('[Profile] ❌ Error loading posts:', error)
    userPosts.value = []
    mediaPosts.value = []
  } finally {
    loadingPosts.value = false
  }
}

const loadMorePosts = async () => {
  currentPage.value++
  const userId = route.params.id || authStore.user?.id
  await loadUserPosts(userId)
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

/**
 * ✅ NEW: Handle avatar load error with fallback
 */
const handleAvatarError = () => {
  console.warn('[Profile] Avatar failed to load, using default')
  profileData.value.avatar_url = '/default-avatar.svg'
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

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  console.log('[Profile] Profile page mounted')
  console.log('[Profile] Auth user:', authStore.user)
  console.log('[Profile] Auth user ID:', authStore.userId)
  console.log('[Profile] Display name:', authStore.userDisplayName)
  loadProfile()
})

// Watch for route changes
watch(() => route.params.id, () => {
  console.log('[Profile] Route changed, reloading profile')
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
  width: 150px;
  height: 150px;
}

.profile-picture {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #3b82f6;
}

.profile-picture.default-avatar {
  background: #334155;
  padding: 1rem;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.edit-avatar-btn:hover {
  background: #2563eb;
}

.profile-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.profile-name-section h1 {
  margin: 0;
  color: #f1f5f9;
  font-size: 1.875rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-username {
  color: #94a3b8;
  margin: 0.5rem 0 0 0;
}

.user-rank {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fbbf24;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.rank-points {
  color: #94a3b8;
}

.profile-stats {
  display: flex;
  gap: 2rem;
  margin: 1rem 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-number {
  color: #f1f5f9;
  font-weight: bold;
  font-size: 1.25rem;
}

.stat-label {
  color: #94a3b8;
  font-size: 0.875rem;
}

.profile-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  color: #f1f5f9;
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

.bio-text {
  color: #e2e8f0;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.bio-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.bio-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #cbd5e1;
}

.bio-label {
  font-weight: 600;
  color: #94a3b8;
}

.bio-value {
  color: #e2e8f0;
}

.bio-link {
  color: #3b82f6;
  text-decoration: none;
}

.bio-link:hover {
  text-decoration: underline;
}

.skills-section {
  margin-bottom: 1.5rem;
}

.section-title {
  color: #f1f5f9;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-tag {
  background: #334155;
  color: #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
}

.social-links-section {
  margin-bottom: 1.5rem;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  color: #94a3b8;
  transition: color 0.2s;
}

.social-link:hover {
  color: #3b82f6;
}

.profile-tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid #334155;
  margin-bottom: 2rem;
}

.tab-button {
  padding: 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-button:hover {
  color: #cbd5e1;
}

.tab-content {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #94a3b8;
  text-align: center;
}

.empty-state h3 {
  color: #cbd5e1;
  margin: 1rem 0 0.5rem 0;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
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
  inset: 0;
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
  margin-top: 2rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

.verification-badges {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.verification-badge {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.verification-badge:hover {
  background: rgba(59, 130, 246, 0.1);
}

.badge-verified {
  color: #10b981;
}

.badge-premium {
  color: #fbbf24;
}

.badge-moderator {
  color: #8b5cf6;
}

.badge-creator {
  color: #f59e0b;
}

.badge-level {
  font-size: 0.75rem;
  font-weight: bold;
}
</style>
