<!-- pages/profile/index.vue - Enhanced Profile Page -->
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
              <!-- Enhanced Verification Badges -->
              <div v-if="verificationBadges.length > 0" class="verification-badges">
                <button
                  v-for="badge in verificationBadges"
                  :key="badge.badge_type"
                  @click="openVerificationDetails(badge)"
                  class="verification-badge"
                  :class="`badge-${badge.badge_type}`"
                  :title="`${badge.badge_type.replace('_', ' ').toUpperCase()} - Click for details`"
                >
                  <Icon :name="getBadgeIcon(badge.badge_type)" size="16" />
                  <span v-if="badge.badge_level > 1" class="badge-level">{{ badge.badge_level }}</span>
                </button>
              </div>
            </h1>
            <p class="profile-username">@{{ profileData.username || 'unknown' }}</p>
            <!-- User Rank -->
            <div v-if="profileData.rank && !rankHidden" class="user-rank">
              <Icon name="star" size="14" />
              <span>{{ profileData.rank }}</span>
              <span class="rank-points">({{ formatNumber(profileData.rank_points || 0) }} pts)</span>
            </div>
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
              @click="showCreatePost = true" 
              class="btn btn-primary create-post-btn"
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
              General Settings
            </button>
            <button 
              v-if="isOwnProfile" 
              @click="handleLogout" 
              class="btn btn-danger logout-btn"
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

      <!-- Enhanced Bio Section -->
      <div v-if="shouldShowBio" class="profile-bio-section">
        <div class="bio-content">
          <p v-if="profileData.bio" class="bio-text">{{ profileData.bio }}</p>
          
          <!-- Bio Details Grid -->
          <div class="bio-details-grid">
            <div v-if="profileData.occupation" class="bio-item">
              <Icon name="briefcase" size="16" />
              <span class="bio-label">Occupation:</span>
              <span class="bio-value">{{ profileData.occupation }}</span>
            </div>
            
            <div v-if="profileData.highest_education" class="bio-item">
              <Icon name="graduation-cap" size="16" />
              <span class="bio-label">Education:</span>
              <span class="bio-value">{{ profileData.highest_education }}</span>
            </div>
            
            <div v-if="profileData.school" class="bio-item">
              <Icon name="school" size="16" />
              <span class="bio-label">School:</span>
              <span class="bio-value">{{ profileData.school }}</span>
            </div>
            
            <div v-if="profileData.phone_number" class="bio-item">
              <Icon name="phone" size="16" />
              <span class="bio-label">Phone:</span>
              <span class="bio-value">{{ profileData.phone_number }}</span>
            </div>
            
            <div v-if="profileData.email" class="bio-item">
              <Icon name="mail" size="16" />
              <span class="bio-label">Email:</span>
              <span class="bio-value">{{ profileData.email }}</span>
            </div>
            
            <div v-if="profileData.location" class="bio-item">
              <Icon name="map-pin" size="16" />
              <span class="bio-label">Location:</span>
              <span class="bio-value">{{ profileData.location }}</span>
            </div>
            
            <div v-if="profileData.website_url" class="bio-item">
              <Icon name="globe" size="16" />
              <span class="bio-label">Website:</span>
              <a :href="profileData.website_url" target="_blank" class="bio-link">
                {{ profileData.website_url }}
              </a>
            </div>
          </div>

          <!-- Skills -->
          <div v-if="profileData.skills && profileData.skills.length > 0" class="bio-section">
            <h4 class="bio-section-title">
              <Icon name="code" size="16" />
              Skills
            </h4>
            <div class="skills-tags">
              <span 
                v-for="skill in profileData.skills" 
                :key="skill" 
                class="skill-tag"
              >
                {{ skill }}
              </span>
            </div>
          </div>

          <!-- Interests -->
          <div v-if="profileData.interests && profileData.interests.length > 0" class="bio-section">
            <h4 class="bio-section-title">
              <Icon name="heart" size="16" />
              Interests
            </h4>
            <div class="interests-tags">
              <span 
                v-for="interest in profileData.interests" 
                :key="interest" 
                class="interest-tag"
              >
                {{ interest }}
              </span>
            </div>
          </div>

          <!-- Social Links -->
          <div v-if="socialLinks.length > 0" class="bio-section">
            <h4 class="bio-section-title">
              <Icon name="link" size="16" />
              Social Links
            </h4>
            <div class="social-links">
              <a
                v-for="link in socialLinks"
                :key="link.platform"
                :href="link.url"
                target="_blank"
                class="social-link"
                :title="link.platform"
              >
                <Icon :name="getSocialIcon(link.platform)" size="20" />
                <span>{{ link.username || link.platform }}</span>
              </a>
            </div>
          </div>

          <!-- KYC Status -->
          <div v-if="kycStatus" class="bio-section">
            <h4 class="bio-section-title">
              <Icon name="shield-check" size="16" />
              KYC Status
            </h4>
            <div class="kyc-status">
              <span class="kyc-level" :class="`kyc-${kycStatus.level}`">
                {{ kycStatus.level.toUpperCase() }} Level
              </span>
              <button 
                v-if="isOwnProfile" 
                @click="showVerificationApplication = true"
                class="btn btn-sm btn-outline"
              >
                Upgrade Verification
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Tabs -->
      <div class="profile-tabs">
        <div class="tab-buttons">
          <button 
            v-for="tab in availableTabs" 
            :key="tab.key"
            @click="activeTab = tab.key"
            class="tab-button"
            :class="{ active: activeTab === tab.key }"
          >
            <Icon :name="tab.icon" size="16" />
            {{ tab.label }}
            <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
          </button>
        </div>

        <!-- Posts Tab -->
        <div v-if="activeTab === 'posts'" class="posts-tab">
          <div v-if="userPosts.length === 0" class="empty-state">
            <Icon name="file-text" size="48" />
            <h3>No posts yet</h3>
            <p v-if="isOwnProfile">Share your first post with the community!</p>
            <p v-else>This user hasn't posted anything yet.</p>
            <button 
              v-if="isOwnProfile" 
              @click="showCreatePost = true" 
              class="btn btn-primary"
            >
              Create Your First Post
            </button>
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
      :profile="profileData"
      @close="showEditProfile = false"
      @updated="handleProfileUpdated"
    />
    
    <GeneralSettingsModal 
      v-if="showGeneralSettings" 
      @close="showGeneralSettings = false"
    />
    
    <VerificationApplicationModal 
      v-if="showVerificationApplication" 
      @close="showVerificationApplication = false"
      @submitted="handleVerificationSubmitted"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { Profile } from '~/models/Profile'
