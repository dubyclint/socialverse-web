<template>
  <div class="profile-page">
    <div class="profile-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>

      <template v-else>
        <div class="profile-header">
          <div class="profile-picture-section">
            <div class="profile-picture-container">
              <img
                v-if="displayProfile.avatar_url && displayProfile.avatar_url !== '/default-avatar.png'"
                :src="displayProfile.avatar_url"
                :alt="`${displayProfile.full_name || displayProfile.display_name || 'User'} profile picture`"
                class="profile-picture"
                @error="handleAvatarError"
              />
              <img
                v-else
                src="/default-avatar.svg"
                :alt="displayProfile.full_name || displayProfile.display_name || 'User'"
                class="profile-picture default-avatar"
              />
              <button v-if="isOwnProfile" @click="showAvatarUpload = true" class="edit-avatar-btn">
                <Icon name="camera" size="16" />
              </button>
            </div>
          </div>

          <div class="profile-info">
            <div class="profile-name-section">
              <h1 class="profile-name">
                {{ displayProfile.full_name || displayProfile.display_name || displayProfile.username || 'User' }}
                <div v-if="verificationBadges.length > 0" class="verification-badges">
                  <button
                    v-for="badge in verificationBadges"
                    :key="badge.badge_type"
                    @click="openVerificationDetails(badge)"
                    class="verification-badge"
                    :class="`badge-${badge.badge_type}`"
                  >
                    <Icon :name="getBadgeIcon(badge.badge_type)" size="16" />
                    <span v-if="badge.badge_level > 0" class="badge-level">{{ badge.badge_level }}</span>
                  </button>
                </div>
              </h1>
              <p class="profile-username">@{{ displayProfile.username || 'unknown' }}</p>
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
              <button v-if="isOwnProfile" @click="showCreatePost = true" class="btn btn-primary">
                <Icon name="plus" size="16" /> Create Post
              </button>
              <button v-if="isOwnProfile" @click="showEditProfile = true" class="btn btn-secondary">
                <Icon name="edit" size="16" /> Edit Profile
              </button>
              <button v-if="isOwnProfile" @click="showGeneralSettings = true" class="btn btn-tertiary">
                <Icon name="settings" size="16" /> Settings
              </button>
              <button v-else @click="toggleFollow" :class="['btn', isFollowing ? 'btn-secondary' : 'btn-primary']">
                <Icon :name="isFollowing ? 'user-minus' : 'user-plus'" size="16" />
                {{ isFollowing ? 'Unfollow' : 'Follow' }}
              </button>
            </div>

            <div v-if="displayProfile.bio" class="profile-bio">
              <p>{{ displayProfile.bio }}</p>
            </div>

            <div class="profile-details">
              <div v-if="displayProfile.location" class="detail-item">
                <Icon name="map-pin" size="14" /><span>{{ displayProfile.location }}</span>
              </div>
              <div v-if="displayProfile.website" class="detail-item">
                <Icon name="link" size="14" />
                <a :href="displayProfile.website" target="_blank" rel="noopener noreferrer">{{ displayProfile.website }}</a>
              </div>
              <div v-if="displayProfile.created_at" class="detail-item">
                <Icon name="calendar" size="14" />
                <span>Joined {{ formatDate(displayProfile.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

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

        <div class="tab-content">
          <div v-if="activeTab === 'posts'" class="posts-tab">
            <div v-if="userPosts.length === 0" class="empty-state">
              <Icon name="inbox" size="48" />
              <h3>No posts yet</h3>
              <p>{{ isOwnProfile ? 'Share your first post!' : 'This user has not posted yet' }}</p>
            </div>
            <div v-else class="posts-grid">
              <PostCard v-for="post in userPosts" :key="post.id" :post="post" />
            </div>
          </div>

          <div v-if="activeTab === 'media'" class="media-tab">
            <div v-if="mediaPosts.length === 0" class="empty-state">
              <Icon name="image" size="48" />
              <h3>No media</h3>
              <p>{{ isOwnProfile ? 'Share photos and videos!' : 'No media shared yet' }}</p>
            </div>
            <div v-else class="media-grid">
              <div v-for="post in mediaPosts" :key="post.id" class="media-item" @click="openMediaModal(post)">
                <img v-if="post.media_type === 'image'" :src="post.media_url" :alt="post.content" class="media-thumbnail" />
                <video v-else-if="post.media_type === 'video'" :src="post.media_url" class="media-thumbnail" muted />
                <div class="media-overlay"><Icon name="eye" size="20" /></div>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'likes' && isOwnProfile" class="likes-tab">
            <div v-if="likedPosts.length === 0" class="empty-state">
              <Icon name="heart" size="48" />
              <h3>No liked posts</h3>
              <p>Posts you like will appear here</p>
            </div>
            <div v-else class="posts-grid">
              <PostCard v-for="post in likedPosts" :key="post.id" :post="post" />
            </div>
          </div>
        </div>

        <LazyEditProfileModal v-if="showEditProfile" @close="showEditProfile = false" />
        <LazyGeneralSettingsModal v-if="showGeneralSettings" @close="showGeneralSettings = false" />
        <LazyAvatarUploadModal v-if="showAvatarUpload" @close="showAvatarUpload = false" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useProfile } from '~/composables/use-profile'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

const {
  loading,
  displayProfile,
  activeTab,
  isFollowing,
  verificationBadges,
  userPosts,
  mediaPosts,
  likedPosts,
  showEditProfile,
  showGeneralSettings,
  showAvatarUpload,
  isOwnProfile,
  tabs,
  formatNumber,
  formatDate,
  getBadgeIcon,
  toggleFollow,
  openVerificationDetails,
  openMediaModal,
  fetchProfileData
} = useProfile()

const handleAvatarError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.src = '/default-avatar.svg'
}

onMounted(() => {
  fetchProfileData()
})
</script>

<style scoped>
.profile-page { min-height: 100vh; background: #0f172a; }
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; color: #cbd5e1; }
.spinner { width: 40px; height: 40px; border: 3px solid #334155; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.profile-container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.profile-header { display: grid; grid-template-columns: auto 1fr; gap: 2rem; margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid #334155; }
.profile-picture-container { position: relative; width: 150px; height: 150px; }
.profile-picture { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid #3b82f6; }
.edit-avatar-btn { position: absolute; bottom: 0; right: 0; width: 40px; height: 40px; border-radius: 50%; background: #3b82f6; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.profile-info { display: flex; flex-direction: column; justify-content: space-between; }
.profile-name { font-size: 2rem; font-weight: bold; color: white; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 1rem; }
.profile-username { font-size: 1.125rem; color: #94a3b8; margin-bottom: 0.5rem; }
.profile-stats { display: flex; gap: 2rem; margin-bottom: 1.5rem; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-number { font-size: 1.5rem; font-weight: bold; color: white; }
.stat-label { font-size: 0.875rem; color: #94a3b8; }
.profile-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
.btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
.btn-primary { background: #3b82f6; color: white; }
.btn-secondary { background: #475569; color: white; }
.btn-tertiary { background: #1e293b; color: #e2e8f0; border: 1px solid #475569; }
.profile-bio { margin-top: 1rem; color: #e2e8f0; line-height: 1.6; }
.profile-details { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; color: #94a3b8; }
.detail-item { display: flex; align-items: center; gap: 0.5rem; }
.detail-item a { color: #3b82f6; text-decoration: none; }
.profile-tabs { display: flex; gap: 2rem; border-bottom: 1px solid #334155; margin-bottom: 2rem; }
.tab-button { padding: 1rem 0; background: none; border: none; color: #94a3b8; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; border-bottom: 2px solid transparent; }
.tab-button.active { color: #3b82f6; border-bottom-color: #3b82f6; }
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; color: #94a3b8; }
.empty-state h3 { font-size: 1.25rem; color: #e2e8f0; margin-top: 1rem; }
.posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.media-item { position: relative; overflow: hidden; border-radius: 8px; cursor: pointer; aspect-ratio: 1; }
.media-thumbnail { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.media-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: opacity 0.3s; }
.media-item:hover .media-overlay { opacity: 1; }
</style>