import { ProfilePrivacy } from '~/models/ProfilePrivacy'
import { SocialLinks } from '~/models/SocialLinks'
import { Verification } from '~/models/Verification'
import { UserSession } from '~/models/UserSession'
import { Post } from '~/Post'

// Stores and routing
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Reactive data
const profileData = ref({})
const privacySettings = ref({})
const socialLinks = ref([])
const verificationBadges = ref([])
const kycStatus = ref(null)
const userPosts = ref([])
const mediaPosts = ref([])
const likedPosts = ref([])

// UI state
const activeTab = ref('posts')
const showCreatePost = ref(false)
const showEditProfile = ref(false)
const showGeneralSettings = ref(false)
const showVerificationApplication = ref(false)
const showVerificationDetails = ref(false)
const showAvatarUpload = ref(false)
const selectedBadge = ref(null)

// Loading states
const loading = ref(true)
const loadingPosts = ref(false)
const hasMorePosts = ref(true)
const currentPage = ref(1)

// Follow state (for other users)
const isFollowing = ref(false)

// Computed properties
const isOwnProfile = computed(() => {
  return authStore.user?.id === profileData.value.id
})

const shouldShowBio = computed(() => {
  return profileData.value.bio || 
         profileData.value.occupation || 
         profileData.value.highest_education ||
         profileData.value.school ||
         profileData.value.phone_number ||
         profileData.value.email ||
         profileData.value.location ||
         profileData.value.website_url ||
         (profileData.value.skills && profileData.value.skills.length > 0) ||
         (profileData.value.interests && profileData.value.interests.length > 0) ||
         socialLinks.value.length > 0
})

const rankHidden = computed(() => {
  return privacySettings.value.rank_hidden && !isOwnProfile.value
})

const availableTabs = computed(() => {
  const tabs = [
    { key: 'posts', label: 'Posts', icon: 'file-text', count: profileData.value.posts_count || 0 },
    { key: 'media', label: 'Media', icon: 'image', count: mediaPosts.value.length }
  ]
  
  if (isOwnProfile.value) {
    tabs.push({ key: 'likes', label: 'Likes', icon: 'heart', count: likedPosts.value.length })
  }
  
  return tabs
})

// Methods
const loadProfile = async () => {
  try {
    loading.value = true
    const userId = route.params.id || authStore.user?.id
    
    if (!userId) {
      router.push('/auth/login')
      return
    }

    // Load profile data
    profileData.value = await Profile.getProfile(userId, authStore.user?.id)
    
    // Load privacy settings (only for own profile)
    if (isOwnProfile.value) {
      privacySettings.value = await ProfilePrivacy.getPrivacySettings(userId)
    }
    
    // Load social links
    socialLinks.value = await SocialLinks.getUserSocialLinks(userId, isOwnProfile.value)
    
    // Load verification status
    const verificationStatus = await Verification.getVerificationStatus(userId)
    verificationBadges.value = verificationStatus.badges
    
    // Determine KYC status
    if (verificationBadges.value.length > 0) {
      const highestBadge = verificationBadges.value.reduce((highest, badge) => {
        const levels = { 'basic': 1, 'k2_level_1': 2, 'k2_level_2': 3, 'business': 2, 'celebrity': 3 }
        return levels[badge.badge_type] > levels[highest.badge_type] ? badge : highest
      })
      kycStatus.value = {
        level: highestBadge.badge_type,
        verified: true
      }
    }
    
    // Load posts
    await loadUserPosts()
    
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
    const posts = await Profile.getUserPosts(userId, currentPage.value, 10)
    
    if (currentPage.value === 1) {
      userPosts.value = posts
    } else {
      userPosts.value.push(...posts)
    }
    
    hasMorePosts.value = posts.length === 10
    
    // Filter media posts
    mediaPosts.value = userPosts.value.filter(post => 
      post.media_url && (post.media_type === 'image' || post.media_type === 'video')
    )
    
  } catch (error) {
    console.error('Error loading posts:', error)
  } finally {
    loadingPosts.value = false
  }
}

const loadMorePosts = async () => {
  currentPage.value++
  await loadUserPosts()
}

const handlePostCreated = (newPost) => {
  userPosts.value.unshift(newPost)
  profileData.value.posts_count = (profileData.value.posts_count || 0) + 1
  showCreatePost.value = false
}

const handleProfileUpdated = (updatedProfile) => {
  profileData.value = { ...profileData.value, ...updatedProfile }
  showEditProfile.value = false
}

const handleVerificationSubmitted = () => {
  showVerificationApplication.value = false
  // Reload verification status
  loadProfile()
}

const handleAvatarUploaded = (avatarUrl) => {
  profileData.value.avatar_url = avatarUrl
  showAvatarUpload.value = false
}

// FIXED: Renamed function to avoid naming conflict with ref
const openVerificationDetails = (badge) => {
  selectedBadge.value = badge
  showVerificationDetails.value = true
}

const handleLogout = async () => {
  try {
    // Logout all sessions
    await UserSession.logoutAllSessions(authStore.user.id)
    
    // Clear auth store
    await authStore.logout()
    
    // Redirect to login
    router.push('/auth/login')
  } catch (error) {
    console.error('Error logging out:', error)
  }
}

const toggleFollow = async () => {
  try {
    if (isFollowing.value) {
      // Unfollow logic
      isFollowing.value = false
      profileData.value.followers_count--
    } else {
      // Follow logic
      isFollowing.value = true
      profileData.value.followers_count++
    }
  } catch (error) {
    console.error('Error toggling follow:', error)
  }
}

const openChat = () => {
  router.push(`/chat?user=${profileData.value.id}`)
}

const handleLike = (postId) => {
  // Implement like logic
}

const handleComment = (postId) => {
  // Implement comment logic
}

const handleShare = (postId) => {
  // Implement share logic
}

const openMediaModal = (post) => {
  // Implement media modal logic
}

// Utility functions
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const getBadgeIcon = (badgeType) => {
  const icons = {
    'verified': 'check-circle',
    'k2_level_1': 'shield',
    'k2_level_2': 'shield-check',
    'business': 'briefcase',
    'celebrity': 'star'
  }
  return icons[badgeType] || 'check-circle'
}

const getSocialIcon = (platform) => {
  const icons = {
    'twitter': 'twitter',
    'instagram': 'instagram',
    'linkedin': 'linkedin',
    'facebook': 'facebook',
    'github': 'github',
    'youtube': 'youtube',
    'tiktok': 'music',
    'discord': 'message-square',
    'telegram': 'send',
    'website': 'globe'
  }
  return icons[platform] || 'link'
}

// Lifecycle
onMounted(() => {
  loadProfile()
})

// Watch for route changes
watch(() => route.params.id, () => {
  if (route.name === 'profile') {
    currentPage.value = 1
    loadProfile()
  }
})
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.profile-header {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.profile-picture-section {
  flex-shrink: 0;
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
  border: 4px solid white;
}

.profile-picture-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid white;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #667eea;
  border: 2px solid white;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.edit-avatar-btn:hover {
  background: #764ba2;
}

.profile-info {
  flex: 1;
}

.profile-name-section {
  margin-bottom: 1rem;
}

.profile-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.verification-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.verification-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.verification-badge:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
}

.badge-level {
  font-weight: 700;
  font-size: 0.75rem;
}

.profile-username {
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
}

.user-rank {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  opacity: 0.9;
}

.rank-points {
  opacity: 0.7;
}

.profile-stats {
  display: flex;
  gap: 2rem;
  margin: 1.5rem 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.profile-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-outline {
  background: transparent;
  border: 1px solid white;
  color: white;
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.profile-bio-section {
  padding: 2rem;
  border-top: 1px solid #e5e7eb;
}

.bio-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.bio-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
  margin: 0;
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
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
}

.bio-label {
  font-weight: 600;
  color: #666;
  min-width: 80px;
}

.bio-value {
  color: #333;
}

.bio-link {
  color: #667eea;
  text-decoration: none;
}

.bio-link:hover {
  text-decoration: underline;
}

.bio-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bio-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.skills-tags,
.interests-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-tag,
.interest-tag {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #e0e7ff;
  color: #667eea;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.interest-tag {
  background: #fce7f3;
  color: #ec4899;
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.social-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border-radius: 6px;
  color: #333;
  text-decoration: none;
  transition: all 0.2s;
}

.social-link:hover {
  background: #e5e7eb;
  color: #667eea;
}

.kyc-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.kyc-level {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
}

.kyc-basic {
  background: #dbeafe;
  color: #1e40af;
}

.kyc-k2_level_1 {
  background: #dcfce7;
  color: #166534;
}

.kyc-k2_level_2 {
  background: #fef3c7;
  color: #92400e;
}

.profile-tabs {
  border-top: 1px solid #e5e7eb;
}

.tab-buttons {
  display: flex;
  gap: 0;
  padding: 0 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-button {
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-button.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-button:hover {
  color: #333;
}

.tab-count {
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.posts-tab,
.media-tab,
.likes-tab {
  padding: 2rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: #999;
}

.empty-state h3 {
  font-size: 1.25rem;
  margin: 1rem 0 0.5rem 0;
  color: #666;
}

.empty-state p {
  margin: 0 0 1rem 0;
  color: #999;
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
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  aspect-ratio: 1;
}

.media-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.media-item:hover .media-thumbnail {
  transform: scale(1.05);
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
  padding: 2rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-picture-container {
    width: 120px;
    height: 120px;
  }

  .profile-name {
    font-size: 1.5rem;
  }

  .profile-stats {
    justify-content: center;
  }

  .profile-actions {
    justify-content: center;
  }

  .bio-details-grid {
    grid-template-columns: 1fr;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }

  .tab-buttons {
    overflow-x: auto;
    padding: 0 1rem;
  }

  .tab-button {
    padding: 1rem;
    white-space: nowrap;
  }
}
</style>
